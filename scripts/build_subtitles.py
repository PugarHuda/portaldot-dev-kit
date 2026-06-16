#!/usr/bin/env python3
"""Build an ASS subtitle file for live-demo.mp4.

Timings were calibrated by extracting frames every 15 s from the mp4
and noting which command was on screen. Cast file timings (per
extract_cmd_timings.py) compressed by agg's idle-pause cap, so
mapping is non-linear. Hand-tuned below.

Subtitles render in a black band padded onto the bottom of the
video by ffmpeg's pad filter — never covers terminal content.
"""

# (start_seconds, end_seconds, caption text)
LINES = [
    (0.0,   5.5,  "Portaldot is brand-new. When a transaction fails, the chain returns a raw code — no name, no message, no fix."),
    (5.5,  20.0,  "pdk decodes those codes. Fresh venv → pip install portaldot-pdk — v0.1.6 already on PyPI."),
    (20.0, 28.0,  "pdk doctor — endpoint, chain, runtime 1002, 31 pallets, ink! 3.x compat."),
    (28.0, 38.0,  "pdk accounts — pre-funded Alice / Bob / Charlie. Answers the most-asked Discord question: \"how do I get POT?\""),
    (38.0, 42.0,  "pdk pallets — all 31 pallets, straight from chain metadata."),
    (42.0, 47.0,  "pdk storage — read any chain value. Here: the current block number."),
    (47.0, 52.0,  "pdk keys //Alice — inspect or generate keypairs. SS58 format 42 — Portaldot's standard."),
    (52.0, 62.0,  "pdk simulate — preview fee + feasibility before sending. Built from the real fee oracle."),
    (62.0, 72.0,  "pdk send — a real on-chain transfer. 1 POT Alice → Bob. Gas paid in POT. No mocks."),
    (72.0, 95.0,  "pdk seed — fund extra dev accounts from a YAML fixture (Dave, Eve, Ferdie)."),
    (95.0, 107.0, "pdk debug --demo — the hero. Submits a real failing tx and decodes it: named error, plain English, numbered fix."),
    (107.0, 115.0, "pdk explain --module 6 --error 2 — decodes the RAW module-and-error code. Nothing else in the Portaldot ecosystem does this."),
    (115.0, 127.0, "pdk debug --fix — diagnose AND apply the fix. One command, end-to-end remediation."),
    (127.0, 133.0, "pdk report — group recent failures by type. Triage at a glance."),
    (133.0, 140.0, "pdk watch — stream chain events live. Filter by pallet."),
    (140.0, 146.6, "pdk ai-setup — wizard for the optional AI layer.   ·   14 commands. Real POT gas. 1st place — Builder Tools."),
]

def fmt(t: float) -> str:
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t - h * 3600 - m * 60
    return f"{h:d}:{m:02d}:{s:05.2f}"

HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 978
PlayResY: 900
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Inter,22,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,3,0,2,40,40,18,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

events = []
for start, end, text in LINES:
    text_clean = text.replace("\n", "\\N")
    events.append(f"Dialogue: 0,{fmt(start)},{fmt(end)},Caption,,0,0,0,,{text_clean}")

print(HEADER + "\n".join(events) + "\n")
