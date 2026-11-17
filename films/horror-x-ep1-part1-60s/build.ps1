param(
 [int]$RenderWorkers=3,
 [string]$Version='',
 [switch]$SkipRegeneration,
 [switch]$Preflight,
 [switch]$SkipPreflight,
 [string]$Python='',
 [string]$CaptionPython=''
)
$ErrorActionPreference='Stop'
$Film=$PSScriptRoot
$Library=(Resolve-Path (Join-Path $Film '../..')).Path
$Suffix=if($Version){'-'+$Version}else{''}
$Final=Join-Path $Film ("horror-x-ep1-part1-60s"+$Suffix+".mp4")
$Picture=Join-Path $Film ("out/picture"+$Suffix+".mp4")
$Poster=Join-Path $Film ("poster"+$Suffix+".jpg")
$hint='Create one with: python -m venv .venv ; .venv/Scripts/pip install numpy pillow fonttools  (or run sh plugin/skills/lemo-opuscar/scripts/setup.sh deps at the library root)'

# --- Python interpreter resolution -------------------------------------------------
# Explicit -Python / $env:LEMO_PYTHON must be runnable AND have numpy/PIL/fontTools:
# an invalid explicit choice fails loudly, never falls back. Automatic discovery
# (film .venv, library .venv, python/python3/py on PATH) picks the first
# module-qualified interpreter for both -Preflight and real builds; only when none
# qualifies does -Preflight fall back to the first runnable interpreter so
# preflight.py can print the full FAIL report.
function Get-PythonInfo([string]$Exe){
 if(-not $Exe){return $null}
 $resolved=$Exe
 if(-not(Test-Path -LiteralPath $Exe)){
  $hit=Get-Command $Exe -ErrorAction SilentlyContinue
  if(-not $hit){return $null}
  $resolved=$hit.Source
 }
 & $resolved -c "print('ok')" 2>$null | Out-Null
 if($LASTEXITCODE -ne 0){return $null}
 $miss=& $resolved -c "import importlib.util;print(','.join(m for m in ('numpy','PIL','fontTools') if importlib.util.find_spec(m) is None))" 2>$null
 if($LASTEXITCODE -ne 0){return @{Exe=$resolved;Missing='(probe failed)'}}
 return @{Exe=$resolved;Missing=("$miss").Trim()}
}
function Resolve-Python([string]$Explicit,[string[]]$Auto){
 if($Explicit){
  $info=Get-PythonInfo $Explicit
  if(-not $info){throw "Python '$Explicit' is not runnable. $hint"}
  if($info.Missing){throw "Python '$($info.Exe)' is missing modules: $($info.Missing). $hint"}
  return $info.Exe
 }
 $firstRunnable=$null
 foreach($cand in $Auto){
  $info=Get-PythonInfo $cand
  if(-not $info){continue}
  if(-not $firstRunnable){$firstRunnable=$info}
  if(-not $info.Missing){return $info.Exe}
 }
 if($Preflight -and $firstRunnable){return $firstRunnable.Exe}   # let preflight.py report the missing modules
 throw "No usable Python found. Tried: $($Auto -join '; '). Required: an interpreter with numpy/PIL/fontTools. $hint"
}
$AutoCandidates=@()
foreach($root in @($Film,$Library)){
 foreach($rel in @('.venv/Scripts/python.exe','.venv/bin/python','.venv/bin/python3')){
  $p=Join-Path $root $rel
  if(Test-Path -LiteralPath $p){$AutoCandidates+=$p}
 }
}
foreach($cmd in @('python','python3','py')){
 $hit=Get-Command $cmd -ErrorAction SilentlyContinue
 if($hit){$AutoCandidates+=$hit.Source}
}
$AutoCandidates=@($AutoCandidates | Select-Object -Unique)
$ExplicitPython=if($Python){$Python}elseif($env:LEMO_PYTHON){$env:LEMO_PYTHON}else{$null}
$PyExe=Resolve-Python $ExplicitPython $AutoCandidates
# -CaptionPython is validated the same way when given explicitly.
if($CaptionPython){
 $capInfo=Get-PythonInfo $CaptionPython
 if(-not $capInfo){throw "CaptionPython '$CaptionPython' is not runnable. $hint"}
 if($capInfo.Missing){throw "CaptionPython '$($capInfo.Exe)' is missing modules: $($capInfo.Missing). $hint"}
}else{
 $CaptionPython=$PyExe
}
Write-Output "python: $PyExe"

