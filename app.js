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
