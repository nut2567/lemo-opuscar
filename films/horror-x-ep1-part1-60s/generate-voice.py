"""Generate the 12-line Thai narration for horror-x-ep1-part1-60s.

Free/keyless edge-tts only: th-TH-NiwatNeural (user-approved free Thai voice
replacement for the whole film; the Premwadee backend rejects several lines),
rate tuned inside -15%..+8% so the 12 trimmed lines plus breath gaps fill
exactly 60 s. One clip per line in voice/, a measured
voice-timeline.json and a 60 s speech.wav. No time-stretching, no paid calls.

    python generate-voice.py            # full run (synthesize + schedule + mix)
    python generate-voice.py --rate -5  # force a rate, skip the search

mp3 + word-boundary results are cached under voice/_raw/ keyed by text+rate,
so re-runs at the same rate make no new edge-tts calls. Optional per-line text
overrides live in voice-text-overrides.json ({"01": "..."}) and are recorded in
voice.json; script.json is never edited.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "script.json"
OVERRIDES = ROOT / "voice-text-overrides.json"
VOICE_DIR = ROOT / "voice"
RAW_DIR = VOICE_DIR / "_raw"
TIMELINE_OUT = ROOT / "voice-timeline.json"
VOICE_JSON = ROOT / "voice.json"
SPEECH_OUT = ROOT / "speech.wav"

VOICE = "th-TH-NiwatNeural"  # Premwadee backend rejects several lines; user approved free Thai voice swap
PITCH = "+0Hz"
RATE_MIN, RATE_MAX = -15, 8
SR = 48000
FILM_S = 60.0
FPS = 30

# Scheduling targets (seconds)
TARGET_SPEECH_TOTAL = 57.3        # sum of trimmed line durations
SPEECH_TOTAL_BAND = (56.6, 58.0)  # acceptable spoken coverage
LEAD_FIRST = 0.30                 # silence before line 01
TAIL_LAST = 0.25                  # silence after line 12 (<=0.35 required)
GAP_MIN, GAP_MAX = 0.12, 0.35     # inter-line breath gap

FFMPEG = shutil.which("ffmpeg")
if not FFMPEG:
    try:
        import imageio_ffmpeg
        FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FFMPEG = None
if not FFMPEG:
    raise SystemExit("ffmpeg not found")
FFPROBE = shutil.which("ffprobe")


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


def decode_mp3(mp3_bytes: bytes) -> np.ndarray:
    """Decode mp3 bytes to mono float32 at SR."""
    p = subprocess.run(
        [FFMPEG, "-v", "error", "-i", "pipe:0", "-ac", "1", "-ar", str(SR),
         "-f", "f32le", "pipe:1"],
        input=mp3_bytes, check=True, capture_output=True,
    )
    return np.frombuffer(p.stdout, dtype="<f4").copy()


def write_wav(path: Path, x: np.ndarray, channels: int = 1) -> None:
    if channels == 2:
        data = np.repeat(x[:, None], 2, axis=1)
    else:
        data = x.reshape(-1, 1) if x.ndim == 1 else x
    pcm = (np.clip(data, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def trim_silence(x: np.ndarray, sr: int = SR,
                 frame_s: float = 0.02, hop_s: float = 0.01,
                 rel_thr: float = 0.06, abs_floor: float = 2e-4,
                 pad_s: float = 0.05) -> tuple[np.ndarray, float]:
    """Trim leading/trailing silence. Returns (trimmed, trim_start_s)."""
    fl = max(1, int(frame_s * sr))
    hop = max(1, int(hop_s * sr))
    n_frames = 1 + max(0, (len(x) - fl) // hop)
    if n_frames <= 0:
        return x, 0.0
    rms = np.empty(n_frames, dtype=np.float64)
    for i in range(n_frames):
        seg = x[i * hop:i * hop + fl]
        rms[i] = float(np.sqrt(np.mean(seg * seg))) if len(seg) else 0.0
    peak = float(rms.max())
    if peak <= 0:
        raise ValueError("clip is digital silence")
    thr = max(abs_floor, peak * rel_thr)
    active = np.nonzero(rms > thr)[0]
    if len(active) == 0:
        raise ValueError("no speech-like energy found")
    start = max(0, int(active[0] * hop) - int(pad_s * sr))
    end = min(len(x), int(active[-1] * hop) + fl + int(pad_s * sr))
    return x[start:end].copy(), start / sr


async def synth_once(text: str, rate: int) -> tuple[bytes, list[dict]]:
    """One edge-tts call; returns mp3 bytes and word-boundary metadata."""
    import edge_tts
    comm = edge_tts.Communicate(text, voice=VOICE, rate=f"{rate:+d}%",
                                pitch=PITCH, boundary="WordBoundary")
    audio = bytearray()
    words: list[dict] = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({
                "offset": chunk["offset"],      # 100 ns units
                "duration": chunk["duration"],  # 100 ns units
                "text": chunk["text"],
            })
    if not audio:
        raise RuntimeError("edge-tts returned no audio")
    return bytes(audio), words


async def get_line(idx: int, text: str, rate: int):
    """Return (trimmed float32 audio, words, trim_start_s, cache_stem) for one line."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    key = (f"{idx + 1:02d}-" + VOICE + "-"
           + hashlib.sha256(text.encode("utf-8")).hexdigest()[:10])
    mp3_path = RAW_DIR / f"{key}-r{rate:+d}.mp3"
    meta_path = mp3_path.with_suffix(".words.json")
    if mp3_path.exists() and meta_path.exists():
        mp3_bytes = mp3_path.read_bytes()
        words = json.loads(meta_path.read_text(encoding="utf-8"))
    else:
        last_err = None
        for attempt in range(12):
            try:
                mp3_bytes, words = await asyncio.wait_for(
                    synth_once(text, rate), timeout=90)
                break
            except Exception as e:  # noqa: BLE001 - retry any transport error
                last_err = e
                # edge-tts throttles in bursts; back off harder each attempt
                await asyncio.sleep(min(4.0 + 3.0 * attempt, 30.0)
                                    + (attempt % 3) * 0.7)
        else:
            raise RuntimeError(f"edge-tts failed for line {idx + 1}: {last_err}")
        mp3_path.write_bytes(mp3_bytes)
        meta_path.write_text(json.dumps(words, ensure_ascii=False),
                             encoding="utf-8")
    x = decode_mp3(mp3_bytes)
    xt, trim_start = trim_silence(x)
    return xt, words, trim_start, key


