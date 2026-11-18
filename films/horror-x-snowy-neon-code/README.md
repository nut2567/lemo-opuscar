# Snowy Neon Night - code-only highlight

This project retains the alternate laundromat construction alongside the original episode on `main`. It does not modify the original episode. Every visible asset is drawn in code; no reference image, generated raster, external photograph or online service is used at render time.

Signage revision: the four neon signs are Thai text — ร้านซักผ้า (shop name), 24 ชม. (hours), เปิดบริการ (open) and ทางออก (exit) — drawn as real shaped canvas text in the bundled Kanit face (`assets/fonts/Kanit-Regular.ttf`, SIL OFL; `assets/fonts/OFL.txt`). `neon.mjs` exports `initNeon()`, which `main.mjs` awaits before the first render and `window.READY`; each line is measured with `actualBoundingBox*` metrics so Thai marks above and below the baseline stay inside their sign areas. The composed check frame is `out/neon-composed-thai-v3.png` (t=3.7); earlier `out/` PNGs are kept.

The woman is rendered by the shared registry (`../../models/registry.mjs`). The primary model is `cel` (เซล), the user-approved pale/slim 80s-cel laundry woman. Its five source modules and character study are in `models/cel/` inside this film, with byte-identical geometry in the shared registry. The scene composites the woman as inline SVG under the Canvas camera, with warm counter light and cool window spill applied to her silhouette. Select the previous model, `noon` (โมเดลนุ่น), with `?model=noon` in the page URL. Both models share the head-center anchor (690,925), scale 0.5 and uid namespacing. The cloth figure keeps a covered human silhouette with shaded side planes and folds. The shop has four commercial front-load machines (`washers.mjs`), with the nearest cabinet scaled to nearly the height of Cel's visible figure. The wet street reflects the exterior facade, sign tubes, and broad window light. Ripple and paving joints break up the reflection.

Reuse the registry from another film or tool:

```js
import { renderCharacter, DEFAULT_MODEL, getCharacterModel } from '../../models/registry.mjs';
renderCharacter(t, { model: 'cel', x: 690, y: 925, scale: 0.5, uid: 'snowy' }); // 'noon' selects โมเดลนุ่น
```

From the repository root:

```sh
npm ci
node films/horror-x-snowy-neon-code/build.mjs
```

Requires Chromium configured for `core/render/page.mjs`, Python 3 and FFmpeg/ffprobe on PATH. See `TECHNIQUE.md` and `core/README.md` for repository setup. The build synthesizes its own sound locally, renders 1080x1920 at 30fps for 7.5 seconds, and checks the muxed file. Outputs stay in this folder: `poster.png`, `snowy-neon-highlight.mp4`, `out/` and `qa/`; they are regenerated rather than committed. The original 60-second build writes to its own separate folder.

For a fresh-machine check with a locked rasterizer, see [the portable character proof](../../examples/reproducible-character-proof/README.md). It reproduces the isolated character sheet with SVG and resvg WASM. Its SHA-256 contract applies to that sheet; Chromium movie encoding and antialiasing can vary between machines.

`character-proof.html` is the earlier browser-based isolated comparison of the โมเดลนุ่น (`noon`) Nun rig — a historical sheet for that model. The current primary model เซล (`cel`) has its own person-only preview via `model-preview.html` and `render-model-preview.mjs` (`node films/horror-x-snowy-neon-code/render-model-preview.mjs [--model cel|noon]`); `poster.png` is the current main-film poster. `TREATMENT.md` records the scene brief and story boundary; `INTERFACE.md` records drawing coordinates; `CREDITS` records provenance. Locally archived proof images, earlier clips and worker evidence are review records, not runtime dependencies.
