# Git cleanup plan — remove two accidental MP4s from main history

## Scope (ONLY these two paths, 117,245,125 bytes total)
- `films/horror-x-ep1-part1-60s/horror-x-ep1-part1-60s-v5.mp4` — blob `fa2f8301630e182ec7f963694d589449c39c56e1` (57,853,752 B)
- `films/horror-x-ep1-part1-60s/out/picture-v5.mp4` — blob `705346784e06bd95467774b2606192fcd148b1e6` (59,391,373 B)

## Facts verified (read-only against shared repo)
- Remote `origin/main` was `dc2a8aba71f6dfb4d6381784f2ae69749be0d1b6` at inspection; coordinator reports it advanced to `640444db77ab868108a4d4da121569a282dd7f45` (docs-only). **Candidate MUST be refreshed/replayed on 640444d before any push — do not drop that commit.**
- MP4s were added in `4220a33` and removed in `dc2a8ab` ("Source-only v5 film: untrack rendered MP4s"); they are absent from the tip tree, so the rewritten tip tree will be **identical** to the original tip tree.
- `4220a33` is an ancestor of both `main` and `refs/heads/feature/reproducible-character-proof`; the feature branch tree still contains the MP4s. Rewriting only `main` removes the blobs from main's history, but they remain reachable on the remote via the feature branch — flag for coordinator (separate decision; out of this task's only-main scope).
- Source repo pack before: 247.92 MiB (`count-objects -vH`, 8,855 in-pack). Local repo untouched; all work in isolated mirror.

## Backup (verified)
Dir: `D:/workspace/lemo-opuscar/.agent-runs/revision-v5-20261117/git-cleanup-plan/backup/`
- `main-dc2a8ab.bundle` — 443,954,322 B; `git bundle verify` → "The bundle records a complete history ... is okay". Contains full `refs/heads/main` history at dc2a8ab.
- `horror-x-ep1-part1-60s-v5.mp4` — 57,853,752 B (exact blob size)
- `picture-v5.mp4` — 59,391,373 B (exact blob size)
Local originals in `films/horror-x-ep1-part1-60s/` untouched.

## Candidate method (in progress at report time)
Isolated bare mirror: `C:/Users/PHP022025/AppData/Local/Temp/lemo-cleanup-mirror` (clone --bare of local repo, all objects, no shared refs/index touched).
Command running:
```
FILTER_BRANCH_SQUELCH_WARNING=1 git -C "$TEMP/lemo-cleanup-mirror" filter-branch -f \
  --index-filter "git rm -r -q --cached --ignore-unmatch -- \
    'films/horror-x-ep1-part1-60s/horror-x-ep1-part1-60s-v5.mp4' \
    'films/horror-x-ep1-part1-60s/out/picture-v5.mp4'" \
  -- refs/heads/main
```
149 commits on main; commits before `4220a33` keep identical SHAs (content-derived). No `--prune-empty`: commit structure preserved except the two paths.

## Verification checklist once filter-branch finishes
1. `git -C $TEMP/lemo-cleanup-mirror rev-parse refs/heads/main` → NEW_MAIN_SHA (record).
2. `git rev-parse NEW_MAIN^{tree}` == `git rev-parse 640444d^{tree}` after refresh (or == dc2a8ab^{tree} for the dc2a8ab-based candidate).
3. `git rev-list --objects NEW_MAIN | grep -E 'fa2f830|70534678|mp4'` → no matches for the two blobs/paths.
4. `git count-objects -vH` in mirror → size-pack should drop ~117 MB vs 247.92 MiB.
5. Refresh: fetch new main 640444d into mirror, re-run same index-filter on the new tip range (or cherry-pick/rebase the docs commit onto candidate) so no commit is dropped.

## Push plan (NOT authorized — awaiting coordinator release)
- Push rewritten `main` with `git push --force-with-lease=refs/heads/main:<old-remote-sha>` only after explicit approval.
- Scope: `refs/heads/main` only; no remote branch deletion, no backup branches pushed.
- All clones/forks must re-clone or `fetch` + hard reset; commit IDs from `4220a33` onward change.

## Verified candidate (based on dc2a8ab)
- Rewritten `refs/heads/main` in mirror: **`2a5acade13fad6d121851ffb6249f70994bd511e`** (149 commits, same count).
- Tip tree `9c000b7b215ac1f7126c6b370069985a50d0841b` — **byte-identical** to original `dc2a8ab^{tree}` (MP4s already absent at tip).
- `git rev-list --objects` on new main: zero hits for both blob SHAs and both paths — no reachable video blobs.
- `refs/original/refs/heads/main` = dc2a8ab preserved inside mirror only; nothing pushed.
- Mirror pack still 247.92 MiB locally because `refs/original`, `feature/...`, and `prepare-alternate-laundry-style` retain old objects; a push of only `refs/heads/main` transfers a thin pack containing only new-history objects (~117 MB smaller reachable set).

## Refresh for new remote main 640444d (IN PROGRESS)
- Remote main advanced: `dc2a8ab` → `6a7b445` → `ca02643` (merge) → `9da41d1` → `640444d` (4 commits, docs/feature-merge, fetched into mirror).
- Verified `640444d` tip tree contains **no** MP4 paths (merge did not resurrect them).
- Rewrite COMPLETED and verified. **Candidate main: `4a57896c628dd645fca1e3845fdb5b8354f394cf`** (153 commits; merge commit preserved as rewritten `8d9fbc0`). Tip tree `ee89933e5d3c14fb43feb6405f6c573a1c4ef4fe` is IDENTICAL to `640444d^{tree}` — all content preserved except the two removed paths. `git rev-list --objects refs/heads/candidate-main`: 0 hits for both blob SHAs/pathnames. Old remote main for force-with-lease: `640444db77ab868108a4d4da121569a282dd7f45` (ls-remote confirmed). Approved push (when authorized): `git -C $TEMP/lemo-cleanup-mirror push --force-with-lease=refs/heads/main:640444db77ab868108a4d4da121569a282dd7f45 origin refs/heads/candidate-main:refs/heads/main` — main ref only. Caveats: remote feature/reproducible-character-proof still reaches the MP4 blobs (separate decision, out of only-main scope); all commit IDs from 4220a33 onward change — collaborators must re-clone/reset.
