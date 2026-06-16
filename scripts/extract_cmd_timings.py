#!/usr/bin/env python3
"""Extract command timings from asciinema .cast for subtitle sync.

Reads each 'o' event whose payload contains a $ prompt with a `pdk ...`
command, records its timestamp, and prints a tab-separated table of
(timestamp_seconds, command_label) — feed into an ASS subtitle builder.
"""
import json, re, sys

CAST = sys.argv[1] if len(sys.argv) > 1 else "/home/lynx/vidwork/live-demo.cast"
ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
PROMPT = re.compile(r"\$\s+(?P<cmd>[^\r\n]+)")

cmds = []
with open(CAST) as f:
    header = json.loads(f.readline())
    for line in f:
        try:
            t, kind, payload = json.loads(line)
        except (ValueError, TypeError):
            continue
        if kind != "o":
            continue
        clean = ANSI.sub("", payload).replace("\r", "")
        m = PROMPT.search(clean)
        if not m:
            continue
        cmd = m.group("cmd").strip()
        if cmd.startswith("#"):
            continue
        cmds.append((round(t, 3), cmd[:120]))

for t, c in cmds:
    print(f"{t:9.3f}\t{c}")
