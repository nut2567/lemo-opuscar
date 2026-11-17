// actor.js — reusable Nun rig for horror-x-ep1-part1-60s.
//   nun(t, opts={}) -> SVG inner fragment (no root <svg>, no DOM/state/random).
//   opts: { pose:'idle'|'walk'|'count'|'turn'|'listen', x=790, y=850,
//           scale=1, facing=1, uid='' }
//   x/y is the HEAD CENTER anchor. Local rig: head center at (0,0), the
//   figure extends ~640 units below it to the soles (matches scene02's
//   feetY = y + 640*scale). facing=-1 mirrors horizontally via scale().
//   All animation is a pure function of t; identical input -> identical markup.
//   Defs are prefixed "actor-" (uid suffix allows multiple rigs per scene).

const SKIN='#EFDCC4', SKIN_SH='#D9BEA2', INK='#141C28',
      HAIR1='#1B2740', HAIR2='#0B1220', HAIR_HI='#3A4A6E', HAIR_MID='#2E3D5E',
      SHIRT1='#2C4260', SHIRT2='#1C2D42', SHIRT_D='#1B2B3D',
      APRON1='#E4EAF1', APRON2='#C4D2DF',
      COPPER='#B18270', COPPER_D='#7E5847', ICE='#8FB2D4',
      PANTS='#1E2C40', SHOE='#101826', SHOE_S='#2A3C55';

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,k)=>a+(b-a)*k;
const sstep=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
const N=v=>+v.toFixed(1);
const hash=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};

/* ------------------------------------------------------------ skeleton */
const SOLE=640;          // sole height below head center
const HIPY=322;          // hip line
const SHX=52, SHY=132;   // shoulders
const NECK_Y=58;         // head rotation pivot (neck)

// blink envelope: deterministic blink centers jittered by hash, ~3.4s apart
function blinkEnv(t){
  const per=3.4, idx=Math.floor(t/per); let b=0;
  for(let i=idx-1;i<=idx+1;i++){
    const c=i*per+0.5+1.8*hash(i);
    const u=(t-c)/0.085, g=Math.exp(-u*u);
    if(g>b)b=g;
  }
  return b;
}

// two-bone IK: returns elbow for shoulder->wrist, bend=+1/-1 picks side
function ik(sx,sy,wx,wy,l1,l2,bend){
  const dx=wx-sx, dy=wy-sy;
  let d=Math.hypot(dx,dy);
  d=clamp(d,Math.abs(l1-l2)+0.5,l1+l2-0.5);
  const a=(l1*l1-l2*l2+d*d)/(2*d);
  const h=Math.sqrt(Math.max(l1*l1-a*a,0));
  const mx=sx+dx*a/d, my=sy+dy*a/d;
  return [mx+(-dy/d)*h*bend, my+(dx/d)*h*bend];
}

// walk foot: ph in [0,1). Stance = constant-velocity plant (no sliding),
// swing = eased return with a lift arc. Returns [x, soleY, toeDeg].
function footAt(ph){
  const k=((ph%1)+1)%1, S=46, ST=0.55;
  if(k<ST){const u=k/ST;return [lerp(S,-S,u),SOLE,1.5];}
  const u=(k-ST)/(1-ST), e=sstep(u);
  return [lerp(-S,S,e), SOLE-30*Math.sin(Math.PI*u), 17*Math.sin(Math.PI*u)];
}

