#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$HERE/build.ps1")"
