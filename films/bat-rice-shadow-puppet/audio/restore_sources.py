"""Task E — rebuild narration.wav and soundtrack.wav for bat-rice-shadow-puppet.

Ports the audio assembly of Ai-Video episodes/bat-rice/prepare_media.py
(Gemini grouped-clip path only). Reads Ai-Video files read-only and writes
narration.wav / soundtrack.wav into this folder. No network, no TTS.

Run from the library root:
    .venv/Scripts/python.exe films/bat-rice-shadow-puppet/audio/restore_sources.py
"""
import hashlib
import json
import math
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]                       # lemo-opuscar library root
AI = Path(r'D:\peoject_wepapp\Ai-Video')      # read-only sibling project
EP = AI / 'episodes' / 'bat-rice'
SR = 48000
FPS = 30

# Prefer the same ffmpeg build Ai-Video used (imageio_ffmpeg binary), else PATH.
FF = os.environ.get('FFMPEG')
if not FF:
    try:
        import imageio_ffmpeg  # noqa: F401  (only if installed in this venv)
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FF = 'ffmpeg'
if not Path(FF).exists():
    FF = 'ffmpeg'

GROUP_PHRASES = {}


def decode(path):
    raw = subprocess.check_output(
        [FF, '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR),
         '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(raw, dtype='<f4').copy()


def trim(arr, floor=.0015):
    active = np.flatnonzero(np.abs(arr) > floor)
    if not len(active):
        raise ValueError('Empty speech')
    start = max(0, active[0] - 1200)
    end = min(len(arr), active[-1] + 1680)
    return np.pad(arr[start:end],
                  (max(0, 1200 - int(active[0])),
                   max(0, 1680 - (len(arr) - 1 - int(active[-1])))))


def retime(arr, tempo):
    if tempo == 1:
        return arr
    raw = subprocess.check_output(
        [FF, '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1',
         '-i', 'pipe:0', '-af', f'atempo={tempo:.9f}', '-f', 'f32le', 'pipe:1'],
        input=arr.astype('<f4').tobytes())
    return np.frombuffer(raw, dtype='<f4').copy()


def write_wav(path, arr):
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes((np.clip(arr, -1, 1) * 32767).astype('<i2').tobytes())


def load_groups(clips_dir, voice):
    """Cut each grouped Gemini clip into its caption phrases at the recorded cuts."""
    folder = EP / clips_dir
    alignment = json.loads((folder / 'alignment.json').read_text(encoding='utf-8'))
    jobs = json.loads((EP / 'incoming-voice/jobs.json').read_text(encoding='utf-8'))
    for job, group in zip(jobs, alignment['groups']):
        path = folder / f'{job["name"]}.wav'
        metadata = json.loads(path.with_suffix('.voice.json').read_text(encoding='utf-8'))
        if (metadata.get('provider'), metadata.get('voice_id'),
                metadata.get('model')) != ('gemini', voice['voice'], voice['model']):
            raise ValueError(f'Unexpected narrator or model in {path.name}')
        if metadata['script_sha256'] != hashlib.sha256(job['text'].encode()).hexdigest():
            raise ValueError(f'Clip text differs from jobs.json: {path.name}')
        if metadata['sha256'] != hashlib.sha256(path.read_bytes()).hexdigest():
            raise ValueError(f'Audio hash mismatch: {path.name}')
        arr = decode(path)
        texts = job['text'].split(' <short pause> ')
        edges = ([round(group.get('start', 0) * SR)]
                 + [round(cut['at'] * SR) for cut in group['cuts']]
                 + [len(arr)])
        if not (len(texts) == len(edges) - 1 and group['name'] == job['name']):
            raise ValueError(f'Alignment/jobs mismatch in {path.name}')
        floor = .02 * float(np.max(np.abs(arr)))
        for text, start, end in zip(texts, edges, edges[1:]):
            if text in GROUP_PHRASES:
                raise ValueError(f'Duplicate phrase text: {text}')
            GROUP_PHRASES[text] = dict(samples=arr[start:end], floor=floor,
                                       path=path)


def make_clip(shot, index, text):
    if text not in GROUP_PHRASES:
        raise ValueError(f'No recorded clip for phrase: {text!r} (shot {shot})')
    group = GROUP_PHRASES[text]
    arr = trim(group['samples'], group['floor'])
    return dict(shot=shot, index=index, text=text,
                source_file=group['path'].relative_to(AI).as_posix(),
                samples=arr, source_seconds=len(arr) / SR)


def main():
    story = json.loads((EP / 'story.json').read_text(encoding='utf-8'))
    clips_dir = story.get('clips_dir')
    profile = json.loads((EP / 'incoming-voice/voice-profile.json')
                         .read_text(encoding='utf-8'))
    provider = profile['provider_priority'][0]
    voice = profile['cast']['narrator']['gemini']
    assert provider == 'gemini' and clips_dir, 'expected the Gemini groups path'
    load_groups(clips_dir, voice)

    clips = []
    for shot in story['shots']:
        for index, text in enumerate(shot['phrases']):
            clips.append(make_clip(shot['id'], index, text))
    source_seconds = sum(c['source_seconds'] for c in clips)

    gap = 3
    cutgap = 4
    reveal_pause = 12
    if story.get('duration_mode') == 'natural':
        needed = (sum(math.ceil(len(c['samples']) / SR * FPS) for c in clips)
                  + (len(clips) - len(story['shots'])) * gap
                  + (len(story['shots']) - 1) * cutgap + reveal_pause)
        total = math.ceil(needed / FPS) * FPS
    else:
        total = round(story.get('duration_seconds', 60) * FPS)
    bounds = story.get('duration_range_seconds', [40, 60])
    assert bounds[0] <= total / FPS <= bounds[1]

    reserved = ((len(clips) - len(story['shots'])) * gap
                + (len(story['shots']) - 1) * cutgap + reveal_pause)
    tempo = max(1., source_seconds / ((total - reserved) / FPS))
    if tempo > 1.15:
        raise ValueError(f'Narration needs {tempo:.3f}x')
    for _ in range(4):
        for c in clips:
            arr = retime(c['samples'], tempo)
            arr = arr * (.58 / max(float(np.max(np.abs(arr))), .0001))
            c['performed'] = arr
            c['frames'] = math.ceil(len(arr) / SR * FPS)
        used = sum(c['frames'] for c in clips) + reserved
        if used <= total:
            break
        tempo *= used / total * 1.004
        if tempo > 1.15:
            raise ValueError('Measured rounded phrases exceed comfortable tempo')
    else:
        raise ValueError('Cannot fit narration')

    extra = total - used
    inner_cuts = len(story['shots']) - 1
    holds = [extra // inner_cuts + (1 if n < extra % inner_cuts else 0)
             for n in range(inner_cuts)] + [0]

    cursor = 0
    captions, report, shots = [], [], []
    speech = np.zeros(total * SR // FPS, dtype=np.float64)
    for n, shot in enumerate(story['shots']):
        start = cursor
        group = [c for c in clips if c['shot'] == shot['id']]
        for k, clip in enumerate(group):
            if shot['kind'] == 'reveal' and clip['text'] == 'ค้างข้าว!':
                cursor += reveal_pause
            arr = clip['performed']
            speech[cursor * SR // FPS:cursor * SR // FPS + len(arr)] += arr
            end = cursor + clip['frames']
            captions.append(dict(text=clip['text'],
                                 startMs=cursor * 1000 / FPS,
                                 endMs=end * 1000 / FPS, shot=shot['id']))
            report.append(dict(shot=shot['id'], index=clip['index'],
                               text=clip['text'],
                               source_file=clip['source_file'],
                               start_frame=cursor, end_frame=end,
                               decoded_output_seconds=len(arr) / SR,
                               tempo=tempo))
            cursor = end + (gap if k < len(group) - 1 else 0)
        cursor += holds[n] + (cutgap if n < inner_cuts else 0)
        shots.append(dict(id=shot['id'], kind=shot['kind'], start_frame=start,
                          end_frame=cursor, duration_frames=cursor - start))
    assert cursor == total

    # Soundtrack recipe from prepare_media.py: speech + one-shot tone events.
    mix = speech.copy()
    for shot in shots:
        if shot['kind'] not in ['first', 'storm', 'heavy', 'reveal']:
            continue
        length = shot['duration_frames'] / FPS
        if shot['kind'] == 'reveal':
            offsets = [next(r['start_frame'] / FPS for r in report
                            if r['text'] == 'ค้างข้าว!') - shot['start_frame'] / FPS]
        elif shot['kind'] in ['first', 'storm', 'heavy']:
            offsets = [length * .88]
        else:
            offsets = list(np.arange(11.25 / 30, length - .25, 45 / 30))
        for offset in offsets:
            event = (shot['start_frame'] / FPS) + offset
            tt = np.arange(int(SR * .12)) / SR
            hz = 700 if shot['kind'] == 'reveal' else 170
            effect = .055 * np.sin(2 * np.pi * hz * tt) * np.exp(-tt * 45)
            first = int(event * SR)
            mix[first:first + len(effect)] += effect

    out_narr = HERE / 'narration.wav'
    out_bed = HERE / 'soundtrack.wav'
    write_wav(out_narr, speech)
    write_wav(out_bed, mix)

    # Compare rebuilt caption starts with the film's master timeline.json.
    film_tl = json.loads((ROOT / 'films' / 'bat-rice-shadow-puppet' / 'source'
                          / 'timeline.json').read_text(encoding='utf-8'))
    film_caps = film_tl['captions']
    assert len(film_caps) == len(captions)
    for fc, rc in zip(film_caps, captions):
        assert fc['text'] == rc['text']
        assert abs(fc['startMs'] - rc['startMs']) < 1e-6, (
            fc['text'], fc['startMs'], rc['startMs'])

    summary = dict(
        ffmpeg=FF, tempo=tempo, total_seconds=total / FPS,
        phrases=len(clips), narration=str(out_narr), soundtrack=str(out_bed),
        narration_peak=float(np.abs(speech).max()),
        soundtrack_peak=float(np.abs(mix).max()),
        phrase_report=report)
    ev = ROOT / '.agent-runs' / 'bat-front-light' / 'evidence' / 'E'
    ev.mkdir(parents=True, exist_ok=True)
    (ev / 'restore_report.json').write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in summary.items() if k != 'phrase_report'},
                     ensure_ascii=False))
    print(f'phrases={len(clips)} tempo={tempo} -> narration.wav + soundtrack.wav')


if __name__ == '__main__':
    main()
