// Caption-voice alignment: verifies caption text matches spoken text and timing covers speech.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { captionAt } = require('../captions.js');
const vt = JSON.parse(readFileSync(new URL('../voice-timeline.json', import.meta.url), 'utf8'));
const norm = s => s.replace(/\s+/g, ' ').trim();

describe('caption-voice alignment', () => {
  for (const scene of vt.scenes) {
    it(`scene ${scene.id}: caption text matches spoken text`, () => {
      const step = 0.05, cues = [];
      for (let t = scene.speechStart; t < scene.speechEnd - 1e-6; t += step) {
        const c = captionAt(t);
        assert.ok(c, `no caption at t=${t.toFixed(3)} during speech`);
        if (!cues.length || c.start !== cues[cues.length - 1].start || c.end !== cues[cues.length - 1].end)
          cues.push(c);
      }
      const captionText = norm(cues.map(c => c.text).join(' '));
      assert.equal(captionText, norm(scene.text), 'caption text ≠ voice text');
    });

    it(`scene ${scene.id}: caption timing covers speech interval`, () => {
      const step = 0.05, tol = 0.01;
      for (let t = scene.speechStart; t < scene.speechEnd - 1e-6; t += step) {
        const c = captionAt(t);
        assert.ok(c, `gap at t=${t.toFixed(3)}`);
        assert.ok(c.start >= scene.start - tol, `cue starts ${c.start} before scene ${scene.start}`);
        assert.ok(c.end <= scene.end + tol, `cue ends ${c.end} after scene ${scene.end}`);
      }
    });
  }
});
