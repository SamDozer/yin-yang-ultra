import test from 'node:test';
import assert from 'node:assert/strict';
import { hexagramFor, HEXAGRAMS } from '../hexagram.js';

test('balance, rising, is Tai (peace) with three solid lines at the bottom', () => {
  const h = hexagramFor(12, 12, 0);
  assert.equal(h.name, 'tai');
  assert.deepEqual(h.lines, [1, 1, 1, 0, 0, 0]);
});

test('balance, falling, is Pi (stagnation) with solid lines on top', () => {
  const h = hexagramFor(12, 12, -0.1);
  assert.equal(h.name, 'pi');
  assert.deepEqual(h.lines, [0, 0, 0, 1, 1, 1]);
});

test('extremes are Qian (all yang) and Kun (all yin)', () => {
  assert.equal(hexagramFor(0, 24, 0).name, 'qian');
  assert.equal(hexagramFor(24, 0, 0).name, 'kun');
});

test('waxing sequence runs Kun, Fu, Lin, Tai, Da Zhuang, Guai, Qian', () => {
  const names = [0, 4, 8, 12, 16, 20, 24].map(y => hexagramFor(24 - y, y, 0).name);
  assert.deepEqual(names, ['kun', 'fu', 'lin', 'tai', 'daZhuang', 'guai', 'qian']);
});

test('waning sequence runs Qian, Gou, Dun, Pi, Guan, Bo, Kun', () => {
  const names = [24, 20, 16, 12, 8, 4, 0].map(y => hexagramFor(24 - y, y, -1).name);
  assert.deepEqual(names, ['qian', 'gou', 'dun', 'pi', 'guan', 'bo', 'kun']);
});

test('0:0 gives a valid hexagram, no NaN', () => {
  const h = hexagramFor(0, 0, 0);
  assert.equal(h.lines.length, 6);
  assert.ok(HEXAGRAMS[h.name]);
});

test('all twelve names carry Chinese and Arabic text', () => {
  const names = Object.keys(HEXAGRAMS);
  assert.equal(names.length, 12);
  for (const n of names) {
    assert.ok(HEXAGRAMS[n].zh.length >= 1 && HEXAGRAMS[n].ar.length >= 1);
  }
});
