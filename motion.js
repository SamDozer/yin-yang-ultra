// motion.js - الحسابات الهندسية ومسارات الجزيئات واللولبيات الكونية المستمرة
import { clamp, soften, formationState, FORMATION, EXPLODE_TIME, DURATION } from './engine.js';

export const TAU = Math.PI * 2;
const integral = v => {
  const p = clamp(v);
  return p ** 6 - 3 * p ** 5 + 2.5 * p ** 4;
};

export const JOIN_ANGLE = 0.65 + 7.3 * 0.65 * 0.5;

export function joinAngle(t) {
  return 0.65 * soften((t - 6) / 3) + 7.3 * 0.65 * integral((t - 8.35) / 0.65);
}

export const rotate = (x, y, a) => ({
  x: x * Math.cos(a) - y * Math.sin(a),
  y: x * Math.sin(a) + y * Math.cos(a)
});

export const radiusOf = f => 36 * Math.sqrt(Math.max(0.1, f.total) / 24);
export const visualShift = f => clamp((f.yin - f.yang) / Math.max(0.1, f.total) * 1.15, -0.62, 0.62) * radiusOf(f);

// حساب نقاط الفصوص (Lobe Points) أثناء التكوّن
export function lobePoints(t, side, count = 240) {
  const s = formationState(t);
  const m = soften((t - 6) / 3);
  const r = 5 + (36 / Math.sqrt(2) - 5) * Math.sqrt(s.gather);
  const sign = side ? -1 : 1;
  const points = [];

  for (let i = 0; i < count; i++) {
    const q = i / count;
    let tx, ty;
    if (q <= 0.5) {
      const a = -Math.PI / 2 - q * TAU;
      tx = 36 * Math.cos(a);
      ty = 36 * Math.sin(a);
    } else if (q <= 0.75) {
      const a = Math.PI / 2 + (q - 0.5) * 4 * Math.PI;
      tx = 18 * Math.cos(a);
      ty = 18 + 18 * Math.sin(a);
    } else {
      const a = Math.PI / 2 - (q - 0.75) * 4 * Math.PI;
      tx = 18 * Math.cos(a);
      ty = -18 + 18 * Math.sin(a);
    }

    const a = -Math.PI / 2 - TAU * q;
    const wave = Math.sin(q * 20 + t * 4) * (1 - m) * 0.6;
    const currentR = r + wave;

    points.push({
      x: sign * ((-74 + currentR * Math.cos(a)) * (1 - m) + tx * m),
      y: sign * (currentR * Math.sin(a) * (1 - m) + ty * m)
    });
  }
  return points;
}

// حساب انفصال وتفكك الفصوص لحظة الانفجار الكبير (Explosive Rupture & Unmerging)
export function dissolvingLobePoints(side, breakAge, count = 200) {
  const unmerge = soften(clamp(breakAge / 2.6));
  const sign = side ? -1 : 1;

  // الكتلتان تنفصلان وتتباعدان بقوة الانفجار
  const sepDist = unmerge * 95;
  const shrinkScale = Math.max(0.01, (1 - unmerge * 0.96));
  const baseR = 36 * shrinkScale;
  const points = [];

  for (let i = 0; i < count; i++) {
    const q = i / count;
    let tx, ty;
    if (q <= 0.5) {
      const a = -Math.PI / 2 - q * TAU;
      tx = baseR * Math.cos(a);
      ty = baseR * Math.sin(a);
    } else if (q <= 0.75) {
      const a = Math.PI / 2 + (q - 0.5) * 4 * Math.PI;
      tx = (baseR / 2) * Math.cos(a);
      ty = (baseR / 2) + (baseR / 2) * Math.sin(a);
    } else {
      const a = Math.PI / 2 - (q - 0.75) * 4 * Math.PI;
      tx = (baseR / 2) * Math.cos(a);
      ty = -(baseR / 2) + (baseR / 2) * Math.sin(a);
    }

    const tear = Math.sin(q * 18 + breakAge * 9) * unmerge * 8;
    points.push({
      x: sign * (-sepDist + tx + tear),
      y: sign * (ty + tear)
    });
  }
  return { points, sepDist, unmerge, shrinkScale, bodyAlpha: Math.max(0, 1 - unmerge * 1.1) };
}

// موقع البذرتين المتجدد دائماً مع كل دورة
export function seedPosition(t, side) {
  const sign = side ? -1 : 1;

  if (t < FORMATION) {
    const m = soften((t - 6) / 3);
    return {
      x: sign * -74 * (1 - m),
      y: sign * -18 * m,
      r: 5.2 - 1.25 * m,
      alpha: 1.0
    };
  } else if (t < EXPLODE_TIME) {
    return {
      x: 0,
      y: sign * -18,
      r: 4.2,
      alpha: 1.0
    };
  } else if (t < 17.5) {
    // تتلاشى أثناء الانفجار
    const unmerge = soften((t - EXPLODE_TIME) / 2.6);
    return {
      x: sign * (-74 * unmerge),
      y: sign * -18,
      r: 4.2 * (1 - unmerge),
      alpha: Math.max(0, 1 - unmerge)
    };
  } else {
    // تبدأ البذرتان الجديدتان في التوهج والظهور بسلاسة من سكون الفضاء (19.5s - 24.0s)
    const rebirthProg = clamp((t - 19.5) / 3.5);
    const alpha = soften(rebirthProg);
    return {
      x: sign * -74,
      y: 0,
      r: 5.2 * alpha,
      alpha
    };
  }
}

