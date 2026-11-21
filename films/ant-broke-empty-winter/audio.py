"""Generate free Thai narration, timed captions, and the original sound bed."""
import asyncio
import io
import json
import math
import subprocess
import wave
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parent
RATE, FPS = 48000, 30
SOURCE = json.loads((ROOT / "story.json").read_text(encoding="utf-8-sig"))
CACHE = ROOT / "assets" / "speech"
CACHE.mkdir(parents=True, exist_ok=True)
VOICE = "th-TH-NiwatNeural"


async def get_audio(semaphore, shot, index, line):
    filename = CACHE / f"{shot}-{index}.mp3"
    if filename.exists() and filename.stat().st_size > 1000:
        return filename
    async with semaphore:
        for attempt in range(4):
            try:
                data = bytearray()
                request = edge_tts.Communicate(line, VOICE, rate="-12%", pitch="-2Hz")
                async for item in request.stream():
                    if item["type"] == "audio":
                        data.extend(item["data"])
                if len(data) < 1000:
                    raise ValueError("Empty narration")
                filename.write_bytes(data)
                return filename
            except (OSError, ValueError, edge_tts.exceptions.NoAudioReceived):
                if attempt == 3:
                    raise
                await asyncio.sleep(1 + attempt)


def decode(filename):
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(filename), "-ac", "1", "-ar", str(RATE),
        "-f", "f32le", "-"
    ])
    pcm = np.frombuffer(raw, dtype="<f4")
    active = np.flatnonzero(np.abs(pcm) > max(0.002, np.max(np.abs(pcm)) * .018))
    if not len(active):
        raise ValueError(f"Silent phrase: {filename.name}")
    return pcm[max(0, active[0] - 2400):active[-1] + 4800]


def stamp(seconds):
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_wav(path, pcm):
    with wave.open(str(path), "wb") as output:
        output.setparams((pcm.shape[1], 2, RATE, 0, "NONE", "not compressed"))
        output.writeframes((np.clip(pcm, -.999, .999) * 32767).astype("<i2").tobytes())


