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
