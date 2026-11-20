import { openDemo, closeServer } from '../../../../core/render/page.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, '../../../../films/horror-x-snowy-neon-code/ep1-source');
const { browser, page } = await openDemo(demo, { w: 1080, h: 1920, q: 'cut=jessica' });
for (const t of [12.6, 53.95]) {
  await page.evaluate(t => window.render(t), t);
  const a = await page.screenshot(); await page.evaluate(() => document.querySelector('#nunLayer').style.visibility='hidden');
  const b = await page.screenshot(); await page.evaluate(() => document.querySelector('#nunLayer').style.visibility='');
  const res = await page.evaluate(async ([a,b]) => {
    const load = async s => { const im = new Image(); im.src='data:image/png;base64,'+s; await im.decode(); const c=new OffscreenCanvas(1080,1920),g=c.getContext('2d'); g.drawImage(im,0,0); return g.getImageData(0,0,1080,1920).data; };
    const A=await load(a),B=await load(b); const {cx,cy,z}=window.FRAME_META.camera;
    let minX=1e9,maxX=-1,n=0; const cols={};
    for(let y=0;y<1920;y++)for(let x=0;x<1080;x++){const i=(y*1080+x)*4; if(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2])>6){const wx=Math.round((x-540)/z+cx); if(wx>=730){n++;cols[wx]=(cols[wx]||0)+1; if(wx>maxX)maxX=wx; if(wx<minX)minX=wx;}}}
    return {cam:{cx,cy,z},n,minWorldX:minX,maxWorldX:maxX,cols};
  }, [a.toString('base64'), b.toString('base64')]);
  console.log(t, JSON.stringify(res));
}
await browser.close(); closeServer();
