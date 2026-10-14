# Yin-Yang Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Yin-Yang simulation into a five-movement, ink-on-night journey (Wuji → Taiji → Two Forms/Four Images → Reversal → Return) with a Contemplate/Study toggle, sourced classical passages, pentatonic sound and a Wu Wei practice mode.

**Architecture:** Pure, unit-tested logic modules (`engine`, `hexagram`, `journey`, `texts`, `tuning`) produce one *frame* object (yin, yang, strain, phase, reversal…) and one *scene* object (which layers are visible). `renderer.js`, `audio.js` and the Study panel only read those two objects. A Python script bundles everything plus font subsets into an offline `standalone.html`.

**Tech Stack:** Vanilla ES modules, Canvas 2D, Web Audio, `node --test` (Node's built-in runner, no new dependencies), Python 3 + `fonttools`/`brotli` only as a build-time tool for font subsets.

**Spec:** `docs/superpowers/specs/2026-10-14-yin-yang-journey-design.md`

## Global Constraints

- No runtime dependencies, no CDN, no network: `standalone.html` must work offline.
- Palette exactly: ground `#0b0a09`, yang paper `#ece6d8`, yin ink `#14110f`, accent gold `#b8975a`, strain cinnabar `#a63d2f`.
- Five movements of 75 s each in Contemplate; breathing pulse ≈ 12 s; every change eases over 1–3 s.
- No emoji and no gauge bars in the UI. Arabic is the primary UI language; Chinese originals are shown beside it.
- Imbalance ends in **reversal**; only overload (total ≥ ~36) and starvation (total ≤ ~0.7) **rupture**.
- Sound is procedural, pentatonic; balance is a 3:2 ratio; silent until first user tap; one mute control.
- No invented quotations: a passage ships only with `verified: true`.
- Arabic renderings are labeled "project translation".
- `prefers-reduced-motion` turns movements into slow cross-fades (no breathing, no drifting mist).
- Tests run with `node --test` and add no npm dependencies.
- Fonts are embedded as subsets (Ma Shan Zheng for brush Chinese, Amiri for Arabic); system serif is the fallback.

## Review Focus

Behaviors the spec implies but no task test would otherwise pin; each is tested in the named task.

1. **Audio unavailable or blocked** — page must run silent with no exception (Task 7).
2. **0 : 0 energies** — no `NaN` in physics, hexagram or renderer (Tasks 2, 3, 6).
3. **Zero-size canvas (tiny or hidden window)** — renderer returns without throwing (Task 6).
4. **User touches a slider mid-reversal** — reversal cancels cleanly, no stuck state or value jump (Task 2).
5. **Rupture then recovery** — circle heals when load returns to normal, and does not flicker at the threshold (Task 2).

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `package.json` | create | `type: module`, `npm test`, `npm run check:quotes` |
| `engine.js` | rewrite | strain laws, reversal timeline, four-images phase, return-cycle frame |
| `hexagram.js` | create | yin/yang → six lines + sovereign-hexagram name |
| `texts.js` | create | passages, four-images labels (data only) |
| `journey.js` | create | movements, timing, per-movement frame + scene |
| `tuning.js` | create | pentatonic bases and 3:2 voice ratio |
| `renderer.js` | rewrite | ink-brush drawing of frame + scene |
| `audio.js` | rewrite | pentatonic voices, bowl, season chime, rupture |
| `app.js` | rewrite | clock, input, Contemplate/Study, Practice |
| `index.html`, `style.css` | rewrite | ink-and-gold shell |
| `motion.js` | delete | superseded by new renderer |
| `tools/subset_fonts.py`, `tools/check-quotes.js` | create | font subsets; verification gate |
| `fonts.css` | generated | embedded subset fonts |
| `build_standalone.py` | rewrite | offline bundle |
| `tests/*.test.js` | create | unit tests |

Working location: a **short-path clone** at `C:\w\yyu` (the session folder path is too long for git).

---

### Task 1: Repository setup and test harness

**Files:**
- Create: `C:\w\yyu\` (clone), `package.json`, `tests/smoke.test.js`
- Copy: spec and this plan into `docs/superpowers/…`

**Interfaces:**
- Produces: `npm test` runs `node --test`; feature branch `feature/yin-yang-journey`.

- [ ] **Step 1: Clone upstream read-only to a short path and branch**

```bash
git clone https://github.com/abdoabdo22334456-prog/yin-yang-ultra.git C:/w/yyu
cd C:/w/yyu && git checkout -b feature/yin-yang-journey && node --version
```
Expected: clone succeeds (no `$GIT_DIR too big`), Node ≥ 20 printed. If Node < 20, stop and ask the user.

- [ ] **Step 2: Copy docs into the repo**

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp "C:/Users/Hossam/Documents/yin-yang-ultra/docs/superpowers/specs/2026-10-14-yin-yang-journey-design.md" docs/superpowers/specs/
cp "C:/Users/Hossam/Documents/yin-yang-ultra/docs/superpowers/plans/2026-10-14-yin-yang-journey.md" docs/superpowers/plans/
```

- [ ] **Step 3: Add `package.json` and a smoke test**

`package.json`:
```json
{
  "name": "yin-yang-ultra",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "check:quotes": "node tools/check-quotes.js"
  }
}
```
`tests/smoke.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';

test('test harness runs', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 4: Run and commit**

Run: `npm test`
Expected: 1 test passes.

```bash
git add package.json tests docs
git commit -m "chore: add test harness and design docs"
```

---

### Task 2: Engine — strain laws, reversal, phase, return cycle

**Files:**
- Rewrite: `engine.js`
- Create: `tests/engine.test.js`

**Interfaces:**
- Produces (exact):
  - `clamp(v, a=0, b=1)`, `smooth(v)`
  - `REVERSAL_THRESHOLD=0.55`, `REVERSAL_HOLD=8`, `REVERSAL_DURATION=6`, `OVERLOAD_RUPTURE=0.8`, `STARVATION_RUPTURE=0.95`, `RETURN_SECONDS=24`
  - `fourImages(yin, yang, rate) → 'balance'|'youngYang'|'oldYang'|'youngYin'|'oldYin'`
  - `returnFrame(t) → frame`
  - `createSandboxState()`, `disturb(state, amount=0.12)`, `restoreBalance(state)`
  - `updateSandboxPhysics(state, dt) → frame`
- A **frame** is `{ yin, yang, total, imbalance, strain, speed, angle, phase, rate, reversal, justReversed, ruptured, ruptureAge, justRuptured }`.

- [ ] **Step 1: Write the failing tests** — `tests/engine.test.js`

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/engine.test.js`
Expected: FAIL (`fourImages`/`returnFrame` etc. not exported).

- [ ] **Step 3: Replace `engine.js` entirely**

```js
// engine.js - strain laws, the reversal timeline and the four-images phase (pure functions)
export const REVERSAL_THRESHOLD = 0.55; // |yin - yang| / total at which reversal starts to build
export const REVERSAL_HOLD = 8.0;       // seconds the imbalance must persist
export const REVERSAL_DURATION = 6.0;   // seconds yin and yang take to trade places
export const OVERLOAD_RUPTURE = 0.8;
export const STARVATION_RUPTURE = 0.95;
export const RETURN_SECONDS = 24;

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = v => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

// Four Images: old yang / old yin are the fullest states; young ones are the turning points.
export function fourImages(yin, yang, rate) {
  const s = (yang - yin) / Math.max(0.1, yin + yang);
  if (Math.abs(s) < 0.1 && Math.abs(rate) < 0.005) return 'balance';
  if (s >= 0.5) return 'oldYang';
  if (s <= -0.5) return 'oldYin';
  return rate >= 0 ? 'youngYang' : 'youngYin';
}

// One 24 s turn of the wheel: yang rises while yin falls, then the reverse. Total stays 24.
export function returnFrame(t) {
  const theta = (t / RETURN_SECONDS) * Math.PI * 2;
  const yang = 12 + 9 * Math.sin(theta);
  const yin = 12 - 9 * Math.sin(theta);
  const total = yin + yang;
  const imbalance = Math.abs(yang - yin) / total;
  const rate = 0.75 * Math.cos(theta) * ((Math.PI * 2) / RETURN_SECONDS);
  return {
    yin, yang, total, imbalance,
    strain: clamp(imbalance ** 1.35 * 0.8),
    speed: 1, angle: 0, phase: fourImages(yin, yang, rate), rate,
    reversal: 0, justReversed: false, ruptured: false, ruptureAge: 0, justRuptured: false
  };
}

export function createSandboxState() {
  return {
    yin: 12, yang: 12, targetYin: 12, targetYang: 12,
    autoHarmonize: false, angle: 0,
    ruptured: false, ruptureAge: 0, justRuptured: false,
    reversing: false, reversal: 0, revFrom: null, reversalHold: 0, justReversed: false,
    restlessness: 0, prevS: 0, rate: 0
  };
}

// The user touched a control: it adds restlessness and cancels a reversal in progress.
export function disturb(state, amount = 0.12) {
  state.restlessness = clamp(state.restlessness + amount);
  state.reversing = false;
  state.reversal = 0;
  state.revFrom = null;
  state.reversalHold = 0;
}

export function restoreBalance(state) {
  state.yin = state.yang = state.targetYin = state.targetYang = 12;
  state.ruptured = false;
  state.ruptureAge = 0;
  state.reversing = false;
  state.reversal = 0;
  state.revFrom = null;
  state.reversalHold = 0;
  state.restlessness = 0;
  state.rate = 0;
  state.prevS = 0;
}

export function updateSandboxPhysics(state, dt) {
  state.justRuptured = false;
  state.justReversed = false;
  state.restlessness = Math.max(0, state.restlessness - dt * 0.08);

  if (state.reversing) {
    // yin and yang trade places along a smooth curve
    state.reversal = Math.min(1, state.reversal + dt / REVERSAL_DURATION);
    const k = smooth(state.reversal);
    const { yin: y0, yang: a0 } = state.revFrom;
    state.yin = y0 + (a0 - y0) * k;
    state.yang = a0 + (y0 - a0) * k;
    state.targetYin = state.yin;
    state.targetYang = state.yang;
    if (state.reversal >= 1) {
      state.reversing = false;
      state.reversal = 0;
      state.revFrom = null;
      state.reversalHold = 0;
      state.justReversed = true;
    }
  } else if (state.autoHarmonize) {
    // Wu Wei: stillness heals, restlessness slows the healing
    const avg = (state.yin + state.yang) / 2;
    const heal = Math.min(1, dt * 2.2 * (1 - state.restlessness));
    state.yin += (avg - state.yin) * heal;
    state.yang += (avg - state.yang) * heal;
    state.targetYin = state.yin;
    state.targetYang = state.yang;
  } else {
    const follow = Math.min(1, dt * 10);
    state.yin += (state.targetYin - state.yin) * follow;
    state.yang += (state.targetYang - state.yang) * follow;
  }

  const total = Math.max(0.1, state.yin + state.yang);
  const ratio = Math.abs(state.yin - state.yang) / total;
  const imbalanceStrain = ratio ** 1.35;
  const overloadStrain = total > 24 ? Math.min(1, ((total - 24) / 14) ** 1.3) : 0;
  const starvationStrain = total < 6 ? Math.min(1, ((6 - total) / 5.5) ** 1.4) : 0;
  const strain = clamp(
    imbalanceStrain * 0.8 + overloadStrain * 0.65 + starvationStrain * 0.4 + state.restlessness * 0.2
  );

  // only overload and starvation break the circle
  const breaks = overloadStrain >= OVERLOAD_RUPTURE || starvationStrain >= STARVATION_RUPTURE;
  if (breaks) {
    if (!state.ruptured) {
      state.ruptured = true;
      state.ruptureAge = 0;
      state.justRuptured = true;
      state.reversing = false;
      state.reversal = 0;
      state.revFrom = null;
      state.reversalHold = 0;
    } else {
      state.ruptureAge += dt;
    }
  } else if (state.ruptured) {
    if (overloadStrain < 0.5 && starvationStrain < 0.6) {
      state.ruptured = false;
      state.ruptureAge = 0;
    } else {
      state.ruptureAge += dt;
    }
  }

  // imbalance that persists turns into its opposite
  if (!state.reversing && !state.ruptured) {
    if (ratio >= REVERSAL_THRESHOLD) {
      state.reversalHold += dt;
      if (state.reversalHold >= REVERSAL_HOLD) {
        state.reversing = true;
        state.reversal = 0;
        state.revFrom = { yin: state.yin, yang: state.yang };
      }
    } else {
      state.reversalHold = Math.max(0, state.reversalHold - dt * 2);
    }
  }

  const baseSpeed = total > 0.4 ? Math.min(1.4, 24 / total) : 0;
  const speed = baseSpeed * Math.max(0.04, 1 - strain * 0.55);
  state.angle += dt * 0.5 * speed;

  const s = (state.yang - state.yin) / total;
  if (dt > 0) state.rate += ((s - state.prevS) / dt - state.rate) * Math.min(1, dt * 3);
  state.prevS = s;

  return {
    yin: state.yin, yang: state.yang, total, imbalance: ratio, strain, speed,
    angle: state.angle, rate: state.rate,
    phase: fourImages(state.yin, state.yang, state.rate),
    reversal: state.reversing ? smooth(state.reversal) : 0,
    justReversed: state.justReversed,
    ruptured: state.ruptured, ruptureAge: state.ruptureAge, justRuptured: state.justRuptured
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/engine.test.js`
Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add engine.js tests/engine.test.js
git commit -m "feat(engine): reversal timeline, rupture split, four-images phase, return cycle"
```

---

### Task 3: Hexagram mapping

**Files:**
- Create: `hexagram.js`, `tests/hexagram.test.js`

**Interfaces:**
- Produces: `HEXAGRAMS` (map name → `{zh, ar}`), `hexagramFor(yin, yang, rate) → { name, zh, ar, lines, solid, waxing }` where `lines` is six 0/1 values **bottom to top**.
- Rule: yang share → number of solid lines `n` (0–6). Waxing (`rate ≥ 0`): bottom `n` lines solid. Waning: top `n` lines solid. This yields the twelve sovereign hexagrams.

- [ ] **Step 1: Write the failing test** — `tests/hexagram.test.js`

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/hexagram.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `hexagram.js`

```js
// hexagram.js - yin/yang balance to the twelve sovereign hexagrams (十二消息卦)
export const HEXAGRAMS = {
  kun: { zh: '坤', ar: 'التقبّل' },
  fu: { zh: '復', ar: 'العودة' },
  lin: { zh: '臨', ar: 'الاقتراب' },
  tai: { zh: '泰', ar: 'السلام والانسجام' },
  daZhuang: { zh: '大壯', ar: 'القوة العظيمة' },
  guai: { zh: '夬', ar: 'الانفراج' },
  qian: { zh: '乾', ar: 'الإبداع' },
  gou: { zh: '姤', ar: 'اللقاء' },
  dun: { zh: '遯', ar: 'الانسحاب' },
  pi: { zh: '否', ar: 'الركود' },
  guan: { zh: '觀', ar: 'التأمل' },
  bo: { zh: '剝', ar: 'التفكك' }
};

// index = number of solid (yang) lines, 0..6
const WAXING = ['kun', 'fu', 'lin', 'tai', 'daZhuang', 'guai', 'qian'];
const WANING = ['kun', 'bo', 'guan', 'pi', 'dun', 'gou', 'qian'];

export function hexagramFor(yin, yang, rate) {
  const total = yin + yang;
  const share = total > 0.1 ? yang / total : 0.5;
  const solid = Math.max(0, Math.min(6, Math.round(share * 6)));
  const waxing = rate >= 0;
  const lines = [0, 0, 0, 0, 0, 0]; // bottom to top
  for (let i = 0; i < solid; i++) lines[waxing ? i : 5 - i] = 1;
  const name = (waxing ? WAXING : WANING)[solid];
  return { name, zh: HEXAGRAMS[name].zh, ar: HEXAGRAMS[name].ar, lines, solid, waxing };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/hexagram.test.js`
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add hexagram.js tests/hexagram.test.js
git commit -m "feat: sovereign-hexagram mapping from yin/yang balance"
```

---

### Task 4: Texts and the verification gate

**Files:**
- Create: `texts.js`, `tests/texts.test.js`, `tools/check-quotes.js`

**Interfaces:**
- Produces: `PASSAGES` (array of `{ id, movement, zh, ar, note, source:{book, chapter}, verified }`; `movement` 0–4 for the journey, 5 for Practice), `FOUR_IMAGES_LABELS` (map phase → `{zh, ar}`).

- [ ] **Step 1: Write the failing test** — `tests/texts.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSAGES, FOUR_IMAGES_LABELS } from '../texts.js';

test('every passage has Chinese, Arabic, a note and a named source', () => {
  assert.ok(PASSAGES.length >= 8);
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/texts.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `texts.js` (all `verified:false` until Task 10)

```js
// texts.js - classical passages as data. A passage ships only when verified === true.
export const PASSAGES = [
  {
    id: 'wuji', movement: 0, verified: false,
    zh: '無極而太極',
    ar: 'من اللاقطب ينبثق القطب الأعظم',
    note: 'قبل الانقسام لا شيء يُرى؛ ومن هذا الفراغ يبدأ كل شيء.',
    source: { book: '周敦頤 · 太極圖說', chapter: 'الجملة الأولى' }
  },
  {
    id: 'taiji', movement: 1, verified: false,
    zh: '太極動而生陽，動極而靜，靜而生陰，靜極復動',
    ar: 'القطب الأعظم يتحرك فيلد اليانغ؛ وإذا بلغت الحركة منتهاها سكن، وبالسكون يلد الين؛ وإذا بلغ السكون منتهاه عاد فتحرّك.',
    note: 'الحركة والسكون ليسا ضدّين متخاصمين، بل نفَسٌ واحد.',
    source: { book: '周敦頤 · 太極圖說', chapter: 'الفقرة الأولى' }
  },
  {
    id: 'sixiang', movement: 2, verified: false,
    zh: '易有太極，是生兩儀，兩儀生四象，四象生八卦',
    ar: 'في التغيّر قطبٌ أعظم يلد الصورتين، والصورتان تلدان الصور الأربع، والأربع تلد الرموز الثمانية.',
    note: 'اليانغ والين يتفرّعان إلى أطوارٍ أربعة: ناشئ وأعظم لكلٍّ منهما.',
    source: { book: '易經 · 繫辭上', chapter: 'الفصل 11' }
  },
  {
    id: 'reversal-neijing', movement: 3, verified: false,
    zh: '重陰必陽，重陽必陰',
    ar: 'إذا اشتدّ الين صار يانغ، وإذا اشتدّ اليانغ صار ين.',
    note: 'الغلوّ لا ينكسر بل ينقلب إلى نقيضه.',
    source: { book: '黃帝內經 · 素問 · 陰陽應象大論', chapter: 'الفصل 5' }
  },
  {
    id: 'reversal-dao', movement: 3, verified: false,
    zh: '反者道之動',
    ar: 'الرجوع هو حركة الداو.',
    note: 'ما يبلغ منتهاه يعود؛ هذه هي الحركة الدائمة للطريق.',
    source: { book: '道德經', chapter: 'الفصل 40' }
  },
  {
    id: 'return-yijing', movement: 4, verified: false,
    zh: '一陰一陽之謂道',
    ar: 'ين واحد ويانغ واحد: ذلك هو الداو.',
    note: 'الطريق ليس أحدهما، بل تعاقبهما.',
    source: { book: '易經 · 繫辭上', chapter: 'الفصل 5' }
  },
  {
    id: 'return-dao', movement: 4, verified: false,
    zh: '萬物負陰而抱陽',
    ar: 'الكائنات تحمل الين على ظهورها وتحتضن اليانغ.',
    note: 'كل شيء يحمل نقيضه في داخله.',
    source: { book: '道德經', chapter: 'الفصل 42' }
  },
  {
    id: 'wuwei', movement: 5, verified: false,
    zh: '無為而無不為',
    ar: 'بلا تكلّف، وليس شيء بلا إنجاز.',
    note: 'اترك اليدين؛ فالاتزان يعود وحده.',
    source: { book: '道德經', chapter: 'الفصل 37' }
  }
];

export const FOUR_IMAGES_LABELS = {
  balance: { zh: '和', ar: 'اتزان' },
  youngYang: { zh: '少陽', ar: 'اليانغ الناشئ' },
  oldYang: { zh: '太陽', ar: 'اليانغ الأعظم' },
  youngYin: { zh: '少陰', ar: 'الين الناشئ' },
  oldYin: { zh: '太陰', ar: 'الين الأعظم' }
};
```

- [ ] **Step 4: Add the release gate** — `tools/check-quotes.js`

```js
// Fails when any passage has not been verified against a public edition.
import { PASSAGES } from '../texts.js';

const pending = PASSAGES.filter(p => p.verified !== true);
if (pending.length) {
  console.error('Unverified passages:\n' + pending.map(p => `  - ${p.id} (${p.source.book} ${p.source.chapter})`).join('\n'));
  process.exit(1);
}
console.log(`All ${PASSAGES.length} passages verified.`);
```

- [ ] **Step 5: Run to verify pass, confirm gate fails for now**

Run: `node --test tests/texts.test.js`
Expected: 3 tests PASS.
Run: `npm run check:quotes`
Expected: exit code 1 listing 8 unverified passages (this is correct until Task 10).

- [ ] **Step 6: Commit**

```bash
git add texts.js tests/texts.test.js tools/check-quotes.js
git commit -m "feat: sourced passages and quote verification gate"
```

---

### Task 5: Journey timeline and scenes

**Files:**
- Create: `journey.js`, `tests/journey.test.js`

**Interfaces:**
- Consumes: `clamp`, `smooth`, `returnFrame`, `fourImages` from `engine.js`.
- Produces: `MOVEMENT_SECONDS=75`, `MOVEMENTS` (5 × `{id, zh, ar}`), `movementAt(elapsed) → {index, progress}`, `solarTermIndex(t) → 0..23`, `journeyState(index, clock) → { scene, frame }`.
- A **scene** is `{ disc, split, seeds, fourRing, ring, hex, drop, term }` (all 0–1 except `drop` = −1 when unused and `term` = 0–23).

- [ ] **Step 1: Write the failing test** — `tests/journey.test.js`

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/journey.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `journey.js`

```js
// journey.js - the five movements: timing, per-movement frame and visible layers
import { clamp, smooth, returnFrame, fourImages } from './engine.js';

export const MOVEMENT_SECONDS = 75;
export const MOVEMENTS = [
  { id: 'wuji', zh: '無極', ar: 'اللاقطب' },
  { id: 'taiji', zh: '太極', ar: 'القطب الأعظم' },
  { id: 'sixiang', zh: '兩儀四象', ar: 'الصورتان والصور الأربع' },
  { id: 'reversal', zh: '物極必反', ar: 'الانقلاب' },
  { id: 'return', zh: '歸', ar: 'العودة' }
];

const TAU = Math.PI * 2;

export function movementAt(elapsed) {
  const span = MOVEMENT_SECONDS * MOVEMENTS.length;
  const t = ((elapsed % span) + span) % span;
  const index = Math.min(MOVEMENTS.length - 1, Math.floor(t / MOVEMENT_SECONDS));
  return { index, progress: (t - index * MOVEMENT_SECONDS) / MOVEMENT_SECONDS };
}

export function solarTermIndex(t) {
  return Math.floor(((t % 24) + 24) % 24);
}

function still(yin, yang, extra = {}) {
  const total = yin + yang;
  const imbalance = Math.abs(yang - yin) / Math.max(0.1, total);
  return {
    yin, yang, total, imbalance, strain: clamp(imbalance ** 1.35 * 0.8),
    speed: 1, angle: 0, phase: fourImages(yin, yang, 0), rate: 0,
    reversal: 0, justReversed: false, ruptured: false, ruptureAge: 0, justRuptured: false,
    ...extra
  };
}

export function journeyState(index, clock) {
  const p = clamp(clock / MOVEMENT_SECONDS);
  const base = { disc: 1, split: 1, seeds: 1, fourRing: 0, ring: 0, hex: 0, drop: -1, term: 0 };

  if (index === 0) {
    return { scene: { ...base, disc: 0.2, split: 0, seeds: 0, drop: p }, frame: still(12, 12, { angle: clock * 0.05 }) };
  }
  if (index === 1) {
    const split = smooth((p - 0.55) / 0.35);
    const angle = TAU * 1.5 * smooth(p / 0.55); // motion peaks, then stills
    return { scene: { ...base, split, seeds: split }, frame: still(12, 12, { angle }) };
  }
  if (index === 2) {
    const frame = { ...returnFrame(clock), angle: clock * 0.2 };
    return { scene: { ...base, fourRing: smooth(p / 0.2) }, frame };
  }
  if (index === 3) {
    const k = smooth((p - 0.2) / 0.6);
    const yin = 22 + (6 - 22) * k;
    const yang = 6 + (22 - 6) * k;
    const rate = k > 0 && k < 1 ? 1 : 0;
    const frame = {
      ...still(yin, yang, { angle: clock * 0.2, rate }),
      phase: fourImages(yin, yang, rate),
      reversal: k > 0 && k < 1 ? k : 0
    };
    return { scene: { ...base, fourRing: 1 }, frame };
  }
  const frame = { ...returnFrame(clock), angle: clock * 0.2 };
  return {
    scene: { ...base, fourRing: 1, ring: 1, hex: 1, term: solarTermIndex(clock) },
    frame
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/journey.test.js`
Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add journey.js tests/journey.test.js
git commit -m "feat: five-movement journey timeline and scenes"
```

---

### Task 6: Ink renderer

**Files:**
- Rewrite: `renderer.js`
- Delete: `motion.js`
- Create: `tests/renderer.test.js`

**Interfaces:**
- Consumes: `clamp`, `smooth` (engine); `hexagramFor` (hexagram); `FOUR_IMAGES_LABELS` (texts); a frame and a scene (Tasks 2, 5).
- Produces: `renderScene({ ctx, time, frame, scene, width, height, dpr, reduced, study, pointer })` — draws one frame; returns nothing; returns immediately if `width < 2 || height < 2`.

- [ ] **Step 1: Write the failing test** — `tests/renderer.test.js` (stub canvas context, no DOM)

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/renderer.test.js`
Expected: FAIL (old `renderScene` signature / `motion.js` imports).

- [ ] **Step 3: Replace `renderer.js` entirely**

```js
// renderer.js - ink-on-night drawing of one frame + scene (Canvas 2D, no dependencies)
import { clamp, smooth } from './engine.js';
import { hexagramFor } from './hexagram.js';
import { FOUR_IMAGES_LABELS } from './texts.js';

const TAU = Math.PI * 2;
const R = 120; // body radius in scene units

const PALETTE = {
  ground: [11, 10, 9],
  paper: [236, 230, 216],
  ink: [20, 17, 15],
  gold: [184, 151, 90],
  cinnabar: [166, 61, 47]
};
const rgba = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const mixc = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));

const RING_CENTERS = { youngYang: 0, oldYang: -Math.PI / 2, youngYin: Math.PI, oldYin: Math.PI / 2 };
const hexLines = [0, 0, 0, 0, 0, 0]; // eased line state so flips fade

let grainTile = null;
function grainPattern(ctx) {
  if (grainTile === null) {
    if (typeof document === 'undefined') {
      grainTile = false;
    } else {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const img = g.createImageData(128, 128);
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 110 + rnd() * 110;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 13;
      }
      g.putImageData(img, 0, 0);
      grainTile = ctx.createPattern(c, 'repeat');
    }
  }
  return grainTile;
}

function drawGround(ctx, w, h) {
  ctx.fillStyle = rgba(PALETTE.ground);
  ctx.fillRect(0, 0, w, h);
  const grain = grainPattern(ctx);
  if (grain) {
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, w, h);
  }
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

// three offset passes give a dry-brush edge
function brush(ctx, trace, color, width, jitter, alpha = 1) {
  const passes = [[0, 0, 1, 0.55], [0.6, -0.4, 0.6, 0.3], [-0.5, 0.5, 0.35, 0.22]];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [dx, dy, wf, al] of passes) {
    ctx.save();
    ctx.translate(dx * jitter, dy * jitter);
    ctx.strokeStyle = rgba(color, al * alpha);
    ctx.lineWidth = width * wf;
    trace();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawMist(ctx, f, scene, time, reduced) {
  const visible = smooth(scene.split);
  if (visible < 0.01) return;
  const tint = clamp((f.strain - 0.5) / 0.5);
  const total = Math.max(0.1, f.total);
  const t = reduced ? 0 : time;
  for (let i = 0; i < 72; i++) {
    const side = i % 2;
    const frac = (i * 0.6180339887) % 1;
    const ang = i * 2.39996 + t * (0.04 + (i % 5) * 0.006) * (side ? 1 : -1);
    const dist = R * (1.18 + 0.75 * frac) + 6 * Math.sin(t * 0.35 + i);
    const x = Math.cos(ang) * dist;
    const y = Math.sin(ang) * dist;
    const size = 5 + (i % 5) * 2.2;
    const share = clamp((side ? f.yang : f.yin) / total);
    const a = (0.05 + 0.06 * share) * visible;
    const color = mixc(side ? PALETTE.paper : PALETTE.gold, PALETTE.cinnabar, tint);
    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 2.4);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.4, 0, TAU);
    ctx.fill();
  }
}

