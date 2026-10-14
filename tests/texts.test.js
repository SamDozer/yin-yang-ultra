import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSAGES, FOUR_IMAGES_LABELS } from '../texts.js';

test('every passage has Chinese, Arabic, a note and a named source', () => {
  assert.ok(PASSAGES.length >= 7);
  for (const p of PASSAGES) {
    assert.ok(p.id && p.zh && p.ar && p.note, `incomplete passage ${p.id}`);
    assert.ok(p.source.book && p.source.chapter, `missing source for ${p.id}`);
    assert.equal(typeof p.verified, 'boolean');
  }
});

test('passage ids are unique and every movement 0-5 has at least one passage', () => {
  assert.equal(new Set(PASSAGES.map(p => p.id)).size, PASSAGES.length);
  for (let m = 0; m <= 5; m++) {
    assert.ok(PASSAGES.some(p => p.movement === m), `no passage for movement ${m}`);
  }
});

test('four-images labels cover every phase the engine can return', () => {
  for (const key of ['balance', 'youngYang', 'oldYang', 'youngYin', 'oldYin']) {
    assert.ok(FOUR_IMAGES_LABELS[key].zh && FOUR_IMAGES_LABELS[key].ar);
  }
});
