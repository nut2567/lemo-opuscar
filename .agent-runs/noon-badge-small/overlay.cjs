const { chromium } = require('../../node_modules/playwright-core');
const fs = require('node:fs');
const path = require('node:path');

const reference = 'E:/AI/Ai-Video/videos/nok-krathong/public';
const base64 = file => fs.readFileSync(path.join(reference, file)).toString('base64');

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
    await page.setContent(`<!doctype html><html lang="th"><meta charset="utf-8"><style>
      @font-face { font-family:Kanit; src:url(data:font/ttf;base64,${base64('fonts/Kanit-SemiBold.ttf')}); font-weight:600 }
      body { margin:0; font:600 32px Kanit; color:#fff }
      .outlined { -webkit-text-stroke:8px #123047; paint-order:stroke fill; text-shadow:0 3px 10px rgba(18,48,71,.45) }
      .channel { position:absolute; top:116px; right:66px; transform:translateY(-50%); display:flex; gap:12px; align-items:center }
      img { width:42px; height:42px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1.5px #123047 }
    </style>
    <div class="channel"><img src="data:image/png;base64,${base64('branding/profile.png')}" alt=""><span class="outlined">@som_mut123</span></div>`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await document.querySelector('img').decode();
      if (![...document.fonts].some(font => font.status === 'loaded')) throw new Error('Kanit did not load');
    });
    await page.screenshot({path:path.join(__dirname,'brand.png'),omitBackground:true});
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

