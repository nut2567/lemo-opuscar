from pathlib import Path
import subprocess
import numpy as np
from PIL import Image
p=Path(__file__).parent
source='films/horror-x-snowy-neon-code/out/full-180s/horror-x-snowy-neon-noon-180s.mp4'
buf=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',source,'-vf','fps=1,crop=1080:440:0:0,scale=270:110','-f','rawvideo','-pix_fmt','rgb24','-'])
f=np.frombuffer(buf,dtype=np.uint8).reshape(-1,110,270,3).astype(np.int16)
r,g,b=f.transpose(3,0,1,2)
sign=((r>135)&(r-g>35)&(b-g>12))|((g>145)&(g-r>32)&(b>100))
a=np.asarray(Image.open(p/'brand.png').getchannel('A').resize((270,45)))>70
for y in range(0,221,12):
    m=(sign[:,y//4:y//4+45,:]&a).sum(axis=(1,2))
    print(y, 'sign pixels', sum(m), 'affected seconds',sum(m>3), 'worst',max(m), 'at',m.argmax())
