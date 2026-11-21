import {createServer} from 'node:http';
import {createReadStream, statSync} from 'node:fs';
import {copyFile, mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {resolve, dirname, extname, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const work = resolve(here, 'work');
const timeline = JSON.parse(await readFile(resolve(here,'timeline.json'),'utf8'));
const qa = process.argv.includes('--qa');
const slice = process.argv.find(arg => arg.startsWith('--shot='));
const width = Number(process.env.FILM_WIDTH || 720);
const mime = {'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.ttf':'font/ttf'};
const server = createServer((request, response) => {
  try{
    const pathname = new URL(request.url,'http://localhost').pathname;
    const filepath = resolve(root,'.'+pathname);
    const allowed = [here,resolve(root,'node_modules/three')].some(base=>{
      const child=relative(base,filepath);
      return child && !child.startsWith('..');
    });
    if(!allowed || !statSync(filepath).isFile() || !mime[extname(filepath)]) throw new Error('not found');
    response.writeHead(200,{'Content-Type':mime[extname(filepath)]});
    createReadStream(filepath).pipe(response);
  }catch {
    response.writeHead(404).end();
  }
});
server.listen(0,'127.0.0.1');
await once(server,'listening');

const stage = `http://127.0.0.1:${server.address().port}/films/ant-broke-empty-winter/stage.html?width=${width}`;
const fmt = seconds => {
  const cs=Math.round(seconds*100);
  return `${Math.floor(cs/360000)}:${String(Math.floor(cs/6000)%60).padStart(2,'0')}:${String(Math.floor(cs/100)%60).padStart(2,'0')}.${String(cs%100).padStart(2,'0')}`;
};
const lastingEnd = timeline.shots.find(s=>s.id==='20');
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
ScaledBorderAndShadow: yes
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Kanit SemiBold,40,&H00F8F7F4,&H00F8F7F4,&H000E121B,&H880B1019,0,0,0,0,100,100,0,0,1,3,2,2,49,49,130,1
Style: Payoff,Kanit SemiBold,112,&H00E5E6FF,&H00E5E6FF,&H00262334,&H990C1B31,0,0,0,0,100,100,1,0,1,4,2,8,32,32,187,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`+timeline.shots.flatMap(s=>s.captions).map(c=>`Dialogue: 0,${fmt(c.start)},${fmt(c.end)},Caption,,0,0,0,,${c.text}`).join('\n')
+`\nDialogue: 0,${fmt(lastingEnd.captions[1].start+.25)},${fmt(lastingEnd.end-.2)},Payoff,,0,0,0,,{\\fad(150,210)}หมด!\n`;

await mkdir(work,{recursive:true});
await mkdir(resolve(work,'fonts'),{recursive:true});
await copyFile(resolve(here,'Kanit-SemiBold.ttf'),resolve(work,'fonts/Kanit-SemiBold.ttf'));
await writeFile(resolve(work,'subtitles.ass'),ass);
let browser;
let encoder;
try{
  browser = await chromium.launch({
    channel: 'chrome', headless: true,
    args: ['--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-vsync','--disable-frame-rate-limit',
      '--use-angle=d3d11','--disable-background-timer-throttling']
  });
  const page=await browser.newPage({viewport:{width,height:width*16/9}});
  page.on('pageerror', error=>console.error(error));
  await page.goto(stage);
  await page.waitForFunction(()=>Boolean(window.stage),{timeout:15000});
  console.log('Renderer:',await page.evaluate(()=>stage.gpu()));
  const payload=(s,u)=>[Number(s.id),u,s.id==='21'?u*.08:s.start+u*(s.end-s.start)];

  if(qa){
    const dir=resolve(here,'qa');
    await mkdir(dir,{recursive:true});
    for(const shot of timeline.shots){
      const list=[.25,.59,.89];
      const pics=await page.evaluate(args=>stage.frames(args),list.map(u=>payload(shot,u)));
      await Promise.all(pics.map((p,i)=>writeFile(resolve(dir,`${shot.id}-${i}.jpg`),Buffer.from(p,'base64'))));
    }
  }else{
    const selection=timeline.shots.filter(s=>!slice || s.id===slice.split('=')[1]);
    if(!selection.length) throw new Error('Unknown shot');
    const start=selection[0].start;
    const duration=selection.at(-1).end-start;
    const name=slice?`work/shot-${selection[0].id}.mp4`:'work/mot-empty-winter.tmp.mp4';
    const filter=(slice?`setpts=PTS+${start}/TB,`:'')
      + 'vignette=angle=0.32,ass=work/subtitles.ass:fontsdir=work/fonts'
      + (slice?`,setpts=PTS-${start}/TB`:'')+',format=yuv420p';
    encoder=spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y',
      '-f','image2pipe','-framerate', String(timeline.fps),'-vcodec','mjpeg','-i','-',
      '-ss',String(start),'-i','work/mix.wav','-t',String(duration),
      '-map','0:v:0','-map','1:a:0','-vf',filter,
      '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
      '-c:v','libx264','-preset','fast','-crf','17','-af','loudnorm=I=-14:TP=-1.4:LRA=8',
      '-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',name],
      {cwd:here,stdio:['pipe','inherit','inherit']});
    const encoded=once(encoder,'exit');
    encoder.stdin.on('error',error=>console.error(error.message));
    const started=Date.now();
    let written=0;
    for (const shot of selection){
      const frames=Math.round((shot.end-shot.start)*timeline.fps);
      for(let i=0;i<frames;i+=10){
        const batch=Array.from({length:Math.min(10,frames-i)},(_,j)=>payload(shot,(i+j)/Math.max(1,frames-1)));
        const images=await page.evaluate(args=>stage.frames(args),batch);
        if(encoder.exitCode!==null) throw new Error('FFmpeg stopped receiving frames');
        for(const jpg of images){
          if(!encoder.stdin.write(Buffer.from(jpg,'base64'))) await once(encoder.stdin,'drain');
        }
        written+=images.length;
      }
      console.log(`Shot ${shot.id} · ${written} frames at ${(written/((Date.now()-started)/1000)).toFixed(1)} fps`);
    }
    encoder.stdin.end();
    const [exitCode]=await encoded;
    if(exitCode!==0) throw new Error(`FFmpeg exited with ${exitCode}`);
    const expected=Math.round(duration*timeline.fps);
    if(written!==expected) throw new Error(`Wrote ${written}/${expected} frames`);
    if(!slice) await rename(resolve(here,name),resolve(here,'mot-empty-winter.mp4'));
  }
} finally {
  if(encoder?.exitCode===null) encoder.stdin.end();
  await browser?.close();
  server.close();
}
