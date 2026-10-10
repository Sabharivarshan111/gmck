"""Export a compact, registered BodyParts3D chest; no invented anatomical geometry.
Requires numpy. Run from repository root. Crop source triangles, preserve metres/Y-up.
"""
import gzip, json, struct
from pathlib import Path
import numpy as np
root = Path('public/models')
atlas = json.loads((root / 'atlas.json').read_text())
groups, cache = {}, {}
for p in atlas['parts']:
    system, name = p['system'], p['name'].lower()
    lo, hi = p['bounds']
    if hi[1] < 1.08 or lo[1] > 1.54: continue
    keep = (name == 'skin' or system == 'cardiac' or
        system == 'skeletal' and any(s in name for s in ('rib', 'stern', 'clavicle', 'thoracic vertebra', 'scapula', 'costal')) or
        system == 'respiratory' and any(s in name for s in ('trachea', 'bronch')) or
        system in ('arterial', 'venous') and lo[1] > 1.20 and hi[1] < 1.51 and max(abs(lo[0]),abs(hi[0])) < .17 or
        system == 'muscular' and any(s in name for s in ('pectoralis major', 'sternocleidomastoid')))
    if not keep: continue
    if p['chunk'] not in cache:
        cache[p['chunk']] = gzip.decompress((Path('public') / atlas['chunks'][p['chunk']]['gzip'].lstrip('/')).read_bytes())
    raw = cache[p['chunk']]
    pos = np.frombuffer(raw, '<f4', p['vertexCount']*3, p['positions']).reshape(-1,3)
    norm = np.frombuffer(raw, '<i2', p['vertexCount']*3, p['normals']).reshape(-1,3).astype('<f4') / 32767
    tri = np.frombuffer(raw, '<u4', p['indexCount'], p['indices']).reshape(-1,3)
    verts = pos[tri]
    tri = tri[((verts[:,:,1] >= 1.08)&(verts[:,:,1] <= 1.54)&(abs(verts[:,:,0]) <= .245)).all(axis=1)]
    if not len(tri): continue
    used, indices = np.unique(tri, return_inverse=True)
    groups.setdefault(system, []).append((p, pos[used], norm[used], indices.ravel().astype('<u4')))
colors = {'integumentary':[.14,.42,.58,1], 'skeletal':[.88,.84,.72,1], 'cardiac':[.68,.09,.15,1], 'arterial':[.77,.08,.13,1], 'venous':[.12,.35,.67,1], 'respiratory':[.74,.56,.46,1], 'muscular':[.70,.26,.23,1]}
gltf = {'asset':{'version':'2.0','generator':'ORBIT registered BodyParts3D chest export'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'accessors':[],'bufferViews':[],'buffers':[], 'extras':{'source':'BodyParts3D 4.0, Database Center for Life Science','license':'CC BY 4.0','adaptation':'Cropped source triangles; grouped by system. Original registered coordinates retained.'}}
binary = bytearray()
def accessor(arr, component, kind):
    while len(binary)%4: binary.append(0)
    offset=len(binary); binary.extend(arr.tobytes())
    view=len(gltf['bufferViews']); gltf['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':arr.nbytes})
    a={'bufferView':view,'componentType':component,'count':len(arr),'type':kind}
    if kind=='VEC3': a.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
    idx=len(gltf['accessors']);gltf['accessors'].append(a);return idx
for system, parts in groups.items():
    ps,ns,inds,offset=[],[],[],0
    for _,p,n,i in parts: ps.append(p);ns.append(n);inds.append(i+offset);offset+=len(p)
    material=len(gltf['materials']);gltf['materials'].append({'name':system,'pbrMetallicRoughness':{'baseColorFactor':colors[system],'metallicFactor':0,'roughnessFactor':.65},'doubleSided':True})
    primitive={'attributes':{'POSITION':accessor(np.concatenate(ps).astype('<f4'),5126,'VEC3'),'NORMAL':accessor(np.concatenate(ns).astype('<f4'),5126,'VEC3')},'indices':accessor(np.concatenate(inds).astype('<u4'),5125,'SCALAR'),'material':material}
    idx=len(gltf['meshes']);gltf['meshes'].append({'name':system,'primitives':[primitive],'extras':{'sourceParts':[{'id':p['id'],'name':p['name']} for p,_,_,_ in parts]}})
    gltf['nodes'].append({'mesh':idx,'name':system});gltf['scenes'][0]['nodes'].append(idx)
    print(system,len(parts),'source parts',sum(len(i)//3 for _,_,_,i in parts),'triangles')
while len(binary)%4:binary.append(0)
gltf['buffers']=[{'byteLength':len(binary)}]
data=json.dumps(gltf,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
out=struct.pack('<III',0x46546c67,2,28+len(data)+len(binary))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary
(root/'auscultation_thorax_bp3d.glb.gz').write_bytes(gzip.compress(out, mtime=0))
print('Saved',len(out),'bytes')
