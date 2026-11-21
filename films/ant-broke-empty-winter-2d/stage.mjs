const W = 720, H = 1280;
const settings = new URLSearchParams(location.search);
const width = Number(settings.get('width') || W);
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = Math.round(width * H / W);
document.body.append(canvas);
const screen = canvas.getContext('2d', {alpha:false, desynchronized:true});
screen.scale(width/W,width/W);
let c = screen;

const font = new FontFace('Kanit','url(./Kanit-SemiBold.ttf)',{weight:'600'});
document.fonts.add(await font.load());
let brandImage;
if(settings.get('brand')==='frog-brag'){
  brandImage=new Image();
  brandImage.src='./liam/profile.png';
  await brandImage.decode();
}
const lerp = (a,b,t) => a+(b-a)*t;
const sat = x => Math.min(1,Math.max(0,x));
const ease = (a,b,x) => {const t=sat((x-a)/(b-a));return t*t*(3-2*t);};
const tau = Math.PI*2;
const pal = {
  warm: {
    sky:'#16232a', middle:'#895035', light:'#995f40', dark:'#21191f',
    ground:['#693c2b','#503226','#1b1820'], wall:['#38252b','#784631','#251b22'],
    stone:['#543135','#794536','#2f242a'], rim:'#f0b478', grain:'#e1a27c',
    wood:['#b6774e','#74432e','#402933'], sugar:['#fff0ca','#ddb68a','#957462'],
    ant:['#ed9660','#b94e39','#762a2b','#341c28'], shade:'#261720', bounce:'#e8a95e',
    lamp:'#ffcf83', near:'#22242a', snow:false,
  },
  cold: {
    sky:'#26374f', middle:'#394558', light:'#535870', dark:'#151b29',
    ground:['#4b4f58','#303545','#131b29'], wall:['#283245','#4c4b59','#1a2438'],
    stone:['#363a4d','#51546b','#232e44'], rim:'#adcbea', grain:'#a5b6cc',
    wood:['#8e7873','#5c4c51','#323347'], sugar:['#eff3ed','#c1bcbb','#7a8294'],
    ant:['#ca896e','#9d4c47','#613240','#25243b'], shade:'#141a29', bounce:'#a8c5e8',
    lamp:'#ffbc6a', near:'#131c2b', snow:true,
  }
};

