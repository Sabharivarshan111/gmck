"""Read actual compressed atlas buffers independently of the WebGL renderer.
Requires numpy. This is source integrity evidence, not device/medical certification.
"""
from pathlib import Path
import gzip, hashlib, json
import numpy as np
root=Path(__file__).resolve().parents[2]
atlas=json.loads((root/'public/models/atlas.json').read_text())
chunks=[];buffers=[];issues=[];parts=[]
for chunk in atlas['chunks']:
    path=root/'public'/chunk['gzip'].lstrip('/')
    packed=path.read_bytes();data=gzip.decompress(packed)
    assert len(packed)==chunk['gzipBytes'] and len(data)==chunk['bytes'],str(path)
    buffers.append(data);chunks.append({'path':chunk['gzip'],'bytes':len(packed),'sha256':hashlib.sha256(packed).hexdigest()})
for p in atlas['parts']:
    try:
        data=buffers[p['chunk']]
        vertices=np.frombuffer(data,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape((-1,3))
        normals=np.frombuffer(data,dtype='<i2',count=p['vertexCount']*3,offset=p['normals']).reshape((-1,3))
        indices=np.frombuffer(data,dtype='<u4',count=p['indexCount'],offset=p['indices'])
        assert len(vertices)>0 and len(indices)>0 and len(indices)%3==0,'empty/non-triangular mesh'
        assert np.isfinite(vertices).all(),'non-finite coordinate'
        assert int(indices.max())<len(vertices),'index outside vertex buffer'
        low=np.array(p['bounds'][0]);high=np.array(p['bounds'][1])
        assert np.isfinite(low).all() and np.isfinite(high).all() and np.all(high>=low),'invalid bounds'
        assert np.all(vertices.min(axis=0)>=low-1e-5) and np.all(vertices.max(axis=0)<=high+1e-5),'vertices outside declared source bounds'
        parts.append({'id':p['id'],'name':p['name'],'vertices':len(vertices),'triangles':len(indices)//3})
    except Exception as e:issues.append({'id':p['id'],'name':p['name'],'error':str(e)})
assert len({p['id'] for p in atlas['parts']})==len(atlas['parts']),'duplicate source IDs'
report={'status':'FAILED' if issues else 'PASSED','scope':'Static binary atlas integrity only; not per-mesh device visual or clinical certification.','bodyParts3D':len(atlas['parts']),'nerveCatalogEntries':len(json.loads((root/'public/models/nerve_catalog.json').read_text())),'checkedVertices':sum(p['vertices'] for p in parts),'checkedTriangles':sum(p['triangles'] for p in parts),'chunks':chunks,'checkedSourceIds':[p['id'] for p in parts],'issues':issues}
out=root/'docs/qa/anatomy-audit-20261018';out.mkdir(parents=True,exist_ok=True)
(out/'source-integrity.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['checkedSourceIds','chunks']},indent=2))
assert not issues,'Invalid atlas geometry'
