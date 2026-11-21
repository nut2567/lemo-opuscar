rules-version: 2

Task: Read-only audit `snowy-neon-leda-3ep` local and `origin/snowy-neon-leda-3ep` remote in E:\AI\lemo-opuscar. User authorized cleanup of non-main branches; main and pat are permanently protected.

Check both live SHAs, whether either is used by any Git/Orca worktree/session, ancestry against `origin/main` and current local `main`, and whether any unique changes remain. Do not switch, detach, stop agents, or delete branches. If remote deletion is safe, provide the exact `--force-with-lease`-style expected old SHA/ref recommendation (do not run it).

Report local and remote independently with evidence and recommend cleanup or retention.

Placement: this machine (local), the user asked to run this work in E:\AI\lemo-opuscar.