function seeded(n){
  return () => ((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
}
function fill(style,x,y,w,h){c.fillStyle=style;c.fillRect(x,y,w,h);}
function path(style, draw, outline, width=1){
  c.beginPath();draw(c);
  if(style){c.fillStyle=style;c.fill();}
  if(outline){c.strokeStyle=outline;c.lineWidth=width;c.stroke();}
}
function poly(style,points,outline,width){
  path(style,g=>{g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.closePath();},outline,width);
}
function round(style,x,y,w,h,r,outline,width){
  path(style,g=>g.roundRect(x,y,w,h,r),outline,width);
}
function ellipse(style,x,y,rx,ry,angle=0,outline,width){
  path(style,g=>g.ellipse(x,y,rx,ry,angle,0,tau),outline,width);
}
function gradient(x,y,xx,yy,colors){
  const g=c.createLinearGradient(x,y,xx,yy);
  colors.forEach((stop,i)=>Array.isArray(stop)?g.addColorStop(...stop):g.addColorStop(i/(colors.length-1),stop));
  return g;
}
function glow(x,y,rx,ry,color,power=.5){
  c.save();c.translate(x,y);c.scale(rx,ry);
  const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,color);g.addColorStop(1,'transparent');
  c.globalAlpha*=power;
  ellipse(g,0,0,1,1);
  c.restore();
}
function stroke(style,width,draw){
  c.lineCap='round';c.lineJoin='round';
  path(null,draw,style,width);
}
function text(line,x,y,size,color,align='center'){
  c.font='600 '+size+'px Kanit';c.textAlign=align;c.fillStyle=color;c.fillText(line,x,y);
}
function drawBrand(image){
  const scale=W/1080;
  c.save();c.scale(scale,scale);
  c.textAlign='left';c.textBaseline='top';c.lineJoin='round';
  const outline=(line,x,y,size)=>{
    c.font='600 '+size+'px Kanit';
    c.lineWidth=8;c.strokeStyle='#123047';c.strokeText(line,x,y);
    c.fillStyle='#ffffff';c.fillText(line,x,y);
  };
  outline('สมมุติว่า…',70,60,44);
  outline('สัตว์วิวัฒน์',70,128,34);

  const handle='@som_mut123', top=70, right=66, diameter=84, gap=12;
  c.font='600 32px Kanit';
  const handleX=1080-right-c.measureText(handle).width;
  const centerX=handleX-gap-diameter/2, centerY=top+diameter/2;
  ellipse('#123047',centerX,centerY,45,45);
  ellipse('#ffffff',centerX,centerY,42,42);
  c.save();
  c.beginPath();c.arc(centerX,centerY,38,0,tau);c.clip();
  c.drawImage(image,centerX-38,centerY-38,76,76);
  c.restore();
  c.textBaseline='middle';
  outline(handle,handleX,centerY,32);
  c.restore();
}
function surface(w=W,h=H,draw){
  const item=new OffscreenCanvas(w,h);
  const old=c;
  c=item.getContext('2d');
  draw();
  c=old;
  return item;
}

const grain = surface(240,240,()=>{
  const d=c.createImageData(240,240), r=seeded(101);
  for(let i=0;i<d.data.length;i+=4){
    const t=r(), v=t<.52?13:245;
    d.data[i]=v;d.data[i+1]=v;d.data[i+2]=v;
    d.data[i+3]=Math.round(r()*28);
  }
  c.putImageData(d,0,0);
});
function grit(x,y,w,h,opacity=.65){
  c.save();c.globalAlpha*=opacity;
  fill(c.createPattern(grain,'repeat'),x,y,w,h);c.restore();
}

function rock(x,y,r,p,rng,ice=false){
  c.save();c.translate(x,y);
  const pts=[[-1,.12],[-.74,-.42],[-.3,-.67],[.27,-.53],[.79,-.36],[1,.09],[.67,.22],[-.6,.30]];
  const edge=pts.map(([a,b])=>[a*r,b*r+(rng()-.5)*r*.15]);
  poly(gradient(-r,-r,.52*r,.4*r,[p.rim,p.stone[1],p.stone[2]]),edge);
  poly(ice?'#b7c8d4':p.stone[0],[edge[0],edge[1],edge[2],edge[3],[r*.48,-r*.12],[0,-r*.025]]);
  stroke(ice?'#e0eafa':p.grain,Math.max(.5,r*.036),g=>{
    g.moveTo(...edge[1]);g.quadraticCurveTo(edge[2][0],edge[2][1]-3,...edge[3]);
  });
  c.restore();
}

function branch(x,y,h,lean,radius,color,highlight){
  c.save();c.translate(x,y);
  path(gradient(-radius,0,radius,0,[color,highlight,color]),g=>{
    g.moveTo(-radius,0);g.bezierCurveTo(lean*.2,-h*.4,lean*.55,-h*.74,lean,-h);
    g.bezierCurveTo(lean*.72,-h*.68,lean*.5,-h*.4,radius,0);g.closePath();
  });
  c.restore();
}

function backdrop(outside,p){
  const r=seeded(outside?551:730);
  fill(gradient(0,0,0,H,outside?
    [p.sky,p.snow?'#69869a':'#92946b',p.dark]:p.wall),-180,-160,1080,1590);
  if(outside){
    glow(p.snow?466:166,p.snow?260:310,260,390,p.snow?'#bfdee9':'#ffdc99',.71);
    for(let i=0;i<44;i++){
      const x=-170+r()*1070,y=710+r()*140,h=220+r()*880;
      c.globalAlpha=.12+r()*.14;
      branch(x,y,h,(r()-.5)*260,12+r()*33,p.sky,p.middle);
      if(i%4===0) glow(x,y-h*.4,21+r()*33,42+r()*32,p.rim,.50);
    }
    c.globalAlpha=1;
  }else{
    // Background arch layers each carry their own bounced edge light.
    for(let i=0;i<9;i++){
      const off=i*38;
      path(gradient(0,30+off,670,690,[p.dark,p.stone[i%3],p.wall[2]]),g=>{
        g.moveTo(-182,1300);g.lineTo(-182,580+off*.31);
        g.bezierCurveTo(-192+off*.78,108+off*.48,38+off*.54,-207+off*.93,431+off*.16,-100+off*.65);
        g.bezierCurveTo(926-off*.38, -19+off*1.1,901-off*.45,480+off*.5,904,1300);g.closePath();
      });
    }
    glow(558,202,320,663,p.snow?'#728cae':'#b67643',.40);
    c.save();c.globalAlpha=.32;
    for(let i=0;i<380;i++){
      const x=r()*1060-160,y=r()*800,sz=2+r()*13;
      ellipse(i%3?p.stone[2]:p.grain,x,y,sz,sz*.27,(r()-.5)*1.8);
    }
    c.restore();
    // Narrow split in the earth lets the winter sky pick out a cold edge.
    if(p.snow){
      poly('#b3cbdc',[[552,-60],[601,-35],[577,80],[592,129],[576,191],[590,230],[556,200],[562,128],[546,75]]);
      c.save();c.globalCompositeOperation='screen';
      poly(gradient(556,18,371,915,[[0,'#93bad74d'],[.55,'#577caa16'],[1,'#5372a900']]),
        [[533,-5],[603,0],[794,991],[138,927]]);
      c.restore();
    }
  }
  path(gradient(0,636,0,1360,p.ground),g=>{
    g.moveTo(-180,690);g.bezierCurveTo(107,711,235,619,489,662);
    g.quadraticCurveTo(725,649,900,692);g.lineTo(900,1450);g.lineTo(-180,1450);g.closePath();
  });
  c.save();
  for(let i=0;i<620;i++){
    const x=-160+r()*1050,y=680+r()*680,k=(y-610)/790;
    c.globalAlpha=.07+r()*.15;
    ellipse(i%4?p.shade:p.grain,x,y,1+r()*5*k,.5+r()*2.2,0);
  }
  c.restore();
  if(outside){
    for(let i=0;i<30;i++){
      const x=-100+r()*900, y=700+r()*113, h=55+r()*144;
      branch(x,y,h,(r()-.5)*172,3+r()*10,p.snow?'#424b55':'#4d583d',p.snow?'#77808a':'#987c4b');
    }
    if(p.snow) for(let i=0;i<19;i++){
      ellipse('#839dae',r()*920-120,710+r()*360,14+r()*69,2+r()*12,-.06);
    }
  }
  for(let i=0;i<32;i++) rock(r()*1000-140,733+r()*440,3+r()*16,p,r,outside&&p.snow&&i%5===0);
  grit(-170,-160,1060,1600,.48);
}

const backgrounds={};
for(const key of ['warm','cold']){
  for(const type of ['room','garden']){
    const art=surface(1056,1536,()=>{
      c.translate(168,128);
      backdrop(type==='garden',pal[key]);
    });
    backgrounds[key+type]=art;
  }
}

function beam(x,y,spread,power,angle,color){
  c.save();c.translate(x,y);c.rotate(angle);
  c.globalCompositeOperation='screen';
  const light=gradient(0,0,0,875,[[0,color+'31'],[.31,color+'14'],[.7,color+'05'],[1,color+'00']]);
  c.globalAlpha=.18+power*.32;
  for(let i=0;i<12;i++){
    const feather=.69+i*.047;
    poly(light,[[-6,0],[6,0],[spread*feather,989],[-spread*.67*feather,927]]);
  }
  c.globalAlpha=1;
  glow(0,419,spread*.82,449,color,power*.23);
  c.restore();
}

function floorShadow(x,y,w,h,opacity=.65,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(w,h);
  const s=c.createRadialGradient(0,0,.08,0,0,1);
  s.addColorStop(0,'#11131b');s.addColorStop(.37,'#11131bc9');s.addColorStop(1,'#11131b00');
  c.globalAlpha*=opacity;
  ellipse(s,0,0,1,1);
  c.restore();
}

function wood(x,y,w,h,p,seed=41,vert=false){
  const grad=gradient(x,y,x+(vert?w:0),y+(vert?0:h),[p.wood[0],p.wood[1],p.wood[2]]);
  round(grad,x,y,w,h,3,p.shade+'b0',1.2);
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  const r=seeded(seed);
  for(let i=0;i<8;i++){
    const v=r(),dark=i%3;
    stroke(dark?p.wood[2]+'5b':p.rim+'65',.5+r()*1.4,g=>{
      if(vert){g.moveTo(x+v*w,y);g.bezierCurveTo(x+v*w+w*.25,y+h*.4,x+v*w-w*.22,y+h*.66,x+v*w,y+h);}
      else{g.moveTo(x,y+v*h);g.bezierCurveTo(x+w*.27,y+v*h+h*.28,x+w*.67,y+v*h-h*.23,x+w,y+v*h);}
    });
  }
  c.restore();
}

function sugar(x,y,s,p,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);
  poly(p.sugar[2],[[0,0],[s*.68,-s*.39],[s*.68,s*.48],[0,s*.79]]);
  poly(p.sugar[1],[[-s*.58,-s*.21],[0,0],[0,s*.79],[-s*.58,s*.51]]);
  poly(p.sugar[0],[[-s*.58,-s*.21],[s*.10,-s*.55],[s*.68,-s*.39],[0,0]]);
  stroke('#fff5df',Math.max(1,s*.045),g=>{g.moveTo(-s*.55,-s*.21);g.lineTo(s*.10,-s*.52);g.lineTo(s*.65,-s*.39);});
  const r=seeded(211);
  c.globalAlpha*=.39;
  for(let i=0;i<13;i++)ellipse(i%3?'#9b735d':'#fff9e5',-s*.48+r()*s*.42,s*(.08+r()*.46),s*.02,s*.012);
  c.restore();
}

