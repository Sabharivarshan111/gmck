import datetime, hashlib, json, os, pathlib, re, shutil, signal, sqlite3, subprocess, time
ROOT=pathlib.Path.cwd()
OUT=ROOT/'evidence'
OUT.mkdir(exist_ok=True)
APP_ID='com.aistudio.mbbsqbank.aycxvd'
def run(*args, **kwargs):
    return subprocess.run(args,check=True,text=True,**kwargs)
app=next((ROOT/'package/unpacked').glob('*.app'))
binary=app/'OrbitMBBS'
symbols=run('xcrun','nm','-gU',str(binary),capture_output=True).stdout
classes=[s for s in symbols.splitlines() if '_OBJC_CLASS_' in s and 'Orbit' in s]
(OUT/'native-classes.txt').write_text('\n'.join(classes))
names=['OrbitSecureStorage','OrbitFiles','OrbitApkg','OrbitSound','OrbitSpeech','OrbitNotify','OrbitScreen','OrbitPgBank','OrbitRadiology','OrbitSimulator']
capabilities={name:any(re.search(r'\$_'+name+r'(?:Manager)?$',s) for s in classes) for name in names}
# Isolate this guest/offline verification from production authentication and data writes.
hosts=sorted(set(re.findall(rb'[a-z0-9-]+\.supabase\.co',(app/'main.jsbundle').read_bytes())))
if not hosts: raise RuntimeError('Cannot identify backend host for isolated offline test')
entries='\n# ORBIT isolated simulator QA\n'+''.join('127.0.0.1 '+h.decode()+'\n' for h in hosts)
subprocess.run(['sudo','tee','-a','/etc/hosts'],input=entries,text=True,stdout=subprocess.DEVNULL,check=True)
run('sudo','dscacheutil','-flushcache')
devices=json.loads(subprocess.check_output(['xcrun','simctl','list','devices','available','--json'],timeout=180))
sdk=subprocess.check_output(['xcrun','--sdk','iphonesimulator','--show-sdk-version'],text=True).strip()
candidates=[(runtime,d) for runtime,ds in devices['devices'].items() for d in ds if d.get('isAvailable') and d['name'].startswith('iPhone')]
preferred=[x for x in candidates if x[0].endswith('iOS-'+sdk.replace('.','-'))]
runtime,device=(preferred or sorted(candidates,key=lambda x:x[0],reverse=True))[0]
udid=device['udid']
if device['state']!='Booted':run('xcrun','simctl','boot',udid,timeout=180)
run('xcrun','simctl','bootstatus',udid,'-b',timeout=360)
run('xcrun','simctl','install',udid,str(app),timeout=120)
container=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',udid,APP_ID,'data'],text=True).strip())
os.environ['MAESTRO_DRIVER_STARTUP_TIMEOUT']='300000'
os.environ['MAESTRO_CLI_NO_ANALYTICS']='1'
maestro=shutil.which('maestro')
run(maestro,'--version')
helptext=run(maestro,'test','--help',capture_output=True).stdout
report={'source_sha':os.environ.get('ORBIT_IOS_SOURCE_SHA','0d48159af95ee31c89598a5debf344112aef07c3'),'build_run':int(os.environ.get('ORBIT_IOS_BUILD_RUN','41800009136')),
        'device':device['name'],'runtime':runtime,'offline_backend_isolated':True,'native_classes':capabilities,
        'cases':[],'not_verified':['real Google sign-in (disabled in tested build)','StoreKit/live purchases (not implemented)','local reminder delivery on a real iPhone','TestFlight signing and App Store review']}
def local_records(update_streak=False):
    container=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',udid,APP_ID,'data'],text=True).strip())
    records={}
    for file in container.rglob('*'):
        if not file.is_file() or file.name.endswith(('-wal','-shm')):continue
        if file.name=='manifest.json':
            try:
                manifest=json.loads(file.read_text())
                if not isinstance(manifest,dict):continue
                for key in ['orbit-profile-v1','orbit:streak-v1']:
                    if key not in manifest:continue
                    value=manifest[key]
                    if value is None:
                        large=file.parent/hashlib.md5(key.encode()).hexdigest()
                        value=large.read_text() if large.exists() else None
                    if isinstance(value,str):records[key]=json.loads(value)
                if update_streak and 'orbit-profile-v1' in manifest:
                    state=dict(records.get('orbit:streak-v1',{}))
                    state.update(current=29,best=max(29,state.get('best',0)),lastActiveDay=datetime.datetime.now().strftime('%Y-%m-%d'))
                    manifest['orbit:streak-v1']=json.dumps(state)
                    temporary=file.with_suffix('.qa-temp')
                    temporary.write_text(json.dumps(manifest));temporary.replace(file)
                    records['orbit:streak-v1']=state
            except (OSError,ValueError,TypeError):pass
            continue
        try:
            with file.open('rb') as stream:
                if stream.read(16)!=b'SQLite format 3\x00':continue
        except OSError:continue
        db=sqlite3.connect(str(file))
        try:
            for (table,) in db.execute("SELECT name FROM sqlite_master WHERE type='table'"):
                safe='"'+table.replace('"','""')+'"'
                cols={r[1].lower():r[1] for r in db.execute('PRAGMA table_info('+safe+')')}
                if not {'key','value'}.issubset(cols):continue
                key='"'+cols['key'].replace('"','""')+'"';value='"'+cols['value'].replace('"','""')+'"'
                for k,v in db.execute('SELECT '+key+','+value+' FROM '+safe+' WHERE '+key+' IN (?,?)',('orbit-profile-v1','orbit:streak-v1')):
                    records[k]=json.loads(v)
                if update_streak and 'orbit:streak-v1' in records:
                    state=dict(records['orbit:streak-v1'])
                    state.update(current=29,best=max(29,state.get('best',0)),lastActiveDay=datetime.datetime.now().strftime('%Y-%m-%d'))
                    db.execute('UPDATE '+safe+' SET '+value+'=? WHERE '+key+'=?',(json.dumps(state),'orbit:streak-v1'));db.commit()
        finally:db.close()
    return records
