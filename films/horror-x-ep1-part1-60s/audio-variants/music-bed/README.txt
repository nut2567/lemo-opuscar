Music-bed audio VARIANT — alternate score, NOT the canonical v5 build inputs.

Contents (byte-identical to origin/main 646ae6f render):
  soundtrack.wav         sha256 8843fd1b8169df205ba8f8db48af9babc2cf5c29517de0179bda64e7cab4c886
  mixed-soundtrack.wav   sha256 ead21ffaf1fb6508bc1c47b5545cf8c4644518e46f3afba52ea60113a06a2c11

Canonical approved v5 inputs remain at ../../soundtrack.wav (5c7903d2...) and
../../mixed-soundtrack.wav (a9b0331f...) and are what build.ps1/mux-final.py use.

Regeneration recipe (alternate outputs only — cannot overwrite canonical files):
  1. music-bed.wav (composed score bed; source script not committed) placed in
     the film root, then:  python sound-design.py
     -> writes audio-variants/music-bed/soundtrack.wav + SOUND-QA.md there.
  2. python mix-audio.py speech.wav audio-variants/music-bed/soundtrack.wav ^
       audio-variants/music-bed/mixed-soundtrack.wav ^
       audio-variants/music-bed/audio-mix-check.json
  3. Mux variant: python mux-final.py out/picture-v5.mp4 ^
       audio-variants/music-bed/mixed-soundtrack.wav <out.mp4>