function shelves(p,amount){
  floorShadow(363,785,273,50,.65);
  round(gradient(95,280,650,798,['#1b1923b5',p.shade+'df']),106,341,487,422,12);
  for(const x of [117,594]) wood(x,320,22,473,p,55+x,true);
  for(let j=0;j<3;j++){
    const y=436+148*j, r=seeded(42+j);
    poly(p.wood[2],[[111,y],[591,y],[614,y+17],[128,y+25]]);
    fill(p.shade+'67',111,y+24,494,22);
    for(let i=0;i<12;i++){
      const x=152+i*37;
      if(i+j*12>=amount) break;
      floorShadow(x,y-3,18,7,.76);
      sugar(x+r()*8-4,y-15,18+r()*11,p,(r()-.5)*.58);
    }
    wood(112,y+9,503,20,p,j+204);
    stroke(p.rim+'83',1.35,g=>{g.moveTo(115,y+10);g.lineTo(614,y+10);});
    for(const x of [127,604])ellipse('#a38f7c',x,y+19,3,3,0,'#29202a',1);
  }
}

function tunnel(p,closed=false,outside=false){
  const x=outside?417:93, y=outside?759:774, w=outside?117:78, h=outside?175:164;
  floorShadow(x,y,w*1.3,33,.80);
  const arch=g=>{
    g.moveTo(x-w,y);g.lineTo(x-w,y-h*.39);
    g.bezierCurveTo(x-w,y-h*1.21,x+w,y-h*1.20,x+w,y-h*.39);g.lineTo(x+w,y);g.closePath();
  };
  path(gradient(x,y-h,x,y,[p.stone[1],p.stone[0],p.stone[2]]),arch,p.rim+'60',3);
  c.save();c.translate(x,y);c.scale(.79,.84);c.translate(-x,-y);
  path(gradient(x,y-h,x,y,[closed?p.wood[0]:p.shade,closed?p.wood[2]:'#15151d']),arch);
  if(closed){
    c.save();c.beginPath();arch(c);c.clip();
    for(let i=0;i<8;i++)wood(x-w+i*(w/4),y-h,Math.ceil(w/4),h,p,i+18,true);
    wood(x-w,y-32,w*2,13,p);
    ellipse('#d5a67e',x+31,y-74,9,9,0,'#3e2b2c',3);
    c.restore();
  }
  c.restore();
}

function lamp(p,t){
  const x=128,y=316;
  const life=.8+.14*Math.sin(t*5.5)+.06*Math.cos(t*11);
  beam(x,y+13,290,p.snow?.16:.65,-.24,p.lamp);
  glow(x,y,277,339,p.lamp,(p.snow?.23:.47)*life);
  stroke('#322936',4,g=>{g.moveTo(x,164);g.quadraticCurveTo(x-4,210,x,285);});
  round('#352830',x-24,y-26,48,56,8,p.wood[0],1.8);
  round(gradient(x-13,y-10,x+18,y+22,[p.wood[0],p.lamp,'#eb7a40']),x-14,y-20,28,44,8);
  ellipse('#fff0c4',x-2,y+5,6,16,-.13);
  for(const s of [-1,1]) stroke('#4f3c3b',3,g=>{g.moveTo(x+17*s,y-22);g.lineTo(x+16*s,y+25);});
  stroke('#f2b978',2.3,g=>{g.moveTo(x-19,y-25);g.lineTo(x+18,y-25);});
}

const shelfCache = new Map();
function cachedShelves(theme,amount){
  const key=theme+amount;
  if(!shelfCache.has(key)) shelfCache.set(key,surface(W,530,()=>{c.translate(0,-290);shelves(pal[theme],amount);}));
  return shelfCache.get(key);
}

