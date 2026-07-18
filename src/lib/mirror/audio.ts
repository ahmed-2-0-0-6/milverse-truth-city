// MILVERSE — tiny WebAudio sound-design helpers. Mutable.
// One shared AudioContext; created lazily on first user gesture.
//
// THE SOUND OF THE CITY: every cue below is a designed member of a single
// synth palette (A-tuned: 220/440/880Hz family). Peak gains ≤ 0.09.
// Every envelope ends at 0.0001 via exponential ramp — no clicks, no
// runaway tails, and mute silences every cue instantly.

let ctx: AudioContext | null = null;
let muted = false;
let soundIntroSeenFlag = false;
let pendingIntroRequested = false;

const MUTE_KEY = "milverse.muted";
const INTRO_KEY = "milverse.soundIntro";
const MUTE_KEY_EVER_SEEN = "milverse.muted.everSet";

if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* ignore */
  }
  try {
    soundIntroSeenFlag = localStorage.getItem(INTRO_KEY) === "1";
    // If the player has ever touched mute before this ships, treat the intro
    // as already acknowledged — never show the consent chip.
    if (!soundIntroSeenFlag) {
      const muteEverSet =
        localStorage.getItem(MUTE_KEY) !== null ||
        localStorage.getItem(MUTE_KEY_EVER_SEEN) === "1";
      if (muteEverSet) {
        soundIntroSeenFlag = true;
        localStorage.setItem(INTRO_KEY, "1");
      }
    }
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  return muted;
}
export function setMuted(m: boolean) {
  muted = m;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      localStorage.setItem(MUTE_KEY_EVER_SEEN, "1");
    } catch {
      /* ignore */
    }
    if (muted) {
      // Kill anything currently ringing — no lingering timers or sources.
      stopRing();
    }
    window.dispatchEvent(new Event("milverse:mute"));
  }
}

export function soundIntroSeen(): boolean {
  return soundIntroSeenFlag;
}
export function markSoundIntroSeen() {
  soundIntroSeenFlag = true;
  pendingIntroRequested = false;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}

/**
 * Central gate for every NEW cue. Returns true only when audio should
 * actually play right now. When the player hasn't seen the intro chip
 * yet, we swallow the cue and dispatch a request so the chip appears.
 */
function guard(): boolean {
  if (typeof window === "undefined") return false;
  if (!soundIntroSeenFlag) {
    if (!pendingIntroRequested) {
      pendingIntroRequested = true;
      try {
        window.dispatchEvent(new Event("milverse:soundintro:request"));
      } catch {
        /* ignore */
      }
    }
    return false;
  }
  return !muted;
}

export function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/* ── Legacy cues (predate The Sound of the City; still in use) ──────── */

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
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.08);
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
  const buf = c.createBuffer(
    1,
    Math.max(1, Math.floor((durationMs / 1000) * c.sampleRate)),
    c.sampleRate,
  );
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
        src.stop(c.currentTime + whenSec);
      } catch {
        /* ignore */
      }
    },
  };
}

/* ── THE SOUND OF THE CITY ─────────────────────────────────────────────
 * All cues below are one synth family. Peak gains ≤ 0.09.
 * ──────────────────────────────────────────────────────────────────── */

/** Tiny noise buffer, one-shot. Used for percussive cues (stamp, paper). */
function noiseBuffer(c: AudioContext, ms: number): AudioBuffer {
  const len = Math.max(1, Math.floor((ms / 1000) * c.sampleRate));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** THE signature. Rubber stamp hitting a desk. */
export function stampSlam() {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

  // Percussive noise transient.
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 60);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  const nFilt = c.createBiquadFilter();
  nFilt.type = "lowpass";
  nFilt.frequency.value = 400;
  src.connect(nFilt).connect(ng).connect(c.destination);
  src.start(t);

  // Sub drop — 220 → 55 Hz over 180ms.
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  osc.connect(og).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

/** 300ms after slam. Small clean resolution or a dull regret thud. */
export function stampSting(kind: "win" | "loss") {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

  if (kind === "win") {
    // Two sines, 440 then 660 Hz, 120ms each, gain 0.05.
    const notes = [
      { f: 440, at: 0 },
      { f: 660, at: 0.12 },
    ];
    for (const n of notes) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(n.f, t + n.at);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + n.at);
      g.gain.exponentialRampToValueAtTime(0.05, t + n.at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.at + 0.12);
      o.connect(g).connect(c.destination);
      o.start(t + n.at);
      o.stop(t + n.at + 0.14);
    }
  } else {
    // 196 Hz triangle, 350ms, gain 0.05 with slow 4Hz tremolo.
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(196, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    // Tremolo — LFO on the gain.
    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(4, t);
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start(t);
    lfo.stop(t + 0.36);

    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.36);
  }
}

