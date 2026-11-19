# แผนการเคลื่อนไหวเต็มตัวของเซล · Snowy Neon EP1 ฉบับ Jessica

**แผนสำหรับการผลิต — ยังไม่เริ่มผลิต** · ฉบับนี้จำกัดขอบเขตเหลือ **Jessica edition เดียว** และใช้ `films/horror-x-snowy-neon-code/ep1-source/` เป็นฐานงานหลัก ไม่ใช้ `ep1-recut/devin-work` หรือวัสดุของฉบับซับเดิม

## ขอบเขตและเป้าหมาย

- ส่งมอบภาพยนตร์แนวตั้งหนึ่งฉบับ: **60.000 วินาที, 1080×1920, 30 fps, 1,800 เฟรม**, เสียงพากย์ Jessica และซับ `jessica.srt` ตรงเวลากัน
- ใช้ `ep1-source/picture/jessica.json` เป็นตารางช็อต/คิว/แอ็กชัน และ `ep1-source/captions/jessica.srt` เป็นซับ 12 ช่วงเดิม ห้ามแก้ข้อความซับหรือเลื่อนเวลา cue
- รักษาแบบเซลที่ผ่านการอนุมัติแล้ว: หน้า ผม ชุดสี และโครงร่างตัวจาก `models/cel/` ต้องเป็น motion layer ที่เคลื่อนไหวบนแบบเดิม ไม่วาดหน้า/ผม/ชุดใหม่ให้ต่างจากแบบที่อนุมัติ
- รักษา invariants ของฉาก Snowy Neon: พิกัดโลก 1080×1920, กล้อง Canvas/SVG เดียวกัน, clip ตัวละครใต้เคาน์เตอร์ที่ world `y=1110`, ช่องประตูหลัง `x470–595, y775–1185`, เคาน์เตอร์ `x630–740, y1110–1335`, ไม่มี image input, ไม่มี `Math.random`, ไม่มี state ที่ทำให้เฟรมเดียวกันเรนเดอร์ต่างกัน
- **ไม่ทำ** งานซ้ำสำหรับฉบับ `original`/Niwat/free-voice, ไม่ build `original`, ไม่สร้าง pose/timeline แยกสำหรับฉบับนั้น และไม่ถือว่า `first-minute/` หรือ `ep1-recut/devin-work` เป็น input ที่ต้องใช้
- ก่อน dispatch ต้องจัดการปัญหา worktree: `/films/` อยู่ใน `.gitignore` จึงห้ามสมมติว่า child worktree ใหม่มี local `ep1-source` inputs; coordinator ต้อง provision ชุด source แบบ read-only เข้าแต่ละ worker worktree หรือใช้ workspace strategy ที่อนุญาตและ verify path ก่อน launch

## หลักฐานต้นทางและสิ่งที่ต้องมีก่อนเริ่ม

| รายการ | สถานะใน checkout นี้ | ใช้อย่างไร |
|---|---|---|
| `ep1-source/picture/jessica.json` | มีอยู่ใน checkout หลัก | source of truth ของ 16 cuts, shots, cues, actions, coinPlace และ shot verdicts; ต้อง provision เข้า worker worktree แบบ read-only |
| `ep1-source/captions/jessica.srt` | มีอยู่ใน checkout หลัก | source of truth ของซับ 12 ช่วง; ห้าม re-time/re-cue |
| `ep1-source/entry.mjs`, `index.html`, `timeline.mjs`, `build.sh`, `verify-*.mjs/.py`, `README.md` | มีอยู่ใน checkout หลัก | wiring/build/verify เดิม; coordinator เป็นเจ้าของการ integrate |
| `films/horror-x-snowy-neon-code/INTERFACE.md` และไฟล์ scene/model ที่เกี่ยวข้อง | ต้องตรวจซ้ำตอน dispatch | ใช้เป็น scene/anchor reference; ถ้าอยู่ใต้ `/films/` ที่ ignore ต้องอยู่ใน source bundle ที่ provision ให้ worker |
| Jessica dry narration WAV 60.000 วินาทีที่ตรง SRT | **ยังไม่อยู่ใน source package** | `README.md` ระบุให้ส่ง path ของ aligned dry WAV เข้ามาตอน build; `picture/jessica.json` อ้าง `narrative-cut/out/jessica-v1/speech.wav` แต่โฟลเดอร์ `narrative-cut` ไม่อยู่ใน checkout นี้ ต้องได้รับไฟล์จริงหรือ path ที่ยืนยันได้ก่อน final render/audio-motion validation |
| `ep1-recut/devin-work` | ไม่มีใน checkout นี้ | ไม่ต้องใช้; ให้ย้ายฐานเวลาภาพ/ซับมาใช้ `ep1-source` ทั้งหมด |
| หลักฐาน caption เก่าที่ `CAPTION-NOTES.md` อ้าง (`.agent-runs/snowy-neon-ep1-devin40/...`) | ไม่พบใน checkout ปัจจุบัน | ต้องกู้คืนหลักฐานเดิมหรือสร้างการเปรียบเทียบใหม่ก่อนสรุปขนาดซับ |
| Git baseline | source package อยู่บน `main` ที่ commit `fb485d6`; orchestration ledger อาจมี local update | ให้ recheck `git status` ก่อน dispatch; ห้าม revert งานของผู้อื่น |
| `/films/` gitignore + child worktrees | `.gitignore` มี `/films/`; new-child worktree อาจไม่มีไฟล์ local ใต้ `films/` | pre-dispatch blocker: coordinator ต้อง copy/bundle `ep1-source` inputs ที่จำเป็นแบบ read-only เข้าแต่ละ worker worktree หรือยืนยัน workspace strategy ที่ให้ worker อ่าน input เดียวกันได้; ห้ามปล่อย worker ที่ไม่มี input |
| Worker roster | roster ตั้งต้นมี Devin 5 slots | ต้อง recheck Orca host/account readiness ตอน dispatch; ห้ามอ้างว่างานเริ่มแล้วหรือพร้อมเต็มที่ |

### ข้อขัดแย้งขนาดซับที่ต้องตัดสินก่อน render

ผู้ใช้ขอ “ซับขนาดเล็กล่าสุด” แต่ไฟล์ปัจจุบันให้ค่าที่ต่างกัน:

- `ep1-source/index.html` ตั้ง default เป็น **22.4 px บน raster 1080×1920** (`2.0741vw`) และ comment อธิบายว่าเป็นขนาดที่เล็กที่สุดในชุด `{19.2, 22.4, 24}` ที่ restores Thai tone marks เมื่อดูที่ phone scale 390 px
- `ep1-source/captions/CAPTION-NOTES.md` แนะนำ baseline ที่ accepted v5 คือ **19.2 px** (`1.7778vw`) และบอกให้ตรวจ cue ที่ยาวที่สุดที่ phone scale
- `docs/snowy-neon-ep1-delivery.th.md` ระบุ 22.4 px ในเอกสารส่งมอบเดิม

แผนนี้ **ไม่ถือว่าทั้ง 19.2 และ 22.4 ได้รับอนุมัติพร้อมกัน** ให้ coordinator ทำ evidence check แยกก่อน final render:

1. ค้นหาคำสั่ง/หลักฐาน “latest small subtitle style” ล่าสุดจากผู้ใช้หรือ CAPTION-DIRECTION ที่แท้จริง
2. เรนเดอร์เปรียบเทียบ Jessica cue ที่ยาวที่สุด (cue 12) และตัวอย่าง cue 3/5 ที่ 19.2 px กับ 22.4 px ทั้งที่ 1080×1920 และมุมมอง phone 390 px
3. ตรวจว่า Thai marks อ่านได้, ซับยังอยู่ใน safe band เดิม, ทุก cue ยังพอดีหนึ่งบรรทัด และไม่เปลี่ยน `jessica.srt`
4. บันทึกค่าที่ผู้ใช้อนุมัติจริงเป็นค่าเดียวก่อน integration/render; ถ้ายังไม่มีคำตอบ ให้คง default ปัจจุบันของ renderer ไว้เป็นสถานะชั่วคราวและติด blocker ว่าต้องยืนยันก่อน final acceptance

## เนื้อเรื่อง จังหวะภาพ และแอ็กชันที่ต้องรักษา

ตัวละครที่แสดงยังเป็น **เซลในบทนุ่น/พนักงานซักผ้ายามดึก** เสียงบรรยายเป็น Jessica เท่านั้น ตารางนี้สรุป `jessica.srt` + `picture/jessica.json`; ห้ามเลื่อนเวลาเพื่อให้ motion สวยขึ้น

