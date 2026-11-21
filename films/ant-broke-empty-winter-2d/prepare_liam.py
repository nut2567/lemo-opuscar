"""Verify production takes and build the revised Empty Winter audio and cut list."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
MEDIA = ROOT / "liam"
VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ"
MODEL = "eleven_v3"
REACTION_SHOTS = {"01", "05", "07", "11", "15", "16", "18", "20"}

sound_spec = spec_from_file_location(
    "ant_broke_sound", ROOT / "sound.py"
)
sound = module_from_spec(sound_spec)
sound_spec.loader.exec_module(sound)
RATE, FPS = sound.RATE, sound.FPS
SAMPLES_PER_FRAME = RATE // FPS


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def load_take(job):
    stem = MEDIA / "clips" / job["name"]
    path = stem.with_suffix(".mp3")
    meta = read_json(stem.with_suffix(".voice.json"))
    if (meta["provider"], meta["voice_id"], meta["model"], meta["speed"]) != (
        "elevenlabs", VOICE_ID, MODEL, 1.0
    ):
        raise ValueError(f"Unexpected voice or speed in {path.name}")
    script = stem.with_suffix(".txt").read_text(encoding="utf-8-sig").strip()
    if script != job["text"] or sha256(script.encode("utf-8")).hexdigest() != meta["script_sha256"]:
        raise ValueError(f"Script provenance differs in {path.name}")
    if sha256(path.read_bytes()).hexdigest() != meta["sha256"]:
        raise ValueError(f"Audio provenance differs in {path.name}")
    pcm = sound.decode(path)
    if len(pcm) < RATE * .3:
        raise ValueError(f"Unexpectedly short take {path.name}")
    return pcm, meta["sha256"]


def samples(seconds):
    return round(seconds * RATE)


def shot_length(shot):
    return shot["lead"] + shot["tail"] + sum(len(p["pcm"]) + p["gap"] for p in shot["phrases"])


def build_plan(shots, takes):
    plan = []
    for shot in shots:
        sid = shot["id"]
        lead = samples(.035 if sid == "01" else .11)
        tail = samples(.48 if sid in REACTION_SHOTS else .25)
        if sid == "21":
            tail = samples(.025)
        phrases = []
        for index, line in enumerate(shot["phrases"], 1):
            name = f"{sid}-{index:02}"
            pcm, digest = takes[name]
            is_last = index == len(shot["phrases"])
            reading_time = min(1.67, 1.15 + .018 * len(line))
            reading_during_tail = min(tail, samples(.22)) if is_last else 0
            gap = 0 if sid == "21" else max(
                samples(.12 if not is_last else 0),
                samples(reading_time) - len(pcm) - reading_during_tail
            )
            phrases.append({"id": name, "text": line, "pcm": pcm, "sha256": digest, "gap": gap})
        item = {"id": sid, "lead": lead, "tail": tail, "phrases": phrases}
        if sid == "01":
            item["tail"] += max(0, samples(6.55) - shot_length(item))
        plan.append(item)

    # Put any time needed for the two-minute minimum into the existing action
    # and reaction beats, keeping the bridge-to-hook pause intact.
    needed = max(0, samples(120) - sum(shot_length(s) for s in plan))
    weights = [0 if s["id"] == "21" else 2 if s["id"] in REACTION_SHOTS else 1 for s in plan]
    cumulative, distributed = 0, 0
    for shot, weight in zip(plan, weights):
        cumulative += weight
        target = round(needed * cumulative / sum(weights))
        extra = target - distributed
        distributed = target
        share = extra // len(shot["phrases"])
        for phrase in shot["phrases"][:-1]:
            added = min(share, max(0, samples(.34) - phrase["gap"]))
            phrase["gap"] += added
            extra -= added
        shot["tail"] += extra
    return plan


def render_audio(plan):
    segments, shots, captions, manifest = [], [], [], []
    cursor = 0

    def silence(count):
        nonlocal cursor
        if count:
            segments.append(np.zeros(count, dtype=np.float32))
            cursor += count

    for item in plan:
        start = cursor / RATE
        timed = []
        silence(item["lead"])
        for phrase in item["phrases"]:
            pcm = phrase["pcm"]
            at = cursor
            segments.append(pcm)
            cursor += len(pcm)
            voiced_end = cursor / RATE
            silence(phrase["gap"])
            cap = {"start": at / RATE, "end": max(voiced_end, cursor / RATE - .025), "text": phrase["text"]}
            timed.append(cap)
            captions.append(cap)
            manifest.append({
                "id": phrase["id"], **cap, "voice_end": voiced_end,
                "source": f"clips/{phrase['id']}.mp3", "sha256": phrase["sha256"],
            })
        silence(item["tail"])
        silence(-cursor % SAMPLES_PER_FRAME)
        cap_tail = cursor / RATE if item["id"] == "21" else min(
            cursor / RATE, timed[-1]["end"] + min(item["tail"], samples(.22)) / RATE
        )
        timed[-1]["end"] = manifest[-1]["end"] = cap_tail
        shots.append({"id": item["id"], "start": start, "end": cursor / RATE, "captions": timed})

    frames = cursor // SAMPLES_PER_FRAME
    if frames < 120 * FPS:
        raise ValueError(f"Only {frames} frames after rebuilding the timeline")
    mixed = sound.sound_design(np.concatenate(segments), shots)
    peak = float(np.max(np.abs(mixed)))
    if peak > .92:
        mixed *= .92 / peak
    sound.write_wav(MEDIA / "mix.wav", mixed)
    data = {
        "fps": FPS, "frames": frames, "duration": cursor / RATE, "shots": shots,
        "voice": {"engine": "elevenlabs", "name": "Liam", "model": MODEL, "speed": 1.0},
    }
    (MEDIA / "timeline.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (MEDIA / "captions.srt").write_text("\n\n".join(
        f'{i}\n{sound.stamp(c["start"])} --> {sound.stamp(c["end"])}\n{c["text"]}'
        for i, c in enumerate(captions, 1)
    ) + "\n", encoding="utf-8")
    details = {
        **data["voice"], "duration": data["duration"], "phrase_count": len(manifest),
        "source_characters": sum(len(p["text"]) for p in manifest),
        "source_speech_seconds": sum(p["voice_end"] - p["start"] for p in manifest),
        "longest_phrase_gap_seconds": max(b["start"] - a["voice_end"] for a, b in zip(manifest, manifest[1:])),
        "listening_review": "unverified",
        "phrases": manifest,
    }
    (MEDIA / "voice-manifest.json").write_text(json.dumps(details, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(shots)} shots, {len(captions)} captions, {frames} frames, {cursor/RATE:.2f}s")
    print(f'Source voice {details["source_speech_seconds"]:.2f}s; longest planned phrase gap {details["longest_phrase_gap_seconds"]:.2f}s')


def main():
    jobs = read_json(MEDIA / "jobs.json")
    shots = read_json(ROOT / "story.json")["shots"]
    expected = [
        (f"{shot['id']}-{index:02}", line)
        for shot in shots for index, line in enumerate(shot["phrases"], 1)
    ]
    if [(job["name"], job["text"]) for job in jobs] != expected:
        raise ValueError("Voice jobs do not match the episode script")
    with ThreadPoolExecutor(6) as pool:
        takes = dict(zip((j["name"] for j in jobs), pool.map(load_take, jobs)))
    render_audio(build_plan(shots, takes))


if __name__ == "__main__":
    main()
