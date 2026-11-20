# Snowy Neon EP2 (minute 2): ประตูหลัง ทางเดิน กล้องวงจรปิด — Treatment

Written 2026-11-20, before opening any `styles/*/DEMO.md` or demo code. Sources read
first: the brief, `films/horror-x-ep1-part1-60s/TREATMENT.md` (three-part story map),
and our own EP1 code in `ep1-source/` (captions, staging, rear-entry, mix-noon.py).

## Where EP1 leaves us

EP1 ends on cue 12, "คืนนี้ฉันวางเหรียญ แล้วเฝ้ามองประตูหลัง อยากรู้ว่าเขามาจากไหน":
storefront, Noon at the counter (turn pose, glance locked on the empty rear doorway),
one coin she just placed on the tray. The rear opening is a dark void under the
orange "ทางออก" tube. The customer has never been seen arriving, only leaving.

## The story map (fixed)

- Part1 (EP1, done): shop, faceless customer, coins, exit at the rear, decision to watch.
- **Part2 (this film): rear-door lock, corridor, CCTV check.**
- Part3 (not here): dawn, the name embroidered on the cloth, the voice behind Noon.
  EP2 must not show dawn, any name, any embroidery or any voice that is not Noon's
  narration. It may end open and hand over to Part3.

## Fixed constraints

1080×1920, 30 fps, 60.000 s (1800 frames). Same look, palette (navy/indigo, ice
cyan #4fdcff, neon pink #ff4fa8, warm lamp #ffc585, copper #b18270), the same shop,
the same Thai neon signs and the same โมเดลนุ่น rig as EP1. Thai first-person (ฉัน)
whisper narration (Jessica, voiced later), 12 lines inside ~54–56 s. Kanit captions,
identical position/size to EP1. No blood or violence, faceless white cloth only,
no strobe (the one "glitch" is a single soft horizontal tear, no luminance flash).

## Three candidate structures

**A. "The lock holds" (linear investigation, chosen).**
Noon leaves the counter and walks through the rear opening into a back corridor EP1
never showed. The corridor runs to a steel exit door: she checks the deadbolt (it is
locked), the chain (still on), the dust on the floor (only her own footprints). If
he never came in this way, where does he come from? A side room holds the CCTV
monitor. She rewinds last night: on the corridor camera the white cloth glides in
through the shop's rear opening and stops halfway; the picture tears once and the
corridor is empty. She switches to the live counter camera: the coin she placed is
gone, and the first washer starts by itself. Last image: the real shop, empty of
people, the drum turning with a white sheet in it.
*Pros*: each of the three Part2 elements (lock, corridor, CCTV) gets its own clear
beat; logic moves from "outside" to "inside"; the ending reuses EP1's coin as the
payoff and hands Part3 an unanswered "he is already here". *Cons*: many new sets.

**B. "Through the monitor" (CCTV frame story).**
Open on the CCTV room; the entire minute is Noon scrubbing footage, with the lock
and corridor seen only on screen, cutting back to her face.
*Pros*: one set, very controlled. *Cons*: the lock check becomes second-hand; the
film loses the physical tension of her walking into the dark; it is visually
monotone after EP1's varied angles.

**C. "Waiting at the door" (stake-out).**
Noon locks the rear door herself at the start and sits watching it all night;
time-lapse of the clock; at 03:00 the cloth is already inside the corridor, seen
through the door's small window; she checks CCTV at the end.
*Pros*: strong suspense build. *Cons*: the CCTV check gets squeezed into the last
seconds; locking "herself" contradicts EP1's established routine less clearly;
a time-lapse clock leans toward the dawn of Part3.

**Choice: A.** It is the only structure that gives the lock, the corridor and the
CCTV equal weight, it starts exactly where EP1 stops (Noon, counter, rear door), and
its ending escalates without revealing Part3 material (no name, no dawn, no voice).

## Narration (12 lines, Noon, ฉัน, whispered)

| # | Line | est. start–end (s) |
|---|---|---|
| 1 | คืนนี้ฉันไม่รอแล้ว ฉันเดินเข้าประตูหลังเอง | 0.30–4.91 |
| 2 | หลังประตูเป็นทางเดินแคบ ๆ ไปถึงทางออกด้านหลัง | 5.46–10.04 |
| 3 | ประตูเหล็กบานนั้น ฉันล็อกไว้ทุกคืน | 10.54–14.05 |
| 4 | ฉันลองหมุนกลอนดู มันยังล็อกแน่น | 14.40–17.59 |
| 5 | โซ่ยังคล้องอยู่ บนฝุ่นมีแค่รอยเท้าฉัน | 18.04–21.87 |
| 6 | ถ้าเขาไม่ได้เข้าทางนี้ แล้วเขามาจากไหน | 22.37–26.56 |
| 7 | ข้างทางเดินมีห้องจอกล้องวงจรปิด | 27.46–30.76 |
| 8 | ฉันย้อนภาพเมื่อคืน ตอนชายผ้าลับประตูหลัง | 31.21–35.36 |
| 9 | ในจอ ผ้าขาวเข้ามาในทางเดินนี้ แล้วหยุดนิ่ง | 35.81–40.06 |
| 10 | ภาพกระตุกครั้งเดียว ทางเดินก็ว่างเปล่า | 40.66–44.85 |
| 11 | ฉันสลับไปดูภาพสดหน้าเคาน์เตอร์ | 45.65–48.84 |
| 12 | เหรียญที่ฉันวางไว้หายไป แล้วเครื่องแรกก็เริ่มหมุนเอง | 49.34–55.02 |

Timing is an **estimate** (no voice yet): 0.1064 s per Thai character, measured
from EP1's twelve whispered Jessica takes (`ep1-source/audio/noon-assets/voice-whisper/*.mp3`
total duration ÷ Thai characters of `*.txt`), +0.25 s for each `...` pause, with
scene-shaped gaps (0.35–0.9 s, longest before the CCTV room). `timing.mjs` is the
single source of these numbers; `make-captions.mjs` writes `captions/ep2.srt`.
Speech ends ~55.0 s; the last 5 s are a wordless hold on the turning drum.

