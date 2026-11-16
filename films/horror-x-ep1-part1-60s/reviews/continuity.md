# Continuity review — horror-x-ep1-part1-60s

Auditor: kiro (task_533b9d7378c0). Scope: `script.json` (12 rewritten Thai lines + scene
directions), `TREATMENT.md`, `WORKER-CONTRACT.md`, and the 12 scene briefs, audited
against the read-only source `D:/workspace/ai-video/episodes/horror-x` (`story.json`,
`script.md`, `episode.json`, `narration-lines.txt`). No production code exists yet
(scenes/, voice/, actor.js, effects.js all absent — see Pending), so this reviews the
script and contracts, not implemented visuals/audio.

## Verdict: no blocking continuity errors

The Part1 script is faithful to the source. Chronology, the 3-part boundary, and all
three source plot invariants (rear-entrance, no-face, no-footsteps) are preserved.
Thai rewrites keep source meaning; pronoun and name are consistent. Findings below are
observations and pending-module notes, not errors.

## 1. Chronology — PASS

Source 16-shot arc (01–07 establish+pattern+decide) is condensed/expanded into the new
12 scenes with the same causal order:

| New scene | Source shots covered |
|---|---|
| 01 exterior hook | 01 (exterior, last night, 24h) |
| 02 Nun shift + 4pm–6am | 01 shift hours + 02 (Nun intro, 2 weeks) |
| 03 duties cycle | 02 (collect coins, put cloth, wash, wait) |
| 04 quiet / washer row | 01 "few people" + 03 (quiet, washer spinning) |
| 05 coin macro | 03 (coin falling in tray) |
| 06 returning customer | 04 (same customer, large white cloth, rear) |
| 07 Nun looks up, no face | 05 (no face, only cloth shadow, rear door) |
| 08 self-coin, no greeting | 06 (no greet, self-coin) |
| 09 drum + absent owner | 06 (cloth goes in to wash) |
| 10 rear disappearance, no footsteps | 06 (exits rear) + 05 visual (no footsteps) |
| 11 three nights | 07 (count nights 1·2·3) + 13 dismiss thought repositioned |
| 12 decides to watch | 07 ("the night I watched it… rear door") |

Order is preserved: establish shop/Nun → routine/quiet → coin detail → recurring
customer → no-face → self-service → absence → rear exit → three nights → decision.

## 2. Three-part boundary — PASS

TREATMENT map: Part1 = establish+pattern+decide-to-watch; Part2 = lock+corridor+CCTV;
Part3 = dawn+name+voice. Part1 ends at scene 12 (Nun decides to watch / steps toward
rear door), which is the end of source shot 07. No Part2/3 content leaks in:

- No rear-door lock test (source 08) — scene10 brief states "No lock test or CCTV yet."
- No mail-slot corridor view (source 09), no CCTV (source 10–12), no dismiss/sleep (13).
- No dawn (source 15), no embroidered name on cloth (source 15), no "ใส่เหรียญ" entity
  voice (source 16). Nun's own name "นุ่น" in scene 02 is self-introduction, not the
  cloth-corner reveal — consistent with source 02.
- Scene 12 direction explicitly ends "no dead hold or dawn/name reveal." Clean cliffhanger.

## 3. Source invariants — PASS

All three invariants are consistent across script.json directions, TREATMENT,
WORKER-CONTRACT, and the scene briefs:

- **Rear-entrance, never front.** Scene06 "appears from rear shadow, never front";
  scene10 "trails into dark rear doorway"; WORKER-CONTRACT "Cloth customer always rear,
  never face, never footsteps." Source 04 "ไม่ผ่านประตูหน้า" preserved.
- **No face / no real body.** Scene06 "completely FACELESS… No eyes/mouth/feet";
  scene07 "she sees no face"; scene08 "No exposed ghost hands/face"; scene09 "no
  supernatural face pattern"; WORKER-CONTRACT cloth() "completely faceless… no
  eyes/mouth/feet." Source "ห้ามวาดหน้าหรือร่างจริง" preserved.
- **No customer footsteps** (Nun's own footsteps allowed in 02/12). Scene10 text
  "โดยไม่มีเสียงฝีเท้าให้ได้ยินสักครั้ง" + direction "NO CUSTOMER FOOTSTEPS"; TREATMENT
  and WORKER-CONTRACT both state the customer exit is silent while Nun may step in
  02/12. Source 05 visual "ไม่มีเสียงเท้า" preserved.

## 4. Thai rewrite meaning & consistency — PASS

Each rewritten line preserves source meaning. Pronoun is "ฉัน" throughout (female
first-person), no "ผม" leakage — matches source's established narrator identity. Name
"นุ่น" matches source character design. Notable rewrites that stay faithful:

- **08** "ไม่เคยรอถาดเหรียญ" (never waits for the coin tray) replaces source "ไม่เคยซื้อ
  อะไรเพิ่ม" (never buys more). Coherent with new scene 03 establishing the coin-duty;
  strengthens the self-service unease. Not an error.
- **11** "คืนแรกฉันคิดว่าเขาแค่ไม่อยากคุย" borrows the dismiss attitude from source shot
  13 and places it on night 1, then erodes it across nights 2–3. Legitimate
  condensation of source 07's counting + source 13's rationalization.
- **12** "หยุดเก็บเหรียญ…เฝ้ามองประตูหลัง เพื่อดูว่าเขามาจากไหน" dramatizes source 07's
  "คืนที่ฉันเฝ้ามัน…เดินไปที่ประตูหลัง" with a concrete action and explicit motive.

## 5. Observations (non-blocking)

1. **Scene 06 drops the bedsheet simile.** Source 04 "เหมือนผ้าปูที่นอนผืนใหญ่" (like a
   large bedsheet) is absent from the new line. The cloth() spec still reads "tall white
   drape," so visuals stay internally consistent, but the horror flavor of the
   bedsheet comparison is lost. Optional to restore if a line can absorb it.
2. **Scene 09 re-times the exit slightly.** Source 06 orders "cloth goes in to spin →
   then he disappears." New 09 states the owner is already absent while the cloth spins,
   and 10 restates the rear-exit as a recurring pattern. Both describe the same reality
   (customer leaves rear, cloth washes alone); the compression reads naturally. Not
   contradictory.
3. **Folder name vs source label.** Source `story.json` is `episode_part: 2` (Episode 2
   of the series); the film folder is `ep1`. The TREATMENT three-part map makes the
   content mapping unambiguous, but the naming could mislead anyone who reads "ep1" as
   the source series' Episode 1 (the unwritten prequel). Documentation clarity only.

## 6. Pending modules (NOT errors — cannot audit yet)

- **scenes/** empty. scene01–03 dispatched; scene04–12 queued. No implemented SVG to
  verify against invariants, view()/parallax, or caption bounds.
- **voice/ empty.** voice-timeline.json not generated. Measured per-scene durations
  (target 4–6s, sum 60s) and maxGap ≤0.35s are unverified. timeline.js (canonical,
  coordinator-owned) depends on this.
- **actor.js / effects.js** not present (dispatched). The cloth() faceless spec and nun()
  rig are unverified against actual code.
- **captions, audio-score, browser-qa, panel reviews** all queued.

These are incomplete production, not continuity defects. Re-audit recommended after
voice-timeline.json and scene code land.

## 7. TREATMENT ↔ script alignment — PASS

All 12 TREATMENT beats map 1:1 to the 12 script scenes by title, subject, and invariant
wording. No drift between treatment and script.
