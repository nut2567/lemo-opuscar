#!/bin/sh
# Build the EP2 (minute 2) film: captions -> mix -> picture -> mux -> verify.
#   sh films/horror-x-snowy-neon-code/ep2-source/build.sh [output-dir] [voice-dir]
# Run from the repository root. Without a voice dir this makes the SCRATCH
# preview (picture + captions + effects/ambience, no narration):
#   <out>/horror-x-ep2-snowy-neon-noon-60s-scratch.mp4
# With a voice dir (01..12.mp3|wav, one per caption cue) it makes
#   <out>/horror-x-ep2-snowy-neon-noon-60s-voiced.mp4   (mix uses --even, as EP1 final)
# The output directory must be new or empty. No network, no paid calls.
set -eu

HERE=$(CDPATH= cd "$(dirname "$0")" && pwd)
ROOT=$(CDPATH= cd "$HERE/../../.." && pwd)
cd "$ROOT"
die() { echo "build.sh: $*" >&2; exit 1; }

OUT=${1:-$HERE/out/preview}
VOICE=${2:-}
if [ -n "$VOICE" ]; then
  [ -d "$VOICE" ] || die "voice dir not found: $VOICE"
  NAME=horror-x-ep2-snowy-neon-noon-60s-voiced
  MIXFLAGS="--voice-dir $VOICE --even"
else
  NAME=horror-x-ep2-snowy-neon-noon-60s-scratch
  MIXFLAGS=""
fi
if [ -e "$OUT" ]; then
  [ -d "$OUT" ] || die "output path is not a directory: $OUT"
  [ -z "$(ls -A "$OUT")" ] || die "output directory is not empty: $OUT"
fi
for tool in node ffmpeg ffprobe; do command -v "$tool" >/dev/null 2>&1 || die "$tool is required"; done
[ -d "$ROOT/node_modules/playwright-core" ] || die "npm dependencies missing: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps"
PY=""
for c in "$ROOT/.venv/Scripts/python.exe" "$ROOT/.venv/bin/python" python3 python; do
  if { [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; } && "$c" -c 'import numpy' >/dev/null 2>&1; then PY=$c; break; fi
done
[ -n "$PY" ] || die "Python 3 with numpy is required"
mkdir -p "$OUT"

echo "EP2: captions + timing (estimated until real voice)"
node "$HERE/make-captions.mjs"
cp "$HERE/captions/ep2.srt" "$OUT/$NAME.srt"

echo "EP2: mix -> $OUT/mix.wav"
# shellcheck disable=SC2086
"$PY" "$HERE/mix-ep2.py" --out "$OUT/mix.wav" --report "$OUT/mix-report.json" $MIXFLAGS

echo "EP2: picture 1080x1920 30 fps -> $OUT/picture.mp4"
node core/render/video.mjs "$HERE" --fps 30 --size 1080x1920 --workers "${SNOWY_RENDER_WORKERS:-3}" --out "$OUT/picture.mp4"

echo "EP2: mux -> $OUT/candidate.mp4"
LEMO_COLOR=bt709 sh core/render/mux.sh "$OUT/picture.mp4" "$OUT/mix.wav" "$OUT/candidate.mp4" 30 0

echo "EP2: verify"
"$PY" "$HERE/verify-media.py" "$OUT/candidate.mp4" "$OUT/media-qa.json" "$OUT/contact-sheet.jpg"
mv "$OUT/candidate.mp4" "$OUT/$NAME.mp4"
echo "$OUT/$NAME.mp4"
