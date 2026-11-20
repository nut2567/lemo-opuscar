"""Behavioural look check for the Revision-2 bat/light fixes (CONTRACT.md).

Run from the library root:
  .venv/Scripts/python.exe films/bat-rice-shadow-puppet/qa/look_check.py [--out films/bat-rice-shadow-puppet/qa/look] [--keep]

Renders three still sets with core/render/still.mjs (q = nosub, nosub&only=bat,
nosub&only=none), derives the bat mask per time as |bat-none| max-channel diff >
MASK_DIFF eroded by ERODE_PX, then checks:
  bat_front          bat is opaque: full == bat inside the mask
  day_exposure       daylight is not glaring (bare cloth and full frame)
  night_blue         night reads as a blue sky
  bat_readable_night the bat stays readable at night

Writes <out>/look.json and <out>/contact.jpg; prints one line per check.
Exit 0 all pass, 1 any check fails, 2 render/tool error.
"""
import argparse, json, subprocess, sys, tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]          # library root
FILM = ROOT / 'films' / 'bat-rice-shadow-puppet'
STILL_MJS = ROOT / 'core' / 'render' / 'still.mjs'
SHEET_PY = ROOT / 'core' / 'render' / 'sheet.py'
SIZE = '1080x1920'

# --- times (the lead may retime these) ---
OVERLAP_TIMES = [12.0, 23.0, 27.9, 38.5, 43.0, 44.0, 48.5, 55.0]
DAY_TIMES = [12.0, 16.0, 23.0, 36.0, 43.0, 55.0]
NIGHT_TIMES = [2.0, 9.8, 27.9, 51.5, 58.2]
NIGHT_BAT_TIMES = [2.0, 9.8, 58.2]

# --- thresholds ---
MASK_DIFF = 24            # max channel diff bat-vs-none that counts as bat pixel
ERODE_PX = 4              # MinFilter size = 2*ERODE_PX+1
MIN_MASK_AREA = 3000.0    # px
MAX_FULL_BAT_MEAN_ABS = 8.0    # mean |full-bat| channel diff inside mask
HOT_DIFF = 40.0           # per-pixel max channel diff counted as "different"
MAX_FULL_BAT_HOT_SHARE = 0.03   # share of mask pixels above HOT_DIFF
CLOTH_X = (100, 980)      # day_exposure rectangle (half-open slices)
CLOTH_Y = (150, 1300)
NIGHT_Y = (150, 1100)
DAY_LUM_MED_MIN, DAY_LUM_MED_MAX = 150.0, 232.0
DAY_HOT = 250             # pixel value counted as clipped
DAY_NONE_HOT_MAX = 0.02
DAY_FULL_HOT_MAX = 0.04
NIGHT_BMR_MIN = 30.0      # mean B - mean R
NIGHT_BAT_LUM_MIN = 55.0
NIGHT_BAT_DIST_MIN = 45.0
NIGHT_LUM_MED_MIN, NIGHT_LUM_MED_MAX = 25.0, 150.0

ALL_TIMES = sorted(set(OVERLAP_TIMES + DAY_TIMES + NIGHT_TIMES + NIGHT_BAT_TIMES))
SETS = {'full': 'nosub', 'bat': 'nosub&only=bat', 'none': 'nosub&only=none'}


def tstr(t):
    return f'{t:.2f}'


def render_set(stills_dir, prefix, q):
    """One still.mjs call per set; non-zero exit is a hard error (exit 2)."""
    times = [tstr(t) for t in ALL_TIMES]
    cmd = ['node', str(STILL_MJS), str(FILM), *times,
           '--size', SIZE, '--q', q,
           '--out', str(stills_dir), '--prefix', prefix + '_']
    r = subprocess.run(cmd, cwd=ROOT)
    if r.returncode != 0:
        print(f'ERROR: still.mjs exited {r.returncode} for set {prefix} (q={q})', file=sys.stderr)
        sys.exit(2)


def load(stills_dir, prefix, t):
    f = stills_dir / f'{prefix}_{tstr(t)}.jpg'
    if not f.exists():
        print(f'ERROR: missing still {f}', file=sys.stderr)
        sys.exit(2)
    return np.asarray(Image.open(f).convert('RGB'), dtype=np.float64)


def rect(a, x0, x1, y0, y1):
    return a[y0:y1, x0:x1]


