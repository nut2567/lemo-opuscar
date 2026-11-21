rules-version: 2

Task: Read-only audit the local branch `nut2567/ship-lemo-integration` in E:\AI\lemo-opuscar for safe cleanup after publication. Do not modify files or refs.

Check its exact live SHA, whether it is used by any Git or Orca managed worktree/session, whether it is an ancestor of current local `main` and `origin/main`, and whether its unique diff introduces anything absent from published origin/main (particularly the excluded 3D package). Check worktree status without switching branches. Do not stop or detach any worker/worktree.

Report the exact SHAs and evidence. Recommend delete/retain, distinguishing local versus remote; do not execute deletion. User requested removal of non-main work branches, with main and pat protected.

Placement: this machine (local), the user asked to run this work in E:\AI\lemo-opuscar.
