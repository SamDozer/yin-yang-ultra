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
