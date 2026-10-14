// audio.js - محرك المؤثرات الصوتية الإجرائية الفضائية (Web Audio API)
class CosmicAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    this.masterGain = null;
    
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;
    this.droneGain = null;

    this.strainOsc = null;
    this.strainFilter = null;
    this.strainGain = null;

    this.swirlGain = null;
    this.swirlFilter = null;
    this.noiseNode = null;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Cosmic Drone (نغمة الكون العميقة)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc2.type = 'triangle';
    this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);
    this.droneOsc2.frequency.setValueAtTime(55.4, this.ctx.currentTime);

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // 2. Swirl / Energy Wind
    this.noiseNode = this.createNoiseBufferNode();
    this.swirlFilter = this.ctx.createBiquadFilter();
    this.swirlFilter.type = 'bandpass';
    this.swirlFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.swirlFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.swirlGain = this.ctx.createGain();
    this.swirlGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    if (this.noiseNode) {
      this.noiseNode.connect(this.swirlFilter);
      this.swirlFilter.connect(this.swirlGain);
      this.swirlGain.connect(this.masterGain);
    }

    // 3. Strain / Tension Sparkler
    this.strainOsc = this.ctx.createOscillator();
    this.strainOsc.type = 'sawtooth';
    this.strainOsc.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.strainFilter = this.ctx.createBiquadFilter();
    this.strainFilter.type = 'bandpass';
    this.strainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.strainFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

    this.strainGain = this.ctx.createGain();
    this.strainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.strainOsc.connect(this.strainFilter);
    this.strainFilter.connect(this.strainGain);
    this.strainGain.connect(this.masterGain);

    this.strainOsc.start();

    this.initialized = true;
  }

  createNoiseBufferNode() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start();
    return whiteNoise;
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (!this.masterGain || !this.ctx) return this.isMuted;
    const target = this.isMuted ? 0 : 0.38;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    return this.isMuted;
  }

  update(time, f, isPlaying) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended' && isPlaying) this.ctx.resume();

    const now = this.ctx.currentTime;
    if (!isPlaying) {
      this.droneGain.gain.setTargetAtTime(0.001, now, 0.1);
      this.swirlGain.gain.setTargetAtTime(0.001, now, 0.1);
      this.strainGain.gain.setTargetAtTime(0.0001, now, 0.1);
      return;
    }

    const spinSpeed = f.speed !== null && f.speed !== undefined ? f.speed : 1.0;
    const strain = f.strain || 0;

    // نمط المختبر التفاعلي المستقر: الصوت يتغير مع الإجهاد والطاقة مباشرة
    if (f.ruptured !== undefined) {
      if (f.ruptured) {
        // صوت تمزق مستمر: drone عميق مشوه + strain عالي جداً
        this.droneGain.gain.setTargetAtTime(0.3, now, 0.15);
        this.droneFilter.frequency.setTargetAtTime(60 + Math.sin(time * 6) * 30, now, 0.05);
        this.droneOsc1.frequency.setTargetAtTime(35 + Math.sin(time * 3) * 8, now, 0.05);
        this.swirlGain.gain.setTargetAtTime(0.18, now, 0.1);
        this.swirlFilter.frequency.setTargetAtTime(200 + Math.sin(time * 11) * 100, now, 0.05);
        this.strainGain.gain.setTargetAtTime(0.2, now, 0.05);
        this.strainFilter.frequency.setTargetAtTime(400 + Math.sin(time * 7) * 200, now, 0.05);
        this.strainOsc.frequency.setTargetAtTime(60 + Math.sin(time * 5) * 30, now, 0.05);
        return;
      }

      // نغمة تتوازن مع حالة الطاقة الحية
      const harmony = 1.0 - strain;
      const droneFreq = 55 + harmony * 22; // أعلى عند الاتزان
      this.droneOsc1.frequency.setTargetAtTime(droneFreq, now, 0.15);
      // التوازن خامسة تامة (3:2)؛ والاختلال يُبعد النغمة قليلاً فيتولد تنافر وارتجاج
      this.droneOsc2.frequency.setTargetAtTime(droneFreq * 1.5 * (1 + strain * 0.026), now, 0.15);

      this.droneGain.gain.setTargetAtTime(0.12 + harmony * 0.12 + strain * 0.08, now, 0.1);
      this.droneFilter.frequency.setTargetAtTime(120 + harmony * 200 + strain * 180, now, 0.1);

      this.swirlGain.gain.setTargetAtTime(0.04 + spinSpeed * 0.07, now, 0.1);
      this.swirlFilter.frequency.setTargetAtTime(300 + spinSpeed * 200 + harmony * 100, now, 0.1);
      this.swirlFilter.Q.setTargetAtTime(4.0 - strain * 2, now, 0.1);

      if (strain > 0.12) {
        const strainVolume = Math.min(0.3, (strain - 0.12) * 0.4);
        this.strainGain.gain.setTargetAtTime(strainVolume, now, 0.05);
        this.strainFilter.frequency.setTargetAtTime(600 + strain * 1400, now, 0.05);
        this.strainOsc.frequency.setTargetAtTime(90 + strain * 280, now, 0.05);
      } else {
        this.strainGain.gain.setTargetAtTime(0.0001, now, 0.15);
      }
      return;
    }

    // نمط الدورة الكونية الأبدية (كما كان سابقاً)
    if (time < 6.0) {
      const p = time / 6.0;
      this.droneGain.gain.setTargetAtTime(0.08 + p * 0.12, now, 0.1);
      this.droneFilter.frequency.setTargetAtTime(120 + p * 180, now, 0.1);
      this.swirlGain.gain.setTargetAtTime(0.03 + p * 0.06, now, 0.1);
      this.swirlFilter.frequency.setTargetAtTime(250 + p * 300, now, 0.1);
      this.strainGain.gain.setTargetAtTime(0.0001, now, 0.1);
    } else if (time < 9.0) {
      const p = (time - 6.0) / 3.0;
      this.droneGain.gain.setTargetAtTime(0.2 + p * 0.15, now, 0.08);
      this.droneFilter.frequency.setTargetAtTime(300 + p * 200, now, 0.08);
      this.swirlGain.gain.setTargetAtTime(0.09 + p * 0.08, now, 0.08);
      this.strainGain.gain.setTargetAtTime(0.0001, now, 0.1);
    } else {
      const isPostDissolve = f.broken !== null && (time - 9) > f.broken + 2.5;

      if (isPostDissolve) {
        this.droneGain.gain.setTargetAtTime(0.22, now, 0.2);
        this.droneFilter.frequency.setTargetAtTime(105, now, 0.2);
        this.swirlGain.gain.setTargetAtTime(0.015, now, 0.2);
        this.strainGain.gain.setTargetAtTime(0.0001, now, 0.1);
        return;
      }

      this.droneGain.gain.setTargetAtTime(0.18 + strain * 0.1, now, 0.1);
      this.droneFilter.frequency.setTargetAtTime(180 + spinSpeed * 160 + strain * 250, now, 0.1);
      
      this.swirlGain.gain.setTargetAtTime(0.05 + spinSpeed * 0.08, now, 0.1);
      this.swirlFilter.frequency.setTargetAtTime(350 + spinSpeed * 250, now, 0.1);

      if (strain > 0.15) {
        const strainVolume = Math.min(0.25, (strain - 0.15) * 0.35);
        this.strainGain.gain.setTargetAtTime(strainVolume, now, 0.05);
        this.strainFilter.frequency.setTargetAtTime(700 + strain * 1200, now, 0.05);
        this.strainOsc.frequency.setTargetAtTime(110 + strain * 220, now, 0.05);
      } else {
        this.strainGain.gain.setTargetAtTime(0.0001, now, 0.1);
      }
    }
  }

  // رنين اكتمال الاندماج الأبدي في الثانية 9
  playCelestialMerge() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const freqs = [216, 432, 648, 864, 1296];
    const gains = [0.22, 0.18, 0.10, 0.06, 0.03];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.995, now + 4.0);

      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 4.0);
    });

    this.playBassDrop(60, 28, 2.5, 0.28);
  }

  // صوت الانفجار الكوني الهائل عند تمزق وانفصال الكتلتين (Cosmic Rupture Explosion)
  playCosmicExplosion() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Sub-bass Mega Boom (انفجار الساب-باس العميق)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(24, now + 1.8);

    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 2.1);

    // 2. High-Impact Noise Explosion (دوي الانفجار والشرخ الناري)
    const bufferSize = this.ctx.sampleRate * 2.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(4800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 2.2);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.95, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 2.4);

    // 3. Electrical Shatter Crunch (صوت التمزق والشرارة الكبرى)
    const distOsc = this.ctx.createOscillator();
    const distGain = this.ctx.createGain();
    distOsc.type = 'sawtooth';
    distOsc.frequency.setValueAtTime(450, now);
    distOsc.frequency.exponentialRampToValueAtTime(30, now + 0.65);

    distGain.gain.setValueAtTime(0.45, now);
    distGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    distOsc.connect(distGain);
    distGain.connect(this.masterGain);
    distOsc.start(now);
    distOsc.stop(now + 0.75);
  }

  // صوت الولادة الكونية والتجمع التلقائي الجديد
  playCosmicRebirth() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [108, 216, 432, 648];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startTime = now + idx * 0.1;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 2.0);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 2.1);
    });
  }

  playBassDrop(startFreq = 80, endFreq = 25, duration = 1.8, volume = 0.25) {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playElectricZap() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(5.0, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const sound = new CosmicAudioEngine();
