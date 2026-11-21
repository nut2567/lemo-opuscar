import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const cfg = new URLSearchParams(location.search);
const width = Number(cfg.get('width') || 720);
const height = width * 16 / 9;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(39, width / height, .035, 65);
const renderer = new T.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.23;
document.body.append(renderer.domElement);

const hemisphere = new T.HemisphereLight(0xb9d8ff, 0x5e3826, 1.08);
const key = new T.DirectionalLight(0xffe2b9, 3.3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, {left:-6,right:6,top:7,bottom:-5,near:.1,far:27});
key.shadow.normalBias = .028;
key.shadow.bias = -.00012;
const bounce = new T.DirectionalLight(0x8eb9ff, 1.13);
bounce.position.set(4,3,-1);
const screenLight = new T.PointLight(0x4cc7ff, 6, 3.3, 2);
const lantern = new T.PointLight(0xffac5a, 19, 6, 2);
lantern.position.set(-2,2.35,-.5);
scene.add(hemisphere,key,key.target,bounce,screenLight,lantern);
const indoors = new T.Group(), outdoors = new T.Group(), action = new T.Group();
scene.add(indoors,outdoors,action);

let seed = 16927;
const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const clamp = T.MathUtils.clamp;
const lerp = T.MathUtils.lerp;
const smooth = (a,b,v) => T.MathUtils.smoothstep(v,a,b);
const v = (x,y,z) => new T.Vector3(x,y,z);
const mat = (color,roughness=.8,other={}) => new T.MeshStandardMaterial({color,roughness,...other});
const sphere = new T.SphereGeometry(1,24,16);
const stoneGeo = new T.IcosahedronGeometry(1,1);
const sugarGeo = new RoundedBoxGeometry(1,1,1,1,.105);
const boxGeo = new T.BoxGeometry(1,1,1);
const roundGeo = new RoundedBoxGeometry(1,1,1,2,.09);
const rodGeo = new T.CylinderGeometry(1,1,1,9);
const axisY = v(0,1,0);

