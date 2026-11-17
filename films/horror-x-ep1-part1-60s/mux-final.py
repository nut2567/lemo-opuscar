from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parent
def run(args):
    r=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace')
    if r.returncode:raise RuntimeError(r.stderr[-5000:])
    return r
if __name__=='__main__':
    # Optional positional args: <picture.mp4> <soundtrack.wav> <out.mp4>
    # Defaults reproduce the original v3 behaviour exactly.
    picture=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'out/picture.mp4'
    soundtrack=Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/'mixed-soundtrack.wav'
    out=Path(sys.argv[3]) if len(sys.argv)>3 else ROOT/'horror-x-ep1-part1-60s.mp4'
    tag=out.stem.replace('horror-x-ep1-part1-60s','').strip('-')
    suffix='-'+tag if tag else ''
    base='loudnorm=I=-18:TP=-1.5:LRA=11'
    measure=run(['ffmpeg','-hide_banner','-i',str(soundtrack),'-af',base+':print_format=json','-f','null','-'])
    m=json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}',measure.stderr)[-1])
    filt=base+':linear=true:print_format=json'+''.join(f':{k}={m[v]}' for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])
    result=run(['ffmpeg','-hide_banner','-y','-i',str(picture),'-i',str(soundtrack),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',filt,'-c:a','aac','-b:a','192k','-ar','48000','-t','60','-movflags','+faststart',str(out)])
    run(['ffmpeg','-hide_banner','-v','error','-i',str(out),'-f','null','-'])
    probe=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(out)]).stdout)
    v=next(x for x in probe['streams'] if x['codec_type']=='video')
    a=next((x for x in probe['streams'] if x['codec_type']=='audio'),None)
    assert a is not None,'No audio stream found in final mux'
    assert (a['codec_name'],a['sample_rate'],a['channels'])==('aac','48000',2),f"Audio mismatch: {a['codec_name']},{a['sample_rate']},{a['channels']}"
    assert(v['width'],v['height'])==(1080,1920)
    assert v['r_frame_rate']=='30/1' and int(v.get('nb_read_frames') or v.get('nb_frames') or 0)==1800
    assert abs(float(probe['format']['duration'])-60)<.05
    (ROOT/f'qa/final-probe{suffix}.json').write_text(json.dumps(probe,indent=2),encoding='utf-8')
    (ROOT/f'qa/mux-loudness{suffix}.txt').write_text(result.stderr,encoding='utf-8')
    print('Verified60s,1800frames,1080x1920@30fps; normalized-18LUFS')
    print(out)
