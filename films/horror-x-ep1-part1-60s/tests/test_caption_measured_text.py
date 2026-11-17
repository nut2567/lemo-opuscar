#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_caption_measured_text.py - regression test for build-captions.py

Bug: main() always captioned script.json entry['text'], ignoring the measured
voice-timeline scene 'text' (the actual spoken words the voice worker may have
overridden to hit the 60 s target). Burn-in/SRT must match the spoken words.

v5: every cue is ONE row at exactly 19.2 px; over-wide spoken lines split into
sequential one-row cues at phrase boundaries (never shrinking the font).

These tests run build-captions.main() against TEMPORARY script/voice-timeline/
output files so no project files are touched. Run:

    python tests/test_caption_measured_text.py
"""
import importlib.util
import json
import os
import re
import sys
import tempfile
from decimal import Decimal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BC_PATH = os.path.join(ROOT, "build-captions.py")


def load_module():
    spec = importlib.util.spec_from_file_location("build_captions", BC_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def norm(s):
    return " ".join(s.split())


def make_script():
    # two scenes; scene "01" will get a measured-text override
    return [
        {"id": "01", "text": "SCRIPT LINE ONE ORIGINAL WORDS", "title": "t", "direction": "d"},
        {"id": "02", "text": "SCRIPT LINE TWO ORIGINAL WORDS", "title": "t", "direction": "d"},
    ]


def make_vt(with_text=True):
    scenes = [
        {
            "id": "01",
            "start": 0.0,
            "end": 10.0,
            "speechStart": 0.3,
            "speechEnd": 9.7,
            "clip": "voice/01.wav",
        },
        {
            "id": "02",
            "start": 10.0,
            "end": 20.0,
            "speechStart": 10.3,
            "speechEnd": 19.7,
            "clip": "voice/02.wav",
        },
    ]
    if with_text:
        scenes[0]["text"] = "MEASURED SPOKEN TEXT FOR SCENE ONE"
        # scene 02 deliberately has NO text -> script fallback must be used
    return {"duration": 20.0, "scenes": scenes}


def run_build(tmpdir, with_text=True):
    """Run build-captions.main() fully inside tmpdir fixtures. Returns
    (module, captions.js text, srt text, stderr_text)."""
    mod = load_module()

    script_path = os.path.join(tmpdir, "script.json")
    vt_path = os.path.join(tmpdir, "voice-timeline.json")
    vt_alt = os.path.join(tmpdir, "voice", "voice-timeline.json")
    out_js = os.path.join(tmpdir, "captions.js")
    out_srt = os.path.join(tmpdir, "film.srt")

    with open(script_path, "w", encoding="utf-8") as f:
        json.dump(make_script(), f, ensure_ascii=False)
    with open(vt_path, "w", encoding="utf-8") as f:
        json.dump(make_vt(with_text=with_text), f, ensure_ascii=False)

    mod.SCRIPT_JSON = script_path
    mod.VT_JSON = vt_path
    mod.VT_JSON_ALT = vt_alt
    mod.OUT_JS = out_js
    mod.OUT_SRT = out_srt

    import io
    import contextlib
    err = io.StringIO()
    with contextlib.redirect_stderr(err):
        mod.main()

    with open(out_js, encoding="utf-8") as f:
        js = f.read()
    with open(out_srt, encoding="utf-8") as f:
        srt = f.read()
    return mod, js, srt, err.getvalue()


def srt_cue_texts(srt):
    """Return list of cue bodies (text after the --> line)."""
    blocks = re.split(r"\n\s*\n", srt.strip())
    out = []
    for b in blocks:
        lines = b.split("\n")
        if len(lines) >= 3 and "-->" in lines[1]:
            out.append("\n".join(lines[2:]))
    return out


def test_measured_text_used():
    with tempfile.TemporaryDirectory() as td:
        mod, js, srt, err = run_build(td, with_text=True)

        cues = srt_cue_texts(srt)
        joined = norm(" ".join(cues))

        # measured text for scene 01 must appear
        assert "MEASURED SPOKEN TEXT FOR SCENE ONE" in joined, \
            f"SRT missing measured text; got: {joined!r}"
        # script text for scene 01 must NOT appear
        assert "SCRIPT LINE ONE ORIGINAL WORDS" not in joined, \
            f"SRT still uses script text for overridden scene: {joined!r}"
        # scene 02 (no measured text) falls back to script
        assert "SCRIPT LINE TWO ORIGINAL WORDS" in joined, \
            f"SRT missing script fallback for scene 02: {joined!r}"

        # captions.js cue data must carry the measured text too
        assert "MEASURED SPOKEN TEXT FOR SCENE ONE" in js
        assert "SCRIPT LINE ONE ORIGINAL WORDS" not in js

        # reconstruction validation must compare against the CHOSEN source:
        # measured(01) + script(02). With the fix there is no mismatch warning.
        expected = norm("MEASURED SPOKEN TEXT FOR SCENE ONE SCRIPT LINE TWO ORIGINAL WORDS")
        assert norm(joined) == expected
        assert "does not reconstruct" not in err, f"unexpected warning: {err}"

        # timings preserved: first cue starts near speechStart 0.3
        first = re.search(r"(\d\d):(\d\d):(\d\d),(\d\d\d) -->", srt)
        assert first is not None
        t0 = (int(first.group(1)) * 3600 + int(first.group(2)) * 60
              + int(first.group(3)) + int(first.group(4)) / 1000.0)
        assert 0.2 <= t0 <= 0.5, f"first cue start {t0} not near 0.3"

        # v5: every SRT cue body is exactly ONE text line (no second row)
        for body in cues:
            assert "\n" not in body, f"SRT cue has more than one text line: {body!r}"


def test_v5_geometry_and_real_font():
    """v5: one row at exactly 19.2 px, lower placement, Kanit marks covered.

    Real fontTools/Kanit advances are required (no heuristic fallback).
    The bar is sized for 19.2 px and stays inside the safe bottom y=1824.
    """
    mod = load_module()
    mod._ensure_adv()
    assert isinstance(mod._ADV, dict) and len(mod._ADV) > 100, \
        "real Kanit advances required - build must fail without fontTools"

    assert mod.FONT_PX == Decimal("19.2")
    assert mod.CAP_X0 == 90 and mod.CAP_X1 == 930
    assert mod.CAP_W == 840
    assert mod.TEXT_CX == 510
    assert mod.SAFE_BOTTOM == Decimal(1824)

    # Bar: win-metric box (1.18+0.40 em * 19.2 = 30.336) + 2*4 pad = 38.336,
    # centered at y=1744 -> y1724.832, bottom 1763.168.
    ascent, descent = mod.font_win_em()
    assert ascent >= Decimal("1.06"), f"win ascent {ascent} does not cover stacked Thai marks"
    assert mod.WIN_H_PX == (ascent + descent) * mod.FONT_PX
    assert abs(mod.BAR_H - (mod.WIN_H_PX + 8)) < Decimal("1e-9")
    assert mod.BAR_CENTER_Y == Decimal(1744)
    assert abs(mod.BAR_Y - Decimal("1724.832")) < Decimal("1e-6")
    assert abs(mod.BAR_BOTTOM - Decimal("1763.168")) < Decimal("1e-6")
    assert mod.BASE_Y == mod.BAR_Y + mod.PAD_Y + ascent * mod.FONT_PX

    # Integer bounds cover bar stroke and win-metric ink at 19.2 px.
    assert mod.CAP_Y0 == 1724 and mod.CAP_Y1 == 1764
    assert mod.CAP_Y0 <= mod.CAP_Y0_EXACT <= mod.BASE_Y - ascent * mod.FONT_PX
    assert mod.CAP_Y1 >= mod.CAP_Y1_EXACT >= max(
        mod.BAR_BOTTOM + mod.BAR_STROKE / 2,
        mod.BASE_Y + descent * mod.FONT_PX)
    assert mod.CAP_Y1 <= 1824
    assert mod.BAR_BOTTOM <= mod.SAFE_BOTTOM

    with tempfile.TemporaryDirectory() as td:
        _mod, js, srt, err = run_build(td, with_text=True)
        assert "CAPTION_X0 = 90" in js and "CAPTION_X1 = 930" in js
        assert "CAPTION_Y0 = 1724" in js and "CAPTION_Y1 = 1764" in js
        assert 'font-size="${sz}"' in js and 'text-anchor="middle"' in js
        # exactly one <text> element is emitted per render (single row)
        assert js.count("<text") == 1, "renderCaptions must emit a single text node"
        # Short English fixtures fit on one row; every cue is 19.2 px.
        assert '"size": 19.2' in js
        assert '"size": 9.6' not in js and '"size": 8.4' not in js and '"size": 9' not in js
        # one display line per cue in the baked data
        assert '"lines": [\n   "MEASURED SPOKEN TEXT FOR SCENE ONE"\n  ]' in js
        assert "does not reconstruct" not in err
        # Timing and wording stay on the spoken interval; only geometry changed.
        assert "MEASURED SPOKEN TEXT FOR SCENE ONE" in norm(srt)
        assert "00:00:00,300 -->" in srt


def test_pack_rows_splits_only_on_measured_overflow():
    """An over-wide spoken line splits into sequential one-row cues at phrase
    boundaries; every row fits and the words reconstruct exactly."""
    mod = load_module()
    mod._ensure_adv()
    assert isinstance(mod._ADV, dict)

    # Build a line of repeated Thai phrases far wider than MAX_TEXT_PX.
    phrase = "เหลือแต่เสียงเครื่องซักผ้าหมุนอยู่ข้างตัวฉัน"
    text = " ".join([phrase] * 12)
    phrases = [p for p in text.split(" ") if p]
    rows = mod.pack_rows(phrases, mod.MAX_TEXT_PX)
    assert len(rows) > 1, "over-wide line must split into multiple rows"
    for row in rows:
        assert "\n" not in row
        px = mod.text_px(row)
        assert px <= mod.MAX_TEXT_PX, f"row still overflows: {px}px > {mod.MAX_TEXT_PX}px"
    assert norm(" ".join(rows)) == norm(text), "split must not drop or reorder words"

    # A line that fits stays a single row (join of v4 lines -> one row).
    short = "นี่คือคืนสุดท้าย"
    assert mod.pack_rows(short.split(" "), mod.MAX_TEXT_PX) == [short]

    # The real film's longest spoken line (scene 04) fits one row at 19.2 px.
    import json as _json
    vt_path = os.path.join(ROOT, "voice-timeline.json")
    if os.path.exists(vt_path):
        vt = _json.load(open(vt_path, encoding="utf-8"))
        for s in vt.get("scenes", []):
            spoken = " ".join(str(s.get("text", "")).split())
            if not spoken:
                continue
            rows = mod.pack_rows(spoken.split(" "), mod.MAX_TEXT_PX)
            assert len(rows) >= 1
            for row in rows:
                assert mod.text_px(row) <= mod.MAX_TEXT_PX
            assert norm(" ".join(rows)) == norm(spoken)


def test_script_fallback_when_no_measured_text():
    with tempfile.TemporaryDirectory() as td:
        # voice-timeline present but NEITHER scene carries 'text'
        mod, js, srt, err = run_build(td, with_text=False)
        joined = norm(" ".join(srt_cue_texts(srt)))
        assert "SCRIPT LINE ONE ORIGINAL WORDS" in joined
        assert "SCRIPT LINE TWO ORIGINAL WORDS" in joined
        assert "MEASURED" not in joined
        assert "does not reconstruct" not in err, f"unexpected warning: {err}"


def main():
    test_measured_text_used()
    test_v5_geometry_and_real_font()
    test_pack_rows_splits_only_on_measured_overflow()
    test_script_fallback_when_no_measured_text()
    print("PASS: measured voice-timeline text is captioned; v5 one-row 19.2px geometry "
          "fits Kanit marks; overflow splits at phrase boundaries; script fallback intact")


if __name__ == "__main__":
    main()
