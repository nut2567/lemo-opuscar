# Snowy Neon Night - code-only highlight

This project retains the alternate laundromat construction alongside the original episode on `main`. It does not modify the original episode. Every visible asset is drawn in code; no reference image, generated raster, external photograph or online service is used at render time.

Current character revision: Nun is the original episode SVG rig, copied unchanged into `assets/original-actor.js` and overlaid using the same camera as the Canvas scene. The new cloth keeps a covered human silhouette with shaded side planes and folds. This revision was first reviewed as an isolated two-character still. The earlier local MP4 used the previous character revision; run the build to create a current clip.

From the repository root:

```sh
npm ci
node films/horror-x-snowy-neon-code/build.mjs
```

Requires Chromium configured for `core/render/page.mjs`, Python 3 and FFmpeg/ffprobe on PATH. See `TECHNIQUE.md` and `core/README.md` for repository setup. The build synthesizes its own sound locally, renders 1080x1920 at 30fps for 7.5 seconds, and checks the muxed file. Outputs stay in this folder: `poster.png`, `snowy-neon-highlight.mp4`, `out/` and `qa/`; they are regenerated rather than committed. The original 60-second build writes to its own separate folder.

For a fresh-machine check with a locked rasterizer, see [the portable character proof](../../examples/reproducible-character-proof/README.md). It reproduces the isolated character sheet with SVG and resvg WASM. Its SHA-256 contract applies to that sheet; Chromium movie encoding and antialiasing can vary between machines.

`character-proof.html` is the earlier browser-based isolated comparison. `TREATMENT.md` records the scene brief and story boundary; `INTERFACE.md` records drawing coordinates; `CREDITS` records provenance. Locally archived proof images, earlier clips and worker evidence are review records, not runtime dependencies.