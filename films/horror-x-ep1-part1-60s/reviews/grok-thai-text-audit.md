# Grok Thai text audit — Part 1 spoken narration

Verdict: **no text blocker.** The twelve spoken cues in `voice-timeline.json` (same strings as `voice.json` `lines`) are grammatical spoken Thai, stay in first person `ฉัน`, name her `นุ่น` once, keep the rear-door / no-face / no-customer-footsteps invariants, and do not speak the Part 2/3 lock, CCTV, dawn, embroidered-name, or entity-voice reveals. The seven overrides add or drop function words only. No narration rewrite is recommended.

Limits: no listening. Pronunciation, tone, and how `คอย` is heard are not judged. Widths below are horizontal glyph advances from `fonts/Kanit-Regular.ttf` (`cmap` format 4 + `hmtx`, unitsPerEm 1000), summed at 44px. `fontTools` was not installed, so this is that advance model, not a browser raster or a burned-in frame. GPOS mark stacking does not add pen advance. Captions on disk still show pre-override `script.json` text; that source-selection bug already has an OpenCode owner and is not re-filed here.

## What was compared

Spoken text: `voice-timeline.json` scenes 01–12 and `voice.json` / `voice-text-overrides.json`. Draft wording: `script.json`. Contracts: `TREATMENT.md` (linear Part 1 only; Part 2 lock/corridor/CCTV; Part 3 dawn, embroidered name, voice behind her) and `WORKER-CONTRACT.md` (narrator voice-over, cloth customer rear, never a face, never customer footsteps). Source, read-only: `D:/workspace/ai-video/episodes/horror-x/story.json` and `script.md` shots 01–07 for the Part 1 span, and shots 08–16 only to confirm those reveals are absent here.

Voice is already `th-TH-NiwatNeural`, rate −14%. Speech total 57.23s. Eleven inter-line gaps are 0.2018–0.2019s (`maxGap` 0.2018), inside the treatment band 0.12–0.25s and under 0.35s. Lead 0.30s, tail 0.25s, film 60.0s. Scene durations 4.2518–5.79s, inside the 4–6s target. For every scene, joining `words[].w` equals the scene text with spaces removed, timestamps are monotonic, and timeline word starts match `voice.json` local times plus `speechStart` within 0.02s.

## Twelve spoken cues

| Scene | Spoken text | Speech | Reading note |
| --- | --- | --- | --- |
| 01 | นี่คือคืนสุดท้ายที่ฉันทำงานในร้านซักผ้าแห่งนี้ ที่เปิดตลอดยี่สิบสี่ชั่วโมง | 0.30–5.79 (5.49s) | Clause break before the 24-hour ที่. 766px / 424px. |
| 02 | ฉันชื่อนุ่น รับกะดึกที่นี่มาได้สองสัปดาห์ ตั้งแต่สี่ทุ่มถึงหกโมงเช้า | 5.99–10.65 (4.66s) | Name is its own token (`นุ่น` 6.46–6.70s). Shift 22:00–06:00. 659px / 415px. |
| 03 | หน้าที่ของฉันก็วนอยู่แค่นี้ เก็บเหรียญ ใส่ผ้า แล้วเฝ้าเครื่องจนซักเสร็จ | 10.85–15.18 (4.33s) | List then result. 738px / 438px. Densest speech rate, 71 chars / 4.33s. |
| 04 | พอดึกลง ร้านแทบไม่มีคนเหลืออยู่ เหลือแต่เสียงเครื่องซักผ้าหมุนอยู่ข้างตัวฉัน | 15.39–20.42 (5.03s) | Contrast break before เหลือแต่. 583px / 752px. |
| 05 | บางคืนเงียบจนฉันได้ยินเหรียญทุกเหรียญ ที่ตกกระทบถาดตรงหน้า | 20.62–24.67 (4.05s) | Relative clause on its own second line. 731px / 422px. |
| 06 | แล้วทุกคืน ก็จะมีลูกค้าคนเดิม มาพร้อมผ้าสีขาวผืนใหญ่ผืนเดิม | 24.87–29.54 (4.67s) | Customer, then the same large white sheet. 504px / 554px. |
| 07 | ฉันไม่เคยเห็นหน้าเขา เงยขึ้นเมื่อไร ก็เห็นเพียงชายผ้าผ่านประตูหลัง | 29.74–33.85 (4.11s) | ก็-clause starts the second line. 584px / 553px. |
| 08 | เขาไม่เคยทัก ไม่เคยรอถาดเหรียญ แต่กลับคอยหยอดเหรียญลงในเครื่องเอง | 34.05–38.75 (4.70s) | Negation, then the self-insert contrast. 589px / 716px. |
| 09 | ผ้าสีขาวหมุนวนอยู่หลังฝากระจกใส ส่วนเจ้าของผ้า กลับไม่อยู่ข้างเครื่อง | 38.95–43.86 (4.91s) | Drum, then absence. 602px / 621px. |
| 10 | ทุกครั้งเขาหายไปทางประตูหลัง โดยไม่มีเสียงฝีเท้าให้ได้ยินเลยสักครั้ง | 44.07–49.57 (5.50s) | Exit, then the no-footstep line. 539px / 642px. |
| 11 | คืนแรกฉันคิดว่าเขาแค่ไม่อยากคุย แต่คืนที่สอง และคืนที่สาม ก็ยังเหมือนเดิม | 49.77–55.00 (5.23s) | Densest line, see below. 796px / 493px. |
| 12 | คืนนั้นฉันจึงหยุดเก็บเหรียญ แล้วเฝ้ามองประตูหลัง เพื่อดูว่าเขามาจากไหน | 55.20–59.75 (4.55s) | Decision, then the unanswered question. 489px / 772px. |