/* ------------------------------------------------------------ pose params */
// Everything a pose needs, resolved once per frame.
function poseParams(pose,t){
  const br=Math.sin(2*Math.PI*t/3.4);
  const P={
    lean:0, bob:1.6*br, sway:0,
    headRot:1.1*Math.sin(2*Math.PI*t/7.3)+0.5*Math.sin(2*Math.PI*t/2.9),
    nodY:0, pdx:2.6*Math.sin(2*Math.PI*t/6.1)+1.4*Math.sin(2*Math.PI*t/13.7),
    pdy:1.8*Math.sin(2*Math.PI*t/8.3), eye:1,
    handL:[-34,298], handR:[34,298],
    pinchL:false, tray:false,
    feet:[[-17,SOLE,0],[19,SOLE,2]],
    mouth:'soft'
  };
  P.open=1-0.94*blinkEnv(t);

  if(pose==='walk'){
    const w=((t/0.72)%1+1)%1;
    const [fxR,fyR,toeR]=footAt(w), [fxL,fyL,toeL]=footAt(w+0.5);
    const w2=((t/0.72-0.02)%1+1)%1, w3=((t/0.72+0.48)%1+1)%1;
    // arm swing opposes ipsilateral foot velocity -> no foot/arm slide
    const vR=clamp((footAt(w)[0]-footAt(w2)[0])/0.02,-80,80);
    const vL=clamp((footAt(w+0.5)[0]-footAt(w3)[0])/0.02,-80,80);
    const pump=5*Math.sin(2*Math.PI*w+Math.PI/2);
    P.handR=[36-vR*0.38, 292+pump];
    P.handL=[-36-vL*0.38, 292-pump];
    P.lean=5; P.sway=4*Math.sin(2*Math.PI*w);
    P.bob=-3.4*(0.5-0.5*Math.cos(4*Math.PI*w))+0.8*br;
    P.headRot=-1.2+0.7*Math.sin(4*Math.PI*w);
    P.pdx=1.5*Math.sin(2*Math.PI*w*3); P.pdy=2.4;
    P.feet=[[fxL,fyL,toeL],[fxR,fyR,toeR]];
  }
  else if(pose==='count'){
    const w1=Math.sin(2*Math.PI*t/1.15), w2=Math.sin(2*Math.PI*t/1.05+0.6);
    P.lean=15; P.nodY=9; P.headRot=9;
    P.pdx=1.5; P.pdy=5.2; P.eye=0.96;
    P.handL=[-15+2.5*w1, 311+1.8*w2]; P.pinchL=true;
    P.handR=[27+5*Math.sin(2*Math.PI*t/1.05+0.6), 297+3*Math.sin(2*Math.PI*t/1.05)];
    P.tray=true; P.mouth='flat';
    P.feet=[[-20,SOLE,0],[22,SOLE,0]];
    P.bob=1.3*br;
  }
  else if(pose==='turn'){
    P.lean=-3; P.sway=3;
    P.headRot=-26+2*Math.sin(2*Math.PI*t/6);
    P.nodY=2; P.pdx=-6.5; P.pdy=1;
    P.handL=[-32,290]; P.handR=[15,256];
    P.feet=[[-25,SOLE,0],[15,SOLE+3,6]];
    P.bob=1.5*br;
  }
  else if(pose==='listen'){
    P.lean=2;
    P.headRot=-11+1.5*Math.sin(2*Math.PI*t/4.7);
    P.nodY=3; P.pdx=-4+1.2*Math.sin(2*Math.PI*t/5.3); P.pdy=-1.5;
    P.eye=1.08;
    P.handL=[-10,296]; P.handR=[10,296];
    P.feet=[[-15,SOLE,0],[17,SOLE,0]];
    P.bob=0.9*br; P.mouth='soft';
  }
  return P;
}

