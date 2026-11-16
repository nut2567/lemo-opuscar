# scene04 runtime smoke check (read-only)

Target: `films/horror-x-ep1-part1-60s/scenes/scene04.js` (reframed washer-row scene).
Date: 2026-11-16. No files were modified.

## Existing targeted tests

`films/horror-x-ep1-part1-60s/tests/` contains `scene02-runtime.test.mjs` and
other tests, but no scene04-specific test. Per the task fallback, ran the
runtime smoke check directly.

## Commands run

From repo root (`D:\workspace\lemo-opuscar`):

```sh
node -e "
import('./films/horror-x-ep1-part1-60s/scenes/scene04.js').then(m=>{
  const f=m.renderScene04;
  const outs=[];
  for(const u of [0,2.5,4.8]){
    const a=f(u,10+u,5), b=f(u,10+u,5);
    outs.push(a);
    console.log('u='+u,'len='+a.length,'deterministic='+(a===b));
    for(const bad of ['NaN','undefined','Infinity','[object Object]'])
      if(a.includes(bad)) console.log('LEAK',bad,'at u='+u);
    if(/<svg\b/i.test(a)||/<\/svg>/i.test(a)) console.log('ROOT SVG at u='+u);
    if(a.trim().length===0) console.log('EMPTY at u='+u);
  }
  console.log('u0!=u2.5',outs[0]!==outs[1],'u2.5!=u4.8',outs[1]!==outs[2]);
  const t1=f(1.0,10,5), t2=f(1.0,30,5);
  console.log('time-varying',t1!==t2);
}).catch(e=>{console.error('ERR',e);process.exit(1)});
"
```

## Results

```
u=0   len=35504 deterministic=true
u=2.5 len=35642 deterministic=true
u=4.8 len=35586 deterministic=true
u0!=u2.5 true   u2.5!=u4.8 true
time-varying true
```

## Checks

- `renderScene04(u, t, d)` returns a non-empty string at u = 0, 2.5, 4.8 (d=5).
- Deterministic: two identical calls at each u produce byte-identical output.
- No `NaN`, `undefined`, `Infinity`, or `[object Object]` in any output.
- No root `<svg>`/`</svg>` — returns inner markup only (wrapped by `view()`).
- Time-varying: output at t=10 differs from t=30 for the same u.
- Output differs across u values (camera track animates).

Result: PASS — scene04.js renders clean inner SVG markup at runtime.
