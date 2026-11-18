import {drawEnvironment,drawFacadeForReflection} from './environment.mjs';
import {drawNeon,initNeon,signLines,fontStatus} from './neon.mjs';
import {drawCharacters,characterMarkup} from './characters.mjs';
import {getCharacterModel,CHARACTER_MODELS,DEFAULT_MODEL} from '../../models/registry.mjs';
import {drawWeather,drawPost} from './weather.mjs';

const W=1080,H=1920,GROUND=1440;
const canvas=document.getElementById('film'),ctx=canvas.getContext('2d',{alpha:false});
const world=document.createElement('canvas');world.width=W;world.height=H;
const wc=world.getContext('2d',{alpha:false});
const reflection=document.createElement('canvas');reflection.width=W;reflection.height=H-GROUND;
const rc=reflection.getContext('2d');
// Inline-SVG layer for the registry character rig. It shares the Canvas camera:
// viewBox 1080x1920 + preserveAspectRatio="none" reproduces the canvas'
// independent x/y fit, and nunCam applies the same translate+matrix the
// ctx transform uses, so character and world stay pixel-aligned at any viewport.
const nunCam=document.getElementById('nunCam');
// Character model selection: the registry default ('cel', the approved
// pale/slim cel woman) is primary; ?model=noon explicitly opts into the
// previous Nun rig kept for reuse. Unknown ids fail loudly at load.
const modelParam=new URLSearchParams(location.search).get('model');
let characterModel=DEFAULT_MODEL;
if(modelParam){
 try{getCharacterModel(modelParam);}catch{
  throw new Error(`unknown ?model="${modelParam}": expected one of ${Object.keys(CHARACTER_MODELS).join(', ')}`);
 }
 characterModel=modelParam;
}
window.CHARACTER_MODEL=characterModel;
const cameraPresets=[{cx:540,cy:960,z:1,skew:0},{cx:465,cy:1090,z:1.16,skew:-.025},{cx:605,cy:1030,z:1.24,skew:.016}];
function nunLayer(t){
 const mark=characterMarkup(t,{model:characterModel,uid:'snowy'});
 // Grade the character for the room and clip the light spill to its silhouette.
 return `<defs>
  <g id="nunModel">${mark}</g>
  <clipPath id="nunClip" clipPathUnits="userSpaceOnUse"><rect width="1080" height="1110"/></clipPath>
  <mask id="nunLightMask" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1110"><use href="#nunModel"/></mask>
  <filter id="nunInteriorGrade" color-interpolation-filters="sRGB">
   <feComponentTransfer><feFuncR type="linear" slope="0.88"/><feFuncG type="linear" slope="0.84"/><feFuncB type="linear" slope="0.82"/></feComponentTransfer>
  </filter>
  <radialGradient id="nunLampSpill" gradientUnits="userSpaceOnUse" cx="708" cy="1052" r="154">
   <stop stop-color="#ffc585" stop-opacity="0.29"/><stop offset=".57" stop-color="#ffc585" stop-opacity="0.10"/><stop offset="1" stop-color="#ffc585" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="nunGlassLight" gradientUnits="userSpaceOnUse" x1="643" y1="876" x2="705" y2="967">
   <stop stop-color="#83c5d6" stop-opacity="0.13"/><stop offset="1" stop-color="#83c5d6" stop-opacity="0"/>
  </linearGradient>
 </defs>
 <g clip-path="url(#nunClip)">
  <use href="#nunModel" filter="url(#nunInteriorGrade)"/>
  <g mask="url(#nunLightMask)">
   <rect x="620" y="810" width="155" height="300" fill="url(#nunLampSpill)"/>
   <rect x="620" y="810" width="155" height="300" fill="url(#nunGlassLight)"/>
  </g>
 </g>`;
}
window.DUR=7.5;
window.TEXTS=()=>[];
window.EV=[{t:2.5,type:'cut'},{t:3.7,type:'coin'},{t:5,type:'cut'},{t:6.25,type:'light-dim'},{t:6.7,type:'cloth'}];
// Single-frame entry point for the first-minute page. sourceSeconds stays in
// [0,7.5) and drives the proof's phased beats (cuts, Cel pose, cloth drift,
// the 6.25 s light-dim); elapsedSeconds is continuous world time for snow,
// rough-pavement shimmer and film grain. camera, when given, is a fully
// sampled {cx,cy,z,skew} — its z is final, no per-shot zoom ramp — and the
// identical matrix is applied to Canvas and SVG. shotIndex overrides the
// 2.5 s shot derivation for callers that already know the segment.
export function renderSnowyFrame({sourceSeconds,elapsedSeconds,camera,shotIndex,showCloth=true}={}){
 const st=Math.max(0,Math.min(7.5-1/3000,Number(sourceSeconds)||0));
 const et=elapsedSeconds===undefined?st:Number(elapsedSeconds)||0;
 const shot=shotIndex===undefined?Math.min(2,Math.floor(st/2.5)):shotIndex;
 let cam,z;
 if(camera){cam=camera;z=camera.z;}
 else{
  cam=cameraPresets[shot];
  const u=(st-shot*2.5)/2.5;
  z=cam.z*(1+.032*(u*u*(3-2*u)));
 }
 wc.setTransform(1,0,0,1,0,0);wc.globalAlpha=1;wc.globalCompositeOperation='source-over';wc.filter='none';wc.shadowBlur=0;
 wc.fillStyle='#1e1838';wc.fillRect(0,0,W,H);
 drawEnvironment(wc,et,shot);drawNeon(wc,st,shot);
 if(showCloth) drawCharacters(wc,st,shot);
 // Contact/cast shade inside the glazed shop bay only: the nun and counter
 // mass block the warm interior light, so the tile floor at the counter
 // base and the back wall behind her fall off gently. Clipped to the shop
 // window — never across the glass onto the street.
 wc.save();wc.beginPath();wc.rect(130,540,610,820);wc.clip();
 {
  const fl=wc.createRadialGradient(620,1300,20,620,1300,230);
  fl.addColorStop(0,'rgba(4,6,14,0.38)');fl.addColorStop(.55,'rgba(4,6,14,0.15)');fl.addColorStop(1,'rgba(4,6,14,0)');
  wc.fillStyle=fl;wc.fillRect(400,1090,340,250);
  const wl=wc.createRadialGradient(690,985,30,690,985,220);
  wl.addColorStop(0,'rgba(4,6,14,0.26)');wl.addColorStop(1,'rgba(4,6,14,0)');
  wc.fillStyle=wl;wc.fillRect(470,760,440,450);
 }
 wc.restore();
 // Reflect the exterior plane and broad window light. Sample the facade
 // from sill to marquee, then break it into the wet paving's rough bands.
 wc.save();wc.beginPath();wc.rect(0,GROUND,W,H-GROUND);wc.clip();
 rc.setTransform(1,0,0,1,0,0);rc.clearRect(0,0,reflection.width,reflection.height);
 rc.save();
 const mirrorScale=reflection.height/(GROUND-300);
 rc.setTransform(1,0,0,-mirrorScale,0,GROUND*mirrorScale);
 rc.filter='blur(1.2px)';
 drawFacadeForReflection(rc);
 // The name, hours and entrance tubes are on the exterior glazing. The
 // rear exit tube and everything past the front glass stay in the room.
 rc.beginPath();rc.rect(95,315,865,223);rc.rect(755,540,185,175);rc.clip();
 drawNeon(rc,st,shot);
 rc.restore();
 wc.globalCompositeOperation='screen';
 for(let y=0;y<H-GROUND;y+=3){
   const depth=y/(H-GROUND);
   const off=Math.sin(y*.047+et*1.2)*(1.2+y*.012)+Math.sin(y*.13-et)*1.8;
   wc.globalAlpha=(.50-.14*depth)*(.87+.13*Math.cos(y*.31+et*.9));
   wc.drawImage(reflection,0,y,W,3,off,GROUND+y,W,3);
 }
 wc.globalCompositeOperation='source-over';wc.globalAlpha=1;
 wc.save();wc.globalCompositeOperation='screen';
 const dip=1-.45*Math.max(0,1-Math.abs(st-6.25)/.7);
 for(const {x,rgb,strength} of streetGlints){
   const beam=wc.createLinearGradient(0,GROUND,0,H);beam.addColorStop(0,`rgba(${rgb},${strength*.25*dip})`);beam.addColorStop(.3,`rgba(${rgb},${strength*dip})`);beam.addColorStop(1,`rgba(${rgb},0)`);
   wc.fillStyle=beam;
   for(let y=0;y<480;y+=5){const d=Math.sin(y*.083+et*.8)*6+Math.sin(y*.21-et)*3;wc.globalAlpha=.46+.22*Math.sin(y*.105+et*.4);wc.fillRect(x+d-23-y*.035,GROUND+y,46+y*.07,5);}
 }
 wc.restore();
 const fade=wc.createLinearGradient(0,GROUND,0,H);fade.addColorStop(0,'rgba(15,13,27,.14)');fade.addColorStop(1,'rgba(12,12,23,.58)');wc.fillStyle=fade;wc.fillRect(0,GROUND,W,H-GROUND);
 // Broken vertical reflection streaks and fine surface joints remain world anchored.
 for(let j=0;j<16;j++){
   const y=GROUND+Math.pow(j/15,1.7)*480;wc.strokeStyle='rgba(3,8,18,.62)';wc.lineWidth=2;wc.beginPath();wc.moveTo(0,y);wc.lineTo(W,y);wc.stroke();
 }
 for(let i=-4;i<9;i++){wc.strokeStyle='rgba(3,8,18,.43)';wc.beginPath();wc.moveTo(540+i*50,GROUND);wc.lineTo(540+i*220,H);wc.stroke();}
 wc.restore();
 drawWeather(wc,et,shot);
 if(canvas.width!==innerWidth||canvas.height!==innerHeight){canvas.width=innerWidth;canvas.height=innerHeight;}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1e1838';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.save();ctx.scale(canvas.width/W,canvas.height/H);ctx.translate(W/2,H/2);
 ctx.transform(z,0,cam.skew,z,-cam.cx*z,-cam.cy*z);ctx.drawImage(world,0,0);ctx.restore();
 drawPost(ctx,et,canvas.width,canvas.height);
 // Registry character as inline SVG under the identical camera matrix. The clip
 // keeps everything below the counter top (world y1110) hidden so the
 // counter front and her legs/soles never overpaint the shop interior.
 // The y-scale uses the same animated z as the Canvas camera.
 nunCam.setAttribute('transform',`translate(${W/2} ${H/2}) matrix(${z} 0 ${cam.skew} ${z} ${-cam.cx*z} ${-cam.cy*z})`);
 nunCam.innerHTML=nunLayer(st);
 window.FRAME_META={time:st,shot,source:'procedural Canvas2D',imageInputs:0,characterModel,sourceSeconds:st,elapsedSeconds:et,camera:cam?{cx:cam.cx,cy:cam.cy,z,skew:cam.skew}:undefined,shotIndex:shot};
 return window.FRAME_META;
}
// Legacy proof hook: identical to renderSnowyFrame with sourceSeconds =
// elapsedSeconds = t and the preset camera path.
window.render=function(t){return renderSnowyFrame({sourceSeconds:t,elapsedSeconds:t});};
await initNeon();
const signLayout=signLines();
// Scatter follows the exterior tube runs. The mirror above retains the
// actual sign shape, while these broader lobes suggest rough paved stone.
const streetGlints=signLayout.filter(line=>line.baseY<650).flatMap(line=>{
 const rgb=line.color.slice(1).match(/../g).map(channel=>Number.parseInt(channel,16)).join(',');
 const positions=line.w>300?[.2,.5,.8]:[.5];
 return positions.map(position=>({x:line.x+line.w*position,rgb,strength:positions.length>1?.11:.10}));
});
window.SIGN_LINES=signLayout;window.FONT_STATUS=fontStatus();window.render(0);window.READY=true;
// Explicit opt-in playback; offline rendering always calls render(t) directly.
if(new URLSearchParams(location.search).has('play')){
 const start=performance.now();function tick(){window.render(((performance.now()-start)/1000)%window.DUR);requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
