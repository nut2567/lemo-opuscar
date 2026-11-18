"""Check the final encode against the unchanged narration timeline and export review frames."""

import io
import json
from pathlib import Path
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw


FPS = 30
RATE = 8000
DURATION = 60


def run(*args):
    result = subprocess.run(args, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', 'replace'))
    return result.stdout, result.stderr.decode('utf-8', 'replace')


def waveform(path):
    pcm, _ = run('ffmpeg', '-v', 'error', '-xerror', '-i', path, '-vn', '-ac', '1',
                 '-ar', str(RATE), '-f', 'f32le', '-')
    return np.frombuffer(pcm, dtype='<f4')


def check_voice(voice, movie, cues):
    dry = waveform(voice)
    mixed = waveform(movie)
    radius = round(RATE * .040)
    results = []
    for cue in cues:
        start = round(cue['start'] * RATE)
        end = round(cue['end'] * RATE)
        for fraction in (.35, .68):
            center = round(start + (end - start) * fraction)
            half = min(round(RATE * .33), (end - start) // 4)
            left, right = center - half, center + half
            reference = dry[left:right].copy()
            reference -= reference.mean()
            window = mixed[left - radius:right + radius].copy()
            window -= window.mean()
            scores = np.correlate(window, reference, 'valid')
            index = int(scores.argmax())
            observed = window[index:index + len(reference)]
            norm = np.linalg.norm(reference) * np.linalg.norm(observed)
            score = float(scores[index] / norm) if norm else 0.0
            lag = (index - radius) / RATE
            if score < .69 or abs(lag) > .010:
                raise ValueError(f"Cue {cue['number']}: low narration match {score:.3f} at {lag:+.4f}s")
            results.append({'cue': cue['number'], 'correlation': round(score, 4),
                            'offset_ms': round(lag * 1000, 2)})
    return results


def extract(movie, frame, width=None):
    # Seek just before the target presentation timestamp.
    time = max(0, frame / FPS - .0001)
    args = ['-vf', f'scale={width}:-2'] if width else []
    jpeg, _ = run('ffmpeg', '-v', 'error', '-xerror', '-ss', f'{time:.6f}', '-i', movie,
                  *args, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-q:v', '2', '-')
    return Image.open(io.BytesIO(jpeg)).convert('RGB')


def save_sheet(movie, dest, rows):
    width, label_height = 195, 22
    height = round(width * 1920 / 1080)
    sheet = Image.new('RGB', (width * len(rows[0]), (height + label_height) * len(rows)), '#141418')
    draw = ImageDraw.Draw(sheet)
    for row, samples in enumerate(rows):
        for col, (frame, label) in enumerate(samples):
            x, y = col * width, row * (height + label_height)
            draw.text((x + 6, y + 5), label, fill='#f2efed')
            im = extract(movie, frame, width + 1).resize((width, height), Image.Resampling.LANCZOS)
            sheet.paste(im, (x, y + label_height))
    sheet.save(dest, quality=91)


def verify(movie, voice, timeline):
    qa = json.loads(timeline.read_text(encoding='utf-8'))
    out = timeline.parent
    probe = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format',
                           '-of', 'json', movie)[0])
    video, audio = probe['streams']
    if not (video['codec_name'] == 'h264' and video['width'] == 1080 and video['height'] == 1920
            and video['r_frame_rate'] == '30/1' and int(video['nb_frames']) == DURATION * FPS
            and audio['codec_name'] == 'aac' and int(audio['sample_rate']) == 48000
            and int(audio['channels']) == 2
            and all(float(stream['start_time']) == 0 and float(stream['duration']) == DURATION
                    for stream in (video, audio))
            and float(probe['format']['duration']) == DURATION):
        raise ValueError('Expected 60.000 s of 1080×1920 H.264 at 30 fps plus 48 kHz stereo AAC')
    _, log = run('ffmpeg', '-hide_banner', '-nostats', '-xerror', '-i', movie,
                 '-vf', 'blackdetect=d=0.033:pix_th=0.05', '-af', 'ebur128=peak=true',
                 '-f', 'null', '-')
    if 'black_start:' in log:
        raise ValueError('Black frame run detected in final encode')
    summary = log.rsplit('Summary:', 1)[-1]
    loudness = float(re.search(r'\bI:\s+(-?[\d.]+) LUFS', summary)[1])
    peak = float(re.search(r'\bPeak:\s+(-?[\d.]+) dBFS', summary)[1])
    if not (-16 <= loudness <= -13 and peak <= -1):
        raise ValueError(f'Unexpected final loudness {loudness} LUFS / {peak} dBTP')
    cues = qa['reviewed']
    qa['narration'] = check_voice(voice, movie, cues)
    qa['encode'] = {'duration': DURATION, 'frames': int(video['nb_frames']),
                    'lufs': loudness, 'dbtp': peak, 'full_decode': True, 'black_runs': 0}
    (out / 'media-qa.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    samples = [(cue['frame'], f"{cue['number']:02d}  {cue['frame']/FPS:05.2f}s  {cue['shot']}") for cue in cues]
    save_sheet(movie, out / 'contact-sheet.jpg', [samples[:6], samples[6:]])
    key_events = [event for event in qa['events'] if event['type'] != 'washer']
    rows = []
    for event in key_events:
        base = round(event['t'] * FPS)
        frames = [base + offset for offset in (-12, -6, 0, 6, 12)]
        rows.append([(frame, f"{event['type']}  {frame/FPS:.2f}s") for frame in frames])
    save_sheet(movie, out / 'action-strip.jpg', rows)
    extract(movie, 748).save(out / 'poster.jpg', quality=94)
    print(f"{qa['version']}: 60.000s, 1800 frames, {loudness} LUFS / {peak} dBTP, 12 narration checks")


if __name__ == '__main__':
    verify(*(Path(item) for item in sys.argv[1:]))
