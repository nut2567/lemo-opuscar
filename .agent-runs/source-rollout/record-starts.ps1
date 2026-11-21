$ErrorActionPreference='Stop'
$root='E:/AI/Ai-Video'
$profile='E:/AI/agent-profile/scripts/profile.py'
$python="$root/.venv/Scripts/python.exe"
$ledger=Join-Path $PSScriptRoot 'ledger-ids.json'
$ids=@{}
if(Test-Path $ledger) {
  $known=Get-Content -Encoding utf8 $ledger -Raw | ConvertFrom-Json
  $known.PSObject.Properties | ForEach-Object { $ids[$_.Name]=$_.Value }
}
Get-ChildItem (Join-Path $PSScriptRoot 'receipts') -Filter '*.out.json' | Where-Object Length -gt 0 | ForEach-Object {
  $name=$_.Name.Replace('.out.json','')
  if($ids.ContainsKey($name)){return}
  $receipt=Get-Content -Encoding utf8 $_.FullName -Raw | ConvertFrom-Json
  $dc=$receipt.result.dispatchId
  $note=if($receipt.ok){"Orca $($receipt.result.runId) $dc source package"}else{"Failed worker start recorded in $($_.Name)"}
  $project=if($name.StartsWith('lemo-')){'E:/AI/lemo-opuscar'}else{$root}
  $episode=if($name.StartsWith('lemo-')){$name.Substring(5)}else{$name}
  $id=& $python $profile --project $project dispatch log --agent devin-cli --task "source-rollout-$name" --episode $episode --allow-other --note $note
  if($LASTEXITCODE -ne 0){throw "Failed to record dispatch for $name"}
  $ids[$name]=$id.Trim()
  if(-not $receipt.ok){& $python $profile --project $project dispatch finish $ids[$name] --status failed --note 'See the saved native Orca receipt.'}
}
$ids | ConvertTo-Json | Set-Content -Encoding utf8 $ledger
$ids.GetEnumerator() | Sort-Object Name | Select-Object Name,Value | Format-Table