/* ------------------------------------------------------------ body parts */
function arm(sx,sy,wx,wy,bend,pinchPt){
  const [ex,ey]=ik(sx,sy,wx,wy,94,90,bend);
  const ang=Math.atan2(wy-ey,wx-ex)*180/Math.PI;
  let s=`<path d="M${N(sx)} ${N(sy)} L${N(ex)} ${N(ey)}" fill="none" stroke="${SHIRT1}" stroke-width="22" stroke-linecap="round"/>`;
  s+=`<path d="M${N(ex)} ${N(ey)} L${N(wx)} ${N(wy)}" fill="none" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/>`;
  s+=`<g transform="translate(${N(wx)} ${N(wy-2)}) rotate(${N(ang*0.3)})">`;
  s+=`<ellipse rx="10" ry="7.5" fill="${SKIN}"/><ellipse cx="-3" cy="1.5" rx="4" ry="3" fill="${SKIN_SH}" opacity=".6"/>`;
  s+=`<path d="M2 -4 q4 1 5 5 M-1 -5 q3 2 3 6" fill="none" stroke="${SKIN_SH}" stroke-width="1.2" opacity=".7"/></g>`;
  if(pinchPt){ // sorting fingers reaching toward the coins
    const dx=pinchPt[0]-wx, dy=pinchPt[1]-wy, d=Math.hypot(dx,dy)||1;
    const px=-dy/d, py=dx/d;
    s+=`<path d="M${N(wx+px*4)} ${N(wy-2+py*4)} L${N(pinchPt[0]+px*2.5)} ${N(pinchPt[1]+py*2.5)} M${N(wx-px*4)} ${N(wy-2-py*4)} L${N(pinchPt[0]-px*2.5)} ${N(pinchPt[1]-py*2.5)}" fill="none" stroke="${SKIN}" stroke-width="3.6" stroke-linecap="round"/>`;
  }
  return s;
}

function leg(hx,hy,fx,fy,toe){
  const ax=fx, ay=fy-13;
  const dx=ax-hx, dy=ay-hy, d=Math.hypot(dx,dy)||1;
  const kOff=Math.min(30,d*0.32);
  const kx=(hx+ax)/2+(dy/d)*kOff, ky=(hy+ay)/2+(-dx/d)*kOff-4;
  let s=`<path d="M${N(hx)} ${N(hy)} L${N(kx)} ${N(ky)} L${N(ax)} ${N(ay)}" fill="none" stroke="${PANTS}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`;
  s+=`<g transform="translate(${N(fx)} ${N(fy-7)}) rotate(${N(toe)})">`;
  s+=`<ellipse cx="8" cy="0" rx="16" ry="6.8" fill="${SHOE}"/>`;
  s+=`<path d="M-7 2.5 Q8 7 21 2.5" fill="none" stroke="${SHOE_S}" stroke-width="2.4" opacity=".8"/></g>`;
  return s;
}