| Cue | SRT window (วินาที) | Shot coverage หลัก | จังหวะที่ต้องแสดง |
|---|---:|---|---|
| 1 | 0.270–4.400 | `store` | เปิดร้าน/ป้ายก่อน แล้วเห็นเซลทำงานประจำด้วยมือที่คุ้นเคย ก่อนพักมือและตัดเข้าใกล้ |
| 2 | 6.100–9.710 | `nun` | เดิน 2–3 ก้าวจากช่องทางข้างเครื่อง เท้าสุดท้ายหยุดข้างเคาน์เตอร์ ไหล่หยุดตาม แล้วมือวางบนขอบถาด |
| 3 | 11.730–14.750 | `work`, `work-drum` | รับเหรียญ/จัดงานประจำและส่งผ้าเข้าปากถังตามคำเล่า โดยแยกมือกับเหรียญกับมือกับผ้า |
| 4 | 14.840–16.600 | `work-drum` | ถอนมือพ้นปากถัง เหยียดหลัง ถอยครึ่งก้าว แล้วค้างมองถังหมุน |
| 5 | 18.840–22.650 | `quiet`, `tray` | ห้องเงียบ เหรียญตกกระทบถาดที่ cue `21.82`; มือค้างเหนือถาดและมีปฏิกิริยาสะดุ้งครั้งเดียวหลังเหรียญแตะ |
| 6 | 24.870–28.300 | `customer` | ลูกค้าปรากฏเฟรม ~746 เซลเงยจำได้ ศีรษะตาม มือนิ่งขึ้นและน้ำหนักถอยไปขาหลัง |
| 7 | 28.530–30.160 | `faceless` | มองลูกค้าให้ชัด เห็นแต่ผ้าขาว มุมศีรษะเล็กน้อยแล้วค้างท่า |
| 8 | 32.100–33.240 | `slot` | เน้นเหรียญลูกค้าเข้าช่องที่ `32.75`; เซลไม่แย่งแอ็กชันนี้ |
| 9 | 33.240–37.110 | `slot`, `sheet`, `empty-washer` | ผ้าหมุน มอเตอร์ที่ `33.53` แล้วตัดไปพื้นที่ว่าง; เซลหันตาไปจุดลูกค้าเดิมและหยุดมอง |
| 10 | 39.960–43.950 | `rear-exit` | ชายผ้าลับประตูหลัง; ประตูว่างตั้งแต่เฟรม ~1241 เซลค้างฟัง/หันหู ไม่มีเสียงฝีเท้า |
| 11 | 47.000–49.700 | `second-night`, `third-night` | คืนที่สองถอนมือเกือบกลับทำงาน คืนที่สามมือหยุดค้างทันที ต้องใช้ท่าที่ต่างกันอย่างอ่านรู้ |
| 12 | 52.570–57.690 | `decision`, `watch` | วางเหรียญจริง: เริ่ม `53.55`, contact `53.95`, settled `54.35`; แล้วตา/ศีรษะ/ไหล่หันไปประตูว่างตามลำดับและค้างถึงเฟรม 1799 |

### กฎ motion ที่สืบทอดจากแผนเดิม

- เดินเต็มตัวต้องเห็นอย่างน้อยสองก้าวและจังหวะหยุดในช็อตเปิดกะ; ให้สะโพกผ่านเท้าหลักก่อนลงน้ำหนักเต็มฝ่าเท้า ใช้ท่าเอื้อม/จับ/ยก/ปล่อย/ถอนแยกกัน และใช้ช็อตมุมสามส่วนเมื่อท่าเดินหรือหันต้องอ่านใบหน้า
- สายตานำก่อนศีรษะ ไหล่และลำตัวตามเฉพาะเมื่อท่านั้นต้องถ่ายน้ำหนัก ความกลัวใช้การชะงักนิ้ว/ค้างน้ำหนัก/หยุดครึ่งก้าว แทนการสั่นตลอดฉาก
- เหรียญและวัตถุอยู่ในพิกัดฉากเดียวกับมือ: เหรียญหลุดจากนิ้วต้องเปลี่ยนเจ้าของการเคลื่อนจากมือไปวิถีเหรียญ แล้วหยุดบนถาด; coinPlace ของ cue 12 ต้องเห็นเหรียญจริงหนึ่งเหรียญจากมือไปถาด โดยเหรียญห้าเหรียญเดิมบนถาดยังอยู่และไม่ขยับ
- แสงและเงาต้องต่อเนื่อง: แสงเย็นจากกระจก/แสงอุ่นจากเคาน์เตอร์เปลี่ยนตามตำแหน่งเซล เงาสัมผัสพื้นอยู่ใต้เท้าที่รับน้ำหนักจริง และตัวละครถูกบังโดยเคาน์เตอร์/มุมฉากตามตำแหน่งจริงเมื่อเข้าแนวหลังเคาน์เตอร์

## สัญญา API และผังไฟล์ที่เสนอ

ก่อน dispatch ให้ coordinator ตรึงสัญญา API ฉบับเดียว และ provision source inputs ให้ worker worktree ก่อน แล้วค่อยปล่อยห้าแพ็กเกจพร้อมกัน ทุกโมดูลต้องเป็น pure function ของเวลากับ context: ไม่มี DOM โดยตรงใน logic, ไม่มี `Math.random`, ไม่มี mutable state, และเปิดเฟรมลำดับใดก็ได้ต้องได้ผลเดิม

```text
films/horror-x-snowy-neon-code/ep1-source/
  # inputs ที่ provision แบบ read-only ให้แต่ละ worker worktree (ไม่ใช่ worker output)
  picture/jessica.json
  captions/jessica.srt
  captions/CAPTION-NOTES.md
  index.html / entry.mjs / timeline.mjs / build.sh / verify-*.mjs/.py / README.md
  motion/
    API.md                           # coordinator-owned, ตรึงก่อน launch
    rig/lower/lower-body.mjs         # WP-LOWER (งานที่ 1.1)
    rig/lower/fixtures.json          # WP-LOWER
    rig/upper/upper-body.mjs         # WP-UPPER (งานที่ 1.2)
    rig/upper/fixtures.json          # WP-UPPER
    poses/jessica-01-06.json         # WP-POSE-1-6 (งานที่ 2.1)
    poses/jessica-01-06.notes.md     # WP-POSE-1-6
    poses/jessica-07-12.json         # WP-POSE-7-12 (งานที่ 2.2)
    poses/jessica-07-12.notes.md     # WP-POSE-7-12
    scene/scene-layout.json          # WP-SCENE (งานที่ 3.1)
    scene/occlusion.mjs              # WP-SCENE (งานที่ 3.2)
    scene/fixtures.json              # WP-SCENE
```

ไฟล์ wiring เดิม `entry.mjs`, `index.html`, `timeline.mjs`, `build.sh`, `verify-timeline.mjs`, `verify-media.py`, `picture/jessica.json` และ `captions/jessica.srt` เป็น **coordinator-owned/read-only สำหรับ worker** ห้าม worker แก้โดยตรง; integration เข้า renderer ทำโดย coordinator หลังผลงาน settle

### เนื้อหาสัญญา API ที่ต้องตรึง

- `FrameContext`: `{ edition:'jessica', frame, seconds, cue, shot, camera, sourceSeconds }` โดย `frame = round(seconds*30)`, `cue` คือ 1–12 หรือ `null`, `shot` คือ shot id จาก `picture/jessica.json`
- `PoseSample`: ผลรวมจาก pose JSON สองครึ่งที่ผ่าน schema เดียวกัน ประกอบด้วย `rootPath`, `weight`, `lowerKeys`, `upperKeys`, `hands`, `gaze`, `props`, `contacts` และ `holds`; pose JSON เก็บทิศทางการแสดง/จุดสัมผัสเชิง semantics ไม่ใช่ pixel mask หรือ screenshot
- Lower-body contract: รับ `FrameContext + PoseSample + scene.path` แล้วคืน `root`, `hips`, `knees`, `ankles`, `toes`, `footContacts`, `gaitPhase` ใน world/local coords ที่ระบุใน contract; ต้องรองรับเดิน, หยุด, ถอยครึ่งก้าว, หัน และลงน้ำหนักโดยเท้าไม่ไถลในช่วง stance
- Upper-body contract: รับ `FrameContext + PoseSample + lowerBodyResult` แล้วคืน `torso`, `shoulders`, `arms`, `hands`, `fingers`, `head`, `gaze`; ต้องใช้ root/hip transform จาก lower-body เพื่อให้ลำตัวและแขนเคลื่อนตามร่างเดียวกัน แต่ห้าม upper-body ไปแก้ข้อต่อขา
- Scene contract: `scene-layout.json` เป็นข้อมูลเส้นทาง/anchor/occlusion/แสง; `occlusion.mjs` คืน draw-order, counter occlusion, contact-shadow specs และ lighting zones จากตำแหน่งร่างกาย/เท้า โดยไม่วาดทับ environment เดิม
- Contact types ที่ใช้ร่วมกัน: `foot-plant`, `hand-prop`, `coin-release`, `coin-place`, `gaze-target`, `body-occlusion`; ทุก contact ต้องผูกกับ scene anchor id เช่น `counter-front`, `tray`, `slot`, `rear-door`, `washer-row` ไม่ใช่พิกัดลอย ๆ ที่ไม่มีเจ้าของ
- Interpolation: JSON เก็บ keyframes/beats; rig เป็นผู้ interpolate แบบ deterministic (แนะนำ smoothstep ระหว่าง keyframes และ hold ตรง keyframe); ห้ามให้ pose JSON หรือ rig ใด ๆ ใช้เวลา wall-clock

