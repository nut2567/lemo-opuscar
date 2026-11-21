"""Cut the corrected Thai payoff into the existing timeline and mix quiet foley."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
import math
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

import numpy as np

from prepare_liam import FPS, MEDIA, MODEL, RATE, ROOT, SAMPLES_PER_FRAME, VOICE_ID, load_take, read_json, samples, sound

FOLEY = MEDIA / "foley"
PAYOFF = "20-02"
# The follow-up “หมดเกลี้ยงเลย” supplies context to the synth. It starts
# after 2.0s and is outside this cut.
PAYOFF_REGION = (.065, 1.570)
EFFECT_REGIONS = {"step": (.012, .140), "tap": (.286, .421), "box": (0, .580)}
EFFECT_PEAKS = {"step": .036, "tap": .044, "box": .064}
BALANCED_PEAKS = {"step": .165, "tap": .190, "box": .255}


def raw_decode(path):
    result = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(RATE), "-f", "f32le", "-"
    ])
    return np.frombuffer(result, dtype="<f4")


def get_asset(stem, kind):
    metadata = read_json(stem.with_suffix(".voice.json"))
    audio = stem.with_suffix(".mp3")
    if metadata["provider"] != "elevenlabs" or sha256(audio.read_bytes()).hexdigest() != metadata["sha256"]:
        raise ValueError(f"Sound file does not match the ElevenLabs receipt: {audio.name}")
    if kind == "voice":
        script = stem.with_suffix(".txt").read_text(encoding="utf-8-sig")
        valid_hashes = {sha256(text.encode("utf-8")).hexdigest() for text in (script, script.strip())}
        if metadata["script_sha256"] not in valid_hashes or (metadata["voice_id"], metadata["model"]) != (VOICE_ID, MODEL):
            raise ValueError("Payoff script or speaker does not match its receipt")
    elif metadata.get("kind") != "sfx":
        raise ValueError(f"Unexpected non-SFX media: {audio.name}")
    return raw_decode(audio), metadata["sha256"]


def trim(pcm, region, ramp_in=.009, ramp_out=.024):
    start, end = map(samples, region)
    if not 0 <= start < end <= len(pcm):
        raise ValueError(f"Window {region} is outside the source")
    piece = pcm[start:end].copy()
    length = samples(ramp_in)
    piece[:length] *= np.linspace(0, 1, length)
    length = samples(ramp_out)
    piece[-length:] *= np.linspace(1, 0, length)
    return piece


def build_narration(timeline):
    jobs = read_json(MEDIA / "jobs.json")
    phrases = read_json(MEDIA / "voice-manifest.json")["phrases"]
    with ThreadPoolExecutor(6) as pool:
        takes = dict(zip((j["name"] for j in jobs), pool.map(load_take, jobs)))
    narration = np.zeros(timeline["frames"] * SAMPLES_PER_FRAME, dtype=np.float32)
    replacement, receipt = get_asset(FOLEY / "payoff", "voice")
    slice_ = trim(replacement, PAYOFF_REGION, ramp_in=.008, ramp_out=.023)
    report = None
    for phrase in phrases:
        name = phrase["id"]
        pcm, old_hash = takes[name]
        start, old_end = samples(phrase["start"]), samples(phrase["voice_end"])
        if old_hash != phrase["sha256"] or len(pcm) != old_end - start:
            raise ValueError(f"Take diverged from the existing timeline: {name}")
        if name == PAYOFF:
            level = min(1.65, float(np.linalg.norm(pcm) / np.linalg.norm(slice_)))
            pcm = slice_ * level
            if start + len(pcm) > samples(phrase["end"]):
                raise ValueError("The corrected payoff would exceed its caption slot")
            report = {"id": name, "sha256": receipt, "source_window_seconds": PAYOFF_REGION,
                      "start_seconds": start/RATE, "end_seconds": (start+len(pcm))/RATE,
                      "gain_db": round(20*math.log10(level), 1)}
        narration[start:start+len(pcm)] = pcm
    if not report:
        raise ValueError("Missing payoff phrase on the original timeline")
    return narration, report


def in_stereo(clip, pan):
    return clip[:, None] * np.array([math.sqrt((1-pan)*.5), math.sqrt((1+pan)*.5)])


def score(shots, sample_count, speech_duck):
    """Keep the Empty Winter pluck motif and air, with dedicated foley tracks."""
    bed = np.zeros((sample_count, 2), dtype=np.float32)
    rng = np.random.default_rng(197)
    cold = {1, 15, 16, 17, 18, 19, 20, 21}

    def note(start, duration, pitch, gain, pan):
        length = samples(duration)
        position = samples(start)
        if position + length > sample_count:
            return
        t = np.arange(length, dtype=np.float32)/RATE
        f = 440*2**((pitch-69)/12)
        tone = (np.sin(2*np.pi*f*t) + .24*np.sin(2*np.pi*f*2.003*t)*np.exp(-3*t))
        tone *= np.exp(-2.3*t)*np.minimum(1,(duration-t)*6)*np.minimum(t*190,1)
        bed[position:position+length] += in_stereo(tone*gain,pan)

    for shot in shots:
        sid = int(shot["id"])
        start, duration = shot["start"], shot["end"] - shot["start"]
        length = samples(duration)
        at = samples(start)
        t = np.arange(length, dtype=np.float32)/RATE
        air = rng.normal(0,1,math.ceil(duration*78)+1)
        air = np.interp(t*78,np.arange(len(air)),air)*np.sin(np.pi*t/duration)**2
        bed[at:at+length] += in_stereo(air*(.021 if sid in cold else .009),0)
        tones = [45,52,57,59] if sid in cold else [48,55,60,64]
        if sid not in {14,17,20}:
            for i in range(int(duration/1.35)):
                note(start+.2+i*1.35,1.28,tones[(sid+i)%4],.046,(-1)**i*.24)
        if sid == 20:
            for i, pitch in enumerate((57,45,33)):
                note(start+duration*.59+i*.10,min(1.05,duration*.24),pitch,.082,0)
    return bed*speech_duck[:, None]


def make_events(shots):
    by_id = {int(s["id"]):s for s in shots}
    events = []

    def add(sid, kind, when, pan=0, level=1):
        events.append({"shot": sid, "effect": kind, "time_seconds": when,
                       "pan": pan, "level": level})

    # Alternate tripod contacts, decimated to keep movement audible but light.
    for sid, low, high, pace in [(1,0,.61,2),(2,.08,.88,2),(3,.08,.70,2),
                                (6,.055,.29,3),(12,.07,.86,2),(15,.10,.80,3)]:
        s = by_id[sid]
        span = s["end"]-s["start"]
        first,last = s["start"]+low*span,s["start"]+high*span
        step = math.pi/12
        n = math.ceil((first-step/2)/step)
        while (t := (n+.5)*step) < last:
            multiplier = .72 + .07*(n%4)
            if sid in {6,15}:
                multiplier *= .58
            add(sid,"step",t,.21*math.sin(n*1.9),multiplier)
            n += pace

    for sid, times in {6:(.40,),7:(.12,),9:(.31,.50,.67),10:(.31,.49,.535,.65)}.items():
        s = by_id[sid]
        for i, u in enumerate(times):
            add(sid,"tap",s["start"]+(s["end"]-s["start"])*u,(-1)**i*.21,.82 if i else 1)
    s = by_id[8]
    for n in range(math.ceil((s["start"]+.4)*3), math.floor((s["end"]-.3)*3), 3):
        add(8,"tap",n/3,(-1)**n*.27,.80)

    for sid,u,pan,level in [(7,.36,-.24,.76),(11,.42,-.17,1)]:
        s = by_id[sid]
        add(sid,"box",s["start"]+(s["end"]-s["start"])*u,pan,level)
    return sorted(events,key=lambda e:e["time_seconds"])


def foley_track(shots, sample_count, duck, *, peaks=EFFECT_PEAKS, density=1.):
    bed = np.zeros((sample_count,2),dtype=np.float32)
    assets, provenance = {}, {}
    for name, region in EFFECT_REGIONS.items():
        audio, digest = get_asset(FOLEY/"effects"/name,"sfx")
        cut = trim(audio,region,ramp_in=.004,ramp_out=.024)
        if name == "box":
            cut *= np.interp(np.arange(len(cut))/RATE,[0,.12,.25,.58],[1,1,.42,.28])
        unit_peak = max(float(np.abs(cut).max()), 1e-4)
        if density > 1:
            # Round off isolated peaks so a tap stays perceptible on a small speaker.
            cut = np.tanh(cut*(density/unit_peak))
            unit_peak = math.tanh(density)
        assets[name] = cut*(peaks[name]/unit_peak)
        provenance[name] = {"sha256":digest,"source_window_seconds":region}

    events = make_events(shots)
    for event in events:
        start = samples(event["time_seconds"])
        effect = assets[event["effect"]]
        stop = min(start+len(effect),sample_count)
        effect = effect[:stop-start]*event["level"]*duck[start:stop]
        bed[start:stop] += in_stereo(effect,event["pan"])
    return bed, events, provenance


def export(duration, *, mix_path=FOLEY/"mix.wav", final=ROOT/"mot-empty-winter-2d-liam-foley.mp4"):
    mix = str(mix_path)
    target = "loudnorm=I=-14:TP=-1.7:LRA=8"
    analysis = subprocess.run([
        "ffmpeg","-hide_banner","-nostats","-i",mix,"-af",target+":print_format=json","-f","null","-"
    ],capture_output=True,text=True,check=True).stderr
    measured = json.loads(analysis[analysis.rfind("{"):analysis.rfind("}")+1])
    measured_filter = target + (
        f':measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}'
        f':measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}'
        f':offset={measured["target_offset"]}'
    )
    staged = mix_path.parent/"render.tmp.mp4"
    subprocess.run([
        "ffmpeg","-v","error","-xerror","-y",
        "-i",str(ROOT/"mot-empty-winter-2d-liam.mp4"),"-i",mix,
        "-map","0:v:0","-map","1:a:0","-c:v","copy","-af",measured_filter,
        "-c:a","aac","-b:a","192k","-ar","48000","-t",str(duration),
        "-movflags","+faststart",str(staged)
    ],check=True)
    staged.replace(final)
    return final


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--balanced", action="store_true", help="Lower high narration and bring up foley.")
    balanced = parser.parse_args().balanced
    output = MEDIA/"balanced" if balanced else FOLEY
    output.mkdir(parents=True, exist_ok=True)
    timeline = read_json(MEDIA/"timeline.json")
    narration, payoff = build_narration(timeline)
    if balanced:
        from pitch_narration import steady_voice

        phrases = read_json(MEDIA/"voice-manifest.json")["phrases"]
        with TemporaryDirectory(prefix="pitch-", dir=output) as commands:
            narration, pitch_report = steady_voice(narration, phrases, payoff, Path(commands))
        (output/"pitch-report.json").write_text(
            json.dumps(pitch_report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8"
        )
    voice = narration*1.25
    rms = np.sqrt(np.mean(narration.reshape(-1,SAMPLES_PER_FRAME)**2,axis=1))
    amplitude = np.convolve(np.clip(rms*19,0,.77),np.ones(7)/7,mode="same")
    envelope = np.interp(np.arange(len(voice)),np.arange(len(rms))*SAMPLES_PER_FRAME,amplitude)
    if balanced:
        effects, cues, provenance = foley_track(
            timeline["shots"], len(voice), 1-.38*envelope, peaks=BALANCED_PEAKS, density=2.1
        )
    else:
        effects, cues, provenance = foley_track(timeline["shots"],len(voice),1-envelope)
    mixed = voice[:,None]+score(timeline["shots"],len(voice),1-.81*envelope)+effects
    peak = float(np.abs(mixed).max())
    if peak > .92:
        mixed *= .92/peak
    mix_path = output/"mix.wav"
    sound.write_wav(mix_path,mixed)
    record = {"duration_seconds":timeline["duration"],"fps":FPS,"payoff":payoff,
              "sfx_sources":provenance,"cues":cues,
              "voice_peak_dbfs":round(20*math.log10(np.abs(voice).max()),2),
              "sfx_peak_dbfs":round(20*math.log10(np.abs(effects).max()),2)}
    if balanced:
        active = (rms > .02) & (
            np.mean(effects.reshape(-1, SAMPLES_PER_FRAME, 2)**2, axis=(1, 2)) > 1e-6
        )
        fx_rms = np.sqrt(np.mean(effects.reshape(-1, SAMPLES_PER_FRAME, 2)[active]**2))
        voice_rms = 1.25*np.sqrt(np.mean(rms[active]**2))
        record["speech_over_foley_rms_db"] = round(float(20*np.log10(voice_rms/fx_rms)), 2)
        record["foley_peak_targets"] = BALANCED_PEAKS
        print(f'Speech above overlapping effects: {record["speech_over_foley_rms_db"]:.1f} dB.')
    (output/"mix-manifest.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"The original {timeline['duration']:.2f}s timing is intact; corrected payoff and {len(cues)} quiet cues.")
    print(f'Peak levels before final normalization: narration {record["voice_peak_dbfs"]} dBFS, foley {record["sfx_peak_dbfs"]} dBFS.')
    final = ROOT/"mot-empty-winter-2d-liam-balanced.mp4" if balanced else ROOT/"mot-empty-winter-2d-liam-foley.mp4"
    print(export(timeline["duration"], mix_path=mix_path, final=final))


if __name__ == "__main__":
    main()
