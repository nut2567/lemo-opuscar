// scene03 — Coin counter. Medium counter view: the Nun counts copper coins
// on the laundromat counter, wrist/fingers working over the tray, then her
// attention racks from the tray toward a slow glance at the rear door.
// renderScene03(u,t,d=5) -> pure SVG inner string (no root <svg>).
import {view,interior,clamp,ease,line} from '../scene-kit.js';
import {nun} from '../actor.js';
import {fx} from '../effects.js';

const n=(v,d=2)=>{const r=Number(v.toFixed(d));return Object.is(r,-0)?0:r;};
const lerp=(a,b,k)=>a+(b-a)*k;

// Counter-top surface parameterisation (matches assets/interior.js quad):
// a = 0..1 left->right, b = 0..1 back->front. Returns [x,y] on the counter top.
function surf(a,b){
  const xL=lerp(705,650,b), xR=lerp(985,1030,b);
  return [lerp(xL,xR,a), lerp(1115,1200,b)];
}
const quad=(a0,a1,b0,b1,ins=0)=>{
  const p=(a,b)=>surf(clamp(a,0,1),clamp(b,0,1));
  const A=p(a0+ins,b0+ins),B=p(a1-ins,b0+ins),C=p(a1-ins,b1-ins),D=p(a0+ins,b1-ins);
  return `${n(A[0])},${n(A[1])} ${n(B[0])},${n(B[1])} ${n(C[0])},${n(C[1])} ${n(D[0])},${n(D[1])}`;
};

// Copper coin, drawn as a low perspective ellipse.
function coin(cx,cy,rx=9,ry=3.4,op=1){
  return `<g opacity="${n(op,3)}">
<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${rx}" ry="${ry}" fill="#B18270" stroke="#7E5847" stroke-width="1"/>
<ellipse cx="${n(cx-1.4)}" cy="${n(cy-0.7)}" rx="${n(rx*.55)}" ry="${n(ry*.5)}" fill="#D8A98F" opacity=".85"/>
<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx*.78)}" ry="${n(ry*.6)}" fill="none" stroke="#8A6650" stroke-width=".7" opacity=".7"/>
</g>`;
}

// Divided cash-counting tray sitting on the counter top (right of the Nun's hands).
function coinTray(){
  const outer=quad(.56,.985,.16,.9);
  const inner=quad(.575,.97,.2,.86,.012);
  // divider lines running back->front inside the tray
  let divs='';
  for(const a of[.71,.845]){
    const p0=surf(a,.22),p1=surf(a,.85);
    divs+=line(`M${n(p0[0])} ${n(p0[1])}L${n(p1[0])} ${n(p1[1])}`,'#0d1a28',2,.8);
  }
  const rim=line(`M${surf(.56,.16)[0].toFixed(1)} ${surf(.56,.16)[1].toFixed(1)}`+
    `L${surf(.985,.16)[0].toFixed(1)} ${surf(.985,.16)[1].toFixed(1)}`,'#eaf4ff',1.4,.5);
  // scattered loose copper coins inside the tray sections
  const spots=[[.62,.3,.5],[.66,.55,-.3],[.60,.72,.9],[.76,.34,-.6],[.79,.6,.4],
               [.80,.8,-.2],[.90,.3,.7],[.93,.55,-.8],[.90,.78,.3],[.68,.88,-.5],[.84,.45,.1]];
  let coins='';
  for(const [a,b,rot] of spots){
    const [x,y]=surf(a,b);
    coins+=`<g transform="rotate(${n(rot*18)} ${n(x)} ${n(y)})">${coin(x,y,8.6,3.1,.95)}</g>`;
  }
  // small brass coin rest / pile base at the back-right corner
  const [bx,by]=surf(.93,.24);
  const bank=coin(bx,by,10,3.6,1)+coin(bx,by-4.6,10,3.6,1)+coin(bx,by-9.2,10,3.6,1);
  return `<g>
<polygon points="${outer}" fill="url(#s03-tray)" stroke="#8fb2d4" stroke-width="2"/>
<polygon points="${inner}" fill="#101f2e" opacity=".9"/>
${divs}${rim}${coins}${bank}
</g>`;
}

// Loose foreground coins scattered low on the counter, in front of her hands.
function scatterPile(t){
  const spots=[[.10,.93],[.16,.97],[.22,.9],[.28,.96],[.34,.92],[.19,.88],[.30,.99],[.13,.99]];
  let s='';
  spots.forEach(([a,b],i)=>{
    const [x,y]=surf(a,b);
    const bob=Math.sin(t*1.7+i*1.9)*0.5;
    const rot=Math.sin(t*.9+i*2.3)*4;
    s+=`<g transform="rotate(${n(rot)} ${n(x)} ${n(y+bob)})">${coin(x,y+bob,8+i%3*1.2,3+i%2*.5,.9)}</g>`;
  });
  return s;
}

// Neat banked stack of coins at the left edge of the counter.
function bankStack(t){
  const cx=695, top=1176;
  let s='';
  for(let i=0;i<5;i++){
    const y=top-i*5.4;
    const w=10-i*.4;
    s+=coin(cx+(i%2?.6:-.6),y,w,3.6,1);
  }
  return `<g>${s}</g>`;
}