function head(P,U){
  const open=N(P.open), pdx=N(P.pdx), pdy=N(P.pdy);
  const es=P.eye;
  const mouth=P.mouth==='flat'
    ?`<path d="M-9 27 Q0 25 9 27" fill="none" stroke="#96604F" stroke-width="2" stroke-linecap="round"/>`
    :`<path d="M-10 28 Q0 23 10 28" fill="none" stroke="#96604F" stroke-width="2.2" stroke-linecap="round"/>`;
  const eye=(ex)=>`<g transform="translate(${ex} -7)">
    <g transform="translate(${pdx} ${pdy})">
    <g transform="scale(1 ${open})">
    <ellipse rx="7.4" ry="${N(5.4*es)}" fill="#F4EEE2"/>
    <circle cx="1.4" cy="${N(0.8*es)}" r="${N(3.4*es)}" fill="#33291F"/><circle cx="2.3" cy="${N(-1.1*es)}" r="${N(1.1*es)}" fill="#EAF4FF"/>
    </g></g></g>`;
  return `<g transform="translate(0 ${N(P.nodY)}) rotate(${N(P.headRot)} 0 ${NECK_Y})">
  <path d="M-54 -46 C-88 -38 -110 -4 -114 60 C-118 142 -110 220 -94 270 C-70 262 -54 244 -48 210 C-44 146 -46 62 -48 0 C-50 -24 -52 -38 -54 -46 Z" fill="url(#actor${U}-hair)"/>
  <path d="M54 -46 C88 -38 110 -4 114 60 C118 142 110 220 94 270 C70 262 54 244 48 210 C44 146 46 62 48 0 C50 -24 52 -38 54 -46 Z" fill="url(#actor${U}-hair)"/>
  <path d="M-30 44 C-38 116 -30 176 -16 212 L16 212 C30 176 38 116 30 44 C18 62 9 68 0 68 C-9 68 -18 62 -30 44 Z" fill="url(#actor${U}-hair)"/>
  <path d="M0 -84 C42 -84 68 -62 74 -30 C80 12 72 56 57 96 C51 112 45 118 39 116 L-39 116 C-45 118 -51 112 -57 96 C-72 56 -80 12 -74 -30 C-68 -62 -42 -84 0 -84 Z" fill="url(#actor${U}-hair)"/>
  <path d="M-92 -16 C-104 60 -100 160 -88 246" fill="none" stroke="${HAIR2}" stroke-width="2.4" opacity=".55"/>
  <path d="M-70 4 C-78 84 -76 164 -66 208" fill="none" stroke="${HAIR2}" stroke-width="2.2" opacity=".5"/>
  <path d="M-104 44 C-112 120 -108 200 -98 254" fill="none" stroke="${HAIR_HI}" stroke-width="3" opacity=".5"/>
  <path d="M92 -16 C104 60 100 160 88 246" fill="none" stroke="${HAIR2}" stroke-width="2.4" opacity=".55"/>
  <path d="M70 4 C78 84 76 164 66 208" fill="none" stroke="${HAIR2}" stroke-width="2.2" opacity=".5"/>
  <path d="M104 44 C112 120 108 200 98 254" fill="none" stroke="${HAIR_HI}" stroke-width="3" opacity=".5"/>
  <path d="M-34 -64 C-42 -34 -38 -4 -30 26" fill="none" stroke="${HAIR2}" stroke-width="2" opacity=".4"/>
  <path d="M34 -64 C42 -34 38 -4 30 26" fill="none" stroke="${HAIR2}" stroke-width="2" opacity=".4"/>
  <path d="M0 -76 C-4 -48 4 -18 0 12" fill="none" stroke="${HAIR_HI}" stroke-width="2.4" opacity=".35"/>
  <ellipse cx="0" cy="0" rx="57" ry="69" fill="url(#actor${U}-skin)"/>
  <ellipse cx="0" cy="58" rx="16" ry="12" fill="${SKIN_SH}" opacity=".55"/>
  <ellipse cx="-15" cy="21" rx="8" ry="5" fill="${COPPER}" opacity=".16"/>
  <ellipse cx="15" cy="21" rx="8" ry="5" fill="${COPPER}" opacity=".16"/>
  <path d="M-62 -20 C-65 -44 -51 -62 -29 -67 C-10 -71 11 -70 29 -64 C47 -58 59 -43 62 -28 C58 -32 52 -34 46 -36 C40 -40 34 -44 26 -47 C18 -50 8 -51 -2 -51 C-12 -51 -22 -49 -30 -45 C-38 -41 -44 -37 -50 -34 C-55 -31 -59 -25 -62 -20 Z" fill="url(#actor${U}-hair)"/>
  <path d="M-30 -62 C-14 -54 4 -46 20 -38" fill="none" stroke="${HAIR_HI}" stroke-width="2" opacity=".5"/>
  <path d="M-44 -58 C-30 -50 -12 -42 2 -36" fill="none" stroke="${HAIR2}" stroke-width="1.8" opacity=".45"/>
  <path d="M-56 -34 C-68 -22 -72 8 -66 46 C-62 70 -56 84 -48 90 C-52 58 -50 22 -44 -6 C-42 -20 -46 -30 -56 -34 Z" fill="url(#actor${U}-hair)"/>
  <path d="M56 -34 C68 -22 72 8 66 46 C62 70 56 84 48 90 C52 58 50 22 44 -6 C42 -20 46 -30 56 -34 Z" fill="url(#actor${U}-hair)"/>
  <path d="M-61 -16 C-65 14 -61 46 -53 72" fill="none" stroke="${HAIR2}" stroke-width="1.8" opacity=".45"/>
  <path d="M61 -16 C65 14 61 46 53 72" fill="none" stroke="${HAIR2}" stroke-width="1.8" opacity=".45"/>
  <g transform="translate(0 108)"><path d="M-13 -4 L13 -4 L9 9 L-9 9 Z" fill="#7E2A3A" stroke="#571C2B" stroke-width="1"/><circle cy="-5" r="4.5" fill="#8E3049"/></g>
  <path d="M-29 -32 Q-20 -38 -11 -33 M11 -33 Q20 -38 29 -32" fill="none" stroke="#241A12" stroke-width="2.4" stroke-linecap="round"/>
  ${eye(-18)}${eye(18)}
  <path d="M-1.5 3 q2.5 5 -0.8 8" fill="none" stroke="#C4A98C" stroke-width="1.6" stroke-linecap="round"/>
  ${mouth}
</g>`;
}