function drawFourRing(ctx, f, scene, study) {
  const a = scene.fourRing;
  if (a < 0.01) return;
  const ringR = R * 1.3;
  for (const [name, center] of Object.entries(RING_CENTERS)) {
    const active = f.phase === name;
    brush(ctx, () => {
      ctx.beginPath();
      ctx.arc(0, 0, ringR, center - 0.55, center + 0.55);
    }, active ? PALETTE.gold : PALETTE.paper, active ? 2.4 : 1.1, 0.6, (active ? 0.95 : 0.3) * a);
    if (study) {
      const label = FOUR_IMAGES_LABELS[name].zh;
      ctx.save();
      ctx.font = "15px 'Ma Shan Zheng', serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(active ? PALETTE.gold : PALETTE.paper, (active ? 0.95 : 0.45) * a);
      ctx.fillText(label, Math.cos(center) * (ringR + 18), Math.sin(center) * (ringR + 18));
      ctx.restore();
    }
  }
}

function drawSolarRing(ctx, scene) {
  if (scene.ring < 0.01) return;
  for (let i = 0; i < 24; i++) {
    const a = -Math.PI / 2 + (i / 24) * TAU;
    const major = i % 6 === 0;
    const r0 = R * 1.52;
    const r1 = R * (major ? 1.66 : 1.59);
    const active = i === scene.term;
    ctx.save();
    ctx.strokeStyle = rgba(active ? PALETTE.gold : PALETTE.paper, (active ? 0.95 : 0.28) * scene.ring);
    ctx.lineWidth = major ? 1.4 : 0.9;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHexagram(ctx, f, scene) {
  if (scene.hex < 0.01) return;
  const hx = hexagramFor(f.yin, f.yang, f.rate || 0);
  for (let i = 0; i < 6; i++) {
    hexLines[i] += (hx.lines[i] - hexLines[i]) * 0.12;
    const y = R * 1.85 + 22 - i * 9; // line 0 is the bottom line
    const solid = hexLines[i];
    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(PALETTE.gold, 0.9 * scene.hex * solid);
    ctx.beginPath();
    ctx.moveTo(-28, y);
    ctx.lineTo(28, y);
    ctx.stroke();
    ctx.strokeStyle = rgba(PALETTE.paper, 0.55 * scene.hex * (1 - solid));
    ctx.beginPath();
    ctx.moveTo(-28, y);
    ctx.lineTo(-5, y);
    ctx.moveTo(5, y);
    ctx.lineTo(28, y);
    ctx.stroke();
    ctx.restore();
  }
}

function drawDrop(ctx, scene) {
  if (scene.drop < 0) return;
  const p = scene.drop;
  if (p < 0.5) {
    const y = -R * 1.7 + R * 1.7 * smooth(p / 0.5);
    ctx.fillStyle = rgba(PALETTE.gold, 0.9);
    ctx.beginPath();
    ctx.arc(0, y, 3.5, 0, TAU);
    ctx.fill();
    return;
  }
  const seconds = (p - 0.5) * 75;
  for (let j = 0; j < 3; j++) {
    const age = seconds * 0.5 - j * 1.2;
    if (age <= 0) continue;
    const r = Math.min(R * 1.4, age * 7);
    const fade = clamp(1 - r / (R * 1.4));
    ctx.save();
    ctx.strokeStyle = rgba(PALETTE.gold, 0.5 * fade);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBody(ctx, f, scene, time, reduced) {
  const breathe = reduced ? 1 : 1 + 0.015 * Math.sin((time * TAU) / 12);
  const r = R * breathe;
  const total = Math.max(0.1, f.total);
  const shift = clamp(((f.yin - f.yang) / total) * 1.15, -0.62, 0.62) * r;
  const k = scene.split;
  const edge = mixc(PALETTE.gold, PALETTE.cinnabar, clamp((f.strain - 0.4) / 0.5));
  const lean = clamp((f.yin - f.yang) / total, -1, 1); // + when yin dominates

  ctx.save();
  ctx.rotate(f.angle || 0);
  ctx.globalAlpha = clamp(scene.disc);

  const paper = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r * 1.1);
  paper.addColorStop(0, '#f4efe3');
  paper.addColorStop(1, '#dcd3bf');
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();

  if (k > 0.001) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();
    const inkGrad = ctx.createRadialGradient(shift * 0.5, -r * 0.3, r * 0.1, 0, 0, r * 1.25);
    inkGrad.addColorStop(0, '#2a2420');
    inkGrad.addColorStop(0.55, '#14110f');
    inkGrad.addColorStop(1, '#0a0908');
    ctx.globalAlpha = clamp(scene.disc) * Math.min(1, k * 4);
    ctx.fillStyle = inkGrad;
    ctx.beginPath();
    ctx.moveTo(shift, -r);
    ctx.arc(shift, (-r * k) / 2, (r * k) / 2, -Math.PI / 2, Math.PI / 2);
    ctx.arc(shift, (r * k) / 2, (r * k) / 2, -Math.PI / 2, Math.PI / 2, true);
    ctx.arc(0, 0, r * 1.2, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // seeds: each half carries the other; the seed swells as its opposite dominates
  const seedBase = r * 0.115 * smooth(scene.seeds);
  if (seedBase > 0.2) {
    const yangSeed = seedBase * (1 + 0.7 * Math.max(0, lean));
    const yinSeed = seedBase * (1 + 0.7 * Math.max(0, -lean));
    ctx.fillStyle = rgba(PALETTE.paper, 0.95);
    ctx.beginPath();
    ctx.arc(shift, (-r * k) / 2, yangSeed, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PALETTE.ink, 0.95);
    ctx.beginPath();
    ctx.arc(shift, (r * k) / 2, yinSeed, 0, TAU);
    ctx.fill();
  }

  const strokeAlpha = clamp(scene.disc);
  brush(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }, edge, 1.8 + f.strain * 1.4, 0.8, strokeAlpha);
  if (k > 0.02) {
    brush(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(shift, -r * k);
      ctx.arc(shift, (-r * k) / 2, (r * k) / 2, -Math.PI / 2, Math.PI / 2);
      ctx.arc(shift, (r * k) / 2, (r * k) / 2, -Math.PI / 2, Math.PI / 2, true);
    }, edge, 1.3, 0.7, strokeAlpha * k);
  }

  if (f.reversal > 0 && f.reversal < 1) {
    const pulse = Math.sin(Math.PI * f.reversal);
    ctx.strokeStyle = rgba(PALETTE.gold, 0.5 * pulse);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.08 + 0.12 * pulse), 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRuptured(ctx, f, scene, time, reduced) {
  const age = f.ruptureAge || 0;
  const sep = Math.min(70, age * 45);
  ctx.save();
  ctx.fillStyle = rgba([60, 12, 8], 0.35 * clamp(age * 2));
  ctx.fillRect(-500, -500, 1000, 1000);
  ctx.restore();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * sep, 0);
    ctx.beginPath();
    ctx.rect(side > 0 ? 0 : -400, -400, 400, 800);
    ctx.clip();
    ctx.globalAlpha = clamp(1 - age / 6, 0.35, 1);
    drawBody(ctx, f, scene, time, reduced);
    ctx.restore();
  }
  // cracks in cinnabar, growing from the centre
  const len = Math.min(R * 1.3, age * 60);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + Math.sin(i * 2.7) * 0.3;
    ctx.save();
    ctx.strokeStyle = rgba(PALETTE.cinnabar, 0.8 * clamp(1 - age / 8, 0.2, 1));
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let s = 1; s <= 6; s++) {
      const d = (s / 6) * len;
      const off = Math.sin(i * 5.1 + s * 1.9) * 6;
      ctx.lineTo(Math.cos(a) * d - Math.sin(a) * off, Math.sin(a) * d + Math.cos(a) * off);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function renderScene({ ctx, time, frame, scene, width, height, dpr = 1, reduced = false, study = false, pointer = null }) {
  if (width < 2 || height < 2) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawGround(ctx, width, height);

  const scale = Math.min(width / 400, height / 520);
  ctx.save();
  ctx.translate(width / 2, height / 2 - 26 * scale);
  ctx.scale(scale, scale);

  drawMist(ctx, frame, scene, time, reduced);
  drawSolarRing(ctx, scene);
  drawFourRing(ctx, frame, scene, study);
  if (frame.ruptured) drawRuptured(ctx, frame, scene, time, reduced);
  else drawBody(ctx, frame, scene, time, reduced);
  drawDrop(ctx, scene);
  drawHexagram(ctx, frame, scene);

  if (pointer && pointer.active) {
    const x = (pointer.x - width / 2) / scale;
    const y = (pointer.y - (height / 2 - 26 * scale)) / scale;
    ctx.strokeStyle = rgba(PALETTE.gold, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}
```

- [ ] **Step 4: Delete the superseded module**

```bash
git rm motion.js
```

- [ ] **Step 5: Run to verify pass**

Run: `node --test tests/renderer.test.js`
Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add renderer.js tests/renderer.test.js
git commit -m "feat(renderer): ink-brush rendering of frame and scene"
```

---

### Task 7: Tuning and audio

**Files:**
- Create: `tuning.js`, `tests/tuning.test.js`, `tests/audio.test.js`
- Rewrite: `audio.js`

**Interfaces:**
- Produces: `PENTATONIC_BASE_HZ = [65.41, 73.42, 82.41, 98.0, 110.0]`; `voiceFrequencies(baseHz, imbalance) → { yin, yang }` (`yang = base × 1.5 × 2^(cents/1200)`, `cents = clamp(imbalance) × 45`).
- `sound` object with `resume()`, `toggleMute() → isMuted`, `update(time, frame & {movement}, isPlaying)`, `playRupture()`, `playBowl(baseHz)`, `playSeasonChime(movement)`.

- [ ] **Step 1: Write failing tests**

`tests/tuning.test.js`:
```js
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
```
`tests/audio.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/tuning.test.js tests/audio.test.js`
Expected: FAIL (`tuning.js` missing; old `audio.js` has no `playRupture`).

- [ ] **Step 3: Implement** — `tuning.js`

```js
// tuning.js - pentatonic bases and the 3:2 relation between the two voices
export const PENTATONIC_BASE_HZ = [65.41, 73.42, 82.41, 98.0, 110.0]; // C D E G A

export function voiceFrequencies(baseHz, imbalance) {
  const cents = Math.max(0, Math.min(1, imbalance)) * 45;
  return { yin: baseHz, yang: baseHz * 1.5 * 2 ** (cents / 1200) };
}
```

- [ ] **Step 4: Replace `audio.js` entirely**

```js
// audio.js - procedural pentatonic voices (Web Audio API, no recorded files)
import { PENTATONIC_BASE_HZ, voiceFrequencies } from './tuning.js';

const MASTER_LEVEL = 0.3;

class InkAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    this.masterGain = null;
    this.yinOsc = null;
    this.yangOsc = null;
    this.voiceFilter = null;
    this.voiceGain = null;
    this.breathGain = null;
  }

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
      const t = this.ctx.currentTime;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : MASTER_LEVEL, t);
      this.masterGain.connect(this.ctx.destination);

      this.yinOsc = this.ctx.createOscillator();
      this.yinOsc.type = 'sine';
      this.yinOsc.frequency.setValueAtTime(PENTATONIC_BASE_HZ[4], t);
      this.yangOsc = this.ctx.createOscillator();
      this.yangOsc.type = 'triangle';
      this.yangOsc.frequency.setValueAtTime(PENTATONIC_BASE_HZ[4] * 1.5, t);

      this.voiceFilter = this.ctx.createBiquadFilter();
      this.voiceFilter.type = 'lowpass';
      this.voiceFilter.frequency.setValueAtTime(400, t);
      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(0.001, t);
      this.yinOsc.connect(this.voiceFilter);
      this.yangOsc.connect(this.voiceFilter);
      this.voiceFilter.connect(this.voiceGain);
      this.voiceGain.connect(this.masterGain);
      this.yinOsc.start();
      this.yangOsc.start();

      const noise = this.createNoise();
      const breathFilter = this.ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.setValueAtTime(500, t);
      breathFilter.Q.setValueAtTime(1.2, t);
      this.breathGain = this.ctx.createGain();
      this.breathGain.gain.setValueAtTime(0.001, t);
      noise.connect(breathFilter);
      breathFilter.connect(this.breathGain);
      this.breathGain.connect(this.masterGain);

      this.initialized = true;
    } catch (err) {
      this.ctx = null;
      this.initialized = false;
    }
  }

  createNoise() {
    const size = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : MASTER_LEVEL, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  update(time, f, isPlaying) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (!isPlaying) {
      this.voiceGain.gain.setTargetAtTime(0.001, now, 0.2);
      this.breathGain.gain.setTargetAtTime(0.001, now, 0.2);
      return;
    }
    const strain = f.strain || 0;

    if (f.ruptured) {
      this.voiceGain.gain.setTargetAtTime(0.2, now, 0.15);
      this.yinOsc.frequency.setTargetAtTime(38 + Math.sin(time * 3) * 6, now, 0.1);
      this.yangOsc.frequency.setTargetAtTime(41 + Math.sin(time * 4) * 6, now, 0.1);
      this.voiceFilter.frequency.setTargetAtTime(120, now, 0.1);
      this.breathGain.gain.setTargetAtTime(0.1, now, 0.2);
      return;
    }

    const movement = f.movement === undefined ? 4 : f.movement;
    const baseHz = PENTATONIC_BASE_HZ[movement % PENTATONIC_BASE_HZ.length];
    const v = voiceFrequencies(baseHz, f.imbalance || 0);
    this.yinOsc.frequency.setTargetAtTime(v.yin, now, 0.4);
    this.yangOsc.frequency.setTargetAtTime(v.yang, now, 0.4);

    const presence = movement === 0 ? 0.2 : 1; // Wuji is near silence
    this.voiceGain.gain.setTargetAtTime((0.07 + 0.07 * (1 - strain)) * presence, now, 0.3);
    this.voiceFilter.frequency.setTargetAtTime(260 + (1 - strain) * 340, now, 0.3);
    this.breathGain.gain.setTargetAtTime(movement === 0 ? 0.06 : 0.025 + strain * 0.05, now, 0.4);
  }

  tone(freq, gain, seconds, type = 'sine') {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + seconds + 0.05);
  }

  // one struck bowl: used for the Taiji split and when a reversal completes
  playBowl(baseHz) {
    const root = baseHz * 4;
    [[1, 0.1], [2.76, 0.05], [5.4, 0.025]].forEach(([ratio, gain]) => this.tone(root * ratio, gain, 5));
  }

  playSeasonChime(movement) {
    const base = PENTATONIC_BASE_HZ[movement % PENTATONIC_BASE_HZ.length];
    this.tone(base * 3, 0.06, 3);
  }

  playRupture() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 1.6);
    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 1.9);
  }
}

export const sound = new InkAudio();
```

- [ ] **Step 5: Run to verify pass**

Run: `node --test tests/tuning.test.js tests/audio.test.js`
Expected: 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tuning.js audio.js tests/tuning.test.js tests/audio.test.js
git commit -m "feat(audio): pentatonic voices where balance is a perfect fifth"
```

---

### Task 8: Interface shell (HTML, CSS, app wiring)

**Files:**
- Rewrite: `index.html`, `style.css`, `app.js`

**Interfaces:**
- Consumes: everything above. DOM ids used by `app.js` are exactly those in `index.html` below.
- Produces: working page at `index.html` (served over HTTP) with Contemplate/Study, Journey/Practice, five dots, Wu Wei practice controls.

- [ ] **Step 1: Replace `index.html`**

```html
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b0a09">
  <meta name="description" content="رحلة تأمّلية في الين واليانج: من اللاقطب إلى العودة، مستندة إلى النصوص الكلاسيكية.">
  <title>الين واليانج — رحلة</title>
  <link rel="stylesheet" href="fonts.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="world" role="img" aria-label="الين واليانج: لوحة حبر متحركة"></canvas>

  <header class="bar">
    <span class="mark" aria-hidden="true">陰陽</span>
    <span class="spacer"></span>
    <div class="seg" role="group" aria-label="طريقة العرض">
      <button id="view-contemplate" type="button" aria-pressed="true">تأمّل</button>
      <button id="view-study" type="button" aria-pressed="false">دراسة</button>
    </div>
    <div class="seg" role="group" aria-label="الوضع">
      <button id="mode-journey" type="button" aria-pressed="true">الرحلة</button>
      <button id="mode-practice" type="button" aria-pressed="false">الممارسة</button>
    </div>
    <button id="sound-toggle" class="plain" type="button" aria-pressed="false">الصوت</button>
  </header>

  <nav id="dots" class="dots" aria-label="الحركات الخمس">
    <button type="button" class="dot" data-index="0" aria-label="اللاقطب"></button>
    <button type="button" class="dot" data-index="1" aria-label="القطب الأعظم"></button>
    <button type="button" class="dot" data-index="2" aria-label="الصورتان والصور الأربع"></button>
    <button type="button" class="dot" data-index="3" aria-label="الانقلاب"></button>
    <button type="button" class="dot" data-index="4" aria-label="العودة"></button>
  </nav>

  <aside id="study" class="study" hidden>
    <h2 id="st-title"></h2>
    <div id="st-passages"></div>
    <p class="state"><span id="st-phase"></span> · <span id="st-hex"></span></p>
  </aside>

  <section id="practice" class="practice" hidden>
    <label>
      <span>الين</span>
      <input id="slider-yin" type="range" min="0" max="30" step="0.5" value="12" dir="ltr">
    </label>
    <label>
      <span>اليانغ</span>
      <input id="slider-yang" type="range" min="0" max="30" step="0.5" value="12" dir="ltr">
    </label>
    <label class="check">
      <input id="toggle-wuwei" type="checkbox">
      <span>無為 — اترك اليدين</span>
    </label>
    <button id="btn-reset" class="plain" type="button">العودة إلى الاتزان</button>
  </section>

  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace `style.css`**

```css
:root {
  --ground: #0b0a09;
  --paper: #ece6d8;
  --ink: #14110f;
  --gold: #b8975a;
  --cinnabar: #a63d2f;
  --muted: rgba(236, 230, 216, 0.62);
  --line: rgba(236, 230, 216, 0.18);
  --font-zh: 'Ma Shan Zheng', 'KaiTi', 'STKaiti', serif;
  --font-ar: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background: var(--ground);
  color: var(--paper);
  font-family: var(--font-ar);
  overflow: hidden;
}

#world { position: fixed; inset: 0; width: 100%; height: 100%; display: block; }

.bar {
  position: fixed; top: 0; inset-inline: 0;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
}
.mark { font-family: var(--font-zh); font-size: 22px; color: var(--gold); letter-spacing: 2px; }
.spacer { flex: 1; }

.seg { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
.seg button, .plain {
  background: transparent; color: var(--muted); border: 0;
  padding: 6px 14px; font: inherit; font-size: 15px; cursor: pointer;
  transition: color 0.4s ease, background 0.4s ease;
}
.plain { border: 1px solid var(--line); border-radius: 999px; }
.seg button[aria-pressed='true'] { color: var(--ground); background: var(--paper); }
.seg button:hover, .plain:hover { color: var(--paper); }
.seg button[aria-pressed='true']:hover { color: var(--ground); }
button:focus-visible, input:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

.dots {
  position: fixed; bottom: 18px; inset-inline: 0;
  display: flex; justify-content: center; gap: 14px;
}
.dot {
  width: 10px; height: 10px; padding: 0; border-radius: 50%;
  border: 1px solid var(--paper); background: transparent; opacity: 0.45;
  cursor: pointer; transition: opacity 0.5s ease, background 0.5s ease;
}
.dot[aria-current='true'] { background: var(--gold); border-color: var(--gold); opacity: 1; }

.study {
  position: fixed; top: 64px; bottom: 56px; inset-inline-end: 16px;
  width: min(340px, calc(100vw - 32px));
  padding: 16px 18px; overflow-y: auto;
  background: rgba(11, 10, 9, 0.72);
  border: 1px solid var(--line); border-radius: 6px;
}
.study[hidden], .practice[hidden] { display: none; }
.study h2 { margin: 0 0 12px; font-weight: 400; font-size: 20px; color: var(--gold); }
.passage { margin: 0 0 18px; }
.passage .zh { font-family: var(--font-zh); font-size: 22px; line-height: 1.5; margin: 0 0 6px; }
.passage .ar { margin: 0 0 6px; font-size: 18px; line-height: 1.7; }
.passage .note { margin: 0 0 6px; font-size: 15px; color: var(--muted); }
.passage cite { display: block; font-size: 13px; color: var(--gold); font-style: normal; }
.passage .tag { font-size: 12px; color: var(--muted); }
.state { margin: 4px 0 0; padding-top: 10px; border-top: 1px solid var(--line); font-size: 16px; color: var(--muted); }

.practice {
  position: fixed; bottom: 48px; inset-inline: 0; margin-inline: auto;
  width: min(520px, calc(100vw - 32px));
  display: grid; gap: 10px; padding: 14px 18px;
  background: rgba(11, 10, 9, 0.72);
  border: 1px solid var(--line); border-radius: 6px;
}
.practice label { display: grid; grid-template-columns: 72px 1fr; align-items: center; gap: 12px; font-size: 17px; }
.practice label.check { grid-template-columns: auto 1fr; }
.practice input[type='range'] { width: 100%; accent-color: var(--gold); }

/* contemplate view: no text panel, only the image and the practice controls */
body.contemplate .study { display: none; }

@media (max-width: 560px) {
  .bar { flex-wrap: wrap; gap: 8px; }
  .study { top: auto; bottom: 48px; max-height: 46vh; inset-inline: 16px; width: auto; }
}

@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: Replace `app.js`**

```js
// app.js - clock, input, Contemplate/Study and Practice. No physics or drawing lives here.
import { createSandboxState, updateSandboxPhysics, disturb, restoreBalance } from './engine.js';
import { MOVEMENTS, MOVEMENT_SECONDS, journeyState } from './journey.js';
import { PASSAGES, FOUR_IMAGES_LABELS } from './texts.js';
import { hexagramFor } from './hexagram.js';
import { renderScene } from './renderer.js';
import { sound } from './audio.js';
import { PENTATONIC_BASE_HZ } from './tuning.js';

const $ = id => document.getElementById(id);
const canvas = $('world');
const ctx = canvas.getContext('2d');
const media = matchMedia('(prefers-reduced-motion: reduce)');

const app = {
  mode: 'journey',         // 'journey' | 'practice'
  view: 'contemplate',     // 'contemplate' | 'study'
  index: 0,
  clock: 0,
  time: 0,
  last: null,
  width: 0,
  height: 0,
  lastSeason: -1,
  lastUi: 0,
  sandbox: createSandboxState(),
  frame: null,
  pointer: { x: 0, y: 0, active: false }
};
const PRACTICE_SCENE = { disc: 1, split: 1, seeds: 1, fourRing: 1, ring: 0, hex: 1, drop: -1, term: 0 };
const PRACTICE_MOVEMENT = 5;

function current() {
  if (app.mode === 'practice') {
    return { frame: app.frame || updateSandboxPhysics(app.sandbox, 0), scene: PRACTICE_SCENE };
  }
  return journeyState(app.index, app.clock);
}

function movementIndex() {
  return app.mode === 'practice' ? PRACTICE_MOVEMENT : app.index;
}

function renderPassages() {
  const host = $('st-passages');
  host.textContent = '';
  const m = movementIndex();
  $('st-title').textContent = m === PRACTICE_MOVEMENT ? 'الممارسة · 無為' : `${MOVEMENTS[m].zh} · ${MOVEMENTS[m].ar}`;
  for (const p of PASSAGES.filter(x => x.movement === m && x.verified)) {
    const box = document.createElement('div');
    box.className = 'passage';
    const parts = [['zh', p.zh], ['ar', p.ar], ['note', p.note]];
    for (const [cls, text] of parts) {
      const el = document.createElement('p');
      el.className = cls;
      el.textContent = text;
      box.appendChild(el);
    }
    const cite = document.createElement('cite');
    cite.textContent = `${p.source.book} — ${p.source.chapter}`;
    box.appendChild(cite);
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'الترجمة: ترجمة المشروع';
    box.appendChild(tag);
    host.appendChild(box);
  }
}

function updateState(frame) {
  const label = FOUR_IMAGES_LABELS[frame.phase];
  const hx = hexagramFor(frame.yin, frame.yang, frame.rate || 0);
  $('st-phase').textContent = `${label.zh} ${label.ar}`;
  $('st-hex').textContent = `${hx.zh} ${hx.ar}`;
}

function updateDots() {
  document.querySelectorAll('.dot').forEach(d => {
    const on = app.mode === 'journey' && Number(d.dataset.index) === app.index;
    d.setAttribute('aria-current', String(on));
  });
}

function applyLayout() {
  document.body.classList.toggle('contemplate', app.view === 'contemplate');
  $('study').hidden = app.view !== 'study';
  $('practice').hidden = app.mode !== 'practice';
  $('view-contemplate').setAttribute('aria-pressed', String(app.view === 'contemplate'));
  $('view-study').setAttribute('aria-pressed', String(app.view === 'study'));
  $('mode-journey').setAttribute('aria-pressed', String(app.mode === 'journey'));
  $('mode-practice').setAttribute('aria-pressed', String(app.mode === 'practice'));
  updateDots();
  renderPassages();
}

function goTo(index) {
  app.index = ((index % MOVEMENTS.length) + MOVEMENTS.length) % MOVEMENTS.length;
  app.clock = 0;
  app.lastSeason = -1;
  sound.playBowl(PENTATONIC_BASE_HZ[app.index % PENTATONIC_BASE_HZ.length]);
  applyLayout();
}

function setMode(mode) {
  app.mode = mode;
  if (mode === 'practice') {
    restoreBalance(app.sandbox);
    app.frame = updateSandboxPhysics(app.sandbox, 0);
    $('slider-yin').value = 12;
    $('slider-yang').value = 12;
    $('toggle-wuwei').checked = false;
    app.sandbox.autoHarmonize = false;
  }
  applyLayout();
}

function setView(view) {
  app.view = view;
  applyLayout();
}

function step(direction) {
  if (app.mode === 'practice') {
    if (direction < 0) { setMode('journey'); goTo(MOVEMENTS.length - 1); }
    return;
  }
  if (direction > 0 && app.index === MOVEMENTS.length - 1 && app.view === 'study') {
    setMode('practice');
    return;
  }
  goTo(app.index + direction);
}

function tick(now) {
  const dt = app.last === null ? 0.016 : Math.min((now - app.last) / 1000, 0.1);
  app.last = now;
  app.time += dt;

  if (app.mode === 'journey') {
    app.clock += dt;
    if (app.clock >= MOVEMENT_SECONDS) {
      if (app.view === 'contemplate') goTo(app.index + 1);
      else app.clock = MOVEMENT_SECONDS - 0.001;
    }
    if (app.index === 4) {
      const season = Math.floor(app.clock / 6);
      if (season !== app.lastSeason) {
        app.lastSeason = season;
        sound.playSeasonChime(app.index);
      }
    }
  } else {
    app.frame = updateSandboxPhysics(app.sandbox, dt);
    if (app.frame.justRuptured) sound.playRupture();
    if (app.frame.justReversed) sound.playBowl(PENTATONIC_BASE_HZ[3]);
  }

  const { frame, scene } = current();
  renderScene({
    ctx, time: app.time, frame, scene,
    width: app.width, height: app.height,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    reduced: media.matches, study: app.view === 'study', pointer: app.pointer
  });
  sound.update(app.time, { ...frame, movement: movementIndex() }, true);

  if (now - app.lastUi > 150) {
    app.lastUi = now;
    updateState(frame);
  }
  app.raf = requestAnimationFrame(tick);
}

function resize() {
  const b = canvas.getBoundingClientRect();
  app.width = b.width;
  app.height = b.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(b.width * dpr));
  canvas.height = Math.max(1, Math.round(b.height * dpr));
}

// --- input ---
document.addEventListener('pointerdown', () => sound.resume(), { once: true });
$('view-contemplate').addEventListener('click', () => setView('contemplate'));
$('view-study').addEventListener('click', () => setView('study'));
$('mode-journey').addEventListener('click', () => { setMode('journey'); goTo(0); });
$('mode-practice').addEventListener('click', () => setMode('practice'));
document.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => {
  if (app.mode !== 'journey') setMode('journey');
  goTo(Number(d.dataset.index));
}));

$('slider-yin').addEventListener('input', e => {
  disturb(app.sandbox);
  app.sandbox.targetYin = Number(e.target.value);
});
$('slider-yang').addEventListener('input', e => {
  disturb(app.sandbox);
  app.sandbox.targetYang = Number(e.target.value);
});
$('toggle-wuwei').addEventListener('change', e => { app.sandbox.autoHarmonize = e.target.checked; });
$('btn-reset').addEventListener('click', () => {
  restoreBalance(app.sandbox);
  $('slider-yin').value = 12;
  $('slider-yang').value = 12;
  $('toggle-wuwei').checked = false;
  app.sandbox.autoHarmonize = false;
});

$('sound-toggle').addEventListener('click', () => {
  sound.resume();
  const muted = sound.toggleMute();
  $('sound-toggle').setAttribute('aria-pressed', String(!muted));
  $('sound-toggle').textContent = muted ? 'الصوت: صامت' : 'الصوت: مفعّل';
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') step(1);   // reading direction is right to left
  if (e.key === 'ArrowRight') step(-1);
});

canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  app.pointer.x = e.clientX - r.left;
  app.pointer.y = e.clientY - r.top;
  app.pointer.active = true;
});
canvas.addEventListener('pointerleave', () => { app.pointer.active = false; });

