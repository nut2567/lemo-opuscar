"""Align one continuous narration take to the existing story and foley cues."""
from difflib import SequenceMatcher
from hashlib import sha256
import json
from pathlib import Path
import unicodedata

import numpy as np

ROOT = Path(__file__).resolve().parent
FRESH = ROOT / "liam" / "fresh"
VOICE = "TX3LPaxmHKxFdv7VOQHJ"
MODEL = "eleven_v4"


def script():
    shots = json.loads((ROOT / "story.json").read_text(encoding="utf-8-sig"))["shots"]
    return "\n\n".join(" ".join(p.rstrip("!") for p in shot["phrases"]).rstrip(".") + (
        "" if shot["phrases"][-1].endswith("?") else "."
    ) for shot in shots)


from mix_foley import BALANCED_PEAKS, foley_track, raw_decode, score
from prepare_liam import FPS, RATE, SAMPLES_PER_FRAME, read_json, samples, sound


def content_characters(text):
    return [(i, ch) for i, ch in enumerate(text) if unicodedata.category(ch)[0] in "LMN"]


def map_characters(text, alignment):
    source = content_characters(text)
    returned = content_characters("".join(alignment["characters"]))
    comparison = SequenceMatcher(
        None, [ch for _, ch in source], [ch for _, ch in returned], autojunk=False
    )
    result = {}
    for block in comparison.get_matching_blocks():
        for i in range(block.size):
            start = source[block.a+i][0]
            result[start] = returned[block.b+i][0]
    if len(result) < len(source)*.96:
        raise ValueError("Provider alignment does not match the narration script")
    return result


def measure_phrases(shots, text, alignment):
    lookup = map_characters(text, alignment)
    starts = alignment["character_start_times_seconds"]
    ends = alignment["character_end_times_seconds"]
    cursor = 0
    result = []
    for shot in shots:
        entries = []
        for phrase in shot["phrases"]:
            spoken = phrase.rstrip("!")
            at = text.index(spoken, cursor)
            cursor = at + len(spoken)
            matched = [lookup[i] for i in range(at, cursor) if i in lookup]
            if not matched:
                raise ValueError(f"No provider timings for shot {shot['id']}")
            offset = float(starts[matched[0]])
            until = float(max(ends[i] for i in matched))
            if until <= offset:
                raise ValueError(f"Empty caption window in shot {shot['id']}")
            entries.append({"text": phrase, "start": offset, "end": until})
        result.append({"id": shot["id"], "captions": entries})
    return result


def quiet_cut(pcm, lo, hi):
    """Choose a low-energy cut in the inter-shot gap, not inside speech."""
    left, right = samples(lo), samples(hi)
    step = samples(.006)
    margin = samples(.012)
    if right-left < 2*margin:
        return (left+right)//2
    center = (left+right)//2
    return min(range(left+margin, right-margin+1,step), key=lambda at: (
        float(np.mean(pcm[at-margin:at+margin]**2)) + 3e-5*abs(at-center)/max(right-left,1)
    ))