setup_ok=False
for flow in sorted((ROOT/'.verification/ios/flows').glob('*.yaml')):
    name=flow.stem
    if not name.startswith('01-') and not setup_ok:
        report['cases'].append({'name':name,'status':'blocked_by_onboarding'});continue
    if name.startswith('03-'):
        subprocess.run(['xcrun','simctl','terminate',udid,APP_ID],capture_output=True)
        saved=local_records(update_streak=True)
        report['local_profile']=saved.get('orbit-profile-v1')
        if 'orbit:streak-v1' not in saved:
            report['cases'].append({'name':name,'status':'blocked_streak_fixture_storage_not_found'});continue
    if not name.startswith('01-'):
        subprocess.run(['xcrun','simctl','terminate',udid,APP_ID],capture_output=True)
        run('xcrun','simctl','launch',udid,APP_ID,timeout=90)
    cmd=[maestro,'--device',udid,'test','--format','junit','--output',str(OUT/(name+'.xml'))]
    if '--debug-output' in helptext:cmd+=['--debug-output',str(OUT/'debug'/name)]
    if '--test-output-dir' in helptext:cmd+=['--test-output-dir',str(OUT/'screenshots')]
    cmd.append(str(flow))
    completed=False
    deadline=time.monotonic()+(900 if name.startswith('01-') else 480)
    logpath=OUT/(name+'.log')
    with logpath.open('w') as stream:
        process=subprocess.Popen(cmd,stdout=stream,stderr=subprocess.STDOUT,text=True,start_new_session=True)
        marker_at=None
        while process.poll() is None:
            completed=bool(list(OUT.rglob('__complete-'+name+'.png')))
            if completed and marker_at is None:marker_at=time.monotonic()
            if time.monotonic()>deadline or (marker_at is not None and time.monotonic()-marker_at>15):
                os.killpg(process.pid,signal.SIGTERM)
                try:process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid,signal.SIGKILL);process.wait()
                code=124
                break
            time.sleep(1)
        else:code=process.returncode
    completed=bool(list(OUT.rglob('__complete-'+name+'.png')))
    status='pass' if code==0 else 'assertions_passed_runner_teardown_timeout' if code==124 and completed else 'fail'
    if name.startswith('01-'):setup_ok=code==0 or completed
    if name.startswith('06-') and not capabilities['OrbitSimulator']:status='fail_native_view_not_implemented'
    report['cases'].append({'name':name,'status':status,'exit_code':code,'all_flow_commands_completed':completed})
    run('xcrun','simctl','io',udid,'screenshot',str(OUT/(name+'-final.png')),timeout=60)
    (OUT/'report.json').write_text(json.dumps(report,indent=2))
if setup_ok:
    subprocess.run(['xcrun','simctl','terminate',udid,APP_ID],capture_output=True)
    report['saved_records']=local_records()
if (ROOT/'.maestro').exists():shutil.copytree(ROOT/'.maestro',OUT/'maestro-default',dirs_exist_ok=True)
probe=container/'Documents/ios-keychain-qa.json'
try:
    keychain=json.loads(probe.read_text())
    report['keychain_probe']={k:keychain.get(k) for k in ['pass','phase','failures','jsi']}
    keychain_ok=keychain.get('pass') is True and keychain.get('phase')=='verified' and keychain.get('jsi') is True
except (OSError,ValueError):
    report['keychain_probe']={'pass':False,'reason':'probe_report_missing'}
    keychain_ok=False
report['cases'].append({'name':'08-keychain-native-crud-relaunch','status':'pass' if keychain_ok else 'fail'})
(OUT/'report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
if any(c['status']!='pass' for c in report['cases']):raise SystemExit(1)
