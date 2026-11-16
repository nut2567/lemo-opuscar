# Scene02 footstep alignment audit (read-only)

Scope: scene02 Nun footsteps only. Compares `qa/walk-contact-candidates.json`,
`actor.js`, `scenes/scene02.js` against the events actually scheduled by
`sound-design.py` (voice-timeline.json timings). No audio was generated,
inspected by ear, or modified. No code was changed.

## Method

- `main.js` calls `renderScene02(u, t, d)` with `u = t - scene.start` and global
  `t`; `scene02.js` passes that same global `t` to `nun(t, {pose:'walk', ...})`
  while `U < d - 0.75` (`walking` flag, scene02.js:60-61).
- `actor.js` walk pose (`poseParams`, actor.js:77-92): cycle `w = (t/0.72) % 1`;
  right foot `footAt(w)`, left foot `footAt(w+0.5)`. `footAt` (actor.js:54-59)
  has stance `k < 0.55` at sole height `SOLE` (planted) and swing `k >= 0.55`
  (lifted). A foot "lands" (contact instant) at `k = 0`, i.e. the swing→stance
  transition.
- Scene02 window: `d = 10.6518 - 5.79 = 4.8618`; walk while `u < 4.1118`,
  i.e. global `t ∈ [5.79, 9.9018)` (walk_end exclusive).
- Contact instants (global t): right foot `t = 0.72·n`, left foot
  `t = 0.36 + 0.72·n`, restricted to the walk window.

## Scheduled sound events (sound-design.py:382-394)

For scene "02": `dur = 4.8618`, `n_steps = 4`, `step_start = start + dur*0.25
= 7.00545`, `step_spacing = dur*0.5/4 = 0.607725`. Weights alternate 0.6/0.75.
The script's own cue_log labels these "cadence-estimated, NOT visually
verified".

| # | scheduled t (global) | weight |
|---|---|---|
| 1 | 7.005450 | 0.60 |
| 2 | 7.613175 | 0.75 |
| 3 | 8.220900 | 0.60 |
| 4 | 8.828625 | 0.75 |

## Visual contacts vs scheduled events

Derived contacts inside the walk window (matches
`qa/walk-contact-candidates.json` scene "02" `contacts` exactly — 11 entries):

| t (global) | side | t (global) | side |
|---|---|---|---|
| 6.12 | L | 8.28 | L |
| 6.48 | R | 8.64 | R |
| 6.84 | L | 9.00 | L |
| 7.20 | R | 9.36 | R |
| 7.56 | L | 9.72 | L |
| 7.92 | R | | |

Offset of each scheduled event to the nearest contact instant:

| scheduled t | nearest contact | offset (sched − contact) |
|---|---|---|
| 7.005450 | 6.84 L | **+0.165450 s** |
| 7.613175 | 7.56 L | **+0.053175 s** |
| 8.220900 | 8.28 L | **−0.059100 s** |
| 8.828625 | 9.00 L | **−0.171375 s** |

## Findings

- **No scheduled event lands on a foot-contact instant.** All four are
  evenly-spaced cadence guesses (~0.608 s apart) against a real alternating
  0.36 s contact cadence.
- All four events do fall inside some foot's planted-stance window (stance
  lasts 0.55·0.72 = 0.396 s after each landing), so none lands mid-swing —
  but each is 53–195 ms away from the actual strike.
- Coverage is sparse: 4 events vs 11 contacts. The final three contacts
  (9.00 L, 9.36 R, 9.72 L) have no sound at all while the Nun keeps walking
  until 9.9018.
- Side alternation is not represented: the schedule carries no L/R
  information and its spacing cannot reproduce the true 0.36 s alternation.

## File-state note

`qa/walk-contact-candidates.json` is marked `"label": "DRAFT"`,
`"applied": false`, with a recheck clause. Its recorded SHA256 still matches
`actor.js`, `scenes/scene12.js` and `timeline.json`, but **not**
`scenes/scene02.js` (recorded `7dc892d5…`, current `20b3b39e…`). The current
scene02.js still implements `walking = U < d - 0.75`, so the contact window
and contact list above are unaffected; the drift is nonetheless a trigger for
the JSON's own recheck condition before any audio application.

## Conclusion

The scheduled scene02 footsteps are cadence-estimated and misaligned with the
rendered walk cycle by 0.053–0.195 s per event, cover only 4 of 11 contacts,
and miss the last ~1 s of walking. Per task scope this is a report only; no
audio or code was altered.
