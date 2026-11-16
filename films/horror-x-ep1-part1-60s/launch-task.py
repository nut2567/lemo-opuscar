"""Launch one queued native task, record receipts/ledger. No worker polling."""
from pathlib import Path
import json,subprocess,sys
from queue_state import task_update
ROOT=Path(__file__).resolve().parent
PROFILE=Path('D:/workspace/agent-profile/scripts/profile.py')
RUN='run_32d499536938'

def run(args):
    r=subprocess.run(args,cwd=ROOT.parents[1],capture_output=True,text=True,encoding='utf-8',errors='replace')
    return r

if __name__=='__main__':
    taskid=sys.argv[1]
    task=task_update(taskid,{'status':'dispatching'},reserve=True)
    agent=task['agent']
    evidence=ROOT/'.agent-runs'/taskid/agent
    evidence.mkdir(parents=True,exist_ok=True)
    ledger=run([sys.executable,str(PROFILE),'--project',str(ROOT),'dispatch','log','--agent',agent,'--task',taskid,'--episode','horror-x-ep1-part1','--allow-other','--note',f'Native Orca; exclusive outputs {task["outputs"]}; evidence {evidence}'])
    (evidence/'ledger-log.txt').write_text(ledger.stdout+ledger.stderr,encoding='utf-8')
    task['ledger_receipt']=ledger.stdout.strip()
    command=['orca','orchestration','worker-start','--run',RUN,'--spec-file',task['brief'],'--task-title','p1-'+taskid,'--worktree','current','--agent',agent,'--timeout-ms','30000','--json']
    if agent=='opencode':command+=['--model','opencode/deepseek-v4.1-flash-free']
    # The explicit no-cost OpenCode route is fixed; other agents retain user-configured model.
    receipt=run(command)
    raw=receipt.stdout+receipt.stderr
    (evidence/'dispatch.txt').write_text(raw,encoding='utf-8')
    (evidence/'request.txt').write_text(Path(task['brief']).read_text(encoding='utf-8'),encoding='utf-8')
    task.update(status='dispatched' if receipt.returncode==0 else 'dispatch-failed',receipt_path=str(evidence/'dispatch.txt'))
    try:
        j=json.loads(receipt.stdout)
        task.update(dispatch_id=j.get('result',{}).get('dispatchId'),native_task_id=j.get('result',{}).get('taskId'))
    except ValueError:pass
    task_update(taskid,task)
    print(raw,flush=True)
    raise SystemExit(receipt.returncode)
