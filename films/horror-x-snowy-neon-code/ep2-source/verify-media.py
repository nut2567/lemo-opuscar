"""Verify an EP2 MP4: 1800 frames / 60.000 s / 1080x1920 @30, full decode with
no errors, no black frames, audio present and 60 s; writes a contact sheet.
    python films/horror-x-snowy-neon-code/ep2-source/verify-media.py <film.mp4> <report.json> [contact.jpg]
Exit 1 on any failure."""
import json, subprocess, sys

mp4, rep = sys.argv[1], sys.argv[2]
sheet = sys.argv[3] if len(sys.argv) > 3 else None
def run(*a): return subprocess.run(a, capture_output=True, text=True, encoding='utf-8', errors='replace')
probe = json.loads(run('ffprobe', '-v', 'error', '-count_frames', '-show_entries',
    'stream=codec_type,width,height,r_frame_rate,nb_read_frames,duration,sample_rate,channels', '-show_entries', 'format=duration',
    '-of', 'json', mp4).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = [s for s in probe['streams'] if s['codec_type'] == 'audio']
dec = run('ffmpeg', '-v', 'error', '-i', mp4, '-f', 'null', '-')
black = run('ffmpeg', '-v', 'info', '-i', mp4, '-vf', 'blackdetect=d=0.03:pic_th=0.97:pix_th=0.06', '-an', '-f', 'null', '-')
black_lines = [l for l in black.stderr.splitlines() if 'black_start' in l]
checks = {
    'frames1800': v.get('nb_read_frames') == '1800',
    'size1080x1920': (v['width'], v['height']) == (1080, 1920),
    'fps30': v['r_frame_rate'] == '30/1',
    'duration60': abs(float(probe['format']['duration']) - 60.0) < 0.05,
    'audioPresent': len(a) == 1 and abs(float(a[0].get('duration', 0)) - 60.0) < 0.1,
    'decodeClean': dec.returncode == 0 and not dec.stderr.strip(),
    'noBlackFrames': not black_lines,
}
report = {'file': mp4, 'video': v, 'audio': a, 'formatDuration': probe['format']['duration'],
          'decodeErrors': dec.stderr.strip()[:2000], 'blackdetect': black_lines, 'checks': checks, 'pass': all(checks.values())}
if sheet:
    run('ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', 'fps=1/3,scale=216:384,tile=10x2', '-frames:v', '1', sheet)
    report['contactSheet'] = sheet
json.dump(report, open(rep, 'w', encoding='utf-8'), indent=2)
print(json.dumps(checks))
sys.exit(0 if report['pass'] else 1)
