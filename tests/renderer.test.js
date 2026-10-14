import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScene } from '../renderer.js';
import { journeyState } from '../journey.js';
import { createSandboxState, updateSandboxPhysics } from '../engine.js';

function stubContext() {
  const calls = { fillText: 0, arc: 0 };
  const target = {};
  return new Proxy(target, {
    get(t, key) {
      if (key === 'calls') return calls;
      if (key in t) return t[key];
      return (...args) => {
        if (key === 'fillText') calls.fillText += 1;
        if (key === 'arc') calls.arc += 1;
        return { addColorStop() {} };
      };
    },
    set(t, key, value) { t[key] = value; return true; }
  });
}

const base = { time: 3, dpr: 1, reduced: false, study: false, pointer: null };

test('does not throw at 0x0 or 1x1 canvas sizes', () => {
  const { frame, scene } = journeyState(4, 10);
  for (const [w, h] of [[0, 0], [1, 1], [0, 500]]) {
    assert.doesNotThrow(() => renderScene({ ctx: stubContext(), frame, scene, width: w, height: h, ...base }));
  }
});

test('draws every movement at several moments', () => {
  for (let i = 0; i < 5; i++) {
    for (const c of [0, 20, 40, 74]) {
      const { frame, scene } = journeyState(i, c);
      const ctx = stubContext();
      renderScene({ ctx, frame, scene, width: 800, height: 600, ...base });
      assert.ok(ctx.calls.arc > 0, `movement ${i} at ${c} drew nothing`);
    }
  }
});

test('draws Practice frames including 0:0 and a ruptured circle', () => {
  const s = createSandboxState();
  s.targetYin = 0; s.targetYang = 0;
  let frame;
  for (let i = 0; i < 180; i++) frame = updateSandboxPhysics(s, 1 / 60);
  const scene = { disc: 1, split: 1, seeds: 1, fourRing: 1, ring: 0, hex: 1, drop: -1, term: 0 };
  assert.doesNotThrow(() => renderScene({ ctx: stubContext(), frame, scene, width: 640, height: 480, ...base }));
  assert.equal(frame.ruptured, true);
});

test('study mode draws the four-images labels', () => {
  const { frame, scene } = journeyState(4, 10);
  const ctx = stubContext();
  renderScene({ ctx, frame, scene, width: 800, height: 600, ...base, study: true });
  assert.ok(ctx.calls.fillText >= 4);
});
