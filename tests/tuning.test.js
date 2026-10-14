import test from 'node:test';
import assert from 'node:assert/strict';
import { PENTATONIC_BASE_HZ, voiceFrequencies } from '../tuning.js';

test('balance is an exact perfect fifth (3:2)', () => {
  const v = voiceFrequencies(110, 0);
  assert.equal(v.yin, 110);
  assert.equal(v.yang / v.yin, 1.5);
});

test('imbalance detunes the yang voice upward so it beats', () => {
  const calm = voiceFrequencies(110, 0).yang;
  const strained = voiceFrequencies(110, 1).yang;
  assert.ok(strained > calm);
  assert.ok(strained / calm < 1.03, 'detune stays under a quarter tone');
});

test('out-of-range imbalance is clamped', () => {
  assert.equal(voiceFrequencies(110, 5).yang, voiceFrequencies(110, 1).yang);
  assert.equal(voiceFrequencies(110, -3).yang, voiceFrequencies(110, 0).yang);
});

test('five pentatonic bases', () => {
  assert.equal(PENTATONIC_BASE_HZ.length, 5);
});