// جزيئات الدورة الكونية اللانهائية المستمرة (Continuous Cyclic Particles)
// تنطلق من الانفجار، تتمدد للخارج، ثم تستدير بنعومة وتتجاذب لتبدأ التجمع من جديد بلا انقطاع!
export function cyclicCosmicParticle(t, i) {
  const side = i % 2;
  const k = Math.floor(i / 2);
  const sign = side ? -1 : 1;
  const maxCosmicDist = 55 + (k % 8) * 11 + (k % 4) * 8; // أقصى مدى لانتشار الجزيء

  // 1. مرحلة التجمع للداخل (0s - 6s)
  if (t < 6.0) {
    const end = 1.2 + k * 0.095;
    const start = Math.max(0, end - 1.6);
    const p = soften(clamp((t - start) / (end - start)));
    const seed = seedPosition(t, side);
    const a = k * 2.399963 + side * Math.PI + p * 4.2 + Math.sin(k + t * 3) * 0.2;
    const d = maxCosmicDist * (1 - p);

    return {
      x: seed.x + Math.cos(a) * d,
      y: seed.y + Math.sin(a) * d,
      r: (1.5 + (k % 3) * 0.4) * (1 - soften((p - 0.82) / 0.18)),
      alpha: 0.35 + 0.65 * p,
      glow: 0.5 + 0.5 * p,
      type: side ? 'yang' : 'yin'
    };
  }

  // 2. مرحلة الاندماج والاتزان (6s - 13.5s)
  if (t < EXPLODE_TIME) {
    return null; // تكون الجزيئات مدمجة داخل جسد الين واليانج
  }

  // 3. مرحلة الانفجار والتشتت للخارج (13.5s - 18.5s)
  const explodeAge = t - EXPLODE_TIME;
  if (explodeAge < 5.0) {
    const startLag = (k % 25) * 0.035;
    if (explodeAge < startLag) return null;

    const p = soften(clamp((explodeAge - startLag) / 2.6));
    const unmergeDist = soften(clamp(explodeAge / 2.6)) * 85;
    const originX = sign * -unmergeDist;

    const angle = k * 2.399963 + side * Math.PI - p * 3.8 + Math.sin(k + t * 2.2) * 0.25;
    const d = 8 + maxCosmicDist * 1.5 * p;

    const x = originX * (1 - p * 0.5) + Math.cos(angle) * d;
    const y = Math.sin(angle) * d;

    return {
      x,
      y,
      r: (1.8 + (k % 4) * 0.5) * (0.5 + 0.5 * (1 - soften((p - 0.85) / 0.15))),
      alpha: Math.min(1, 0.4 + 0.6 * Math.sin(p * Math.PI * 0.95)),
      glow: 1.8 * (1 - p * 0.3),
      type: side ? 'yang' : 'yin'
    };
  }

  // 4. مرحلة الاستدارة والتجاذب التلقائي لبدء التجمع من جديد (18.5s - 24.0s)
  // هنا تتباطأ الجزيئات وتبدأ بجذب بعضها نحو البذرتين الجديدتين بسلاسة مطلقة
  const returnProg = soften(clamp((t - 18.5) / 5.5));
  const newSeed = seedPosition(t, side);

  // تنتقل الجزيئات بانسيابية ناعمة من أقصى انتشار كوني نحو مدارات التجمع
  const orbitAngle = k * 2.399963 + side * Math.PI + returnProg * 2.5 + Math.sin(k + t * 2) * 0.2;
  const currentDist = maxCosmicDist * (1.5 - returnProg * 0.5); // تتراجع للمدار الأولي

  const x = newSeed.x * returnProg + Math.cos(orbitAngle) * currentDist;
  const y = Math.sin(orbitAngle) * currentDist;

  return {
    x,
    y,
    r: 1.5 + (k % 3) * 0.4,
    alpha: 0.4 + 0.5 * returnProg,
    glow: 0.8 + 0.6 * returnProg,
    type: side ? 'yang' : 'yin'
  };
}

export function isDark(x, y, r, shift) {
  const cy = y < 0 ? -r / 2 : r / 2;
  const span = Math.sqrt(Math.max(0, (r / 2) ** 2 - (y - cy) ** 2));
  return x <= shift + (y < 0 ? span : -span);
}

export function decorateModel(model) {
  model.incoming = [];
  return model;
}
