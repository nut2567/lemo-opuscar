// Shot 09 — ผ้าขาวไร้หน้าลับเข้าประตูหลัง (the faceless white cloth slips
// behind the rear door jamb), frames [1380,1590), 7 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 6.667 (manifest.json slug "cloth-recedes", camera:
// {cx:470, cy:983, z:3.25, skew:0.004}). That tighter interior framing holds
// the rear doorway opening (world x471..594 y776..1184) and the white cloth
// edge inside the original jamb clip, with the orange EXIT tube still
// readable above; the later approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png) remains the
// source of truth for Cel geometry, counter scale and motivated interior
// light. This program holds the approved camera as its base and adds only a
// small eased drift — a gentle push (z 3.25 -> 3.28), a few px of cx/cy slide
// toward the jamb side the cloth exits through and a barely-there skew
// settle — so the retreat keeps breathing without letting the jamb, the
// doorway clip edge or the EXIT sign leave frame.
//
// sourceSeconds stays inside legacy shot 2 (5.0-7.5), monotonic, below 7.5.
// The window opens exactly where shot 08 ended (6.55 s, ~40 px of the 118 px
// lateral exit done) and runs to 7.0 s (~105 px done), so the white edge
// visibly crosses the right jamb inside the clip and the motion is never
// sampled backward across either boundary; the last stretch of the exit and
// the doorway-spill fade belong to shot 10's forward window. Cel's eyes stay
// open. Fades and the cuts at frames 1380/1590 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-2 source window covering the cloth retreat: starts at shot
// 08's end (6.55 s) and ends at 7.0 s, leaving the final exit and spill fade
// to shot 10 so visible cloth motion always moves forward.
const SOURCE_START = 6.55;
const SOURCE_END = 7.0;

// Approved camera at legacy t=6.667 (manifest.json). Drift deltas are small
// and eased so the jamb, doorway clip and EXIT sign keep their approved
// margins.
const CAM = { cx: 470, cy: 983, z: 3.25, skew: 0.004 };

export const shot = {
  id: '09',
  start: 1380,
  end: 1590,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx + 5 * u,
        cy: CAM.cy - 2 * u,
        z: CAM.z + 0.03 * u,
        skew: CAM.skew + 0.002 * u,
      },
    };
  },
};
