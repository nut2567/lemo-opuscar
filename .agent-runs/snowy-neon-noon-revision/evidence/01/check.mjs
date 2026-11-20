import { openDemo, closeServer } from '../../../../core/render/page.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { browser, page } = await openDemo(here, { w: 1080, h: 1920 });
for (const t of [0, 3.7]) console.log(t, JSON.stringify(await page.evaluate(t => window.cmp(t), t)));
await browser.close(); closeServer();
