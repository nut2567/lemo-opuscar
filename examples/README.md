# Laundry builds

These projects coexist on `main`. Run each command from the repository root; each writes into its own project directory. No drawing code needs to be regenerated and no branch switch is required.

| Output | Source | Command |
| --- | --- | --- |
| Original 60-second episode | `films/horror-x-ep1-part1-60s/` | `powershell -File films/horror-x-ep1-part1-60s/build.ps1` |
| Neon highlight, original Nun and updated cloth | `films/horror-x-snowy-neon-code/` | `node films/horror-x-snowy-neon-code/build.mjs` |
| Portable isolated character sheet | `examples/reproducible-character-proof/` | `npm --prefix examples/reproducible-character-proof ci`, then `npm --prefix examples/reproducible-character-proof run render` |

The film builds use the repository's Chromium renderer, Python and FFmpeg; follow [TECHNIQUE.md](../TECHNIQUE.md) for setup. The original episode's PowerShell build includes its own preflight checks. Its existing source and build have been preserved. Windows is the supported deployment target and CI verifies the portable sheet on Windows.

For a fresh machine, the isolated sheet is the self-contained example: Node 24 and its own lockfile are sufficient. [Its README](reproducible-character-proof/README.md) explains verification against the committed SVG/PNG baseline. Byte-for-byte reproducibility applies to this pinned sheet; browser-rendered movies may differ in antialiasing or encoding between environments.

ทั้งตอนหลักและฉาก Neon เก็บโค้ดแยกกัน รันได้จาก `main` โดยไม่ต้องวาดใหม่ และเขียนผลลัพธ์คนละโฟลเดอร์ ส่วนภาพตัวละครแบบแยกฉากมีชุดทดสอบเปรียบเทียบ SHA-256 สำหรับตรวจผลบนเครื่องอื่น