function carapace(x,y,rx,ry,angle,p,lit=.62){
  c.save();c.translate(x,y);c.rotate(angle);
  const g=c.createRadialGradient(-rx*.37,-ry*.46,rx*.05,0,0,rx*1.11);
  [[0,p.ant[0]],[.38,p.ant[1]],[.76,p.ant[2]],[1,p.ant[3]]].forEach(stop=>g.addColorStop(...stop));
  ellipse(g,0,0,rx,ry,0,p.shade+'a5',1.75);
  c.save();c.beginPath();c.ellipse(0,0,rx,ry,0,0,tau);c.clip();
  glow(-rx*.4,-ry*.52,rx*.83,ry*.57,p.bounce,.21*lit);
  if(p.snow) glow(rx*.62,ry*.46,rx*.53,ry*.7,'#649ddb',.52*lit);
  grit(-rx,-ry,rx*2,ry*2,.22);
  c.restore();
  stroke(p.bounce+'95',2.25,g=>g.ellipse(0,0,rx*.955,ry*.955,0,3.73,5.51));
  c.restore();
}

function limb(a,b,d,width,p){
  const trace=g=>{g.moveTo(...a);g.quadraticCurveTo(a[0]*.12+b[0]*.88,b[1]-.9,...b);
    g.quadraticCurveTo(b[0]*.7+d[0]*.3,b[1]*.55+d[1]*.45,...d);};
  stroke(p.ant[3],width+3,trace);
  stroke(gradient(a[0],a[1],d[0],d[1],[p.ant[1],p.ant[2],p.ant[3]]),width,trace);
  stroke(p.bounce+'55',Math.max(1,width*.18),g=>{g.moveTo(a[0]-2,a[1]-2);g.lineTo(b[0]-2,b[1]-2);});
  ellipse(p.ant[2],...b,width*.49,width*.49);
}

function ant(x,y,scale,p,t,{
  face=1,front=0,walk=0,carry=0,look=0,worry=0,tired=0,queen=false,cast=true
}={}){
  if(cast){
    floorShadow(x+45*scale,y+15,159*scale,28*scale,.77,-.10);
    floorShadow(x-25*scale,y-1,81*scale,11*scale,.61);
  }
  c.save();c.translate(x,y);c.scale(scale*face,scale);
  c.lineCap='round';c.lineJoin='round';
  const bounce=Math.sin(t*4.1)*2.1+Math.sin(t*12)*4.7*walk;
  const squat=15*tired;
  c.translate(0,bounce+squat);
  const hx=lerp(58,14,front), hy=-121+14*look+4*tired;
  const feet=[];
  for(let row=0;row<3;row++) for(const side of [-1,1]){
    const phase=t*12+Math.PI*(row+(side>0));
    const footY=-bounce-squat-Math.max(0,Math.cos(phase))*15*walk;
    const footX=(row-1)*57+side*19+Math.sin(phase)*23*walk;
    let target=[footX,footY];
    if(row===2 && carry)target=[lerp(footX,hx+51+side*9,carry),lerp(footY,hy-12+side*11,carry)];
    feet.push({row,side,target});
  }
  for(const {row,side,target} of feet.filter(f=>f.side<0)){
    const a=[(row-1)*32,-78], b=[(row-1)*49-26,-51+(target[1]<-45?-39:0)];
    limb(a,b,target,8.5,p);
  }
  carapace(lerp(-82,-27,front),-77-(queen?10:0),queen?86:70,queen?63:49,.10,p);
  c.save();c.globalAlpha=.36;
  for(let i=0;i<3;i++)stroke(p.ant[3],1.3,g=>{
    const xx=lerp(-112,-51,front)+i*9;
    g.moveTo(xx,-109-i*3);g.quadraticCurveTo(xx+25,-82,xx+18,-47+i*3);
  });
  c.restore();
  carapace(-17,-86,29,33,.16,p);
  carapace(lerp(15,0,front),-87,39,35,.08,p);
  for(const {row,side,target} of feet.filter(f=>f.side>0)){
    const a=[(row-1)*32+5,-75], b=[(row-1)*55+12,-44+(target[1]<-45?-35:0)];
    limb(a,b,target,10.3,p);
  }

  c.save();c.translate(hx,hy);c.rotate(.11*look - .081*worry+Math.sin(t*2.2)*.025);
  for(const s of [-1,1]){
    const foot=[s*15,-38], bend=[s*27+8,-71+7*tired],
      reach=[s*45+15+look*28,-91+(tired*28)+(look*32)+Math.sin(t*5+s)*5];
    limb(foot,bend,reach,6.1,p);
    ellipse(p.ant[1],...reach,6,5.5,-s*.3,p.ant[3],1);
  }
  carapace(0,0,49,48,.10,p);
  const blink=Math.max(.12,1-Math.exp(-Math.pow(((t+1.08)%4.37-2.12)*17,2)));
  // The head occludes the far eye in a side view.
  for(const side of front>=.9?[-1,1]:[1]){
    const cx=17+side*(11+front*11)-front*14, cy=-4+(side<0?1:0);
    const ew=(side<0?13:19)+4*front, eh=(side<0?16:22)+3*front;
    const squeeze=blink*(1-.30*tired);
    c.save();c.translate(cx,cy);c.scale(1,squeeze);
    ellipse(gradient(-8,-eh,7,eh,['#fff1cd','#e4dbd2',p.snow?'#a8b6ce':'#b69178']),0,0,ew,eh,side*.12,p.ant[3],1.9);
    ellipse('#211d29',ew*(.25+look*.16)+side*.55,2+look*3,ew*.61,eh*.72,.12);
    ellipse('#fff6dd',ew*.25,-eh*.34,ew*.18,eh*.14,-.22);
    ellipse(p.snow?'#93c8e6':'#daa587',ew*.51,eh*.38,ew*.12,eh*.10);
    c.restore();
    stroke(p.ant[3],4.4,g=>{
      g.moveTo(cx-ew*.72,cy-eh*squeeze-6+side*worry*6);
      g.quadraticCurveTo(cx,cy-eh*squeeze-13,cx+ew*.62,cy-eh*squeeze-7-side*worry*5);
    });
  }
  ellipse(p.ant[1],front?0:31,29,12,7,-.16);
  stroke(p.ant[3],2,g=>{
    g.moveTo(lerp(20,-12,front),28);g.quadraticCurveTo(14,35-17*worry,37-front*16,28);
  });
  if(queen){
    const crown=gradient(-34,-75,36,-39,['#f5d68d','#b67043','#795049']);
    poly(crown,[[-36,-50],[-43,-77],[-22,-67],[-8,-93],[6,-68],[32,-85],[32,-52]],'#412e35',2.3);
    stroke('#ffe2ae',1.8,g=>{g.moveTo(-35,-54);g.lineTo(31,-55);});
    ellipse('#a93b44',-7,-66,7,8,0,'#7b4945',2);
  }
  c.restore();c.restore();
}