def words_to_clip(words: list[dict], trim_start: float, dur: float) -> list[dict]:
    """Convert stream word offsets (100 ns) to seconds relative to trimmed clip."""
    out = []
    for w in words:
        ws = w["offset"] / 1e7 - trim_start
        we = ws + w["duration"] / 1e7
        if we <= 0.02 or ws >= dur - 0.02:
            continue
        out.append({
            "w": w["text"],
            "s": round(max(0.0, ws), 3),
            "e": round(min(dur, we), 3),
        })
    return out


def schedule(durs: list[float]) -> dict:
    """Place 12 speech intervals inside 60 s with breath gaps.

    Scene i opens where scene i-1's speech ends; the inter-line gap sits at the
    start of the incoming scene. Scene 12 runs to 60.0 with tail <= 0.35.
    """
    total = sum(durs)
    non_speech = FILM_S - total
    n_gaps = len(durs) - 1
    if non_speech < LEAD_FIRST + n_gaps * GAP_MIN - 1e-6:
        raise ValueError(
            f"speech too long: {total:.2f}s leaves {non_speech:.2f}s "
            f"(need >= {LEAD_FIRST + n_gaps * GAP_MIN:.2f}s)")
    if non_speech > LEAD_FIRST + n_gaps * GAP_MAX + 0.35 + 1e-6:
        raise ValueError(
            f"speech too short: {total:.2f}s leaves {non_speech:.2f}s "
            f"(max {LEAD_FIRST + n_gaps * GAP_MAX + 0.35:.2f}s)")

    budget = non_speech - LEAD_FIRST - TAIL_LAST
    gap_each = budget / n_gaps
    if not (GAP_MIN - 1e-9 <= gap_each <= GAP_MAX + 1e-9):
        raise ValueError(f"equal gap {gap_each:.3f}s outside [{GAP_MIN},{GAP_MAX}]")
    gaps = [gap_each] * n_gaps

    scenes = []
    prev_end = 0.0
    for i, d in enumerate(durs):
        gap_before = LEAD_FIRST if i == 0 else gaps[i - 1]
        speech_start = prev_end + gap_before
        speech_end = speech_start + d
        scenes.append({
            "id": f"{i + 1:02d}",
            "start": round(prev_end, 4),
            "end": round(FILM_S if i == len(durs) - 1 else speech_end, 4),
            "text": "",
            "speechStart": round(speech_start, 4),
            "speechEnd": round(speech_end, 4),
            "clip": f"voice/{i + 1:02d}.wav",
            "_dur": d,
        })
        prev_end = speech_end
    # scene i ends exactly where scene i+1 begins (at speech_end of scene i)
    for i in range(len(scenes) - 1):
        scenes[i]["end"] = scenes[i + 1]["start"]
    scenes[-1]["end"] = FILM_S
    return {"scenes": scenes, "gaps": gaps, "lead": LEAD_FIRST,
            "tail": TAIL_LAST, "max_gap": max(gaps), "speech_total": total}


