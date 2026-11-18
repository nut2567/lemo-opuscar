// Timing contract for the 60-second first-minute review cut.
// One 1080x1920 @ 30fps film: 1800 frames, ten shots on half-open
// [start, end) frame boundaries. Frame 1800 is the end sentinel and is
// never a drawable frame; every accessor clamps into [0, TOTAL_FRAMES - 1].

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 1800;
export const DURATION_SECONDS = TOTAL_FRAMES / FPS; // 60

// Approved cut boundaries (frames): [0,150,300,450,630,810,990,1170,1380,1590,1800]
// Durations: 5,5,5,6,6,6,6,7,7,7 seconds — matches out/first-minute-review-20261118.
const BOUNDARIES = [0, 150, 300, 450, 630, 810, 990, 1170, 1380, 1590, 1800];

const SLUGS = [
  "storefront",          // 01 — shopfront in the snow
  "thai-neon",           // 02 — Thai laundry neon sign
  "wet-reflection",      // 03 — neon on the wet street
  "window",              // 04 — push toward the shop window
  "washer-row",          // 05 — row of four washers
  "cel-and-coins",       // 06 — cel beside the coin tray
  "through-glass",       // 07 — view through glass to the back door
  "cloth-in-doorway",    // 08 — cel and customer under the cloth
  "cloth-recedes",       // 09 — white cloth slips through the back door
  "closing-wide",        // 10 — wide storefront after the cloth is gone
];

export const SHOT_SPANS = BOUNDARIES.slice(0, -1).map((start, i) => ({
  id: String(i + 1).padStart(2, "0"),
  slug: SLUGS[i],
  start,
  end: BOUNDARIES[i + 1],
}));

const clampFrame = (frame) => {
  if (!Number.isFinite(frame)) return 0;
  return Math.min(Math.max(Math.trunc(frame), 0), TOTAL_FRAMES - 1);
};

const clampSeconds = (seconds) => {
  if (!Number.isFinite(seconds)) return 0;
  return Math.min(Math.max(seconds, 0), DURATION_SECONDS - 1 / FPS);
};

const FRAME_INDEX_SNAP_ULPS = 8;

const snapToFrameIndex = (value) => {
  const nearest = Math.round(value);
  const tolerance =
    Number.EPSILON * Math.max(1, Math.abs(value)) * FRAME_INDEX_SNAP_ULPS;
  return Math.abs(value - nearest) <= tolerance ? nearest : value;
};

// Seconds -> frame index (0..1799). Half-open: a time exactly on a cut
// boundary belongs to the incoming shot. Clamped to the film's range.
export function frameAt(seconds) {
  return clampFrame(Math.floor(snapToFrameIndex(clampSeconds(seconds) * FPS)));
}

// Frame index -> owning shot record. Half-open [start, end): the boundary
// frame belongs to the next shot. Clamped; TOTAL_FRAMES maps to the last shot.
export function shotAtFrame(frame) {
  const f = Number.isFinite(frame)
    ? Math.min(Math.max(Math.trunc(frame), 0), TOTAL_FRAMES)
    : 0;
  for (const shot of SHOT_SPANS) {
    if (f >= shot.start && f < shot.end) return shot;
  }
  return SHOT_SPANS[SHOT_SPANS.length - 1];
}

// Seconds -> owning shot record (via frameAt so boundaries stay consistent).
export function shotAtSeconds(seconds) {
  return shotAtFrame(frameAt(seconds));
}

export { BOUNDARIES };
