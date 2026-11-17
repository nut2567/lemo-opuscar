#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-captions.py - caption generator for horror-x-ep1-part1-60s (v5)

Reads:
  script.json            (12 Thai narration lines; canonical, READ-ONLY here)
  voice-timeline.json    (per-scene speechStart/speechEnd + measured text)
  fonts/Kanit-Regular.ttf (real glyph-advance width measurement, REQUIRED)

Emits (the only files this worker writes):
  captions.js                  ES module exporting renderCaptions(t) + captionAt(t)
  horror-x-ep1-part1-60s.srt    final subtitles, one text line per cue

v5 rules (override the v4 two-line 9.6 px layout):
  - EVERY visible subtitle is ONE row at exactly 19.2 px (2x the v4 9.6 px).
  - One cue = one display line. A spoken line that would overflow the
    x90..930 zone at 19.2 px is split into shorter SEQUENTIAL one-row cues
    at existing space/phrase boundaries (Thai has no intra-word spaces, so
    phrase boundaries are the natural word boundaries). No font shrinking,
    no squeezing, no cropping, no dropped words, no new narration.
  - Timings inside a scene stay proportional to non-space character weight
    across [speechStart, speechEnd], exactly as v4.
  - Widths are measured with real Kanit glyph advances via fontTools. If
    fontTools or the font file is unavailable the build FAILS - there is no
    silent heuristic fallback.
  - Bar: single rounded rect sized for 19.2 px, height = Kanit win-metric
    box + padding, vertically centered at y=1744, bottom <= 1824.
    Width hugs the measured text (PAD_X each side), clamped to the zone.
  - captionAt(t): half-open [start,end); null for t>=60 or no cue.
  - renderCaptions(t): inner SVG string (contents of <g id="captions">).
  - XML-escaped for SVG.

