"""Mix the Noon-revision soundtrack (60.000 s, 48 kHz stereo WAV).

    python films/horror-x-snowy-neon-code/ep1-source/noon/mix-noon.py --out <mix.wav> [--report <json>]

Inputs (all inside ep1-source/):
  audio/noon-assets/voice/01..12.mp3  ElevenLabs Jessica lines (one per jessica.srt cue)
  audio/noon-assets/sfx/*.mp3         ElevenLabs sound effects (prompts in *.txt / jobs.json)
  noon/coin-clink.py                  deterministic coin-on-coin clinks (exact picture sync)
Voice lines start at their caption cue; if a line would run into the next
cue it is sped up at most 10 % and, if still long, the next line waits.
No footsteps near the customer beats (cue 10: "ไม่มีเสียงฝีเท้า").
Mastering (loudnorm -14 LUFS) is left to core/render/mux.sh.
"""
import argparse, json, os, subprocess, sys, tempfile
import numpy as np

SR, DUR = 48000, 60.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
VOICE = os.path.join(SRC, 'audio', 'noon-assets', 'voice')
SFX = os.path.join(SRC, 'audio', 'noon-assets', 'sfx')


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
    fi, fo = max(1, int(fade_in * SR)), max(1, int(fade_out * SR))
    fi, fo = min(fi, len(clip)), min(fo, len(clip))
    clip[:fi] *= np.linspace(0, 1, fi)[:, None]
    clip[-fo:] *= np.linspace(1, 0, fo)[:, None]
    e = min(N, s + len(clip))
    if e > s >= 0:
        bus[s:e] += clip[:e - s] * gain


def loop_to(clip, seconds):
    n = int(seconds * SR)
    reps = int(np.ceil(n / len(clip)))
    return np.concatenate([clip] * reps)[:n]


def envelope(points):
    """Piecewise-linear gain over the timeline from [(t, gain_db), ...]."""
    ts = np.arange(N) / SR
    xs = [p[0] for p in points]
    ys = [db(p[1]) for p in points]
    return np.interp(ts, xs, ys)[:, None]


def srt_cues(path):
    cues = []
    for block in open(path, encoding='utf-8').read().strip().split('\n\n'):
        lines = block.splitlines()
        a, b = lines[1].split(' --> ')
        sec = lambda s: int(s[:2]) * 3600 + int(s[3:5]) * 60 + float(s[6:].replace(',', '.'))
        cues.append((sec(a), sec(b)))
    return cues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--report')
    args = ap.parse_args()
    report = {'voice': [], 'sfx': []}

    # ---- narration --------------------------------------------------------
    voice = np.zeros((N, 2))
    cues = srt_cues(os.path.join(SRC, 'captions', 'jessica.srt'))
    prev_end = 0.0
    for i, (start, _end) in enumerate(cues):
        path = os.path.join(VOICE, f'{i + 1:02d}.mp3')
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
        clip /= max(1e-9, np.abs(clip).max())
        place(voice, clip, t, 0.5, 0.005, 0.03)
        prev_end = t + dur
        report['voice'].append({'cue': i + 1, 'start': round(t, 3), 'end': round(t + dur, 3), 'tempo': round(tempo, 3),
                                'captionStart': start})

    # ---- effects ----------------------------------------------------------
    fx = np.zeros((N, 2))
    s = {k: decode(os.path.join(SFX, f'{k}.mp3')) for k in
         ['room-tone', 'exterior-neon', 'rear-door', 'soft-steps', 'washer-spin', 'coin-slot', 'cloth-rustle', 'dread-drone']}
    for k, v in s.items():
        s[k] = v / max(1e-9, np.abs(v).max())

    # room tone the whole film, quieter outside, slight dip for the coin macro silence
    room = loop_to(s['room-tone'], DUR) * envelope([(0, -40), (5.4, -40), (5.9, -27), (20.6, -27), (21.2, -33),
                                                    (23.4, -33), (24.4, -27), (60, -27)])
    fx += room
    place(fx, s['exterior-neon'], 0.0, db(-20), 0.4, 0.6, length=6.0)          # storefront opening
    place(fx, s['rear-door'], 5.78, db(-22), 0.01, 0.3)                         # rear-entry: door
    place(fx, s['soft-steps'], 6.15, db(-24), 0.01, 0.2, length=1.6)            # her steps out of the doorway
    place(fx, s['soft-steps'], 8.55, db(-31), 0.01, 0.2, length=1.5)            # walk-in, heard through the glass
    washer = loop_to(s['washer-spin'], DUR) * envelope([(0, -80), (11.4, -80), (12.4, -34), (14.3, -34), (14.6, -19),
                                                        (17.0, -19), (17.6, -33), (20.6, -33), (21.1, -44), (23.6, -44),
                                                        (24.6, -33), (31.6, -33), (33.4, -24), (39.6, -24), (40.4, -35),
                                                        (60, -35)])
    fx += washer
    place(fx, s['coin-slot'], 32.35, db(-18), 0.005, 0.3)                       # coin in slot ~32.75, motor 33.53
    place(fx, s['cloth-rustle'], 40.80, db(-24), 0.05, 0.4)                     # hem slips behind the jamb; no steps
    drone = s['dread-drone']
    place(fx, drone, 24.6, db(-30), 2.0, 2.5, length=10.0)                      # customer / faceless unease
    place(fx, drone, 38.0, db(-27), 2.5, 3.0)                                   # rear exit onward (22 s)

    # coin-on-coin clinks, generated to the exact picture impact times
    with tempfile.TemporaryDirectory() as tmp:
        stem = os.path.join(tmp, 'clinks.wav')
        subprocess.run([sys.executable, os.path.join(HERE, 'coin-clink.py'), '--times', '21.58,21.82,22.06,53.95',
                        '--strengths', '0.63,1.0,0.71,0.45', '--full-timeline', '--duration', '60', '--out', stem],
                       check=True, capture_output=True)
        clinks = decode(stem)
    clinks /= max(1e-9, np.abs(clinks).max())
    fx[:len(clinks)] += clinks[:N] * db(-9)
    report['sfx'] = ['room-tone', 'exterior-neon@0', 'rear-door@5.78', 'soft-steps@6.15,8.55', 'washer-spin (enveloped)',
                     'coin-slot@32.35', 'cloth-rustle@40.80', 'dread-drone@24.6,38.0',
                     'coin-clink.py @21.58/21.82/22.06 (+53.95 decision coin)']

    mix = voice + fx
    peak = np.abs(mix).max()
    if peak > 0.89:
        mix *= 0.89 / peak
    out = np.clip(mix, -1, 1)
    pcm = (out * 32767).astype('<i2').tobytes()
    import wave
    with wave.open(args.out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm)
    report.update({'duration': N / SR, 'peakDbfs': round(20 * np.log10(max(1e-9, np.abs(out).max())), 2),
                   'rmsDbfs': round(20 * np.log10(max(1e-9, np.sqrt((out ** 2).mean()))), 2)})
    if args.report:
        json.dump(report, open(args.report, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