/* count-pose sorting tray + the two copper coins riding fingers -> tray */
function countProps(t,P,U){
  // tray resting on the apron front, slots where coins land
  const tray=`<g>
    <path d="M14 352 L74 352 L64 380 L24 380 Z" fill="url(#actor${U}-tray)" stroke="${COPPER_D}" stroke-width="2"/>
    <ellipse cx="44" cy="352" rx="30" ry="7" fill="${APRON2}" stroke="${COPPER}" stroke-width="2"/>
    <path d="M22 356 L66 356" stroke="${COPPER}" stroke-width="1.4" opacity=".6"/>
  </g>`;
  const hold=[P.handL[0]+14,P.handL[1]-10];           // fingertips of sorting hand
  const slots=[[32,348],[50,352]];
  const cyc=((t/2.6)%1+1)%1;
  let coins='';
  for(let i=0;i<2;i++){
    const p=((cyc+i*0.015)%1+1)%1;
    const slot=slots[i];
    let x,y,rot;
    if(p<0.40){                                   // pinched at the fingers
      x=hold[0]+(i?3:-2)+0.7*Math.sin(t*7+i*2.4);
      y=hold[1]+(i?-2:1)+0.5*Math.sin(t*6+i*1.7);
      rot=58+i*10;
    }else if(p<0.58){                             // flicked toward the tray
      const k=sstep((p-0.40)/0.18);
      x=lerp(hold[0]+(i?3:-2),slot[0],k);
      y=lerp(hold[1]+(i?-2:1),slot[1],k)-7*Math.sin(Math.PI*k);
      rot=lerp(58+i*10,6+i*8,k);
    }else if(p<0.80){x=slot[0];y=slot[1];rot=6+i*8;}
    else{                                         // picked back up
      const k=sstep((p-0.80)/0.20);
      x=lerp(slot[0],hold[0]+(i?3:-2),k);
      y=lerp(slot[1],hold[1]+(i?-2:1),k)-6*Math.sin(Math.PI*k);
      rot=lerp(6+i*8,58+i*10,k);
    }
    coins+=`<g transform="translate(${N(x)} ${N(y)}) rotate(${N(rot)})">
      <ellipse rx="8.5" ry="3.4" fill="${COPPER}" stroke="${COPPER_D}" stroke-width="1"/>
      <ellipse cx="-1.2" cy="-1" rx="4" ry="1.5" fill="#D8A98F" opacity=".8"/>
    </g>`;
  }
  return tray+coins;
}

