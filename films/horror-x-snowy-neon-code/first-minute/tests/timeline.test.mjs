import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FPS,
  WIDTH,
  HEIGHT,
  TOTAL_FRAMES,
  DURATION_SECONDS,
  SHOT_SPANS,
  BOUNDARIES,
  frameAt,
  shotAtFrame,
  shotAtSeconds,
} from "../timeline.mjs";

const EXPECTED_BOUNDARIES = [0, 150, 300, 450, 630, 810, 990, 1170, 1380, 1590, 1800];

test("format constants: 1080x1920 @ 30fps, 1800 frames = 60s", () => {
  assert.equal(FPS, 30);
  assert.equal(WIDTH, 1080);
  assert.equal(HEIGHT, 1920);
  assert.equal(TOTAL_FRAMES, 1800);
  assert.equal(DURATION_SECONDS, 60);
  assert.equal(TOTAL_FRAMES / FPS, 60);
});

test("SHOT_SPANS has ten records with ids 01-10 on exact boundaries", () => {
  assert.equal(SHOT_SPANS.length, 10);
  assert.deepEqual(
    SHOT_SPANS.map((s) => s.id),
    ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
  );
  assert.deepEqual(
    SHOT_SPANS.map((s) => [s.start, s.end]),
    EXPECTED_BOUNDARIES.slice(0, -1).map((b, i) => [b, EXPECTED_BOUNDARIES[i + 1]])
  );
  assert.deepEqual(BOUNDARIES, EXPECTED_BOUNDARIES);
});

test("spans are contiguous, half-open, and end exactly at frame 1800", () => {
  let cursor = 0;
  for (const shot of SHOT_SPANS) {
    assert.equal(shot.start, cursor, `shot ${shot.id} start`);
    assert.ok(shot.end > shot.start, `shot ${shot.id} non-empty`);
    cursor = shot.end;
  }
  assert.equal(cursor, TOTAL_FRAMES);
  // half-open: last drawable frame of each shot is end-1, next shot owns end
  for (let i = 0; i < SHOT_SPANS.length; i++) {
    const shot = SHOT_SPANS[i];
    assert.equal(shotAtFrame(shot.end - 1).id, shot.id);
    if (i + 1 < SHOT_SPANS.length) {
      assert.equal(shotAtFrame(shot.end).id, SHOT_SPANS[i + 1].id);
    }
  }
});

test("shot durations match the approved 5/5/5/6/6/6/6/7/7/7-second layout", () => {
  const seconds = SHOT_SPANS.map((s) => (s.end - s.start) / FPS);
  assert.deepEqual(seconds, [5, 5, 5, 6, 6, 6, 6, 7, 7, 7]);
});

test("every cut boundary maps to the incoming shot", () => {
  for (let i = 1; i < EXPECTED_BOUNDARIES.length - 1; i++) {
    const b = EXPECTED_BOUNDARIES[i];
    assert.equal(shotAtFrame(b).id, String(i + 1).padStart(2, "0"));
    assert.equal(shotAtFrame(b - 1).id, String(i).padStart(2, "0"));
  }
});

test("frameAt: seconds -> frame, boundary times go to the incoming shot", () => {
  assert.equal(frameAt(0), 0);
  assert.equal(frameAt(5), 150);
  assert.equal(frameAt(10), 300);
  assert.equal(frameAt(15), 450);
  assert.equal(frameAt(21), 630);
  assert.equal(frameAt(27), 810);
  assert.equal(frameAt(33), 990);
  assert.equal(frameAt(39), 1170);
  assert.equal(frameAt(46), 1380);
  assert.equal(frameAt(53), 1590);
  assert.equal(frameAt(59.999), 1799);
  // non-integer seconds floor to the frame
  assert.equal(frameAt(1.2), 36);
  assert.equal(frameAt(2.1), 63);
  assert.equal(frameAt(2.4), 72);
  assert.equal(frameAt(3.7), 111);
  assert.equal(frameAt(4.2), 126);
  assert.equal(frameAt(5.6), 168);
  assert.equal(frameAt(6.233), 186);
  assert.equal(frameAt(6.667), 200);
  assert.equal(frameAt(7.433), 222);
});

test("frameAt round-trips every renderer sample time i/FPS", () => {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    assert.equal(frameAt(i / FPS), i, `frameAt(${i} / ${FPS})`);
  }
});

test("frameAt keeps genuine sub-frame times on their own frame", () => {
  for (const frame of [0, 1, 149, 150, 899, 1170, 1798]) {
    assert.equal(frameAt((frame + 0.5) / FPS), frame);
    assert.equal(frameAt((frame + 1 - 1e-6) / FPS), frame);
  }
  assert.equal(frameAt(4.999999999), 149);
  assert.equal(frameAt(5.000000001), 150);
});

test("frameAt clamps out-of-range input into [0, 1799]", () => {
  assert.equal(frameAt(-10), 0);
  assert.equal(frameAt(60), 1799);
  assert.equal(frameAt(999), 1799);
  assert.equal(frameAt(-0.5), 0);
  assert.equal(frameAt(NaN), 0); // NaN clamps via Math.max -> NaN? verify behavior
});

test("shotAtFrame clamps: 0 -> shot 01, 1799 -> shot 10, 1800 -> shot 10", () => {
  assert.equal(shotAtFrame(0).id, "01");
  assert.equal(shotAtFrame(149).id, "01");
  assert.equal(shotAtFrame(150).id, "02");
  assert.equal(shotAtFrame(1799).id, "10");
  assert.equal(shotAtFrame(1800).id, "10");
  assert.equal(shotAtFrame(-5).id, "01");
  assert.equal(shotAtFrame(5000).id, "10");
});

test("shotAtSeconds agrees with shotAtFrame(frameAt(s))", () => {
  for (const t of [0, 1.2, 4.999, 5, 5.001, 20.5, 45.9, 59.5, 60]) {
    assert.equal(shotAtSeconds(t).id, shotAtFrame(frameAt(t)).id);
  }
  assert.equal(shotAtSeconds(4.999).id, "01");
  assert.equal(shotAtSeconds(5).id, "02");
  assert.equal(shotAtSeconds(59.5).id, "10");
});

test("deterministic: repeated calls return identical results", () => {
  const a = SHOT_SPANS.map((s) => [s.id, s.start, s.end]);
  const b = SHOT_SPANS.map((s) => [s.id, s.start, s.end]);
  assert.deepEqual(a, b);
  for (const f of [0, 1, 149, 150, 899, 1170, 1799, 1800]) {
    assert.equal(shotAtFrame(f), shotAtFrame(f));
    assert.deepEqual(shotAtFrame(f), shotAtFrame(f));
  }
  for (const t of [0, 2.5, 33.3, 59.99]) {
    assert.equal(frameAt(t), frameAt(t));
    assert.deepEqual(shotAtSeconds(t), shotAtSeconds(t));
  }
});
