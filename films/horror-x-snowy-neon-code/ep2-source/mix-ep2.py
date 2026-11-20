"""Mix the EP2 soundtrack (60.000 s, 48 kHz stereo WAV) — adapted from
ep1-source/noon/mix-noon.py (copied, not imported; EP1 stays untouched).

    python films/horror-x-snowy-neon-code/ep2-source/mix-ep2.py --out <mix.wav> [--report <json>]
        [--voice-dir <folder with 01..12.mp3|wav>] [--even] [--opening-fx-db -6]

Without --voice-dir (or with a folder that has no clips) this is the SCRATCH mix:
effects and ambience only, with the effects bus already ducked under every
caption window so the voice will sit on top when it arrives.
With --voice-dir, line N is placed at caption cue N's start (captions/ep2.srt).
If a line would run into the next cue it is sped up at most 10 %, and if still
long the next line waits (same rule as EP1); the report lists every placement
so the SRT can be re-timed to the real takes.

Sources (local only, no API calls):
  ../ep1-source/audio/noon-assets/sfx/*.mp3   EP1's generated effects (read-only)
  synth_sfx.py                                 locally synthesised EP2 effects
Mastering (loudnorm) is left to core/render/mux.sh, as in EP1.
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import synth_sfx as syn  # noqa: E402

SR, DUR = 48000, 60.0
N = int(SR * DUR)
EP1_SFX = os.path.join(os.path.dirname(HERE), 'ep1-source', 'audio', 'noon-assets', 'sfx')


def decode(path, tempo=1.0):
    af = ['-af', f'atempo={tempo:.4f}'] if abs(tempo - 1) > 1e-4 else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, *af, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)


def db(x):
    return 10 ** (x / 20)


def place(bus, clip, t, gain=1.0, fade_in=0.01, fade_out=0.05, length=None):
    s = int(round(t * SR))
    if length is not None:
        clip = clip[:int(length * SR)]
    clip = clip.copy()
    fi, fo = min(max(1, int(fade_in * SR)), len(clip)), min(max(1, int(fade_out * SR)), len(clip))
    clip[:fi] *= np.linspace(0, 1, fi)[:, None]
    clip[-fo:] *= np.linspace(1, 0, fo)[:, None]
    e = min(N, s + len(clip))
    if e > s >= 0:
        bus[s:e] += clip[:e - s] * gain


def loop_to(clip, seconds):
    n = int(seconds * SR)
    reps = int(np.ceil(n / len(clip)))
    return np.concatenate([clip] * reps)[:n]


def envelope(points, n=N):
    ts = np.arange(n) / SR
    return np.interp(ts, [p[0] for p in points], [db(p[1]) for p in points])[:, None]


def srt_cues(path):
    cues = []
    for block in open(path, encoding='utf-8-sig').read().strip().split('\n\n'):
        lines = block.strip().splitlines()
        a, b = lines[1].split(' --> ')
        sec = lambda s: int(s[:2]) * 3600 + int(s[3:5]) * 60 + float(s[6:].replace(',', '.'))
        cues.append((sec(a), sec(b)))
    return cues


def find_clip(folder, i):
    for ext in ('.mp3', '.wav'):
        p = os.path.join(folder, f'{i:02d}{ext}')
        if os.path.isfile(p):
            return p
    return None


def build(args):
    timing = json.load(open(os.path.join(HERE, 'timing.json'), encoding='utf-8'))
    beats = timing['beats']
    cues = srt_cues(os.path.join(HERE, 'captions', 'ep2.srt'))
    report = {'voice': [], 'voiceDir': None, 'sfx': [], 'scratch': True}

    # ---- narration --------------------------------------------------------
    voice = np.zeros((N, 2))
    clips = []
    if args.voice_dir:
        folder = os.path.abspath(args.voice_dir)
        report['voiceDir'] = folder
        clips = [find_clip(folder, i + 1) for i in range(len(cues))]
        missing = [i + 1 for i, c in enumerate(clips) if not c]
        if missing and len(missing) < len(cues):
            raise SystemExit(f'mix-ep2.py: voice dir is missing lines {missing}; supply all 12 or none')
        if len(missing) == len(cues):
            clips = []
    prev_end = 0.0
    for i, path in enumerate(clips):
        start = cues[i][0]
        clip = decode(path)
        dur = len(clip) / SR
        t = max(start, prev_end + 0.12)
        nxt = cues[i + 1][0] if i + 1 < len(cues) else DUR - 0.3
        tempo = 1.0
        if t + dur > nxt - 0.1:
            tempo = min(1.10, dur / max(0.5, nxt - 0.1 - t))
            if tempo > 1.0:
                clip = decode(path, tempo)
                dur = len(clip) / SR
        if args.even:
            mono = np.abs(clip).mean(axis=1)
            active = clip[mono > db(-45) * mono.max()]
            rms = np.sqrt((active ** 2).mean()) if len(active) else 1e-9
            clip = np.tanh(clip * db(-20) / max(1e-9, rms) * 1.4) / 1.4
            place(voice, clip, t, 1.0, 0.005, 0.03)
        else:
            clip /= max(1e-9, np.abs(clip).max())
            place(voice, clip, t, 0.5, 0.005, 0.03)
        prev_end = t + dur
        report['voice'].append({'cue': i + 1, 'file': os.path.basename(path), 'start': round(t, 3),
                                'end': round(t + dur, 3), 'tempo': round(tempo, 3), 'captionStart': start,
                                'captionEnd': cues[i][1], 'overrunsCaption': round(t + dur - cues[i][1], 3)})
    report['scratch'] = not clips

    # ---- effects ----------------------------------------------------------
    fx = np.zeros((N, 2))
    s = {k: decode(os.path.join(EP1_SFX, f'{k}.mp3')) for k in
         ['room-tone', 'exterior-neon', 'rear-door', 'soft-steps', 'washer-spin', 'coin-slot', 'dread-drone']}
    for k, v in s.items():
        s[k] = v / max(1e-9, np.abs(v).max())

    # beds: storefront exterior -> corridor tube -> door draught -> CCTV hum -> storefront
    fx += loop_to(s['room-tone'], DUR) * envelope([(0, -40), (3.2, -40), (3.6, -33), (31.0, -33), (31.4, -36),
                                                  (51.8, -36), (52.2, -40), (60, -40)])
    place(fx, s['exterior-neon'], 0.0, db(-22), 0.4, 0.5, length=3.6)
    place(fx, s['exterior-neon'], 52.0, db(-24), 0.3, 0.6)
    tube = loop_to(syn.tube_buzz(), DUR) * envelope([(0, -80), (3.3, -80), (3.7, -36), (10.2, -36), (10.5, -44),
                                                    (22.1, -44), (22.4, -36), (30.8, -36), (31.2, -80), (60, -80)])
    fx += tube
    wind = loop_to(syn.door_wind(), DUR) * envelope([(0, -80), (10.1, -80), (10.6, -31), (22.0, -31), (22.6, -40),
                                                    (27.0, -40), (27.6, -80), (60, -80)])
    fx += wind
    hum = loop_to(syn.crt_hum(), DUR) * envelope([(0, -80), (30.9, -80), (31.2, -35), (35.5, -35), (35.7, -31),
                                                 (51.9, -31), (52.1, -80), (60, -80)])
    fx += hum
    # Noon's own slipper steps (allowed); the cloth never makes a step sound
    place(fx, s['soft-steps'], 1.6, db(-33), 0.01, 0.2, length=1.4)            # walk-back, through the glass
    for k in range(4):                                                         # corridor walk 3.9-10.3
        place(fx, s['soft-steps'], 3.95 + k * 1.6, db(-25 - 2 * (k == 2)), 0.01, 0.15, length=1.6)
    place(fx, s['rear-door'], 28.3, db(-27), 0.05, 0.4)                         # side door eases open
    place(fx, s['soft-steps'], 27.75, db(-26), 0.01, 0.2, length=1.6)          # walk back to the side door
    place(fx, s['soft-steps'], 29.35, db(-28), 0.01, 0.2, length=0.65)
    # lock + chain
    place(fx, syn.lock_clunk(), beats['lockTry1'], db(-13), 0.001, 0.08)
    place(fx, syn.lock_rattle(), beats['lockTry2'], db(-14), 0.001, 0.08)
    place(fx, syn.chain_clink(), beats['lockTry2'] + 0.06, db(-21), 0.001, 0.2)
    # CCTV
    place(fx, syn.key_click(), 31.15, db(-22), 0.001, 0.02)                     # shuttle engaged
    place(fx, syn.rewind_whir(), 31.0, db(-25), 0.05, 0.2)
    place(fx, syn.key_click(), 35.6, db(-22), 0.001, 0.02)                      # play
    place(fx, syn.glitch_tear(), beats['glitch'], db(-24), 0.002, 0.05)        # the one soft tear
    place(fx, syn.key_click(), beats['liveSwitch'], db(-16), 0.001, 0.02)      # LIVE
    # the empty shop: coin slot + motor by itself
    place(fx, s['coin-slot'], beats['washerSlot'] - 0.40, db(-17), 0.005, 0.3)
    washer = loop_to(s['washer-spin'], DUR) * envelope([(0, -80), (beats['washerMotor'] - 0.1, -80),
                                                        (beats['washerMotor'] + 1.2, -22), (59.3, -22), (60, -60)])
    fx += washer
    # unease bed
    drone = s['dread-drone']
    place(fx, drone, 17.5, db(-33), 2.5, 2.5, length=13.0)
    place(fx, drone, 34.5, db(-28), 2.0, 2.0, length=17.5)
    place(fx, drone, 50.5, db(-26), 2.0, 0.6)
    report['sfx'] = ['room-tone', 'exterior-neon@0,52', 'tube-buzz 3.4-31 (synth)', 'door-wind 10.3-27.6 (synth)',
                     'crt-hum 31-52 (synth)', 'soft-steps@1.6,3.95..,27.75,29.35 (Noon only)', 'rear-door@28.3',
                     f"lock-clunk@{beats['lockTry1']}", f"lock-rattle@{beats['lockTry2']}", 'chain-clink',
                     'key-click@31.15,35.6,' + str(beats['liveSwitch']), 'rewind-whir@31.0',
                     f"glitch-tear@{beats['glitch']} (soft)", f"coin-slot@{beats['washerSlot'] - 0.4}",
                     f"washer-spin from {beats['washerMotor']}", 'dread-drone@17.5,34.5,50.5']

    # Room for the narration: duck every effect 6 dB inside each caption window
    pts = [(0, 0)]
    for a, b in cues:
        pts += [(max(0, a - 0.15), 0), (a, -6), (b, -6), (b + 0.25, 0)]
    pts.append((DUR, 0))
    fx *= envelope(sorted(pts))
    if args.opening_fx_db:
        fx *= envelope([(0, args.opening_fx_db), (3.4, args.opening_fx_db), (4.0, 0), (60, 0)])
        report['openingFxDb'] = args.opening_fx_db
    return voice + fx, report


def write(path, mix):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--report')
    ap.add_argument('--voice-dir', help='folder with 01..12.mp3|wav (one per caption cue); omit for the scratch mix')
    ap.add_argument('--even', action='store_true', help='loudness-match voice lines and even the whole mix (as EP1 final)')
    ap.add_argument('--opening-fx-db', type=float, default=0.0)
    args = ap.parse_args()
    mix, report = build(args)
    if args.even:
        raw = args.out + '.raw.wav'
        write(raw, mix / max(1e-9, np.abs(mix).max()) * 0.7)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af',
                        'acompressor=threshold=-26dB:ratio=3.5:attack=15:release=300:makeup=2,'
                        'dynaudnorm=f=400:g=15:m=6:p=0.9,loudnorm=I=-16:TP=-1.5:LRA=4,aresample=48000',
                        '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', args.out], check=True)
        os.remove(raw)
        out = decode(args.out)
    else:
        peak = np.abs(mix).max()
        if peak > 0.89:
            mix *= 0.89 / peak
        write(args.out, mix)
        out = mix
    report.update({'even': args.even, 'duration': round(len(out) / SR, 3),
                   'peakDbfs': round(20 * np.log10(max(1e-9, np.abs(out).max())), 2),
                   'rmsDbfs': round(20 * np.log10(max(1e-9, np.sqrt((out ** 2).mean()))), 2)})
    if args.report:
        json.dump(report, open(args.report, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(json.dumps({k: report[k] for k in ('scratch', 'even', 'duration', 'peakDbfs', 'rmsDbfs')}))


if __name__ == '__main__':
    main()
