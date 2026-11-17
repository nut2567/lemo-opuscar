// Caption-voice alignment: verifies caption text matches spoken text and timing covers speech.
// v5: every cue is ONE row at exactly 19.2 px inside the lowered caption bar.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const {
  captionAt,
  renderCaptions,
  CAPTION_X0,
  CAPTION_X1,
  CAPTION_Y0,
  CAPTION_Y1,
} = require('../captions.js');
const vt = JSON.parse(readFileSync(new URL('../voice-timeline.json', import.meta.url), 'utf8'));
const norm = s => s.replace(/\s+/g, ' ').trim();

describe('caption-voice alignment', () => {
  it('v5 geometry: one 19.2px row per cue, lowered bar, bounds cover ink', () => {
    assert.equal(CAPTION_X0, 90);
    assert.equal(CAPTION_X1, 930);
    assert.equal(CAPTION_Y0, 1724);
    assert.equal(CAPTION_Y1, 1764);
    assert.ok(CAPTION_Y1 <= 1824, 'caption bounds cross the bottom safe edge');

    const seen = [];
    for (let t = 0; t < 60; t += 0.05) {
      const c = captionAt(t);
      if (c && !seen.some((item) => item.start === c.start && item.end === c.end)) seen.push(c);
    }
    assert.ok(seen.length >= 12, `expected the 12 spoken cues, got ${seen.length}`);

    for (const c of seen) {
      // exactly one visual row at exactly 19.2 px (2x the v4 9.6 px)
      assert.equal(c.lines.length, 1, `cue must be a single row, got ${c.lines.length}`);
      assert.equal(c.lines[0], c.text, 'single row must equal cue text');
      assert.equal(c.size, 19.2, `cue size ${c.size} is not exactly 19.2`);
      assert.ok(Number.isFinite(c.barX) && Number.isFinite(c.barW), 'cue must bake its bar rect');
      assert.ok(c.barX >= CAPTION_X0 - 1e-6 && c.barX + c.barW <= CAPTION_X1 + 1e-6,
        `bar ${c.barX}..${c.barX + c.barW} outside x${CAPTION_X0}..${CAPTION_X1}`);

      const svg = renderCaptions(c.start);
      // one <text> node, one row, exact size, centered in the zone
      assert.equal((svg.match(/<text\b/g) || []).length, 1, 'renderCaptions must emit one text node');
      assert.match(svg, /font-size="19\.2"/);
      assert.match(svg, /text-anchor="middle"/);
      assert.match(svg, /x="510"/);
      assert.match(svg, new RegExp(`y="1751\\.488"`), 'baseline must sit on the 19.2px bar');
      assert.match(svg, /y="1724\.832" width="[\d.]+" height="38\.336"/);

      const joined = norm(c.lines.join(' '));
      assert.equal(joined, norm(c.text));
    }

    // no second line anywhere in the emitted markup
    const src = readFileSync(new URL('../captions.js', import.meta.url), 'utf8');
    assert.ok(!src.includes('LINE_GAP'), 'v5 has no multi-line gap constant');
  });

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
      // every cue covering this scene is a single 19.2px row
      for (const c of cues) {
        assert.equal(c.lines.length, 1);
        assert.equal(c.size, 19.2);
      }
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
