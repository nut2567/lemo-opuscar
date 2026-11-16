from pathlib import Path
import json,subprocess,sys
from queue_state import task_update
ROOT=Path(__file__).resolve().parent
PROFILE='D:/workspace/agent-profile/scripts/profile.py'
def run(args):return subprocess.run(args,cwd=ROOT.parents[1],capture_output=True,text=True,encoding='utf-8',errors='replace')
if __name__=='__main__':
    tid,agent=sys.argv[1:3]
    tasks=json.loads((ROOT/'TASK-QUEUE.json').read_text(encoding='utf-8'));old=next(t for t in tasks if t['id']==tid)
    assert old['status']=='failed'
    retrybase=tid+'-retry-'+agent
    retryid=retrybase;attempt=1
    while (ROOT/'.agent-runs'/retryid/agent).exists():
        attempt+=1;retryid=retrybase+'-'+str(attempt)
    evidence=ROOT/'.agent-runs'/retryid/agent;evidence.mkdir(parents=True,exist_ok=True)
    ledger=run([sys.executable,PROFILE,'--project',str(ROOT),'dispatch','log','--agent',agent,'--task',retryid,'--episode','horror-x-ep1-part1','--allow-other','--note',f'Reassign same native Task after confirmed {old["agent"]} failure and release; evidence {evidence}'])
    command=['orca','orchestration','worker-start','--run','run_32d499536938','--task',old['native_task_id'],'--retry-of',old['dispatch_id'],'--worktree','current','--agent',agent,'--json']
    if agent=='opencode':command+=['--model','opencode/deepseek-v4.1-flash-free']
    result=run(command);raw=result.stdout+result.stderr
    (evidence/'dispatch.txt').write_text(raw,encoding='utf-8');(evidence/'ledger-log.txt').write_text(ledger.stdout+ledger.stderr,encoding='utf-8')
    changes={'agent':agent,'status':'dispatched' if result.returncode==0 else 'dispatch-failed','prior_attempts':old.get('prior_attempts',[])+[{'agent':old['agent'],'dispatch_id':old['dispatch_id'],'ledger_receipt':old['ledger_receipt'],'result':old.get('result')}],'ledger_receipt':ledger.stdout.strip(),'evidence_task_id':retryid,'receipt_path':str(evidence/'dispatch.txt')}
    try:changes['dispatch_id']=json.loads(result.stdout)['result']['dispatchId']
    except (ValueError,KeyError):pass
    task_update(tid,changes)
    print(raw,flush=True)
