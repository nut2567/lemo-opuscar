# Reproducible Character Proof

Branch: `feature/reproducible-character-proof`

Standalone code-only proof of the isolated original Nun + dimensional cloth construction. It is not the full laundry film, and it is not a byte-copy of the earlier browser screenshot.

## Quick start / เริ่มใช้งานด่วน

### English

Requires Node 24 (`.nvmrc` and `.node-version` pin `24.22.3`; `package.json` allows Node `>=24 <25`) and npm.

```sh
cd examples/reproducible-character-proof
npm ci
npm run render
npm run verify
```

`npm run render` writes `out/character-proof.svg`, `out/character-proof.png` and `out/metadata.json` at `t=3.7`. An optional frame can be rendered with `npm run render -- --time 0.9 --out ./tmp-proof`; `--out` is resolved from the current directory. `npm run verify` is read-only and compares fresh renders against the checked-in `expected/` baseline; it does not update that baseline.

### ไทย

ต้องใช้ Node 24 (`.nvmrc` และ `.node-version` ระบุ `24.22.3`; `package.json` อนุญาต Node `>=24 <25`) และ npm

```sh
cd examples/reproducible-character-proof
npm ci
npm run render
npm run verify
```

`npm run render` สร้าง `out/character-proof.svg`, `out/character-proof.png` และ `out/metadata.json` ที่ `t=3.7` ส่วน `npm run verify` ตรวจผลเรนเดอร์ใหม่กับ golden baseline ใน `expected/` แบบอ่านอย่างเดียว ไม่เขียนทับ baseline

## What is reproduced

- `assets/original-actor.js` is a byte-identical copy of the original Nun actor rig from `films/horror-x-ep1-part1-60s/actor.js`; `scene.mjs` imports `nun` directly and keeps the actor local.
- `cloth.mjs` exports `clothMarkup(t)` and ports the Canvas cloth silhouette, gradient stops, fold/shade planes, rim strokes, sway/rock motion and ground shadow into an SVG inner fragment. It has no DOM, browser, Canvas, network or filesystem dependency.
- `scene.mjs` composes the complete deterministic 1600×1000 SVG. Labels are path-based strokes; the scene uses no `<text>`, fonts, images, `foreignObject`, external links, clock or unseeded random values.
- `scripts/render-lib.mjs` initializes the pinned `@resvg/resvg-wasm@2.6.2` WASM engine once and rasterizes with system fonts disabled. `scripts/render.mjs` is the CLI; `scripts/verify.mjs` performs the baseline checks.

## Reproducibility contract

The checked-in `expected/manifest.json`, `expected/character-proof.svg` and `expected/character-proof.png` are the golden baseline. Verification checks SHA-256 values for the SVG and PNG, the raw actor hash, canonical source hashes, PNG dimensions and forbidden external references. Only the same pinned inputs and defaults are guaranteed byte-identical: Node 24, `npm ci` with the checked-in lockfile, `@resvg/resvg-wasm@2.6.2`, default `t=3.7` and 1600×1000 output.

The canonical rasterizer is the WASM resvg engine, not the earlier browser Canvas screenshot path. Antialiasing can differ slightly at edges, so do not expect this PNG to be byte-identical to the previous browser PNG; use this folder's golden SHA values instead.

Cross-OS reproducibility is planned to be guarded by future Linux/Windows/macOS CI. This README does not claim that those runs have already happened.

No AI or image generation, provider calls, downloads, browser, system fonts, source photos or existing PNGs are runtime inputs. Every visible asset is generated from code in this folder.