## ลำดับงาน แผนภาพพึ่งพา และกำหนดการ

```text
Coordinator: readiness + provision read-only ep1-source inputs + ตรึง API contract
        |
        v
WP-LOWER lower-body rig ─┐
WP-UPPER upper-body rig ─┤
WP-POSE-1-6 cues 1-6   ─┼─ ทำขนานกันใน worktree แยก, ใช้ schema เดียวกัน
WP-POSE-7-12 cues 7-12 ─┤
WP-SCENE scene map     ─┘
        |
        +-- ขนาน: caption-size evidence review + QA checklist prep
        v
Coordinator integrate rig/pose/scene เข้า entry/build wiring + สร้าง motion-test harness
        |
        v
คลิปทดสอบ 8–12 วินาทีจากฉากจริง → ตรวจ/แก้จนผ่าน gate
        |
        v
Build/render Jessica เต็ม 60.000 วินาที + verify media/timeline/visual QA
```

กฎพึ่งพาที่ต้องยึด:

- **Pre-dispatch:** `/films/` ถูก ignore ใน `.gitignore`; coordinator ต้องสร้าง read-only source bundle/copy ของ `ep1-source` inputs ที่จำเป็น (`picture/`, `captions/`, wiring/verifier/README และ scene reference ที่ worker ต้องอ่าน) ลงในแต่ละ worker worktree ก่อน launch หรือยืนยัน workspace strategy ที่ให้ worker เข้าถึง input เดียวกันได้ ห้ามปล่อย worker แล้วให้ไปหาไฟล์ `films/` เอง
- Coordinator ต้อง publish contract ก่อน launch; ห้า worker packages เริ่มพร้อมกันหลัง contract freeze และ source provisioning verify ผ่าน
- Pose สองครึ่งและ rig สองครึ่งใช้ schema เดียวกัน แต่ไม่ต้องรอผลลัพธ์ของกันและกัน; แต่ละแพ็กเกจ inject scene path/prop anchors ผ่าน contract fixture ได้ ไม่ต้องรอ `scene-layout.json` ฉบับสุดท้าย
- Coordinator integrate เฉพาะหลัง worker ทั้งห้าคืน patch/diff + evidence + unresolved issues ครบหรือ settle ด้วย error ที่บันทึกไว้ ห้าม integrate ครึ่ง ๆ
- QA checklist prep และ caption-size evidence review ทำขนานกับ implementation ได้ แต่ visual QA ต้องรอ integration; caption decision ต้องสรุปก่อน final render
- Motion test ต้องผ่านก่อน full render; ถ้า test เผยปัญหา ให้แก้เฉพาะ scope ที่เป็นเจ้าของแล้ววนกลับมาที่ gate เดิม

## งานที่ 1 — Cel motion rig เต็มตัว

เป้าหมายของงานนี้คือสร้าง motion rig เต็มตัวที่ deterministic สำหรับเซล Jessica: lower-body package และ upper-body package เป็น worker assignments แยกกันภายใต้ contract เดียวกัน ส่วน contract/integration เป็นงานของ coordinator

### 1.0 Shared contract, readiness และ source provisioning

- เป้าหมาย: ตรึง `motion/API.md` ฉบับเดียว, ยืนยัน readiness ของ source/WAV/caption blockers และ verify ว่าแต่ละ worker worktree มี `ep1-source` inputs แบบ read-only ก่อน launch
- ขอบเขตไฟล์/ผลลัพธ์: `motion/API.md` + readiness/provisioning note ใน evidence area ของ coordinator; ไม่แก้ worker output files
- เจ้าของ: coordinator (ไม่ใช่ Devin worker package)
- ก่อนหน้า/พึ่งพา: recheck `git status`, roster readiness, `.gitignore`/worktree strategy; contract ต้อง freeze ก่อน worker start
- เวลา active โดยประมาณ: 0.75–1.25 ชม. คนก่อน launch + 0.25 ชม. ตอน review contract
- การทำงานขนาน: block การ launch; caption/QA prep สามารถเริ่มใน checkout หลักได้หลัง contract พร้อม
- ส่งมอบ: contract ที่ freeze, รายการไฟล์ที่ provision ต่อ worktree, readiness/blocker note
- เกณฑ์ยอมรับ: contract ระบุ units, `FrameContext`, `PoseSample`, lower/upper/scene signatures, contact types, interpolation, ownership และ error-report format ชัดเจน; ทุก worker worktree verify แล้วว่าอ่าน `jessica.json`/`jessica.srt`/wiring inputs ได้แบบ read-only หรือมี blocker ที่บันทึกไว้

### 1.1 Lower-body rig package (WP-LOWER)

- เป้าหมาย: สร้าง deterministic lower-body sampler และ fixtures สำหรับราก/สะโพก/ขา/เข่า/ข้อเท้า/ปลายเท้า การปลูกเท้า และ gait ที่ใช้ซ้ำได้กับทุกช็อต Jessica
- ขอบเขตไฟล์/ผลลัพธ์: `motion/rig/lower/lower-body.mjs` และ `motion/rig/lower/fixtures.json` เท่านั้นในแพ็กเกจนี้; ห้ามแก้ `models/`, `characters.mjs`, `main.mjs`, `entry.mjs`, pose/scene files หรือ wiring ของ worker อื่น
- เจ้าของ: Devin worker package WP-LOWER (lower-body rig)
- ก่อนหน้า/พึ่งพา: API contract ที่ coordinator ตรึงแล้ว + source provisioning verified; ใช้ fixture path ที่ตรง schema ได้ ไม่ต้องรอ `scene-layout.json` แต่ห้าม hardcode พิกัดฉากจริง
- เวลา active โดยประมาณ: 2.50–3.25 ชม. คน
- การทำงานขนาน: เริ่มพร้อม WP-UPPER, WP-POSE-1-6, WP-POSE-7-12, WP-SCENE หลัง contract freeze; ภายในแพ็กเกจทำ sampler ก่อน fixtures
- ส่งมอบ: patch/diff, `lower-body.mjs`, `fixtures.json`, ตัวอย่าง output JSON สำหรับ frame ที่เลือก, ตาราง no-slide/continuity metrics, unresolved issues
- เกณฑ์ยอมรับ: export ตรง signature ที่ contract กำหนด; output เป็น finite numbers; pure/deterministic; เท้าที่อยู่ใน stance มี world velocity ~0; เท้าสวิงยกพ้นพื้นตาม arc; fixtures ครอบคลุม cue 2 เดินเข้า/หยุด, cue 4 ถอยครึ่งก้าว, cue 11 คืนสอง–สาม และ cue 12 เฝ้าประตู; ไม่แตะไฟล์นอก scope

### 1.2 Upper-body rig package (WP-UPPER)

- เป้าหมาย: สร้าง deterministic upper-body sampler และ fixtures สำหรับลำตัว ไหล่ แขน มือ นิ้ว ศีรษะ และสายตา โดยใช้ root/hip transform ของ lower-body และคงแบบเซลที่อนุมัติ
- ขอบเขตไฟล์/ผลลัพธ์: `motion/rig/upper/upper-body.mjs` และ `motion/rig/upper/fixtures.json` เท่านั้นในแพ็กเกจนี้; ห้าม redraw face/hair/body design และห้ามแก้ไฟล์ lower-body/pose/scene/wiring
- เจ้าของ: Devin worker package WP-UPPER (upper-body rig)
- ก่อนหน้า/พึ่งพา: API contract; ใช้ lower-body result fixture ที่ตรง schema ได้ ไม่ต้อง import ไฟล์จริงของ WP-LOWER
- เวลา active โดยประมาณ: 3.00–3.75 ชม. คน
- การทำงานขนาน: เริ่มพร้อม WP-LOWER, WP-POSE-1-6, WP-POSE-7-12, WP-SCENE หลัง contract freeze
- ส่งมอบ: patch/diff, `upper-body.mjs`, `fixtures.json`, output JSON samples, contact/gaze metrics, unresolved issues
- เกณฑ์ยอมรับ: hands/forearms เป็น finite IK targets; head/gaze แยกจาก torso ตาม contract; upper-body ไม่แก้ hip/knee/ankle/toe; deterministic; fixtures ครอบคลุม coin/tray cues 3/5/12, cloth cue 3, customer cues 6–9, rear door cues 10–12 และ coin-place window `53.55/53.95/54.35`; แบบหน้า/ผม/ชุดยังอ้างอิง cel เดิม

