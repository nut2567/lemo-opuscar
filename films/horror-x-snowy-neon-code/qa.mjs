import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openDemo,closeServer} from '../../core/render/page.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const qa=path.join(here,'qa');fs.mkdirSync(qa,{recursive:true});
const report={format:'1080x1920',duration:7.5,source:'Canvas2D procedural modules',frames:[],checks:{},errors:[]};
let browser;
try{
 const opened=await openDemo(here,{w:1080,h:1920,warnings:true});browser=opened.browser;const page=opened.page;
 page.on('pageerror',e=>report.errors.push(e.message));
 const hashFrame=async t=>{
   await page.evaluate(t=>window.render(t),t);
   // Hash the composed page (Canvas world + inline-SVG Nun overlay), not
   // just the canvas bitmap, so the Nun contributes to the frame hash.
   const shot=await page.screenshot({type:'png'});
   return crypto.createHash('sha256').update(shot).digest('hex');
 };
 const first=await hashFrame(6.15);await hashFrame(.3);await hashFrame(3.5);const again=await hashFrame(6.15);
 report.checks.randomAccessDeterministic=first===again;
 for(const t of [0,1.2,2.49,2.5,3.7,4.99,5,6.15,6.4,6.7,7,7.4666667]){
   const hash=await hashFrame(t);
   const pixels=await page.evaluate(()=>{
     const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
     let black=0,lit=0,total=0,luma=0;
     for(let i=0;i<d.length;i+=64){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];black+=y<2;lit+=y>85;luma+=y;total++;}
     return{meanLuma:luma/total,nearBlackFraction:black/total,litFraction:lit/total};
   });
   report.frames.push({time:t,sha256:hash,...pixels});
   if([1.2,3.7,6.15,6.4,6.7,7].includes(t))await page.screenshot({path:path.join(qa,`frame-${t}.png`)});
 }
 await page.evaluate(()=>window.render(6.15));await page.screenshot({path:path.join(here,'poster.png')});
 report.resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(x=>({url:x.name,initiator:x.initiatorType})));
 report.checks.noRemoteResources=report.resources.every(x=>new URL(x.url).hostname==='127.0.0.1');
 report.checks.noImageElements=await page.evaluate(()=>document.images.length===0);
 report.checks.duration=await page.evaluate(()=>window.DUR===7.5);
 report.checks.notBlank=report.frames.every(x=>x.nearBlackFraction<.99&&x.litFraction>.001);
 report.checks.motionPresent=report.frames[1].sha256!==report.frames[0].sha256;
 report.checks.noPageErrors=report.errors.length===0;
 report.sources={};
 for(const name of ['main.mjs','environment.mjs','neon.mjs','characters.mjs','weather.mjs','assets/original-actor.js']){
   const src=fs.readFileSync(path.join(here,name),'utf8');
   report.sources[name]={sha256:crypto.createHash('sha256').update(src).digest('hex'),externalRasterLoader:/new\s+Image\s*\(|\bfetch\s*\(|https?:\/\//.test(src)};
 }
 report.checks.noExternalRasterLoaders=Object.values(report.sources).every(v=>!v.externalRasterLoader);
 report.passed=Object.values(report.checks).every(Boolean);
 fs.writeFileSync(path.join(qa,'runtime-report.json'),JSON.stringify(report,null,2));
 if(!report.passed)throw Error('Runtime verification failed: '+JSON.stringify(report.checks));
 console.log(JSON.stringify({passed:report.passed,checks:report.checks,poster:path.join(here,'poster.png')}));
}finally{await browser?.close();closeServer();}
