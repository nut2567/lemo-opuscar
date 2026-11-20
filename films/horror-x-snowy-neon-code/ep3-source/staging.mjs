// staging.mjs — Noon blocking for the EP3 storefront shots, built on EP1's
// staging (../ep1-source/noon/staging.mjs, read-only): the same counter mark
// (640, 925, scale .5), walk-in path and rig poses.
//   run-back      EP1 walk-in (rear threshold -> counter), then 'listen'
//   counter shots 'listen' at the counter; in the time-lapse and after the
//                 voice behind her the rig clock is frozen, so she holds still
//   turn          'turn' (head to the rear doorway) from the cut on
import { noonStage } from '../ep1-source/noon/staging.mjs';
import { BEATS } from './timing.mjs';

// From the counter-sit cut on she stands MARK_DX right of the EP1 counter mark,
// so the front mullion (world x~603) never crosses her face in the close shots.
export const MARK_DX = 45;
const shift = (s, dx = MARK_DX) => ({
  ...s, x: s.x + dx,
  feet: (s.feet ?? []).map(f => ({ ...f, x: f.x + dx })),
  lightAnchor: s.lightAnchor ? [s.lightAnchor[0] + dx, s.lightAnchor[1]] : s.lightAnchor,
});
const listen = (t) => shift({ ...noonStage({ shotId: 'rear-exit', local: 0, seconds: t }), pose: 'listen' });

export function ep3Stage({ shotId, local = 0, seconds = 0 } = {}) {
  const l = Number.isFinite(local) ? Math.max(0, local) : 0;
  const t = Number.isFinite(seconds) ? seconds : 0;
  switch (shotId) {
    case 'run-back': {
      const s = noonStage({ shotId: 'walk-in', local: l, seconds: t });
      return s.pose === 'count' ? { ...s, pose: 'listen' } : s;
    }
    case 'time-lapse': return listen(19.9);                       // frozen: sat still all night
    case 'voice-behind': return listen(Math.min(t, BEATS.behind)); // freezes at the voice
    case 'turn': return shift({ ...noonStage({ shotId: 'watch', local: l, seconds: t }), pose: 'turn' });
    default: return listen(t);
  }
}
