const BASE = import.meta.env.BASE_URL;

export const TRACKS = [
  { src: `${BASE}track01.mp3`, name: 'Track 01' },
  { src: `${BASE}track02.mp3`, name: 'Track 02' },
  { src: `${BASE}track03.mp3`, name: 'Track 03' },
  { src: `${BASE}track04.mp3`, name: 'Track 04' },
];

type Listener = () => void;

class AudioEngine {
  private audio: HTMLAudioElement;
  private _trackIdx = 0;
  private _playing = false;
  private _ready = false;
  private listeners = new Set<Listener>();

  constructor() {
    this.audio = new Audio();
    this.audio.loop = false;
    this.audio.volume = 0.4;
    this.audio.src = TRACKS[0].src;

    this.audio.addEventListener('canplaythrough', () => {
      this._ready = true;
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      this.next();
    });
  }

  get playing() { return this._playing; }
  get trackIdx() { return this._trackIdx; }
  get ready() { return this._ready; }

  togglePlay() {
    if (this._playing) {
      this.audio.pause();
      this._playing = false;
    } else {
      this.audio.play().then(() => {
        this._playing = true;
        this.notify();
      }).catch(() => {});
    }
    this.notify();
  }

  next() {
    this._trackIdx = (this._trackIdx + 1) % TRACKS.length;
    this.audio.src = TRACKS[this._trackIdx].src;
    if (this._playing) {
      this.audio.play().catch(() => {});
    }
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

// Singleton — lives for the entire app lifetime
export const audioEngine = new AudioEngine();