### 1.3 Coordinator rig integration gate

- เป้าหมาย: หลัง WP-LOWER และ WP-UPPER settle ให้ coordinator ตรวจ compatibility ของ lower/upper rig, wire โมดูลเข้ากับ coordinator-owned entry path แบบ read-only contract และผลิต rig smoke sample ก่อน pose/scene ทั้งหมด settle
- ขอบเขตไฟล์/ผลลัพธ์: review note + integration patch ของไฟล์ coordinator-owned (`entry.mjs` และ `index.html`/`timeline.mjs`/`build.sh` เฉพาะที่จำเป็น); ไม่แก้ไฟล์ worker
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: WP-LOWER และ WP-UPPER settle; API contract เดิม; pose/scene อาจยังไม่เสร็จ ให้ใช้ fixtures ที่ตรง schema
- เวลา active โดยประมาณ: 0.50–0.75 ชม. คนหลัง settle
- การทำงานขนาน: ทำหลัง rig workers settle โดยอาจขนานกับการรอ pose/scene workers
- ส่งมอบ: compatibility verdict, rig smoke sample, รายการ field ที่ต้อง map ตอน full integration
- เกณฑ์ยอมรับ: upper-body ไม่ import path ที่ทำให้ circular dependency; root/hip consumption ตรง schema; lower/upper compose เป็น `PoseSample -> lowerBodyResult -> upperBodyResult` ได้; ไม่มี deviation ที่ไม่ได้บันทึก

## งานที่ 2 — Jessica pose data

เป้าหมายของงานนี้คือแปลงจังหวะซับ/ช็อต/แอ็กชันของ Jessica ทั้ง 12 cue เป็น pose keys ที่ schema เดียวกัน โดยแบ่งเป็นสอง worker packages ตามช่วง cue และให้ coordinator ตรวจ cross-pose/transition หลัง settle

### 2.1 Jessica pose data cues 1–6 (WP-POSE-1-6)

- เป้าหมาย: ครอบคลุม cue 1–6: opening/store, เดินเข้า+แนะนำตัว, งานรับเหรียญ/ใส่ผ้า, รอเครื่องซัก, เหรียญตกถาดที่ 21.82 และลูกค้าปรากฏ/เซลจำได้; ระบุท่าเดิน, จุดหยุด, มือกับเหรียญ, มือกับผ้า, half-step back, hand freeze, coin impact reaction และ weight shift ไปขาหลัง
- ขอบเขตไฟล์/ผลลัพธ์: `motion/poses/jessica-01-06.json` และ `motion/poses/jessica-01-06.notes.md` เท่านั้นในแพ็กเกจนี้; อ่าน `picture/jessica.json`, `captions/jessica.srt`, `timeline.mjs` แบบ read-only; ห้ามแก้ rig/scene/wiring
- เจ้าของ: Devin worker package WP-POSE-1-6
- ก่อนหน้า/พึ่งพา: API contract + source provisioning verified; scene anchor ids จาก contract
- เวลา active โดยประมาณ: 2.50–3.00 ชม. คน
- การทำงานขนาน: เริ่มพร้อม WP-LOWER, WP-UPPER, WP-POSE-7-12, WP-SCENE หลัง contract freeze
- ส่งมอบ: patch/diff, pose JSON cues 1–6, notes อธิบาย beat ที่มาจาก shot/action, validation output, unresolved issues
- เกณฑ์ยอมรับ: cue range และ shot ids ตรง `jessica.json`; ไม่มีการ retime cue; cue 5 มี coin impact/contact beat ที่ 21.82; cue 6 มี customer reveal/reaction keys; contacts อ้าง scene anchor ids; keyframes มี intent/hold ที่อ่านย้อนกลับได้; JSON parse ผ่านและไม่มี unknown anchor id

### 2.2 Jessica pose data cues 7–12 (WP-POSE-7-12)

- เป้าหมาย: ครอบคลุม cue 7–12: faceless reveal, เหรียญลูกค้าเข้าช่องที่ 32.75, ผ้าหมุน/คนหาย/มอเตอร์ 33.53, ประตูว่างและการฟังโดยไม่มี footsteps, คืนที่สอง–สามที่ต้องต่างกันชัดเจน และ cue 12 coinPlace + watch door จนเฟรม 1799
- ขอบเขตไฟล์/ผลลัพธ์: `motion/poses/jessica-07-12.json` และ `motion/poses/jessica-07-12.notes.md` เท่านั้นในแพ็กเกจนี้; อ่าน `picture/jessica.json`, `captions/jessica.srt`, `timeline.mjs` แบบ read-only; ห้ามแก้ rig/scene/wiring
- เจ้าของ: Devin worker package WP-POSE-7-12
- ก่อนหน้า/พึ่งพา: API contract + source provisioning verified; scene anchor ids จาก contract
- เวลา active โดยประมาณ: 3.00–3.75 ชม. คน
- การทำงานขนาน: เริ่มพร้อม WP-LOWER, WP-UPPER, WP-POSE-1-6, WP-SCENE หลัง contract freeze
- ส่งมอบ: patch/diff, pose JSON cues 7–12, notes, validation output, unresolved issues
- เกณฑ์ยอมรับ: cue 8 ไม่ให้เซลแสดงเป็นคนหยอดเหรียญ; cue 9 มี gaze hold ไปยังจุดลูกค้าเดิมหลังคนหาย; cue 10 ไม่มี footstep implication; cue 11 มีสองคืนที่อ่านต่างกัน; cue 12 มี coinPlace `53.55/53.95/54.35` และ watch-to-end keys; ไม่มี retime/gap/overlap ใน cue ownership

### 2.3 Coordinator cross-pose/transition validation

- เป้าหมาย: รวมตรวจ pose JSON สองครึ่งหลัง WP-POSE-1-6 และ WP-POSE-7-12 settle ว่า schema เดียวกัน, cue coverage ไม่ชนกัน, boundary ระหว่าง cue 6/7 และ transition ไปสู่ final watch สมเหตุสมผล
- ขอบเขตไฟล์/ผลลัพธ์: validation report + integration notes ใน evidence area ของ coordinator; ไม่แก้ไฟล์ pose โดยตรง เว้นแต่ตีกลับให้ worker เจ้าของแก้
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: WP-POSE-1-6 และ WP-POSE-7-12 settle; API contract เดิม
- เวลา active โดยประมาณ: 0.50–0.75 ชม. คนหลัง settle
- การทำงานขนาน: ทำหลัง pose halves เสร็จ โดยอาจขนานกับการรอ rig/scene settle
- ส่งมอบ: validation report, รายการ correction ที่ส่งกลับให้ worker, go/no-go สำหรับ integration
- เกณฑ์ยอมรับ: ทั้งสองไฟล์ parse; cue 1–12 ครบพอดี; boundary cue 6→7 และ cue 12→end ไม่มี key ที่ขัดกัน; anchor references ครบ; ไม่มี retime ของ `jessica.srt`

## งานที่ 3 — Scene map, occlusion, contact shadows และ lighting

เป้าหมายของงานนี้คือทำแผนที่ฉากที่ rig/pose ใช้ร่วมกัน: เส้นทางเดิน, anchor ของ props/ประตู/เคาน์เตอร์, กฎ occlusion, contact shadows และ lighting zones โดยไม่แก้โมดูลฉากเดิม

### 3.1 Scene layout package (WP-SCENE part A)

- เป้าหมาย: encode เส้นทางเดินของเซล, จุดเริ่ม/จุดหยุด, ขอบเขตพื้นที่เปิด/หลังเคาน์เตอร์, anchor ของถาด เหรียญ ช่องหยอด ปากถัง ประตูหลัง และพื้นกระเบื้อง ในพิกัดโลกเดียวกับ `INTERFACE.md` และ `picture/jessica.json`
- ขอบเขตไฟล์/ผลลัพธ์: `motion/scene/scene-layout.json` เท่านั้นในส่วนนี้; ห้ามแก้ `environment.mjs`, `washers.mjs`, `characters.mjs`, `main.mjs`, `neon.mjs` หรือ `weather.mjs`
- เจ้าของ: Devin worker package WP-SCENE
- ก่อนหน้า/พึ่งพา: API contract scene schema + source provisioning verified; อ่าน `INTERFACE.md`, `characters.mjs`, `main.mjs`, `picture/jessica.json` แบบ read-only
- เวลา active โดยประมาณ: 1.25–1.50 ชม. คน
- การทำงานขนาน: เริ่มพร้อม WP-LOWER, WP-UPPER, WP-POSE-1-6, WP-POSE-7-12 หลัง contract freeze; ไม่ต้องรอ rig/pose outputs
- ส่งมอบ: patch/diff, `scene-layout.json`, คำอธิบายใน notes/report, unresolved issues
- เกณฑ์ยอมรับ: ค่า geometry สอดคล้อง INTERFACE (counter, rear opening, Nun/cel anchor, counter clip y1110); path มี waypoint ที่เดินได้จริง; anchor ids ตรง contract; JSON deterministic/readable