Pixel figures are the two lines produced by wrapping only on the existing spaces, greedy, at the builder’s 18.7em target (`build-captions.py` `MAX_LINE_EM`; 840/44 = 19.09em hard). Every spoken cue is one two-line card at 44px. Widest line is scene 11 line 1 at 18.08em / 796px, 44px inside the 840px zone, so 44px does not have to step down to 42 or 40 for these strings. No phrase is unsplittable past 840px.

Character rate across the clip durations is about 12.4–16.4 Thai characters per second (scene 10 slowest, scene 03 fastest). Each card stays up for the whole 4.25–5.79s scene. That is a dense 60s narration, and it is still a normal two-line read. No cue needs a shorter rewrite for reading burden.

Phrase breaks already sit on clause boundaries in 01, 02, 04, 05, 06, 07, 08, 09, 10, and 12. Scene 03 keeps `เก็บเหรียญ ใส่ผ้า` with the duty clause (738px) and leaves `แล้วเฝ้าเครื่องจนซักเสร็จ` on line 2; both the space after `แค่นี้` and the space before `แล้ว` are natural. Scene 11’s greedy wrap puts `แต่คืนที่สอง` at the end of line 1 because 18.08em is still under 18.7em. The spoken space after `คุย` is the clearer pause. That is an optional caption wrap choice for the caption owner, not a change to the spoken sentence.

## Seven wording changes against `script.json`

Lines 02, 05, 06, 11, and 12 are unchanged. The overrides match `voice.json` `text_overrides` and the timeline.

| Scene | Change | Assessment |
| --- | --- | --- |
| 01 | insert `แห่งนี้` after `ร้านซักผ้า` | Same hook. Points at this shop, closer to source `ที่ร้านนั้น`, without naming a new place. |
| 03 | `หน้าที่วน` → `หน้าที่ของฉันก็วน` | Clearer subject. Spoken register is natural. |
| 04 | `ไม่มีคน เหลือเสียง…ข้างตัว` → `ไม่มีคนเหลืออยู่ เหลือแต่เสียง…ข้างตัวฉัน` | Same empty shop and washer bed. Repeated `เหลือ` is ordinary contrast, not an error. |
| 07 | drop `เลย` and `มา` (`เห็นหน้าเขาเลย`, `เงยขึ้นมาเมื่อไร`) | Same claim: she never sees his face; whenever she looks up she sees only cloth at the rear door. |
| 08 | insert `คอย` and `ใน` (`กลับคอยหยอดเหรียญลงในเครื่องเอง`) | See optional note. The self-insert fact remains. |
| 09 | `ผ้าขาว` / `ฝากระจก` → `ผ้าสีขาว` / `ฝากระจกใส` | Same drum. `สีขาว` matches scene 06. `ใส` only restates the glass door already in the scene direction. |
| 10 | `สักครั้ง` → `เลยสักครั้ง` | Stronger, same invariant. |