async def measure_all(texts: list[str], rate: int):
    """Fetch/measure all 12 lines at a rate (cached mp3s make reruns cheap)."""
    sem = asyncio.Semaphore(2)

    async def one(i, text):
        async with sem:
            return await get_line(i, text, rate)

    results = await asyncio.gather(*(one(i, t) for i, t in enumerate(texts)))
    # cache key starts with the zero-padded line id, so sort restores line order
    results.sort(key=lambda r: r[3][:2])
    durs = [len(r[0]) / SR for r in results]
    return results, durs


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rate", type=int, default=None,
                    help="force a rate percent instead of searching")
    args = ap.parse_args()

    lines = json.loads(SCRIPT.read_text(encoding="utf-8"))
    overrides = {}
    if OVERRIDES.exists():
        overrides = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    texts = [overrides.get(ln["id"], ln["text"]) for ln in lines]
    if overrides:
        print(f"text overrides active: {sorted(overrides)}", flush=True)

    # --- rate search -------------------------------------------------------
    chosen = None
    best = None
    tried: list[tuple[int, float]] = []
    rate = args.rate if args.rate is not None else -5
    for _ in range(5):
        results, durs = await measure_all(texts, rate)
        total = sum(durs)
        tried.append((rate, round(total, 3)))
        feasible = (FILM_S - total) >= (LEAD_FIRST + (len(durs) - 1) * GAP_MIN - 1e-6)
        in_band = SPEECH_TOTAL_BAND[0] <= total <= SPEECH_TOTAL_BAND[1]
        print(f"rate {rate:+d}% -> speech {total:.2f}s "
              f"(band {SPEECH_TOTAL_BAND}, feasible={feasible})", flush=True)
        score = abs(total - TARGET_SPEECH_TOTAL)
        if best is None or score < best[0]:
            best = (score, results, durs, rate, total)
        if in_band and feasible:
            chosen = (results, durs, rate)
            break
        r0 = rate / 100.0
        est = int(round((total * (1 + r0) / TARGET_SPEECH_TOTAL - 1) * 100.0))
        est = max(RATE_MIN, min(RATE_MAX, est))
        if est == rate or any(est == r for r, _ in tried):
            cands = [r for r in range(RATE_MIN, RATE_MAX + 1)
                     if all(r != t for t, _ in tried)]
            if not cands:
                break
            est = min(cands, key=lambda r: abs(r - est))
        rate = est

    if chosen is None:
        _, results, durs, rate, total = best
        print(f"WARNING: target band not reached; closest rate {rate:+d}% "
              f"gave {total:.2f}s", flush=True)
    else:
        results, durs, rate = chosen

    # --- write per-line clips ----------------------------------------------
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    clip_infos = []
    for idx, (xt, words, trim_start, key) in enumerate(results):
        dur = len(xt) / SR
        clip_path = VOICE_DIR / f"{idx + 1:02d}.wav"
        write_wav(clip_path, xt)
        clip_words = words_to_clip(words, trim_start, dur)
        clip_infos.append({
            "id": f"{idx + 1:02d}",
            "text": texts[idx],
            "rate": rate,
            "clip": f"voice/{idx + 1:02d}.wav",
            "duration_s": round(dur, 4),
            "trim_start_s": round(trim_start, 4),
            "raw_cache": RAW_DIR.name + "/" + key + f"-r{rate:+d}.mp3",
            "word_count": len(clip_words),
            "words": clip_words,
        })
        print(f"  {idx + 1:02d}: {dur:5.2f}s  {texts[idx][:40]}", flush=True)

    # --- schedule -----------------------------------------------------------
    sched = schedule(durs)
    for sc, info in zip(sched["scenes"], clip_infos):
        sc["text"] = info["text"]
        sc["words"] = [
            {"w": w["w"],
             "s": round(sc["speechStart"] + w["s"], 4),
             "e": round(sc["speechStart"] + w["e"], 4)}
            for w in info["words"]
        ]
        del sc["_dur"]

    timeline = {
        "duration": FILM_S,
        "fps": FPS,
        "voice": VOICE,
        "scenes": sched["scenes"],
        "maxGap": round(sched["max_gap"], 4),
    }
    TIMELINE_OUT.write_text(json.dumps(timeline, ensure_ascii=False, indent=2),
                            encoding="utf-8")

    # --- speech.wav -----------------------------------------------------------
    mix = np.zeros((int(round(FILM_S * SR)), 2), dtype=np.float32)
    for sc, (xt, *_rest) in zip(sched["scenes"], results):
        off = int(round(sc["speechStart"] * SR))
        n = min(len(xt), mix.shape[0] - off)
        if n > 0:
            mix[off:off + n, 0] += xt[:n]
            mix[off:off + n, 1] += xt[:n]
    pcm = (np.clip(mix, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(str(SPEECH_OUT), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    dur_check = ffprobe_duration(SPEECH_OUT)

    # --- voice.json -------------------------------------------------------------
    scene_durs = [round(sc["end"] - sc["start"], 4) for sc in sched["scenes"]]
    gaps = [round(sched["scenes"][i]["speechStart"]
                  - sched["scenes"][i - 1]["speechEnd"], 4)
            for i in range(1, len(sched["scenes"]))]
    voice_doc = {
        "voice": VOICE,
        "pitch": PITCH,
        "rate_percent": rate,
        "rates_tried": tried,
        "film_duration_s": FILM_S,
        "sample_rate": SR,
        "channels": 2,
        "lead_first_s": sched["lead"],
        "tail_last_s": sched["tail"],
        "inter_line_gaps_s": gaps,
        "speech_total_s": round(sched["speech_total"], 4),
        "scene_durations_s": scene_durs,
        "speech_wav": "speech.wav",
        "speech_wav_duration_s": round(dur_check, 4),
        "text_overrides": overrides,
        "lines": clip_infos,
    }
    VOICE_JSON.write_text(json.dumps(voice_doc, ensure_ascii=False, indent=2),
                          encoding="utf-8")

    # --- report ------------------------------------------------------------------
    print("\nschedule:")
    for sc in sched["scenes"]:
        print(f"  scene {sc['id']}: {sc['start']:6.2f}-{sc['end']:6.2f} "
              f"({sc['end'] - sc['start']:4.2f}s) speech {sc['speechStart']:6.2f}-"
              f"{sc['speechEnd']:6.2f}")
    print(f"speech total: {sched['speech_total']:.2f}s | "
          f"gaps {min(gaps):.3f}-{max(gaps):.3f}s | "
          f"lead {sched['lead']:.2f} tail {sched['tail']:.2f}")
    print(f"scene durations: {scene_durs}")
    outside = [(sc["id"], round(sc["end"] - sc["start"], 2))
               for sc in sched["scenes"]
               if not (3.8 <= sc["end"] - sc["start"] <= 6.2)]
    if outside:
        print(f"NOTE: scenes outside ~4-6s band: {outside}")
    print(f"speech.wav duration: {dur_check:.3f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
