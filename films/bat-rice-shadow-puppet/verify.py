#!/usr/bin/env python3
"""Final-film QA for bat-rice-shadow-puppet.

Usage:
    python verify.py <mp4> [--out qa]

Writes <out>/QA.json, <out>/contact.jpg and <out>/cut-XX.jpg, prints a
summary, exits non-zero on any hard check failure.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

from PIL import Image
import numpy as np

WIDTH, HEIGHT = 1080, 1920
FPS = 24
DURATION = 59.0
DUR_TOL = 0.05
LUFS_TARGET, LUFS_TOL = -14.0, 1.0
SILENCE_DB, SILENCE_DUR = -45, 0.8
SILENCE_START, SILENCE_END = 0.3, DURATION - 0.3  # 0.3 .. 58.7

# Shot timings from CONTRACT.md -> middle of each shot, for cut-XX.jpg
SHOTS = [
    ("01-hook",      0.0,   4.0),
    ("02-awake",     4.0,   7.77),
    ("03-plant",     7.77, 10.43),
    ("04-first",    10.43, 14.43),
    ("05-orders",   14.43, 20.5),
    ("06-loft",     20.5,  25.13),
    ("07-store",    25.13, 30.53),
    ("08-storm",    30.53, 34.5),
    ("09-delivery", 34.5,  40.23),
    ("10-heavy",    40.23, 45.13),
    ("11-waiting",  45.13, 49.97),
    ("12-stuck",    49.97, 53.17),
    ("13-reveal",   53.17, 57.4),
    ("14-return",   57.4,  59.0),
]


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def ffprobe_json(path):
    p = run(["ffprobe", "-v", "error", "-print_format", "json",
             "-show_format", "-show_streams", path])
    if p.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {p.stderr.strip()}")
    return json.loads(p.stdout)


def parse_fps(rate):
    num, den = rate.split("/")
    return float(num) / float(den)


def run_ffmpeg_filter(path, filter_str, out_path=None, extra=None):
    cmd = ["ffmpeg", "-hide_banner", "-i", path, "-vf", filter_str]
    if extra:
        cmd += extra
    if out_path:
        cmd += [out_path]
    return run(cmd)


def grab_frame(path, t, out_path):
    """Extract one frame at time t (seconds)."""
    return run(["ffmpeg", "-hide_banner", "-y", "-ss", f"{t:.3f}",
                "-i", path, "-frames:v", "1", "-q:v", "2", out_path])


def grab_last_frame(path, out_path):
    """Extract the last frame via -sseof."""
    return run(["ffmpeg", "-hide_banner", "-y", "-sseof", "-0.2",
                "-i", path, "-frames:v", "1", "-q:v", "2", out_path])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mp4")
    ap.add_argument("--out", default="qa")
    args = ap.parse_args()

    mp4 = os.path.abspath(args.mp4)
    outdir = os.path.abspath(args.out)
    os.makedirs(outdir, exist_ok=True)
    qa_path = os.path.join(outdir, "QA.json")

    checks = {}   # name -> {ok, value, detail}
    results = {"input": mp4, "checks": checks, "limitations": []}

    def record(name, ok, value=None, detail=None):
        checks[name] = {"ok": bool(ok), "value": value, "detail": detail}
        tag = "PASS" if ok else "FAIL"
        print(f"[{tag}] {name}: {value}" + (f" — {detail}" if detail else ""))

    def warn(msg):
        print(f"[WARN] {msg}")
        results["limitations"].append(msg)

    # ---------- probe ----------
    info = ffprobe_json(mp4)
    vstreams = [s for s in info.get("streams", []) if s.get("codec_type") == "video"]
    astreams = [s for s in info.get("streams", []) if s.get("codec_type") == "audio"]
    if not vstreams:
        print("FATAL: no video stream")
        sys.exit(2)
    vs = vstreams[0]
    fmt = info.get("format", {})
    dur = float(fmt.get("duration") or vs.get("duration") or 0)
    fps = parse_fps(vs.get("r_frame_rate", "0/1"))
    nb_frames = vs.get("nb_frames")
    try:
        nb_frames = int(nb_frames) if nb_frames else None
    except ValueError:
        nb_frames = None

    record("resolution", vs.get("width") == WIDTH and vs.get("height") == HEIGHT,
           f"{vs.get('width')}x{vs.get('height')}", f"expect {WIDTH}x{HEIGHT}")
    record("fps", abs(fps - FPS) < 0.01, fps, f"expect {FPS}")
    record("duration", abs(dur - DURATION) <= DUR_TOL, round(dur, 4),
           f"expect {DURATION}±{DUR_TOL}")
    if nb_frames:
        expected = int(round(DURATION * FPS))
        record("frames", abs(nb_frames - expected) <= 1, nb_frames,
               f"expect ~{expected}")
    else:
        record("frames", None, None, "nb_frames unavailable (container)")
        checks["frames"]["ok"] = None  # not a hard fail

    # ---------- audio ----------
    if astreams:
        a = astreams[0]
        record("audio_present", True, a.get("codec_name"))
        record("audio_codec", a.get("codec_name") == "aac", a.get("codec_name"))
        sr = int(a.get("sample_rate", 0))
        record("audio_sample_rate", sr == 48000, sr, "expect 48000")
    else:
        record("audio_present", False, None, "no audio stream")
        record("audio_codec", False, None)
        record("audio_sample_rate", False, None)

    # ---------- full decode ----------
    p = run(["ffmpeg", "-v", "error", "-i", mp4, "-f", "null", "-"])
    decode_err = (p.stderr or "").strip()
    record("decode", p.returncode == 0 and not decode_err,
           p.returncode, decode_err[:400] if decode_err else "clean")

    # ---------- black frames ----------
    p = run(["ffmpeg", "-hide_banner", "-i", mp4,
             "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"])
    blacks = re.findall(r"black_start:([\d.]+)\s+black_end:([\d.]+)", p.stderr or "")
    record("black_frames", len(blacks) == 0,
           f"{len(blacks)} black interval(s)",
           "; ".join(f"{a}-{b}s" for a, b in blacks[:10]))

    # ---------- loudness (ebur128) ----------
    p = run(["ffmpeg", "-hide_banner", "-i", mp4, "-af",
             "ebur128=peak=true", "-f", "null", "-"])
    m = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", p.stderr or "")
    lufs = float(m[-1]) if m else None
    if lufs is None:
        record("loudness", False, None, "ebur128 produced no integrated value")
    else:
        record("loudness", abs(lufs - LUFS_TARGET) <= LUFS_TOL,
               round(lufs, 2), f"expect {LUFS_TARGET}±{LUFS_TOL} LUFS")

    # ---------- silence detection ----------
    p = run(["ffmpeg", "-hide_banner", "-i", mp4, "-af",
             f"silencedetect=n={SILENCE_DB}dB:d={SILENCE_DUR}",
             "-vn", "-f", "null", "-"])
    silence_events = []
    cur_start = None
    for line in (p.stderr or "").splitlines():
        ms = re.search(r"silence_start:\s*(-?[\d.]+)", line)
        me = re.search(r"silence_end:\s*(-?[\d.]+)", line)
        if ms:
            cur_start = float(ms.group(1))
        elif me and cur_start is not None:
            silence_events.append((cur_start, float(me.group(1))))
            cur_start = None
    # keep events intersecting [SILENCE_START, SILENCE_END]
    in_window = [(a, b) for a, b in silence_events
                 if b > SILENCE_START and a < SILENCE_END]
    record("silence", len(in_window) == 0,
           f"{len(in_window)} gap(s) in {SILENCE_START}-{SILENCE_END}s",
           "; ".join(f"{a:.2f}-{b:.2f}s" for a, b in in_window[:10]))

    # ---------- loop seam ----------
    with tempfile.TemporaryDirectory() as td:
        f0 = os.path.join(td, "first.png")
        f1 = os.path.join(td, "last.png")
        ok0 = grab_frame(mp4, 0.0, f0).returncode == 0
        ok1 = grab_last_frame(mp4, f1).returncode == 0
        if ok0 and ok1 and os.path.exists(f0) and os.path.exists(f1):
            a = np.asarray(Image.open(f0).convert("RGB"), dtype=np.int16)
            b = np.asarray(Image.open(f1).convert("RGB"), dtype=np.int16)
            if a.shape == b.shape:
                seam = float(np.abs(a - b).mean())
                record("loop_seam", seam < 20.0, round(seam, 2),
                       "mean abs RGB diff first vs last frame")
            else:
                record("loop_seam", False, None, f"frame size mismatch {a.shape} vs {b.shape}")
        else:
            record("loop_seam", False, None, "frame extraction failed")

    # ---------- contact sheet (1 frame every 2 s, tile 6 cols, width 180) ----------
    sheet_path = os.path.join(outdir, "contact.jpg")
    p = run(["ffmpeg", "-hide_banner", "-y", "-i", mp4,
             "-vf", "fps=1/2,scale=180:-2,tile=6x5:margin=4:padding=4",
             "-frames:v", "1", "-q:v", "3", sheet_path])
    record("contact_sheet", p.returncode == 0 and os.path.exists(sheet_path),
           sheet_path)

    # ---------- cut frames at shot midpoints ----------
    cut_files = []
    cut_fail = 0
    for i, (name, t0, t1) in enumerate(SHOTS, 1):
        mid = (t0 + t1) / 2
        fn = os.path.join(outdir, f"cut-{i:02d}.jpg")
        r = grab_frame(mp4, mid, fn)
        if r.returncode == 0 and os.path.exists(fn):
            cut_files.append(fn)
        else:
            cut_fail += 1
            print(f"[WARN] cut-{i:02d} extraction failed at t={mid:.3f}: {r.stderr.strip()[:200]}")
    record("cut_frames", cut_fail == 0, f"{len(cut_files)}/{len(SHOTS)}")

    results["files"] = {
        "qa_json": qa_path,
        "contact": sheet_path,
        "cuts": cut_files,
    }
    results["summary"] = {
        "hard_fail": [k for k, v in checks.items() if v["ok"] is False],
        "soft_missing": [k for k, v in checks.items() if v["ok"] is None],
    }
    results["limitations"].append(
        "loop_seam threshold (20 mean-abs-RGB) and blackdetect pix_th are heuristics, "
        "not calibrated to this film's grade; review contact.jpg/cut-XX.jpg visually.")

    with open(qa_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    hard = results["summary"]["hard_fail"]
    print(f"\nQA.json -> {qa_path}")
    print(f"hard failures: {hard if hard else 'none'}")
    sys.exit(1 if hard else 0)


if __name__ == "__main__":
    main()
