export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private ambientNodes: AudioNode[] = [];
  private masterGain!: GainNode;

  init(): void {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);
    this.startAmbient();
  }

  private ensure(): AudioContext | null {
    if (!this.ctx) return null;
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.6;
    }
  }

  isMuted(): boolean { return this.muted; }

  private startAmbient(): void {
    const ac = this.ensure();
    if (!ac) return;

    // Low cave drone
    const drone = ac.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const droneGain = ac.createGain();
    droneGain.gain.value = 0.06;
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();

    // Rumble noise
    const bufLen = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const noiseFilter = ac.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 120;
    const noiseGain = ac.createGain();
    noiseGain.gain.value = 0.12;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    this.ambientNodes = [drone, noise];
  }

  playJump(): void {
    const ac = this.ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(180, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.18, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(ac.currentTime + 0.15);
  }

  playFire(): void {
    const ac = this.ensure();
    if (!ac) return;
    const bufLen = ac.sampleRate * 0.12;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const t = i / bufLen;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.5;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filt = ac.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 800;
    filt.Q.value = 2;
    const g = ac.createGain();
    g.gain.value = 0.3;
    src.connect(filt); filt.connect(g); g.connect(this.masterGain);
    src.start();
  }

  playHit(): void {
    const ac = this.ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.18);
    g.gain.setValueAtTime(0.3, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(ac.currentTime + 0.22);
  }

  playDeath(): void {
    const ac = this.ensure();
    if (!ac) return;
    for (let i = 0; i < 3; i++) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sawtooth";
      const t0 = ac.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(200 - i * 40, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.3);
      g.gain.setValueAtTime(0.25, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t0); osc.stop(t0 + 0.4);
    }
  }

  playTreasure(): void {
    const ac = this.ensure();
    if (!ac) return;
    const freqs = [660, 880, 1100];
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      const t0 = ac.currentTime + i * 0.06;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t0); osc.stop(t0 + 0.3);
    });
  }

  playBuy(): void {
    const ac = this.ensure();
    if (!ac) return;
    const freqs = [440, 550, 660, 880];
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "triangle";
      const t0 = ac.currentTime + i * 0.07;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t0); osc.stop(t0 + 0.25);
    });
  }

  playDebrisWarn(): void {
    const ac = this.ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(60, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.3);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(ac.currentTime + 0.45);
  }

  playDebrisImpact(): void {
    const ac = this.ensure();
    if (!ac) return;
    const bufLen = Math.floor(ac.sampleRate * 0.25);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const t = i / bufLen;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * 0.8;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 300;
    const g = ac.createGain();
    g.gain.value = 0.5;
    src.connect(filt); filt.connect(g); g.connect(this.masterGain);
    src.start();
  }

  playCompanionScream(): void {
    const ac = this.ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600, ac.currentTime);
    osc.frequency.setValueAtTime(700, ac.currentTime + 0.05);
    osc.frequency.setValueAtTime(500, ac.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.5);
    g.gain.setValueAtTime(0.2, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
    const filt = ac.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1200;
    filt.Q.value = 3;
    osc.connect(filt); filt.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(ac.currentTime + 0.6);
  }

  playEnemyDie(): void {
    const ac = this.ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(300, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.2);
    g.gain.setValueAtTime(0.15, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(ac.currentTime + 0.25);
  }

  playCheckpoint(): void {
    const ac = this.ensure();
    if (!ac) return;
    [330, 440, 660].forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "triangle";
      const t0 = ac.currentTime + i * 0.1;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.1, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t0); osc.stop(t0 + 0.35);
    });
  }

  playLevelComplete(): void {
    const ac = this.ensure();
    if (!ac) return;
    [262, 330, 392, 523].forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "triangle";
      const t0 = ac.currentTime + i * 0.12;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t0); osc.stop(t0 + 0.55);
    });
  }

  scheduleDrip(delayMs: number): void {
    const ac = this.ensure();
    if (!ac) return;
    const t0 = ac.currentTime + delayMs / 1000;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t0);
    osc.frequency.exponentialRampToValueAtTime(600, t0 + 0.08);
    g.gain.setValueAtTime(0.07, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(t0); osc.stop(t0 + 0.15);
  }
}