function mesh(parent, geometry, material, x,y,z, sx=1,sy=1,sz=1, shadow=true) {
  const object = new T.Mesh(geometry,material);
  object.position.set(x,y,z);
  object.scale.set(sx,sy,sz);
  object.castShadow = shadow;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
const orb = (g,m,x,y,z,sx,sy,sz) => mesh(g,sphere,m,x,y,z,sx,sy,sz);
const box = (g,m,x,y,z,sx,sy,sz,r=false) => mesh(g,r?roundGeo:boxGeo,m,x,y,z,sx,sy,sz);

function grain(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(256,256);
  for (let y=0;y<256;y++) for(let x=0;x<256;x++){
    const j=(y*256+x)*4;
    const layers = kind==='wood'
      ? 14*Math.sin(y*.165+Math.sin(x*.022)*.8)+6*Math.sin(y*.84+x*.03)
      : 12*Math.sin(x*.074)*Math.cos(y*.042)+8*Math.sin(y*.23+x*.11);
    const a=155+layers+(random()-.5)*(kind==='soil'?68:37);
    data.data[j]=a+15; data.data[j+1]=a; data.data[j+2]=a-12; data.data[j+3]=255;
  }
  ctx.putImageData(data,0,0);
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const soilTex = grain('soil');
const floorTex = soilTex.clone();
floorTex.repeat.set(7,8);
floorTex.needsUpdate = true;
const wall = mat(0x826c62,.97,{map:soilTex,bumpMap:soilTex,bumpScale:.24});
const dirt = mat(0x786455,.93,{map:floorTex,bumpMap:floorTex,bumpScale:.085});
const woodTex = grain('wood');
const wood = mat(0xb1875d,.67,{map:woodTex,bumpMap:woodTex,bumpScale:.045});
const endWood = mat(0x62432f,.77,{map:woodTex});
const card = mat(0xbe9263,.86,{map:woodTex,bumpMap:woodTex,bumpScale:.025});
const innerCard = mat(0x806541,.96,{map:woodTex});
const tape = mat(0xd5bb88,.46);
const paper = mat(0xe6d3ad,.85);
const stoneMats = [0x50443a,0x685749,0x847267,0x493c32,0x968671].map(c=>mat(c,.98,{map:soilTex,bumpMap:soilTex,bumpScale:.10}));
const sugarMats = [0xffeac8,0xfff7e4,0xe8dbbc,0xf0ede4].map(c=>mat(c,.54,{map:soilTex,bumpMap:soilTex,bumpScale:.009}));
const snowMat = mat(0xbac9d9,.92,{map:soilTex,bumpMap:soilTex,bumpScale:.12});
const metal = mat(0x647283,.35,{metalness:.62});
const brass = mat(0x99855d,.35,{metalness:.65});
const black = mat(0x141823,.35,{metalness:.26});

box(indoors,dirt,0,-.22,1,13,.44,22);

// An uneven earthen vault, open toward the camera.
const vaultPositions = [], vaultUv = [], vaultFaces = [];
for(let j=0;j<=17;j++) for(let i=0;i<=28;i++){
  const theta=i/28*Math.PI, depth=j/17;
  const ripple=.17*Math.sin(i*.86+j*.7)+.12*Math.cos(i*2.2-j*.79)+.31*Math.cos(j*.58);
  vaultPositions.push(Math.cos(theta)*(4.1+ripple), Math.sin(theta)*(4.6+ripple)-.22, -4.8+depth*8.25);
  vaultUv.push(i/28*5,j/17*4);
  if(i && j){
    const n=j*29+i;
    vaultFaces.push(n,n-1,n-30,n,n-30,n-29);
  }
}
const vault = new T.BufferGeometry();
vault.setAttribute('position',new T.Float32BufferAttribute(vaultPositions,3));
vault.setAttribute('uv',new T.Float32BufferAttribute(vaultUv,2));
vault.setIndex(vaultFaces);
vault.computeVertexNormals();
wall.side = T.DoubleSide;
mesh(indoors,vault,wall,0,0,0,1,1,1,false);
box(indoors,wall,0,2.1,-4.8,8,4.3,.28);
const archDark=mat(0x16171b,1);
orb(indoors,archDark,-2.6,1,-4.60,.86,1.41,.056);
box(indoors,archDark,-2.6,.42,-4.54,1.65,.85,.045);
for(let i=0;i<=14;i++){
  const a=i/14*Math.PI;
  const s=mesh(indoors,stoneGeo,stoneMats[i%5],-2.6+Math.cos(a)*.94,.69+Math.sin(a)*1.62,-4.45,.21,.22,.21);
  s.rotation.z=a;
}
for(let i=0;i<98;i++){
  const x=(random()-.5)*8,z=random()*10-5;
  const s=.035+random()*.12;
  const pebble=mesh(indoors,stoneGeo,stoneMats[i%5],x,s*.25,z,s*(1+random()),s*.62,s,! (i%3));
  pebble.rotation.y=random()*6;
}
for(let i=0;i<32;i++){
  const x=(i%2===0?1:-1)*(3.45+random()*.65), z=-4.5+random()*8;
  mesh(indoors,stoneGeo,stoneMats[i%5],x,.04+random()*.31,z,.3+random()*.37,.15+random()*.25,.23+random()*.4);
}

const shelf = new T.Group();
shelf.position.set(.05,0,-2.58);
indoors.add(shelf);
for(const x of [-1.67,1.67]) for(const z of [-.43,.38]){
  box(shelf,wood,x,1.47,z,.19,2.92,.19,true);
  for(const y of [.34,1.22,2.10,2.80]){
    orb(shelf,brass,x,y,z+.102,.028,.028,.009);
  }
}
const sugar = [];
for(let tier=0;tier<3;tier++){
  const y=.31+tier*.86;
  box(shelf,wood,0,y,0,3.55,.135,1.05,true);
  box(shelf,endWood,0,y-.09,.51,3.6,.10,.09,true);
  box(shelf,wood,0,y+.09,-.47,3.3,.09,.07);
  for(let i=0;i<25;i++){
    const row=Math.floor(i/9);
    const cube=mesh(shelf,sugarGeo,sugarMats[i%4],(i%9-4)*.338+(random()-.5)*.086,y+.18+row*.026,.32-row*.27,
      .19+random()*.09,.18+random()*.11,.19+random()*.12);
    cube.rotation.set(random()*.45,random()*.75,random()*.55);
    sugar.push(cube);
  }
}
const lamp = new T.Group();
lamp.position.copy(lantern.position);
indoors.add(lamp);
const bulb = mat(0xffdf8f,.26,{emissive:0xffa94a,emissiveIntensity:4.5});
orb(lamp,bulb,0,0,0,.12,.19,.12);
box(lamp,brass,0,-.19,0,.34,.065,.30,true);
box(lamp,brass,0,.20,0,.31,.066,.27,true);
for(const x of [-1,1]) for(const z of [-1,1]) box(lamp,brass,x*.125,0,z*.099,.031,.40,.026);
box(lamp,endWood,0,.47,0,.036,.49,.036);
const lampGlass = mat(0xffd985,.2,{transparent:true,opacity:.16,depthWrite:false});
mesh(lamp,sphere,lampGlass,0,0,0,.174,.2,.147,false);

// Reusable physical packing boxes with open cavities and paper flaps.
function parcel(parent, index, opened=false){
  const g=new T.Group(); parent.add(g);
  const h=.57+random()*.25,w=.82+random()*.23,d=.66+random()*.24;
  box(g,innerCard,0,.035,0,w,.07,d,true);
  for(const x of [-1,1]) box(g,card,x*w*.48,h/2,0,.045,h,d);
  for(const z of [-1,1]) box(g,card,0,h/2,z*d*.48,w,h,.042);
  if(opened){
    for(const x of [-1,1]){
      const flap=box(g,card,x*(w*.51+.10),h+.105,0,w*.38,.029,d);
      flap.rotation.z=x*.84;
    }
    for(const z of [-1,1]){
      const flap=box(g,card,0,h+.055,z*(d*.52+.08),w,.027,d*.34);
      flap.rotation.x=-z*.50;
    }
  }else{
    box(g,card,0,h,0,w,.052,d);
    box(g,tape,0,h+.031,0,w*.17,.009,d);
    box(g,tape,0,h*.82,d*.506,w*.17,h*.35,.006);
  }
  box(g,paper,-w*.19,h*.65,d*.511,.25,.147,.007);
  for(let i=0;i<9;i++)
    box(g,endWood,-w*.19-.078+i*.014,h*.65,d*.518,.004+(i%3)*.001,.075,.004);
  g.rotation.y=(random()-.5)*.62;
  g.userData.height=h;
  return g;
}
const cartons = Array.from({length:20},(_,i)=>{
  const p=parcel(indoors,i,i%4===0 || i>12);
  if(i===19) p.position.set(-2.6,.03,-3.28);
  else {
    const col=i%6,row=Math.floor(i/6);
    const coords=[[-2.72,-1.7],[2.46,-2.4],[-2.92,.60],[2.81,.08],[-2.25,1.75],[2.52,1.80]];
    p.position.set(coords[col][0]+(random()-.5)*.25,row*.67,coords[col][1]+(random()-.5)*.22);
    p.scale.setScalar(.97);
  }
  return p;
});
cartons[19].scale.setScalar(2.86);
const delivery=parcel(action,92);
const carried=Array.from({length:3},(_,i)=>parcel(action,93+i));
const empty=parcel(action,97,true);
const cube=mesh(action,sugarGeo,sugarMats[1],0,0,0,.44,.44,.44);
const bag=new T.Group(); action.add(bag);
orb(bag,paper,0,.32,0,.32,.33,.23);
box(bag,paper,0,.605,0,.23,.19,.10,true).rotation.z=.12;
orb(bag,tape,0,.566,0,.21,.028,.10);
const coins = Array.from({length:7},(_,i)=>{
  const coin = mesh(action,rodGeo,brass,0,0,0,.105,.036,.105);
  coin.rotation.z=i*.12;
  return coin;
});
const cushion=orb(action,mat(0x935147,.89,{map:woodTex}),0,0,0,.42,.19,.32);
const speaker=box(action,black,0,0,0,.42,.45,.27,true);
for(const dy of [-.085,.09]) orb(speaker,metal,0,dy/.45,.52,.29,.16,.06);
const house=new T.Group();
action.add(house);
box(house,wood,0,.22,0,.55,.44,.42,true);
mesh(house,new T.ConeGeometry(.50,.32,4),mat(0x7d423a),0,.59,0,1,1,1).rotation.y=Math.PI/4;
box(house,black,0,.12,.218,.13,.24,.014);
const shoes=Array.from({length:6},(_,i)=>{
  const shoe=new T.Group(); action.add(shoe);
  const red=mat(i%2?0xb55a46:0x4a8392,.82);
  box(shoe,paper,0,.047,0,.195,.072,.36,true);
  orb(shoe,red,0,.129,.015,.096,.09,.166);
  orb(shoe,red,0,.162,-.086,.094,.107,.10);
  orb(shoe,black,0,.227,-.091,.055,.012,.052);
  for(let l=0;l<3;l++) box(shoe,paper,0,.219-l*.012,-.040+l*.043,.104,.012,.013,true);
  return shoe;
});
const flyer=box(action,paper,0,0,0,1,.020,.65,true);
const flyerFront=new T.PlaneGeometry(.92,.58);
const flyerCanvas=document.createElement('canvas');
flyerCanvas.width=368; flyerCanvas.height=232;
const flyerMap=new T.CanvasTexture(flyerCanvas);
flyerMap.colorSpace=T.SRGBColorSpace;
const flyerSurface=mesh(flyer,flyerFront,mat(0xffffff,.74,{map:flyerMap}),0,.525,0,1,1,1,false);
flyerSurface.scale.z=1/.65;
flyerSurface.rotation.x=-Math.PI/2;

// A garden at ant height. Mounds and blades are placed in full 3D.
box(outdoors,dirt,0,-.26,0,35,.47,32);
for(let i=0;i<52;i++){
  const x=(random()-.5)*25,z=-13+random()*17;
  const s=.16+random()*.42;
  mesh(outdoors,stoneGeo,stoneMats[i%5],x,s*.15,z,s,s*.49,s*.71,i%3===0).rotation.y=random()*6;
}
const leafGeo = new T.PlaneGeometry(1,1,2,5);
const lp=leafGeo.attributes.position;
for(let i=0;i<lp.count;i++){
  const y=lp.getY(i)+.5;
  lp.setXYZ(i,lp.getX(i)*Math.sin((y*.94+.04)*Math.PI),y,y*y*.31);
}
leafGeo.computeVertexNormals();
const greens=[0x536642,0x536848,0x7d8750,0x626f42].map(c=>mat(c,.86,{side:T.DoubleSide}));
const dead=[0xa38b67,0x6b6c4b,0x705c43,0x887452].map(c=>mat(c,.96,{side:T.DoubleSide}));
const grass = [];
for(let i=0;i<205;i++){
  let x=(random()-.5)*21,z=random()*24-16;
  if(x*x+z*z<6) x+=(x<0?-1:1)*2.4;
  const h=.28+random()*1.59, type=i%4;
  const blade=mesh(outdoors,leafGeo,greens[type],x,-.012,z,.12+random()*.28,h,h,true);
  blade.rotation.set(0,random()*6.28,(random()-.5)*.60);
  grass.push({blade,theta:blade.rotation.z,type});
}
for(let i=0;i<10;i++){
  const x=(i-4.5)*2.5,z=-12-random()*5;
  const limb=mesh(outdoors,rodGeo,endWood,x,2.1,z,.14,4.6,.14,false);
  limb.rotation.z=(random()-.5)*.55;
}
const mound=orb(outdoors,wall,0,-.06,-2.35,2.1,.84,1.3);
orb(outdoors,archDark,0,.18,-1.24,.57,.56,.06);
const drift = new T.Group();
outdoors.add(drift);
for(let i=0;i<32;i++){
  const x=(random()-.5)*21,z=random()*17-12;
  if(Math.abs(x)>1.5 || z<-4) orb(drift,snowMat,x,-.14,z,.55+random()*1.8,.18+random()*.24,.59+random()*1.24);
}
const door=box(outdoors,wood,0,.27,-1.175,1.10,1.04,.09,true);
orb(outdoors,brass,.21,.27,-1.11,.057,.06,.05);

const shell = new T.MeshPhysicalMaterial({color:0x9c4029,roughness:.37,clearcoat:.31,clearcoatRoughness:.31,
  bumpMap:soilTex,bumpScale:.016});
const belly = new T.MeshPhysicalMaterial({color:0x603126,roughness:.42,clearcoat:.26,bumpMap:soilTex,bumpScale:.019});
const limbMat = mat(0x6f3122,.48);
const enamel = mat(0xf8dcc4,.46);
const pupil = new T.MeshPhysicalMaterial({color:0x141016,roughness:.16,clearcoat:1});

function strut(parent,material) {
  return mesh(parent,rodGeo,material,0,0,0,1,1,1);
}
function between(object,a,b,radius){
  object.position.copy(a).lerp(b,.5);
  const normal=b.clone().sub(a);
  object.scale.set(radius,normal.length(),radius);
  object.quaternion.setFromUnitVectors(axisY,normal.normalize());
}

function makeAnt(size, queen=false) {
  const group=new T.Group();
  action.add(group);
  group.scale.setScalar(size);
  const rig=new T.Group();
  group.add(rig);
  const abdomen=orb(rig,belly,0,.67,-.49,.34,.345,queen?.68:.52);
  orb(rig,shell,0,.63,-.17,.17,.20,.20);
  orb(rig,shell,0,.63,.055,.247,.27,.30);
  const head=new T.Group();
  head.position.set(0,.87,.37);
  rig.add(head);
  orb(head,shell,0,0,0,.34,.33,.30);
  const eyes=[], lids=[], antenna=[];
  for(const side of [-1,1]){
    const eye=new T.Group(); eye.position.set(side*.167,.062,.230); eye.rotation.y=side*.44;
    head.add(eye);
    orb(eye,enamel,0,0,0,.127,.154,.092);
    orb(eye,pupil,-side*.012,.005,.078,.075,.100,.044);
    eyes.push(eye);
    const brow=orb(head,belly,side*.165,.211,.261,.123,.037,.031);
    brow.rotation.z=side*.14;
    lids.push(brow);
    orb(head,limbMat,side*.094,-.194,.217,.076,.103,.091).rotation.z=side*.36;
    const joints=[strut(head,limbMat),strut(head,shell),orb(head,belly,0,0,0,.039,.041,.039)];
    antenna.push(joints);
  }
  if(queen){
    const crownMesh = mesh(head,rodGeo,brass,0,.33,-.023,.192,.09,.192);
    for(let i=0;i<7;i++){
      const a=i/7*2*Math.PI;
      mesh(head,new T.ConeGeometry(.041,.13,6),brass,.168*Math.cos(a),.42,.168*Math.sin(a)-.023);
    }
    orb(head,mat(0xa15352,.26,{metalness:.42}),0,.38,.172,.063,.062,.045);
  }
  const legs=[];
  for(const side of [-1,1]) for(let i=0;i<3;i++)
    legs.push({side,i,upper:strut(rig,shell),shin:strut(rig,limbMat),joint:orb(rig,belly,0,0,0,.052,.052,.052)});
  function pose(t,walk=0,tap=0,worry=0,carry=0,tired=0){
    const phase=t*(carry>0?9:13);
    const breath=Math.sin(t*3.9);
    rig.position.y=(.022+walk*.023)*breath-.09*tired;
    abdomen.rotation.x=.03*Math.sin(phase)+.13*tired;
    head.rotation.x=.026*breath+.27*tap+.22*tired-.27*carry;
    head.rotation.y=.10*Math.sin(t*2.2)*(1-tap);
    head.rotation.z=.055*Math.cos(t*2.5)+.08*worry;
    const blink=1-.94*Math.exp(-Math.pow(((t+1.1)%4.13-2.1)*17,2));
    for(let j=0;j<2;j++){
      const sign=j*2-1;
      eyes[j].scale.y=blink*(1-.22*tired);
      lids[j].rotation.z=sign*(.13+.28*worry);
      const twitch=.075*Math.sin(t*5+1.7*j);
      const press=Math.pow(Math.max(0,Math.cos(t*9+j*1.8)),4)*tap;
      const a=v(.12*sign,.244,.09);
      const b=v((.22+twitch)*sign,.47-.09*tired,.16+.12*tap);
      const c=v((.35+twitch)*sign,.55-.15*tired-.26*press,.26+.24*tap);
      between(antenna[j][0],a,b,.030);
      between(antenna[j][1],b,c,.023);
      antenna[j][2].position.copy(c);
    }
    for(const l of legs){
      const stride=Math.sin(phase+(l.i%2)*Math.PI+(l.side>0?0:Math.PI))*walk;
      const lift=Math.max(0,Math.cos(phase+(l.i%2)*Math.PI+(l.side>0?0:Math.PI)))*walk;
      const row=(1-l.i)*.19;
      const a=v(l.side*.16,.58,row);
      const b=v(l.side*(.40+.055*(l.i===1)),.42+.07*lift,row+.09+stride*.075);
      const c=v(l.side*(.54+.068*(l.i===1)),.045+.19*lift,row*1.95+.12+stride*.27);
      if(l.i===0){
        c.lerp(v(l.side*.33,1.05,.67),carry);
        b.lerp(v(l.side*.32,.79,.40),carry);
      }
      between(l.upper,a,b,.052);
      between(l.shin,b,c,.037);
      l.joint.position.copy(b);
    }
  }
  return {group,pose};
}
const hero=makeAnt(1.02);
const queen=makeAnt(1.17,true);
const friends=[makeAnt(.70),makeAnt(.74),makeAnt(.68)];

function phone(){
  const g=new T.Group(); action.add(g);
  box(g,metal,0,.07,0,1.21,.135,2.11,true);
  box(g,black,0,.14,0,1.182,.055,2.075,true);
  box(g,metal,.607,.082,-.45,.017,.037,.29,true);
  const bitmap = document.createElement('canvas');
  bitmap.width=324; bitmap.height=576;
  const texture=new T.CanvasTexture(bitmap);
  texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=4;
  const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});
  const face=mesh(g,new T.PlaneGeometry(1.106,1.96),material,0,.173,0,1,1,1,false);
  face.rotation.x=-Math.PI/2;
  let last='';
  function draw(status) {
    if(status===last) return;
    last=status;
    const ctx=bitmap.getContext('2d');
    const words=(line,y,px,fill='#fff',weight='600')=>{
      ctx.fillStyle=fill;ctx.font=weight+' '+px+'px Kanit, sans-serif';ctx.textAlign='center';ctx.fillText(line,162,y);
    };
    const rect=(x,y,w,h,r,color)=>{
      ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
    };
    ctx.fillStyle='#111820';ctx.fillRect(0,0,324,576);
    if(status==='off') {
      const gradient=ctx.createLinearGradient(0,0,324,576);
      gradient.addColorStop(0,'#20272d');gradient.addColorStop(.5,'#101a22');gradient.addColorStop(1,'#13171c');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,324,576);
    }else if(status==='lock'){
      const gradient=ctx.createLinearGradient(0,0,324,576);
      gradient.addColorStop(0,'#101944');gradient.addColorStop(.5,'#247886');gradient.addColorStop(1,'#141a2b');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,324,576);
      words('08:47',179,77);
      rect(111,341,102,100,23,'#db7143');
      rect(132,375,60,45,10,'#fce3ac');
      ctx.strokeStyle='#fce3ac';ctx.lineWidth=5;ctx.beginPath();ctx.arc(162,376,17,Math.PI,0);ctx.stroke();
    }else if(status==='battery'){
      rect(91,235,139,61,12,'#8c9ba6');rect(225,251,11,29,4,'#8c9ba6');
      rect(99,243,123,45,8,'#141c26');rect(102,247,15,37,4,'#ca4938');
      words('0%',355,40,'#b7c4d1');
    }else{
      ctx.fillStyle='#f5e9da';ctx.fillRect(0,0,324,576);
      rect(0,0,324,146,3,status==='12.12'?'#664b89':'#b14739');
      const sale=status==='11.11'||status==='12.12';
      words(sale?status:'ร้านริมรัง',102,68);
      rect(40,171,244,172,15,'#d8b29a');
      rect(110,201,112,109,17,'#efdec8');
      for(let i=0;i<16;i++) rect(124+(i%4)*21,222+Math.floor(i/4)*17,16,14,3,i%3?'#fff1dd':'#fbf8e7');
      words('น้ำตาล',396,47,'#292b3c');
      words(status==='terms'?'ผ่อนสบาย • จ่ายปลายเดือน':'1 บาท  /  ส่งฟรี',443,status==='terms'?25:37,'#6f3528');
      rect(39,471,246,69,16,'#b14739');
      words(status==='bought'?'สั่งแล้ว  ✓':'กดสั่ง',516,34);
    }
    rect(111,8,102,14,7,'#111923');
    texture.needsUpdate=true;
  }
  return {g,draw};
}
const handset=phone(), handset2=phone();
const regularFace = new FontFace('Kanit','url(./Kanit-SemiBold.ttf)',{weight:'600'});
await regularFace.load();
document.fonts.add(regularFace);
const flyerInk=flyerCanvas.getContext('2d');
flyerInk.fillStyle='#e8d4aa'; flyerInk.fillRect(0,0,368,232);
flyerInk.fillStyle='#ae533e'; flyerInk.fillRect(0,0,368,49);
flyerInk.fillStyle='#f9e7cf'; flyerInk.font='600 33px Kanit'; flyerInk.fillText('ร้านริมรัง',22,35);
flyerInk.fillStyle='#70443b'; flyerInk.font='600 77px Kanit'; flyerInk.fillText('12.12',58,151);
flyerInk.font='600 26px Kanit'; flyerInk.fillText('รายการลดราคา',83,196);
flyerMap.needsUpdate=true;