let paused = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    paused = true;
    cancelAnimationFrame(app.raf);
  } else if (paused) {
    paused = false;
    app.last = null;
    app.raf = requestAnimationFrame(tick);
  }
});

new ResizeObserver(resize).observe(canvas);
window.addEventListener('resize', resize);
resize();
applyLayout();
app.raf = requestAnimationFrame(tick);
```

- [ ] **Step 4: Run all unit tests**

Run: `npm test`
Expected: every test file PASS; no failures (UI files are not imported by tests).

- [ ] **Step 5: Visual smoke check over HTTP**

```bash
cd C:/w/yyu && python -m http.server 8000
```
Open `http://localhost:8000/index.html` in the browser pane. Expected: dark page with a faint circle, an ink drop falling, five dots at the bottom with the first marked gold, no console errors (fonts.css 404 is expected until Task 9). The Study panel shows titles but no passages until Task 10, because only `verified` passages are displayed.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat(ui): ink shell with Contemplate/Study and Practice"
```

---

### Task 9: Embedded fonts and offline bundle

**Files:**
- Create: `tools/subset_fonts.py`, `fonts.css` (generated), `licenses/OFL-MaShanZheng.txt`, `licenses/OFL-Amiri.txt`
- Rewrite: `build_standalone.py`
- Modify: `.gitignore` (add `tools/fonts-src/`)

**Interfaces:**
- Consumes: all non-ASCII characters in `texts.js`, `hexagram.js`, `journey.js`, `index.html`, `app.js`, `renderer.js`.
- Produces: `fonts.css` (two `@font-face` rules with base64 woff2), and `standalone.html`.

- [ ] **Step 1: Install build-time tools and fetch font sources**

```bash
pip install fonttools brotli
mkdir -p tools/fonts-src licenses
curl -L -o tools/fonts-src/MaShanZheng-Regular.ttf https://github.com/google/fonts/raw/main/ofl/mashanzheng/MaShanZheng-Regular.ttf
curl -L -o tools/fonts-src/Amiri-Regular.ttf https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf
curl -L -o licenses/OFL-MaShanZheng.txt https://github.com/google/fonts/raw/main/ofl/mashanzheng/OFL.txt
curl -L -o licenses/OFL-Amiri.txt https://github.com/google/fonts/raw/main/ofl/amiri/OFL.txt
echo "tools/fonts-src/" >> .gitignore
```
Expected: each `.ttf` is > 50 KB and each license file begins with "Copyright". If a URL returns 404, download the same files from fonts.google.com and place them at the same paths; stop and ask the user if neither works.

- [ ] **Step 2: Write `tools/subset_fonts.py`**

```python
# Embed only the glyphs this project uses, as base64 woff2 in fonts.css.
import base64
import os
import sys

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = ['texts.js', 'hexagram.js', 'journey.js', 'index.html', 'app.js', 'renderer.js']
FONTS = {
    'Ma Shan Zheng': os.path.join(ROOT, 'tools', 'fonts-src', 'MaShanZheng-Regular.ttf'),
    'Amiri': os.path.join(ROOT, 'tools', 'fonts-src', 'Amiri-Regular.ttf'),
}