### 3.2 Occlusion, contact shadows และ lighting package (WP-SCENE part B)

- เป้าหมาย: implement pure helpers สำหรับ draw-order, counter occlusion, contact shadows ใต้เท้า/มือเมื่อแตะพื้น/ถาด และ lighting zones ที่เปลี่ยนตามตำแหน่งเซล; ส่งออก spec ให้ coordinator integrate โดยไม่วาดทับ scene เดิม
- ขอบเขตไฟล์/ผลลัพธ์: `motion/scene/occlusion.mjs` และ `motion/scene/fixtures.json` เท่านั้นในส่วนนี้; ห้ามแก้ scene layout ของส่วนอื่น นอกเหนือจากไฟล์ WP-SCENE เป็นเจ้าของ และห้ามแก้ environment/scene modules เดิม
- เจ้าของ: Devin worker package WP-SCENE
- ก่อนหน้า/พึ่งพา: 3.1 และ contract เดิม; ใช้ anchor ids/geometry จาก `scene-layout.json` ของแพ็กเกจเดียวกัน
- เวลา active โดยประมาณ: 1.00–1.25 ชม. คน
- การทำงานขนาน: ต่อจาก 3.1 ในแพ็กเกจเดียวกัน; worker อื่นทำงานของตนต่อไป
- ส่งมอบ: patch/diff, `occlusion.mjs`, `fixtures.json`, contact-shadow/lighting samples, unresolved issues
- เกณฑ์ยอมรับ: helpers pure/deterministic; คืน draw-order, counter occlusion, contact-shadow specs และ lighting zones จากตำแหน่งร่างกาย/เท้า; ไม่วาดทับ environment เดิม; fixtures ครอบคลุม behind-counter, tray/slot proximity และ rear-door watch

### 3.3 Coordinator scene contract review

- เป้าหมาย: ตรวจ `scene-layout.json` + `occlusion.mjs` เทียบ INTERFACE/contract หลัง WP-SCENE settle และเตรียม mapping สำหรับ full integration
- ขอบเขตไฟล์/ผลลัพธ์: review note + integration risk list ใน evidence area ของ coordinator; ไม่แก้ไฟล์ worker
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: WP-SCENE settle; API contract เดิม
- เวลา active โดยประมาณ: 0.25–0.50 ชม. คนหลัง settle
- การทำงานขนาน: ทำหลัง WP-SCENE settle โดยอาจขนานกับ pose/rig reviews
- ส่งมอบ: scene compatibility verdict, รายการ anchor/geometry ที่ต้อง map ตอน integrate
- เกณฑ์ยอมรับ: counter/rear-opening/anchor ids ตรง contract; occlusion ไม่ขัดกับ clip `y=1110`; ไม่มี deviation ที่ไม่ได้บันทึก

## งานที่ 4 — Jessica captions และ latest-small-size evidence

เป้าหมายของงานนี้คือ settle ค่าขนาดซับที่ผู้ใช้อนุมัติล่าสุดโดยไม่แตะ `jessica.srt` และไม่ render จริงก่อนตัดสิน; งานนี้เป็น coordinator-owned evidence/decision lane ที่ทำขนานกับ implementation ได้

### 4.1 Caption-size evidence review

- เป้าหมาย: รวบรวมหลักฐาน “latest small subtitle style” ล่าสุด, เปรียบเทียบ renderer default 22.4 px กับ CAPTION-NOTES baseline 19.2 px ที่ 1080×1920 และ phone-scale 390 px โดยเฉพาะ cue 12 ที่ยาวที่สุด และตัวอย่าง cue 3/5
- ขอบเขตไฟล์/ผลลัพธ์: evidence note/ภาพเปรียบเทียบใน `.agent-runs/snowy-neon-cel-motion/` หรือ evidence area ที่ coordinator กำหนด; ไม่แก้ `index.html`, `jessica.srt` หรือ caption files
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: `ep1-source` inputs พร้อมใน checkout หลัก; อาจเริ่มหลัง contract freeze และทำขนานกับ worker implementation
- เวลา active โดยประมาณ: 0.25–0.50 ชม. คน
- การทำงานขนาน: ขนานกับงานที่ 1–3; ต้องสรุปก่อน final render
- ส่งมอบ: evidence note, ภาพ/ตารางเปรียบเทียบ 19.2 vs 22.4 px, ข้อเสนอค่าที่ควรใช้พร้อมเหตุผล
- เกณฑ์ยอมรับ: พบหลักฐานอนุมัติล่าสุดหรือบันทึกว่าไม่มี; ตรวจ Thai marks, safe band, one-line fit ของทุก cue และ phone-scale readability; ไม่เปลี่ยนข้อความ/เวลา cue

### 4.2 Caption decision record และ renderer default handling

- เป้าหมาย: บันทึกค่าขนาดซับที่อนุมัติจริงหนึ่งค่า หรือบันทึก blocker ชัดเจนถ้ายังไม่มีคำตอบ; ระบุว่าตอน render จะใช้ `?capvw=`/ค่าใดและคง default ปัจจุบันไว้เป็นสถานะชั่วคราวได้หรือไม่
- ขอบเขตไฟล์/ผลลัพธ์: decision note ใน evidence area + รายการ integration requirement สำหรับ coordinator; ไม่แก้ worker files
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: 4.1 และคำตอบ/หลักฐานจากผู้ใช้ถ้ามี
- เวลา active โดยประมาณ: 0.50–1.00 ชม. คน
- การทำงานขนาน: ต่อจาก 4.1; สามารถทำขนานกับ rig/pose/scene settle
- ส่งมอบ: decision record, integration requirement, unresolved blocker ถ้ามี
- เกณฑ์ยอมรับ: มีค่าเดียวที่อนุมัติจริงหรือ blocker ที่ระบุชัด; ไม่ assert ว่า 19.2 และ 22.4 อนุมัติพร้อมกัน; `jessica.srt` ไม่เปลี่ยน

### 4.3 ตรวจซับบนภาพมือถือ

- เป้าหมาย: ตรวจการแสดงผลจริงของซับขนาดที่เลือกบน viewport มือถือ โดยเน้น cue 12 ที่ยาวที่สุด, เครื่องหมายวรรณยุกต์/สระ และตำแหน่ง safe band ด้านล่าง
- ขอบเขตไฟล์/ผลลัพธ์: browser screenshots และ QA note ใน `.agent-runs/snowy-neon-cel-motion-task4/evidence/4.3/` กับ `.agent-runs/snowy-neon-cel-motion-task4/reports/4.3-mobile-caption-check.md`; ไม่แก้ `index.html`, `entry.mjs`, `jessica.srt` หรือไฟล์ caption
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: 4.2 ตัดสินขนาดซับและระบุ `?capvw=` แล้ว
- เวลา active โดยประมาณ: 0.25–0.50 ชม. คน
- การทำงานขนาน: ทำหลัง 4.2; ทำระหว่างการตรวจคลิปทดสอบได้
- ส่งมอบ: ภาพ viewport มือถือ, ระบุขนาด viewport/วิธี render/override, บันทึกการอ่าน cue 12 และ safe-band รวมถึงข้อบกพร่องถ้ามี
- เกณฑ์ยอมรับ: ใช้ browser rendering จริงที่ viewport กว้าง 390 px; cue 12 อยู่บรรทัดเดียวและวรรณยุกต์อ่านได้; ขอบล่างซับอยู่ใน safe band ที่ปรับสเกลจาก 1080×1920; SRT ไม่เปลี่ยน; ถ้า browser rendering ทำไม่ได้ให้บันทึก blocker โดยไม่อ้าง PIL ว่าเป็น browser QA

## งานที่ 5 — QA, motion-test gate และ final Jessica render/acceptance

เป้าหมายของงานนี้คือพิสูจน์ motion ในฉากจริงก่อน full render และส่งมอบ Jessica edition เดียวที่ผ่าน media/visual/audio QA

### 5.1 QA checklist และ harness preparation

- เป้าหมาย: เตรียม checklist เฟรมสำคัญ, contact metrics, verify commands และ test-clip gate ให้พร้อมใช้หลัง integration โดยไม่ render จริง
- ขอบเขตไฟล์/ผลลัพธ์: checklist/harness spec ใน evidence area ของ coordinator; ไม่แก้ worker files หรือ source wiring
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: contract + source timing พร้อม; ทำขนานกับ implementation
- เวลา active โดยประมาณ: 0.50–1.00 ชม. คน
- การทำงานขนาน: ขนานกับงานที่ 1–4; ใช้จริงหลัง integration
- ส่งมอบ: QA checklist, harness spec, รายการ verify commands และ pass/fail criteria
- เกณฑ์ยอมรับ: ครอบคลุม foot plant/no-slide, hand/object contact, gaze, occlusion, contact shadows, lighting, caption size, media specs และ deterministic checks

