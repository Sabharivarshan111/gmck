#!/usr/bin/env bash
# Reproducible restrained grades for the two user-supplied portrait night clips.
set -euo pipefail
if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo 'Usage: bash render-natural.sh 4k_clip.mp4 360p_clip.mp4 [output_directory]' >&2
  exit 2
fi
command -v ffmpeg >/dev/null || { echo 'ffmpeg is required' >&2; exit 1; }
command -v ffprobe >/dev/null || { echo 'ffprobe is required' >&2; exit 1; }
SRC1="$1"; SRC2="$2"; DEST="${3:-./video-exports}"
[ -f "$SRC1" ] && [ -f "$SRC2" ] || { echo 'Cannot read both input videos' >&2; exit 1; }
mkdir -p "$DEST"
ffmpeg -hide_banner -y -i "$SRC1" \
  -map 0:v:0 -map '0:a?' \
  -vf 'scale=1080:1920:flags=lanczos,eq=contrast=1.035:brightness=0.006:saturation=1.025:gamma=1.025,hqdn3d=0.8:0.6:2.0:1.5' \
  -c:v libx264 -preset faster -crf 19 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -movflags +faststart "$DEST/Video_1_Natural_Enhanced.mp4"
ffmpeg -hide_banner -y -i "$SRC2" \
  -map 0:v:0 -map '0:a?' \
  -vf 'hqdn3d=1.2:0.9:3:2,eq=contrast=1.035:brightness=-0.006:saturation=1.03:gamma=1.015,unsharp=3:3:0.3:3:3:0' \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -movflags +faststart "$DEST/Video_2_Natural_Enhanced.mp4"
echo "Exports saved to: $DEST"