function box(x,y,w,h,p,{open=false,angle=0,label=true,seed=5}={}){
  c.save();c.translate(x,y);c.rotate(angle);
  const d=w*.23;
  const front=gradient(-w/2,-h,w*.4,0,p.snow?['#ad8c79','#7d665e','#594955']:['#d4a36c','#ab7349','#80523e']);
  const top=gradient(0,-h-d,0,-h,['#d8b481',p.snow?'#876f6e':'#c28d5c']);
  const side=gradient(w*.5,-h,w*.7,0,[p.snow?'#725e61':'#a16d4c','#473540']);
  poly(side,[[w*.5,0],[w*.5+d,-d*.55],[w*.5+d,-h-d*.55],[w*.5,-h]],'#473642',1.5);
  poly(front,[[-w*.5,-h],[w*.5,-h],[w*.5,0],[-w*.5,0]],'#5d4243',1.4);
  if(open){
    poly('#342a34',[[-w*.5,-h],[w*.5,-h],[w*.5+d,-h-d*.55],[-w*.5+d,-h-d*.55]],'#996f5d',2.5);
    poly(top,[[w*.5,-h],[w*.5+d,-h-d*.55],[w*.5+d*1.9,-h-d*1.47],[w*.5+d*.5,-h-d*.95]],'#69505a',1.3);
    poly(top,[[-w*.5,-h],[-w*.5+d,-h-d*.55],[-w*.5-d*.25,-h-d*1.21],[-w*.5-d*.77,-h-d*.59]],'#70505a',1.3);
  }else{
    poly(top,[[-w*.5,-h],[w*.5,-h],[w*.5+d,-h-d*.55],[-w*.5+d,-h-d*.55]],'#785746',1.3);
    poly('#e7c794',[[4,-h],[w*.17,-h],[w*.17+d,-h-d*.55],[4+d,-h-d*.55]]);
    fill('#d9ba89',4,-h,w*.17-4,h*.21);
  }
  const r=seeded(seed);
  for(let i=0;i<19;i++){
    const yy=-h+2+r()*(h-4);
    stroke(i%4?'#392c3a20':'#ffecd52e',.6+r()*1.7,g=>{g.moveTo(-w*.48,yy);g.lineTo(w*.48,yy+r()*2);});
  }
  if(label){
    round(p.snow?'#c3b1a5':'#ebd6ac',-w*.40,-h*.58,w*.39,h*.23,2);
    for(let i=0;i<8;i++) fill('#4d3d4a',-w*.37+i*w*.037,-h*.53,Math.max(1,w*.01+(i%3)*.6),h*.12);
  }
  stroke('#e4c09999',1.5,g=>{g.moveTo(-w*.49,-h+1);g.lineTo(w*.5,-h+1);g.lineTo(w*.5+d,-h-d*.55+1);});
  c.restore();
}

const displays=new Map();
function display(kind){
  if(displays.has(kind))return displays.get(kind);
  const art=surface(340,570,()=>{
    const w=340,h=570;
    fill('#151d2b',0,0,w,h);
    if(kind==='off'){
      fill(gradient(0,0,w,h,['#283d40','#141f2f','#17222b']),0,0,w,h);
      poly('#7d9cac15',[[0,41],[166,0],[215,0],[0,163]]);
    }else if(kind==='lock'){
      fill(gradient(0,0,w,h,['#1d3159','#37647b','#162235']),0,0,w,h);
      glow(144,385,140,184,'#60d9df',.59);
      text('08:47',170,220,78,'#f9ebdf');
      round('#101114',134,367,72,74,20,'#647680',2);text('ร้าน',170,411,25,'#fff2d8');
    }else if(kind==='battery'){
      round('#a9bac8',95,241,150,69,10);round('#18293a',103,248,134,55,8);
      round('#e37361',110,254,19,43,5);text('0%',170,361,45,'#e7ecdf');
    }else{
      const accent=kind==='12.12'?'#e8bde8':kind==='bought'?'#b2e0c9':'#f6ca8c';
      fill('#101114',0,0,w,h);
      fill(gradient(0,0,w,143,['#252217','#141518','#1a1b22']),0,0,w,143);
      fill(accent,49,125,242,2);
      text(kind==='11.11'||kind==='12.12'?kind:'ร้านริมรัง',170,99,61,'#f8f3e9');
      round('#24242a',40,161,260,174,17,'#5a545e',1.8);
      glow(170,242,123,84,'#8d693b',.28);
      for(let i=0;i<9;i++)sugar(128+i%3*42,207+Math.floor(i/3)*33,25,pal.warm,i%2?.22:.02);
      text('น้ำตาล',170,394,44,'#f8f3e9');
      text(kind==='terms'?'ผ่อนสบาย • จ่ายปลายเดือน':'1 บาท  /  ส่งฟรี',170,438,kind==='terms'?24:29,'#e8d5b8');
      round('#24252a',36,470,268,64,15,accent,2.8);
      text(kind==='bought'?'สั่งแล้ว ✓':'กดสั่ง',170,513,34,accent);
    }
    round('#15202c',118,4,104,14,8);
  });
  displays.set(kind,art);return art;
}

function phone(x,y,scale,kind,angle=-.18,tilt=.71,p=pal.warm){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale*tilt);
  round('#1e2031',-115,-178,230,390,27,p.shade,3);
  round(gradient(-107,-170,115,192,['#d4d2ce','#537284','#36364a']),-117,-188,234,389,28,'#202534',2);
  round('#111b2a',-113,-186,226,377,26,'#8db2b680',2);
  c.save();c.beginPath();c.roundRect(-101,-174,202,350,20);c.clip();
  c.drawImage(display(kind),-101,-174,202,350);
  if(kind!=='off'){
    c.globalCompositeOperation='screen';
    poly('#adcde629',[[-111,-138],[8,-174],[41,-176],[-109,-61]]);
  }
  c.restore();
  stroke('#def2f0ac',1.7,g=>{g.moveTo(-91,-184);g.quadraticCurveTo(-112,-185,-113,-159);g.lineTo(-113,106);});
  fill('#727c89',116,-74,4,44);
  c.restore();
}