Usage:  python build-captions.py        (fontTools REQUIRED)
Run from anywhere; it resolves paths relative to this file.
"""
import json
import os
import sys
import unicodedata
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR

HERE = os.path.dirname(os.path.abspath(__file__))

SCRIPT_JSON = os.path.join(HERE, "script.json")
VT_JSON = os.path.join(HERE, "voice-timeline.json")
VT_JSON_ALT = os.path.join(HERE, "voice", "voice-timeline.json")
KANIT_TTF = os.path.join(HERE, "fonts", "Kanit-Regular.ttf")
OUT_JS = os.path.join(HERE, "captions.js")
OUT_SRT = os.path.join(HERE, "horror-x-ep1-part1-60s.srt")

DURATION = 60.0
N_SCENES = 12

# ---- caption geometry (pixels, 1080x1920 canvas) ----
CAP_X0, CAP_X1 = 90, 930            # horizontal caption zone (unchanged)
CAP_W = CAP_X1 - CAP_X0            # 840
TEXT_CX = (CAP_X0 + CAP_X1) // 2   # 510  (text-anchor middle)

FONT_PX = Decimal("19.2")          # exactly 2x the v4 9.6 px burn-in
BAR_CENTER_Y = Decimal(1744)       # keep the v4 lower placement
PAD_X = Decimal(16)                # bar side padding around measured text
PAD_Y = Decimal(4)                 # bar top/bottom padding around win box
BAR_RX = Decimal(8)
BAR_STROKE = Decimal("0.8")
SAFE_BOTTOM = Decimal(1824)        # 96 px margin on the 1920 canvas

# Widest allowed single-line text: bar (text + 2*PAD_X) must stay <= CAP_W
# with a small rounding/kerning safety margin.
MAX_TEXT_PX = CAP_W - 2 * PAD_X - Decimal(8)   # 800 px at 19.2 px


def _fmt(value):
    """Shortest plain decimal, exact for the hundredths this layout uses."""
    text = format(Decimal(value), "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def font_win_em():
    """Kanit usWinAscent/Descent over UPM. These include Thai mark stacks."""
    from fontTools.ttLib import TTFont
    tt = TTFont(KANIT_TTF, lazy=True, ignoreDecompileErrors=True)
    upm = Decimal(int(tt["head"].unitsPerEm))
    os2 = tt["OS/2"]
    return (Decimal(int(os2.usWinAscent)) / upm,
            Decimal(int(os2.usWinDescent)) / upm)


WIN_ASCENT_EM, WIN_DESCENT_EM = font_win_em()
WIN_H_PX = (WIN_ASCENT_EM + WIN_DESCENT_EM) * FONT_PX      # ~30.336
BAR_H = WIN_H_PX + 2 * PAD_Y                               # ~38.336
BAR_Y = BAR_CENTER_Y - BAR_H / Decimal(2)                  # ~1724.832
BAR_BOTTOM = BAR_Y + BAR_H                                 # ~1763.168
BASE_Y = BAR_Y + PAD_Y + WIN_ASCENT_EM * FONT_PX           # ~1751.488


def _caption_bounds():
    """Integer bounds covering the bar stroke and the win-metric text box."""
    half = BAR_STROKE / Decimal(2)
    tops = [BAR_Y - half, BASE_Y - WIN_ASCENT_EM * FONT_PX]
    bots = [BAR_BOTTOM + half, BASE_Y + WIN_DESCENT_EM * FONT_PX]
    y0 = int(min(tops).to_integral_value(rounding=ROUND_FLOOR))
    y1 = int(max(bots).to_integral_value(rounding=ROUND_CEILING))
    return y0, y1, min(tops), max(bots)


CAP_Y0, CAP_Y1, CAP_Y0_EXACT, CAP_Y1_EXACT = _caption_bounds()


# ---- Thai width measurement (fontTools REQUIRED, no heuristic fallback) -----
_ADV = None        # {codepoint: advance_in_em}
_ADV_LOADED = False
_FONT_ERROR = None


def _ensure_adv():
    global _ADV, _ADV_LOADED, _FONT_ERROR
    if _ADV_LOADED:
        return
    _ADV_LOADED = True
    try:
        from fontTools.ttLib import TTFont
        tt = TTFont(KANIT_TTF, lazy=True, ignoreDecompileErrors=True)
        cmap = tt.getBestCmap()            # {codepoint: glyphName}
        upm = float(tt["head"].unitsPerEm)
        hmtx = tt["hmtx"]                  # .metrics[glyphName] = (advance, lsb)
        adv = {}
        for cp, gname in cmap.items():
            w = hmtx.metrics.get(gname, (0, 0))[0]
            adv[cp] = w / upm
        _ADV = adv
        sys.stderr.write(
            f"NOTE: measured Thai glyph advances from {os.path.basename(KANIT_TTF)} "
            f"(unitsPerEm={int(upm)}, {len(adv)} glyphs)\n")
    except Exception as e:
        _ADV = False
        _FONT_ERROR = e
        sys.stderr.write(
            f"ERROR: fontTools/Kanit measurement unavailable ({e}); "
            f"v5 captions require real glyph metrics - no heuristic fallback\n")


def char_w(ch):
    _ensure_adv()
    if not _ADV:
        raise RuntimeError(f"Kanit advance metrics unavailable: {_FONT_ERROR}")
    w = _ADV.get(ord(ch))
    if w is None:
        # glyph missing from the font: conservative em estimate, never silent
        # phrase changes - only width bookkeeping for the fit check.
        if ch == " ":
            return 0.30
        if unicodedata.combining(ch) != 0:
            return 0.10
        return 0.60
    return w


def text_w(s):
    """Width of s in em at the caption size (advances sum)."""
    return sum(char_w(c) for c in s)


def text_px(s):
    return Decimal(str(text_w(s))) * FONT_PX


def pack_rows(phrases, max_px):
    """Greedily pack space-separated phrases into single display rows whose
    measured 19.2 px width stays <= max_px. Never breaks a phrase, so no Thai
    word is ever split. A single over-wide phrase is an emergency fallback:
    it is split between codepoints, never inside a combining-mark cluster."""
    rows = []
    cur = []

    def flush():
        nonlocal cur
        if cur:
            rows.append(" ".join(cur))
            cur = []

    for p in phrases:
        if text_px(p) > max_px:
            flush()
            rows.extend(_split_wide_phrase(p, max_px))
            continue
        trial = cur + [p]
        if cur and text_px(" ".join(trial)) > max_px:
            flush()
            cur = [p]
        else:
            cur = trial
    flush()
    return rows


def _split_wide_phrase(phrase, max_px):
    """Emergency only: split one over-wide phrase at codepoint boundaries,
    backing off so a base character and its combining marks stay together."""
    rows = []
    cur = ""
    for ch in phrase:
        if unicodedata.combining(ch) != 0 and not cur:
            cur = ch  # stray mark: keep with what follows
            continue
        if cur and text_px(cur + ch) > max_px:
            rows.append(cur)
            cur = "" if unicodedata.combining(ch) != 0 else ch
            if unicodedata.combining(ch) != 0:
                # mark without a base: attach to previous row end instead
                rows[-1] += ch
        else:
            cur += ch
    if cur:
        rows.append(cur)
    return [r for r in rows if r]


def fmt_ts(s):
    """SRT timestamp HH:MM:SS,mmm (matches core/render/srt.py rounding)."""
    ms = int(round(max(0.0, s) * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def load_voice_timeline():
    """Return (scenes_list, source_label). Falls back to an even 5 s/scene
    synthetic timeline when the real file is absent."""
    path = None
    for cand in (VT_JSON, VT_JSON_ALT):
        if os.path.exists(cand):
            path = cand
            break
    if path is None:
        scenes = []
        for i in range(N_SCENES):
            start = float(i * 5)
            end = float((i + 1) * 5)
            scenes.append({
                "id": f"{i + 1:02d}",
                "start": start,
                "end": end,
                "speechStart": start + 0.12,
                "speechEnd": end - 0.13,   # ~4.75 s speech, ~0.25 s breath gap
            })
        return scenes, "fallback (voice-timeline.json absent - re-run build-captions.py after voice lands)"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    scenes = data.get("scenes", data if isinstance(data, list) else [])
    return scenes, path


def _safe(s, n=46):
    return s[:n].encode("unicode_escape").decode("ascii")


def _bar_for(text):
    """Centered bar rect hugging the measured text, clamped to the zone."""
    w = text_px(text) + 2 * PAD_X
    w = min(w, Decimal(CAP_W))
    x = Decimal(TEXT_CX) - w / Decimal(2)
    return x, w


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    if not os.path.exists(KANIT_TTF):
        sys.stderr.write(f"ERROR: Kanit font missing at {KANIT_TTF}\n")
        sys.exit(1)

    with open(SCRIPT_JSON, encoding="utf-8") as f:
        script = json.load(f)
    if len(script) != N_SCENES:
        sys.stderr.write(f"WARNING: script.json has {len(script)} scenes, expected {N_SCENES}\n")

    vt_scenes, vt_source = load_voice_timeline()
    vt_by_id = {str(s.get("id")): s for s in vt_scenes}
    vt_list = list(vt_scenes)

    cues = []
    chosen_texts = []
    for idx, entry in enumerate(script):
        sid = str(entry["id"])

        v = vt_by_id.get(sid)
        if v is None and idx < len(vt_list):
            v = vt_list[idx]
        if v is None:
            sp_start = idx * 5.0 + 0.12
            sp_end = (idx + 1) * 5.0 - 0.13
        else:
            sp_start = float(v.get("speechStart", v.get("start", idx * 5.0) + 0.12))
            sp_end = float(v.get("speechEnd", v.get("end", (idx + 1) * 5.0) - 0.13))
            if not sp_end > sp_start:
                st = float(v.get("start", idx * 5.0))
                en = float(v.get("end", (idx + 1) * 5.0))
                sp_start = st + 0.12
                sp_end = max(sp_start + 1.0, en - 0.13)

        # Caption the words actually spoken: the measured voice-timeline
        # scene carries the real text when the voice worker overrode it;
        # fall back to script.json only when no measured text exists.
        measured = v.get("text") if isinstance(v, dict) else None
        text = measured if isinstance(measured, str) and measured.strip() else entry["text"]
        chosen_texts.append(text)
        meas_text = " ".join(text.split())

        phrases = [p for p in meas_text.split(" ") if p]
        rows = pack_rows(phrases, MAX_TEXT_PX)
        if not rows:
            sys.stderr.write(f"ERROR: scene {sid} produced no caption rows\n")
            sys.exit(1)

        # proportional timing by non-space character weight across rows
        weights = [sum(1 for ch in row if not ch.isspace()) for row in rows]
        total_w = sum(weights) or 1
        dur = sp_end - sp_start
        t = sp_start
        for bi, row in enumerate(rows):
            share = weights[bi] / total_w
            c_start = t
            c_end = sp_end if bi == len(rows) - 1 else t + dur * share
            c_end = min(c_end, sp_end)
            if c_end <= c_start:
                c_end = c_start + dur * share
            c_end = min(c_end, DURATION)
            bar_x, bar_w = _bar_for(row)
            cues.append({
                "text": row,
                "lines": [row],
                "start": round(c_start, 4),
                "end": round(c_end, 4),
                "size": float(FONT_PX),
                "barX": float(bar_x),
                "barW": float(bar_w),
            })
            t = c_end

    # ---- validation: monotonic, within [0,60), reconstruction, fit --------
    prev_end = 0.0
    for c in cues:
        if c["start"] < prev_end - 1e-6:
            sys.stderr.write(f"WARNING: cue overlap before {c['start']} (prev end {prev_end})\n")
        if c["end"] <= c["start"]:
            sys.stderr.write(f"WARNING: non-positive cue duration at {c['start']}\n")
        if c["end"] > DURATION + 1e-6:
            sys.stderr.write(f"WARNING: cue end {c['end']} exceeds {DURATION}\n")
        prev_end = c["end"]
        if len(c["lines"]) != 1 or c["lines"][0] != c["text"]:
            sys.stderr.write(f"ERROR: cue at {c['start']} is not a single line\n")
            sys.exit(1)
        px = text_px(c["text"])
        if px > MAX_TEXT_PX:
            sys.stderr.write(f"ERROR: cue at {c['start']} overflows: {px}px > {MAX_TEXT_PX}px\n")
            sys.exit(1)
        if not (Decimal(CAP_X0) <= Decimal(str(c["barX"])) and
                Decimal(str(c["barX"])) + Decimal(str(c["barW"])) <= Decimal(CAP_X1)):
            sys.stderr.write(f"ERROR: bar outside x zone at {c['start']}\n")
            sys.exit(1)

    def norm(s):
        return " ".join(s.split())

    if norm(" ".join(c["text"] for c in cues)) != norm(" ".join(chosen_texts)):
        sys.stderr.write("ERROR: cue text does not reconstruct the chosen source text\n")
        sys.exit(1)

    if Decimal(CAP_Y1) > SAFE_BOTTOM or BAR_BOTTOM > SAFE_BOTTOM:
        sys.stderr.write(
            f"ERROR: caption bottom {CAP_Y1} exceeds safe edge {SAFE_BOTTOM}\n")
        sys.exit(1)

    emit_js(cues, vt_source)
    emit_srt(cues)

    print(f"captions built from: {vt_source}")
    print(
        f"geometry v5 one-row font={_fmt(FONT_PX)}px "
        f"bar y={_fmt(BAR_Y)} h={_fmt(BAR_H)} bottom={_fmt(BAR_BOTTOM)} "
        f"center={_fmt(BAR_CENTER_Y)} base={_fmt(BASE_Y)} padX={_fmt(PAD_X)} "
        f"padY={_fmt(PAD_Y)} rx={_fmt(BAR_RX)} stroke={_fmt(BAR_STROKE)}")
    print(
        f"CAPTION_X0={CAP_X0} CAPTION_X1={CAP_X1} "
        f"CAPTION_Y0={CAP_Y0} CAPTION_Y1={CAP_Y1} "
        f"exact={_fmt(CAP_Y0_EXACT)}..{_fmt(CAP_Y1_EXACT)} "
        f"winEm={_fmt(WIN_ASCENT_EM)}/{_fmt(WIN_DESCENT_EM)} "
        f"maxTextPx={_fmt(MAX_TEXT_PX)}")
    print(f"cues: {len(cues)}  (one 19.2px row each; splits only on measured overflow)")
    for c in cues:
        px = text_px(c["text"])
        print(f"  [{c['start']:6.3f}->{c['end']:6.3f}] 1L w={text_w(c['text']):5.2f}em "
              f"({px:5.1f}px) bar={c['barX']:.1f}..{c['barX'] + c['barW']:.1f}  "
              f"{_safe(c['text'])}")


JS_TEMPLATE = r'''// Auto-generated by build-captions.py - do not edit by hand.
// Captions for horror-x-ep1-part1-60s (12 Thai narration lines).
// Source timings: __SOURCE__
// Pure: renderCaptions(t)/captionAt(t) are functions of t only - no DOM,
// fetch, state or randomness. Cue data is a constant baked in below.
//
// Geometry v5: zone x__CAP_X0__..__CAP_X1__, y__CAP_Y0__..__CAP_Y1__.
// Every cue is ONE row at exactly __FONT_PX__ px (2x the v4 9.6 px).
// Bar: y__BAR_Y__ h__BAR_H__ (bottom __BAR_BOTTOM__, center __BAR_CENTER_Y__),
// baseline __BASE_Y__, rx __BAR_RX__, stroke __BAR_STROKE__. Each cue bakes
// its own barX/barW hugging the measured text (PAD_X=__PAD_X__ per side,
// clamped to the zone). Text stays centered at __TEXT_CX__.
// CAPTION_Y0/Y1 cover the bar stroke plus Kanit usWin ascent/descent at
// __FONT_PX__ px (exact outer y__CAP_Y0_EXACT__..__CAP_Y1_EXACT__).
// captionAt uses a half-open [start,end) interval and returns null for
// t>=60 or no active cue.

export const CAPTION_X0 = __CAP_X0__;
export const CAPTION_X1 = __CAP_X1__;
export const CAPTION_Y0 = __CAP_Y0__;
export const CAPTION_Y1 = __CAP_Y1__;
export const CAPTION_DURATION = 60.0;

const CUES = __CUES__;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// half-open [start,end); null for t>=60 or no active cue
export function captionAt(t) {
  t = Number(t);
  if (!(t >= 0) || t >= 60.0) return null;
  for (let i = 0; i < CUES.length; i++) {
    const c = CUES[i];
    if (t >= c.start && t < c.end) return c;
  }
  return null;
}

// inner SVG string for the <g id="captions"> group at time t (seconds)
export function renderCaptions(t) {
  const c = captionAt(t);
  if (!c) return '';
  const sz = c.size || __FONT_PX__;
  const bx = c.barX != null ? c.barX : __TEXT_CX__ - __PAD_X__;
  const bw = c.barW != null ? c.barW : __CAP_W__;
  let s = `<rect x="${bx}" y="__BAR_Y__" width="${bw}" height="__BAR_H__" rx="__BAR_RX__" fill="#142333" fill-opacity="0.55" stroke="#33485f" stroke-opacity="0.35" stroke-width="__BAR_STROKE__"/>`;
  s += `<text x="__TEXT_CX__" y="__BASE_Y__" text-anchor="middle" font-family="Kanit, sans-serif" font-size="${sz}" fill="#EAF4FF">${esc(c.text)}</text>`;
  return s;
}
'''


def emit_js(cues, vt_source):
    data = json.dumps(cues, ensure_ascii=False, indent=1)
    if vt_source.startswith("fallback"):
        src_label = "fallback even 5s/scene timing (voice-timeline.json absent - re-run build-captions.py after voice lands)"
    else:
        src_label = os.path.basename(vt_source) + " (measured speech)"
    tokens = {
        "__SOURCE__": src_label,
        "__CUES__": data,
        "__CAP_X0__": str(CAP_X0),
        "__CAP_X1__": str(CAP_X1),
        "__CAP_Y0__": str(CAP_Y0),
        "__CAP_Y1__": str(CAP_Y1),
        "__CAP_Y0_EXACT__": _fmt(CAP_Y0_EXACT),
        "__CAP_Y1_EXACT__": _fmt(CAP_Y1_EXACT),
        "__FONT_PX__": _fmt(FONT_PX),
        "__BAR_Y__": _fmt(BAR_Y),
        "__BAR_H__": _fmt(BAR_H),
        "__BAR_BOTTOM__": _fmt(BAR_BOTTOM),
        "__BAR_CENTER_Y__": _fmt(BAR_CENTER_Y),
        "__BASE_Y__": _fmt(BASE_Y),
        "__PAD_X__": _fmt(PAD_X),
        "__PAD_Y__": _fmt(PAD_Y),
        "__BAR_RX__": _fmt(BAR_RX),
        "__BAR_STROKE__": _fmt(BAR_STROKE),
        "__TEXT_CX__": str(TEXT_CX),
        "__CAP_W__": str(CAP_W),
    }
    js = JS_TEMPLATE
    for key, value in tokens.items():
        js = js.replace(key, value)
    if "__" in js:
        sys.stderr.write("ERROR: unreplaced caption template token\n")
        sys.exit(1)
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"wrote {OUT_JS} ({len(cues)} cues)")


def emit_srt(cues):
    out = []
    for k, c in enumerate(cues):
        # one text line per cue (v5 single-row captions)
        text = c["text"]
        out.append(f"{k + 1}\n{fmt_ts(c['start'])} --> {fmt_ts(c['end'])}\n{text}\n")
    with open(OUT_SRT, "w", encoding="utf-8") as f:
        f.write("\n".join(out).rstrip("\n") + "\n")
    print(f"wrote {OUT_SRT} ({len(cues)} cues)")


if __name__ == "__main__":
    main()
else:
    # module import (tests): metrics still load lazily via char_w(); a
    # missing font surfaces as RuntimeError on first measurement, not silent.
    pass
