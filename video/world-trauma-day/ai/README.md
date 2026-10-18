# GMCK World Trauma Day — open-source image-to-video
Primary model: [Wan2.2 TI2V-5B](https://github.com/Wan-Video/Wan2.2), Apache-2.0. Official I2V supports 1280×704 at 24 fps and can run on a **24GB NVIDIA GPU with offloading**. This repository stores scripts, not giant model weights. GitHub-hosted runners are not GPU runners.

## Run on an NVIDIA GPU machine (or registered self-hosted GitHub Actions GPU runner)
```sh
cd video/world-trauma-day
bash ai/setup_wan.sh
python ai/run_wan.py --scene establish --dry-run
python ai/run_wan.py --scene establish
# When a controlled rescue reference has been added:
python ai/run_wan.py --scene rescue
npm install
npm run studio
npm run render:ai
```
Generated clips are written to `public/generated`. The source image for the establish scene is `public/references/R01_Master_Road.jpg`. A generated matching reference image is included in the chat downloadable integration ZIP; copy it into that location before running. For the rescue scene, place an approved matching still at `public/references/Rescue_Reference.jpg`. The image files and model weights are not committed to GitHub.

Wan supports frame count 4n+1: 193 frames at 24fps is about 8 seconds. This is resource-intensive. `--dry-run` works on CPU without downloading model weights.

## Why the crash remains deterministic
Keep the original continuous Remotion GMCKCrash timeline for ALL physical contacts: original blue-striped ambulance A01 drives west, its FRONT contacts the FRONT of original bus B01; silver car C01 contacts bus REAR; motorcycle M01 contacts bus left side. AI model is not allowed to invent impacts. Original crash stays in one fixed road environment. Green-striped rescue A02 appears only after crash and call. Validate rendered clips before final delivery: AI seeds do not guarantee identity persistence.

Optional AIEnhanced composition in Remotion uses Wan supporting clips before/after the deterministic crash, with a safe non-AI placeholder by default. Select `useAIFootage:true` only after both generated supporting video files exist.
