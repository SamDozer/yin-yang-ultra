import test from 'node:test';
import assert from 'node:assert/strict';
import { sound } from '../audio.js';

test('without Web Audio the engine stays silent and never throws', () => {
  assert.doesNotThrow(() => sound.update(0, { strain: 0.2, imbalance: 0.1, movement: 1 }, true));
  assert.doesNotThrow(() => sound.init());
  assert.doesNotThrow(() => sound.resume());
  assert.doesNotThrow(() => sound.playRupture());
  assert.doesNotThrow(() => sound.playBowl(110));
  assert.doesNotThrow(() => sound.playSeasonChime(4));
  assert.equal(typeof sound.toggleMute(), 'boolean');
});
