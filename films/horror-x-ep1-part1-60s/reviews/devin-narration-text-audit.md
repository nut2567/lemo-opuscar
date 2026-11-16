# Devin narration text audit — horror-x Part 1 (read-only)

Scope: audited only the spoken-line text in `script.json`, `voice-text-overrides.json`, `voice.json` (`lines[]`) and `voice-timeline.json` (`scenes[]`) against the Part 1 source material in `D:/workspace/ai-video/episodes/horror-x` (`script.md` Part-1 summary and `story.json` / `episode.json` shots 01–07; shots 08–16 used only to confirm later-part reveals are absent). No audio was listened to, and no voice/caption/source files were edited. This report is the only file written.

## Consistency across the four files

- `script.json` has 12 draft lines. `voice-text-overrides.json` overrides 7 ids: `01`, `03`, `04`, `07`, `08`, `09`, `10`.
- `voice.json` `text_overrides` is identical to `voice-text-overrides.json`.
- For all 12 ids, `voice.json` `lines[].text` and `voice-timeline.json` `scenes[].text` equal `script.json` text after applying the overrides.
- For both `voice.json` and `voice-timeline.json`, joining each line's `words[].w` reproduces the same text with whitespace removed.

Effective spoken lines are therefore the 12 strings in the table below.

## Verdict

**PASS — no blocking discrepancy.** The 12 current spoken lines keep the Part 1 frame: first-person narrator `ฉัน`, name `นุ่น` spoken once in scene 02, the same faceless white-cloth customer, coins/self-insertion, rear-door disappearance with no customer footsteps, and an ending that only decides to watch where he comes from. No Part 2/3 reveal is spoken.

## Line-by-line source check

| ID | Effective spoken text | Part 1 source basis | Result |
| --- | --- | --- | --- |
| 01 | นี่คือคืนสุดท้ายที่ฉันทำงานในร้านซักผ้าแห่งนี้ ที่เปิดตลอดยี่สิบสี่ชั่วโมง | Source shot 01: last night, night shift, coin laundry open 24h, few real customers | Preserves the hook; the "few customers" beat is carried by 04. |
| 02 | ฉันชื่อนุ่น รับกะดึกที่นี่มาได้สองสัปดาห์ ตั้งแต่สี่ทุ่มถึงหกโมงเช้า | Source character note + shot 02: Nun, part-time, two weeks, 20:00–06:00 | Preserves name/shift; the explicit "part-time" label is omitted, not contradicted. |
| 03 | หน้าที่ของฉันก็วนอยู่แค่นี้ เก็บเหรียญ ใส่ผ้า แล้วเฝ้าเครื่องจนซักเสร็จ | Source shots 02–03: duties are collect coins, load clothes, wash, then wait; quiet shop | Preserves the work loop; "wash then wait" is compressed to watching until the wash finishes. |
| 04 | พอดึกลง ร้านแทบไม่มีคนเหลืออยู่ เหลือแต่เสียงเครื่องซักผ้าหมุนอยู่ข้างตัวฉัน | Source shots 01/03: late-night shop nearly empty, washer hum | Preserves meaning. |
| 05 | บางคืนเงียบจนฉันได้ยินเหรียญทุกเหรียญ ที่ตกกระทบถาดตรงหน้า | Source shot 03: quiet enough to hear coins hit the tray | Preserves meaning; "every coin / right in front" is a compatible emphasis. |
| 06 | แล้วทุกคืน ก็จะมีลูกค้าคนเดิม มาพร้อมผ้าสีขาวผืนใหญ่ผืนเดิม | Source shot 04: same customer every night, same large white cloth | Preserves meaning; the bedsheet simile is omitted. |
| 07 | ฉันไม่เคยเห็นหน้าเขา เงยขึ้นเมื่อไร ก็เห็นเพียงชายผ้าผ่านประตูหลัง | Source shot 05: no one has seen the face; she looks up and sees only cloth/shadow through the rear door slot | Preserves faceless/rear-door meaning; wording is slightly more concrete than the source's "shadow through the slot" (see deltas). |
| 08 | เขาไม่เคยทัก ไม่เคยรอถาดเหรียญ แต่กลับคอยหยอดเหรียญลงในเครื่องเอง | Source shot 06: never greets, never buys extra, inserts coins himself | Preserves the self-insert fact; "never buys anything extra" is omitted and the empty-tray detail is added. |
| 09 | ผ้าสีขาวหมุนวนอยู่หลังฝากระจกใส ส่วนเจ้าของผ้า กลับไม่อยู่ข้างเครื่อง | Source shots 03/06: white cloth spins inside the washer while the customer has gone | Preserves meaning. |
| 10 | ทุกครั้งเขาหายไปทางประตูหลัง โดยไม่มีเสียงฝีเท้าให้ได้ยินเลยสักครั้ง | Source shots 05/06 + premise: exits/disappears toward the rear door, no footsteps | Preserves the rear-exit/no-footsteps invariant. |
| 11 | คืนแรกฉันคิดว่าเขาแค่ไม่อยากคุย แต่คืนที่สอง และคืนที่สาม ก็ยังเหมือนเดิม | Source shot 07: counts night 1, night 2, night 3 | Preserves recurrence; adds a first-night interpretation not stated in the source. |
| 12 | คืนนั้นฉันจึงหยุดเก็บเหรียญ แล้วเฝ้ามองประตูหลัง เพื่อดูว่าเขามาจากไหน | Source shot 07 + Part-1 summary: she decides to watch where the customer comes from and goes toward the rear door | Preserves the open hook; adds the concrete action of stopping coin collection. |

