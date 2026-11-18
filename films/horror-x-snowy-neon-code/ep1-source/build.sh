#!/bin/sh
set -eu

HERE=$(CDPATH= cd "$(dirname "$0")" && pwd)
ROOT=$(CDPATH= cd "$HERE/../../.." && pwd)
cd "$ROOT"

usage() {
  cat >&2 <<'EOF'
usage: sh films/horror-x-snowy-neon-code/ep1-source/build.sh <jessica|original> <source dry WAV> <new output-dir>

Builds the 60 s EP1 picture, narration/sound mix and verified MP4/SRT into a new output directory.
Run from the repository root. <source dry WAV> must be the aligned dry narration for the selected cut.
EOF
}

die() { echo "build.sh: $*" >&2; exit 1; }

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then usage; exit 0; fi
if [ "$#" -ne 3 ]; then usage; exit 2; fi

CUT=$1
VOICE=$2
OUT=$3
[ -n "$OUT" ] || die "output directory is required"
case "$CUT" in
  jessica|original) ;;
  *) echo "build.sh: unknown cut '$CUT' (expected jessica or original)" >&2; usage; exit 2 ;;
esac
NAME="horror-x-ep1-snowy-neon-$CUT"
FINAL="$OUT/$NAME.mp4"
SRT_OUT="$OUT/$NAME.srt"
if [ -e "$OUT" ] || [ -L "$OUT" ]; then
  [ -d "$OUT" ] || die "output path exists and is not a directory: $OUT"
  [ ! -e "$FINAL" ] && [ ! -L "$FINAL" ] || die "final output already exists: $FINAL"
  [ ! -e "$SRT_OUT" ] && [ ! -L "$SRT_OUT" ] || die "final subtitle already exists: $SRT_OUT"
  [ -z "$(ls -A "$OUT")" ] || die "output directory is not empty: $OUT"
fi
[ -f "$VOICE" ] || die "source dry WAV not found: $VOICE"
[ -s "$VOICE" ] || die "source dry WAV is empty: $VOICE"

SRC=$HERE
for f in index.html entry.mjs timeline.mjs verify-timeline.mjs verify-media.py audio/mix.py "captions/$CUT.srt" "picture/$CUT.json"; do
  [ -f "$SRC/$f" ] || die "missing packaged source: films/horror-x-snowy-neon-code/ep1-source/$f"
done
for f in core/render/video.mjs core/render/mux.sh; do
  [ -f "$ROOT/$f" ] || die "missing repository tool: $f"
done
for tool in node ffmpeg ffprobe; do
  command -v "$tool" >/dev/null 2>&1 || die "$tool is required; run the repository dependency setup first"
done
[ -d "$ROOT/node_modules/playwright-core" ] || die "npm dependencies are missing; run sh plugin/skills/lemo-opuscar/scripts/setup.sh deps"

PY=""
for candidate in "$ROOT/.venv/Scripts/python.exe" "$ROOT/.venv/bin/python" python3 python; do
  if { [ -x "$candidate" ] || command -v "$candidate" >/dev/null 2>&1; } && \
     "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1; then
    PY=$candidate
    break
  fi
done
[ -n "$PY" ] || die "Python 3.9+ is required; run sh plugin/skills/lemo-opuscar/scripts/setup.sh deps"

mkdir -p "$OUT"
[ ! -e "$FINAL" ] && [ ! -L "$FINAL" ] || die "final output already exists: $FINAL"

echo "EP1 $CUT: checking timeline and captions -> $OUT"
node "$SRC/verify-timeline.mjs" "$CUT" "$OUT"

echo "EP1 $CUT: mixing narration and score -> $OUT/mix.wav"
"$PY" "$SRC/audio/mix.py" --cut "$CUT" --voice "$VOICE" --out "$OUT/mix.wav"

echo "EP1 $CUT: rendering 1080x1920 30 fps picture -> $OUT/picture.mp4"
node core/render/video.mjs "$SRC" --q "cut=$CUT" --fps 30 --size 1080x1920 \
  --workers "${SNOWY_RENDER_WORKERS:-3}" --out "$OUT/picture.mp4"

echo "EP1 $CUT: muxing and mastering -> $OUT/candidate.mp4"
LEMO_COLOR=bt709 sh core/render/mux.sh "$OUT/picture.mp4" "$OUT/mix.wav" "$OUT/candidate.mp4" 30 0

echo "EP1 $CUT: verifying final media and narration sync"
"$PY" "$SRC/verify-media.py" "$OUT/candidate.mp4" "$VOICE" "$OUT/timeline-qa.json"
cp "$SRC/captions/$CUT.srt" "$SRT_OUT"
mv "$OUT/candidate.mp4" "$FINAL"

echo "$FINAL"
echo "$SRT_OUT"
exit 0
