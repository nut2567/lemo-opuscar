"""Record one received native completion and release its worker; no polling."""
from pathlib import Path
import json,subprocess,sys
from queue_state import task_update
ROOT=Path(__file__).resolve().parent
PROFILE='D:/workspace/agent-profile/scripts/profile.py'
if __name__=='__main__':
    tid,outcome,note=sys.argv[1],sys.argv[2],sys.argv[3]
    tasks=json.loads((ROOT/'TASK-QUEUE.json').read_text(encoding='utf-8'))
    task=next(t for t in tasks if t['id']==tid)
    evidence=ROOT/'.agent-runs'/task.get('evidence_task_id',tid)/task['agent']
    evidence.mkdir(parents=True,exist_ok=True)
    (evidence/'result.txt').write_text(note,encoding='utf-8')
    if task.get('dispatch_id'):
        raw=subprocess.run(['orca','orchestration','worker-read','--dispatch',task['dispatch_id']],capture_output=True,text=True,encoding='utf-8',errors='replace')
        (evidence/'worker-transcript.txt').write_text(raw.stdout+raw.stderr,encoding='utf-8')
        released=subprocess.run(['orca','orchestration','worker-release','--dispatch',task['dispatch_id'],'--json'],capture_output=True,text=True,encoding='utf-8',errors='replace')
        (evidence/'release.json').write_text(released.stdout+released.stderr,encoding='utf-8')
        print(released.stdout,flush=True)
    ledger=task.get('ledger_receipt','').splitlines()[0].strip()
    if ledger:
        r=subprocess.run([sys.executable,PROFILE,'--project',str(ROOT),'dispatch','finish',ledger,'--status',outcome,'--note',note],capture_output=True,text=True,encoding='utf-8',errors='replace')
        (evidence/'ledger-finish.txt').write_text(r.stdout+r.stderr,encoding='utf-8')
        print(r.stdout,flush=True)
    task.update(status='delivered-pending-integration' if outcome=='done' else outcome,result=note)
    task_update(tid,task)
