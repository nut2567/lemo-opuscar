from pathlib import Path
import json,shutil
ROOT=Path(__file__).resolve().parent
if __name__=='__main__':
    voice=json.loads((ROOT/'voice-timeline.json').read_text(encoding='utf-8'))
    scenes=voice['scenes'];assert len(scenes)==12
    cursor=0;gaps=[]
    for i,s in enumerate(scenes):
        assert s['id']==f'{i+1:02d}'
        assert abs(s['start']-cursor)<1e-4,(s['id'],'gap/overlap')
        assert 4-.01<=s['end']-s['start']<=6+.01,(s['id'],'duration outside4–6')
        assert s['start']-.01<=s['speechStart']<s['speechEnd']<=s['end']+.01,(s['id'],'word clipped')
        if i:gaps.append(s['speechStart']-scenes[i-1]['speechEnd'])
        cursor=s['end']
    gaps.extend([scenes[0]['speechStart'],60-scenes[-1]['speechEnd']])
    assert abs(cursor-60)<1e-4
    assert max(gaps)<=.351,('dead air',max(gaps))
    (ROOT/'timeline.json').write_text(json.dumps(scenes,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'qa/voice-gap-check.json').write_text(json.dumps({'scene_count':12,'duration':cursor,'max_interline_gap':max(gaps),'speech_seconds':sum(s['speechEnd']-s['speechStart'] for s in scenes),'gaps':gaps},indent=2),encoding='utf-8')
    print('12 scenes continuous0..60s; max narration gap',max(gaps))
