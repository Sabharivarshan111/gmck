#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .models
if [[ ! -f .models/Wan2.2/generate.py ]]; then git clone --depth 1 https://github.com/Wan-Video/Wan2.2.git .models/Wan2.2; fi
python -m pip install --upgrade pip
python -m pip install 'torch>=2.4' torchvision
python -m pip install -r .models/Wan2.2/requirements.txt
python -m pip install 'huggingface_hub[cli]'
python -c 'from huggingface_hub import snapshot_download; snapshot_download(repo_id="Wan-AI/Wan2.2-TI2V-5B",local_dir=".models/Wan2.2-TI2V-5B")'
echo "Downloaded model to .models/ (not tracked in git)"
