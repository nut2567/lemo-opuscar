#!/usr/bin/env python3
"""Preflight for the horror-x ep1 part1 build: verifies this checkout has every
dependency and source asset the build needs, without rendering anything.

    python preflight.py            # human-readable PASS/FAIL/WARN lines
    python preflight.py --json     # same result as JSON

Exit 0 when nothing required is missing, 1 otherwise. WARN lines never fail the
run (e.g. an audio hash that differs because voice was deliberately regenerated).
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

FILM = Path(__file__).resolve().parent
LIB = FILM.parent.parent

# Canonical accepted v5 mix (see README.md). A mismatch is a warning, not a
# failure: a deliberate voice/music regeneration legitimately changes them.
APPROVED_SHA256 = {
    "soundtrack.wav": "5c7903d2444be2a9216f7a8f1f65651075fb269604242b8bd24ed7549c9c8aef",
    "mixed-soundtrack.wav": "a9b0331f5c69f6422033245b1ebc10d4e5dad34279442380958e844e24686f91",
}

REQUIRED_MODULES = ["numpy", "PIL", "fontTools"]
# Only needed when regenerating voice (build without -SkipRegeneration).
VOICE_MODULES = ["edge_tts", "imageio_ffmpeg"]

REQUIRED_FILES = [
    "index.html", "main.js", "timeline.js", "captions.js", "scene-kit.js",
    "actor.js", "effects.js", "qa-render.mjs",
    "script.json", "voice.json", "voice-timeline.json", "timeline.json",
    "audio-events.json", "speech.wav", "soundtrack.wav", "mixed-soundtrack.wav",
    "fonts/Kanit-Regular.ttf",
    "assets/room-lighting.js", "assets/washer-volume.js",
    "assets/interior.js", "assets/exterior.js", "assets/nun.js", "assets/artwork.js",
    "build.ps1", "build-captions.py", "finalize-timeline.py", "generate-voice.py",
    "mix-audio.py", "mux-final.py", "sound-design.py", "preflight.py",
]
REQUIRED_DIRS = ["scenes", "voice"]
CORE_FILES = [
    "core/render/video.mjs", "core/render/still.mjs", "core/render/events.mjs",
    "core/render/browser.mjs", "core/render/page.mjs", "core/render/serve.mjs",
    "core/lib.js",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    as_json = "--json" in sys.argv[1:]
    results: list[tuple[str, str, str]] = []  # (status, area, message)

    def check(ok: bool, area: str, msg: str, warn_only: bool = False) -> None:
        if ok:
            results.append(("ok", area, msg))
        elif warn_only:
            results.append(("warn", area, msg))
        else:
            results.append(("FAIL", area, msg))

    # --- Python interpreter -------------------------------------------------
    vi = sys.version_info
    check(vi >= (3, 9), "python", f"{sys.version.split()[0]} (need >= 3.9)")

    missing = [m for m in REQUIRED_MODULES if importlib.util.find_spec(m) is None]
    check(not missing, "python-modules",
          "numpy, PIL, fontTools importable" if not missing
          else f"missing Python modules: {', '.join(missing)} "
               f"(install the library core tier: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps)")

    vmiss = [m for m in VOICE_MODULES if importlib.util.find_spec(m) is None]
    if vmiss:
        results.append(("warn", "python-modules",
                        f"note: {', '.join(vmiss)} not installed - only needed to regenerate speech.wav "
                        f"(pip install -r requirements-voice.txt, or keep the committed speech.wav and build with -SkipRegeneration)"))
    else:
        results.append(("ok", "python-modules", "voice regeneration modules present: edge_tts, imageio_ffmpeg"))

    # --- Film sources and canonical audio -----------------------------------
    for rel in REQUIRED_FILES:
        check((FILM / rel).is_file(), "film-files", f"{rel} present" if (FILM / rel).is_file() else f"missing {rel}")
    for rel in REQUIRED_DIRS:
        check((FILM / rel).is_dir() and any((FILM / rel).iterdir()), "film-files",
              f"{rel}/ present" if (FILM / rel).is_dir() else f"missing {rel}/")

    for name, want in APPROVED_SHA256.items():
        p = FILM / name
        if p.is_file():
            got = sha256(p)
            check(got == want, "audio-hash",
                  f"{name} sha256 {got[:12]}… matches approved v5" if got == want
                  else f"{name} sha256 {got[:12]}… differs from approved v5 {want[:12]}… "
                       f"(ok only if audio was deliberately regenerated)",
                  warn_only=True)

    try:
        tl = json.loads((FILM / "timeline.json").read_text(encoding="utf-8"))
        if isinstance(tl, list):
            n = len(tl)
            end = max((s.get("end", 0) for s in tl if isinstance(s, dict)), default=0)
            ok = n == 12 and abs(end - 60) < 0.01
            check(ok, "timeline", f"timeline.json: {n} scenes, last end={end} (expect 12 scenes / 60s)")
        else:
            dur = tl.get("duration", tl.get("dur")) if isinstance(tl, dict) else None
            check(dur == 60, "timeline", f"timeline.json duration={dur} (expect 60)")
    except Exception as e:  # noqa: BLE001 - report, don't traceback
        check(False, "timeline", f"timeline.json unreadable: {e}")

    # --- Library core --------------------------------------------------------
    for rel in CORE_FILES:
        p = LIB / rel
        check(p.is_file(), "library", f"{rel} present" if p.is_file() else f"missing {rel} (run from a full library checkout)")
    check((LIB / "package.json").is_file(), "library", "package.json present")

    nm = LIB / "node_modules"
    for pkg in ("playwright-core", "three"):
        check((nm / pkg).is_dir(), "node-modules",
              f"node_modules/{pkg} installed" if (nm / pkg).is_dir()
              else f"node_modules/{pkg} missing - run: npm ci  (or sh plugin/skills/lemo-opuscar/scripts/setup.sh deps)")

    # --- External tools ------------------------------------------------------
    node = shutil.which("node")
    if node:
        try:
            v = subprocess.run([node, "--version"], capture_output=True, text=True, timeout=15).stdout.strip()
            major = int(v.lstrip("v").split(".")[0])
            check(major >= 20, "tools", f"node {v} (need >= 20)")
        except Exception as e:  # noqa: BLE001
            check(False, "tools", f"node found but version check failed: {e}")
    else:
        check(False, "tools", "node not on PATH (need Node.js >= 20)")

    for tool in ("ffmpeg", "ffprobe"):
        check(shutil.which(tool) is not None, "tools",
              f"{tool} on PATH" if shutil.which(tool) else f"{tool} not on PATH (needed for mux/poster/voice)")

    # Headless browser: playwright-core resolves its own cache; PLAYWRIGHT_CHROME
    # may point at a chrome-headless-shell. Report-only: the render itself proves it.
    chrome = os.environ.get("PLAYWRIGHT_CHROME")
    if chrome:
        check(Path(chrome).is_file(), "browser", f"PLAYWRIGHT_CHROME -> {chrome}", warn_only=True)
    else:
        cache = Path.home() / "AppData/Local/ms-playwright"
        shells = (list(cache.glob("chromium_headless_shell-*/chrome-headless-shell-win64/chrome-headless-shell.exe"))
                  + list(cache.glob("chromium_headless_shell-*/chrome-headless-shell-linux*/chrome-headless-shell"))
                  + list(cache.glob("chromium_headless_shell-*/chrome-headless-shell-mac*/**/chrome-headless-shell"))) if cache.is_dir() else []
        check(bool(shells), "browser",
              "playwright chromium headless shell found in user cache" if shells
              else "no playwright chromium headless shell in the user cache - run: "
                   "node node_modules/playwright-core/cli.js install chromium-headless-shell "
                   "(or set PLAYWRIGHT_CHROME)", warn_only=True)

    if as_json:
        fails = [r for r in results if r[0] == "FAIL"]
        print(json.dumps({
            "ok": not fails,
            "python": sys.version.split()[0],
            "film": str(FILM),
            "library": str(LIB),
            "results": [{"status": s, "area": a, "message": m} for s, a, m in results],
        }, indent=2, ensure_ascii=False))
    else:
        for status, area, msg in results:
            print(f"{status:4} [{area}] {msg}")
        fails = sum(1 for s, _, _ in results if s == "FAIL")
        warns = sum(1 for s, _, _ in results if s == "warn")
        print(f"preflight: {'PASS' if not fails else 'FAIL'} "
              f"({len(results) - fails - warns} ok, {warns} warnings, {fails} failures)")
    return 1 if any(s == "FAIL" for s, _, _ in results) else 0


if __name__ == "__main__":
    sys.exit(main())
