#!/usr/bin/env bash
# Regenerate the procedural audio assets used in remotion/public/audio/.
#
# VO mp3 files come from scripts/generate_vo.py (edge-tts). This script
# handles only the FFmpeg-synthesized bits: ambient pad + UI sound effects.
#
# Run from repo root.
set -e
out=remotion/public/audio
mkdir -p "$out"

echo "ambient pad (169s, three low sine waves, fade in/out)"
ffmpeg -y -v error \
  -f lavfi -i "sine=frequency=110:duration=169" \
  -f lavfi -i "sine=frequency=165:duration=169" \
  -f lavfi -i "sine=frequency=220:duration=169" \
  -filter_complex "[0:a]volume=0.15[a0];[1:a]volume=0.10[a1];[2:a]volume=0.06[a2];[a0][a1][a2]amix=inputs=3:duration=longest,lowpass=f=900,afade=t=in:st=0:d=2,afade=t=out:st=166:d=3" \
  -c:a libmp3lame -b:a 96k \
  "$out/bg-pad.mp3"

echo "click sfx (60 ms, filtered brown noise — soft typewriter feel)"
ffmpeg -y -v error \
  -f lavfi -i "anoisesrc=duration=0.06:color=brown:amplitude=0.4" \
  -af "highpass=f=1200,lowpass=f=3500,afade=t=in:st=0:d=0.005,afade=t=out:st=0.02:d=0.04" \
  -c:a libmp3lame -b:a 96k \
  "$out/sfx-click.mp3"

echo "ding sfx (250 ms, 880+1320 Hz sine pair, exponential decay)"
ffmpeg -y -v error \
  -f lavfi -i "sine=frequency=880:duration=0.25" \
  -f lavfi -i "sine=frequency=1320:duration=0.25" \
  -filter_complex "[0:a]volume=0.6[a0];[1:a]volume=0.3[a1];[a0][a1]amix=inputs=2,afade=t=out:st=0.05:d=0.2" \
  -c:a libmp3lame -b:a 96k \
  "$out/sfx-ding.mp3"

ls -la "$out"
