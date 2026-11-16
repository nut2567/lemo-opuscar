from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
for tid,agent in [('panel-kirocrew-embedded','kirocrew-cli'),('panel-copilot-embedded','copilot-cli')]:
    p=ROOT/'.agent-runs'/tid/agent/'raw-response-1.txt'
    if not p.exists():continue
    raw=p.read_text(encoding='utf-8');content=raw
    if agent=='copilot-cli':
        messages=[]
        for row in raw.splitlines():
            try:d=json.loads(row)
            except ValueError:continue
            if d.get('type')=='assistant.message' and d.get('data',{}).get('content'):messages.append(d['data']['content'])
        content='\n\n'.join(messages)
    out=ROOT/'reviews'/f'{tid}-findings.md';out.write_text(content,encoding='utf-8')
    print(tid,content[:8000])
