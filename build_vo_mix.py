"""Generate VO audio for scripts/vo_update_demo.json, find each segment's
REAL on-screen timestamp in the recorded .cast (via its unique `marker`
substring — command runtimes vary run to run, a hardcoded timestamp would
drift), then mux the narration onto the silent recording with ffmpeg.

Usage: python3 build_vo_mix.py <video.mp4> <cast_file> <vo_json> <vo_audio_dir> <output.mp4>
"""
import json
import subprocess
import sys
from pathlib import Path


def main() -> None:
    video, cast_path, vo_json_path, vo_dir, output = sys.argv[1:6]
    vo_dir = Path(vo_dir)
    vo_dir.mkdir(parents=True, exist_ok=True)

    with open(vo_json_path, encoding="utf-8") as f:
        vo = json.load(f)
    voice, rate, segments = vo["voice"], vo["rate"], vo["segments"]

    print(">> generating VO segments (edge-tts) ...")
    for seg in segments:
        mp3 = vo_dir / f"{seg['key']}.mp3"
        subprocess.run(
            ["edge-tts", "--voice", voice, f"--rate={rate}", "--text", seg["text"], "--write-media", str(mp3)],
            check=True,
        )

    print(">> locating real on-screen timestamps in the cast ...")
    found = {}
    with open(cast_path, encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
            except Exception:
                continue
            if not isinstance(entry, list) or len(entry) < 3 or entry[1] != "o":
                continue
            ts, text = entry[0], entry[2]
            for seg in segments:
                if seg["key"] not in found and seg["marker"] in text:
                    found[seg["key"]] = ts
    missing = [seg["key"] for seg in segments if seg["key"] not in found]
    if missing:
        sys.exit(f"markers not found in cast (recording script changed?): {missing}")

    print(">> muxing VO onto the video ...")
    cmd = ["ffmpeg", "-y", "-loglevel", "warning", "-i", video]
    for seg in segments:
        cmd += ["-i", str(vo_dir / f"{seg['key']}.mp3")]

    filters = []
    labels = []
    for i, seg in enumerate(segments, start=1):
        delay_ms = round(found[seg["key"]] * 1000)
        filters.append(f"[{i}:a]adelay={delay_ms}[a{i}]")
        labels.append(f"[a{i}]")
    filters.append("".join(labels) + f"amix=inputs={len(segments)}:duration=longest:normalize=0[aout]")
    cmd += ["-filter_complex", ";".join(filters), "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", output]

    subprocess.run(cmd, check=True)
    print(f">> done: {output}")


if __name__ == "__main__":
    main()
