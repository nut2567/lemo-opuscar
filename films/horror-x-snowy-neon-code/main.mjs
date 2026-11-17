import {drawEnvironment} from './environment.mjs';
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
// Wet-ground reflection of the character rig. The Canvas pass mirrors world rows
// y300..1440 into street rows y1440..1920 (the rc transform in render()),
// so the SVG copy uses the matching affine world->street map:
//   streetX = worldX,  streetY = H - (worldY-300)*WET_K.
// The actor source is clipped at counter world y1110, which maps to street
// y>=1578.9 — only the visible upper body and sorting tray reflect, never
// phantom legs below the counter line.
const WET_K=(H-GROUND)/1140, WET_F=H+300*WET_K;
const REFL_Y0=1560, REFL_Y1=1744, REFL_BH=16, REFL_OP=0.62;
function nunLayer(t){
 const mark=characterMarkup(t,{model:characterModel,uid:'snowy'});
 // Second render under a distinct uid so the mirrored reflection's defs can
 // never collide with the direct figure's — model-agnostic, no string patch.
 const markR=characterMarkup(t,{model:characterModel,uid:'snowy-r'});
 let clips=`<clipPath id="nunClip" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="1110"/></clipPath>`;
 clips+=`<clipPath id="nunWet" clipPathUnits="userSpaceOnUse"><rect x="0" y="1579" width="${W}" height="${H-1579}"/></clipPath>`;
 clips+=`<clipPath id="nunHidden" clipPathUnits="userSpaceOnUse"><rect x="2000" y="2000" width="10" height="10"/></clipPath>`;
 clips+=`<filter id="nunReflBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter>`;
 // Horizontal bands reproduce the Canvas ripple offsets (same formula as
 // the 3px slices in render()) and carry the street's depth fade.
 let bands='';
 for(let y0=REFL_Y0;y0<REFL_Y1;y0+=REFL_BH){
  clips+=`<clipPath id="nunBand${y0}" clipPathUnits="userSpaceOnUse"><rect x="0" y="${y0}" width="${W}" height="${REFL_BH}"/></clipPath>`;
  const yc=y0+REFL_BH/2-GROUND;
  const off=Math.sin(yc*.047+t*1.2)*(.8+yc*.009)+Math.sin(yc*.13-t)*1.5;
  const fadeA=.14+.51*((y0+REFL_BH/2-GROUND)/(H-GROUND));
  bands+=`<g clip-path="url(#nunBand${y0})" opacity="${(REFL_OP*(1-fadeA)).toFixed(3)}"><use href="#nunMir" transform="translate(${off.toFixed(2)} 0)"/></g>`;
 }
 return `<defs>${clips}</defs>`+
  `<g clip-path="url(#nunClip)">${mark}</g>`+
  `<g id="nunRefl" clip-path="url(#nunWet)" filter="url(#nunReflBlur)">${bands}</g>`+
  `<g clip-path="url(#nunHidden)"><g id="nunMir" transform="matrix(1 0 0 ${(-WET_K).toFixed(6)} 0 ${WET_F.toFixed(6)})">${markR}</g></g>`;
}
window.DUR=7.5;
window.TEXTS=()=>[];
window.EV=[{t:2.5,type:'cut'},{t:3.7,type:'coin'},{t:5,type:'cut'},{t:6.25,type:'light-dim'},{t:6.7,type:'cloth'}];
window.render=function(t){
 t=Math.max(0,Math.min(7.5-1/3000,Number(t)||0));
 const shot=Math.min(2,Math.floor(t/2.5)),u=(t-shot*2.5)/2.5,cam=cameraPresets[shot];
 wc.setTransform(1,0,0,1,0,0);wc.globalAlpha=1;wc.globalCompositeOperation='source-over';wc.filter='none';wc.shadowBlur=0;
 wc.fillStyle='#1e1838';wc.fillRect(0,0,W,H);
 drawEnvironment(wc,t,shot);drawNeon(wc,t,shot);drawCharacters(wc,t,shot);
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
 // Mirror the actual drawn facade, then stretch it into wet pavement bands.
 wc.save();wc.beginPath();wc.rect(0,GROUND,W,H-GROUND);wc.clip();
 rc.setTransform(1,0,0,1,0,0);rc.clearRect(0,0,reflection.width,reflection.height);
 rc.translate(0,reflection.height);rc.scale(1,-reflection.height/1140);rc.drawImage(world,0,300,W,1140,0,0,W,1140);
 wc.globalAlpha=.44;wc.globalCompositeOperation='screen';
 for(let y=0;y<H-GROUND;y+=3){
   const off=Math.sin(y*.047+t*1.2)*(.8+y*.009)+Math.sin(y*.13-t)*1.5;
   wc.drawImage(reflection,0,y,W,3,off,GROUND+y,W,3);
 }
 wc.globalCompositeOperation='source-over';wc.globalAlpha=1;
 wc.save();wc.globalCompositeOperation='screen';
 const dip=1-.45*Math.max(0,1-Math.abs(t-6.25)/.7);
 for(const [x,color,alpha] of [[230,'255,79,168',.24],[390,'255,79,168',.2],[545,'79,220,255',.21],[720,'255,79,168',.17],[855,'61,255,154',.13]]){
   const beam=wc.createLinearGradient(0,GROUND,0,H);beam.addColorStop(0,`rgba(${color},${alpha*.25*dip})`);beam.addColorStop(.3,`rgba(${color},${alpha*dip})`);beam.addColorStop(1,`rgba(${color},0)`);
   wc.fillStyle=beam;
   for(let y=0;y<480;y+=5){const d=Math.sin(y*.083+t*.8)*6+Math.sin(y*.21-t)*3;wc.globalAlpha=.4+.5*(.5+.5*Math.sin(y*.22));wc.fillRect(x+d-23-y*.035,GROUND+y,46+y*.07,3);}
 }
 wc.restore();
 const fade=wc.createLinearGradient(0,GROUND,0,H);fade.addColorStop(0,'rgba(15,13,27,.14)');fade.addColorStop(1,'rgba(12,12,23,.65)');wc.fillStyle=fade;wc.fillRect(0,GROUND,W,H-GROUND);
 // Broken vertical reflection streaks and fine surface joints remain world anchored.
 for(let j=0;j<16;j++){
   const y=GROUND+Math.pow(j/15,1.7)*480;wc.strokeStyle='rgba(3,8,18,.62)';wc.lineWidth=2;wc.beginPath();wc.moveTo(0,y);wc.lineTo(W,y);wc.stroke();
 }
 for(let i=-4;i<9;i++){wc.strokeStyle='rgba(3,8,18,.43)';wc.beginPath();wc.moveTo(540+i*50,GROUND);wc.lineTo(540+i*220,H);wc.stroke();}
 wc.restore();
 drawWeather(wc,t,shot);
 if(canvas.width!==innerWidth||canvas.height!==innerHeight){canvas.width=innerWidth;canvas.height=innerHeight;}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1e1838';ctx.fillRect(0,0,canvas.width,canvas.height);
 const z=cam.z*(1+.032*(u*u*(3-2*u)));
 ctx.save();ctx.scale(canvas.width/W,canvas.height/H);ctx.translate(W/2,H/2);
 ctx.transform(z,0,cam.skew,z,-cam.cx*z,-cam.cy*z);ctx.drawImage(world,0,0);ctx.restore();
 drawPost(ctx,t,canvas.width,canvas.height);
 // Registry character as inline SVG under the identical camera matrix. The clip
 // keeps everything below the counter top (world y1110) hidden so the
 // counter front and her legs/soles never overpaint the shop interior.
 // The y-scale uses the same animated z as the Canvas camera.
 nunCam.setAttribute('transform',`translate(${W/2} ${H/2}) matrix(${z} 0 ${cam.skew} ${z} ${-cam.cx*z} ${-cam.cy*z})`);
 nunCam.innerHTML=nunLayer(t);
 window.FRAME_META={time:t,shot,source:'procedural Canvas2D',imageInputs:0,characterModel};
};
await initNeon();window.SIGN_LINES=signLines();window.FONT_STATUS=fontStatus();window.render(0);window.READY=true;
// Explicit opt-in playback; offline rendering always calls render(t) directly.
if(new URLSearchParams(location.search).has('play')){
 const start=performance.now();function tick(){window.render(((performance.now()-start)/1000)%window.DUR);requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
