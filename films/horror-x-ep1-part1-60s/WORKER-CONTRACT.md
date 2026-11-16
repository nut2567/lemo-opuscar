# Part1 production interface

Root D:/workspace/lemo-opuscar/films/horror-x-ep1-part1-60s. Only this folder may be edited, in your own task files. Prototype ../horror-x-teaser-30s and source D:/workspace/ai-video/episodes/horror-x are READ ONLY. No new story facts/CCTV/dawn/name reveal in Part1. No watermark. User authorized new concise narration and12 scenes; no storyboard approval stop. Part2/3 planning only.

Canvas1080x1920,30fps,total60s. All visual functions return SVG INNER strings, no rootSVG,DOM,fetch,state or unseededrandom. Global t and local u passed explicitly. Per-scene duration d from actualvoice4–6s target. Caption area x90..930,y1480..1690; mainaction above y1420. Prefix customdefs per scene s01-,s02- etc. Commonassets own prefixes only one of each per scene.

Coordinator-owned scene-kit.js exports:
- interior(t): SVGinner of detailed approved laundromat background, no Nun; 6washersleft,counterright,reardoorcentral.
- exterior(t): SVGinner of approved empty storefront with washerrotation.
- view({back,mid='',front=''},u,d,{cx=540,cy=960,z0=1,z1=1.06,dx=0,dy=0}={}): SVGinner groups for camera push/pan with different parallax; focal point cx/cy in artboard coordinates. Use this in every scene.
- rect(x,y,w,h,fill,extra=''), path(d,fill='none',extra=''), line(d,color='#8FB2D4',width=2,opacity=1), text(x,y,s,size=32,fill='#EAF4FF',extra=''), clamp(x,a=0,b=1), ease(x), stripSvg(fullsvg).
- cloth(t,{x=560,y=1000,scale=1,travel=0}={}): completely faceless tall white drape, origincenterhead x/y, heightabout458(-32..426),shadowaroundy419, no eyes/mouth/feet, gentle sway. Use no fullbody detail.

Separate worker actor.js exports nun(t,{pose='idle',x=790,y=850,scale=1,facing=1}); headcenter anchor, adultbody extendsdown600–700, poseswalk/count/turn/listen. Use scale.6-.8 for fullbody withinframe; scale1 nearcounter; fullbodyonlayerbehindcounterif applicable. Separate effects.js exports fx(t,kind='interior') innerSVG. These dependencies may appear later; do not create them yourself.

scenes/sceneNN.js exports renderSceneNN(u,t,d=5). Each has meaningful subject/environment motion, movingcamera+parallax,distinctframing. Main only renders one scene at a time and wraps rootSVG. Main adds captions and may add overallfx; scene can callfxforlocalatmospherebutavoidduplicate. No lipsync needed,narratorisvoiceover. Clothcustomeralwaysrear,neverface,neverfootsteps. Nunfootstepsallowed.

Voice schema voice-timeline.json {duration:60,fps:30,scenes:[{id:'01',start:0,end:...,text:'...',speechStart:0,speechEnd:...,clip:'voice/01.wav'}],maxGap:<seconds>}. Coordinator exports timeline.json as same scenesarray and timeline.js canonical. Voiceworker ownsvoice-timeline.json; captions read it,neverrewriteit. Scenes must not assume5s except default d.

No worker edits index.html,main.js,scene-kit.js,timeline.js,another scene,originalepisode/prototype. Native worker_done once thenstop. No recursiveagents or paidfallback. Optional checks that need approval can be left to coordinator; do not stall on absent concurrentdependencies. Report actualchecks/limitations,not imagined passes. Lead testscombinedresult and recordsdispatchledger.
