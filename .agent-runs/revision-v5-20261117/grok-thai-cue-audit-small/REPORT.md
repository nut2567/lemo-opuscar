# Thai narration one-row fit audit

Source-text and width audit only. No caption file was edited. This is not visual acceptance.

## Source status

- `films/horror-x-ep1-part1-60s/script.json`: 12 lines.
- `films/horror-x-ep1-part1-60s/voice-timeline.json`: 12 spoken lines. On every line, the `words` tokens join (no spaces) to the scene `text`. No dropped or extra tokens inside the voice file.
- Spoken text and `script.json` match on 02, 05, 06, 11, 12. They differ on 01, 03, 04, 07, 08, 09, 10. The voice line is the narration to caption.
- `captions.js` is present and still v4: 12 cues, every `size` is 9.6. No 19.2px cue file has landed (`build-captions.py` describes 19.2px but has not been emitted into `captions.js`). The 19.2px caption-vs-narration check is **pending**.
- The current 9.6px cue `text` values match the 12 voice-timeline lines exactly, including the two-line `lines` arrays when joined. That match is not a v5 result.

## How width was measured

Kanit-Regular.ttf via fontTools 4.68.0. Width is the sum of `hmtx` advances divided by unitsPerEm (1000) times exactly 19.2. Same method as `build-captions.py`. No glyph used by these lines was missing from the cmap. Fit bar for this audit is the zone x90..930 (840px). The generator's own text budget is 800px (840 minus 32px bar padding minus 8px safety); both limits are reported.

## Longest spoken lines at 19.2px

| id | px | vs 840 | vs 800 | spoken text |
| --- | ---: | --- | --- | --- |
| 04 | 586.87 | fits | fits | พอดึกลง ร้านแทบไม่มีคนเหลืออยู่ เหลือแต่เสียงเครื่องซักผ้าหมุนอยู่ข้างตัวฉัน |
| 08 | 573.79 | fits | fits | เขาไม่เคยทัก ไม่เคยรอถาดเหรียญ แต่กลับคอยหยอดเหรียญลงในเครื่องเอง |
| 11 | 566.50 | fits | fits | คืนแรกฉันคิดว่าเขาแค่ไม่อยากคุย แต่คืนที่สอง และคืนที่สาม ก็ยังเหมือนเดิม |

## Longest existing space-separated phrases

| id | px | text |
| --- | ---: | --- |
| 01 phrase 1 | 334.04 | นี่คือคืนสุดท้ายที่ฉันทำงานในร้านซักผ้าแห่งนี้ |
| 04 phrase 3 | 328.15 | เหลือแต่เสียงเครื่องซักผ้าหมุนอยู่ข้างตัวฉัน |
| 05 phrase 1 | 319.18 | บางคืนเงียบจนฉันได้ยินเหรียญทุกเหรียญ |

## All 12 spoken lines

| id | px | one row in 840 | script match |
| --- | ---: | --- | --- |
| 01 | 523.41 | yes | no |
| 02 | 472.72 | yes | yes |
| 03 | 517.59 | yes | no |
| 04 | 586.87 | yes | no |
| 05 | 507.72 | yes | yes |
| 06 | 465.91 | yes | yes |
| 07 | 500.81 | yes | no |
| 08 | 573.79 | yes | no |
| 09 | 537.95 | yes | no |
| 10 | 519.82 | yes | no |
| 11 | 566.50 | yes | yes |
| 12 | 554.80 | yes | yes |

## Script vs spoken (do not reword; caption the voice)

- 01 voice adds `แห่งนี้` after `ซักผ้า`.
- 03 voice adds `ของฉันก็` after `หน้าที่`.
- 04 voice adds `เหลืออยู่` after `ไม่มีคน`, `แต่` after `เหลือ`, and `ฉัน` at the end.
- 07 script has `เลย` after `หน้าเขา` and `มา` after `เงยขึ้น`; the voice omits both.
- 08 voice adds `คอย` after `แต่กลับ` and `ใน` after `เหรียญลง`.
- 09 voice adds `สี` before `ขาว` and `ใส` after `ฝากระจก`.
- 10 voice adds `เลย` before `สักครั้ง`.

## Recommendations

No phrase needs a new boundary. Every full spoken line fits one 19.2px row inside 840px, and inside the generator's 800px text budget. Widest line is 586.87px (id 04). Widest existing phrase is 334.04px. Do not split, shrink, or rewrite.

When captions are regenerated, use `voice-timeline.json` text so the seven script mismatches are not dropped or added. Re-check the 19.2px cue aggregate against these 12 lines after `captions.js` is rewritten. Until then that comparison stays pending.

Numbers are in `audit.json`. Per-phrase dumps are in `widths.json`.