def sound_design(voice, shots):
    rng = np.random.default_rng(197)
    mix = np.column_stack((voice, voice)) * 1.25
    bed = np.zeros_like(mix)

    def cue(start, seconds, kind, gain, pan=0, pitch=0):
        length = round(RATE * seconds)
        offset = round(RATE * start)
        if offset < 0 or offset + length > len(bed):
            return
        t = np.arange(length, dtype=np.float32) / RATE
        noise = rng.normal(0, 1, length)
        if kind in ("air", "snow"):
            resolution = 78 if kind == "air" else 230
            coarse = rng.normal(0, 1, math.ceil(seconds * resolution) + 1)
            sound = np.interp(t * resolution, np.arange(len(coarse)), coarse)
            sound *= np.sin(np.pi * t / seconds) ** 2
        elif kind == "wood":
            sound = (.44 * noise + np.sin(2*np.pi*(78*t - 22*t*t))) * np.exp(-19*t)
        elif kind == "paper":
            sound = np.diff(noise, prepend=noise[0]) * .27 * np.exp(-7*t)
        elif kind == "glass":
            sound = (np.sin(2*np.pi*1410*t) + .34*np.sin(2*np.pi*1920*t)) * np.exp(-18*t)
        else:
            f = 440 * 2 ** ((pitch-69)/12)
            sound = (np.sin(2*np.pi*f*t) + .24*np.sin(2*np.pi*f*2.003*t)*np.exp(-3*t))
            sound *= np.exp(-2.3*t) * np.minimum(1, (seconds-t)*6)
        sound *= np.minimum(t*190, 1) * gain
        bed[offset:offset+length, 0] += sound * math.sqrt((1-pan)*.5)
        bed[offset:offset+length, 1] += sound * math.sqrt((1+pan)*.5)

    for shot in shots:
        sid = int(shot["id"])
        start, duration = shot["start"], shot["end"]-shot["start"]
        icy = sid in (1, 15, 16, 17, 18, 19, 20, 21)
        cue(start, duration, "air", .021 if icy else .009)
        tones = [45, 52, 57, 59] if icy else [48, 55, 60, 64]
        if sid not in (14, 17, 20):
            for index in range(int(duration/1.35)):
                cue(start+.2+index*1.35, 1.28, "pluck", .046, (-1)**index*.24, tones[(sid+index)%4])
        if sid in (2, 3, 12, 15):
            for index in range(8):
                cue(start+.5+index*.42, .25, "snow" if icy else "paper", .045, index/7-.5)
        if sid in (5, 7, 11, 12, 16):
            cue(start+duration*.33, .42, "wood", .19, -.15)
        if sid in (6, 8, 9, 10, 14, 17):
            for index in range(2 if sid in (6,14,17) else 6):
                cue(start+duration*.26+index*.23, .18, "glass", .06, (-1)**index*.36)
        if sid == 20:
            for i, pitch in enumerate((57, 45, 33)):
                cue(start+duration*.59+i*.10, min(1.05, duration*.24), "pluck", .11, 0, pitch)
    # Duck the score and foley against measured speech energy.
    rms = np.sqrt(np.mean(voice.reshape(-1, RATE//FPS)**2, axis=1))
    envelope = np.interp(np.arange(len(voice)), np.arange(len(rms))*RATE/FPS,
                         np.convolve(np.clip(rms*13, 0, .67), np.ones(9)/9, mode="same"))
    return mix + bed * (1-envelope[:, None])


async def main():
    semaphore = asyncio.Semaphore(4)
    tasks = [(s["id"], i, line) for s in SOURCE["shots"] for i, line in enumerate(s["phrases"])]
    files = await asyncio.gather(*(get_audio(semaphore, *item) for item in tasks))
    audio = iter(decode(filename) for filename in files)
    measured = [(s, [next(audio) for _ in s["phrases"]]) for s in SOURCE["shots"]]
    clips, shots, captions = [], [], []
    cursor = 0

    def silence(seconds):
        nonlocal cursor
        clip = np.zeros(round(seconds*RATE), dtype=np.float32)
        clips.append(clip)
        cursor += len(clip)

    for s, phrases in measured:
        start = cursor / RATE
        beat_captions = []
        silence(.26 if s["id"] != "01" else .08)
        for i, (line, pcm) in enumerate(zip(s["phrases"], phrases)):
            onset = cursor / RATE
            clips.append(pcm)
            cursor += len(pcm)
            silence(max(.22, 1.72 - len(pcm)/RATE))
            key = {"start": onset, "end": cursor/RATE-.04, "text": line}
            captions.append(key)
            beat_captions.append(key)
        tail = 1.3 if s["id"] in ("01", "11", "15", "16", "18", "20") else .62
        silence(tail if s["id"] != "21" else .11)
        silence((-cursor % (RATE//FPS))/RATE)
        shots.append({"id": s["id"], "start": start, "end": cursor/RATE, "captions": beat_captions})

    if cursor < 120 * RATE:
        raise RuntimeError(f"Measured runtime is only {cursor/RATE:.2f}s")
    voice = np.concatenate(clips)
    write_wav(ROOT / "work" / "mix.wav", sound_design(voice, shots))
    (ROOT / "timeline.json").write_text(json.dumps({
        "fps": FPS, "frames": cursor//(RATE//FPS), "duration": cursor/RATE,
        "voice": {"engine": "edge-tts", "name": VOICE, "access": "free"},
        "shots": shots
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "captions.srt").write_text("\n\n".join(
        f'{i}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}'
        for i, c in enumerate(captions, 1))+"\n", encoding="utf-8")
    print(f"{len(shots)} shots, {len(captions)} timed Thai phrases, {cursor/RATE:.2f} seconds")


if __name__ == "__main__":
    asyncio.run(main())
