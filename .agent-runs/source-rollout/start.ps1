param([Parameter(Mandatory=$true)][string]$Run, [Parameter(Mandatory=$true)][string[]]$Episode)
$ErrorActionPreference='Stop'
$evidence=Join-Path $PSScriptRoot 'receipts'
$specs=Join-Path $PSScriptRoot 'specs'
$starts=foreach($name in $Episode){
  $brief=Join-Path $specs "$name.md"
  $repoId=if($name.StartsWith('lemo-')){'b5103d8a-6297-4f14-a209-66e38ea86f5e'}else{'c98c18b9-7654-403d-aa24-c877109d91db'}
  $args="orchestration worker-start --environment local --run $Run --spec-file $brief --task-title $name --worktree new-top-level --repo id:$repoId --name ship-$name --base-branch main --setup skip --agent devin --json --timeout-ms 60000"
  $process=Start-Process -FilePath $env:ORCA_CLI_COMMAND -WindowStyle Hidden -PassThru -WorkingDirectory (Get-Location) -ArgumentList $args -RedirectStandardOutput (Join-Path $evidence "$name.out.json") -RedirectStandardError (Join-Path $evidence "$name.err.txt")
  $null=$process.Handle
  [pscustomobject]@{Name=$name;Process=$process}
}
foreach($start in $starts){
  $start.Process.WaitForExit()
  "$($start.Name) exit $($start.Process.ExitCode)"
  Get-Content (Join-Path $evidence "$($start.Name).out.json"),(Join-Path $evidence "$($start.Name).err.txt")
}
