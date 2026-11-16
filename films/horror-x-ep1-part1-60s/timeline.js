export const DURATION=60,FPS=30,WIDTH=1080,HEIGHT=1920;
export function sceneFor(t,scenes){
 const v=Math.max(0,Math.min(60-1e-7,Number(t)||0));
 const s=scenes.find(x=>v>=x.start&&v<x.end);
 if(!s)throw new Error(`No scene at${v}`);
 return s;
}
export function validateTimeline(scenes){
 if(!Array.isArray(scenes)||scenes.length!==12)throw new Error('Exactly12 scenes required as an array');
 let next=0;
 for(const [i,s] of scenes.entries()){
  if(s.id!==String(i+1).padStart(2,'0'))throw new Error(`Invalid ordered scene id ${s.id}`);
  if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||Math.abs(s.start-next)>1e-4||!(s.end>s.start))throw new Error(`Timeline gap/overlap at${s.id}`);
  next=s.end;
 }
 if(Math.abs(next-60)>1e-4)throw new Error(`Timeline ends at${next}`);
 return true;
}