const moteShape = new T.BufferGeometry();
const motePositions = new Float32Array(190*3);
const moteData=Array.from({length:190},()=>[(random()-.5)*15,random()*6,(random()-.5)*18,random()]);
moteShape.setAttribute('position',new T.BufferAttribute(motePositions,3));
const moteMat=new T.PointsMaterial({color:0xe1ebf3,size:.027,transparent:true,opacity:.65,depthWrite:false,
  blending:T.AdditiveBlending});
const motes=new T.Points(moteShape,moteMat);
motes.frustumCulled=false;
scene.add(motes);

// Position, target, and movement for each shot, in world units.
const shots = [
  [[3.25,2.47,6.8],[.1,1.18,-.16],[-.52,-.07,-.36]],
  [[-1.80,1.40,5.3],[-.35,.71,0],[1.10,.15,-.31]],
  [[3.50,2.21,5.98],[0,1.47,-1.90],[-.43,.07,-.83]],
  [[.48,1.65,5.01],[-.18,1.03,.13],[-.64,.19,-.45]],
  [[1.1,1.34,3.47],[.10,.37,.11],[-.40,-.28,-.46]],
  [[-.52,2.83,3.00],[.15,.20,.21],[.47,-.31,-.32]],
  [[2.29,1.59,4.82],[.08,.76,-.6],[-.42,-.12,-.35]],
  [[.71,2.50,3.29],[0,.54,.03],[-.70,-.26,-.09]],
  [[.42,3.07,2.91],[.02,.44,.28],[-.56,-.13,-.20]],
  [[-1.31,2.42,3.53],[.14,.52,.20],[.83,-.25,-.14]],
  [[-2.48,2.15,6.76],[-1.81,1.09,-1.92],[.79,.34,-.29]],
  [[3.24,1.62,5.31],[-.12,.85,.34],[-.97,.17,-.52]],
  [[1.19,1.94,4.95],[-.19,1.07,.11],[-1.00,-.14,-.45]],
  [[.19,3.08,2.76],[0,.14,.32],[-.29,-.31,-.24]],
  [[-2.20,1.46,4.24],[0,.63,-1.45],[.82,.25,-.15]],
  [[3.49,2.23,5.92],[0,1.46,-1.91],[-.41,.06,-.80]],
  [[1.49,1.60,3.72],[0,.63,.21],[-.75,-.28,-.45]],
  [[2.13,4.05,5.94],[.27,1.20,-.18],[-.79,-.79,-.18]],
  [[-.52,1.72,5.14],[-.12,1.12,.02],[.61,-.12,-.52]],
  [[.76,1.22,3.07],[.06,.89,.32],[-.51,-.04,-.70]],
  [[3.25,2.47,6.8],[.1,1.18,-.16],[0,0,0]],
];

