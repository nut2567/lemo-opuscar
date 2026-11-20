# Snowy Neon EP3 (minute 3): ฟ้าสาง ชื่อบนผ้า เสียงข้างหลัง — Treatment

Written 2026-11-21. Sources: the original story `E:\AI\Ai-Video\episodes\horror-x`
(`script.md` rows 13–16, `story.json` → `ending`), the three-part map in
`films/horror-x-ep1-part1-60s/TREATMENT.md`, and our EP2 (`ep2-source/`), whose
last image this film starts from.

## Where EP2 leaves us

EP2 ends in the empty shop at about 01:12: the coin Noon placed is gone from the
tray (seen on CAM 4 LIVE), the nearest washer started by itself, and a white sheet
turns behind its glass. Noon is still in the CCTV room behind the corridor.

## The story map (fixed)

- Part1 (EP1): shop, faceless customer, coins, exit at the rear, decision to watch.
- Part2 (EP2): rear-door lock, corridor, CCTV check.
- **Part3 (this film): dawn, the name embroidered on the cloth, the voice behind Noon.**
  It is the last part. The original ends open: Noon hears "ใส่เหรียญ" behind her and
  slowly turns; the film never shows what she sees. The embroidered name is
  "นุ่น" (original `script.md` row 15), shown in picture, not spoken.

Continuity fix: the original row 13 has Noon think it was a prank and fall asleep.
After EP2's escalation (coin gone, washer starting by itself) that reads false, so
she tells herself it is a prank but cannot look away and sits awake until dawn.

## Fixed constraints

1080×1920, 30 fps, 60.000 s (1800 frames). Same look, palette, shop, Thai neon
signs, Noon rig and caption band as EP1/EP2. Narration: Gemini Leda, calm normal
voice (approved 2026-11-21), first person ฉัน. The one line that is not Noon is the
voice behind her, "ใส่เหรียญ": a different, flatter, lower delivery. No blood, no
violence, the cloth stays faceless; nothing is shown behind Noon but darkness and
the edge of white cloth. No strobe, no jump-scare hit.

## Three candidate structures

**A. "Night into dawn" (linear, chosen).** Noon comes back to the empty front,
the washer is turning; she sits at the counter, not daring to open it or look at
the rear door. A slow time-lapse: the neon fades while the window turns from navy
to pale dawn. The drum stops by itself. She opens the door and lifts out the big
white sheet: it is warm; in its corner a name is embroidered in red thread,
"นุ่น". Silence. Then a flat voice behind her: "ใส่เหรียญ". She turns slowly; the
rear doorway is dark, a white edge of cloth at its jamb; cut to black before she
has fully turned. *Pros*: follows the original order exactly, each Part3 element
gets its own beat, the dawn light change gives the minute a visual arc EP1/EP2 did
not have. *Cons*: the dawn grade is new work on the storefront scene.

**B. "Morning hand-over."** Open at dawn with the day-shift arriving; Noon tells
them about the night, they find the sheet together. *Cons*: adds a new character
and dialogue, breaks the alone-at-night tension, and the voice behind her loses
its weight with someone else in the room.

**C. "Rewind of the last night."** Noon re-watches the whole night on CCTV until
dawn and sees herself take out the sheet. *Cons*: repeats EP2's CCTV device, keeps
the reveal second-hand on a monitor.

**Choice: A.**

## Narration (12 lines; 11 Noon, line 11 = the voice behind)

| # | Line |
|---|---|
| 1 | ฉันวิ่งกลับมาหน้าร้าน ในร้านไม่มีใครเลย |
| 2 | เครื่องแรกยังหมุนอยู่ มีผ้าขาวผืนเดิมอยู่ข้างใน |
| 3 | ฉันบอกตัวเองว่า คงมีใครแกล้งกัน |
| 4 | แต่ฉันไม่กล้าเปิดเครื่อง ไม่กล้าเงยหน้ามองประตูหลัง |
| 5 | ฉันนั่งนิ่งอยู่หลังเคาน์เตอร์ ฟังมันหมุนทั้งคืน |
| 6 | จนฟ้าเริ่มสาง เครื่องก็หยุดหมุนเอง |
| 7 | ฉันเปิดฝาเครื่อง ดึงผ้าผืนใหญ่ออกมา |
| 8 | ผ้ายังอุ่นอยู่ มีชื่อปักอยู่ที่มุมผ้า |
| 9 | เป็นชื่อฉัน ชื่อที่ฉันไม่เคยบอกเขา |
| 10 | แล้วตอนนั้นเอง ฉันก็ได้ยินเสียงจากข้างหลัง |
| 11 | "ใส่เหรียญ" (the voice behind) |
| 12 | ฉันค่อย ๆ หันกลับไป |

Timings come from the measured takes (see `timing.mjs`), not estimates.

## Beat / shot list (all drawn in code, every shot moves)

| id | view | action / move | serves |
|---|---|---|---|
| run-back | storefront wide | Noon enters from the rear opening, stops in the empty shop; slow push | L1 |
| drum-turning | washer close-up | the white sheet turning behind the glass, suds | L2 |
| counter-sit | storefront, counter | Noon sits behind the counter, eyes down, rear doorway dark at frame edge | L3–L4 |
| time-lapse | storefront wide, locked-off | wall clock runs 01:15 → 05:50; neon dims, window glow turns navy → pale dawn, snow thins | L5–L6 head |
| drum-stop | washer close-up, dawn light | drum slows and stops by itself, last drops on the glass | L6 tail |
| open-door | washer, Noon's hands | door swings open, she draws out the big sheet | L7 |
| sheet-hold | medium on Noon | holding the sheet against her, breath in cold dawn air | L8 head |
| name-macro | fabric macro | slow push to a corner: "นุ่น" embroidered in red thread | L8 tail–L9, then silence |
| voice-behind | Noon from the front, rear doorway behind her | she freezes; rear doorway pitch dark | L10–L11 |
| turn | Noon close, back to camera | she starts to turn; at the jamb, a white edge of cloth; cut to black before the turn completes | L12, end |

## Sound

Room tone + washer spin under L1–L5; spin winds down at the drum stop; dawn
outside (light traffic far off, no birdsong cliché). After the name reveal the
room tone drops away; the voice behind is dry and close in the stereo centre,
no reverb tail, no sting. One coin drop into an empty tray as the last sound
under black. Opening effects kept well under the voice (EP1 note: −12 dB opening).
