// probe.mjs — behavioral verification for the Nun wet-street reflection fix.
// Run from anywhere:  node .agent-runs/neon-depth-revision/reflection/probe.mjs
// Checks: deterministic render at t=0/3.7/6.8, reflected-actor pixel
// contribution inside the wet street at 1080x1920 t=3.7, no SVG id
// collisions, no page errors. Exit non-zero on any failed check.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {openDemo,closeServer} from '../../../core/render/page.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const film=path.resolve(here,'../../../films/horror-x-snowy-neon-code');
const report={checks:{},frames:{},errors:[]};
const fail=(name,detail)=>{report.checks[name]=false;report.errors.push(name+': '+detail);};

// ---- minimal PNG decoder (8-bit, non-interlaced, color types 0/2/3/4/6) --
function decodePNG(buf){
 let pos=8,idat=[],w=0,h=0,bitDepth=0,colorType=0,interlace=0;
 while(pos+8<=buf.length){
  const len=buf.readUInt32BE(pos),type=buf.toString('ascii',pos+4,pos+8);
  const data=buf.subarray(pos+8,pos+8+len);
  if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];}
  else if(type==='IDAT')idat.push(data);
  else if(type==='IEND')break;
  pos+=12+len;
 }
 if(bitDepth!==8||interlace!==0)throw Error(`unsupported PNG bitDepth=${bitDepth} interlace=${interlace}`);
 const ch=colorType===6?4:colorType===2?3:colorType===0?1:colorType===4?2:colorType===3?1:0;
 if(!ch)throw Error('unsupported colorType '+colorType);
 const raw=zlib.inflateSync(Buffer.concat(idat));
 const stride=w*ch,bpp=ch,out=Buffer.alloc(w*h*ch);
 let p=0;
 for(let y=0;y<h;y++){
  const f=raw[p++],row=raw.subarray(p,p+stride);p+=stride;
  const prev=y?out.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
  const cur=out.subarray(y*stride,(y+1)*stride);
  for(let x=0;x<stride;x++){
   const a=x>=bpp?cur[x-bpp]:0,b=prev[x],c=x>=bpp?prev[x-bpp]:0;
   let v=row[x];
   if(f===1)v=(v+a)&255;else if(f===2)v=(v+b)&255;else if(f===3)v=(v+((a+b)>>1))&255;
   else if(f===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;}
   cur[x]=v;
  }
 }
 return {w,h,ch,data:out};
}
const luma=(d,i)=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];