def lum(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def bat_mask(bat, none):
    """Pixels that differ between bat and none stills, eroded by ERODE_PX."""
    d = np.abs(bat - none).max(axis=2)
    m = Image.fromarray((d > MASK_DIFF).astype(np.uint8) * 255, 'L')
    m = m.filter(ImageFilter.MinFilter(2 * ERODE_PX + 1))
    return np.asarray(m) > 0


def fmt(x):
    return f'{x:.3f}' if isinstance(x, float) else str(x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(FILM / 'qa' / 'look'))
    ap.add_argument('--keep', action='store_true', help='keep stills under <out>/stills')
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    if args.keep:
        stills_dir = out / 'stills'
        stills_dir.mkdir(parents=True, exist_ok=True)
    else:
        stills_dir = Path(tempfile.mkdtemp(prefix='look_check_'))

    for prefix, q in SETS.items():
        print(f'rendering {prefix} (q={q}) ...', flush=True)
        render_set(stills_dir, prefix, q)

    checks = []
    cache = {}

    def img(kind, t):
        key = (kind, t)
        if key not in cache:
            cache[key] = load(stills_dir, kind, t)
        return cache[key]

    def add(name, t, ok, metrics, limits):
        checks.append({'name': name, 't': t, 'pass': bool(ok),
                       'metrics': metrics, 'limits': limits})
        print(f'{name:22s} t={tstr(t):>6s} {"PASS" if ok else "FAIL"}  '
              + ' '.join(f'{k}={fmt(v)}' for k, v in metrics.items()), flush=True)

    # --- bat_front: at overlap times the bat must be opaque and in front ---
    for t in OVERLAP_TIMES:
        full, bat, none = img('full', t), img('bat', t), img('none', t)
        m = bat_mask(bat, none)
        area = float(m.sum())
        if area < MIN_MASK_AREA:
            add('bat_front', t, False, {'mask_area': area},
                {'min_mask_area': MIN_MASK_AREA})
            continue
        d = np.abs(full - bat)
        mad = float(d[m].mean())
        hot = float((d[m].max(axis=1) > HOT_DIFF).mean())
        ok = mad <= MAX_FULL_BAT_MEAN_ABS and hot <= MAX_FULL_BAT_HOT_SHARE
        add('bat_front', t, ok,
            {'mask_area': area, 'full_bat_mean_abs': mad, 'full_bat_hot_share': hot},
            {'min_mask_area': MIN_MASK_AREA,
             'max_full_bat_mean_abs': MAX_FULL_BAT_MEAN_ABS,
             'max_full_bat_hot_share': MAX_FULL_BAT_HOT_SHARE})

    # --- day_exposure: daylight must not be glaring ---
    for t in DAY_TIMES:
        none, full = img('none', t), img('full', t)
        x0, x1 = CLOTH_X; y0, y1 = CLOTH_Y
        n = rect(none, x0, x1, y0, y1)
        f = rect(full, x0, x1, y0, y1)
        nl = lum(n)
        med = float(np.median(nl))
        n_hot = float((n.max(axis=2) >= DAY_HOT).mean())
        f_hot = float((f.max(axis=2) >= DAY_HOT).mean())
        ok = (DAY_LUM_MED_MIN <= med <= DAY_LUM_MED_MAX
              and n_hot <= DAY_NONE_HOT_MAX and f_hot <= DAY_FULL_HOT_MAX)
        add('day_exposure', t, ok,
            {'none_lum_median': med, 'none_hot_share': n_hot, 'full_hot_share': f_hot},
            {'lum_median': [DAY_LUM_MED_MIN, DAY_LUM_MED_MAX],
             'max_none_hot_share': DAY_NONE_HOT_MAX,
             'max_full_hot_share': DAY_FULL_HOT_MAX})

    # --- night_blue: night sky must read blue ---
    for t in NIGHT_TIMES:
        none = img('none', t)
        n = rect(none, CLOTH_X[0], CLOTH_X[1], NIGHT_Y[0], NIGHT_Y[1])
        mr = float(n[..., 0].mean()); mg = float(n[..., 1].mean()); mb = float(n[..., 2].mean())
        med = float(np.median(lum(n)))
        bmr = mb - mr
        ok = (bmr >= NIGHT_BMR_MIN and mb >= mg
              and NIGHT_LUM_MED_MIN <= med <= NIGHT_LUM_MED_MAX)
        add('night_blue', t, ok,
            {'mean_r': mr, 'mean_g': mg, 'mean_b': mb, 'b_minus_r': bmr,
             'lum_median': med},
            {'min_b_minus_r': NIGHT_BMR_MIN, 'min_b_ge_g': True,
             'lum_median': [NIGHT_LUM_MED_MIN, NIGHT_LUM_MED_MAX]})

    # --- bat_readable_night: bat must stay readable at night ---
    for t in NIGHT_BAT_TIMES:
        bat, none = img('bat', t), img('none', t)
        m = bat_mask(bat, none)
        area = float(m.sum())
        if area < MIN_MASK_AREA:
            add('bat_readable_night', t, False, {'mask_area': area},
                {'min_mask_area': MIN_MASK_AREA})
            continue
        b = bat[m]
        b_lum = float(lum(b).mean())
        dist = float(np.sqrt(((bat - none) ** 2).sum(axis=2)[m]).mean())
        ok = b_lum >= NIGHT_BAT_LUM_MIN and dist >= NIGHT_BAT_DIST_MIN
        add('bat_readable_night', t, ok,
            {'mask_area': area, 'bat_lum_mean': b_lum, 'bat_none_dist': dist},
            {'min_mask_area': MIN_MASK_AREA,
             'min_bat_lum_mean': NIGHT_BAT_LUM_MIN,
             'min_bat_none_dist': NIGHT_BAT_DIST_MIN})

    # --- contact sheet of the full stills in time order ---
    sheet_files = [str(stills_dir / f'full_{tstr(t)}.jpg') for t in ALL_TIMES]
    sheet_files = [f for f in sheet_files if Path(f).exists()]
    if sheet_files:
        r = subprocess.run([sys.executable, str(SHEET_PY), str(out / 'contact.jpg'),
                            *sheet_files, '--cols', '4', '--w', '270'], cwd=ROOT)
        if r.returncode != 0:
            print('ERROR: sheet.py failed', file=sys.stderr)
            sys.exit(2)

    npass = sum(1 for c in checks if c['pass'])
    result = {'pass': npass == len(checks), 'checks': checks}
    (out / 'look.json').write_text(json.dumps(result, indent=1))
    print(f'look_check: {npass}/{len(checks)} checks passed -> {out / "look.json"}')
    sys.exit(0 if result['pass'] else 1)


if __name__ == '__main__':
    main()
