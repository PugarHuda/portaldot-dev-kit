"""Find each VO segment's REAL on-screen timestamp in a recorded .cast file.

Each segment in scripts/vo_update_demo.json carries a `marker` — a unique
substring of a title()/say() line in record_update_demo.sh. Command runtimes
(network round-trips against a live node) vary run to run, so a hardcoded
timestamp would drift; grepping the actual recording for the marker text
never does.

Usage: python3 extract_vo_timestamps.py <cast_file> [vo_json]
Prints "<key> <timestamp_seconds>" per line, in vo_json's segment order.
"""
import json
import sys
from pathlib import Path

cast_path = sys.argv[1] if len(sys.argv) > 1 else "/home/lynx/vidwork/update-demo.cast"
vo_json_path = sys.argv[2] if len(sys.argv) > 2 else str(Path(__file__).resolve().parent / "scripts" / "vo_update_demo.json")

with open(vo_json_path, encoding="utf-8") as f:
    segments = json.load(f)["segments"]

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

for seg in segments:
    key = seg["key"]
    if key not in found:
        print(f"{key} MISSING", file=sys.stderr)
        sys.exit(1)
    print(f"{key} {found[key]}")