def used_chars():
    chars = set()
    for name in SOURCES:
        with open(os.path.join(ROOT, name), encoding='utf-8') as fh:
            chars.update(c for c in fh.read() if ord(c) > 127)
    return chars


def is_cjk(c):
    return 0x2E80 <= ord(c) <= 0x9FFF or 0xF900 <= ord(c) <= 0xFAFF


def woff2_b64(path, text):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    font = subset.load_font(path, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    tmp = os.path.join(ROOT, 'tools', '_tmp.woff2')
    subset.save_font(font, tmp, opts)
    with open(tmp, 'rb') as fh:
        data = fh.read()
    os.remove(tmp)
    return base64.b64encode(data).decode('ascii')


def main():
    chars = used_chars()
    cjk = ''.join(sorted(c for c in chars if is_cjk(c)))
    other = ''.join(sorted(c for c in chars if not is_cjk(c))) + ' .,:;()-0123456789'
    rules = []
    for family, text in (('Ma Shan Zheng', cjk), ('Amiri', other)):
        b64 = woff2_b64(FONTS[family], text)
        rules.append(
            "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2');"
            "font-display:swap}" % (family, b64)
        )
        print('%s: %d glyph chars, %.1f KB' % (family, len(text), len(b64) * 3 / 4 / 1024))
    with open(os.path.join(ROOT, 'fonts.css'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(rules) + '\n')


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 3: Generate and inspect**

Run: `python tools/subset_fonts.py`
Expected: two lines, each under 150 KB total for both fonts; `fonts.css` exists. Reload `http://localhost:8000/index.html` — the 陰陽 mark renders in brush style.

- [ ] **Step 4: Replace `build_standalone.py`**

```python
# build_standalone.py - bundle modules, styles and font subsets into one offline file
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MODULES = ['engine', 'tuning', 'hexagram', 'texts', 'journey', 'renderer', 'audio', 'app']


def read(name):
    with open(os.path.join(HERE, name), 'r', encoding='utf-8') as fh:
        return fh.read()


def strip_modules(src):
    src = re.sub(r'^import\s[\s\S]*?;\s*$', '', src, flags=re.MULTILINE)
    src = re.sub(r'^export\s+', '', src, flags=re.MULTILINE)
    return src


bundle = '(function () {\n\'use strict\';\n' + '\n'.join(
    '// --- %s ---\n%s' % (m, strip_modules(read(m + '.js'))) for m in MODULES
) + '\n})();\n'

body = re.search(r'<body[^>]*>([\s\S]*?)</body>', read('index.html')).group(1)
body = re.sub(r'<script\s+type="module"\s+src="app\.js"></script>', '', body)

css = read('fonts.css') + '\n' + read('style.css')

html = f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b0a09">
  <meta name="description" content="رحلة تأمّلية في الين واليانج: من اللاقطب إلى العودة، مستندة إلى النصوص الكلاسيكية.">
  <title>الين واليانج — رحلة</title>
  <style>
{css}
  </style>
</head>
<body>
{body}
  <script>
{bundle}
  </script>
</body>
</html>
'''

with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tmp:
    tmp.write(bundle)
check = subprocess.run(['node', '--check', tmp.name], capture_output=True, text=True)
os.remove(tmp.name)
if check.returncode != 0:
    sys.exit('Bundle failed syntax check (duplicate top-level names?):\n' + check.stderr)

with open(os.path.join(HERE, 'standalone.html'), 'w', encoding='utf-8') as fh:
    fh.write(html)
print('standalone.html built, %d KB' % (len(html.encode('utf-8')) // 1024))
```

- [ ] **Step 5: Build and verify**

Run: `python build_standalone.py`
Expected: `standalone.html built, <N> KB` with no syntax-check error. If it fails with an "already declared" message, rename the duplicate top-level identifier in the later module (all modules share one scope in the bundle), rerun, and make sure `npm test` still passes.
Open `file:///C:/w/yyu/standalone.html` in the browser pane with the network disabled (or just open it): page renders identically to the HTTP version, no console errors.

- [ ] **Step 6: Commit**

```bash
git add tools/subset_fonts.py fonts.css licenses build_standalone.py standalone.html .gitignore
git commit -m "build: embed font subsets and bundle an offline standalone page"
```

---

### Task 10: Verification pass (quotes, visuals, accessibility)

**Files:**
- Modify: `texts.js` (set `verified: true` only for checked passages), spec appendix.

**Interfaces:** none new. This task enforces the release gate.

- [ ] **Step 1: Verify every Chinese line against a public edition**

For each of the 8 passages in `texts.js`, open the Chinese Text Project (ctext.org) or Wikisource and compare the Chinese characters exactly with a public-domain edition:
- 太極圖說 (Zhou Dunyi): lines `無極而太極` and `太極動而生陽，動極而靜，靜而生陰，靜極復動`
- 易經 繫辭上: chapter 11 (`易有太極…`) and chapter 5 (`一陰一陽之謂道`)
- 黃帝內經 素問 陰陽應象大論: `重陰必陽，重陽必陰`
- 道德經 ch. 37, 40, 42: `無為而無不為`, `反者道之動`, `萬物負陰而抱陽`

Record each as: passage id, edition used, URL, result (match / corrected). If a line differs, correct `zh` to the edition's text; if the attribution cannot be confirmed, **delete that passage** (and its movement must still keep at least one, or the unit test will fail).

- [ ] **Step 2: Mark verified passages and append the verification table to the spec**

Set `verified: true` for each checked passage in `texts.js`. Append the table to `docs/superpowers/specs/2026-10-14-yin-yang-journey-design.md` under a new heading `## 11. Verification record`.

Run: `npm run check:quotes`
Expected: `All N passages verified.` (exit code 0).

- [ ] **Step 3: Visual checks (browser pane, `http://localhost:8000/index.html`)**

For each item take a screenshot and note pass/fail:
1. Contemplate, movements 1–5 (click each dot): no text, circle and mist visible, no console errors.
2. Study on each movement: passage panel shows Chinese, Arabic, note, source and "ترجمة المشروع"; four-images labels visible on movements 3–5.
3. Practice: set sliders to 22 / 6 and wait ≈ 10 s — colors begin to trade places; set 26 / 26 — circle cracks apart with cinnabar lines; press reset — heals.
4. Resize to phone width (375 × 812): no horizontal scroll, Study panel docks at the bottom, controls reachable.
5. Emulate reduced motion (`prefers-reduced-motion: reduce`): no breathing or drifting mist.
6. Block `fonts.css` in devtools: text falls back to system serif and Chinese still renders.

- [ ] **Step 4: Offline and sound checks**

1. Open `standalone.html` from disk with the network off — renders and runs.
2. No sound before first tap; after the first tap the sound button reads "الصوت: مفعّل"; pressing it again mutes.
3. In Practice, drag yin to 30 and yang to 3: a slow beating between the two voices is audible, and it resolves when you press reset.

- [ ] **Step 5: Final test run and commit**

Run: `npm test && npm run check:quotes`
Expected: all green.

```bash
git add texts.js docs
git commit -m "docs: verification record; mark checked passages verified"
```

---

### Task 11: README and delivery preparation

**Files:**
- Rewrite: `README.md`

- [ ] **Step 1: Rewrite `README.md`** with these sections (Arabic first, short English summary under each heading): what the piece is; the five movements; Contemplate vs Study; Practice and Wu Wei; sources table (book, chapter) and the "project translation" note; how to run (`launch.bat`, `python -m http.server`), `npm test`, `python tools/subset_fonts.py && python build_standalone.py`; font licenses (SIL OFL, files in `licenses/`); structure table from this plan's File Structure.

- [ ] **Step 2: Rebuild the bundle so it matches the final sources**

Run: `python build_standalone.py && npm test && npm run check:quotes`
Expected: success, all green.

- [ ] **Step 3: Commit locally**

```bash
git add README.md standalone.html
git commit -m "docs: update README for the journey"
```

- [ ] **Step 4: STOP — ask the user for delivery approval**

Show the user, in chat: the branch name, `git log --oneline origin/main..HEAD`, `git diff --stat origin/main..HEAD`, and the draft PR title and description below. **Do not fork, push or open anything until they say yes.**

Draft PR title: `Add a five-movement Yin-Yang journey (ink visuals, sourced passages, Wu Wei practice)`

Draft PR body must contain: what changed and why (reversal instead of rupture; Contemplate/Study; Four Images; hexagram; solar-term ring); that classical passages were verified against public editions with the record in the spec; that Arabic renderings are labeled project translations; that fonts are SIL OFL subsets with licenses included; how to run and test; that the owner is free to decline or cherry-pick; ending with the line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 5: After explicit approval only — fork, push, open the pull request**

```bash
gh repo fork abdoabdo22334456-prog/yin-yang-ultra --clone=false --remote=false
git remote add fork https://github.com/SamDozer/yin-yang-ultra.git
git push -u fork feature/yin-yang-journey
gh pr create --repo abdoabdo22334456-prog/yin-yang-ultra --base main --head SamDozer:feature/yin-yang-journey --title "<approved title>" --body-file <approved body file>
```
Expected: PR URL printed. Then call the PR tools (`get_status`, `bind_pr`) and report the URL to the user.

---

## Self-Review Notes

- **Spec coverage:** visual language → Tasks 6, 8; five movements → Task 5 + Task 6; engine changes (reversal, rupture split, phase, hexagram) → Tasks 2, 3; sound → Task 7; text and integrity rules → Tasks 4, 10; code structure → File Structure; error handling → Tasks 2, 6, 7 and the Task 10 checks; testing → every task plus Task 10; delivery → Task 11.
- **Spec refinement:** the spec's "total divided into six bands" is implemented as yang-share bands that produce the twelve sovereign hexagrams (Kun, Fu, Lin, Tai, Da Zhuang, Guai, Qian, Gou, Dun, Pi, Guan, Bo), so only twelve names and meanings are needed, and each is a real traditional pairing with the twelve months and the 24-term ring.
- **Spec refinement:** `returnFrame` replaces the old explosion cycle for the Return movement, so imbalance never ends in an explosion there either; the old `createModel`/`motion.js` code is removed.
- **Type consistency:** frame fields (`yin, yang, total, imbalance, strain, speed, angle, phase, rate, reversal, justReversed, ruptured, ruptureAge, justRuptured`) and scene fields (`disc, split, seeds, fourRing, ring, hex, drop, term`) are used identically in `engine.js`, `journey.js`, `renderer.js`, `audio.js`, `app.js`.
- **Known risk:** the bundle concatenates modules into one scope; duplicate top-level names are caught by the `node --check` step in `build_standalone.py`.
