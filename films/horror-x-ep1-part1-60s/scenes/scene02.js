// scene02 — Nun starts her night shift.
// Interior entrance angle: she walks in through the rear doorway carrying an
// empty coin tray, camera tracks laterally with differential parallax.
// Exports renderScene02(u,t,d=5) -> SVG inner string. Defs prefixed s02-.
import {view,interior,rect,path,line,text,clamp,ease} from '../scene-kit.js';
import {nun} from '../actor.js';
import {fx} from '../effects.js';

const TAU=Math.PI*2;
const sstep=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
const lerp=(a,b,k)=>a+(b-a)*k;
// piecewise smooth track over keys [u,x,y,scale]
function track(u,keys){
  if(u<=keys[0][0])return keys[0].slice(1);
  for(let i=1;i<keys.length;i++){
    if(u<=keys[i][0]){
      const k=sstep((u-keys[i-1][0])/(keys[i][0]-keys[i-1][0]));
      return keys[i-1].slice(1).map((v,j)=>lerp(v,keys[i][j+1],k));
    }
  }
  return keys[keys.length-1].slice(1);
}

// empty copper coin tray, held at waist height in front of the Nun
function tray(x,y,s,ang){
  ang=Number(ang)||0;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(2)}) scale(${s.toFixed(3)})">
  <ellipse cx="0" cy="18" rx="54" ry="10" fill="#040B14" opacity=".4"/>
  <path d="M-44 -2 Q-38 -16 0 -18 Q38 -16 44 -2 L38 10 Q0 2 -38 10 Z" fill="#7E5847" stroke="#4E3527" stroke-width="2"/>
  <ellipse cx="0" cy="0" rx="46" ry="12" fill="url(#s02-tray)" stroke="#5E4234" stroke-width="2.5"/>
  <ellipse cx="0" cy="1" rx="35" ry="8" fill="#1B2B3D" stroke="#8FB2D4" stroke-width="1.3" opacity=".85"/>
  <path d="M-28 2 Q-8 -2 16 1" fill="none" stroke="#EAF4FF" stroke-width="2" opacity=".3" stroke-linecap="round"/>
  <circle cx="0" cy="-19" r="5.5" fill="none" stroke="#B18270" stroke-width="3.2"/>
 </g>`;
}

// small "open" tag swinging under the shelf line beside the doorway
function openSign(t){
  const a=(Math.sin(t*.9)*2.4+Math.sin(t*2.3+1.1)*.7).toFixed(2);
  return `<g transform="rotate(${a} 800 284)">
  <line x1="782" y1="286" x2="775" y2="320" stroke="#536680" stroke-width="2"/>
  <line x1="818" y1="286" x2="825" y2="320" stroke="#536680" stroke-width="2"/>
  <rect x="752" y="318" width="96" height="48" rx="7" fill="#22384E" stroke="#8FB2D4" stroke-width="2"/>
  <text x="800" y="352" font-size="24" fill="#EAF4FF" text-anchor="middle" font-family="Kanit" font-weight="700">เปิด</text>
 </g>`;
}

export function renderScene02(u,t,d=5){
  const dur=Math.max(.5,Number(d)||5);
  const U=clamp(u,0,dur);
  // she enters deep in the doorway and settles at the counter side
  const keys=[
    [0,636,1048,.55],
    [1.0,686,1006,.66],
    [2.2,750,970,.735],
    [Math.max(2.4,dur-.7),802,944,.765],
    [dur,810,940,.77]
  ];
  const [nx,ny,ns]=track(U,keys);
  const walking=U<dur-.75;
  const pose=walking?'walk':'idle';
  const feetY=ny+640*ns;

  // walk-cycle footstep pulse driving her contact shadow
  const step=Math.sin(U*TAU*2.1);
  const step2=Math.sin(U*TAU*2.1+Math.PI);
  const shOp=(walking?0.5+0.1*step:0.42).toFixed(3);
  const shRx=(86+6*step2).toFixed(1);

  // warm light spilling out of the open doorway, subtle fluorescent flicker
  const flick=(0.85+0.15*Math.sin(t*11.3)*Math.sin(t*3.7)).toFixed(3);

  // tray sway: heavier while walking, settles when she stops
  const swayA=(walking?2.6:1.1)*Math.sin(t*2.2)+0.8*Math.sin(t*.9);
  const trayX=nx+14*ns;
  const trayY=ny+285*ns;

  const back=interior(t);

  const mid=
    // open doorway: dark interior beyond the rear door + warm spill
    `<g>
      ${rect(566,398,168,758,'#040B14','rx="8" stroke="#8FB2D4" stroke-width="2" opacity=".9"')}
      ${line('M574 410V1140','#B18270',3,.5)}
      ${path('M575 1160 L725 1160 L900 1440 L450 1440 Z','url(#s02-spill)',`opacity="${flick}"`)}
      ${openSign(t)}
    </g>`+
    // her soft contact shadow on the floor + the Nun herself, clipped out
    // wherever they overlap the counter front face: she works behind the
    // counter, so its face must occlude her legs/feet, never a tabletop.
    // clip-rule evenodd subtracts the counter polygon (artboard coords, the
    // same space nun() places her in) from the full frame.
    `<g clip-path="url(#s02-nunclip)">`+
    `<ellipse cx="${nx.toFixed(1)}" cy="${(feetY+6).toFixed(1)}" rx="${shRx}" ry="17" fill="#050D18" opacity="${shOp}"/>`+
    nun(t,{pose,x:nx,y:ny,scale:ns,facing:1})+
    `</g>`+
    tray(trayX,trayY,ns*.95,swayA);

  // foreground door-jamb / wall edges for strong differential parallax
  const front=
    `<g>
      ${path('M-60 260 L150 320 L150 1620 L-60 1680 Z','#070F1A','opacity=".94"')}
      ${line('M150 320 L150 1620','#536680',3,.35)}
      ${path('M430 300 L492 340 L492 1560 L430 1600 Z','#0A1522','opacity=".9"')}
      ${line('M492 340 L492 1560','#8FB2D4',2,.22)}
      ${path('M1010 330 L1140 300 L1140 1700 L1010 1660 Z','#070F1A','opacity=".94"')}
      ${line('M1010 330 L1010 1660','#536680',3,.3)}
    </g>`;

  const cam={cx:660,cy:985,z0:1,z1:1.05,dx:-140,dy:-14};

  const defs=`<defs>
    <clipPath id="s02-nunclip"><path d="M0 0H1080V1920H0Z M650 1200L1030 1200L1058 1605L622 1605Z" clip-rule="evenodd"/></clipPath>
    <linearGradient id="s02-spill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#B18270" stop-opacity=".28"/>
      <stop offset=".55" stop-color="#8A6A55" stop-opacity=".1"/>
      <stop offset="1" stop-color="#B18270" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s02-tray" cx=".5" cy=".35" r=".8">
      <stop offset="0" stop-color="#D8A98F"/>
      <stop offset=".55" stop-color="#B18270"/>
      <stop offset="1" stop-color="#7E5847"/>
    </radialGradient>
  </defs>`;

  return defs+view({back,mid,front},U,dur,cam)+fx(t,'interior');
}