def time_story(pcm, measured):
    begin = max(0, samples(measured[0]["captions"][0]["start"]-.035))
    finish = min(len(pcm), samples(measured[-1]["captions"][-1]["end"]+.065))
    edges = [begin]
    for current, following in zip(measured, measured[1:]):
        lo, hi = current["captions"][-1]["end"], following["captions"][0]["start"]
        edges.append(quiet_cut(pcm, min(lo,hi), max(lo,hi)))
    edges.append(finish)
    if any(y <= x for x, y in zip(edges, edges[1:])):
        raise ValueError("Shot boundaries are not ascending")

    weights = [2 if shot["id"] in {"01","05","07","11","15","16","18","20"} else 1 for shot in measured]
    weights[-1] = 0
    intro = max(0, samples(6.55)-(edges[1]-edges[0]))
    extra = max(0, samples(120)-(finish-begin)-intro)
    segments, cues, padding = [], [], []
    cursor, cumulative, distributed = 0, 0, 0
    for i, current in enumerate(measured):
        start = cursor
        at, cut = edges[i:i+2]
        cumulative += weights[i]
        share = round(extra*cumulative/sum(weights))
        hold = share-distributed+(intro if i == 0 else 0)
        distributed = share
        chunk = pcm[at:cut].copy()
        if hold:
            fade = samples(.012)
            chunk[-fade:] *= np.linspace(1,0,fade)
            segments.extend((chunk, np.zeros(hold, dtype=np.float32)))
        else:
            segments.append(chunk)
        cursor += len(chunk)+hold
        captions = []
        for j, c in enumerate(current["captions"]):
            next_start = current["captions"][j+1]["start"] if j+1 < len(current["captions"]) else cut/RATE
            actual_start = max(start/RATE, (start-at)/RATE+c["start"])
            actual_end = min(c["end"]+.12, next_start)+(start-at)/RATE
            if actual_end <= actual_start:
                raise ValueError(f"Empty aligned caption in shot {current['id']}")
            captions.append({"text": c["text"], "start": actual_start, "end": actual_end})
        end_frame = round(cursor/SAMPLES_PER_FRAME)
        cues.append({"id": current["id"], "end": end_frame/FPS, "captions": captions})
        padding.append({"shot": current["id"], "ambient_hold_seconds": round(hold/RATE,3)})
    if cursor % SAMPLES_PER_FRAME:
        segments.append(np.zeros(-cursor % SAMPLES_PER_FRAME, dtype=np.float32))
    narration = np.concatenate(segments)
    for i, shot in enumerate(cues):
        shot["start"] = cues[i-1]["end"] if i else 0.
        if i == len(cues)-1:
            shot["end"] = len(narration)/RATE
        for caption in shot["captions"]:
            caption["start"] = max(shot["start"], caption["start"])
            caption["end"] = min(shot["end"], caption["end"])
            if caption["end"] <= caption["start"]:
                raise ValueError(f"Caption falls outside shot {shot['id']}")
    return narration, cues, padding


def main():
    text = (FRESH / "script.txt").read_text(encoding="utf-8")
    metadata = read_json(FRESH / "take.voice.json")
    path = FRESH / "take.mp3"
    if (text != script() or metadata["voice_id"] != VOICE or metadata["model"] != MODEL
            or sha256(path.read_bytes()).hexdigest() != metadata["sha256"]):
        raise ValueError("Narration receipt does not match the declared take and script")
    alignment = read_json(FRESH / "alignment.json")
    timing = alignment["alignment"] or alignment["normalized_alignment"]
    if timing is None:
        raise ValueError("The new take was saved, but ElevenLabs did not return character timings")
    shots = read_json(ROOT / "story.json")["shots"]
    pcm = raw_decode(path)
    narration, scenes, padding = time_story(pcm, measure_phrases(shots, text, timing))
    rms = np.sqrt(np.mean(narration.reshape(-1,SAMPLES_PER_FRAME)**2,axis=1))
    amplitude = np.convolve(np.clip(rms*19,0,.77),np.ones(7)/7,mode="same")
    envelope = np.interp(np.arange(len(narration)),np.arange(len(rms))*SAMPLES_PER_FRAME,amplitude)
    effects, cues, provenance = foley_track(
        scenes,len(narration),1-.38*envelope,peaks=BALANCED_PEAKS,density=2.1
    )
    mix = (narration*1.25)[:,None] + score(scenes,len(narration),1-.81*envelope) + effects
    peak = np.abs(mix).max()
    if peak > .92:
        mix *= .92/peak
    sound.write_wav(FRESH / "mix.wav", mix)
    timeline = {"fps": FPS, "duration": len(narration)/RATE, "frames": len(narration)//SAMPLES_PER_FRAME,
                "shots": scenes, "voice": {"engine": "elevenlabs", "name": "Liam", "model": MODEL}}
    (FRESH / "timeline.json").write_text(json.dumps(timeline,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    flat = [caption for shot in scenes for caption in shot["captions"]]
    (FRESH / "captions.srt").write_text("\n\n".join(
        f'{i}\n{sound.stamp(c["start"])} --> {sound.stamp(c["end"])}\n{c["text"]}'
        for i,c in enumerate(flat,1)
    )+"\n",encoding="utf-8")
    report = {"source_duration_seconds": len(pcm)/RATE, "duration_seconds": len(narration)/RATE,
              "alignment": "provider character timings", "sfx_sources": provenance,
              "foley_peak_targets": BALANCED_PEAKS, "cues": cues, "scene_holds": padding}
    (FRESH / "mix-manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f'{len(flat)} captions, {len(cues)} cues, raw audio {len(pcm)/RATE:.2f}s, cut {len(narration)/RATE:.2f}s')


if __name__ == "__main__":
    main()
