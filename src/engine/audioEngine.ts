const BASE = import.meta.env.BASE_URL;

export const TRACKS = [
  { src: `${BASE}track01.mp3`, name: 'Track 01' },
  { src: `${BASE}track02.mp3`, name: 'Track 02' },
  { src: `${BASE}track03.mp3`, name: 'Track 03' },
  { src: `${BASE}track04.mp3`, name: 'Track 04' },
  { src: `${BASE}track05.mp3`, name: 'Track 05' },
  { src: `${BASE}track06.mp3`, name: 'Track 06' },
];

export interface AudioSnapshot {
  playing: boolean;
  trackIdx: number;
  ready: boolean;
}

type Listener = () => void;

class AudioEngine {
  private audio: HTMLAudioElement;
  private _trackIdx = 0;
  private _playing = false;
  private _ready = false;
  private listeners = new Set<Listener>();
  private _snapshot: AudioSnapshot;

  constructor() {
    this._snapshot = { playing: false, trackIdx: 0, ready: false };

    this.audio = new Audio();
    this.audio.loop = false;
    this.audio.volume = 0.4;
    this.audio.src = TRACKS[0].src;

    this.audio.addEventListener('canplaythrough', () => {
      this._ready = true;
      this.updateSnapshot();
    });

    this.audio.addEventListener('ended', () => {
      this.next();
    });
  }

  get snapshot() { return this._snapshot; }

  togglePlay() {
    if (this._playing) {
      this.audio.pause();
      this._playing = false;
    } else {
      this.audio.play().then(() => {
        this._playing = true;
        this.updateSnapshot();
      }).catch(() => {});
    }
    this.updateSnapshot();
  }

  next() {
    this._trackIdx = (this._trackIdx + 1) % TRACKS.length;
    this.audio.src = TRACKS[this._trackIdx].src;
    if (this._playing) {
      this.audio.play().catch(() => {});
    }
    this.updateSnapshot();
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  getSnapshot = (): AudioSnapshot => {
    return this._snapshot;
  };

  private updateSnapshot() {
    this._snapshot = {
      playing: this._playing,
      trackIdx: this._trackIdx,
      ready: this._ready,
    };
    this.listeners.forEach((fn) => fn());
  }
}

// Singleton — lives for the entire app lifetime
export const audioEngine = new AudioEngine();
