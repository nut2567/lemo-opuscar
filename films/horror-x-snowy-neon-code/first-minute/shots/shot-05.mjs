// Shot 05 — เครื่องซักสี่เครื่อง (row of four washers), frames [630,810), 6 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 4.2 (manifest.json slug "washer-row", camera:
// {cx:326, cy:1118, z:2.36, skew:0.009}). That tight interior framing keeps
// all four enlarged commercial fronts, their side/top planes, toe kicks and
// contact shade inside the left bay while the rear doorway stays at frame
// right. The later approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png, t=3.7) is the
// source of truth for the washer scale and motivated interior light; the
// environment rasterizes that row once, so this program keeps the approved
// geometry and lighting while sampling only the proof's animated beats.
//
// This shot holds the approved camera as its base and adds a small eased
// drift — a gentle push (z 2.36 -> 2.38), a few px of cx/cy slide and a
// slight skew settle — so the row keeps breathing without letting the outer
// cabinets or their floor contact shadows leave frame. sourceSeconds stays
// inside legacy shot 1 (2.5-5.0), monotonic, below 7.5, and well before the
// cloth drift at t>=6, so visible cloth motion is never sampled backward.
// Fades and the cuts at frames 630/810 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-1 source window centered on the approved 4.2 s still and ending
// before the 5.0 s legacy cut, so the scene never crosses into shot 2.
const SOURCE_START = 3.9;
const SOURCE_END = 4.5;

// Approved camera at legacy t=4.2 (manifest.json). Drift deltas are small and
// eased so the washer row stays composed.
const CAM = { cx: 326, cy: 1118, z: 2.36, skew: 0.009 };

export const shot = {
  id: '05',
  start: 630,
  end: 810,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx + 2 * u,
        cy: CAM.cy + 2 * u,
        z: CAM.z + 0.02 * u,
        skew: CAM.skew - 0.002 * u,
      },
    };
  },
};
