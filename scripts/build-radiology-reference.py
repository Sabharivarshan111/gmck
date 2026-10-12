"""Build a small CC0 MRI teaching volume from OpenNeuro ds000114."""
import gzip,hashlib,json,pathlib,urllib.request
import nibabel as nib
import numpy as np
from scipy.ndimage import zoom
root=pathlib.Path('public/clinical-reference/radiology');root.mkdir(parents=True,exist_ok=True)
url='https://s3.amazonaws.com/openneuro.org/ds000114/sub-01/ses-test/anat/sub-01_ses-test_T1w.nii.gz'
source=pathlib.Path('/tmp/orbit-t1.nii.gz')
if not source.exists():source.write_bytes(urllib.request.urlopen(url,timeout=60).read())
im=nib.as_closest_canonical(nib.load(source));a=im.get_fdata();target=np.array([112,128,112]);scaled=zoom(a,target/np.array(a.shape),order=1);lo,hi=np.percentile(scaled[scaled>0],[1,99.5]);data=np.clip((scaled-lo)/(hi-lo)*255,0,255).astype('uint8');raw=data.tobytes(order='F');(root/'brain-t1.pack').write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))
meta={'dimensions':list(map(int,data.shape)),'spacing':list(map(float,np.array(im.header.get_zooms()[:3])*np.array(a.shape)/target)),'orientation':'RAS','dtype':'uint8','source':url,'license':'CC0','doi':'https://doi.org/10.18112/openneuro.ds000114.v1.0.2','authors':['Gorgolewski KJ','Storkey A','Bastin ME','Whittle IR','Wardlaw JM','Pernet CR'],'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'volumeSha256':hashlib.sha256(raw).hexdigest(),'changes':'Canonical RAS; trilinear resampling; percentile grayscale scaling to uint8; gzip; x-fastest storage. Research reference independent of simulated patient.'};(root/'brain-t1.json').write_text(json.dumps(meta,indent=2)+'\n');print('MRI compressed bytes:',len((root/'brain-t1.pack').read_bytes()))
