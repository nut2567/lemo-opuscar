// Shot 10 — หน้าร้านเมื่อช่องประตูว่าง (storefront wide once the rear doorway
// is empty), frames [1590,1800), 7 s — the closing shot of the minute.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 7.433 (manifest.json slug "closing-wide", camera:
// {cx:578, cy:1040, z:1.04, skew:-0.016}), recentered to cx540 cy1036 z1.105
// skew-0.012 so every viewport corner stays inside the world artboard (the
// approved drift sampled world x up to 1128.13 and y up to 1967.23, leaving
// flat unlit strips at frame right and bottom). That near-legacy-wide framing
// returns to the shopfront facade with the rear doorway empty, the cool spill
// across it gone and snow still drifting past the glass; the later approved
// washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png) remains the
// source of truth for Cel geometry, washer scale and motivated interior
// light. This program holds the approved wide balance as its base and adds
// only a small eased settle — a few px of cx/cy drift, a barely-there zoom
// relax and a skew nudge toward level — so the wide keeps the storefront,
// neon, empty doorway and wet-street reflection in frame without letting any
// edge of the world artboard show.
//
// sourceSeconds stays inside legacy shot 2 (5.0-7.5), monotonic, below 7.5.
// The window opens exactly where shot 09 ended (7.0 s) and runs to 7.45 s,
// carrying the cloth drift's last stretch to its ~7.25 s completion and the
// doorway spill fade (visible = 1 - sstep((t-7.0)/0.3), gone by ~7.3 s) so the
// doorway reads empty well before the approved 7.433 s framing; visible cloth
// and spill motion is never sampled backward across the boundary. Snow keeps
// moving because elapsedSeconds is continuous world time, independent of
// this window. Fades and the cut at frame 1590 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-2 source window covering the exit tail and spill fade: starts
// at shot 09's end (7.0 s) and ends at 7.45 s, below the 7.5 s proof limit,
// so cloth and spill motion only ever move forward.
const SOURCE_START = 7.0;
const SOURCE_END = 7.45;

// Recentered closing camera near the approved wide (manifest.json), pulled
// left/up and zoomed out just enough that all four inverse viewport corners
// land inside the 1080x1920 world canvas. Drift deltas are small and eased so
// the storefront wide keeps its balance with small margins on every edge.
const CAM = { cx: 540, cy: 1036, z: 1.105, skew: -0.012 };

export const shot = {
  id: '10',
  start: 1590,
  end: 1800,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx + 2 * u,
        cy: CAM.cy - 2 * u,
        z: CAM.z - 0.004 * u,
        skew: CAM.skew + 0.004 * u,
      },
    };
  },
};
