import {drawEnvironment} from './environment.mjs';
import {drawNeon} from './neon.mjs';
import {drawCharacters,originalNunMarkup} from './characters.mjs';
import {drawWeather,drawPost} from './weather.mjs';

const W=1080,H=1920,GROUND=1440;
const canvas=document.getElementById('film'),ctx=canvas.getContext('2d',{alpha:false});
const world=document.createElement('canvas');world.width=W;world.height=H;
const wc=world.getContext('2d',{alpha:false});
const reflection=document.createElement('canvas');reflection.width=W;reflection.height=H-GROUND;
const rc=reflection.getContext('2d');
// Inline-SVG layer for the ORIGINAL Nun rig. It shares the Canvas camera:
// viewBox 1080x1920 + preserveAspectRatio="none" reproduces the canvas'
// independent x/y fit, and nunCam applies the same translate+matrix the
// ctx transform uses, so Nun and world stay pixel-aligned at any viewport.
const nunCam=document.getElementById('nunCam');
const cameraPresets=[{cx:540,cy:960,z:1,skew:0},{cx:465,cy:1090,z:1.16,skew:-.025},{cx:605,cy:1030,z:1.24,skew:.016}];
window.DUR=7.5;
window.TEXTS=()=>[];
window.EV=[{t:2.5,type:'cut'},{t:3.7,type:'coin'},{t:5,type:'cut'},{t:6.25,type:'light-dim'},{t:6.7,type:'cloth'}];
window.render=function(t){
 t=Math.max(0,Math.min(7.5-1/3000,Number(t)||0));
 const shot=Math.min(2,Math.floor(t/2.5)),u=(t-shot*2.5)/2.5,cam=cameraPresets[shot];
 wc.setTransform(1,0,0,1,0,0);wc.globalAlpha=1;wc.globalCompositeOperation='source-over';wc.filter='none';wc.shadowBlur=0;
 wc.fillStyle='#1e1838';wc.fillRect(0,0,W,H);
 drawEnvironment(wc,t,shot);drawNeon(wc,t,shot);drawCharacters(wc,t,shot);
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
 // Original Nun as inline SVG under the identical camera matrix. The clip
 // keeps everything below the counter top (world y1110) hidden so the
 // counter front and her legs/soles never overpaint the shop interior.
 nunCam.setAttribute('transform',`translate(${W/2} ${H/2}) matrix(${z} 0 ${cam.skew} ${cam.z} ${-cam.cx*z} ${-cam.cy*z})`);
 nunCam.innerHTML=`<defs><clipPath id="nunClip" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="1110"/></clipPath></defs><g clip-path="url(#nunClip)">${originalNunMarkup(t)}</g>`;
 window.FRAME_META={time:t,shot,source:'procedural Canvas2D',imageInputs:0};
};
window.render(0);window.READY=true;
// Explicit opt-in playback; offline rendering always calls render(t) directly.
if(new URLSearchParams(location.search).has('play')){
 const start=performance.now();function tick(){window.render(((performance.now()-start)/1000)%window.DUR);requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
