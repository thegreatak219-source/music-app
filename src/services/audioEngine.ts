export class AudioEngine {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isSynthesizing: boolean = false;
  private synthInterval: number | null = null;
  private onTimeUpdateCallback: ((currentTime: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback source failed, falling back to harmonic synth:', e);
      this.startHarmonicSynthFallback();
      if (this.onErrorCallback) {
        this.onErrorCallback('Streaming source unavailable. Switched to synthesized audio stream.');
      }
    });
  }

  setCallbacks({
    onTimeUpdate,
    onEnded,
    onError
  }: {
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onError?: (error: string) => void;
  }) {
    if (onTimeUpdate) this.onTimeUpdateCallback = onTimeUpdate;
    if (onEnded) this.onEndedCallback = onEnded;
    if (onError) this.onErrorCallback = onError;
  }

  async loadAndPlay(url: string, startTime: number = 0): Promise<void> {
    this.stopHarmonicSynth();
    try {
      if (this.audio.src !== url) {
        this.audio.src = url;
        this.audio.currentTime = startTime;
      }
      await this.audio.play();
    } catch {
      // Browsers often block autoplay without user gesture or remote host blocked
      this.startHarmonicSynthFallback();
    }
  }

  play() {
    if (this.isSynthesizing) return;
    this.audio.play().catch(() => {
      this.startHarmonicSynthFallback();
    });
  }

  pause() {
    this.audio.pause();
    this.stopHarmonicSynth();
  }

  seek(timeInSec: number) {
    if (this.audio.duration && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.min(this.audio.duration, Math.max(0, timeInSec));
    }
  }

  setVolume(volume0to1: number) {
    this.audio.volume = Math.min(1, Math.max(0, volume0to1));
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration || 0;
  }

  private startHarmonicSynthFallback() {
    if (this.isSynthesizing) return;
    this.isSynthesizing = true;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();
      
      const freqs = [261.63, 329.63, 392.00, 523.25]; // C major chord notes
      let noteIndex = 0;

      this.synthInterval = window.setInterval(() => {
        if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[noteIndex % freqs.length], this.audioCtx.currentTime);
        noteIndex++;

        gain.gain.setValueAtTime(0.06 * this.audio.volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.2);
      }, 900);
    } catch (e) {
      console.warn('Synth fallback initialization error:', e);
    }
  }

  private stopHarmonicSynth() {
    this.isSynthesizing = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

export const audioEngine = new AudioEngine();
