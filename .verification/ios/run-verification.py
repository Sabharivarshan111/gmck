import datetime, hashlib, json, os, pathlib, re, shutil, sqlite3, subprocess, time
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
report={'source_sha':'dba321a5dd50335f5be7c4a101769f74dbc07243','build_run':41752091252,
        'device':device['name'],'runtime':runtime,'offline_backend_isolated':True,'native_classes':capabilities,
        'cases':[],'not_verified':['real Google sign-in (disabled in tested build)','StoreKit/live purchases (not implemented)','push delivery on a real iPhone','TestFlight signing and App Store review']}
def local_records(update_streak=False):
    container=pathlib.Path(subprocess.check_output(['xcrun','simctl','get_app_container',udid,APP_ID,'data'],text=True).strip())
    records={}
    for file in container.rglob('*'):
        if not file.is_file() or file.name.endswith(('-wal','-shm')):continue
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
    cmd=[maestro,'--device',udid,'test','--format','junit','--output',str(OUT/(name+'.xml'))]
    if '--debug-output' in helptext:cmd+=['--debug-output',str(OUT/'debug'/name)]
    if '--test-output-dir' in helptext:cmd+=['--test-output-dir',str(OUT/'screenshots')]
    cmd.append(str(flow))
    try:
        result=subprocess.run(cmd,capture_output=True,text=True,timeout=900 if name.startswith('01-') else 480)
        code=result.returncode;log=result.stdout+'\n'+result.stderr
    except subprocess.TimeoutExpired as e:
        code=124;log=str(e)
    (OUT/(name+'.log')).write_text(log)
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
(OUT/'report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
if any(c['status']!='pass' for c in report['cases']):raise SystemExit(1)
