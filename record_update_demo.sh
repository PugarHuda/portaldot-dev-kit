#!/usr/bin/env bash
# Record the "what's new" update demo: pdk 0.1.8 (fund, send --dry-run),
# then the proof that pdk-ts exists for a reason — Python substrate-interface
# cannot sign an Assets pallet call on Portaldot at all, pdk-ts can.
# Same recording mechanism as record_live_demo.sh: deliberate-paced,
# scripted commands inside `asciinema rec`, silent (no VO track).
# Output: ~/vidwork/update-demo.cast + .gif + .mp4
set -euo pipefail
export PATH="$HOME/bin:$HOME/.cargo/bin:$HOME/asciinema-venv/bin:/home/linuxbrew/.linuxbrew/bin:$PATH"

VW="$HOME/vidwork"
mkdir -p "$VW"
CAST="$VW/update-demo.cast"
GIF="$VW/update-demo.gif"
MP4="$VW/update-demo.mp4"
DEMO_VENV="$HOME/demo-venv"
PDK_TS_DIR="$HOME/pdk-ts-demo"
REPO="/mnt/f/Hackathons/Hackathon Portaldot S1"

BOB="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
CHARLIE="5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
ASSET_ID=424243

echo ">> waiting for node ..."
for i in $(seq 1 45); do
  if timeout 5 node "$PDK_TS_DIR/dist/index.js" doctor --no-liveness --node ws://127.0.0.1:9944 2>/dev/null | grep -q "Runtime"; then echo "  node ready"; break; fi
  sleep 2
done

echo ">> resetting demo venv (fresh pip install on camera) ..."
rm -rf "$DEMO_VENV"
python3 -m venv "$DEMO_VENV"

INNER=$(mktemp --suffix=.sh)
cat > "$INNER" <<INNER_EOF
#!/usr/bin/env bash
DEMO_VENV="\$HOME/demo-venv"
PDK_TS_DIR="\$HOME/pdk-ts-demo"
REPO="$REPO"
BOB="$BOB"
CHARLIE="$CHARLIE"
ASSET_ID="$ASSET_ID"
export PDK_AI_KEY=""

say(){ printf "\n\033[36;1m\$\033[0m \033[1m%s\033[0m\n" "\$1"; sleep 1.5; }
beat(){ sleep "\$1"; }
title(){ printf "\n\033[2m# %s\033[0m\n" "\$1"; sleep 2; }

title "PDK update — new since the last demo"
beat 1.5

# ---- pdk 0.1.8 ----
say "pip install --quiet --upgrade portaldot-pdk"
python3 -m venv "\$DEMO_VENV" >/dev/null 2>&1 || true
source "\$DEMO_VENV/bin/activate"
pip install --quiet portaldot-pdk
beat 1.5

say "pdk --version"
pdk --version
beat 3

title "new: pdk fund — top up an account, no need to know //Alice exists"
say "pdk fund //Bob --amount 25 --node ws://127.0.0.1:9944"
pdk fund //Bob --amount 25 --node ws://127.0.0.1:9944
beat 5

title "new: pdk send --dry-run — preview the exact transfer, submit nothing"
say "pdk send //Bob --amount 5 --dry-run --node ws://127.0.0.1:9944"
pdk send //Bob --amount 5 --dry-run --node ws://127.0.0.1:9944
beat 6

title "now — the reason pdk-ts exists"
say "cat attempt_assets_signing.py"
cat "\$REPO/attempt_assets_signing.py"
beat 4

say "python3 attempt_assets_signing.py   # sign an Assets pallet call from Python"
cd "\$REPO"
python3 attempt_assets_signing.py
beat 9

title "pdk-ts — same call, @polkadot/api"
cd "\$PDK_TS_DIR"
say "node dist/index.js assets create \$ASSET_ID --node ws://127.0.0.1:9944"
node dist/index.js assets create "\$ASSET_ID" --node ws://127.0.0.1:9944
beat 5

say "node dist/index.js assets mint \$ASSET_ID //Bob --amount 5000 --node ws://127.0.0.1:9944"
node dist/index.js assets mint "\$ASSET_ID" //Bob --amount 5000 --node ws://127.0.0.1:9944
beat 5

say "node dist/index.js assets transfer \$ASSET_ID //Charlie --amount 1500 --from //Bob --node ws://127.0.0.1:9944"
node dist/index.js assets transfer "\$ASSET_ID" //Charlie --amount 1500 --from //Bob --node ws://127.0.0.1:9944
beat 5

title "verified on-chain, not just claimed"
say "node dist/index.js storage Assets Account \$ASSET_ID \$BOB --node ws://127.0.0.1:9944"
node dist/index.js storage Assets Account "\$ASSET_ID" "\$BOB" --node ws://127.0.0.1:9944
beat 5

say "node dist/index.js storage Assets Account \$ASSET_ID \$CHARLIE --node ws://127.0.0.1:9944"
node dist/index.js storage Assets Account "\$ASSET_ID" "\$CHARLIE" --node ws://127.0.0.1:9944
beat 5

printf "\n\033[2m# pdk 0.1.8 · pdk-ts 0.2.0-alpha.7 — Assets pallet signing Python cannot do at all.\033[0m\n"
sleep 10
INNER_EOF
chmod +x "$INNER"

echo ">> recording asciinema cast (deliberate pace) ..."
asciinema rec --cols 100 --rows 34 -i 20 -q --overwrite -c "$INNER" "$CAST"

echo ">> agg cast -> gif (speed=1.0, narration-friendly real-time pacing)"
agg --speed 1.0 --idle-time-limit 15 --last-frame-duration 11 --theme monokai --font-size 16 "$CAST" "$GIF"

echo ">> ffmpeg gif -> mp4"
# GIFs store per-frame delays, not a fixed fps — left to its own devices
# ffmpeg's gif demuxer can pick a very high fps to represent the shortest
# frame delay exactly (seen: 100fps). X/Twitter caps video uploads at
# 60fps, so pin the output explicitly with -r (well under the cap; agg's
# own --fps-cap default is 30, so nothing visible is lost).
ffmpeg -y -loglevel warning -i "$GIF" -r 30 -movflags +faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "$MP4"

rm -f "$INNER"

echo ">> generating + muxing VO narration ..."
export PATH="$HOME/edge-tts-venv/bin:$PATH"
VO_MP4="$VW/update-demo-vo.mp4"
python3 "$REPO/build_vo_mix.py" "$MP4" "$CAST" "$REPO/scripts/vo_update_demo.json" "$VW/vo" "$VO_MP4"

echo ""
echo ">> DONE"
ls -la "$CAST" "$MP4" "$VO_MP4"
echo ">> silent duration:"
ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$MP4"
echo ">> narrated duration:"
ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$VO_MP4"
