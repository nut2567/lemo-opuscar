rules-version: 2

Task: Remove only the unused 3D Empty Winter source package from a new child worktree based on the current local `main` in E:\AI\lemo-opuscar. The package is `films/ant-broke-empty-winter/`; the approved 2D package is `films/ant-broke-empty-winter-2d/` and must remain untouched. The user explicitly requested deleting the 3D package.

Allowed changes: tracked files under `films/ant-broke-empty-winter/` only. Do not touch `.agent-dispatches.jsonl`, `.agent-runs/`, other project files, outputs outside this tracked folder, remote refs, or any branch other than your own task branch. Preserve any untracked/local outputs. Do not push. Do not merge to main yourself.

Actions: verify the task worktree starts from local main commit 3c397fb55e0e522d1a715e055a8ac044a36ecdd7; inspect status; remove the tracked folder via Git; commit the deletion with a clear message. If the base or status differs, stop and report instead of adjusting other files.

Verification: `git diff --check HEAD^ HEAD`; confirm the commit changes only paths under `films/ant-broke-empty-winter/`, and `git ls-tree -r --name-only HEAD films/ant-broke-empty-winter` is empty while `films/ant-broke-empty-winter-2d/` still exists. Report commit SHA, file count, exact checks, and any issue. No tests required.

Placement: this machine (local), the user asked to run this work in E:\AI\lemo-opuscar.
