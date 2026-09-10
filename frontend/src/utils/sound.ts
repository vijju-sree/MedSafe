// Web Audio API Sound Synthesis Service
// Provides zero-dependency, zero-network-latency hospital alert and medication reminder sounds

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (!this.isUnlocked) {
          this.initContext();
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(() => {
              this.isUnlocked = true;
            }).catch(() => {});
          } else if (this.audioCtx) {
            this.isUnlocked = true;
          }
        }
      };

      // Listen for first interaction to unlock Web Audio API in modern browsers
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (e) {
        console.warn('Web Audio API not supported on this browser:', e);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private lastReminderTime: number = 0;
  private lastNotificationTime: number = 0;
  private playedScheduleIds: Set<string> = new Set();

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  /**
   * Plays medication reminder chime strictly ONCE per schedule ID.
   * If already played for this schedule, it will NOT play again.
   */
  public playReminderChimeForSchedule(scheduleId: string): boolean {
    if (!this.soundEnabled || !scheduleId) return false;
    if (this.playedScheduleIds.has(scheduleId)) {
      return false; // Guaranteed single playback per schedule occurrence
    }
    this.playedScheduleIds.add(scheduleId);
    this.playReminderChime();
    return true;
  }

  public resetPlayedSchedule(scheduleId: string): void {
    this.playedScheduleIds.delete(scheduleId);
  }

  /**
   * Medication Reminder Chime:
   * Single, pleasant 4-note ascending hospital reminder chime.
   * E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz) -> E6 (1318Hz).
   * Total duration ~0.8s. Plays ONCE and stops cleanly.
   */
  public playReminderChime() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastReminderTime < 2000) return; // Debounce rapid concurrent firings
    this.lastReminderTime = nowMs;

    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => this.executeReminderChime(ctx)).catch(() => {});
    } else {
      this.executeReminderChime(ctx);
    }
  }

  private executeReminderChime(ctx: AudioContext) {
    const now = ctx.currentTime;
    // Single 4-note sequence, stops after ~0.85s
    const notes = [
      { freq: 659.25, time: 0.00, dur: 0.16, vol: 0.35 },
      { freq: 830.61, time: 0.14, dur: 0.16, vol: 0.38 },
      { freq: 987.77, time: 0.28, dur: 0.20, vol: 0.40 },
      { freq: 1318.51, time: 0.42, dur: 0.40, vol: 0.45 }
    ];

    notes.forEach((n) => {
      this.playTone(ctx, n.freq, now + n.time, n.dur, 'sine', n.vol);
    });
  }

  /**
   * Safety Warning Alert:
   * Missed dose or clinical drug interaction alert sound.
   */
  public playWarningSound() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => this.executeWarning(ctx)).catch(() => {});
    } else {
      this.executeWarning(ctx);
    }
  }

  private executeWarning(ctx: AudioContext) {
    const now = ctx.currentTime;
    this.playTone(ctx, 466.16, now + 0.00, 0.20, 'triangle', 0.45);
    this.playTone(ctx, 369.99, now + 0.22, 0.35, 'triangle', 0.40);
    this.playTone(ctx, 466.16, now + 0.65, 0.20, 'triangle', 0.45);
    this.playTone(ctx, 369.99, now + 0.87, 0.45, 'triangle', 0.40);
  }

  /**
   * Dose Taken Success Chime:
   * Gentle, cheerful ascending major triad.
   */
  public playSuccessSound() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => this.executeSuccess(ctx)).catch(() => {});
    } else {
      this.executeSuccess(ctx);
    }
  }

  private executeSuccess(ctx: AudioContext) {
    const now = ctx.currentTime;
    this.playTone(ctx, 523.25, now + 0.00, 0.15, 'sine', 0.35); // C5
    this.playTone(ctx, 659.25, now + 0.12, 0.15, 'sine', 0.40); // E5
    this.playTone(ctx, 783.99, now + 0.24, 0.45, 'sine', 0.45); // G5
  }

  /**
   * Notification Ping:
   * Quick gentle chime.
   */
  public playNotificationPing() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastNotificationTime < 1500) return;
    this.lastNotificationTime = nowMs;

    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => this.playTone(ctx, 880, ctx.currentTime, 0.18, 'sine', 0.3)).catch(() => {});
    } else {
      this.playTone(ctx, 880, ctx.currentTime, 0.18, 'sine', 0.3);
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    peakVolume: number = 0.35
  ) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack and natural bell-like exponential decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.08);
    } catch (err) {
      console.warn('playTone error:', err);
    }
  }
}

export const soundService = new SoundService();
