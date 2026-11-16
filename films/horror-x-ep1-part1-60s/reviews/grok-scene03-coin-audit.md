# Scene 03 coin contact audit

`flyingCoin` lands when phase `(u % 1.02) / 1.02` exceeds 0.62. `d` is unused. Local contacts inside scene 03 are 0.6324, 1.6524, 2.6724, and 3.6924s. A fifth at 4.7124s is past the scene end.

`timeline.json` scene 03 is 10.6518–15.1836s (duration 4.5318s). Globals: 11.2842, 12.3042, 13.3242, 14.3442s. `voice-timeline.json`, which `sound-design.py` loads, has the same bounds.

One scene-03 `coin_bounce` is scheduled at local 0.6324s, global 11.2842s. `audio-events.json` matches (`local_u` 0.6324, `absolute_t` 11.2842). Offset from the first contact threshold is 0s. The later three contacts have no coin-bounce event.
