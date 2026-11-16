"""Combine dry voice with the AGY-generated ducked score/SFX stem."""
from pathlib import Path
import json,subprocess,wave
import numpy as np
ROOT=Path(__file__).resolve().parent
SR=48000
def mix_arrays(voice,score):
    if voice.shape!=score.shape or voice.ndim!=2 or voice.shape[1]!=2:
        raise ValueError('Voice/score must have identical stereo shape; never silently pad narration')
    peak=float(np.max(np.abs(voice)))
    if peak<1e-6:raise ValueError('Dry narration is missing/silent')
    dry=voice*(.64/peak)
    vrms=float(np.sqrt(np.mean(dry*dry)));srms=float(np.sqrt(np.mean(score*score)))
    gain=vrms*10**(-18/20)/srms if srms>1e-9 else 0
    bed=score*gain
    mixed=dry+bed
    mpeak=float(np.max(np.abs(mixed)))
    if mpeak>.89:mixed*=.89/mpeak
    return mixed,{'voice_to_score_db':18 if srms>1e-9 else 999,'voice_input_peak':peak,'score_gain':gain,'mixed_peak':float(np.max(np.abs(mixed)))}
def read_audio(path):
    if not path.exists():raise FileNotFoundError(path)
    r=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True)
    if r.returncode:raise RuntimeError(r.stderr.decode(errors='replace'))
    a=np.frombuffer(r.stdout,dtype='<f4').reshape(-1,2).astype(np.float64)
    if abs(len(a)/SR-60)>.001:raise ValueError(f'{path.name} must be60s,got{len(a)/SR}')
    return a
if __name__=='__main__':
    voice=read_audio(ROOT/'speech.wav')
    # sound-design.py uses speech only to duck its bed; its output is a stem.
    score=read_audio(ROOT/'soundtrack.wav')
    mixed,report=mix_arrays(voice,score)
    with wave.open(str(ROOT/'mixed-soundtrack.wav'),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR)
        f.writeframes((np.clip(mixed,-1,1)*32767).astype('<i2').tobytes())
    (ROOT/'qa/audio-mix-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Mixed actual dry narration and ducked score/SFX; voice18dB above bed RMS')
