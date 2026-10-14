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
