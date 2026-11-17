// Bounds test for films/horror-x-snowy-neon-code/washers.mjs
// Mock Canvas2D ctx records path geometry through the current transform
// and reports the union bounding box of painted geometry.
import { drawWashers } from '../../../films/horror-x-snowy-neon-code/washers.mjs';

const pts = [];
let m = [1,0,0,1,0,0]; // a,b,c,d,e,f ; point -> [a*x+c*y+e, b*x+d*y+f]
const mul = (M,N)=>[ // M*N
  M[0]*N[0]+M[2]*N[1], M[1]*N[0]+M[3]*N[1],
  M[0]*N[2]+M[2]*N[3], M[1]*N[2]+M[3]*N[3],
  M[0]*N[4]+M[2]*N[5]+M[4], M[1]*N[4]+M[3]*N[5]+M[5]];
const xf=(x,y)=>[m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
const push=(x,y)=>{const p=xf(x,y);pts.push(p);};
const grad={addColorStop(){}};
const stack=[];
const ctx={
  save(){stack.push(m.slice());}, restore(){m=stack.pop()||m;},
  translate(x,y){m=mul(m,[1,0,0,1,x,y]);},
  scale(x,y){m=mul(m,[x,0,0,y,0,0]);},
  rotate(a){const c=Math.cos(a),s=Math.sin(a);m=mul(m,[c,s,-s,c,0,0]);},
  setTransform(a,b,c,d,e,f){m=[a,b,c,d,e,f];},
  beginPath(){},closePath(){},
  moveTo(x,y){push(x,y);},lineTo(x,y){push(x,y);},
  quadraticCurveTo(cx,cy,x,y){push(cx,cy);push(x,y);},
  bezierCurveTo(c1x,c1y,c2x,c2y,x,y){push(c1x,c1y);push(c2x,c2y);push(x,y);},
  arc(x,y,r){for(let a=0;a<12;a++)push(x+Math.cos(a/12*6.2832)*r,y+Math.sin(a/12*6.2832)*r);},
  ellipse(x,y,rx,ry,rot=0){for(let a=0;a<14;a++){const ca=Math.cos(a/14*6.2832),sa=Math.sin(a/14*6.2832);push(x+(ca*rx)*Math.cos(rot)-(sa*ry)*Math.sin(rot),y+(ca*rx)*Math.sin(rot)+(sa*ry)*Math.cos(rot));}},
  rect(x,y,w,h){push(x,y);push(x+w,y+h);},
  fillRect(x,y,w,h){push(x,y);push(x+w,y+h);},
  strokeRect(x,y,w,h){push(x,y);push(x+w,y+h);},
  fill(){},stroke(){},
  fillText(s,x,y){push(x,y);push(x+7*s.length,y);},
  createLinearGradient(){return grad;},createRadialGradient(){return grad;},createPattern(){return null;},
  measureText(){return{width:10};},
  set lineJoin(v){},set lineCap(v){},set font(v){},set fillStyle(v){},set strokeStyle(v){},
  set lineWidth(v){},set globalAlpha(v){},set textBaseline(v){},set globalCompositeOperation(v){},
};

for (const t of [0, 3.7]) {
  pts.length = 0; m = [1,0,0,1,0,0];
  drawWashers(ctx, t, 0);
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  const u = {x0:Math.min(...xs), x1:Math.max(...xs), y0:Math.min(...ys), y1:Math.max(...ys)};
  console.log('t='+t, JSON.stringify(u));
}
const inb = (u)=>u.x0>=149&&u.x1<=466&&u.y0>=1005&&u.y1<=1296;
