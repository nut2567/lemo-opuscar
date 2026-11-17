param([int]$RenderWorkers=3,[string]$Version='',[switch]$SkipRegeneration)
$ErrorActionPreference='Stop'
$Film=$PSScriptRoot
$Library=(Resolve-Path (Join-Path $Film '../..')).Path
$Python='D:/workspace/ai-video/.venv/Scripts/python.exe'
$CaptionPython=Join-Path $Library '.venv/Scripts/python.exe'
$Suffix=if($Version){'-'+$Version}else{''}
$Final=Join-Path $Film ("horror-x-ep1-part1-60s"+$Suffix+".mp4")
$Picture=Join-Path $Film ("out/picture"+$Suffix+".mp4")
$Poster=Join-Path $Film ("poster"+$Suffix+".jpg")
function Check-Step([string]$Message){if($LASTEXITCODE -ne 0){throw $Message}}
Push-Location $Library
try{
 if(-not(Test-Path -LiteralPath (Join-Path $Library 'core/render/video.mjs'))){throw 'Library renderer not found'}
 if(-not $SkipRegeneration){
  if(-not(Test-Path -LiteralPath (Join-Path $Film 'speech.wav'))){& $Python (Join-Path $Film 'generate-voice.py');Check-Step 'Voice generation failed'}
  & $Python (Join-Path $Film 'finalize-timeline.py');Check-Step 'Narration/timing validation failed'
  & $CaptionPython (Join-Path $Film 'build-captions.py');Check-Step 'Caption build with actual Kanit font metrics failed'
  & $Python (Join-Path $Film 'sound-design.py');Check-Step 'Score/SFX mix failed'
  & $Python (Join-Path $Film 'mix-audio.py');Check-Step 'Dry narration mixing failed'
 }
 & $CaptionPython (Join-Path $Film 'tests/test_caption_measured_text.py');Check-Step 'Caption measured-text tests failed'
 & $Python (Join-Path $Film 'tests/test_audio_schedule.py');Check-Step 'Picture action/SFX scheduling tests failed'
 & $Python (Join-Path $Film 'tests/test_audio_mix.py');Check-Step 'Voice integration tests failed'
 & $CaptionPython (Join-Path $Film 'tests/test_pixel_noise.py');Check-Step 'Raster comparison tests failed'
 node --test (Join-Path $Film 'tests/contract.test.mjs') (Join-Path $Film 'tests/timeline-validation.test.mjs') (Join-Path $Film 'tests/scene02-runtime.test.mjs') (Join-Path $Film 'tests/actor-walk.test.mjs') (Join-Path $Film 'tests/caption-voice-alignment.test.mjs');Check-Step 'Contract tests failed'
 node (Join-Path $Film 'qa-render.mjs');Check-Step 'Browser/frame QA failed'
 node core/render/video.mjs $Film --fps 30 --workers $RenderWorkers --size 1080x1920 --out $Picture;Check-Step 'Picture render failed'
 if(Test-Path -LiteralPath $Final){Move-Item -LiteralPath $Final -Destination (Join-Path $Film ([IO.Path]::GetFileNameWithoutExtension($Final)+'-prev-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.mp4'))}
 & $Python (Join-Path $Film 'mux-final.py') $Picture (Join-Path $Film 'mixed-soundtrack.wav') $Final;Check-Step 'Final mux/check failed'
 ffmpeg -hide_banner -v error -y -i $Final -frames:v 1 -q:v 2 $Poster;Check-Step 'Poster failed'
 Write-Output $Final
}finally{Pop-Location}