let browser;
try{
 const opened=await openDemo(film,{w:1080,h:1920,warnings:true});
 browser=opened.browser;const page=opened.page;
 page.on('pageerror',e=>report.errors.push('pageerror: '+e.message));

 // 1) determinism at the three required times
 for(const t of [0,3.7,6.8]){
  await page.evaluate(t=>window.render(t),t);
  const a=await page.screenshot({type:'png'});
  await page.evaluate(t=>window.render(t),t);
  const b=await page.screenshot({type:'png'});
  report.checks['deterministic_t'+t]=a.equals(b);
  if(!a.equals(b))report.errors.push(`non-deterministic frame at t=${t}`);
 }

 // 2) reflection contribution: t=3.7, screenshot with and without #nunRefl
 await page.evaluate(()=>window.render(3.7));
 const on=await page.screenshot({type:'png'});
 fs.writeFileSync(path.join(here,'frame-3.7-reflection-on.png'),on);
 const hid=await page.evaluate(()=>{
  const g=document.getElementById('nunRefl');
  if(!g)return 'missing #nunRefl';
  g.setAttribute('opacity','0');return 'ok';
 });
 if(hid!=='ok')fail('reflectionGroupPresent',hid);
 const off=await page.screenshot({type:'png'});
 fs.writeFileSync(path.join(here,'frame-3.7-reflection-off.png'),off);

 const A=decodePNG(on),B=decodePNG(off);
 report.checks.sameSize=A.w===B.w&&A.h===B.h&&A.ch===B.ch;
 let diff=0,minX=1e9,maxX=-1,minY=1e9,maxY=-1,sumDA=0,sumDB=0;
 const n=A.w*A.h;
 const hits=[];
 for(let i=0;i<n;i++){
  const o=i*A.ch;
  const d=Math.abs(A.data[o]-B.data[o])+Math.abs(A.data[o+1]-B.data[o+1])+Math.abs(A.data[o+2]-B.data[o+2]);
  if(d>24){
   diff++;
   const x=i%A.w,y=(i/A.w)|0;
   hits.push([x,y]);
   if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
   sumDA+=luma(A.data,o);sumDB+=luma(B.data,o);
  }
 }
 report.frames.t37={changedPixels:diff,bbox:{minX,maxX,minY,maxY},
  meanLumaOn:diff?+(sumDA/diff).toFixed(2):0,meanLumaOff:diff?+(sumDB/diff).toFixed(2):0};
 // coarse occupancy map of the changed region: evidence the blob is
 // figure-shaped rather than noise
 if(diff>0){
  const gw=12,gh=14,cw=Math.max(1,Math.ceil((maxX-minX+1)/gw)),chh=Math.max(1,Math.ceil((maxY-minY+1)/gh));
  const grid=Array.from({length:gh},()=>Array(gw).fill(0));
  for(const [x,y] of hits){
   const cx=Math.min(gw-1,((x-minX)/cw)|0),cy=Math.min(gh-1,((y-minY)/chh)|0);grid[cy][cx]++;
  }
  report.frames.t37.diffMap=grid.map(r=>r.map(v=>v>40?'#':v>12?'+':v>2?'.':' ').join('')).join('\n');
 }
 // wet street starts near screen y~1370 at t3.7 (world curb 1440); the
 // reflection must live below it and be a compact figure-sized blob.
 report.checks.reflectionPixelsInStreet=diff>800&&minY>1350;
 report.checks.reflectionCompact=(maxY-minY)<500&&(maxX-minX)<600&&maxX>0;
 report.checks.reflectionBrightens=diff>0&&sumDA>sumDB;
 if(!(diff>800))report.errors.push(`only ${diff} changed px`);
 if(minY<=1350)report.errors.push(`diff reaches y=${minY} (above street)`);

 // 3) no duplicate ids inside the SVG overlay
 const ids=await page.evaluate(()=>{
  const out=[];
  document.querySelectorAll('#nunLayer [id]').forEach(e=>out.push(e.id));
  return out;
 });
 const seen=new Set(),dupes=ids.filter(i=>seen.has(i)?true:(seen.add(i),false));
 report.checks.noDuplicateSvgIds=dupes.length===0&&ids.length>0;
 if(dupes.length)report.errors.push('duplicate ids: '+dupes.join(','));
 report.svgIdCount=ids.length;

 // 4) markup sanity: mirrored group + banded uses present
 const struct=await page.evaluate(()=>{
  const r=document.getElementById('nunRefl'),m=document.getElementById('nunMir');
  return{refl:!!r,mir:!!m,uses:r?r.querySelectorAll('use').length:0,
   clips:document.querySelectorAll('#nunLayer clipPath').length};
 });
 report.checks.reflectionStructure=struct.refl&&struct.mir&&struct.uses>=10&&struct.clips>=14;
 report.structure=struct;
 if(!report.checks.reflectionStructure)report.errors.push('bad svg structure '+JSON.stringify(struct));

 report.passed=Object.values(report.checks).every(Boolean)&&!report.errors.some(e=>e.startsWith('pageerror'));
 fs.writeFileSync(path.join(here,'probe-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:report.passed,checks:report.checks,frames:report.frames,errors:report.errors}));
 if(!report.passed)process.exitCode=1;
}finally{await browser?.close();closeServer();}
process.exit(process.exitCode||0);
