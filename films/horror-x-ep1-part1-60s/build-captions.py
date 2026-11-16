#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-captions.py - caption generator for horror-x-ep1-part1-60s

Reads:
  script.json            (12 Thai narration lines; canonical, READ-ONLY here)
  voice-timeline.json    (per-scene speechStart/speechEnd; produced by the
                          voice worker concurrently - OPTIONAL at this stage)
  fonts/Kanit-Regular.ttf (for real glyph-advance width measurement)

Emits (the only files this worker writes):
  captions.js                  ES module exporting renderCaptions(t) + captionAt(t)
  horror-x-ep1-part1-60s.srt    final subtitles, consistent with the burn-in

When voice-timeline.json is absent the script falls back to a deterministic
even 5 s/scene timing so a captions.js + SRT still exist; re-run the script
after the voice lands and it picks up the real measured timings. There is no
wait-loop: the script runs once and exits.

Caption rules (from the task brief):
  - 12 spoken Thai lines, split into shorter consecutive cues WHERE NEEDED
    (a line that overflows two display lines splits into at most 2 cues);
    each cue is at most 2 visual lines.
  - Splits happen only at the spaces/punctuation already in the text, so no
    Thai word is ever broken (Thai has no intra-word spaces).
  - Timings within a line are proportional to phrase weight (non-space char
    count), measured against the scene's speech interval.
  - Kanit, 40-46 px (44 px default; 42/40 only if a single long phrase forces
    it), offwhite #EAF4FF on a translucent navy bar.
  - Caption area x90..930, y1480..1690 (bar drawn inside; never above y1480).
  - captionAt(t): half-open [start,end); null for t>=60 or no cue.
  - renderCaptions(t): inner SVG string (contents of <g id="captions">).
  - XML-escaped for SVG; Thai widths handled by real font metrics (or a
    conservative heuristic if fontTools/the font file is missing) so no
    rendered line overflows x90..930.

