# Git publish report — horror-x ep1 part1 v5 (2026-11-17)

Worker: Devin, task_0ef878d5d675 / ctx_89346488409b. User authorized "เอาข้อมูลขึ้น git and push".

## Result

- Pushed `main` to `origin` (https://github.com/nut2567/lemo-opuscar.git).
- Remote `refs/heads/main` = `832a8ad021201d516b78d3a7f96417100d4147cc` = local HEAD (verified via `git ls-remote`).
- GitHub commit URL: https://github.com/nut2567/lemo-opuscar/commit/832a8ad021201d516b78d3a7f96417100d4147cc
- History: `4427743` (pre-existing local) → `4220a33` (v5 publish commit, 72 files) → `832a8ad` (merge of origin/main `c48c4c3`). Both histories preserved; no force-push/reset/clean.

## Deliverables included (commit 4220a33)

- `films/horror-x-ep1-part1-60s/horror-x-ep1-part1-60s-v5.mp4` — 59,391,373 bytes, sha256 `7466fc9f…802ac6` (verified post-merge, unchanged)
- `out/picture-v5.mp4` — sha256 `08013418…4f06`; `poster-v5.jpg` — sha256 `0dd1ff82…5d8a`
- New modules `assets/room-lighting.js`, `assets/washer-volume.js` (force-added past `/films/` ignore)
- `tests/revision-v4-geometry.test.mjs` (new revision geometry test)
- All modified production source: scenes 01/02/04/05/08/09/10/12, actor/effects/main/captions/interior/exterior, build/mux/caption scripts, SRT, PRODUCTION-STATE.json
- Current QA: `qa/browser-check.json`, all `qa/frames/*` (except stale repeat frames), `qa/final-probe-v5.json`, `qa/mux-loudness-v5.txt`
- Delivery evidence `qa/v5/`: FINDINGS-encoded-final.md, FINAL-REPORT.md, media-validation-final.json, caption-validation-draft.json (sanitized copies; README evidence link updated to `qa/v5/`)

## Merge integration (832a8ad)

- origin/main carried an alternative revision (646ae6f warm-retro/32px-caption variant + music-bed score; c48c4c3 VARIANT-STYLES.md). All 55 files changed on both sides were resolved to the accepted v5 side; remote-only additions (sound-design.py music-bed, soundtrack.wav, mixed-soundtrack.wav, CREDITS, SOUND-QA.md, VARIANT-STYLES.md, compare-pixels.py, .agent-runs specs, dispatch ledger) merged in cleanly.
- README kept v5 doc plus remote's music-bed paragraph; added a merge note recording that repo WAVs are now the music-bed versions while v5.mp4 retains its accepted mix.
- `.agent-dispatches.jsonl` / `.lock`: remote tracks these; local untracked ledger was preserved by merging local-only entries into the working file (84 lines, sorted by `at`), left modified-unstaged. Local `.lock` content was byte-identical (0x00).

## Exclusions (kept out of the commit)

- v4/intermediate media: `poster-v4.jpg`, `horror-x-ep1-part1-60s.mp4` (original), `out/picture-v3.mp4`, `out/picture-v4.mp4`
- Debug/stale QA: `qa/dbg-*.png`, `qa/sw-*.png`, `qa/*-repeat.png` untracked, `qa/final-probe-v4.json`, `qa/mux-loudness-v4.txt`, `__pycache__/`, `nul`, `queue.lock`
- Coordination/private: root `.agent-runs/` untracked portion (`revision-v5-20261117/`), `humpback/`, film `.agent-runs/revision-v5-20261117/`, `.agent-dispatches.jsonl.lock` working state
- `qa/frames/scene08-mid-repeat.png`: local stale repeat render excluded from v5 commit; remote's version arrived via merge. Local bytes backed up at `%TEMP%/v5publish/scene08-mid-repeat.local.png` (ephemeral).

## Checks

- `git diff --cached --stat/name-status` inspected before commit; secret scan of staged text diff clean; all 72 staged paths inside the film.
- File sizes: two ~56–58 MB MP4s under GitHub's 100 MB hard limit; push produced only >50 MB warnings, no LFS needed.
- Post-merge `git diff 4220a33 -- films/` shows only remote-intended files; all v5 source/media byte-identical; deliverable SHA256s re-verified after merge.
- No re-render or voice generation performed; accepted test evidence reused (conflict resolution took our side wholesale, no new source authored).

## Remaining state

- `.agent-dispatches.jsonl` modified-unstaged (merged local+remote ledger), `.agent-runs/revision-v5-20261117/` and `humpback/` untracked — all preserved.
- Film ignored intermediates (v4 poster, dbg/sw PNGs, out/picture-v3/v4.mp4, etc.) remain on disk, untracked.

---

## Correction (task_979bd1101039, 2026-11-17) — canonical audio restored

The merge had replaced `soundtrack.wav`/`mixed-soundtrack.wav` with the remote music-bed render, violating the approved-v5 immutable-inputs invariant. Fixed in commit `66950147adb8f7553d17956eb2e376a2edbdd1e2`, pushed; `git ls-remote` = HEAD verified.

- Canonical restored from pre-merge commit `4220a33` (blobs verified against `.agent-runs/revision-v5-20261117/baseline/manifest.json`):
  - `soundtrack.wav` sha256 `5c7903d2444be2a9216f7a8f1f65651075fb269604242b8bd24ed7549c9c8aef`
  - `mixed-soundtrack.wav` sha256 `a9b0331f5c69f6422033245b1ebc10d4e5dad34279442380958e844e24686f91`
- Remote music-bed render preserved byte-identical under `films/horror-x-ep1-part1-60s/audio-variants/music-bed/` (`soundtrack.wav` `8843fd1b…`, `mixed-soundtrack.wav` `ead21ffa…`, plus provenance `README.txt`).
- `sound-design.py` now writes only `audio-variants/music-bed/soundtrack.wav` + `SOUND-QA.md` (docstring updated); `mix-audio.py` accepts optional `[voice] [score] [out] [check]` args with unchanged canonical defaults, so `build.ps1` and the canonical mux path are unaffected and the variant recipe cannot overwrite accepted inputs.
- Docs: README merge note corrected (canonical = approved baseline; variant = alternate), music-bed recipe paragraph marked non-committed-source, `SOUND-QA.md` prefixed as alternate-variant doc.
- Re-verified all manifest media present on disk: 0 mismatches (v4 mp4 absent locally — pre-existing, never on this machine); final v5.mp4/picture-v5.mp4/poster-v5.jpg SHA256 unchanged.
- No audio regenerated, no rendering, no provider calls. Unstaged/untracked state preserved (`.agent-dispatches.jsonl` modified ledger, `.agent-runs/revision-v5-20261117/`, `humpback/`).

Remaining limits: `music-bed.py`/`music-score.json`/`music-bed.wav` were never committed anywhere, so the variant stem can only be re-rendered procedurally or from the preserved WAVs; the variant mixed WAV is a preserved artifact (re-mix recipe documented in `audio-variants/music-bed/README.txt`).