function flyer(x,y,s){
  c.save();c.translate(x,y);c.rotate(.12);c.scale(s,s*.62);
  round('#dbc6aa',-116,-74,232,148,7,'#7f675f',2.5);
  round('#9e5147',-105,-63,210,34,5);text('ร้านริมรัง',0,-37,23,'#fff0cf');
  text('12.12',0,25,69,'#743e46');text('รายการลดราคา',0,60,24,'#58404b');
  c.restore();
}

function sugarBag(x,y,s,p){
  c.save();c.translate(x,y);c.scale(s,s);
  path(gradient(-29,-38,43,64,['#f0d8ab','#c9a380','#725661']),g=>{
    g.moveTo(-20,-63);g.lineTo(18,-58);g.lineTo(14,-37);g.bezierCurveTo(71,17,57,57,21,67);
    g.bezierCurveTo(-48,80,-70,33,-45,-7);g.lineTo(-14,-43);g.closePath();
  },p.shade,2);
  stroke('#60505c',5,g=>{g.moveTo(-16,-39);g.lineTo(16,-41);});
  round('#a25949',-36,0,72,35,4);text('น้ำตาล',0,25,21,'#fff3d3');
  c.restore();
}

function otherProduct(x,y,s,kind,p){
  c.save();c.translate(x,y);c.scale(s,s);
  if(kind==='speaker'){
    round(gradient(-37,-78,35,52,['#58536a','#2b2635','#191a23']),-42,-90,86,138,12,p.shade,2);
    for(let j=0;j<2;j++){
      ellipse('#131821',0,-51+j*62,22,21,0,'#79818e',3);
      ellipse('#424552',-1,-52+j*62,9,9);
    }
  }else if(kind==='house'){
    round('#c4805d',-54,-61,103,99,3,'#553642',3);
    poly('#8c4854',[[-69,-57],[1,-132],[68,-56]],'#c8846d',3);
    round('#524158',-12,-24,27,62,6);
    round('#e5ae73',-39,-24,13,18,2);
    round('#eac78d',28,-24,13,18,2);
  }else if(kind==='shoe'){
    path('#e7d4ae',g=>{g.moveTo(-44,17);g.quadraticCurveTo(-37,-17,-19,-13);g.quadraticCurveTo(6,-5,30,-21);
      g.quadraticCurveTo(54,-16,53,22);g.quadraticCurveTo(-12,33,-44,17);g.closePath();},p.shade,2);
    path(gradient(0,-36,0,16,['#a6b6a0','#4e6f6e']),g=>{g.moveTo(-43,13);g.quadraticCurveTo(-38,-25,-15,-15);
      g.quadraticCurveTo(17,-7,24,-33);g.quadraticCurveTo(46,-40,52,18);g.closePath();});
    for(let i=0;i<3;i++)stroke('#dbe0c0',2,g=>{g.moveTo(-1+i*10,-13-i*4);g.lineTo(9+i*9,-8-i*4);});
  }else if(kind==='cushion'){
    round(gradient(-50,-28,48,30,['#d38971','#995364','#603f51']),-60,-31,120,63,19,'#5f3b48',2);
    round('#ce927600',-55,-27,110,55,17,'#de9e8488',1.3);
  }
  c.restore();
}

const lane = new OffscreenCanvas(canvas.width,canvas.height);
const laneCtx = lane.getContext('2d');
function defocus(amount,draw){
  if(amount<.15){draw();return;}
  const old=c, matrix=c.getTransform();
  laneCtx.resetTransform();laneCtx.clearRect(0,0,lane.width,lane.height);
  laneCtx.setTransform(matrix);
  c=laneCtx;
  draw();
  c=old;
  c.save();c.resetTransform();
  c.filter='blur('+(amount*width/W).toFixed(2)+'px)';
  c.drawImage(lane,0,0);c.restore();
}

function buildEdge(outside,p){
  const r=seeded(25);
  if(outside){
    for(let i=0;i<21;i++){
      const flip=i%2?1:-1,x=W/2+flip*(300+r()*236),y=1147+r()*193,h=225+r()*545;
      c.globalAlpha=.55+r()*.39;
      branch(x,y,h,-flip*(34+r()*209),9+r()*35,p.near,p.snow?'#4f6475':'#6b7051');
    }
    c.globalAlpha=1;
  }else{
    for(const side of [-1,1]){
      const xx=360+side*395;
      path(gradient(xx-75,966,xx+75,984,[p.near,p.stone[2],p.near]),g=>{
        g.moveTo(xx-109,1380);g.bezierCurveTo(xx-157,1150,xx-126,1004,xx-33,954);
        g.bezierCurveTo(xx+158,875,xx+142,1240,xx+170,1380);g.closePath();
      });
      for(let i=0;i<6;i++)rock(xx+(r()-.5)*80,995+r()*360,12+r()*79,p,r);
    }
  }
}
const foregrounds={};
for(const theme of ['warm','cold']){
  for(const type of ['garden','room']){
    foregrounds[theme+type]=surface(1056,1536,()=>{c.translate(168,128);buildEdge(type==='garden',pal[theme]);});
  }
}

function pile(p,count){
  const cells=[
    [26,925,135,154], [662,964,147,148], [33,788,125,110], [646,833,112,128],
    [30,681,114,101], [678,714,140,115], [653,601,126,104], [27,584,118,96], [662,491,111,116],
    [-33,1070,162,136], [778,1099,149,136],
  ];
  for(let i=0;i<count;i++){
    const [x,y,w,h]=cells[i];
    floorShadow(x,y+4,w*.80,19,.68);
    box(x,y,w,h,p,{open:p.snow&&(i%2===0||i>7),angle:(i%3-1)*.065,seed:22+i});
  }
}

