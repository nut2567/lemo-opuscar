"""Mix the Noon-revision soundtrack (60.000 s, 48 kHz stereo WAV).

    python films/horror-x-snowy-neon-code/ep1-source/noon/mix-noon.py --out <mix.wav> [--report <json>]

Inputs (all inside ep1-source/):
  audio/noon-assets/voice/01..12.mp3  ElevenLabs Jessica lines (one per jessica.srt cue)
  audio/noon-assets/sfx/*.mp3         ElevenLabs sound effects (prompts in *.txt / jobs.json)
  noon/coin-clink.py                  deterministic coin-on-coin clinks (exact picture sync)
  audio/noon-assets/voice-leda-normal/01..12.wav  Gemini Leda normal takes (raw WAV; use with
                                      --srt captions/leda-normal.srt --timing noon/leda-normal-timing.json)
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


TONE = {'af': None}   # set by --tone low: extra ffmpeg filters for every source


def decode(path, tempo=1.0, kind='sfx'):
    chain = []
    if abs(tempo - 1) > 1e-4:
        chain.append(f'atempo={tempo:.4f}')
    if TONE['af']:
        chain.append(TONE['af'][kind])
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
    ap.add_argument('--tone', choices=['normal', 'low'], default='normal',
                    help='low: pitch every source down (rubberband, timing kept) and darken the top end')
    ap.add_argument('--voice-dir', default='voice',
                    help="folder under audio/noon-assets with 01..12.mp3 (voice = first take, voice-whisper = all lines whispered)")
    ap.add_argument('--opening-fx-db', type=float, default=0.0,
                    help='gain for ALL effects during the opening 0-11 s (ramps back by 11.8 s); -6 = half, so the narration is not masked')
    ap.add_argument('--even', action='store_true',
                    help='level each voice line by loudness (not peak) and even the whole mix (compressor + LRA-limited loudnorm)')
    ap.add_argument('--srt', default=os.path.join(SRC, 'captions', 'jessica.srt'),
                    help='caption track whose cue starts place the lines (default captions/jessica.srt)')
    ap.add_argument('--timing',
                    help='measured-take timing JSON (noon/leda-normal-timing.json): each take is cut to its measured '
                         'speech (after its pause edits) with 0.03 s pre-roll, so the spoken onset lands on the caption start')
    args = ap.parse_args()
    if args.tone == 'low':
        TONE['af'] = {
            # voice: -3 semitones, formants kept so she stays a woman, softer highs, a little low-mid body
            'voice': 'rubberband=pitch=0.8409:formant=preserved,lowpass=f=6500,bass=g=3:f=180',
            # effects / clinks: -4 semitones and darker
            'sfx': 'rubberband=pitch=0.7937,lowpass=f=5000',
        }
    report = {'voice': [], 'sfx': []}

    # ---- narration --------------------------------------------------------
    voice = np.zeros((N, 2))
    cues = srt_cues(args.srt)
    timing = json.load(open(args.timing, encoding='utf-8'))['lines'] if args.timing else None
    if timing is not None and len(timing) != len(cues):
        raise SystemExit(f'mix-noon.py: {args.timing} has {len(timing)} lines, {args.srt} has {len(cues)} cues')
    prev_end = 0.0
    for i, (start, _end) in enumerate(cues):
        stem = os.path.join(SRC, 'audio', 'noon-assets', args.voice_dir, f'{i + 1:02d}')
        # .mp3 first (the committed Jessica/whisper/Leda dirs hold trimmed MP3s);
        # a dir of raw Gemini takes holds only .wav
        path = next((stem + ext for ext in ('.mp3', '.wav') if os.path.isfile(stem + ext)), None)
        if path is None:
            raise SystemExit(f'mix-noon.py: missing voice line {stem}.mp3/.wav')
        line = timing[i] if timing is not None else None
        tail = 0.15 if line else 0.0
        shift = min(0.03, line['voiceLead']) if line else 0.0

        def take(tempo=1.0):
            c = decode(path, tempo, kind='voice')
            if line:
                # shorten long silent pauses (file seconds, 10 ms crossfades),
                # then cut to the measured speech with 0.03 s pre-roll
                for a, b in sorted(line.get('edits', []), reverse=True):
                    ia, ib, xf = int(a / tempo * SR), int(b / tempo * SR), int(0.01 * SR)
                    ramp = np.linspace(1, 0, xf)[:, None]
                    head = c[:ia].copy()
                    head[-xf:] = head[-xf:] * ramp + c[ib:ib + xf] * (1 - ramp)
                    c = np.concatenate([head, c[ib + xf:]])
                lead = max(0, int((line['voiceLead'] - shift) / tempo * SR))
                c = c[lead:lead + int((line['editedSpeech'] + shift + tail) / tempo * SR)]
            return c

        clip = take()
        dur = len(clip) / SR
        t = max(start - shift, prev_end + 0.12)
        nxt = cues[i + 1][0] if i + 1 < len(cues) else DUR - 0.3
        tempo = 1.0
        if t + dur - tail > nxt - 0.1:
            tempo = min(1.10, (dur - tail) / max(0.5, nxt - 0.1 - t))
            if tempo > 1.0:
                clip = take(tempo)
                dur = len(clip) / SR
        if args.even:
            # same loudness for every line: RMS over the voiced part (gate -45 dBFS)
            mono = np.abs(clip).mean(axis=1)
            active = clip[mono > db(-45) * mono.max()]
            rms = np.sqrt((active ** 2).mean()) if len(active) else 1e-9
            clip *= db(-20) / max(1e-9, rms)
            clip = np.tanh(clip * 1.4) / 1.4        # soft-clip the odd loud syllable
            place(voice, clip, t, 1.0, 0.005, 0.03)
        else:
            clip /= max(1e-9, np.abs(clip).max())
            place(voice, clip, t, 0.5, 0.005, 0.03)
        prev_end = t + dur - tail
        entry = {'cue': i + 1, 'start': round(t + shift, 3), 'end': round(t + dur, 3), 'tempo': round(tempo, 3),
                 'captionStart': start}
        if line:
            entry.update({'file': os.path.basename(path), 'speechEnd': round(t + dur - tail, 3),
                          'captionEnd': cues[i][1], 'pauseEditsS': round(sum(b - a for a, b in line.get('edits', [])), 3)})
        report['voice'].append(entry)

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

    if args.opening_fx_db:
        fx *= envelope([(0, args.opening_fx_db), (11.0, args.opening_fx_db), (11.8, 0), (60, 0)])
        report['openingFxDb'] = args.opening_fx_db
    mix = voice + fx
    if args.even:
        # Even the whole clip: write the raw mix, then compressor + LRA-limited
        # loudnorm in ffmpeg so quiet and loud passages sit at one level.
        import wave
        raw = args.out + '.raw.wav'
        pre = mix / max(1e-9, np.abs(mix).max()) * 0.7
        with wave.open(raw, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(pre, -1, 1) * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af',
                        'acompressor=threshold=-26dB:ratio=3.5:attack=15:release=300:makeup=2,'
                        'dynaudnorm=f=400:g=15:m=6:p=0.9,'
                        'loudnorm=I=-16:TP=-1.5:LRA=4,aresample=48000',
                        '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', args.out], check=True)
        os.remove(raw)
        out = decode(args.out)
        report.update({'tone': args.tone, 'even': True, 'duration': len(out) / SR,
                       'peakDbfs': round(20 * np.log10(max(1e-9, np.abs(out).max())), 2),
                       'rmsDbfs': round(20 * np.log10(max(1e-9, np.sqrt((out ** 2).mean()))), 2)})
        if args.report:
            json.dump(report, open(args.report, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(json.dumps({k: report[k] for k in ('tone', 'even', 'duration', 'peakDbfs', 'rmsDbfs')}))
        return
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
