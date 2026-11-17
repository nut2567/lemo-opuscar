# 06 — Final review report (read-only)

Reviewer: devin worker `task_b1fb97fc05d1`. No files modified except this report.
`node --test models/models.test.mjs` re-run by reviewer: 6/6 pass. Existing
`qa/runtime-report.json` (regenerated 2026-11-18 00:02) shows `passed:true`,
all 17 checks true — but see finding I-1: its `registryRejectsUnknown` check
only exercises `'bogus'`, not the prototype names the spec requires.

## Files reviewed

- `models/registry.mjs`, `models/models.test.mjs`, `models/README.md`,
  `models/CREDITS`
- Canonical copies `models/cel/*.js` (5), `models/noon/original-actor.js`
  vs sources `films/horror-x-snowy-neon-cel-woman/assets/cel-*.js` and
  `films/horror-x-snowy-neon-code/assets/original-actor.js` (sha256 verified
  identical on this machine by the test suite)
- `films/horror-x-snowy-neon-code/main.mjs`, `characters.mjs`, `qa.mjs`,
  `index.html`, `character-proof.mjs`, `.gitattributes`, `README.md`,
  `CREDITS`, `INTERFACE.md` (current diffs)
- `.gitignore`, root `/.gitattributes`, `films/horror-x-snowy-neon-cel-woman/.gitattributes`
- Preview scripts `model-preview.html` / `render-model-preview.mjs` /
  `render-frame.mjs` in the main film: **not present at review time**
  (spec-04 worker still in flight).

## Critical

### C-1. Required source files are git-ignored and will not be committed

Root `.gitignore:86` (`/films/`) ignores everything under `films/` unless
force-added. Currently ignored-but-required (`git check-ignore -v` confirms
`.gitignore:86:/films/` for each):

- `films/horror-x-snowy-neon-code/washers.mjs` — imported by tracked
  `environment.mjs:1` (`import {drawWashers} from './washers.mjs'`).
  Fresh clone → module resolution failure, film does not boot.
- `films/horror-x-snowy-neon-code/assets/fonts/Kanit-Regular.ttf` and
  `OFL.txt` — loaded by `neon.mjs:11` (`FONT_URL =
  'assets/fonts/Kanit-Regular.ttf'`) for the Thai signage; fresh clone →
  `initNeon()` font load fails / falls back, Thai init degraded.
- `films/horror-x-snowy-neon-cel-woman/` (entire variant film) — the
  canonical source for all five `models/cel/*` byte-identity checks in
  `models.test.mjs:14-18` and `qa.mjs:19-23`. Fresh clone →
  `readFileSync` ENOENT; both test suites fail. This is also the "variant
  source must not be lost" requirement: it exists only in this ignored
  tree.

Minimal fix (lead staging step): `git add -f` the three paths above —
`films/horror-x-snowy-neon-code/washers.mjs`,
`films/horror-x-snowy-neon-code/assets/fonts/`, and
`films/horror-x-snowy-neon-cel-woman/` (or at minimum its `assets/` plus
the docs that establish provenance). Intermediates (`out/`, `qa/`,
`poster.png`, `*.mp4`) correctly stay ignored.

### C-2. `models/**/*.js` have no `-text` attribute — byte-identity breaks on fresh clone (autocrlf)

Host has `core.autocrlf=true`. Root `.gitattributes` pins only
`*.sh/*.mjs/*.html/*.py` to `eol=lf`; `.js` files fall through to
`text=auto` normalization. `git check-attr` confirms `text: unset,
eol: unspecified` for `models/noon/original-actor.js`, `models/cel/*.js`,
while the film's `assets/original-actor.js` and the variant's
`assets/cel-*.js` are explicitly `-text whitespace=cr-at-eol`
(`films/horror-x-snowy-neon-code/.gitattributes`,
`films/horror-x-snowy-neon-cel-woman/.gitattributes`).

Working copies currently contain **mixed** CRLF/LF endings. On commit the
`models/` copies will be normalized to LF in the blob and checked out as
all-CRLF on a fresh clone, while the `-text` sources reproduce their exact
mixed bytes — so `sha256(models/cel/cel-woman.js) !=
sha256(.../assets/cel-woman.js)` and the same for `noon`. Both
`models.test.mjs` and `qa.mjs` canonical-source checks then fail on a
fresh clone even though they pass here.

Minimal fix: add `models/.gitattributes` containing
`*.js -text whitespace=cr-at-eol` **before** staging `models/` (untracked
today, so nothing needs re-staging). The variant film's own
`.gitattributes` already protects its `assets/cel-*.js` and
`assets/original-actor.js`; the main film's `assets/original-actor.js` is
already `-text`. No attribute change needed for `*.mjs` (registry/test are
eol=lf and not byte-compared).

## Important

