// MILVERSE — tiny WebAudio sound-design helpers. Mutable.
// One shared AudioContext; created lazily on first user gesture.

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = "milverse.muted";

if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch { /* ignore */ }
}

export function isMuted(): boolean { return muted; }
export function setMuted(m: boolean) {
  muted = m;
  if (typeof window !== "undefined") {
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch { /* ignore */ }
    window.dispatchEvent(new Event("milverse:mute"));
  }
}

export function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!AC) return null;
      ctx = new AC();
    } catch { return null; }
  }
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Very short soft tick — for meter changes. */
export function tick() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

/** Low tension cue — for critical meter thresholds. */
export function tensionCue() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.9);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  const biq = c.createBiquadFilter();
  biq.type = "lowpass";
  biq.frequency.value = 300;
  osc.connect(biq).connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 1);
}

/** Short noise burst — used as a "glitch" artifact overlay during a voice note. */
export function glitch(durationMs = 60, gain = 0.06) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const buf = c.createBuffer(1, Math.max(1, Math.floor((durationMs / 1000) * c.sampleRate)), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g).connect(c.destination);
  src.start(t);
}

/** Low-amplitude looping room-tone that can be stopped abruptly for a "cut" artifact. */
export function startAmbience(): { stop: (whenSec?: number) => void } | null {
  if (muted) return null;
  const c = getCtx();
  if (!c) return null;
  const t = c.currentTime;
  const bufLen = c.sampleRate * 1;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const g = c.createGain();
  g.gain.value = 0.04;
  const biq = c.createBiquadFilter();
  biq.type = "bandpass";
  biq.frequency.value = 500;
  biq.Q.value = 0.7;
  src.connect(biq).connect(g).connect(c.destination);
  src.start(t);
  return {
    stop(whenSec = 0) {
      try {
        // Sharp cut — no fade — that's the artifact.
        src.stop(c.currentTime + whenSec);
      } catch { /* ignore */ }
    },
  };
}
