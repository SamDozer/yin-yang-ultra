import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSandboxState, updateSandboxPhysics, disturb, restoreBalance, fourImages, returnFrame
} from '../engine.js';

const run = (state, seconds, onStep) => {
  const dt = 1 / 60;
  let frame = null;
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    frame = updateSandboxPhysics(state, dt);
    if (onStep) onStep(frame, i * dt);
  }
  return frame;
};

test('fourImages: quadrants of the yin-yang cycle', () => {
  assert.equal(fourImages(22, 6, 0), 'oldYin');
  assert.equal(fourImages(6, 22, 0), 'oldYang');
  assert.equal(fourImages(12, 12, 0), 'balance');
  assert.equal(fourImages(14, 10, 0.1), 'youngYang');
  assert.equal(fourImages(10, 14, -0.1), 'youngYin');
});

test('returnFrame walks dawn, noon, dusk, midnight and conserves total', () => {
  assert.equal(returnFrame(0).phase, 'youngYang');
  assert.equal(returnFrame(6).phase, 'oldYang');
  assert.equal(returnFrame(12).phase, 'youngYin');
  assert.equal(returnFrame(18).phase, 'oldYin');
  for (const t of [0, 3, 7.5, 13, 21]) {
    assert.ok(Math.abs(returnFrame(t).total - 24) < 1e-9);
  }
});

test('sustained imbalance reverses instead of rupturing', () => {
  const s = createSandboxState();
  s.targetYin = 30;
  s.targetYang = 1;
  let firstReversing = null;
  let reversedAt = null;
  let everRuptured = false;
  const last = run(s, 16, (f, t) => {
    if (f.ruptured) everRuptured = true;
    if (f.reversal > 0 && firstReversing === null) firstReversing = t;
    if (f.justReversed && reversedAt === null) reversedAt = t;
  });
  assert.equal(everRuptured, false);
  assert.ok(firstReversing > 7.5 && firstReversing < 10, `reversal began at ${firstReversing}`);
  assert.ok(reversedAt !== null && reversedAt < 15.5, `reversal ended at ${reversedAt}`);
  assert.ok(last.yang > last.yin);
});

test('overload ruptures; load returning to normal heals without flicker', () => {
  const s = createSandboxState();
  s.targetYin = 26;
  s.targetYang = 26;
  let ruptures = 0;
  run(s, 2, f => { if (f.justRuptured) ruptures += 1; });
  assert.equal(ruptures, 1);
  assert.equal(updateSandboxPhysics(s, 1 / 60).ruptured, true);

  s.targetYin = 12;
  s.targetYang = 12;
  let flips = 0;
  let prev = true;
  const healed = run(s, 3, f => { if (f.ruptured !== prev) { flips += 1; prev = f.ruptured; } });
  assert.equal(healed.ruptured, false);
  assert.equal(flips, 1, 'ruptured flag should change exactly once while healing');
});

test('starvation ruptures at near-void; 3:3 stays calm', () => {
  const calm = createSandboxState();
  calm.targetYin = 3;
  calm.targetYang = 3;
  assert.equal(run(calm, 3).ruptured, false);

  const void_ = createSandboxState();
  void_.targetYin = 0.2;
  void_.targetYang = 0.2;
  assert.equal(run(void_, 3).ruptured, true);
});

test('0:0 energies produce finite numbers everywhere', () => {
  const s = createSandboxState();
  s.targetYin = 0;
  s.targetYang = 0;
  const f = run(s, 2);
  for (const key of ['yin', 'yang', 'total', 'imbalance', 'strain', 'speed', 'angle', 'rate']) {
    assert.ok(Number.isFinite(f[key]), `${key} is ${f[key]}`);
  }
});

test('touching a slider mid-reversal cancels it without a value jump', () => {
  const s = createSandboxState();
  s.targetYin = 30;
  s.targetYang = 1;
  let f = run(s, 11);
  assert.ok(f.reversal > 0, 'reversal should be in progress');
  const before = { yin: f.yin, yang: f.yang };
  disturb(s);
  f = updateSandboxPhysics(s, 1 / 60);
  assert.equal(f.reversal, 0);
  assert.ok(Math.abs(f.yin - before.yin) < 0.5 && Math.abs(f.yang - before.yang) < 0.5);
  assert.equal(s.reversing, false);
});

test('Wu Wei: stillness heals imbalance faster than restlessness', () => {
  const still = createSandboxState();
  still.yin = 22; still.yang = 6; still.targetYin = 22; still.targetYang = 6;
  still.autoHarmonize = true;
  const restless = createSandboxState();
  restless.yin = 22; restless.yang = 6; restless.targetYin = 22; restless.targetYang = 6;
  restless.autoHarmonize = true;
  restless.restlessness = 0.9;
  const a = run(still, 4);
  const b = run(restless, 4);
  assert.ok(Math.abs(a.yin - a.yang) < Math.abs(b.yin - b.yang));
});

test('restoreBalance returns to 12:12 and clears rupture', () => {
  const s = createSandboxState();
  s.targetYin = 26; s.targetYang = 26;
  run(s, 2);
  restoreBalance(s);
  const f = run(s, 1);
  assert.equal(f.ruptured, false);
  assert.ok(Math.abs(f.yin - 12) < 0.01 && Math.abs(f.yang - 12) < 0.01);
});
