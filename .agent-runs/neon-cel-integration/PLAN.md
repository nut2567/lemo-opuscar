# Neon Cel Integration Implementation Plan

User-approved direction: adopt approved pale/slim Cel as primary woman in main snowy-neon episode, preserve previous Nun model named ????????? (noon), new model named ??? (cel), keep variant work, commit and push all project changes.

Architecture: reusable pure SVG model registry under models/ with canonical copied assets; main neon scene renders registry default cel, explicit noon opt-in. Keep current Thai signage, spatial scene, cloth, weather, camera, reflection and audio. Keep experimental variant source and prior rig. Node/Canvas/SVG/Playwright/FFmpeg, no new dependencies or paid calls.

- [x] Package approved cel and previous noon, preserve geometry bytewise and expose DEFAULT_MODEL='cel', getCharacterModel(id) and renderCharacter(t,{model,uid,...}). Meaningful test first: default selection, noon selectable, both distinct, deterministic, namespaced IDs, unknown selection error.
- [x] Integrate main characters/main/qa using shared registry. Reflection uses second render with unique uid; preserve existing Thai init and all scene geometry. Query model=noon supported with validation.
- [x] Document names, imports, reuse, and current main scene. Preserve original actor and variant sources.
- [x] Prepare main composed frame and reusable model preview checks; lead performs full 7.5s build and examines images.
- [x] Review source/archive and commit candidates. Include all current tracked changes and ignored-but-requested variant source/assets/fonts; preserve generated intermediates locally under repo rules; no secrets/credentials or huge runtime media.
- [x] Independent final review, fix material issues, run targeted checks; stage inspect commit push origin/main and verify clean status/upstream.

Ownership: workers share current checkout with disjoint files; user authorized integration of existing work, do not create an isolated checkout that loses uncommitted scene updates. Lead owns variant adapter, staging, final build, ledger and Git. No worker commits or pushes. Any concurrent changes are preserved.
