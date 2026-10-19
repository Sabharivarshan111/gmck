#!/usr/bin/env bash
# Stabilized 1080p portrait export for high-resolution iPhone garden original.
# Independent of the OpenCut UI; requires FFmpeg compiled with libvidstab.
set -euo pipefail
if [ $# -ne 2 ]; then echo "Usage: $0 original_4k.mp4 output_1080p.mp4" >&2; exit 2; fi
IN="$1"; OUT="$2"
[[ -f "$IN" ]] || { echo "Source video missing" >&2; exit 1; }
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ffmpeg -hide_banner -v error -y -i "$IN" -map 0:v:0 -an -vf "scale=1080:1920:flags=bicubic,vidstabdetect=shakiness=5:accuracy=9:stepsize=8:mincontrast=0.35:result=$TMP/transform.trf" -f null -
ffmpeg -hide_banner -v error -y -i "$IN" -map 0:v:0 -an -vf "scale=1080:1920:flags=lanczos,vidstabtransform=input=$TMP/transform.trf:smoothing=24:maxshift=36:maxangle=0.042:zoom=2:optzoom=1:crop=black:interpol=bicubic,hqdn3d=0.9:0.75:2.2:1.8,eq=contrast=1.053:brightness=0.004:saturation=1.055:gamma=1.013,colorbalance=rs=-0.006:gs=0:bs=0.008:rm=0.006:gm=0:bm=-0.004:rh=0.009:gh=0.001:bh=-0.006,unsharp=5:5:0.32:5:5:0" -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -r 30 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart "$OUT"