Usage:  python build-captions.py        (fontTools optional; recommended)
Run from anywhere; it resolves paths relative to this file.
"""
import json
import os
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))

SCRIPT_JSON = os.path.join(HERE, "script.json")
VT_JSON = os.path.join(HERE, "voice-timeline.json")
VT_JSON_ALT = os.path.join(HERE, "voice", "voice-timeline.json")
KANIT_TTF = os.path.join(HERE, "fonts", "Kanit-Regular.ttf")
OUT_JS = os.path.join(HERE, "captions.js")
OUT_SRT = os.path.join(HERE, "horror-x-ep1-part1-60s.srt")

DURATION = 60.0
N_SCENES = 12

# ---- caption geometry (pixels) ----
CAP_X0, CAP_X1 = 90, 930            # horizontal caption zone
CAP_Y0, CAP_Y1 = 1480, 1690        # vertical caption zone
CAP_W = CAP_X1 - CAP_X0            # 840
TEXT_CX = (CAP_X0 + CAP_X1) // 2   # 510  (text-anchor middle)

# font geometry
SIZE_DEFAULT = 44
SIZE_MIN = 40
# two display lines
BAR2_Y, BAR2_H = 1510, 160          # y 1510..1670  (inside 1480..1690)
BASE2_Y, LINE_GAP = 1562, 60       # baselines 1562 / 1622
# one display line
BAR1_Y, BAR1_H = 1562, 66          # y 1562..1628
BASE1_Y = 1604

# ---- Thai width measurement -------------------------------------------------
# Primary path: real glyph advance widths read from Kanit-Regular.ttf with
# fontTools. The browser lays out Thai text with these same advances (GPOS mark
# positioning stacks combining marks without changing the pen advance), so the
# measured width matches the burn-in. Fallback: a conservative per-character
# model so plain python (no fontTools) still produces a safe fit.
_ADV = None        # {codepoint: advance_in_em} once loaded, or False
_ADV_LOADED = False


def _ensure_adv():
    global _ADV, _ADV_LOADED
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
        sys.stderr.write(
            f"NOTE: fontTools/font unavailable ({e}); using heuristic Thai widths\n")


def char_w(ch):
    _ensure_adv()
    if _ADV:
        w = _ADV.get(ord(ch))
        if w is not None:
            return w
        # glyph not in font: fall through to a conservative class estimate
    if ch == " ":
        return 0.28
    if unicodedata.combining(ch) != 0:
        return 0.10
    cp = ord(ch)
    if 0x0E01 <= cp <= 0x0E7F:
        return 0.62
    return 0.55


def text_w(s):
    """Width of s in em at the chosen font size (advances sum)."""
    return sum(char_w(c) for c in s)


# wrap target (em): a small safety margin inside the 840 px zone at 44 px
# (840/44 = 19.091 em hard limit). 18.7 em ~ 822.8 px (~17 px margin).
MAX_LINE_EM = 18.7


def wrap_lines(phrases, max_em):
    """Greedy word-wrap at phrase (space) boundaries. Never breaks a phrase,
    so no Thai word is ever split."""
    lines = []
    cur = []
    for p in phrases:
        trial = cur + [p]
        if cur and text_w(" ".join(trial)) > max_em:
            lines.append(" ".join(cur))
            cur = [p]
        else:
            cur = trial
    if cur:
        lines.append(" ".join(cur))
    return lines


def split_into_cues(text):
    """Return a list of cue blocks (each a list of display lines) for one
    spoken line. 1 cue if it fits in <= 2 lines, else 2 cues (each <= 2 lines).
    Splits only at existing spaces."""
    phrases = text.split(" ")
    if any(p == "" for p in phrases):
        phrases = [p for p in phrases if p != ""]
    lines = wrap_lines(phrases, MAX_LINE_EM)
    if len(lines) <= 2:
        return [lines]
    # need 2 cues: choose a phrase split where both halves fit in 2 lines,
    # balanced by total width.
    best = None
    for k in range(1, len(phrases)):
        l1 = wrap_lines(phrases[:k], MAX_LINE_EM)
        l2 = wrap_lines(phrases[k:], MAX_LINE_EM)
        if len(l1) <= 2 and len(l2) <= 2:
            w1 = text_w(" ".join(phrases[:k]))
            w2 = text_w(" ".join(phrases[k:]))
            score = abs(w1 - w2)
            if best is None or score < best[0]:
                best = (score, [l1, l2])
    if best is None:
        # extremely long line: split by char-weight midpoint as a fallback
        cum = 0.0
        target = text_w(text) / 2.0
        k = 1
        for i, p in enumerate(phrases):
            cum += text_w(p) + 0.28
            if cum >= target:
                k = i + 1
                break
        k = max(1, min(len(phrases) - 1, k))
        best = (0.0, [wrap_lines(phrases[:k], MAX_LINE_EM),
                      wrap_lines(phrases[k:], MAX_LINE_EM)])
    return best[1]


def choose_size(cue_lines):
    """Pick the largest font size in {44,42,40} such that every line in the
    cue stays within the 840 px hard pixel budget. Default 44; step down only
    if a single long phrase forces it."""
    widest = max(text_w(ln) for ln in cue_lines) if cue_lines else 0.0
    for size in (44, 42, 40):
        if widest * size <= CAP_W:
            return size
    return SIZE_MIN


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


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

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
        meas_text = " ".join(text.split()) if "  " in text else text

        cue_blocks = split_into_cues(meas_text)

        # proportional timing by non-space character weight
        weights = [sum(1 for ch in " ".join(blk) if not ch.isspace()) for blk in cue_blocks]
        total_w = sum(weights) or 1
        dur = sp_end - sp_start
        t = sp_start
        for bi, blk in enumerate(cue_blocks):
            share = weights[bi] / total_w
            c_start = t
            c_end = sp_end if bi == len(cue_blocks) - 1 else t + dur * share
            c_end = min(c_end, sp_end)
            if c_end <= c_start:
                c_end = c_start + dur * share
            c_end = min(c_end, DURATION)
            cues.append({
                "text": " ".join(blk),
                "lines": blk,
                "start": round(c_start, 4),
                "end": round(c_end, 4),
                "size": choose_size(blk),
            })
            t = c_end

    # ---- validation: monotonic, within [0,60), reconstruction ----
    prev_end = 0.0
    for c in cues:
        if c["start"] < prev_end - 1e-6:
            sys.stderr.write(f"WARNING: cue overlap before {c['start']} (prev end {prev_end})\n")
        if c["end"] <= c["start"]:
            sys.stderr.write(f"WARNING: non-positive cue duration at {c['start']}\n")
        if c["end"] > DURATION + 1e-6:
            sys.stderr.write(f"WARNING: cue end {c['end']} exceeds {DURATION}\n")
        prev_end = c["end"]

    def norm(s):
        return " ".join(s.split())

    if norm(" ".join(c["text"] for c in cues)) != norm(" ".join(chosen_texts)):
        sys.stderr.write("WARNING: cue text does not reconstruct the chosen source text\n")

    emit_js(cues, vt_source)
    emit_srt(cues)

    print(f"captions built from: {vt_source}")
    print(f"cues: {len(cues)}  (lines split into multiple cues where needed)")
    for c in cues:
        nlines = len(c["lines"])
        w = max(text_w(ln) for ln in c["lines"])
        px = w * c["size"]
        print(f"  [{c['start']:6.3f}->{c['end']:6.3f}] {nlines}L w={w:5.2f}em "
              f"({px:5.1f}px@{c['size']})  {_safe(c['text'])}")


JS_TEMPLATE = r'''// Auto-generated by build-captions.py - do not edit by hand.
// Captions for horror-x-ep1-part1-60s (12 Thai narration lines).
// Source timings: __SOURCE__
// Pure: renderCaptions(t)/captionAt(t) are functions of t only - no DOM,
// fetch, state or randomness. Cue data is a constant baked in below.
//
// Geometry: caption zone x90..930, y1480..1690.
// Each cue is at most 2 display lines of Kanit 40-44px, offwhite #EAF4FF on a
// translucent navy bar. captionAt uses a half-open [start,end) interval and
// returns null for t>=60 or no active cue.

export const CAPTION_X0 = 90;
export const CAPTION_X1 = 930;
export const CAPTION_Y0 = 1480;
export const CAPTION_Y1 = 1690;
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
  const sz = c.size || 44;
  const n = c.lines.length;
  const two = n >= 2;
  const barY = two ? 1510 : 1562;
  const barH = two ? 160 : 66;
  const baseY = two ? 1562 : 1604;
  const gap = 60;
  let s = `<rect x="90" y="${barY}" width="840" height="${barH}" rx="18" fill="#142333" fill-opacity="0.82" stroke="#33485f" stroke-opacity="0.5" stroke-width="1"/>`;
  for (let i = 0; i < n; i++) {
    s += `<text x="510" y="${baseY + i * gap}" text-anchor="middle" font-family="Kanit, sans-serif" font-size="${sz}" fill="#EAF4FF">${esc(c.lines[i])}</text>`;
  }
  return s;
}
'''


def emit_js(cues, vt_source):
    data = json.dumps(cues, ensure_ascii=False, indent=1)
    if vt_source.startswith("fallback"):
        src_label = "fallback even 5s/scene timing (voice-timeline.json absent - re-run build-captions.py after voice lands)"
    else:
        src_label = os.path.basename(vt_source) + " (measured speech)"
    js = JS_TEMPLATE.replace("__CUES__", data).replace("__SOURCE__", src_label)
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"wrote {OUT_JS} ({len(cues)} cues)")


def emit_srt(cues):
    out = []
    for k, c in enumerate(cues):
        text = "\n".join(c["lines"])
        out.append(f"{k + 1}\n{fmt_ts(c['start'])} --> {fmt_ts(c['end'])}\n{text}\n")
    with open(OUT_SRT, "w", encoding="utf-8") as f:
        f.write("\n".join(out).rstrip("\n") + "\n")
    print(f"wrote {OUT_SRT} ({len(cues)} cues)")


if __name__ == "__main__":
    main()
