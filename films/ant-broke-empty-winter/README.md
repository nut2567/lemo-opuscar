# มด → หมด · Empty Winter

- `mot-empty-winter.mp4` คือวิดีโอแนวตั้งพร้อมเสียงเล่า ดนตรี เอฟเฟกต์ และซับฝัง
- `captions.srt` คือซับไทยแยกไฟล์
- `timeline.json` คือเวลาเริ่มและจบของช็อตและวลีตามเสียงจริง
- `story.json` มาจากตอน `ant-broke` ใน Ai-Video
- นี่คือเวอร์ชัน Three.js 3D ตัวเก่ากว่า เวอร์ชัน 2D ใหม่กว่าชื่อ `ant-broke-empty-winter-2d`
- `assets/speech/` คือไฟล์เสียงเล่าที่บันทึกไว้ทีละบรรทัด ทำให้ `audio.py` รันออฟไลน์ได้แบบ deterministic ลบไฟล์บรรทัดไหนออก edge-tts จะสังเคราะห์บรรทัดนั้นใหม่ (ต้องออนไลน์)
- `mot-empty-winter.mp4` คือไฟล์เรนเดอร์ที่อนุมัติแล้ว เก็บไว้ในเครื่องเท่านั้น ไม่ได้ commit เข้า repository

ภาพสร้างด้วย Three.js โดยใช้ฉาก โมเดล วัสดุ และแอนิเมชันใน `stage.mjs` เสียงเล่าใช้บริการฟรี edge-tts เสียง `th-TH-NiwatNeural` ส่วนบรรยากาศ เอฟเฟกต์ และดนตรีสังเคราะห์โดย `audio.py` แบบอักษร Kanit ใช้ภายใต้สัญญาอนุญาตใน `OFL-Kanit.txt`

## เรนเดอร์จากซอร์ส

รันจากราก lemo-opuscar ใช้ Python ที่มี NumPy และ edge-tts, Node.js ที่ติดตั้งแพ็กเกจของโครงการแล้ว, Chrome และ FFmpeg ที่มี libass

```powershell
python films/ant-broke-empty-winter/audio.py
node films/ant-broke-empty-winter/render.mjs --qa
node films/ant-broke-empty-winter/render.mjs
```

ถ้ามี `work/mix.wav` และ `timeline.json` อยู่แล้ว สามารถเรนเดอร์ภาพและประกอบเสียงได้จากคำสั่งสุดท้าย
