# 03 — Docs report

Worker: devin `task_5c4f49413976`. Scope: documentation only — no source
files touched, no commits, no renders.

## Files modified (owned scope only)

- `films/horror-x-snowy-neon-code/README.md`
- `films/horror-x-snowy-neon-code/CREDITS`
- `films/horror-x-snowy-neon-code/INTERFACE.md`
- `films/horror-x-snowy-neon-code/TREATMENT.md`

## What changed

- Primary woman documented as registry model `cel` — เซล (user-approved
  pale/slim 80s-cel design from `films/horror-x-snowy-neon-cel-woman`);
  previous Nun rig preserved as `noon` — โมเดลนุ่น, selectable via
  `?model=noon`, unknown ids rejected. Names decoded from coordinator
  answer (Unicode escapes -> UTF-8 Thai).
- `renderCharacter` reuse snippet added to README and INTERFACE:
  `renderCharacter(t, { model: 'cel', x: 690, y: 925, scale: 0.5, uid: 'snowy' })`
  importing from `../../models/registry.mjs`.
- INTERFACE.md gained a "Character model registry (final integration)"
  section matching the landed code: `characterMarkup` forwarding,
  `?model=` validation, `CHARACTER_MODEL`/`FRAME_META`, reflection via
  `uid:'snowy-r'`, `originalNunMarkup` deprecated alias, shared
  head-center anchor so all scene bounds are unchanged.
- CREDITS: provenance rewritten — cel components byte-for-byte under
  `models/cel/`, noon rig byte-identical under `models/noon/`, both via
  `models/registry.mjs`; prior Nun-primary paragraph replaced.
- README: character-proof.html now described as the historical
  โมเดลนุ่น (`noon`) sheet; new person-only model preview
  (`model-preview.html` / `render-model-preview.mjs`) and current
  `poster.png` distinguished.
- TREATMENT.md: new "Character model decision (user-approved)" section
  records user acceptance and model retention without changing the story;
  "Nun" references in logline/shot table generalized to "the woman".
- Preserved: Thai signage section, depth/cloth/window/camera notes,
  7.5 s build instructions, original 60 s episode unchanged. No claims of
  final-video verification added; docs describe build/preview commands.

## Checks

- `git diff` reviewed for all four files; only intended hunks changed.
- Thai names verified against `models/registry.mjs` (`name: 'เซล'`,
  `nameEn: 'Cel Woman'`; `name: 'โมเดลนุ่น'`, `nameEn: 'Noon Nun'`).
- Preview files `model-preview.html`, `render-model-preview.mjs`,
  `render-frame.mjs` confirmed present in the film folder.

## Blockers / leftovers

None for this scope. Lead owns staging/commit and final build claims.
Note: spec text arrived with Thai names mangled to `?`; exact names were
obtained via `orca orchestration ask` before writing.
