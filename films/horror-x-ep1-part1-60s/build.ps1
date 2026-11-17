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

# --- Python interpreter resolution -------------------------------------------------
# Order: -Python, $env:LEMO_PYTHON, film .venv, library .venv, python/python3 on PATH.
# No machine-specific paths: whatever works on this checkout is used. The chosen
# interpreter must import numpy, PIL and fontTools (the film's Python dependencies).
function Find-PythonCandidates {
 $c=@()
 if($Python){$c+=$Python}
 if($env:LEMO_PYTHON){$c+=$env:LEMO_PYTHON}
 foreach($root in @($Film,$Library)){
  foreach($rel in @('.venv/Scripts/python.exe','.venv/bin/python','.venv/bin/python3')){
   $p=Join-Path $root $rel
   if(Test-Path -LiteralPath $p){$c+=$p}
  }
 }
 foreach($cmd in @('python','python3','py')){
  $hit=Get-Command $cmd -ErrorAction SilentlyContinue
  if($hit){$c+=$hit.Source}
 }
 return ($c | Select-Object -Unique)
}
function Test-Python([string]$Exe,[switch]$NeedModules){
 if(-not $Exe){return $null}
 $resolved=$Exe
 if(-not(Test-Path -LiteralPath $Exe)){
  $hit=Get-Command $Exe -ErrorAction SilentlyContinue
  if(-not $hit){return $null}
  $resolved=$hit.Source
 }
 if($NeedModules){
  $probe="import importlib.util,sys;print(','.join(m for m in ('numpy','PIL','fontTools') if importlib.util.find_spec(m) is None))"
 }else{
  $probe="print('ok')"
 }
 $missing=& $resolved -c $probe 2>$null
 if($LASTEXITCODE -ne 0){return $null}
 $miss=if($NeedModules){("$missing").Trim()}else{''}
 return @{Exe=$resolved;Missing=$miss}
}
$hint='Create one with: python -m venv .venv ; .venv/Scripts/pip install numpy pillow fonttools  (or run sh plugin/skills/lemo-opuscar/scripts/setup.sh deps at the library root)'
$PyInfo=$null;$Tried=@();$MissingInfo=$null
foreach($cand in (Find-PythonCandidates)){
 $info=Test-Python $cand -NeedModules:(-not $Preflight)
 if(-not $info){$Tried+=$cand;continue}
 if($info.Missing){if(-not $MissingInfo){$MissingInfo=$info};$Tried+=$cand;continue}
 $PyInfo=$info;break
}
if(-not $PyInfo){$PyInfo=$MissingInfo}
if(-not $PyInfo){
 throw "No usable Python found. Tried: $($Tried -join '; '). Required: an interpreter with numpy/PIL/fontTools. $hint"
}
$PyExe=$PyInfo.Exe
if($PyInfo.Missing){
 throw "Python '$PyExe' is missing modules: $($PyInfo.Missing). $hint"
}
# Captions/tests need the same interpreter; -CaptionPython remains for override.
if(-not $CaptionPython){$CaptionPython=$PyExe}elseif(-not(Test-Path -LiteralPath $CaptionPython)){$CaptionPython=$PyExe}
Write-Output "python: $PyExe"

function Check-Step([string]$Message){if($LASTEXITCODE -ne 0){throw $Message}}
Push-Location $Library
try{
 if(-not(Test-Path -LiteralPath (Join-Path $Library 'core/render/video.mjs'))){throw 'Library renderer not found'}
 if($Preflight){
  & $PyExe (Join-Path $Film 'preflight.py');Check-Step 'Preflight failed'
  return
 }
 if(-not $SkipPreflight){
  & $PyExe (Join-Path $Film 'preflight.py');Check-Step 'Preflight failed - fix the FAIL lines above (preflight.py --json for details)'
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