### 5.2 Full integration และ 8–12 วินาที motion-test gate

- เป้าหมาย: หลัง worker ทั้งห้าและ coordinator reviews settle ให้ integrate pose/rig/scene ทั้งหมดเข้า `entry.mjs`/build path ที่ coordinator เป็นเจ้าของ แล้ว render/inspect คลิปทดสอบ 8–12 วินาทีจากฉากจริงก่อน full render
- ขอบเขตไฟล์/ผลลัพธ์: patch ของ `entry.mjs`, `index.html`, `timeline.mjs`, `build.sh` เฉพาะที่จำเป็น + test clip/evidence ใน coordinator area; ไม่แก้ worker output files
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: WP-LOWER, WP-UPPER, WP-POSE-1-6, WP-POSE-7-12, WP-SCENE settle; 1.3 rig gate, 2.3 pose validation, 3.3 scene review, 4.2 caption decision ผ่านหรือ blocker ชัดเจน; 5.1 checklist พร้อม
- เวลา active โดยประมาณ: 1.75–3.00 ชม. คน + render wall time
- การทำงานขนาน: ทำหลัง worker settlement; caption/QA prep ทำไว้ล่วงหน้าแล้ว
- ส่งมอบ: integrated build path, test clip 8–12 วินาที, QA note, รายการ correction ที่ส่งกลับให้ worker ถ้ามี
- เกณฑ์ยอมรับ: คลิปทดสอบแสดง cue 2 เดินเข้า/หยุด, cue 3 งานเหรียญ/ผ้า และ cue 4 รอเครื่องในฉากจริง; เท้าไม่ไถล, มือ–เหรียญสัมผัสถูก, ไม่มีตัวทะลุเคาน์เตอร์, หน้าเซลตรงแบบอนุมัติ, caption size ตาม 4.2; ห้ามนับ full render ว่าผ่านจาก test clip อย่างเดียว

### 5.3 Full Jessica render และ final acceptance

- เป้าหมาย: เมื่อ test gate ผ่าน, Jessica WAV พร้อม และ caption decision settled ให้ build/render/verify Jessica 60.000 วินาทีฉบับเดียวและทำ visual/media/audio QA ขั้นสุดท้าย
- ขอบเขตไฟล์/ผลลัพธ์: output ใต้ `ep1-source/out/jessica/` หรือ path ที่ build กำหนด + QA JSON/sheets ใน evidence area; coordinator เป็นเจ้าของ integration/render decisions
- เจ้าของ: coordinator
- ก่อนหน้า/พึ่งพา: 5.2 pass; Jessica aligned dry WAV 60.000 วินาทีที่ตรง SRT พร้อม; 4.2 caption decision settled
- เวลา active โดยประมาณ: 1.00–2.00 ชม. คน + render wall time
- การทำงานขนาน: ทำหลัง 5.2 เท่านั้น; ไม่มี worker implementation เหลือถ้าไม่มี correction
- ส่งมอบ: `out/jessica/*.mp4/.srt` ตาม build, QA JSON/sheets, final acceptance note
- เกณฑ์ยอมรับ: 60.000 วินาที, 1080×1920, 30 fps, 1,800 เฟรม; `jessica.srt` byte-for-byte เหมือน source และแสดงครบ 12 cue ตามเวลาเดิม; narration/SRT aligned; visual/audio QA ผ่าน; ไม่มีงานฉบับ original/Niwat

## ตาราง coordinator gates และเวลา

| Gate | งาน | Output | เมื่อเทียบกับงานอื่น | Active person-hours โดยประมาณ | เงื่อนไขผ่าน |
|---|---|---|---|---|---|
| C1 Contract + readiness + provisioning | ยืนยัน source package, WAV/caption blockers, `.gitignore`/worktree inputs และ publish API contract | `motion/API.md`, readiness/provisioning note | ก่อน launch worker | 0.75–1.50 ชม. คน | contract freeze; blockers ชัด; ทุก worktree มี read-only inputs หรือ blocker; ไม่อ้าง worker พร้อม |
| C2 Caption-size evidence | ตัดสิน 19.2 vs 22.4 px จากหลักฐานล่าสุด + render comparison | evidence note ใต้ `.agent-runs/snowy-neon-cel-motion/` | ทำขนาน implementation; ต้องสรุปก่อน final render | 0.50–1.00 ชม. คน | มีค่าที่ผู้ใช้อนุมัติจริงหนึ่งค่า หรือบันทึก blocker; SRT ไม่เปลี่ยน |
| C3 QA checklist/harness prep | เตรียม frame checklist, contact metrics, verify commands และ test-clip gate | checklist/harness spec ใน evidence area | ทำขนาน implementation; ใช้จริงหลัง integrate | 0.50–1.00 ชม. คน | ครอบคลุม foot plant, hand/object contact, occlusion, captions, media specs |
| C4 Rig integration gate | รวม lower/upper rig เข้า coordinator-owned path หลัง WP-LOWER/WP-UPPER settle | rig smoke sample + integration note | หลัง rig workers settle; อาจขนาน pose/scene | 0.50–0.75 ชม. คน | lower/upper compose ตาม contract; ไม่มี circular dependency |
| C5 Full integration + motion test | integrate pose/rig/scene ทั้งหมดและ render/inspect test clip 8–12 วินาที | integrated build path + test clip + QA note | หลัง worker ทั้งห้า settle + C1–C4 พร้อม | 1.75–3.00 ชม. คน + render wall time | test clip ผ่านเกณฑ์ motion/occlusion/caption; แก้เฉพาะ scope ที่ fail |
| C6 Full Jessica render/acceptance | build `jessica` เต็ม 60.000 วินาทีและ verify | `out/jessica/*.mp4/.srt` + QA JSON/sheets | C2, C5 pass, Jessica WAV พร้อม | 1.00–2.00 ชม. คน + render wall time | 60.000s/1080×1920/30fps/1800 frames; narration/SRT aligned; visual/audio QA ผ่าน |

### Motion-test gate ที่เสนอ

- คลิปหลักยาว **12.000 วินาที** ครอบคลุมประมาณ `6.000–18.000` เพื่อเห็น cue 2 เดินเข้า/หยุด, cue 3 งานเหรียญ/ผ้า และ cue 4 รอเครื่องในฉากจริง; เลือก window สุดท้ายให้ลงตัวกับ shot boundaries หลัง integration
- ถ้า integration แสดงความเสี่ยงสูงเฉพาะ coinPlace/watch ให้ coordinator อาจเพิ่ม spot-check 8 วินาทีช่วง `51.800–59.800` ภายใน gate เดียวกันก่อน full render แต่ห้ามนับว่า full render ผ่านจาก test clip อย่างเดียว
- เกณฑ์ที่ต้องดูด้วยตา/เฟรม: เท้าที่รับน้ำหนักอยู่บนพื้น, เท้าสวิงไม่ทะลุพื้น, มือกับเหรียญ/ถาด/ผ้าสัมผัสถูกต้อง, ตัวละครไม่ทะลุเคาน์เตอร์, ลูกค้า/ประตูอ่านตาม shot, หน้าและผมเซลยังเป็นแบบเดิม, caption size ตามค่าที่ C2 สรุป

## การยอมรับขั้นสุดท้ายสำหรับ Jessica edition

- ไฟล์ภาพ `60.000 วินาที, 1080×1920, 30 fps, 1,800 เฟรม`, H.264 + AAC 48 kHz stereo ตาม verifier เดิม; `jessica.srt` byte-for-byte เหมือน source และแสดงครบ 12 cue ตามเวลาเดิม
- เสียงพากย์ Jessica aligned กับภาพ: ใช้ dry WAV 60.000 วินาทีที่ตรง SRT เท่านั้น; `verify-media.py`/equivalent ต้องผ่าน narration correlation ทุก cue และไม่พบลำดับเสียง/ภาพเลื่อน
- Motion ผ่าน motion-test gate ก่อน full render และผ่าน visual QA หลัง full render: ตรวจคู่เฟรมสำคัญ 745–746 (ลูกค้าปรากฏ), ช่วง 1069/1241 (คนหาย/ประตูว่าง), ช่วง 53.55–54.35 (coinPlace) และเฟรม 1799 (เฝ้าประตูว่าง)
- ตรวจเงา การบังเคาน์เตอร์/ประตู ช่องแสงเย็น–อบอุ่น และ contact shadows จากภาพจริง ไม่ใช่จาก JSON อย่างเดียว
- ตรวจไม่มี footsteps, ไม่มี clip ดำผิดปกติ, loudness/peak อยู่ในเกณฑ์ verifier และ SFX beats เดิม (`14.95`, `21.82`, `32.75`, `33.53`, cloth-rustle `40.98` นาน 0.38 วิ จบก่อนประตูว่าง 41.367 — accepted deviation จาก v1 cloth `41.52` ตาม audio revision v2 ที่ผู้ใช้สั่ง, optional `53.95`) ยังลงจังหวะเดิม
- ยืนยัน caption size ที่ render จริงตรงกับค่าที่ C2 สรุป และตรวจ cue ที่ยาวสุดบน phone-scale preview

