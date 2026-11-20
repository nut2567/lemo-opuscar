#!/bin/sh
# Join the three 60 s episodes into one 3-minute film WITHOUT re-rendering:
#   sh films/horror-x-snowy-neon-code/join-episodes.sh <ep1.mp4> <ep2.mp4> <ep3.mp4> <new-output-dir>
# Run from the repository root. Each <epN.mp4> needs its .srt beside it (same name).
#
# Picture: the three H.264 streams are joined losslessly (concat demuxer, stream
# copy) — they come from the same renderer/mux settings, which is checked first.
# Sound: each episode's audio is decoded and joined as one PCM track, then
# core/render/mux.sh encodes it once (so there is no AAC gap or click at the
# joins) and masters the whole film to the same −14 LUFS the episodes use.
# Captions: EP2 shifted +60 s, EP3 +120 s, renumbered into one SRT.
set -eu
die() { echo "join-episodes.sh: $*" >&2; exit 1; }
[ "$#" -eq 4 ] || die "usage: join-episodes.sh <ep1.mp4> <ep2.mp4> <ep3.mp4> <new-output-dir>"
OUT=$4
if [ -e "$OUT" ]; then [ -d "$OUT" ] && [ -z "$(ls -A "$OUT")" ] || die "output must be a new or empty directory: $OUT"; fi
mkdir -p "$OUT"
for f in "$1" "$2" "$3"; do
  [ -s "$f" ] || die "missing: $f"
  [ -s "${f%.mp4}.srt" ] || die "missing captions: ${f%.mp4}.srt"
done

sig() { ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,time_base -of csv=p=0 "$1"; }
S1=$(sig "$1"); [ "$S1" = "$(sig "$2")" ] && [ "$S1" = "$(sig "$3")" ] || die "the three pictures differ ($S1) — re-render them with the same settings"

LIST="$OUT/concat.txt"
: > "$LIST"
absdir() { (cd "$1" && { pwd -W 2>/dev/null || pwd; }); }   # Windows ffmpeg can't read Git Bash /e/... paths
for f in "$1" "$2" "$3"; do printf "file '%s'\n" "$(absdir "$(dirname "$f")")/$(basename "$f")" >> "$LIST"; done
echo "join: picture (stream copy)"
ffmpeg -v error -f concat -safe 0 -i "$LIST" -map 0:v:0 -c:v copy -an "$OUT/picture.mp4"

echo "join: sound (decode + one encode)"
ffmpeg -v error -i "$1" -i "$2" -i "$3" -filter_complex \
  "[0:a]aresample=48000,apad=whole_dur=60[a0];[1:a]aresample=48000,apad=whole_dur=60[a1];[2:a]aresample=48000,apad=whole_dur=60[a2];[a0][a1][a2]concat=n=3:v=0:a=1[a]" \
  -map "[a]" -t 180 -ac 2 -ar 48000 -c:a pcm_s16le "$OUT/mix.wav"
NAME=horror-x-snowy-neon-noon-180s
LEMO_COLOR=bt709 sh core/render/mux.sh "$OUT/picture.mp4" "$OUT/mix.wav" "$OUT/$NAME.mp4" 30 0

echo "join: captions"
node -e '
const fs = require("fs");
const [o, ...files] = process.argv.slice(1);
const sec = s => { const [h, m, r] = s.split(":"); return +h * 3600 + +m * 60 + +r.replace(",", "."); };
const st = x => { const ms = Math.round(x * 1000), p = (v, w = 2) => String(v).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
let n = 0, out = [];
files.forEach((f, ep) => {
  for (const b of fs.readFileSync(f, "utf8").replace(/^﻿/, "").replace(/\r/g, "").trim().split(/\n\s*\n/)) {
    const [, time, ...text] = b.split("\n"); const [a, z] = time.split(" --> ").map(sec);
    out.push(`${++n}\n${st(a + 60 * ep)} --> ${st(z + 60 * ep)}\n${text.join("\n")}\n`);
  }
});
fs.writeFileSync(o, out.join("\n"));
console.log(`${n} cues`);
' "$OUT/$NAME.srt" "${1%.mp4}.srt" "${2%.mp4}.srt" "${3%.mp4}.srt"

ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -show_entries format=duration -of csv=p=0 "$OUT/$NAME.mp4"
echo "$OUT/$NAME.mp4"