// The coin she flicks from the tray onto the counted stack, one per cycle.
function flyingCoin(u,d){
  const P=1.02, ph=(u%P)/P;
  const [sx,sy]=surf(.80,.55);          // loose pile in the tray
  const done=Math.floor(u/P), landed=ph>.62;
  const stackN=clamp(done+(landed?1:0),1,6);
  const ex=858, ey=1194-stackN*5.1;     // top of the counted stack
  let out='';
  if(ph<.62){
    const e=ease(ph/.62);
    const cx=lerp(sx,ex,e), cy=lerp(sy,ey,e)-Math.sin(Math.PI*e)*46;
    const sxScale=Math.max(.12,Math.abs(Math.cos(Math.PI*e)));
    out+=`<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(sxScale,3)} 1) translate(${-n(cx)} ${-n(cy)})">${coin(cx,cy,9.5,3.6,1)}</g>`;
  }
  // counted stack grows as coins land
  for(let i=0;i<stackN;i++){
    const y=1194-i*5.1;
    out+=coin(ex,y,9.5-i*.3,3.5,1);
  }
  // warm glint on the freshest coin right after each landing
  if(landed&&ph<.85){
    const g=(ph-.62)/.23, op=Math.sin(Math.PI*g)*.9;
    const gy=ey-4;
    out+=`<path d="M${ex-14} ${gy}L${ex-5} ${gy-5}L${ex} ${gy-16}L${ex+5} ${gy-5}L${ex+14} ${gy}L${ex+5} ${gy+5}L${ex} ${gy+6}L${ex-5} ${gy+5}Z" fill="#F2E3C8" opacity="${n(op,3)}"/>`;
  }
  return out;
}

// Counter fascia overlay: guarantees the counter front occludes anything below y=1200
// regardless of how tall the Nun rig's pose is.
function fascia(){
  return `<polygon points="650,1200 1030,1200 1058,1605 622,1605" fill="url(#in-counterFront)"/>
<line x1="650" y1="1200" x2="622" y2="1605" stroke="#536680" stroke-width="2" opacity=".5"/>
<line x1="1030" y1="1200" x2="1058" y2="1605" stroke="#536680" stroke-width="2" opacity=".5"/>
<line x1="668" y1="1245" x2="1040" y2="1245" stroke="#4a6175" stroke-width="2" opacity=".35"/>
<line x1="664" y1="1500" x2="1046" y2="1500" stroke="#4a6175" stroke-width="2" opacity=".35"/>
<line x1="742" y1="1215" x2="742" y2="1588" stroke="#22384c" stroke-width="2" opacity=".65"/>
<line x1="848" y1="1215" x2="848" y2="1588" stroke="#22384c" stroke-width="2" opacity=".65"/>
<line x1="954" y1="1215" x2="954" y2="1588" stroke="#22384c" stroke-width="2" opacity=".65"/>
<rect x="664" y="1548" width="388" height="42" fill="#0d1a28" stroke="#536680" stroke-width="2"/>
<line x1="664" y1="1548" x2="1052" y2="1548" stroke="#8fb2d4" stroke-width="2" opacity=".45"/>`;
}

export function renderScene03(u,t,d=5){
  u=clamp(Number(u)||0,0,Math.max(.001,d));
  t=Number.isFinite(Number(t))?Number(t):0;

  // ---- mid layer: Nun behind the counter, attention racking from tray to glance ----
  // Slow head/shoulder turn toward the rear door (frame-left) across the shot.
  const rack=ease(clamp((u-.9)/1.5));
  const glance=-4.6*rack+Math.sin(t*.8)*.35;
  const nunSvg=nun(t,{pose:'count',x:790,y:858,scale:1.02,facing:1});
  const mid=`<g transform="rotate(${n(glance,2)} 790 965)">${nunSvg}</g>`;

  // ---- front layer: counter props, flying coin, fascia occlusion, depth accents ----
  const front=`<g>
${coinTray()}
${bankStack(t)}
${scatterPile(t)}
${flyingCoin(u,d)}
${fascia()}
<ellipse cx="540" cy="1390" rx="620" ry="180" fill="#050d18" opacity=".35"/>
<ellipse cx="180" cy="1350" rx="120" ry="34" fill="#B18270" opacity=".10"/>
<ellipse cx="930" cy="1380" rx="140" ry="38" fill="#B18270" opacity=".08"/>
</g>`;

  const back=interior(t);

  return `<defs>
<linearGradient id="s03-tray" x1="0" y1="0" x2="0" y2="1">
<stop stop-color="#3a5570"/><stop offset=".5" stop-color="#2a4257"/><stop offset="1" stop-color="#1a2c3e"/>
</linearGradient>
<radialGradient id="s03-warm"><stop stop-color="#B18270" stop-opacity=".14"/><stop offset="1" stop-color="#142333" stop-opacity="0"/></radialGradient>
</defs>
${view({back,mid,front},u,d,{cx:795,cy:1035,z0:1.08,z1:1.24,dx:24,dy:-10})}
<ellipse cx="850" cy="1170" rx="190" ry="60" fill="url(#s03-warm)" opacity=".8"/>
${fx(t,'interior')}`;
}
