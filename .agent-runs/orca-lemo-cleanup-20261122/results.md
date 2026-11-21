# Lemo-Opuscar cleanup results

- Project: `E:/AI/lemo-opuscar`; Orca Run: `run_0526c2500968`.
- User request: use a distinct Lemo project session, remove the unused 3D Empty Winter package, and leave only `main` among project branches; keep `main` protected and do not create a missing `pat`.
- Roster: project profile resolved to Devin x5, OpenCode x2, Kilo x2. Orca accepted five Devin tasks; all five completed. The first 3D-removal dispatch had the wrong base (`origin/main`), made no changes, and was safely retried with `refs/heads/main`.

## Outcomes

1. 3D package removed from local main in commit `d7889e677d36c067ce6592fa6e724ee388d2c56e` (68 tracked files, all under `films/ant-broke-empty-winter/`). Remaining local generated files in that explicitly requested folder were also removed. The 2D package remains at 27 tracked files.
2. Final local main is `8fc85f26ab6f8e6dc14ae08b829b443d0495fad5`. Its tree hash is `90c3746e3ac5b8f40135d0cbc3120dbab8cbfb85`, identical to `origin/main` at `56bc001427224a9847748c31ce75d5dd93d7d170`. No content needs a new push. Local main keeps its local-only merge history; it is seven commits ahead by ancestry, but tree-identical to origin.
3. `nut2567/ship-lemo-integration` at `9dc72014b2dd9ee76cb791f503c42e938551f599` was merged into local main; it had no remote counterpart and was deleted locally.
4. `nut2567/ship-lemo-integration-final` at `286364dd1cc7cb9c7d145d942dda891b2ec6b958` was fully published and had no unique commits; deleted locally.
5. `snowy-neon-leda-3ep` at `d57216aacc333e95895c222a2d57d56c7fe0109a` was an ancestor of both local and remote main; deleted locally and remotely using an expected-SHA lease.
6. Reference audit confirmed only the remote `main` ref remains, no local or remote `pat` exists, and published candidate paths remain present: 2D Empty Winter (27 files), Ant Highlights (5 files), Snowy Neon EP4 source (2 files). No pending MP4 deliverables were excluded.
7. Removed all six settled Orca child worktrees and their safe-to-delete task branches. Released all six terminals from this Run; released the previously retained successful Highlights terminal and stale integration terminal from the earlier mixed-project Run. Orca now lists only the main project worktree. The project branch inventory contains only local `main`; origin contains only `main`.

## Verification

- `git ls-tree -r HEAD films/ant-broke-empty-winter` returned no paths.
- `git ls-tree -r HEAD films/ant-broke-empty-winter-2d` returned 27 paths.
- Local `HEAD^{tree}` and `origin/main^{tree}` both equal `90c3746e3ac5b8f40135d0cbc3120dbab8cbfb85`.
- `orca worktree list --repo id:b5103d8a-6297-4f14-a209-66e38ea86f5e` returned only `E:/AI/lemo-opuscar` on `main`.
- Live local and remote branch inventories each contain only `main`; no `pat` was created or modified.
- All five primary worker tasks settled successfully after the safe retry. Dispatch ledger entries are recorded by `profile.py` in the project ledger.
- Final local branch list: only `main`; final remote head list: only `main`; final Orca worktree list: only the repo's main worktree.
- Settled dispatch terminals were released; one superseded Highlights failure dispatch reported `no_owned_resource` because its terminal belonged to the successful retry, whose terminal was released.

## Worker evidence

- Remove 3D: successful retry `ctx_3bf6ae38962d`, commit `094374bb9c8c43df66a0e4b51bba5116b6b54e0c`; integrated to main as `d7889e6`.
- Audit integration branch: `ctx_bfbd8a7e1f0b`.
- Audit final integration branch: `ctx_53ef3d2e81c5`.
- Audit snowy branch: `ctx_2966809f3110`.
- Audit refs/deliverables: `ctx_5b1bca01e4b4`.
- Initial wrong-base attempt `ctx_64272cf377c8` was recorded as failed with no file changes.
