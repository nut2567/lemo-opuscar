from pathlib import Path
import json,subprocess,sys
from queue_state import locked
ROOT=Path(__file__).resolve().parent
PROFILE='D:/workspace/agent-profile/scripts/profile.py'
roles=[('grok','grok-cli','Sound-cue timing and source plot invariants. Suggest precise scene-relative cues, narration ducking and maxgap checks.'),('kirocrew','kirocrew-cli','Build reproducibility and data/schema compatibility. Identify actual contradictions or missing dependencies, not pending implementation as a failure.'),('copilot','copilot-cli','Static architecture, shared interface and file isolation audit. Identify concrete breakages in shown glue/build code.')]
if __name__=='__main__':
    # Correct false-positive CLI exit0 results; neither draft was usable.
    for agent,rid in [('grok-cli','d36b20fc255148c79438b4242422a5a3'),('kirocrew-cli','8b5b666af66948c7a22598a130bc54c1')]:
        f=ROOT/'.agent-runs/lead'/('panel-'+agent)/agent/'ledger-log.txt'
        for key in [f.read_text().splitlines()[0].strip(),rid]:
            subprocess.run([sys.executable,PROFILE,'--project',str(ROOT),'dispatch','finish',key,'--status','failed','--note','Payload inspection: no usable review; read approvals blocked/cancelled despite CLI exit0. Safe retry embeds source in prompt and requests no tools.'],capture_output=True)
    files=['TREATMENT.md','script.json','WORKER-CONTRACT.md','main.js','scene-kit.js','timeline.js','build.ps1','mux-final.py']
    context='\n'.join('\n===== '+name+' =====\n'+(ROOT/name).read_text(encoding='utf-8') for name in files)
    additions=[]
    for short,agent,role in roles:
        tid='panel-'+short+'-embedded'
        prompt=ROOT/'briefs'/f'{tid}.txt'
        prompt.write_text('DIRECT READ-ONLY REVIEW. You are NOT an Orca-dispatched worker; no native task/dispatch exists for you. Do not call tools, skills, shell, file reads, providers or agents. ALL source content needed is embedded below. Return only a concise audit with concrete findings and proposed corrections; do not promise later work. No file writes. Role: '+role+'\nPending scene/voice modules are intentionally in production. Review shown content only. Source context:\n'+context,encoding='utf-8')
        additions.append({'id':tid,'agent':agent,'outputs':[f'reviews/{tid}.txt'],'brief':str(prompt),'status':'queued'})
    with locked():
        f=ROOT/'TASK-QUEUE.json';tasks=json.loads(f.read_text(encoding='utf-8'))
        for t in tasks:
            if t['id'] in ['panel-grok-cli','panel-kirocrew-cli']:t.update(status='failed',result='No usable draft; tool approval blocked; corrected exit0 misclassification')
        existing={t['id'] for t in tasks};tasks.extend(x for x in additions if x['id'] not in existing)
        f.write_text(json.dumps(tasks,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Prepared3 safe no-tool text-only reviews; corrected false-positive outcomes')
