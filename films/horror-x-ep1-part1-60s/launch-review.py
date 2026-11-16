"""Invoke one configured direct free-panel review and retain actual provider outcome."""
from pathlib import Path
import json,subprocess,sys
from queue_state import task_update
ROOT=Path(__file__).resolve().parent
PROFILE='D:/workspace/agent-profile/scripts/profile.py'
def run(args):return subprocess.run(args,cwd=ROOT.parents[1],capture_output=True,text=True,encoding='utf-8',errors='replace')
if __name__=='__main__':
    tid=sys.argv[1]
    task=task_update(tid,{'status':'dispatching'},reserve=True)
    agent=task['agent']; evidence=ROOT/'.agent-runs'/'lead'/tid/agent;evidence.mkdir(parents=True,exist_ok=True)
    ledger=run([sys.executable,PROFILE,'--project',str(ROOT),'dispatch','log','--agent',agent,'--task',tid,'--episode','horror-x-ep1-part1','--note',f'Bounded read-only direct review; runner evidence {evidence}'])
    task.update(status='direct-running',ledger_receipt=ledger.stdout.strip(),receipt_path=str(evidence/'runner-receipt.txt'))
    (evidence/'ledger-log.txt').write_text(ledger.stdout+ledger.stderr,encoding='utf-8')
    task_update(tid,task)
    cmd=[sys.executable,PROFILE,'--project',str(ROOT)]
    if agent in ['gemini-cli','kilo-cli','grok-cli']:
        cmd+=['run','--agent',agent,'--prompt-file',task['brief'],'--task',tid,'--timeout','120','--execute']
    else:
        cmd+=['agents','run','--agent',agent,'--route','direct','--prompt-file',task['brief'],'--task',tid,'--timeout','120','--access','selected-account' if agent=='copilot-cli' else 'free','--confirm-access','--execute']
        if agent=='kirocrew-cli':cmd+=['--allow-unsandboxed']
    raw=run(cmd); result=raw.stdout+raw.stderr
    (evidence/'runner-receipt.txt').write_text(result,encoding='utf-8')
    (ROOT/task['outputs'][0]).write_text(result,encoding='utf-8')
    try: obj=json.loads(raw.stdout);ok=raw.returncode==0 and obj.get('ok',True) is not False
    except ValueError: obj={};ok=False
    # Review the provider's actual payload later as well; exit0 alone is not acceptance.
    note=f'Actual configured direct invocation exit={raw.returncode}; receipt/review retained; no account/plan preflight or fallback.'
    finish=run([sys.executable,PROFILE,'--project',str(ROOT),'dispatch','finish',task['ledger_receipt'].splitlines()[0],'--status','done' if ok else 'failed','--note',note])
    (evidence/'ledger-finish.txt').write_text(finish.stdout+finish.stderr,encoding='utf-8')
    # Other launch/settle operations may have changed the queue while this provider ran.
    task_update(tid,{'status':'returned-for-review' if ok else 'failed','result':note})
    print(json.dumps({'task':tid,'exit':raw.returncode,'ok':ok,'receipt':str(evidence/'runner-receipt.txt'),'summary':result[:2500]},ensure_ascii=False),flush=True)
