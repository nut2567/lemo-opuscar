rules-version: 2

# Spec 01 — Split the front glazing into its own top layer (z 100)

Read first: `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md` (binding), `films/horror-x-snowy-neon-code/environment.mjs`,
`films/horror-x-snowy-neon-code/main.mjs` (how drawEnvironment / drawFacadeForReflection are used).

The route is already selected; do not ask which agent to use and do not delegate.

## Target

The person (Noon) is drawn as an SVG layer above the world canvas. The user requires the front door / shop-window frame to stay
on top of her (z-index 100) so she reads as being inside the shop. Today `environment.mjs` bakes the glazing (reveals, mullions,
entrance door frame, push bar/hinges, glass sheen, kickplate — `drawGlazing`, `drawKickplate` and related front-plane drawing)
into the single cached environment canvas.

## Change (you own exactly one file: `films/horror-x-snowy-neon-code/environment.mjs`)

1. Cache the front-plane elements separately. Export `drawFrontGlazing(ctx, t)` that paints ONLY the elements that physically lie
   in the facade/glazing plane in front of the interior: shop-window frame and deep reveals, centre/side mullions, the slim pier
   between window and entrance, entrance door frame + mullions + push bar + hinge hints, glass sheen streaks, kickplate, pier window
   frame. Transparent everywhere else (it is drawn on a transparent canvas above the person).
2. `drawEnvironment(ctx, t, shot, opts = {})`: add `opts.glazing` (default `true` = today's exact output). With `{ glazing:false }`
   the result omits exactly what `drawFrontGlazing` paints (the interior shows through where the frame was; fill that interior
   area sensibly, e.g. the interior continues behind the mullion — no holes / no black seams).
3. `drawFacadeForReflection(ctx)` output must stay visually identical (it is the wet-street reflection source; keep glazing in it).
4. Export the rectangles `SHOP`, `ENTRY`, `FAC` as frozen objects, and `FRONT_GLAZING_Z = 100`.
5. Keep determinism and existing interior light breathing. No other files may change.

## Verification (required evidence)

- `node --check films/horror-x-snowy-neon-code/environment.mjs`.
- A browser pixel check (write your scratch script + page under `.agent-runs/snowy-neon-noon-revision/evidence/01/`; you may use
  `core/render/page.mjs` `openDemo` like `films/horror-x-snowy-neon-code/render-frame.mjs` does, or plain Playwright already
  installed in the repo's node_modules). Compare for t = 0 and t = 3.7:
  A = `drawEnvironment(ctx,t,0)` versus B = `drawEnvironment(ctx,t,0,{glazing:false})` then `drawFrontGlazing(ctx,t)` on top.
  Report mean absolute difference and max difference per channel; target mean < 1.0 (0–255) and no visible seam. Save
  `A.png`, `B.png`, `front-only.png` (front layer on a checkerboard) and `diff.png`.
- Save `base-no-glazing.png` showing the interior with the frame removed.

## Report contract

Reply via worker_done with: changed file, exported API, the diff numbers, evidence paths, and any element you were unsure
belongs to the front plane. Non-zero exit of your checks = task failed; say so plainly.
