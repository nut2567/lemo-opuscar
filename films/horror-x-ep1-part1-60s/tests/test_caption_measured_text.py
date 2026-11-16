#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_caption_measured_text.py - regression test for build-captions.py

Bug: main() always captioned script.json entry['text'], ignoring the measured
voice-timeline scene 'text' (the actual spoken words the voice worker may have
overridden to hit the 60 s target). Burn-in/SRT must match the spoken words.

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
    test_script_fallback_when_no_measured_text()
    print("PASS: measured voice-timeline text is captioned; script fallback intact")


if __name__ == "__main__":
    main()
