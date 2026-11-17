# evidence05 — commit-scope audit (read-only)

Date: 2026-11-17. Scope: `git status`, tracked diff, ignored-but-source files under `films/`, untracked `.agent-runs/` evidence, and the in-flight `models/` + main-scene integration. No staging, no writes outside this file, no network.

## 1. Tracked modifications (safe to commit as-is)

`git status` shows 9 modified tracked files, all part of the authorized neon-cel / Thai-signs work:

- `.agent-dispatches.jsonl` (+59 lines — Orca dispatch ledger entries, expected)
- `films/horror-x-snowy-neon-code/CREDITS` (+2)
- `films/horror-x-snowy-neon-code/INTERFACE.md`, `README.md` (doc updates)
- `films/horror-x-snowy-neon-code/assets/original-actor.js` — **local revision**: side hair wings narrowed (`+-118 -> +-84`, droop `270 -> 235`); face/body/pose unchanged. This is the file the `noon` model copies byte-for-byte (verified: `models/noon/original-actor.js` sha256 == main copy).
- `films/horror-x-snowy-neon-code/characters.mjs`, `environment.mjs` (+302/-…), `main.mjs`, `neon.mjs` — Thai sign rewrite (real Kanit font text via `initNeon()`), washer extraction to `washers.mjs`, wet-ground Nun reflection bands, contact shading.

Diff review notes:

- `main.mjs` now imports `../../models/registry.mjs` (`getCharacterModel`, `CHARACTER_MODELS`, `DEFAULT_MODEL`) and `characterMarkup` from `characters.mjs`. `?model=` query validated with a clear error; default is registry default (`cel`). `window.CHARACTER_MODEL` and `FRAME_META.characterModel` set. `await initNeon()` still precedes first `render(0)` — Thai init preserved.
- Reflection was correctly reworked: instead of the old `mark.replaceAll('actor-snowy','actor-snowyr')` string patch (which would silently fail for the cel model whose ids are `cel-woman-<uid>`), it now calls `characterMarkup(t,{model:characterModel,uid:'snowy-r'})` — a second registry render with a distinct uid. Duplicate-id pitfall is handled **provided** the registry namespaces every def/gradient/clip id by uid for both models. cel assets already prefix `cel-woman-<uid>` and sanitize uid to `[A-Za-z0-9_-]`; noon uses `actor<uid>-…`. Verified by source inspection; final proof is the pending registry test + composed-frame render.
- `characters.mjs` keeps `drawCloth`, `drawCharacters`, `characterMarkup` (default placement x690 y925 scale .5 pose count uid snowy, model forwarded), and `originalNunMarkup(t,uid)` as a deprecated-name alias to the registry default — matches spec 02.
- `character-proof.mjs` still imports `./assets/original-actor.js` directly (the narrowed Nun) plus `drawCloth` from `characters.mjs`; since `characters.mjs` now imports `models/registry.mjs`, the proof **will fail until `models/registry.mjs` lands**. Registry file was not yet present at audit time (only `models/cel/*`, `models/noon/*`, `models/models.test.mjs` existed). Do not commit before worker 01 finishes `registry.mjs`, `models/README.md`, `models/CREDITS`.

## 2. Byte-identity check (performed)

All five approved variant assets copied into `models/cel/` are sha256-identical to `films/horror-x-snowy-neon-cel-woman/assets/cel-*.js`; `models/noon/original-actor.js` is identical to main `assets/original-actor.js`. Originals untouched — variant folder unmodified.

## 3. New files that MUST be force-added (`/films/` is gitignored, `.gitignore:86`)

Everything under `films/` is ignored; previously committed film files were added with `-f`. New source needing `git add -f`:

**`films/horror-x-snowy-neon-code/` (main):**
- `washers.mjs` — new module imported by `environment.mjs` (required for build)
- `assets/fonts/Kanit-Regular.ttf` — Thai sign font, loaded by `neon.mjs` `initNeon()`; without it fresh clones render wrong/broken Thai
- `assets/fonts/OFL.txt` — font license

**`films/horror-x-snowy-neon-cel-woman/` (approved variant — keep, do not delete):**
- `.gitattributes`, `CREDITS`, `DELIVERY.md`, `INTERFACE.md`, `README.md`
- `assets/cel-body.js`, `cel-eyes.js`, `cel-face.js`, `cel-hair.js`, `cel-woman.js`, `original-actor.js`
- `audio-proof.py`, `build.mjs`, `build.sh`, `character-preview.html`, `character-proof.html`, `character-proof.mjs`, `characters.mjs`, `environment.mjs`, `index.html`, `main.mjs`, `neon.mjs`, `qa.mjs`, `render-character-preview.mjs`, `render-frame.mjs`, `washers.mjs`, `weather.mjs`
- Recommend **leaving local** (repo rules / generated): `out/` (6 png/svg stills), `TREATMENT.md`, `TREATMENT-CEL-WOMAN.md` (`**/TREATMENT.md` is an explicit local-only rule). If the user wants the treatments archived, force-add them deliberately — flag for lead decision.