function screenBounce(x,y,p,intensity=.7){
  c.save();c.globalCompositeOperation='screen';
  glow(x,y+10,245,125,p.snow?'#50d6ef':'#80c9de',intensity*.34);
  c.restore();
}

function coldOpen(t,p){
  const afterStride=Math.max(0,t-4.2);
  const distance=43*(Math.min(t,4.2)+.8*(1-Math.exp(-afterStride/.8)));
  const reach=ease(4.18,5.12,t)*(1-ease(5.39,6.04,t));
  const recoil=ease(5.37,5.91,t)*(1-ease(6.39,7.57,t));
  const walk=.92*(1-ease(4,5.18,t))+.54*recoil;
  floorShadow(556,975,91,23,.66);
  box(556,968,113,79,p,{open:true,angle:.03-.092*reach+.026*recoil,seed:112});
  ant(211+distance-29*recoil,911+20*ease(0,4.2,t),1.04,p,t,{
    front:0,walk,carry:.90*reach,look:.18+.48*reach,worry:.12+.86*recoil,tired:.27*recoil
  });
}

function renderStory(id,u,t,p,theme,rack){
  const gait=ease(.06,.85,u);
  const tired=.75;
  const shelfNeeded=![2,5,15].includes(id);
  if(shelfNeeded){
    const stock=id===3?Math.floor(22+14*ease(.12,.86,u)):id<=4&&id!==1?36:id>=6&&id<=8?29:id<=10&&id>=9?21:id>=11&&id<=14?9:0;
    const shelfBlur=id===16?lerp(9,.15,rack):([6,8,9,10,14,20].includes(id)?5:0);
    c.save(); c.filter='blur('+shelfBlur.toFixed(2)+'px)';
    c.drawImage(cachedShelves(theme,stock),0,290);
    c.restore();
    if (![6,8,9,10,14,20].includes(id)) tunnel(p,false,false);
    lamp(p,t);
    const count=p.snow?8:id>=12&&id!==14?6:id===10?4:id===9?3:0;
    if(count)pile(p,count);
  }else if(id===15) tunnel(p,u>.44,true);

  switch(id){
    case 1:
    case 21:
      coldOpen(t,p);
      break;
    case 2: {
      const x=lerp(188,462,gait);
      ant(x,902,1.06,p,t,{walk:.88,carry:1});
      sugar(x+113,739+Math.sin(t*12)*4,62,p,-.16);
      break;
    }
    case 3: {
      const x=lerp(185,422,gait);
      const release=ease(.56,.82,u);
      ant(x,854,.83,p,t,{walk:1-release,carry:1-release});
      sugar(lerp(x+91,504,release),lerp(727,714,release),49,p,-.16*release);
      break;
    }
    case 4:
      ant(208,907,1.11,p,t+.7,{queen:true,front:.48,worry:.07});
      ant(499,929,.97,p,t,{face:-1,front:.44,worry:.07});
      break;
    case 5: {
      const land=ease(.11,.43,u), drop=(1-land)*566;
      defocus(rack*6,()=>ant(178,859,1.0,p,t,{front:.55,worry:.60,look:.2}));
      floorShadow(449,972,164-64*(1-land),38,.67*land);
      defocus((1-rack)*(3.3+land*3),()=>phone(438,878-drop,1.14,'lock',-.26+(1-land)*.67,.67+(.34*(1-land)),p));
      if(u>.41&&u<.64) glow(431,956,174,50,'#d8ab83',Math.sin(Math.PI*ease(.41,.64,u))*.41);
      break;
    }
    case 6:
      screenBounce(451,931,p,.86);
      defocus(ease(.40,.64,u)*3.4,()=>ant(240,850,1.16,p,t,{front:.29,walk:.31*(1-gait),look:.77}));
      floorShadow(462,1050,161,34,.69);
      phone(463,914,1.19,u<.40?'lock':'store',-.18,.74,p);
      break;
    case 7: {
      const drop=(1-ease(.15,.36,u))*390;
      floorShadow(212,921,160,30,.64);
      box(200,906-drop,215,152,p,{open:u>.44,angle:-.03});
      if(u>.44)sugarBag(195,779-35*ease(.44,.66,u),.93,p);
      ant(486,922,1.02,p,t,{face:-1,front:.51,look:.46});
      phone(500,998,.58,'bought',.26,.52,p);
      break;
    }
    case 8:
      screenBounce(359,970,p,.91);
      ant(350,873,1.27,p,t,{front:1,look:.68});
      floorShadow(205,1038,126,28,.74);
      floorShadow(511,1040,132,28,.74);
      phone(206,983,.88,'store',.26,.57,p);
      phone(507,985,.88,Math.floor(t*3)%2?'bought':'store',-.22,.57,p);
      break;
    case 9:
    case 10: {
      const s=ease(.31,.69,u);
      screenBounce(346,981,p,.61);
      ant(192,781,1.03,p,t,{front:.46,look:.52});
      phone(365,901,1.38,id===9?'11.11':'12.12',-.16,.78,p);
      if(id===9){
        sugarBag(173,935,.83,p);
        otherProduct(575,863+105*(1-s),.87,'cushion',p);
        glow(584,796,77,113,'#ffbd5a',.40*s);
        for(let i=0;i<4;i++)ellipse(i%2?'#ffe5a7':'#e89458',539+i*30,792+Math.sin(i*.9)*8,6,9);
      }else{
        otherProduct(574,834,1.12,'house',p);otherProduct(135,945,.92,'speaker',p);
        if(u>.53)for(let j=0;j<6;j++)otherProduct(469+j%3*62,979+Math.floor(j/3)*54, .58,'shoe',p);
      }
      break;
    }
    case 11: {
      const drop=(1-ease(.19,.42,u))*620;
      floorShadow(265,936,249,48,.85);
      box(246,934-drop,323,293,p,{angle:-.027,seed:94});
      ant(510,992,.90,p,t,{face:-1,front:.34,worry:.95});
      break;
    }
    case 12:
      for(let j=0;j<3;j++){
        const x=lerp(104,321,gait)+j*145,y=850+j*62,s=.64+j*.14;
        ant(x,y,s,p,t+j*.4,{walk:1,carry:1,tired:.37,worry:.58});
        box(x+s*108,y-s*126+Math.sin(t*11+j)*4,s*128,s*98,p,{angle:.04*(j-1),seed:j+3});
      }
      break;
    case 13:
      ant(203,914,1.16,p,t,{queen:true,front:.42,worry:.8});
      ant(497,913,1.07,p,t+.60,{face:-1,front:.52,worry:.82,tired:.2});
      for(let j=0;j<6;j++)ellipse(gradient(437,948,456,961,['#f8d987','#91604b']),426+j*5,986-j*7,29,8,0,'#6c4c48',1);
      break;
    case 14:
      screenBounce(365,836,p,.55);
      defocus(4,()=>ant(215,776,.98,p,t,{look:.55,worry:.8,front:.5}));
      phone(370,788,1.83,'terms',-.10,.95,p);
      break;
    case 15:
      ant(lerp(326,398,gait),916,.96,p,t,{face:1,front:.49,worry:.56,tired:.47,walk:.47});
      break;
    case 16:
      floorShadow(238,948,150,31,.55);
      defocus(rack*6,()=>{
        ant(373,946,1.09,p,t,{face:-1,front:.45,worry:1,tired:.4,look:.4});
        box(184,979,147,110,p,{open:true,angle:-.025});
      });
      break;
    case 17:
      for(let j=0;j<3;j++)ant(192+j*163,785+j%2*38,.80,p,t+j*.6,{face:j===2?-1:1,front:.72,tired,worry:.64});
      if(u<.56)screenBounce(388,970,p,1-ease(.42,.56,u));
      phone(367,969,1.38,u<.56?'battery':'off',.09,.69,p);
      break;
    case 18:
      box(146,1012,169,151,p,{open:true,angle:-.10});
      ant(389,907,1.14,p,t,{face:1,front:.75,worry:.57,tired:.8,look:.52});
      phone(549,950,.44,'off',.29,.49,p);
      flyer(386,973,1.01);
      break;
    case 19:
      ant(212,918,1.17,p,t,{queen:true,front:.48,worry:.70,tired:.27});
      ant(499,925,1.02,p,t+.45,{face:-1,front:.55,worry:.96,tired:.53});
      break;
    case 20:
      ant(349,1048,2.72+.34*ease(.33,.91,u),p,t,{front:1,worry:.95,tired:ease(.39,.87,u)*.40});
      break;
  }
}

