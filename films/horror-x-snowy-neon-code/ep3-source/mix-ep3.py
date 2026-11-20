"""Mix the EP3 soundtrack (60.000 s, 48 kHz stereo WAV) — adapted from
ep2-source/mix-ep2.py (copied, not imported).

    python films/horror-x-snowy-neon-code/ep3-source/mix-ep3.py --out <mix.wav> [--report <json>]
        [--voice-dir <folder with 01..12.mp3|wav>] [--even] [--opening-fx-db -12]

Voice: line N is trimmed to its measured speech (timing.json voiceLead/
voiceSpeech) and placed at caption cue N's start. Line 11 is the voice behind
Noon: Gemini Kore, whispered — kept dry and dead centre, no pitch change.

Sources (local only, no API calls):
  ../ep1-source/audio/noon-assets/sfx/*.mp3   EP1's generated effects (read-only)
  ../ep2-source/synth_sfx.py                   EP2's synthesised effects (read-only)
  ../ep1-source/noon/coin-clink.py             the last coin under black
Mastering (loudnorm) is left to core/render/mux.sh, as in EP1/EP2.
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'ep2-source'))
import synth_sfx as syn  # noqa: E402

SR, DUR = 48000, 60.0
N = int(SR * DUR)
EP1_SFX = os.path.join(os.path.dirname(HERE), 'ep1-source', 'audio', 'noon-assets', 'sfx')


def decode(path, tempo=1.0, extra=None):
    chain = ([f'atempo={tempo:.4f}'] if abs(tempo - 1) > 1e-4 else []) + ([extra] if extra else [])
    af = ['-af', ','.join(chain)] if chain else []
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
    cues = srt_cues(os.path.join(HERE, 'captions', 'ep3.srt'))
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
        line = timing['lines'][i] if i < len(timing.get('lines', [])) else {}
        trim = 'voiceLead' in line and 'voiceSpeech' in line
        tail = 0.15 if trim else 0.0

        behind = line.get('speaker') == 'behind'
        extra = 'pan=mono|c0=0.5*c0+0.5*c1' if behind else None

        def take(tempo=1.0):
            c = decode(path, tempo, extra)
            if trim:  # drop the take's silent head/tail so the onset lands on the caption start
                a = max(0, int((line['voiceLead'] - 0.03) / tempo * SR))
                c = c[a:a + int((line['voiceSpeech'] + 0.03 + tail) / tempo * SR)]
            return c

        shift = min(0.03, line['voiceLead']) if trim else 0.0
        start -= shift
        clip = take()
        dur = len(clip) / SR
        t = max(start, prev_end + 0.12)
        nxt = cues[i + 1][0] if i + 1 < len(cues) else DUR - 0.3
        tempo = 1.0
        if t + dur - tail > nxt - 0.1:
            tempo = min(1.10, (dur - tail) / max(0.5, nxt - 0.1 - t))
            if tempo > 1.0:
                clip = take(tempo)
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
        prev_end = t + dur - tail
        report['voice'].append({'cue': i + 1, 'file': os.path.basename(path), 'start': round(t + shift, 3),
                                'end': round(t + dur, 3), 'tempo': round(tempo, 3), 'captionStart': start,
                                'captionEnd': cues[i][1], 'overrunsCaption': round(t + dur - cues[i][1], 3)})
    report['scratch'] = not clips

    # ---- effects ----------------------------------------------------------
    fx = np.zeros((N, 2))
    s = {k: decode(os.path.join(EP1_SFX, f'{k}.mp3')) for k in
         ['room-tone', 'exterior-neon', 'soft-steps', 'washer-spin', 'dread-drone', 'cloth-rustle']}
    for k, v in s.items():
        s[k] = v / max(1e-9, np.abs(v).max())
    stop, behind, black = beats['drumStop'], beats['behind'], beats['black']
    # room tone all night; after the name it thins out, and it is gone before the voice behind her
    fx += loop_to(s['room-tone'], DUR) * envelope([(0, -38), (37.6, -38), (44.5, -46), (50.6, -60), (51.0, -80), (52.9, -80),
                                                  (53.6, -48), (black, -52), (black + 0.3, -80), (60, -80)])
    # storefront exterior under the opening (kept low: the voice opens the film)
    place(fx, s['exterior-neon'], 0.0, db(-30), 0.6, 0.8, length=4.6)
    # Noon's own steps on the run back (EP1 walk-in, 0-1.4 s)
    place(fx, s['soft-steps'], 0.05, db(-30), 0.02, 0.25, length=1.5)
    # the washer: turns all night, winds down to the stop
    spin = loop_to(s['washer-spin'], DUR)
    fx += spin * envelope([(0, -27), (4.6, -22), (10.5, -27), (19.9, -27), (27.5, -25),
                           (stop - 1.6, -24), (stop, -45), (stop + 0.4, -80), (60, -80)])
    # door latch + the sheet drawn out
    place(fx, syn.lock_clunk(seed=17, strength=0.55), beats['doorOpen'] + 0.05, db(-20), 0.001, 0.1)
    place(fx, s['cloth-rustle'], beats['sheetOut'] - 0.1, db(-24), 0.05, 0.4, length=2.6)
    place(fx, s['cloth-rustle'], 34.8, db(-30), 0.2, 0.6, length=2.4)
    # dawn outside: far, thin traffic wash (filtered exterior bed)
    dawn_bed = loop_to(s['exterior-neon'], DUR)
    fx += dawn_bed * envelope([(0, -80), (20.6, -80), (27.6, -40), (44.0, -42), (50.6, -60), (51.0, -80), (60, -80)])
    # unease: low drone under the vigil and the name, cut dead before the voice behind
    drone = s['dread-drone']
    place(fx, drone, 10.0, db(-34), 3.0, 3.0, length=18.0)
    place(fx, drone, 37.8, db(-28), 1.5, 2.5, length=12.6)
    # after the voice: her turn, held breath of the room
    place(fx, drone, 53.4, db(-30), 1.2, 0.6, length=black - 53.4)
    # the last sound, under black: one coin into an empty tray
    clink = os.path.join(os.path.dirname(args.out) or '.', 'coin-clink.tmp.wav')
    subprocess.run([sys.executable, os.path.join(os.path.dirname(HERE), 'ep1-source', 'noon', 'coin-clink.py'),
                    '--times', str(beats['coinDrop']), '--strengths', '0.8', '--offset', str(beats['coinDrop'] - 0.05),
                    '--duration', '0.75', '--out', clink], check=True, capture_output=True)
    place(fx, decode(clink), beats['coinDrop'] - 0.05, db(-14), 0.002, 0.2)
    os.remove(clink)
    report['sfx'] = ['room-tone (gone 51.0-52.9)', 'exterior-neon@0 -30 dB', 'soft-steps@0.05', f'washer-spin winds down to {stop}',
                     f"lock-clunk (door latch)@{beats['doorOpen'] + 0.05}", f"cloth-rustle@{beats['sheetOut'] - 0.1},34.8",
                     'dawn exterior bed 20.6-50.6', 'dread-drone@10,37.8,53.4', f"coin-clink@{beats['coinDrop']} under black"]

    # The whole effects bus sits 30 % lower (user, 2026-11-21: narration first)
    fx *= db(args.fx_db)
    report['fxDb'] = args.fx_db
    # Room for the narration: duck every effect 6 dB inside each caption window
    pts = [(0, 0)]
    for a, b in cues:
        pts += [(max(0, a - 0.15), 0), (a, -6), (b, -6), (b + 0.25, 0)]
    pts.append((DUR, 0))
    fx *= envelope(sorted(pts))
    if args.opening_fx_db:
        fx *= envelope([(0, args.opening_fx_db), (4.6, args.opening_fx_db), (5.2, 0), (60, 0)])
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
    ap.add_argument('--fx-db', type=float, default=-3.1, help='gain on the whole effects bus (-3.1 dB = 30 % lower amplitude)')
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
