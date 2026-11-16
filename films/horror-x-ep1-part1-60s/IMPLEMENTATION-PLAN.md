# Part1 implementation and verification plan

Spec: TREATMENT.md and user's approved prototype/full-production request. Execute with native Orca sliding window, max13 active tasks (user expanded by5), aim Devin5 while unassigned production work remains. User owns account plans; do not run entitlement/billing/quota preflights. Each configured route gets its own bounded role and ledger/evidence. No Part2/3 production.

Prepared25 tasks: voice,actor,effects,contract-tests,continuity,scene01–12,audio-score,captions,browser-qa and5 distinct direct-panel reviews. Source geometry retained as read-only local assets; coordinator owns scene-kit/main/timeline integration.

- [x] Read full16-shot source; write new12-line Part1 script,3-part planning map and treatment.
- [x] Preserve old prototype; create fresh film folder and explicit function/ownership contract.
- [ ] Native first window: Devin voice/actor/scene01/scene02/scene03; Antigravity effects; OpenCode tests; Kiro continuity.
- [ ] On native worker_done: `python settle-task.py <id> done '<actual summary>'` saves native response, finishes profile ledger, releases worker. Verify files before accepting. If failed, record failed. Fresh workers receive next queued task via `python launch-task.py <id>`; no polling/watchloop.
- [ ] Fill Devin slots with scene04..12, then score/captions. Run the required direct-panel reviews in freed specialist slots via configured profile launcher; record real failures rather than preflight-gating. Direct reviews write stdout only, lead saves evidence/review. Kilo missing is an actual invocation error, not a silent omission.
- [ ] Voice critical path: validate total60,scene coverage,interline gaps<=.35,phraseend not clipped. Copy measured scene array to timeline.json. Speech files remain natural-rate; adjust source text/rate rather than stretching.
- [ ] After voice/caption outputs exist, run caption build/audio score. Generate canonical timeline.js/main and ensure scene exports match.
- [ ] Run meaningful contract tests; fix root causes through owning workers, then inspect12 representative frames and all cut boundaries. Check body/hand/prop contact, cloth faceless/rear-only, caption bbox and actionmotion. Rich camera+parallax in each scene.
- [ ] Render1800frames at1080x1920@30, mix originalscore/SFX+dryThai voice, normalize-18LUFS,full decode/blackdetect/loudness. Inspect final MP4 contact sheets and 0.2s action strips. State any playback/listening limitation.
- [ ] Finish every dispatched route, update ledger/evidence and remaining taskqueue,close onlyownedworkers/browser/server; preserve userprocesses. Deliver MP4,poster,SRT,credits,README/build/source. Stop for Part1 user review.

Current native run: run_32d499536938. `launch-task.py` and `settle-task.py` are one-shot launch/receipt helpers, not worker statuspollers. Files in .agent-runs connect to profile .agent-dispatches.jsonl via stored ledger receipts.