### I-1. Object-prototype model ids bypass validation (registry.mjs:43)

`getCharacterModel` does `CHARACTER_MODELS[id]` on a plain frozen object,
so inherited `Object.prototype` members are returned as "models". Verified
by direct node run:

```
getCharacterModel('constructor') -> function (Object), id undefined
getCharacterModel('toString')     -> function, id undefined
getCharacterModel('__proto__')    -> object (Object.prototype), id undefined
getCharacterModel('hasOwnProperty'/'valueOf') -> function
```

None throw `RangeError`. Consequences:

- `renderCharacter(t, { model: 'toString' })` → `getCharacterModel`
  returns the `toString` function, `.render` is `undefined` → `TypeError`,
  not the documented `RangeError` (`registry.mjs:44,50`).
- `?model=constructor` / `?model=__proto__` in `main.mjs:21-28` passes the
  `getCharacterModel` validation (truthy return), sets `characterModel`,
  then every `window.render(t)` throws inside `nunLayer`
  (`main.mjs:41` → `characters.mjs:181` → registry) — `window.READY` is
  never set (`main.mjs:127`). User-facing crash via a plausible URL.
- Neither test covers this: `models.test.mjs:83-84` and `qa.mjs:30` only
  try `'bogus'`.

Minimal fix: in `registry.mjs:43` use an own-property check, e.g.
`const model = Object.hasOwn(CHARACTER_MODELS, id) ? CHARACTER_MODELS[id] : undefined;`
(or build the map with `Object.create(null)`, or verify
`model?.id === id`). Add `'constructor'`, `'toString'`, `'__proto__'`
(and ideally `'hasOwnProperty'`, `'valueOf'`) to the unknown-id assertions
in `models.test.mjs` and `qa.mjs` `registryRejectsUnknown`.

### I-2. Film docs still describe the pre-Cel revision (verify spec-03 output before commit)

Reviewed current state; docs worker may still be in flight:

- `films/horror-x-snowy-neon-code/README.md` "Current character revision"
  paragraph still says "Nun uses the original episode SVG rig … is
  overlaid as inline SVG" — no mention of `cel` as default, the
  `models/` registry, or `?model=noon`.
- `INTERFACE.md` scene geometry still reads "Nun at x690, face center
  (690,925)".
- `models/README.md` and `models/CREDITS` are accurate and consistent with
  the code (default `cel`, `noon` preserved, byte-copy policy).

If spec-03 lands updates covering this, I-2 is moot; otherwise the README
contradicts shipped behaviour.

## Verified OK

- Default selection: `DEFAULT_MODEL='cel'` (`registry.mjs:22`);
  `characterMarkup` defaults `model: DEFAULT_MODEL`, x690 y925 scale .5
  pose `count` uid `snowy` (`characters.mjs:180-185`) — matches scene
  geometry; `main.mjs:22` defaults to registry default.
- Alternate selection: `?model=noon` validated and forwarded
  (`main.mjs:21-28,41,44`); `qa.mjs:77-85` proves distinct markup.
- Reflection uid uniqueness: direct `uid:'snowy'`, reflection
  `uid:'snowy-r'` (`main.mjs:41,44`); both models sanitize uids to
  `[A-Za-z0-9_-]` (`cel-woman.js:33`, `original-actor.js:247`); test
  confirms no id leakage. Overlay ids `nunClip/nunWet/nunHidden/
  nunReflBlur/nunBand*/nunMir` are emitted once per `innerHTML` rewrite —
  no cross-uid collision.
- Thai init order preserved: `await initNeon()` before `render(0)` and
  `READY` (`main.mjs:127`); `index.html` has `#nunCam` group.
- Nun archive: `films/horror-x-snowy-neon-code/assets/original-actor.js`
  tracked and byte-identical to `models/noon/` copy; original episode rig
  survives in tracked `films/horror-x-ep1-part1-60s/actor.js` +
  `assets/nun.js`. `character-proof.mjs` still proofs the Nun rig
  directly — intentional.
- Cel copies byte-identical to variant sources on this machine; variant
  `.gitattributes` already pins `assets/cel-*.js -text`.
- Determinism: renders are pure functions of `t`; `qa` random-access hash
  check passes.

## Minor (not blocking)

- `registry.mjs:38` `{ pose: 'count', ...opts }`: an explicit
  `pose: undefined` overrides the default and `nun` then falls back to
  `'idle'` (`original-actor.js:242`). Only reachable by a caller passing
  `pose: undefined` literally; fix would be `pose: opts.pose ?? 'count'`.

## Out of scope / for lead

- Preview scripts (spec-04) absent at review time — re-check when they
  land.
- `.agent-runs/*` evidence dirs are untracked; staging decision is the
  lead's per plan.
- Lead owns full build and fresh-clone verification; C-1/C-2 directly
  affect that fresh-clone check.
