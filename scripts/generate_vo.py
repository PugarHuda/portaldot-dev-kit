#!/usr/bin/env python3
"""Generate per-segment VO mp3 files via edge-tts (Microsoft Edge Neural TTS).

Reads scripts/vo_script.json and writes:
    remotion/public/audio/vo-intro.mp3
    remotion/public/audio/vo-demo.mp3
    remotion/public/audio/vo-outro.mp3

Uses AndrewNeural — warm, confident male voice. Rate set slightly slow
(-2%) for beginner comprehension.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).parent.parent
SCRIPT = ROOT / "scripts" / "vo_script.json"
OUTDIR = ROOT / "remotion" / "public" / "audio"
OUTDIR.mkdir(parents=True, exist_ok=True)


async def render_one(name: str, text: str, voice: str, rate: str, pitch: str) -> Path:
    out = OUTDIR / f"vo-{name}.mp3"
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    await communicate.save(str(out))
    return out


async def main() -> int:
    spec = json.loads(SCRIPT.read_text(encoding="utf-8"))
    voice = spec.get("voice", "en-US-AndrewNeural")
    rate = spec.get("rate", "-2%")
    pitch = spec.get("pitch", "+0Hz")
    print(f"voice={voice} rate={rate} pitch={pitch}")
    for name, text in spec["segments"].items():
        words = len(text.split())
        out = await render_one(name, text, voice, rate, pitch)
        size = out.stat().st_size
        print(f"  {name:6s} {words:4d} words -> {out.name}  ({size/1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
