# Delivery and rebuild notes

The tracked deliverable is the drawing code and build method. `README.md` contains the commands and dependencies; outputs are generated locally in this folder. The current source uses the original Nun SVG rig and the dimensional cloth. The previous local MP4 predates this original-Nun revision and is retained only as an archived review version.

The isolated character sheet has a separate portable SVG/WASM build at `examples/reproducible-character-proof/`, with checked-in expected SVG/PNG and hash verification. No full-film cross-platform byte-identity claim is made.

The Neon build runs browser QA, creates seeded procedural audio, renders the scene, muxes audio at a target -18 LUFS, then verifies full decode, 1080x1920 dimensions, 30fps, 225 frames, audio and 7.5-second duration. Exact final audio measurements are written by the build under `qa/`; do not treat an older report as verification of a new render.

All picture assets are procedural Canvas/SVG geometry. The reference screenshots used during design are not render inputs and are not needed to rebuild. No generation API, voice model or paid provider is called.