function place(ant,x,z,angle,t,walk=0,tap=0,worry=0,carry=0,tired=0,y=0){
  ant.group.visible=true;
  ant.group.position.set(x,y,z);
  ant.group.rotation.y=angle;
  ant.pose(t,walk,tap,worry,carry,tired);
}
function prop(g,x,y,z,scale=1){
  g.visible=true;
  g.scale.setScalar(scale);
  g.position.set(x,y,z);
}
function screen(device,x,z,angle,scale,status,y=0){
  prop(device.g,x,y,z,scale);
  device.g.rotation.set(0,angle,0);
  device.draw(status);
}
const allAction=[hero.group,queen.group,...friends.map(a=>a.group),handset.g,handset2.g,delivery,...carried,empty,cube,bag,
  ...coins,cushion,speaker,house,...shoes,flyer];

function frame(id,u,t=0,beat=0){
  u=clamp(u,0,1);
  const outdoor = [2,5,15].includes(id);
  const winter = [1,15,16,17,18,19,20,21].includes(id);
  const cold = winter ? 1 : id>=11 ? .29 : 0;
  const phase = smooth(0,1,u);
  const night = winter || id===14;
  indoors.visible=!outdoor; outdoors.visible=outdoor;
  drift.visible=winter; door.visible=winter;
  if(outdoor) for(const {blade,theta,type} of grass){
    blade.material=(winter?dead:greens)[type];
    blade.rotation.z=theta+.085*Math.sin(t*2.7+blade.position.x*.8);
  }
  for (const object of allAction) object.visible=false;
  const cartonCount = winter?19:id===7?1:id===8?2:id===9?4:id===10?7:id>=11&&id!==14?13:0;
  cartons.forEach((carton,i)=>carton.visible=(i<cartonCount || i===19&&id===11)&&!outdoor);
  if(id===11) cartons.forEach((carton,i)=>{carton.visible=i===19||i===1||i===7||i===13;});
  const supplies=id===3?Math.floor(32+43*phase):id<=4?75:id===7?65:id<11?45:id<15?14:0;
  sugar.forEach((item,i)=>item.visible=i<supplies && !winter);
  const haze = new T.Color(outdoor ? (winter?0x6d879c:0x829274) : (winter?0x26384e:0x523e39));
  scene.background=haze;
  scene.fog=new T.FogExp2(haze,outdoor?.069:winter?.049:.027);
  hemisphere.color.setHex(winter?0x9fc5ff:0xffe2ba);
  hemisphere.groundColor.setHex(winter?0x535b71:0x926745);
  hemisphere.intensity=winter?1.13:1.16;
  key.color.setHex(winter?0xa9d0ff:0xffddad);
  key.intensity=winter?2.43:outdoor?3.35:2.85;
  key.position.set(winter?-3.5:-3.85,5.75,winter?4.9:3.6);
  key.target.position.set(.35,.08,-1.05);
  bounce.intensity=winter?1.36:.48;
  bounce.position.set(3.93,2.78,winter?-2.48:3.25);
  lantern.intensity=outdoor?0:lerp(19,3.7,cold)*(1+.034*Math.sin(t*9));
  bulb.emissiveIntensity=lerp(4.2,.69,cold);
  screenLight.intensity=0;
  moteMat.opacity=winter?.77:.19;
  moteMat.size=winter?.034:.022;
  for(let i=0;i<moteData.length;i++){
    const [x,y,z,s]=moteData[i];
    motePositions[i*3]=x+Math.sin(t*.55+s*40)*.42;
    motePositions[i*3+1]=(y-t*(winter?.26:.041)*(s+.28)%6+6)%6;
    motePositions[i*3+2]=z+Math.cos(t*.16+s*35)*.32;
  }
  moteShape.attributes.position.needsUpdate=true;

  let animatedTarget=null;
  switch(id){
    case 1:
    case 21:
      place(hero,.15,.55,.32,id===1?u*.50:.5*(1-u),0,.30,.20,0,.49);
      screen(handset,.17,1.42,-.25,.72,'store');
      screenLight.position.set(.16,.42,1.29); screenLight.intensity=4.8;
      break;
    case 2: {
      const x=lerp(-1.08,.81,phase);
      place(hero,x,.32,.78,t,1,0,0,.83);
      prop(cube,x+.65,1.26+Math.sin(t*13)*.022,.92,.42);
      animatedTarget=v(x+.30,.77,.15);
      break;
    }
    case 3:
      place(hero,lerp(-.39,.66,phase),-1.17,-.65,t,phase<.60?.72:0,0,0,1-smooth(.51,.79,u));
      prop(cube,lerp(-.73,.04,phase),lerp(.82,2.12,smooth(.60,.85,u)),-.47-1.57*smooth(.60,.90,u),.42);
      break;
    case 4:
      place(hero,.59,.28,-.61,t,0,0,0);
      place(queen,-.75,.10,.57,t+.61,0,0,.11);
      place(friends[0],-1.43,-.65,.49,t+1,0);
      break;
    case 5: {
      const drop=smooth(.10,.41,u), wobble=Math.max(0,1-drop);
      screen(handset,.03,.32,-.44,.98,'lock',2.7*wobble);
      handset.g.rotation.x=wobble*1.1+Math.sin(drop*16)*wobble*.22;
      place(hero,-.74,-.32,.41,t,0,0,smooth(.22,.57,u));
      screenLight.position.set(.10,.36,.20);screenLight.intensity=4.3;
      break;
    }
    case 6:
      screen(handset,.19,.36,.12,1.15,u<.39?'lock':'store');
      place(hero,lerp(-.49,.14,phase),lerp(-.23,.39,phase),.58,t,1-smooth(.26,.48,u),smooth(.34,.63,u),0,0,0,.18*phase);
      screenLight.position.set(.15,.43,.40);screenLight.intensity=7;
      break;
    case 7:
      place(hero,.57,.41,-.22,t,0,.49,0);
      prop(delivery,-.77,.03+1.05*(1-smooth(.22,.40,u)),-.36,1.33);
      if(u>.48) prop(bag,-.75,.64,-.30);
      screen(handset,.58,1.35,.38,.62,'bought');
      break;
    case 8:
      screen(handset,-.67,.60,.33,.78,'store');
      screen(handset2,.68,.60,-.32,.78,'bought');
      place(hero,0,-.12,0,t,0,1,0);
      screenLight.position.set(.04,.44,.74);screenLight.intensity=5.1;
      break;
    case 9:
    case 10:
      screen(handset,.03,.47,-.14,1.12,id===9?'11.11':'12.12');
      place(hero,-.59,-.41,.41,t,0,1,0);
      const rise=.19+.08*Math.sin(t*2.5);
      if(id===9) {
        prop(bag,-.89,.02,-.53,.66);
        prop(cushion,1.01,rise,-.68);
        cushion.scale.set(.50,.18,.38);
      }
      else {
        prop(house,1.08,.0,-.74,1.17);
        prop(speaker,-.98,.27,-.33);
        speaker.scale.set(.42,.45,.27);
        if(u>.51) shoes.forEach((shoe,i)=>{
          const lifted=1-smooth(.52+i*.025,.69+i*.025,u);
          prop(shoe,-.79+(i%3)*.31,.08+lifted*(.49+i*.11),1.45+Math.floor(i/3)*.32);
          shoe.rotation.y=(i%3-1)*.19;
        });
      }
      screenLight.position.set(0,.44,.43);screenLight.intensity=6.7;
      break;
    case 11:
      cartons[19].position.y=.02+2.28*(1-smooth(.20,.39,u));
      place(hero,-1.05,.15,-.73,t,0,0,.86,0,.08);
      break;
    case 12:
      friends.forEach((ant,i)=>{
        const x=lerp(-1.35,.76,phase)+(i-1)*.72,z=.24+(1-i)*.79;
        place(ant,x,z,.88,t+i*.5,1,0,.68,1,.32);
        prop(carried[i],x+.19,.73+Math.sin(t*13+i)*.028,z+.27,.70);
      });
      break;
    case 13:
      place(hero,.61,.43,-.65,t,0,0,.74);
      place(queen,-.72,.02,.56,t+.5,0,0,.92);
      coins.forEach((coin,i)=>{
        prop(coin,.49+i*.024,.058+i*.030,.97);
        coin.scale.set(.11,.035,.11);
      });
      break;
    case 14:
      screen(handset,0,.32,-.10,1.02,'terms');
      place(hero,-.64,-.73,.40,t,0,.14,.77);
      screenLight.position.set(.08,.46,.33);screenLight.intensity=8.5;
      break;
    case 15:
      door.position.y=lerp(1.16,.27,smooth(.33,.78,u));
      place(hero,lerp(-1.06,-.31,phase),lerp(.80,-.56,phase),-.62,t,smooth(.13,.27,u),0,.60,0,.44);
      break;
    case 16:
      place(hero,.52,-.92,-.53,t,0,0,1,0,.6);
      prop(empty,.04,.025,-.82,1.06);
      break;
    case 17:
      friends.forEach((ant,i)=>place(ant,-.78+i*.64,-.41-i*.15,.39,t+i*.5,0,0,.82,0,.88));
      screen(handset,.23,.86,.35,.91,u<.56?'battery':'off');
      screenLight.position.set(.21,.4,.84);screenLight.intensity=2.9*(1-smooth(.46,.62,u));
      break;
    case 18:
      prop(empty,-.54,.015,.75,1.23);
      place(hero,.47,-.10,.31,t,0,.14,.44,0,.68);
      screen(handset,1.05,-.07,-.34,.56,'off');
      flyer.visible=true; flyer.position.set(.61,.07,.82); flyer.rotation.y=.24;
      break;
    case 19:
      place(hero,.55,.54,-.48,t,0,0,.93,0,.42);
      place(queen,-.75,.19,.60,t+.4,0,0,.47);
      place(friends[0],.65,-.92,.33,t+2,0);
      break;
    case 20:
      place(hero,.05,.32,.22,t,0,0,smooth(.35,.63,u),0,smooth(.40,.97,u)*.53);
      break;
    default: break;
  }
  const [p,q,move]=shots[id-1];
  const d=smooth(0,1,u);
  camera.position.set(p[0]+move[0]*d,p[1]+move[1]*d,p[2]+move[2]*d);
  const aim=animatedTarget || v(...q);
  camera.fov = id===14?38:id===20?37:39;
  camera.updateProjectionMatrix();
  camera.lookAt(aim);
  renderer.render(scene,camera);
}

window.stage = {
  frame,
  frames(items) {
    return items.map(a=>{
      frame(...a);
      return renderer.domElement.toDataURL('image/jpeg',.91).split(',')[1];
    });
  },
  gpu() {
    const gl=renderer.getContext(), debug=gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  }
};
frame(1,0,0,0);