/* ------------------------------------------------------------------ rig */
export function nun(t,opts={}){
  t=Number(t)||0;
  const pose=['idle','walk','count','turn','listen'].includes(opts.pose)?opts.pose:'idle';
  const x=Number.isFinite(opts.x)?opts.x:790;
  const y=Number.isFinite(opts.y)?opts.y:850;
  const sc=Number.isFinite(opts.scale)?opts.scale:1;
  const f=Number.isFinite(opts.facing)?(opts.facing<0?-1:1):1;
  const U=opts.uid?'-'+String(opts.uid).replace(/[^A-Za-z0-9_-]/g,''):'';
  const P=poseParams(pose,t);

  const [fl,fr]=P.feet;
  const hipY=HIPY+P.bob;
  const legs=
    leg(-20,hipY,fl[0],fl[1],fl[2])+
    leg(20,hipY,fr[0],fr[1],fr[2]);

  const pinchPt=P.pinchL?[P.handL[0]+14,P.handL[1]-10]:null;
  const arms=
    arm(-SHX,SHY,P.handL[0],P.handL[1],1,pinchPt)+
    arm(SHX,SHY,P.handR[0],P.handR[1],-1,null);

  const defs=`<defs>
<linearGradient id="actor${U}-skin" x2="0" y2="1"><stop stop-color="#EFDFC9"/><stop offset="1" stop-color="#D9BEA2"/></linearGradient>
<linearGradient id="actor${U}-hair" x2="0" y2="1"><stop stop-color="${HAIR1}"/><stop offset=".55" stop-color="${HAIR_MID}"/><stop offset="1" stop-color="${HAIR2}"/></linearGradient>
<linearGradient id="actor${U}-shirt" x2="0" y2="1"><stop stop-color="${SHIRT1}"/><stop offset="1" stop-color="${SHIRT2}"/></linearGradient>
<linearGradient id="actor${U}-apron" x2="0" y2="1"><stop stop-color="${APRON1}"/><stop offset="1" stop-color="${APRON2}"/></linearGradient>
<linearGradient id="actor${U}-skirt" x2="0" y2="1"><stop stop-color="#22334C"/><stop offset="1" stop-color="#131F30"/></linearGradient>
<linearGradient id="actor${U}-tray" x2="0" y2="1"><stop stop-color="${APRON1}"/><stop offset="1" stop-color="${APRON2}"/></linearGradient>
</defs>`;

  const torso=`<g transform="translate(${N(P.sway)} ${N(P.bob)}) rotate(${N(P.lean)} 0 312)">
<path d="M-15 58 L15 58 L12 132 L-12 132 Z" fill="${SKIN}"/>
<path d="M-55 126 C-58 180 -50 250 -38 312 L38 312 C50 250 58 180 55 126 C38 118 -38 118 -55 126 Z" fill="url(#actor${U}-shirt)" stroke="${INK}" stroke-opacity=".16" stroke-width="1.5"/>
<path d="M-24 160 L-44 128 M24 160 L44 128" stroke="${APRON2}" stroke-width="6" stroke-linecap="round" fill="none"/>
<path d="M-40 306 C-58 380 -68 468 -64 560 L64 560 C68 468 58 380 40 306 Z" fill="url(#actor${U}-skirt)" stroke="${INK}" stroke-opacity=".18" stroke-width="1.5"/>
<path d="M-30 322 C-44 400 -48 480 -44 552 M30 322 C44 400 48 480 44 552" fill="none" stroke="#16233A" stroke-width="1.6" opacity=".35"/>
<path d="M-44 552 L44 552" stroke="${COPPER}" stroke-width="2" opacity=".4"/>
<path d="M-32 156 L32 156 L40 388 L-40 388 Z" fill="url(#actor${U}-apron)" stroke="${INK}" stroke-opacity=".14" stroke-width="1.4"/>
<path d="M-34 158 L34 158 L33 170 L-33 170 Z" fill="${COPPER}" opacity=".9"/>
<path d="M-18 322 L18 322 L14 358 L-14 358 Z" fill="${APRON2}" stroke="${COPPER}" stroke-width="1.2" opacity=".95"/>
<path d="M-20 126 L0 150 L20 126 L14 118 L0 138 L-14 118 Z" fill="${SHIRT_D}"/>
<path d="M-17 125 L0 147 L17 125" fill="none" stroke="${COPPER}" stroke-width="2.6" opacity=".9"/>
${arms}
${P.tray?countProps(t,P,U):''}
${head(P,U)}
</g>`;

  return defs+
`<g transform="translate(${N(x)} ${N(y)}) scale(${N(sc*f)} ${N(sc)})">`+
legs+torso+
`</g>`;
}
