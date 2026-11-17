# Laundry — cel woman frame variant

An independent copy of latest horror-x-snowy-neon-code including its uncommitted depth and cloth revisions. The parent and original 60-second episode are preserved.

This variant replaces the woman behind the counter with a code-drawn adult female character using the facial construction, coloured ink and two-tone cel techniques of 80s Cel Anime / City Lights, 1987. It retains the laundry location, apron, cloth-covered figure, neon, snow, washers and camera. No generated images. Character: SVG geometry in assets/cel-woman.js. Environment: Canvas2D. This is a 2D character, not an exported 3D mesh.

Render the requested one frame from the repository root:

    node films/horror-x-snowy-neon-cel-woman/render-frame.mjs

Set PLAYWRIGHT_CHROME to an existing compatible browser if Chromium is not located automatically. No audio, TTS or video build is needed.

Outputs:
- out/laundry-cel-woman-frame.png: full 1080x1920 composition at t=3.7s.
- out/laundry-cel-woman-detail.png: detail of the same frame.
- out/frame-report.json: dimensions, deterministic replay, resource and SVG id checks.

main.mjs composes the character twice with separate ids for the visible figure and wet-street reflection, using existing camera and counter occlusion. TREATMENT-CEL-WOMAN.md describes this variant; inherited TREATMENT.md describes the scene only. Inherited character-proof files display the previous rig and are historical source, not this deliverable. build.mjs is the inherited full-video build; this assignment requests one frame only.

Evidence: ../../.agent-runs/laundry-cel-woman/.
