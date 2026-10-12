"""Build a small CC0 reference head, preserving real facial morph geometry."""
import copy, json, struct, pathlib, urllib.request, hashlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models/eye-exam'
OUT.mkdir(parents=True, exist_ok=True)
REV = 'bdecdcd537b4031fdd0fb299b7e4f93f084fffa0'
BASE = f'https://raw.githubusercontent.com/ibrews/VitruvianGodot/{REV}/godot_project/'
CACHE = pathlib.Path('/tmp/orbit-eye-source'); CACHE.mkdir(exist_ok=True)
def download(name):
    p = CACHE / name
    if not p.exists():
        with urllib.request.urlopen(BASE + name, timeout=45) as r: p.write_bytes(r.read())
    return p
b = download('vitruvian_head.glb').read_bytes()
n = struct.unpack_from('<I', b, 12)[0]
d = json.loads(b[20:20+n]); binary = b[28+n:]
def floats(index):
    a = d['accessors'][index]
    size = {'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    result = np.zeros((a['count'],size),dtype='<f4')
    if 'bufferView' in a:
        v = d['bufferViews'][a['bufferView']]
        result[:] = np.ndarray((a['count'],size),dtype='<f4',buffer=binary,
            offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',size*4),4))
    if 'sparse' in a:
        sp=a['sparse'];ix=sp['indices'];val=sp['values']
        iv=d['bufferViews'][ix['bufferView']];vv=d['bufferViews'][val['bufferView']]
        ids=np.frombuffer(binary,dtype={5121:'u1',5123:'<u2',5125:'<u4'}[ix['componentType']],count=sp['count'],offset=iv.get('byteOffset',0)+ix.get('byteOffset',0))
        values=np.frombuffer(binary,dtype='<f4',count=sp['count']*size,offset=vv.get('byteOffset',0)+val.get('byteOffset',0)).reshape(-1,size)
        result[ids]=values
    return result
# All clinically useful expressions. Symmetric closure becomes independent lids.
wanted = ['Mouth_Large_Opened','Eyebrows_Raised_Left','Eyebrows_Raised_Right',
          'Lips_Up_Corner_Wide_Left','Lips_Up_Corner_Wide_Right','Eyes_Closed_Left','Eyes_Closed_Right','Upper_Lid_Left','Upper_Lid_Right']
head = d['meshes'][6]; old_names = head['extras']['targetNames']
extra_views = {}
for prim in head['primitives']:
    xyz = floats(prim['attributes']['POSITION'])
    blink = prim['targets'][old_names.index('Eyes_Closed_Max')]['POSITION']
    new_targets = []
    for name in wanted:
        if name.startswith(('Eyes_Closed_','Upper_Lid_')):
            delta = floats(blink)
            # Facing the patient: positive model X is the patient's left.
            mask = xyz[:,0] > 0 if name.endswith('Left') else xyz[:,0] < 0
            if name.startswith('Upper_Lid_'):
                mask &= (xyz[:,1] > 1.630) & (xyz[:,1] < 1.660) & (np.abs(xyz[:,0]) > .015) & (np.abs(xyz[:,0]) < .067)
            delta[~mask] = 0
            index = len(d['accessors']); view = len(d['bufferViews'])
            raw = delta.astype('<f4').tobytes(); extra_views[view] = raw
            d['bufferViews'].append({'buffer':0,'byteLength':len(raw),'target':34962})
            d['accessors'].append({'bufferView':view,'componentType':5126,'count':len(delta),'type':'VEC3'})
        else:
            old = old_names.index(name)
            # Source left/right expression names follow viewer coordinates.
            opposite = name.replace('Left','SIDE').replace('Right','Left').replace('SIDE','Right')
            delta = floats(prim['targets'][old]['POSITION'])
            energy = np.linalg.norm(delta,axis=1)
            mean_x = (xyz[:,0]*energy).sum()/max(1e-9,energy.sum())
            expected_positive = name.endswith('Left')
            if (mean_x > 0) != expected_positive and opposite in old_names:
                old = old_names.index(opposite)
            delta = floats(prim['targets'][old]['POSITION'])
            index = len(d['accessors']); view = len(d['bufferViews'])
            raw = delta.astype('<f4').tobytes(); extra_views[view] = raw
            d['bufferViews'].append({'buffer':0,'byteLength':len(raw),'target':34962})
            d['accessors'].append({'bufferView':view,'componentType':5126,'count':len(delta),'type':'VEC3'})
        new_targets.append({'POSITION':index})
    prim['targets'] = new_targets
head['extras']['targetNames'] = wanted
head['weights'] = [0]*len(wanted)
# Strip unused UV/color streams and discard cosmetic eyeshadow geometry.
keep_nodes = [0,1,4,5,6]; keep_meshes = [0,1,4,5,6]
mesh_map = {old:i for i,old in enumerate(keep_meshes)}
d['meshes'] = [d['meshes'][i] for i in keep_meshes]
d['nodes'] = [d['nodes'][i] for i in keep_nodes]
for node in d['nodes']: node['mesh'] = mesh_map[node['mesh']]
d['scenes'] = [{'nodes':list(range(len(d['nodes'])))}]; d['scene']=0
used = set()
for mesh in d['meshes']:
    for prim in mesh['primitives']:
        prim['attributes'] = {k:v for k,v in prim['attributes'].items() if k in ['POSITION','NORMAL','TEXCOORD_0']}
        used.update(prim['attributes'].values())
        if 'indices' in prim: used.add(prim['indices'])
        for target in prim.get('targets',[]): used.update(target.values())
a_map = {old:i for i,old in enumerate(sorted(used))}
v_used = sorted({d['accessors'][i]['bufferView'] for i in used})
v_map = {old:i for i,old in enumerate(v_used)}
packed = bytearray(); views=[]
for old in v_used:
    v=copy.deepcopy(d['bufferViews'][old]); start=v.get('byteOffset',0)
    raw=extra_views.get(old,binary[start:start+v['byteLength']])
    packed.extend(b'\0'*((-len(packed))%4));v['byteOffset']=len(packed);v['buffer']=0
    packed.extend(raw);views.append(v)
accessors=[]
for old in sorted(used):
    a=copy.deepcopy(d['accessors'][old]);a['bufferView']=v_map[a['bufferView']];accessors.append(a)
for mesh in d['meshes']:
    for prim in mesh['primitives']:
        prim['attributes']={k:a_map[v] for k,v in prim['attributes'].items()}
        if 'indices' in prim:prim['indices']=a_map[prim['indices']]
        for target in prim.get('targets',[]):
            for k,v in list(target.items()):target[k]=a_map[v]
d['accessors']=accessors;d['bufferViews']=views;d['buffers']=[{'byteLength':len(packed)}]
d['asset']['extras']={'source':'Vitruvian / CharMorph; CC0','sourceCommit':REV,'purpose':'Facial examination reference, not a patient-specific anatomical scan'}
js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4);packed.extend(b'\0'*((-len(packed))%4))
result=struct.pack('<III',0x46546c67,2,28+len(js)+len(packed))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(packed),0x004e4942)+packed
(OUT/'reference-head.glb').write_bytes(result)
for source,target,limit in [('vit_face_bc.png','face.webp',1024),('vit_mouth.png','mouth.webp',512),('vit_iris.png','iris.webp',512),('vit_sclera.png','sclera.webp',512)]:
    im=Image.open(download(source));im.thumbnail((limit,limit),Image.Resampling.LANCZOS);im.save(OUT/target,'WEBP',quality=88)
manifest={'source':'https://github.com/ibrews/VitruvianGodot','commit':REV,'license':'CC0-1.0','credits':'Vitruvian by Sean Buckley and Olaf Delgado-Friedrichs; CharMorph by Upliner; asset export by Agile Lens','changes':'Removed unused attribute streams and expression targets; split symmetric lid closure into patient-left/right morphs; resized CC0 textures for mobile delivery','files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in OUT.iterdir() if p.suffix in ['.glb','.webp']}}
(OUT/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({k:v['bytes'] for k,v in manifest['files'].items()}))
