// renderer.js - ink-on-night drawing of one frame + scene (Canvas 2D, no dependencies)
import { clamp, smooth } from './engine.js';
import { hexagramFor } from './hexagram.js';
import { FOUR_IMAGES_LABELS } from './texts.js';

const TWO_PI = Math.PI * 2;
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
    ctx.arc(x, y, size * 2.4, 0, TWO_PI);
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
    const a = -Math.PI / 2 + (i / 24) * TWO_PI;
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
    ctx.arc(0, y, 3.5, 0, TWO_PI);
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
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBody(ctx, f, scene, time, reduced) {
  const breathe = reduced ? 1 : 1 + 0.015 * Math.sin((time * TWO_PI) / 12);
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
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.fill();

  if (k > 0.001) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
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
    ctx.arc(shift, (-r * k) / 2, yangSeed, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = rgba(PALETTE.ink, 0.95);
    ctx.beginPath();
    ctx.arc(shift, (r * k) / 2, yinSeed, 0, TWO_PI);
    ctx.fill();
  }

  const strokeAlpha = clamp(scene.disc);
  brush(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TWO_PI); }, edge, 1.8 + f.strain * 1.4, 0.8, strokeAlpha);
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
    ctx.arc(0, 0, r * (1.08 + 0.12 * pulse), 0, TWO_PI);
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
    const a = (i / 7) * TWO_PI + Math.sin(i * 2.7) * 0.3;
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
    ctx.arc(x, y, 9, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.restore();
}