## Exact discrepancies / deltas (non-blocking)

1. **`script.json` is not the final spoken text for 7 ids.** Ids `01`, `03`, `04`, `07`, `08`, `09`, `10` differ from `script.json` because `voice-text-overrides.json` / `voice.json` `text_overrides` replace them. This is internally consistent, but anyone reading `script.json` alone will see stale draft wording for those scenes.
2. **Scene 07 is more concrete than the source.** Source says she sees only the *shadow of the cloth* through the rear-door slot (`เงาของผ้า ผ่านช่องประตูหลัง`); the spoken line says she sees only the cloth's edge/hem passing through the rear door (`ชายผ้าผ่านประตูหลัง`). It stays faceless and rear-door-bound, so it is not a Part 2 corridor/CCTV reveal, but it drops the "shadow" and "slot" qualifiers.
3. **Scene 08 adds an empty-tray behavior.** Source shot 06 says he never greets / never buys extra / inserts coins himself; the spoken line adds `ไม่เคยรอถาดเหรียญ`. The scene visual supports this (Nun's tray stays empty), but it is a small added behavioral detail.
4. **Scene 11 adds an interpretation.** `คิดว่าเขาแค่ไม่อยากคุย` is plausible and non-revealing, but the source only counts the nights; it does not state her first-night theory.
5. **Scene 12 adds `หยุดเก็บเหรียญ`.** The source decision is to watch where he comes from and walk to the rear door; stopping coin collection is a concrete staging detail consistent with `scene12` direction, not an explicit source phrase.
6. **Coverage note, not a line error:** Part-1 source summary also includes the senior worker's warning (`ร้านนี้ไม่มีคนที่สองมานานแล้ว`) and details such as the bedsheet simile / "few real customers" wording. The 12 spoken lines omit those beats through compression; none of the spoken lines contradict them.

## Later-part reveal check

Checked the joined effective spoken text for Part 2/3 material. Absent: rear-door lock (`ล็อก`), mail slot / rear corridor / drying racks (`ซอง`, `ทางเดินหลัง`, `ราวตาก`), fire exit (`หนีไฟ`), CCTV/monitor (`วงจร`, `กล้อง`, `CCTV`), dawn/next-morning reveal (`รุ่งสาง`, `เช้าแล้ว` as a scene; `หกโมงเช้า` appears only as the shift clock in scene 02), embroidered name (`ปัก`), and the entity line `ใส่เหรียญ`. The customer pronoun stays `เขา`; later-source `มัน` is not used. `นุ่น` appears only as the narrator's spoken name in scene 02.

## Limits

Text-only audit: no listening, no pronunciation judgment, no caption burn-in check, and no timing/gap audit beyond confirming the text fields agree. Voice-provider metadata in `voice.json` was not audited because the task scope was the 12 spoken lines.
