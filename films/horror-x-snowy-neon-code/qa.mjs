import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openDemo,closeServer,server,ROOT} from '../../core/render/page.mjs';
import {pageURL} from '../../core/render/serve.mjs';
import {DEFAULT_MODEL,CHARACTER_MODELS,getCharacterModel,renderCharacter} from '../../models/registry.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const qa=path.join(here,'qa');fs.mkdirSync(qa,{recursive:true});
const report={format:'1080x1920',duration:7.5,source:'Canvas2D procedural modules',frames:[],checks:{},errors:[]};
let browser;
try{
 // Registry contract (pure module, safe in Node): canonical sources are
 // byte-identical copies, ids are unique, the default is 'cel', 'noon' is
 // selectable, renders are deterministic/distinct/uid-namespaced, and an
 // unknown id is rejected.
 const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
 const canonical=[
  ['../../models/cel/cel-body.js','models/cel/cel-body.js'],
  ['../../models/cel/cel-face.js','models/cel/cel-face.js'],
  ['../../models/cel/cel-hair.js','models/cel/cel-hair.js'],
  ['../../models/cel/cel-eyes.js','models/cel/cel-eyes.js'],
  ['../../models/cel/cel-woman.js','models/cel/cel-woman.js'],
  ['../../models/noon/original-actor.js','assets/original-actor.js'],
 ];
 report.checks.registryCanonicalSources=canonical.every(([a,b])=>sha(path.join(here,a))===sha(path.join(here,b)));
 const ids=Object.keys(CHARACTER_MODELS);
 report.checks.registryIdsUnique=new Set(ids).size===ids.length&&ids.includes('cel')&&ids.includes('noon');
 report.checks.registryDefaultModel=DEFAULT_MODEL==='cel'&&getCharacterModel().id==='cel'&&getCharacterModel('cel').id==='cel'&&getCharacterModel('noon').id==='noon';
 report.checks.registryRejectsUnknown=(()=>{try{getCharacterModel('bogus');return false;}catch(e){return e instanceof RangeError;}})();
 report.checks.registryDeterministic=renderCharacter(3.7)===(renderCharacter(3.7));
 report.checks.registryModelsDistinct=renderCharacter(3.7,{model:'cel'})!==renderCharacter(3.7,{model:'noon'});
 const idsOf=s=>[...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 const markA=renderCharacter(3.7,{uid:'qa-a'}),markB=renderCharacter(3.7,{uid:'qa-b'});
 report.checks.registryUidNamespaces=idsOf(markA).every(i=>!idsOf(markB).includes(i))&&markA!==markB;
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
 // Default character model is the registry 'cel'; FRAME_META reports it per frame.
 report.checks.characterModelDefault=await page.evaluate(()=>window.CHARACTER_MODEL==='cel'&&window.FRAME_META.characterModel==='cel');
 // Invalid ?model= must fail loudly at module load with a helpful error.
 {
  const {port}=await server();
  const bad=await browser.newPage();
  const badErrs=[];bad.on('pageerror',e=>badErrs.push(e.message));
  await bad.goto(`${pageURL(ROOT,port,here)}?model=bogus`).catch(()=>{});
  await bad.waitForTimeout(400);
  report.checks.invalidModelRejected=badErrs.some(m=>/unknown \?model/.test(m));
  await bad.close();
 }
 // Alternate model: ?model=noon is an explicit opt-in and renders distinct markup.
 {
  const alt=await openDemo(here,{w:1080,h:1920,warnings:true,q:'model=noon'});
  try{
   const altPage=alt.page;
   await altPage.evaluate(()=>window.render(3.7));
   report.checks.alternateModelSelection=await altPage.evaluate(()=>window.CHARACTER_MODEL==='noon'&&window.FRAME_META.characterModel==='noon');
   const celMark=await page.evaluate(()=>{window.render(3.7);return document.getElementById('nunCam').innerHTML;});
   const noonMark=await altPage.evaluate(()=>document.getElementById('nunCam').innerHTML);
   report.checks.alternateModelDistinct=celMark!==noonMark;
  }finally{await alt.browser.close();}
 }
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
