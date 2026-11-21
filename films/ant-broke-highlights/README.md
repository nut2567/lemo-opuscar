# Ant Broke — three vertical highlight concepts

Concept-source package for three 9:16 highlight stills built around situations
from the *ant-broke* story (`ant-broke` episode, shots 08, 11 and 18):

- **01 Clay Checkout** — two ants press both buy buttons at once with their antennae (shot 08).
- **02 Parcel Panic** — a parcel too big for the nest blocks the entrance (shot 11).
- **03 Empty Winter** — an ant sits beside empty supply boxes in a cold burrow (shot 18).

These are authored concepts and editable artwork code, not a finished film. The
scenes, captions and review notes are meant as starting points if one is developed
into a video; `TREATMENT.md` and `NOTES.md` carry the creative direction.

## Files

- `render.py` — the whole still renderer: scene drawing, ant rig, captions. Run it
  to regenerate the three PNGs. It is the editable source; the generated stills are
  not committed.
- `TREATMENT.md` — the three candidate structures and why each was chosen.
- `NOTES.md` — production-relevant review notes (which gag reads fastest, animation
  directions per concept).

## Reproduce the stills

Requires Python 3 and Pillow (`pip install pillow`). Captions use the
repo-tracked Kanit Regular/SemiBold fonts at
`../bat-rice-shadow-puppet/fonts/`, resolved relative to `render.py`; no system
fonts or extra downloads are needed.

```sh
python render.py
```

Run from any directory; the script writes `01-clay-checkout.png`,
`02-parcel-panic.png` and `03-empty-winter.png` (1080×1920 each) next to itself.
They are git-ignored; commit them only if a highlight is promoted.

## Status

Concept stills only — no video, voice or score exists for these highlights.