## ประมาณเวลาและการทำงานขนาน

ตัวเลขทั้งหมดเป็น **ค่าประมาณแบบ active person-hours** ไม่ใช่เวลารอคิว; wall-clock สั้นกว่าผลรวมเพราะห้า worker packages ทำขนานกันหลัง contract freeze

| เฟส | งาน | Active person-hours โดยประมาณ | Wall-clock โดยประมาณ | หมายเหตุ |
|---|---|---:|---:|---|
| 0 | C1 contract/readiness/provisioning + C2/C3 prep เริ่ม | 0.75–1.50 | 0.75–1.50 ชม. | contract + source provisioning ต้องเสร็จก่อน launch; caption/QA prep ทำต่อได้ขนาน |
| 1 | WP-LOWER lower-body rig | 2.50–3.25 | สูงสุด ~3.5 ชม. | ขนานกับ WP-UPPER, WP-POSE-1-6, WP-POSE-7-12, WP-SCENE |
| 1 | WP-UPPER upper-body rig | 3.00–3.75 | สูงสุด ~3.75 ชม. | ขนานกับ WP-LOWER, WP-POSE-1-6, WP-POSE-7-12, WP-SCENE |
| 2 | WP-POSE-1-6 cues 1–6 | 2.50–3.00 | สูงสุด ~3.0 ชม. | ขนานกับ rig/scene/pose-7-12 |
| 2 | WP-POSE-7-12 cues 7–12 | 3.00–3.75 | สูงสุด ~3.75 ชม. | ขนานกับ rig/scene/pose-1-6 |
| 3 | WP-SCENE scene map/occlusion/shadows/lighting | 2.75–3.25 | สูงสุด ~3.25 ชม. | ขนานกับ rig/pose workers |
| 2 | C2 caption evidence + C3 checklist | 0.50–1.00 | ซ้อนในเฟส 1–2 | ต้องสรุปก่อน C6 |
| 3 | C4 rig gate + C5 full integration/test | 2.25–3.75 | ~2.5–4.5 ชม. รวม render/inspect | เริ่มหลัง worker ทั้งห้า settle |
| 4 | C6 full render/verify + แก้รอบแรก | 1.00–2.00 | ~2.0–5.0 ชม. ขึ้นกับเครื่องและ revision | ทำหลัง WAV + caption + test gate พร้อม |

- **ผลรวม active person-hours โดยประมาณ: ~18–23 ชม.** (worker packages ~14–17 ชม. + coordinator gates ~4–6 ชม.)
- **เวลาผ่านไปจริงหลัง source assets พร้อม: ประมาณ 5–9 ชั่วโมง** ถ้า Orca/Devin 5 slots พร้อม, source provisioning สำเร็จ, ไม่มี blocker และ revision หลัง motion test ไม่ใหญ่
- เวลาจริงจะยาวขึ้นถ้า: Jessica WAV ยังไม่ส่งมา, caption decision ยังไม่สรุป, source provisioning ใน child worktree ไม่สำเร็จ, worker หนึ่ง settle ช้ากว่าคนอื่นมาก, motion test พบ pose/foot/occlusion ต้องแก้หลายรอบ หรือเครื่อง render ช้ากว่าที่ประเมิน

## Readiness, blocker และเงื่อนไขหยุด

- **Pre-dispatch blocker:** `/films/` ถูก ignore ใน `.gitignore`; ห้ามสมมติว่า new-child worktree มี local `ep1-source` inputs. Coordinator ต้อง provision ชุด source แบบ read-only เข้าแต่ละ worker worktree หรือยืนยัน allowed workspace strategy และ verify ว่า worker อ่าน `picture/jessica.json`, `captions/jessica.srt`, `CAPTION-NOTES.md`, wiring/verifier และ scene references ที่จำเป็นได้ก่อน launch
- **Blocker สำคัญ:** Jessica aligned dry narration WAV 60.000 วินาทีที่ตรง `jessica.srt` ยังไม่อยู่ใน `ep1-source`; ต้องได้รับไฟล์/path จริงก่อน C6 และก่อน audio-to-motion validation ขั้นสุดท้าย
- **Blocker รอง:** caption size ยังไม่ settle เพราะ 22.4 px (renderer default/comment) ขัดกับ 19.2 px (CAPTION-NOTES accepted v5 baseline); ต้องมีหลักฐานอนุมัติล่าสุดหรือ render comparison ที่ผู้ใช้/coordinator ยอมรับ
- **ข้อจำกัดหลักฐาน:** `.agent-runs/snowy-neon-ep1-devin40/...` และ `narrative-cut/` ไม่อยู่ใน checkout ปัจจุบัน; ถ้าจำเป็นต้องใช้เป็นหลักฐานให้กู้คืนหรือสร้าง evidence ใหม่ ห้ามอ้างว่าไฟล์นั้นมีอยู่
- **Worker readiness:** roster ตั้งต้นรองรับ Devin 5 slots แต่ต้อง recheck Orca host/account ตอน dispatch; ห้ามสมมติว่า workers เริ่มแล้วหรือพร้อมเต็มที่
- **Git:** baseline คือ `main` ที่ `fb485d6`; recheck `git status` ก่อน dispatch เพราะ orchestration/ledger อาจมี local changes ที่ไม่เกี่ยวกับ source package
- หยุดและ escalate ถ้า: contract ยังไม่ freeze, source provisioning ไม่สำเร็จ, worker คืน patch นอก scope, pose JSON ไม่ครอบคลุม cue, scene layout ขัด INTERFACE, motion test ไม่ผ่านหลังแก้ scope เดิมครบ, หรือ WAV/caption decision ยังไม่มีคำตอบก่อน full render

## สิ่งที่ห้ามทำในงานนี้

- ห้ามแก้ `jessica.srt`, `picture/jessica.json` timing, shot cuts หรือ subtitle text เพื่อให้ motion ง่ายขึ้น
- ห้าม build/verify/release ฉบับ `original`/Niwat/free-voice หรือทำ pose/timeline ซ้ำสำหรับฉบับนั้น
- ห้ามให้ worker แก้ `entry.mjs`, `index.html`, `timeline.mjs`, `build.sh`, `verify-*`, `models/`, `characters.mjs`, `main.mjs`, `environment.mjs`, `washers.mjs`, `neon.mjs`, `weather.mjs` หรือไฟล์ของ worker อื่น
- ห้ามใช้ `first-minute/` หรือ `ep1-recut/devin-work` เป็นฐาน; ใช้ `ep1-source` เท่านั้น
- ห้ามปล่อย worker ใน child worktree ที่ไม่มี `ep1-source` inputs แล้วคาดหวังให้อ่านไฟล์ ignored ใต้ `films/` ได้เอง
- ห้าม render เต็มก่อน motion-test gate ผ่าน และห้ามส่งมอบถ้า Jessica WAV หรือ caption decision ยังเป็น blocker
- ห้าม commit secrets, audio WAV ที่ผู้ใช้ไม่ได้อนุญาต, หรือไฟล์ output ขนาดใหญ่เข้า source package

## บทสรุปสำหรับผู้เริ่มงาน

1. Coordinator ยืนยัน readiness, provision read-only `ep1-source` inputs ให้แต่ละ worker worktree, publish `motion/API.md`, และเริ่ม C2/C3 ขนานกับ implementation
2. Dispatch ห้า Devin packages พร้อมกันใน worktree แยก: WP-LOWER, WP-UPPER, WP-POSE-1-6, WP-POSE-7-12, WP-SCENE โดย map เข้า workstreams 1–3 ตามหัวข้อนี้
3. รอ worker ทั้งห้า settle, review patch/diff/evidence/unresolved issues, แล้ว integrate โดย coordinator เท่านั้น
4. Render/inspect คลิปทดสอบ 8–12 วินาทีจากฉากจริง; แก้เฉพาะ scope ที่ fail แล้ววนกลับ gate
5. เมื่อ test ผ่าน, WAV Jessica และ caption size พร้อม จึง build/render/verify Jessica 60.000 วินาทีฉบับเดียว