`คอย` is the only wording worth a later pass, and it is **optional polish, not a blocker**. `ไม่เคยรอ` and `คอย` share a “wait” reading, so `แต่กลับคอยหยอด` can be heard as “but he waits and inserts coins” instead of the habitual “he keeps inserting them himself.” The rest of the clause (`หยอดเหรียญลงในเครื่องเอง`) still carries the source fact that he does not wait for her tray. Do not shorten it back unless voice is reopened anyway; this audit does not ask for a new take.

## Meaning, chronology, invariants

Frame is coherent. Scene 01 sets this night as the last night she works here. Scenes 02–05 establish `นุ่น`, two weeks on the graveyard shift (`สี่ทุ่มถึงหกโมงเช้า` = 22:00–06:00, matching the source character note, not a dawn scene), the coin/cloth/watch loop, then the late empty shop. Scenes 06–10 are the recurring customer: same large white cloth, no face, hem only through the rear door, no greeting, no wait for the tray, coins into the machine himself, cloth left spinning, owner not beside the machine, exit by the rear door with no footsteps. Scene 11 is her early theory (`คิดว่า` he simply did not want to talk), cancelled by nights 1–3 still matching. Scene 12 returns with `คืนนั้น` and `จึง` to the decision to watch the rear door and ask where he comes from. It does not answer.

`คืนนั้น` can attach either to the framed last night or to the third night. Source shot 07 has the same compression (`คืนแรก…คืนที่สาม / และนั่นคือคืนที่ฉันเฝ้า`). The scene order, recollection then decision, supports the last night from scene 01. Not a correction.

Checked absences in the joined spoken text: no `ล็อก`, `วงจร`, `กล้อง`, CCTV, `ปัก`, `หนีไฟ`, `ซอง`, `ใส่เหรียญ`, `รุ่งสาง`, `เช้าแล้ว`. `หกโมงเช้า` is only the shift clock in scene 02. Customer pronoun is `เขา`, not later-story `มัน`. Narrator pronoun is `ฉัน` only (no `ผม`). `นุ่น` appears only as her spoken name in scene 02, not as embroidery.

Authorized condensations versus source shots 01–07, not errors: part-time label, “few real customers,” bedsheet simile, letter-slot specifically, “nobody has seen the face” narrowed to her, and “never buys anything extra.” `ชายผ้า` matches the Part 1 trailing-cloth direction; it does not import the Part 2 slot/corridor. The open question `เขามาจากไหน` is the Part 2 hook and stays unanswered.

## Timing evidence (stamps only)

One intra-line hole is larger than the 0.35s inter-line ceiling: scene 10, `ฝีเท้า` ends 47.715s and `ให้` starts 48.209s (0.494s) inside `โดยไม่มีเสียงฝีเท้าให้ได้ยินเลยสักครั้ง`. Tokens are complete and in order. This is a delivery/alignment observation, not missing words. No other intra-line gap reaches 0.28s. Scene 06’s 0.17s between `มา` and `พร้อม` matches the written pause before the cloth. Last words end at or before `speechEnd`; none run past the scene end.

## Severity

- **Blockers:** none in spoken wording, grammar, chronology, pronoun/name, or Part 1 invariants.
- **Do not re-open:** caption builder still baking `script.json` text. Separate owner.
- **Optional, only if voice or captions are already being rebuilt:** scene 08 drop `คอย` to keep `รอ` unambiguous; scene 11 caption wrap after `คุย` rather than after `ที่สอง`; scene 10’s 0.494s hole if that line is regenerated. None of these require a new fact or a full narration rewrite.
