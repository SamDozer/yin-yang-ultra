import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENTS, MOVEMENT_SECONDS, movementAt, solarTermIndex, journeyState } from '../journey.js';

test('five movements of 75 seconds', () => {
  assert.equal(MOVEMENTS.length, 5);
  assert.equal(MOVEMENT_SECONDS, 75);
});

test('movementAt maps elapsed time and loops', () => {
  assert.deepEqual(movementAt(0), { index: 0, progress: 0 });
  assert.equal(movementAt(75).index, 1);
  assert.equal(movementAt(374.9).index, 4);
  assert.equal(movementAt(375).index, 0);
  assert.ok(Math.abs(movementAt(37.5).progress - 0.5) < 1e-9);
});

test('solarTermIndex runs 0..23 and wraps', () => {
  assert.equal(solarTermIndex(0), 0);
  assert.equal(solarTermIndex(23.9), 23);
  assert.equal(solarTermIndex(24), 0);
  assert.equal(solarTermIndex(-1), 23);
});

test('Wuji shows only a faint circle and no seeds', () => {
  const { scene } = journeyState(0, 10);
  assert.ok(scene.disc < 0.5);
  assert.equal(scene.split, 0);
  assert.equal(scene.seeds, 0);
});

test('Taiji turns, stills, then splits', () => {
  const early = journeyState(1, 5);
  const late = journeyState(1, 70);
  assert.equal(early.scene.split, 0);
  assert.equal(late.scene.split, 1);
  assert.ok(late.frame.angle > early.frame.angle);
});

test('Reversal passes through balance at its midpoint', () => {
  const start = journeyState(3, 0).frame;
  const mid = journeyState(3, 37.5).frame;
  const end = journeyState(3, 75).frame;
  assert.ok(start.yin > start.yang);
  assert.ok(Math.abs(mid.yin - mid.yang) < 0.5);
  assert.ok(end.yang > end.yin);
});

test('Return shows the solar ring and the hexagram', () => {
  const { scene, frame } = journeyState(4, 13);
  assert.equal(scene.ring, 1);
  assert.equal(scene.hex, 1);
  assert.equal(scene.term, 13);
  assert.ok(frame.phase);
});

test('every movement at every sampled time yields finite frames', () => {
  for (let i = 0; i < 5; i++) {
    for (const c of [0, 1, 20, 37.5, 74.99, 75]) {
      const { frame } = journeyState(i, c);
      for (const k of ['yin', 'yang', 'total', 'strain', 'angle']) {
        assert.ok(Number.isFinite(frame[k]), `m${i} t${c} ${k}`);
      }
    }
  }
});
