import {DURATION,WIDTH,HEIGHT,sceneFor,validateTimeline} from './timeline.js';
import {renderCaptions,captionAt} from './captions.js';
const timeline=await fetch('./timeline.json').then(r=>{if(!r.ok)throw new Error('timeline missing');return r.json();});
validateTimeline(timeline);
const renderers={};
for(let n=1;n<=12;n++){
 const id=String(n).padStart(2,'0');
 renderers[id]=(await import(`./scenes/scene${id}.js`))[`renderScene${id}`];
 if(typeof renderers[id]!=='function')throw new Error(`Missing scene export ${id}`);
}
window.DUR=DURATION;
window.SCENES=timeline;
window.render=t=>{
 const scene=sceneFor(t,timeline),u=Math.max(0,t-scene.start);
 const svg=renderers[scene.id](u,t,scene.end-scene.start);
 document.getElementById('picture').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" data-scene="${scene.id}"><rect width="1080" height="1920" fill="#142333"/><g id="scene">${svg}</g><g id="captions">${renderCaptions(t)}</g></svg>`;
};
window.TEXTS=t=>{const c=captionAt(t);return c?[{id:'caption',text:c.text,x0:90,y0:1480,x1:930,y1:1690}]:[];};
await document.fonts.load('44px Kanit');await document.fonts.ready;
window.render(0);window.READY=true;
