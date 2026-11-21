from pathlib import Path
import hashlib
import json
import subprocess
import sys

import numpy as np
from PIL import Image

def run(*args):
    return subprocess.check_output(args)

def probe(path):
    return json.loads(run('ffprobe', '-v', 'error', '-count_frames',
        '-show_streams', '-show_format', '-of', 'json', str(path)))

def audio_hash(path):
    return run('ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0',
        '-c:a', 'copy', '-f', 'hash', '-hash', 'sha256', '-').decode().strip()

def frame(path, t):
    raw = run('ffmpeg', '-v', 'error', '-ss', str(t), '-i', str(path),
        '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-')
    return np.frombuffer(raw, dtype=np.uint8).reshape(1920, 1080, 3)

before, after = map(Path, sys.argv[1:])
src_info, final_info = probe(before), probe(after)
video, audio = final_info['streams']
assert video['codec_name'] == 'h264' and audio['codec_name'] == 'aac'
assert (video['width'], video['height'], video['avg_frame_rate'], video['nb_read_frames']) == (1080, 1920, '30/1', '5400')
assert video['pix_fmt'] == 'yuv420p'
assert all(video[k] == src_info['streams'][0][k] for k in ('color_space','color_transfer','color_primaries','color_range','start_time'))
for stream in (video, audio):
    assert float(stream['duration']) == 180
for field in ('duration','start_time','sample_rate','channels','nb_read_frames'):
    assert audio[field] == src_info['streams'][1][field]
source_audio_hash = audio_hash(before)
assert audio_hash(after) == source_audio_hash
alpha = Image.open(Path(__file__).parent / 'brand.png').getchannel('A')
mask = np.zeros((1920,1080),dtype=bool)
mask[60:240] = np.array(alpha) > 210
checks = []
for t in (0, 18, 61, 90, 121, 152, 171, 179.966667):
    original, brand = frame(before,t), frame(after,t)
    diff=np.abs(original.astype(np.int16)-brand).mean(axis=2)
    changed_logo=round(float(diff[mask].mean()), 2)
    changed_picture=round(float(diff[260:].mean()), 2)
    assert changed_logo > 14 and changed_picture < 4, (t, changed_logo, changed_picture)
    checks.append({'time':t, 'logo_mean_rgb_diff':changed_logo,'picture_mean_rgb_diff':changed_picture})
print(json.dumps({'frames':5400,'duration_seconds':180,'video':'1080x1920 H264 BT.709 @ 30fps',
      'aac_packet_hash':source_audio_hash,'source_srt_sha256':hashlib.sha256(before.with_suffix('.srt').read_bytes()).hexdigest(),
      'checks':checks},indent=2))