อ้างอิงหลัก: `films/horror-x-snowy-neon-code/ep1-source/README.md`, `ep1-source/picture/jessica.json`, `ep1-source/captions/jessica.srt`, `ep1-source/captions/CAPTION-NOTES.md`, `ep1-source/index.html`, `ep1-source/entry.mjs`, `ep1-source/timeline.mjs`, `films/horror-x-snowy-neon-code/INTERFACE.md`, `models/registry.mjs`, `models/cel/`, `models/noon/original-actor.js`

*แผนนี้เป็น execution plan เท่านั้น; ไม่ได้เริ่มผลิต ไม่ได้ dispatch worker และไม่ได้รัน render/test ในการเขียนเอกสาร* (หมายเหตุ: เอกสารนี้เขียนเป็นภาษาไทยตามต้นฉบับ และใช้ค่าประมาณที่ต้องยืนยันกับสภาพเครื่องจริงก่อน dispatch)

## สถานะตารางงานหลักล่าสุด — 19 พ.ย. 2026

สัญลักษณ์: ✅ ส่งมอบและตรวจรับตาม deliverable ในแผนแล้ว · ⏳ กำลังทำหรือรอ dependency · ❌ ยังไม่เริ่ม

| รหัส | สถานะ | ความคืบหน้า / เงื่อนไข |
|---|---|---|
| 1.0 | ✅ | API contract และ read-only provisioning หลักฐานอยู่ใน main; ตรวจแล้ว `cel-motion-10` ไม่มี source/commit เฉพาะ และเก็บรายงานต้นฉบับ+ฉบับแก้ไว้ใน `.agent-runs/task_{b99c89b83e04,ad4d91b43e47}/report.md` |
| 1.1 | ✅ | แก้ null semantics ของ `s`, `groundY`, `gaitPhase`, `sinceSeconds` และพิกัด nullable แล้ว; ตรวจ source และคัดลอกโมดูล/fixtures เข้า source tree พร้อมยืนยัน SHA-256 |
| 1.2 | ✅ | โมดูลช่วงบนและ fixtures 10 กรณีตรวจ schema แล้ว และคัดลอกเข้า source tree พร้อมยืนยัน SHA-256 |
| 1.3 | ✅ | Coordinator wiring อยู่ใน `ep1-source/entry.mjs`/`main.mjs`: per-frame evaluator, lower/upper SVG, scene path, per-zone clip, cel limb suppression, contact shadows และ dynamic lighting; clips 12s + cue-4/coin-watch supplements ตรวจแล้ว. Evidence `.agent-runs/snowy-neon-cel-motion-continuation/evidence/motion-integration/QA-UPDATE.md` |
| 2.1 | ✅ | cues 1–6 ผ่าน independent review; follow-up เพิ่ม contact/hold keys เฉพาะช่วงเดินและ hand/gaze transitions; cue-4 half-step y=1310 คงตาม source; handoff frame 856/SRT ไม่เปลี่ยน. รายงาน `.agent-runs/snowy-neon-cel-motion-continuation/reports/` |
| 2.2 | ✅ | cues 7–12 ผ่าน review; coin airborne ที่ depart 53.55, target tray/contact 53.95, placed ที่ settle 54.35; cue-6/7 handoff ทั้ง 9 tracks ตรงกัน. Notes อัปเดตตาม JSON; hand interp key คงตาม resolver semantics |
| 2.3 | ✅ | ตรวจ schema, cue coverage, handoff, coinPlace ownership และท่าจบจาก source; ตรวจภาพจริงต่อใน 5.2; ดู `2.3-pose-merge-acceptance.md` |
| 3.1 | ✅ | `scene-layout.json` freeze CR-01; registry report 21/21 spatial anchors resolved, zero conflicts; non-spatial grip/contact labels documented |
| 3.2 | ✅ | `occlusion.mjs` ปรับ counter body เป็น x628..740, approach band 570..790, rear-door occlusion direction และ lighting composite; fixture 40/0 |
| 4.1 | ✅ | ตรวจหลักฐานขนาด 19.2 px เทียบ 22.4 px และบันทึกข้อแตกต่างแล้ว |
| 4.2 | ✅ | หลักฐานคำตัดสินเดิมของผู้ใช้กำหนด 22.4 px (`capvw=2.0741`); ตรงกับ default ปัจจุบันใน `index.html`, ไม่ต้องแก้ renderer |
| 4.3 | ✅ | ตรวจ renderer จริงที่ `capvw=2.0741`, 390×693 DPR 2; cues 3/5/12 บรรทัดเดียว, font loaded, cue 12 ไม่ล้น; ขอบล่าง y≈1763 อยู่ใน safe band; SRT hash ตรงเดิม. หลักฐาน `.agent-runs/snowy-neon-cel-motion-continuation/evidence/captions-22.4/` |
| 5.1 | ⏳ | SRC-01..25 ผ่าน (SRC-25 ผ่าน independent offline ASR cue-level adjudication; ไม่มี word-level timestamps claim). MT metric gates รวม hand contact ผ่านหลังซ่อม (771 samples, 0 เกิน 4 px, max 3.256 px); MT visual gates 03/05/06/07/08 ยังต้อง map กับ corrected-render pixel evidence. 4 contact-shadow fixture groups ยัง structural-only เพราะไม่มี numeric expectations ใน spec. Evidence `evidence/audio-alignment-independent/src25-adjudication.md`, `evidence/gate-audit/src-mt-status.md`, `postrepair-contact-verification.md`, `contact-shadow-fixtures.md` |
| 5.2 | ⏳ | Integration + motion clips, key stills, resolver/rig/caption checks ผ่าน. Full-cut hand contact ผ่าน 771/771; foot/coin checks ผ่านระดับ evaluator (ไม่ใช่ pixel verification). Visual review พบ FR-04..13/15 pass; FR-14 planted-vs-airborne shadow ยัง uncertain หลัง eyeball review เพราะ floor checker/ขาแยกเงาไม่ได้ชัด. 4 contact-shadow fixture groups structural-only. Evidence `evidence/gate-audit/final-visual-review.md`, `final-visual-coordinator-review.md`, `postrepair-contact-verification.md`, `fullcut-foot-coin-scan.md` |
| 5.3 | ⏳ | Corrected full 60s render: H.264 1080×1920, 30fps, 1,800 frames, AAC stereo 48kHz; decode/black-run และ loudness ผ่าน (−14.6 LUFS/−1.5 dBTP), 24 narration mux samples offset 0 ms, min correlation 0.7441. SRC-25/FR-20 ผ่านที่ cue-level; FR-19 บันทึก rustle v2 @40.98s/0.38s เป็น accepted deviation และมี signal/onset check (ไม่ใช่ user audition); FR-25 determinism ผ่าน. Final acceptance ยังรอ FR-14 shadow distinction. Evidence `evidence/full-render-corrected/jessica-02/`, `evidence/audio-alignment-independent/src25-adjudication.md`, `evidence/gate-audit/fr19-onset-check.md`, `fr25-determinism.md`, `final-visual-review.md` |

### งานที่เหลือ

- **5.1** Map corrected-render FR pixel evidence to visual MT-03/05/06/07/08 criteria; freeze numeric shadow expectations หากต้องการปิด shadow fixture groups. SRC-25/FR-20 ผ่านที่ cue-level; ดู adjudication report สำหรับข้อจำกัดเรื่อง word-level timestamps
- **5.2** แก้หรือรับรอง FR-14 planted-vs-airborne shadow distinction; hand-contact gate ผ่านแล้วจาก full-cut regression. 4 shadow fixture groups ยังไม่มี numeric contract expectations
- **5.3** ปิด FR-14 ก่อน final acceptance; FR-04..13/15 pixel gates, SRC-25/FR-20, FR-19 accepted deviation/signal evidence และ FR-25 determinism บันทึกแล้ว
หลักฐานสถานะ: `.agent-runs/snowy-neon-cel-motion-task1/evidence/source-provisioning-1-1-1-2.md`, รายงานตรวจ/แก้ไข 2.1–2.3 ใน `.agent-runs/snowy-neon-cel-motion-task1/reports/`, merged cue map ที่ `.agent-runs/snowy-neon-cel-motion-2-3-merge-review/MERGED-CUE-MAP.md`, รายงาน 4.1–4.3 ใน `.agent-runs/snowy-neon-cel-motion-task4/reports/`, 5.1 checklist/gates และ ledger/worker report ของ 3.1–3.2.

### ข้อกำหนดเวลาสำหรับ render ล่าสุด

ผู้ใช้แจ้งเมื่อ 19 พ.ย. ว่าขอเริ่ม full render ได้ทันที; coordinator สร้าง corrected full render หลังซ่อม hand contacts ที่ `evidence/full-render-corrected/jessica-02/`. สถานะล่าสุดและหลักฐานแต่ละ gate อยู่ใน build `REPORT.md` และ `evidence/gate-audit/`; final acceptance ยังรอ FR-14 shadow distinction.
