# -*- coding: utf-8 -*-
"""Read-only Thai cue width audit. Writes JSON next to this file. Does not touch the film."""
import json
import os
import unicodedata
from decimal import Decimal

FILM = r"D:\workspace\lemo-opuscar\films\horror-x-ep1-part1-60s"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "widths.json")
FONT = os.path.join(FILM, "fonts", "Kanit-Regular.ttf")
FONT_PX = Decimal("19.2")
ZONE = Decimal(840)          # x90..930
BUILDER_MAX = Decimal(800)  # CAP_W - 2*16 - 8 in build-captions.py

from fontTools.ttLib import TTFont

tt = TTFont(FONT, lazy=True, ignoreDecompileErrors=True)
cmap = tt.getBestCmap()
upm = Decimal(int(tt["head"].unitsPerEm))
hmtx = tt["hmtx"]
os2 = tt["OS/2"]
adv = {}
for cp, gname in cmap.items():
    adv[cp] = Decimal(int(hmtx.metrics.get(gname, (0, 0))[0])) / upm

missing = []


def char_w(ch):
    w = adv.get(ord(ch))
    if w is None:
        missing.append(ch)
        if ch == " ":
            return Decimal("0.30")
        if unicodedata.combining(ch) != 0:
            return Decimal("0.10")
        return Decimal("0.60")
    return w


def text_px(s):
    return sum((char_w(c) for c in s), Decimal(0)) * FONT_PX


def q(d):
    return float(Decimal(d).quantize(Decimal("0.01")))


def norm_space(s):
    return " ".join(s.split())


def nospace(s):
    return "".join(ch for ch in s if not ch.isspace())


def pack(phrases, limit):
    rows = []
    cur = []
    for p in phrases:
        trial = cur + [p]
        if cur and text_px(" ".join(trial)) > limit:
            rows.append(" ".join(cur))
            cur = [p]
        else:
            cur = trial
    if cur:
        rows.append(" ".join(cur))
    return rows


with open(os.path.join(FILM, "script.json"), encoding="utf-8") as f:
    script = json.load(f)
with open(os.path.join(FILM, "voice-timeline.json"), encoding="utf-8") as f:
    voice = json.load(f)
with open(os.path.join(FILM, "captions.js"), encoding="utf-8") as f:
    cap_src = f.read()

# captions.js is a JS module; cue array is a JSON array assigned to CUES.
start = cap_src.index("const CUES = ") + len("const CUES = ")
end = cap_src.index(";\n", start)
cues = json.loads(cap_src[start:end])

scenes = voice["scenes"]
lines = []
for sc, vt in zip(script, scenes):
    spoken = norm_space(vt["text"])
    written = norm_space(sc["text"])
    phrases = spoken.split(" ")
    phrase_rows = []
    for i, p in enumerate(phrases, 1):
        px = text_px(p)
        phrase_rows.append({
            "i": i,
            "text": p,
            "chars": len(p),
            "px": q(px),
            "fits_840": px <= ZONE,
            "fits_builder_800": px <= BUILDER_MAX,
        })
    full_px = text_px(spoken)
    words = [w["w"] for w in vt.get("words", [])]
    joined_words = "".join(words)
    lines.append({
        "id": vt["id"],
        "spoken": spoken,
        "script": written,
        "script_matches_spoken": written == spoken,
        "speechStart": vt["speechStart"],
        "speechEnd": vt["speechEnd"],
        "phrase_count": len(phrases),
        "full_px": q(full_px),
        "full_em": q(full_px / FONT_PX),
        "fits_one_row_840": full_px <= ZONE,
        "fits_one_row_builder_800": full_px <= BUILDER_MAX,
        "phrases": phrase_rows,
        "pack_840": pack(phrases, ZONE),
        "pack_800": pack(phrases, BUILDER_MAX),
        "word_tokens": words,
        "words_nospace_match_spoken": joined_words == nospace(spoken),
        "words_joined": joined_words,
        "spoken_nospace": nospace(spoken),
    })

cap_texts = [norm_space(c["text"]) for c in cues]
cap_sizes = sorted({c.get("size") for c in cues})
cap_line_join = [norm_space(" ".join(c.get("lines") or [])) for c in cues]
spoken_texts = [ln["spoken"] for ln in lines]

# 19.2 cues only
cues_192 = [c for c in cues if c.get("size") == 19.2]

report = {
    "font": {
        "path": "films/horror-x-ep1-part1-60s/fonts/Kanit-Regular.ttf",
        "unitsPerEm": int(upm),
        "usWinAscent": int(os2.usWinAscent),
        "usWinDescent": int(os2.usWinDescent),
        "cmap_glyphs": len(adv),
        "fontTools": "4.68.0",
        "size_px": 19.2,
        "method": "sum of hmtx advances / unitsPerEm * 19.2, same as build-captions.py char_w",
    },
    "zone_px": 840,
    "builder_text_budget_px": 800,
    "builder_budget_note": "build-captions.py MAX_TEXT_PX = 840 - 2*16 pad - 8 safety = 800. Task fit bar is the 840 zone.",
    "missing_glyphs": sorted(set(missing)),
    "caption_file": {
        "path": "films/horror-x-ep1-part1-60s/captions.js",
        "cue_count": len(cues),
        "sizes": cap_sizes,
        "is_v5_19_2": cap_sizes == [19.2],
        "aggregate_matches_voice_timeline": cap_texts == spoken_texts,
        "lines_join_matches_cue_text": cap_line_join == cap_texts,
        "v5_19_2_cue_count": len(cues_192),
        "v5_comparison": "pending",
    },
    "lines": lines,
}

# longest spoken lines and phrases
ranked_lines = sorted(lines, key=lambda x: -x["full_px"])
ranked_phrases = sorted(
    ({"id": ln["id"], **p} for ln in lines for p in ln["phrases"]),
    key=lambda x: -x["px"],
)
report["longest_lines"] = [
    {"id": x["id"], "px": x["full_px"], "text": x["spoken"], "fits_840": x["fits_one_row_840"]}
    for x in ranked_lines[:3]
]
report["longest_phrases"] = ranked_phrases[:3]

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print("wrote", OUT)
print("missing", report["missing_glyphs"])
print("--- lines ---")
for ln in lines:
    flag = "FIT840" if ln["fits_one_row_840"] else "OVER840"
    flag8 = "FIT800" if ln["fits_one_row_builder_800"] else "OVER800"
    print(f"{ln['id']} {ln['full_px']:8.2f} {flag} {flag8} script_match={ln['script_matches_spoken']} words_match={ln['words_nospace_match_spoken']} phrases={ln['phrase_count']}")
print("--- longest phrases ---")
for p in ranked_phrases[:6]:
    print(f"{p['id']}.{p['i']} {p['px']:8.2f} fit840={p['fits_840']} {p['text']}")
print("caption sizes", cap_sizes, "match voice", cap_texts == spoken_texts)