const shotMoves=[
  [10,-11,1.02,1.06],[-19,3,1,.98],[-12,14,1.01,1.045],[11,-22,1.18,1.26,-75],
  [-15,1,.99,1.05],[4,-13,1.16,1.28,-78],[-11,18,1.06,1],[12,-12,1.14,1.22,-62],
  [10,-9,1.02,1.075],[-12,12,1.04,1.06],[-16,16,.99,1.04],[-17,2,1,1.08],
  [16,-19,1.15,1.22,-56],[7,-5,1,1.03],[-10,21,.99,1.05],[-12,14,1.01,1.045],
  [15,-11,1.04,1.09],[11,-16,1.14,1.095,-50],[12,-18,1.17,1.25,-64],[6,-12,1.11,1.19,-54],
  [10,10,1.02,1.02],
];
function camera(dx,dy,zoom,depth){
  c.translate(dx*depth+(1-zoom)*351, dy*depth+(1-zoom)*721);
  c.scale(zoom,zoom);
}
const rng=seeded(67);
const particles=Array.from({length:113},()=>[rng()*W,rng()*H,.4+rng(),rng()*tau,rng()]);
function dust(t,p,outside,front){
  for(let i=front?90:0;i<(front?113:90);i++){
    const [x,y,s,phase,v]=particles[i];
    const xx=(x+t*(p.snow&&outside?24:4)+Math.sin(t+phase)*23+W*5)%W;
    const yy=(y+t*s*(p.snow?32:4)+H*2)%H;
    c.globalAlpha=(front?.09:.20)*(.42+v) * (p.snow?1.3:.70);
    const r=front?2.3+s*3:s*(p.snow?2.5:1.55);
    ellipse(p.snow?'#c4e4f3':'#f3c585',xx,yy,r,r*.79);
  }
  c.globalAlpha=1;
}
function frame(id,u,t){
  const outside=[2,5,15].includes(id);
  const theme=[1,15,16,17,18,19,20,21].includes(id)?'cold':'warm';
  const p=pal[theme], bg=theme+(outside?'garden':'room');
  const r=id===5?ease(.40,.57,u):id===16?ease(.37,.65,u):0;
  const [a,b,z0,z1,dy=0]=shotMoves[id-1];
  const k=ease(0,1,u), dx=lerp(a,b,k),zoom=lerp(z0,z1,k);
  c.save();
  camera(dx,dy,1+(zoom-1)*.40,.35);
  c.filter='blur('+(outside?(id===5?6+4*r:3.5):1.6)+'px)';
  c.drawImage(backgrounds[bg],-168,-128);
  c.restore();
  c.save();camera(dx,dy,zoom,1);
  dust(t,p,outside,false);
  renderStory(id,u,t,p,theme,r);
  c.restore();
  c.save();camera(dx,dy,1+(zoom-1)*1.15,1.55);
  c.filter='blur('+(outside?13:8.5)+'px)';
  c.drawImage(foregrounds[bg],-168,-128);
  c.restore();
  dust(t,p,outside,true);
  const vignette=c.createRadialGradient(365,675,270,361,699,788);
  vignette.addColorStop(0,'#10152200');vignette.addColorStop(.72,'#11162428');vignette.addColorStop(1,'#101421bc');
  fill(vignette,0,0,W,H);
  fill(gradient(0,1012,0,H,['#12162000','#11152088']),0,1012,W,268);
  grit(0,0,W,H,.24);
  if(brandImage)drawBrand(brandImage);
}

window.stage={
  description:'Canvas 2D · painted depth layers and optical focus pulls',
  frames(items){
    return items.map(args=>{
      frame(...args);
      return canvas.toDataURL('image/jpeg',.92).split(',')[1];
    });
  }
};
frame(1,0,0);
