# Plan: Three.js 9:16 lighting & shadow setup — Empty Winter ant pantry

## Source context
Read `films/ant-broke-empty-winter/TREATMENT.md` (28 lines). Structure 2 chosen: cross-section of an underground ant storage room, wooden shelves, soil layers, walls and boxes with real depth. Warm daylight plus a small blue screen light in winter; touching shadows, dust-reflecting shadows, cinematic depth of field; ant + props readable on vertical 9:16 screen. Film is 120–145 s at 30 fps, Thai language. No implementation done — read-only plan.

## Lighting setup (physically plausible, fast)

Rig: 4 lights, no real-time GI, no reflections pass.
1. HemisphereLight — sky/ground fill (cheap, plausible sky-dome gradient).
   - skyColor: 0xffffff, groundColor: 0x4a3a2e (warm soil), intensity: 0.35–0.6
2. DirectionalLight — warm daylight through the "window"/opening (key light).
   - intensity: 0.6–1.2, color: 0xffd59b–0xffcc80 (warm amber), position high + side
   - castShadow: true, shadow.mapSize: 1024–2048, shadow.bias: -0.0005 to -0.001, shadow.normalBias: 0.02–0.05, shadow.camera near/far wrapped tight around scene frustum
3. PointLight — phone/screen glow in winter night shots.
   - intensity: 2–8, color: 0x0088ff–0x44aaff, distance: 15–30, decay: 2, position at phone surface
4. AmbientLight — minimal base fill only (avoid flat look).
   - intensity: 0.1–0.2, color: 0xffffff

Renderer: shadowMap.type = PCFSoftShadowMap; physically correct toneMapping (ACESFilmicToneMapping) optional; antialiasing on.

9:16 camera: PerspectiveCamera with aspect 9/16 (0.5625), FOV 40–55, positioned so ant and props stay legible in portrait frame; DOF via post-processing or bokeh pass if used, keep focal plane on the ant/box.

Shadow notes: contact softness from PCFSoftShadowMap + tight shadow camera; bias ranges prevent shadow acne and peter-panning (floating shadows). Dust shafts: fake with a cheap volumetric cone or faint additive sprite near screen light, not a real volume pass (keeps it fast).

## Three visual QA checks
1. Contact-shadow integrity: no shadow acne (self-shadow speckles) on shelves/boxes and no peter-panning (shadows detached from casters) across the bias range; shadows touch geometry at contact edges.
2. Temperature read: warm key light vs blue screen light remain distinguishable on white/neutral surfaces; ant and props keep readable local color, no color cast crushing skin/wood tones.
3. Portrait legibility: at 9/16 aspect, ant + phone + box edges stay in focus and readable within the central vertical band; DOF does not blur key story props; crushed blacks absent in soil areas under fill light.

## Limits / open decisions
- Exact shadow frustum and DOF implementation depend on the scene scale (units) which is not fixed in TREATMENT.md; implementation agent must fit shadow.camera to the actual scene bounds.
- Dust/volumetric shafts are faked cheaply; real volumetric lighting is out of scope for "fast".
- Tone mapping and post-processing (DOF) are recommendations, not verified against a running renderer.
- No code written, no renderer tested; parameter ranges are starting points to tune against the actual scene.