function Check-Step([string]$Message){if($LASTEXITCODE -ne 0){throw $Message}}
Push-Location $Library
try{
 if(-not(Test-Path -LiteralPath (Join-Path $Library 'core/render/video.mjs'))){throw 'Library renderer not found'}
 # -SkipRegeneration rebuilds must use the exact approved v5 audio: preflight.py
 # turns the canonical soundtrack/mix hash check into a hard failure in that mode.
 $PreflightArgs=@()
 if($SkipRegeneration){$PreflightArgs+='--require-approved-audio'}
 if($Preflight){
  & $PyExe (Join-Path $Film 'preflight.py') @PreflightArgs;Check-Step 'Preflight failed'
  return
 }
 if(-not $SkipPreflight){
  & $PyExe (Join-Path $Film 'preflight.py') @PreflightArgs;Check-Step 'Preflight failed - fix the FAIL lines above (preflight.py --json for details)'
 }
 if(-not $SkipRegeneration){
  $vmiss=& $PyExe -c "import importlib.util;print(','.join(m for m in ('edge_tts','imageio_ffmpeg') if importlib.util.find_spec(m) is None))"
  if($LASTEXITCODE -eq 0 -and ("$vmiss").Trim()){
   throw "Voice regeneration needs edge_tts and imageio_ffmpeg; '$PyExe' lacks: $("$vmiss").Trim(). Install the voice tier (requirements-voice.txt) or rebuild with -SkipRegeneration to reuse speech.wav."
  }
  if(-not(Test-Path -LiteralPath (Join-Path $Film 'speech.wav'))){& $PyExe (Join-Path $Film 'generate-voice.py');Check-Step 'Voice generation failed'}
  & $PyExe (Join-Path $Film 'finalize-timeline.py');Check-Step 'Narration/timing validation failed'
  & $CaptionPython (Join-Path $Film 'build-captions.py');Check-Step 'Caption build with actual Kanit font metrics failed'
  & $PyExe (Join-Path $Film 'sound-design.py');Check-Step 'Score/SFX mix failed'
  & $PyExe (Join-Path $Film 'mix-audio.py');Check-Step 'Dry narration mixing failed'
 }
 & $CaptionPython (Join-Path $Film 'tests/test_caption_measured_text.py');Check-Step 'Caption measured-text tests failed'
 & $PyExe (Join-Path $Film 'tests/test_audio_schedule.py');Check-Step 'Picture action/SFX scheduling tests failed'
 & $PyExe (Join-Path $Film 'tests/test_audio_mix.py');Check-Step 'Voice integration tests failed'
 & $CaptionPython (Join-Path $Film 'tests/test_pixel_noise.py');Check-Step 'Raster comparison tests failed'
 node --test (Join-Path $Film 'tests/contract.test.mjs') (Join-Path $Film 'tests/timeline-validation.test.mjs') (Join-Path $Film 'tests/scene02-runtime.test.mjs') (Join-Path $Film 'tests/actor-walk.test.mjs') (Join-Path $Film 'tests/caption-voice-alignment.test.mjs');Check-Step 'Contract tests failed'
 node (Join-Path $Film 'qa-render.mjs');Check-Step 'Browser/frame QA failed'
 node core/render/video.mjs $Film --fps 30 --workers $RenderWorkers --size 1080x1920 --out $Picture;Check-Step 'Picture render failed'
 if(Test-Path -LiteralPath $Final){Move-Item -LiteralPath $Final -Destination (Join-Path $Film ([IO.Path]::GetFileNameWithoutExtension($Final)+'-prev-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.mp4'))}
 & $PyExe (Join-Path $Film 'mux-final.py') $Picture (Join-Path $Film 'mixed-soundtrack.wav') $Final;Check-Step 'Final mux/check failed'
 ffmpeg -hide_banner -v error -y -i $Final -frames:v 1 -q:v 2 $Poster;Check-Step 'Poster failed'
 Write-Output $Final
}finally{Pop-Location}