## Beat / shot list (all drawn in code, every shot moves)

| id | start (s) | view | action / move | serves |
|---|---|---|---|---|
| walk-back | 0.00 | storefront (EP1 scene) | Noon turns from the counter and walks left to the rear opening (facing −1, foot-locked walk); slow push | L1 head |
| corridor-enter | 3.40 | **new** side-on back corridor | Noon steps out of the shop's warm doorway into the dark corridor, camera tracks with her | L1 tail, L2 head |
| corridor-long | 7.60 | corridor, wider | camera runs ahead along pipes and a laundry cart to the steel exit door at the end; fluorescent tube hums (soft, no strobe) | L2 |
| exit-door | 10.30 | **new** steel exit door | push-in on deadbolt, chain and push-bar; cold cyan seam under the door | L3 |
| lock-turn | 14.25 | lock macro | her hand grips the thumb-turn, turns ~20°, stops dead, tries again (locked) | L4 |
| chain-dust | 17.85 | low floor angle | chain sways from the touch; dust layer with one set of slipper prints leading in | L5 |
| corridor-look | 22.20 | corridor | Noon at the exit door turns back (turn pose) toward the dark length of corridor | L6 + beat |
| side-door | 27.30 | corridor | camera trucks left to a side door whose small window glows CCTV blue; Noon walks to it | L7 |
| cctv-room | 31.00 | **new** CCTV room | Noon at the desk lit by a 4-up monitor; timestamps run backwards (rewind) | L8 |
| playback | 35.60 | monitor full-frame, CAM 3 ทางเดิน | last night's feed: the cloth glides in from the shop doorway, stops mid-corridor | L9 |
| glitch | 40.40 | monitor, closer | one soft horizontal tear (~41.8 s, 4 frames), then the corridor is empty | L10 |
| switch-live | 45.30 | CCTV room, close | her hand on the switch; the monitor flips to LIVE | L11 |
| live-counter | 49.10 | monitor full-frame, CAM 4 เคาน์เตอร์ LIVE | the tray: the gap where her coin lay | L12 head |
| washer-start | 52.00 | storefront (EP1 scene), nobody inside | the nearest washer starts by itself (coin-slot click, motor) | L12 tail |
| drum-sheet | 56.40 | storefront drum close-up | a white sheet turns behind the glass; hold to 60.0 | hand-off to Part3 |

Continuity rules: the corridor feed on the monitor is drawn by the same corridor
code as the live-action corridor shots (same pipes, cart, doors), so the viewer
recognises "this corridor". The cloth on CCTV is the same faceless drape
silhouette as EP1, rendered monochrome. No footsteps for the cloth anywhere (EP1
invariant); Noon's own slipper steps are allowed.

## Sound (scratch, local only)

Reuse EP1's generated SFX (`room-tone`, `soft-steps`, `dread-drone`, `washer-spin`,
`coin-slot`, `cloth-rustle`, `rear-door`) plus locally synthesised effects (lock
clunk/rattle, chain clink, CRT hum and rewind whir, one soft glitch burst) in
`synth-sfx.py`. No API calls. The mix leaves −20 dBFS RMS headroom bands under each
caption window for the voice, and `mix-ep2.py --voice-dir` drops the real lines in
at their caption starts when they exist.

## Look check plan

Render style frames of every new set with the real drawing code, side by side
with EP1 `qa-strip.jpg` frames, and check: palette, warm/cool split lighting,
same Noon grade, Kanit captions at the EP1 band.
