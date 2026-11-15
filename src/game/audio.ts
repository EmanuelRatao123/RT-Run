class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.14,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const pitchJitter = 0.96 + Math.random() * 0.08;
    osc.frequency.setValueAtTime(freqStart * pitchJitter, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd * pitchJitter),
      now + duration
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playStart() {
    this.tone(330, 440, 0.12, 'triangle', 0.14, 0);
    this.tone(440, 660, 0.16, 'triangle', 0.14, 0.08);
    this.tone(660, 880, 0.22, 'sine', 0.16, 0.16);
  }

  playLaneSwitch() {
    this.tone(240, 380, 0.075, 'sine', 0.09);
  }

  playJump() {
    this.tone(220, 560, 0.16, 'triangle', 0.13);
  }

  playSlide() {
    this.tone(320, 110, 0.14, 'sawtooth', 0.07);
  }

  playLand() {
    this.tone(110, 45, 0.09, 'sine', 0.11);
  }

  playCoin(noCoinJustLocked: boolean) {
    this.tone(987.77, 1318.5, 0.11, 'sine', 0.14, 0);
    if (noCoinJustLocked) {
      // Distinct warning lock sound so player hears No Coin timer stopped!
      this.tone(523.25, 392.0, 0.18, 'triangle', 0.15, 0.06);
      this.tone(392.0, 261.63, 0.24, 'sawtooth', 0.09, 0.16);
    }
  }

  playCrash() {
    this.tone(160, 35, 0.34, 'sawtooth', 0.22, 0);
    this.tone(95, 28, 0.4, 'square', 0.16, 0.02);
  }
}

export const soundEngine = new SoundEngine();
