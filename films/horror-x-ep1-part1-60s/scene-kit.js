import {renderExterior} from './assets/exterior.js';
import {renderInterior} from './assets/interior.js';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
export const path=(d,fill='none',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
export const line=(d,color='#8FB2D4',width=2,opacity=1)=>path(d,'none',`stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"`);
export const text=(x,y,s,size=32,fill='#EAF4FF',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="Kanit" ${extra}>${esc(s)}</text>`;
export const stripSvg=s=>s.replace(/^\s*<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
export const interior=t=>renderInterior(t);
export const exterior=t=>stripSvg(renderExterior(t));

export function view({back,mid='',front=''},u,d,{cx=540,cy=960,z0=1,z1=1.06,dx=0,dy=0}={}){
 const p=clamp(u/Math.max(.001,d)),z=z0+(z1-z0)*ease(p);
 const layer=(s,k)=>`<g transform="translate(${540+dx*p*k} ${960+dy*p*k}) scale(${1+(z-1)*(.88+.12*k)}) translate(${-cx} ${-cy})">${s}</g>`;
 return layer(back,.45)+layer(mid,.85)+layer(front,1.3);
}

export function cloth(t,{x=560,y=1000,scale=1,travel=0}={}){
 const sway=Math.sin(t*1.1)*4,drift=Math.sin(t*.6)*3;
 return `<g transform="translate(${x+travel+drift} ${y}) scale(${scale}) rotate(${sway*.3})">
 <ellipse cx="0" cy="419" rx="83" ry="17" fill="#07121e" opacity=".6"/>
 <path d="M-51 68Q-61 13-26-13Q0-32 30-13Q65 13 54 68L80 226 97 407Q66 425 35 411L9 426-20 413-47 425-91 408-77 240Z" fill="#c3ced0" stroke="#7e9ba8" stroke-width="2"/>
 <path d="M-22-13Q-45 55-35 120L-59 347-50 414-85 408-73 240-50 69Q-60 12-22-13Z" fill="#8c9fa8"/>
 <path d="M20-16Q36 53 20 140L39 407 13 424 0 260-3 143Q9 45 20-16Z" fill="#e6e5dd"/>
 <path d="M50 82L72 260 85 407 60 416 38 250Z" fill="#a8b7bd"/>
 <path d="M-3 137L-19 350M35 191L49 378M-44 208L-59 374" fill="none" stroke="#6d8697" stroke-width="2" opacity=".32"/>
 </g>`;
}