/** Inbox toast lands. Fingernail on glass. */
export function arrivalTap() {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(880, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.04, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.06);
}

/** Morning Edition card lands. Soft and papery. */
export function paperThud() {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 90);
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t);
}

/* ── The Missed Call ring ────────────────────────────────────────────── */

interface RingHandle {
  timer: number;
  stopped: boolean;
}
let currentRing: RingHandle | null = null;

function scheduleRingPulse(c: AudioContext) {
  const t = c.currentTime;
  const freqs = [440, 554]; // A + C#
  for (const f of freqs) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.42);
  }
}

/** Two-tone gentle pulse; a phone in another room. Returns a stop handle
 * mirror of startAmbience — but the module also tracks the handle so mute
 * or a fresh ringPulse() call kills any active ring. */
export function ringPulse(): { stop: () => void } | null {
  if (!guard()) return null;
  const c = getCtx();
  if (!c) return null;
  // Kill any prior ring first — never let two run at once.
  stopRing();

  const handle: RingHandle = { timer: 0, stopped: false };

  const tick = () => {
    if (handle.stopped) return;
    if (muted) {
      stopRing();
      return;
    }
    scheduleRingPulse(c);
  };
  // First pulse immediately, then every 1.6s (400ms on + 1.2s off).
  tick();
  handle.timer = window.setInterval(tick, 1600);
  currentRing = handle;
  return {
    stop: () => stopRing(),
  };
}

export function stopRing() {
  if (currentRing) {
    currentRing.stopped = true;
    try {
      window.clearInterval(currentRing.timer);
    } catch {
      /* ignore */
    }
    currentRing = null;
  }
}

/** Ascending sine arpeggio for a streak beat. n = streak count. */
export function streakLick(n: number) {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const notes = Math.min(3 + Math.floor(n / 7), 6);
  const t = c.currentTime;
  const step = 0.055;
  for (let i = 0; i < notes; i++) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(440 + i * 110, t + i * step);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + i * step);
    g.gain.exponentialRampToValueAtTime(0.05, t + i * step + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * step + step);
    o.connect(g).connect(c.destination);
    o.start(t + i * step);
    o.stop(t + i * step + step + 0.02);
  }
}

/** Ceremonial rank-up chord + tail. Still quiet. */
export function rankRise() {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [220, 330, 440];
  const noteMs = 0.1;
  const overlap = 0.04;
  for (let i = 0; i < notes.length; i++) {
    const start = t + i * (noteMs - overlap);
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(notes[i], start);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.06, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + noteMs);
    o.connect(g).connect(c.destination);
    o.start(start);
    o.stop(start + noteMs + 0.02);
  }
  // Fading 440Hz tail.
  const tailStart = t + notes.length * (noteMs - overlap);
  const tail = c.createOscillator();
  tail.type = "sine";
  tail.frequency.setValueAtTime(440, tailStart);
  const tg = c.createGain();
  tg.gain.setValueAtTime(0.0001, tailStart);
  tg.gain.exponentialRampToValueAtTime(0.05, tailStart + 0.02);
  tg.gain.exponentialRampToValueAtTime(0.0001, tailStart + 0.5);
  tail.connect(tg).connect(c.destination);
  tail.start(tailStart);
  tail.stop(tailStart + 0.55);
}

/** One soft pulse when the Claimed Clock crosses under 60s. */
export function clockTense() {
  if (!guard()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(330, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.035, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.09);
}