**`models/` (repo root — NOT under `/films/`, normal `git add` works):**
- `models/cel/*.js` (5 files), `models/noon/original-actor.js`, `models/models.test.mjs`, plus pending `models/registry.mjs`, `models/README.md`, `models/CREDITS` from worker 01.

## 4. `.agent-runs/` untracked evidence — include

Normal (non-ignored) untracked dirs; precedent exists (`films/horror-x-ep1-part1-60s/.agent-runs/` is tracked):

- `.agent-runs/laundry-cel-woman/` (136K), `.agent-runs/laundry-cel-woman-pale-slim/` (105K), `.agent-runs/neon-cel-integration/` (36K, grows), `.agent-runs/neon-composed-frame/` (16K), `.agent-runs/neon-thai-signs/` (220K) — all text/json/svg, commit.
- `.agent-runs/neon-depth-revision/` (11M) — mostly text, but contains 8 review PNGs totaling ~7 MB, largest `reflection/frame-3.7-reflection-on.png` / `-off.png` (~1.9 MB each) and `render/frame-0.5-wide.png` (~1.65 MB). Not oversized by repo standards (no binary cap in `.gitignore`), and they are the visual evidence for the depth/reflection/washers/hair revisions — recommend committing, but flag to lead: if repo size matters these are the candidates to keep local instead.

**Secrets scan:** grepped all six untracked `.agent-runs/` trees for key/token/password/bearer patterns and high-confidence formats (`sk-…`, `AIza…`, `ghp_…`, `xox*-…`, `AKIA…`, PEM blocks) — **no secret values found**. Only benign prose mentions of the words "secret"/"token" inside spec/plan files.

## 5. Paths to leave local per `.gitignore` (do NOT commit)

- `films/**/out/` — `horror-x-snowy-neon-code/out/*.png`, `horror-x-snowy-neon-cel-woman/out/*`
- `*.mp4`, `*.wav`, audio intermediates anywhere (ep1 has ~160 MB of prev mp4s/wav — untouched, stays local)
- `films/horror-x-ep1-part1-60s/` ignored leftovers: `qa/` scratch, `music-score.json`, `music-score.raw.txt`, `MUSIC-BRIEF.md`, `music-bed.py`, `nul`, `.agent-runs/*/specs/*.md`, `__pycache__/` — pre-existing from the Nov 16–17 session, not part of this change set; leave local unless the user explicitly wants ep1 evidence archived (its tracked `.agent-runs` text is already committed).
- `.venv/`, `node_modules/`, `core/audio/instruments/` (VSCO2CE samples), `nul` at repo root, `styles/*/demo/out*/`, fonts under `styles/`.
- `**/TREATMENT.md`, `**/PRODUCTION_LOG*`, `**/HANDOFF*.md`, `**/NOTES.md`, `**/TODO*.md`, `*.bak`, `**/tmp/`, `**/scratch/` — process-note rules apply repo-wide, including inside force-added film dirs.

## 6. Pitfalls checklist for the commit

1. **Registry must exist before commit** — `models/registry.mjs`, `models/README.md`, `models/CREDITS`, and a passing `node --test models/models.test.mjs` are still pending (worker 01 in flight at audit time). `main.mjs`, `characters.mjs`, `character-proof.mjs` all import it.
2. **uid-namespaced ids** — verified by inspection for both models; the composed-frame proof (worker 04 / lead build) is the real check that `snowy` and `snowy-r` renders never share def ids.
3. **Thai init** — `await initNeon()` precedes `render(0)`; the Kanit font files must be force-added or Thai signs regress on fresh clones.
4. **Old-proof hashes** — `qa.mjs` computes sha256 of frames/sources at runtime into the report; there are no stored golden hashes, so the `original-actor.js` hair revision does not invalidate any committed reference. Previously *reported* hashes in old `.agent-runs` evidence will differ from new runs — expected, not a failure.
5. **CRLF** — git warns LF→CRLF on the modified files; both film `.gitattributes` pin `*.mjs/*.html/*.py eol=lf` and `assets/original-actor.js -text`, so committed blobs stay LF. No action needed.
6. **Do not revert** — all listed modifications are authorized user/worker edits; nothing in the diff looks accidental.

## 7. Recommended commit set (summary)

- `git add` (normal): 9 modified tracked files + `models/` + 6 untracked `.agent-runs/` dirs.
- `git add -f`: `films/horror-x-snowy-neon-code/{washers.mjs,assets/fonts/Kanit-Regular.ttf,assets/fonts/OFL.txt}` and the `films/horror-x-snowy-neon-cel-woman/` source list in §3 (excluding `out/` and `TREATMENT*.md` unless user overrides).
- Leave everything in §5 local.
