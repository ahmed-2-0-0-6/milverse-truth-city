// MILVERSE — voice-note playback via browser SpeechSynthesis + WebAudio artifact overlays.
// The "forgery" artifact is subtle by design: a small tell layered on top of the synth.

import type { ArtifactKind } from "./scenarios";
import { getCtx, glitch, startAmbience, isMuted } from "./audio";

/** Rough estimated duration in seconds — used to size the waveform + schedule artifacts. */
export function estimateDuration(text: string): number {
  const words = Math.max(1, text.split(/\s+/).length);
  // ~2.6 words/sec conversational
  return Math.max(2.5, words / 2.6);
}

/** Deterministic pseudo-waveform bar heights (0..1) derived from text hash. */
export function waveformBars(text: string, count = 36): number[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    const v = (h % 1000) / 1000;
    // Shape it — small edges, fuller middle
    const shape = 0.35 + 0.65 * Math.sin((i / count) * Math.PI);
    bars.push(0.15 + v * shape * 0.85);
  }
  return bars;
}

export type SpeakerGender = "male" | "female" | "neutral";

/** Infer gender from a persona name + voice description. Best-effort heuristic. */
export function inferGender(name?: string, voiceDesc?: string): SpeakerGender {
  const hay = `${name ?? ""} ${voiceDesc ?? ""}`.toLowerCase();
  // Explicit voice-description signals win.
  if (
    /\b(male|man|guy|boy|bhai|uncle|sir|father|dad|brother|husband|boyfriend|him|his|he\b)\b/.test(
      hay,
    )
  )
    return "male";
  if (
    /\b(female|woman|girl|lady|aunty|apa|baji|mother|mom|sister|wife|girlfriend|her|she\b)\b/.test(
      hay,
    )
  )
    return "female";
  // Name-based fallback: common South-Asian + Western male/female first names.
  const first = (name ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const male = [
    "ali",
    "ahmed",
    "ahmad",
    "hassan",
    "hussain",
    "usman",
    "bilal",
    "omar",
    "umar",
    "asad",
    "faisal",
    "fahad",
    "imran",
    "kamran",
    "rehan",
    "salman",
    "zain",
    "zayan",
    "hamza",
    "haris",
    "danish",
    "junaid",
    "waqas",
    "adnan",
    "arsalan",
    "tariq",
    "kashif",
    "noman",
    "raza",
    "saad",
    "talha",
    "yasir",
    "abdul",
    "mohammed",
    "muhammad",
    "syed",
    "waleed",
    "adam",
    "noah",
    "liam",
    "james",
    "john",
    "david",
    "michael",
    "daniel",
    "chris",
    "tom",
    "alex",
    "ben",
    "sam",
    "jake",
    "ryan",
    "mark",
    "paul",
    "peter",
    "brian",
    "kevin",
    "steve",
    "richard",
    "robert",
    "thomas",
    "william",
  ];
  const female = [
    "ayesha",
    "aisha",
    "fatima",
    "hira",
    "sana",
    "sara",
    "sarah",
    "zara",
    "zainab",
    "mariam",
    "maryam",
    "noor",
    "nida",
    "amna",
    "laiba",
    "iqra",
    "kiran",
    "rabia",
    "saima",
    "nadia",
    "farah",
    "zoya",
    "hina",
    "huma",
    "sadia",
    "tania",
    "mahnoor",
    "rida",
    "emma",
    "olivia",
    "ava",
    "sophia",
    "isabella",
    "mia",
    "charlotte",
    "amelia",
    "lily",
    "chloe",
    "hannah",
    "grace",
    "zoe",
    "anna",
    "kate",
    "laura",
    "emily",
    "sarah",
    "rachel",
    "jessica",
    "ashley",
  ];
  if (male.includes(first)) return "male";
  if (female.includes(first)) return "female";
  return "neutral";
}

/** Pick a voice matching the desired gender, English preferred. */
function pickVoice(gender: SpeakerGender = "neutral"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  const maleRe =
    /male|david|daniel|alex|fred|mark|thomas|tom|george|oliver|arthur|ravi|rishi|aaron/i;
  const femaleRe =
    /female|samantha|karen|serena|zira|susan|victoria|allison|ava|kate|tessa|veena|rishi|monica|isha/i;
  const enRe = /en[-_]?(us|gb|in|au)/i;

  if (gender === "male") {
    return (
      voices.find((v) => enRe.test(v.lang) && maleRe.test(v.name) && !/female/i.test(v.name)) ||
      voices.find((v) => maleRe.test(v.name) && !/female/i.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang)) ||
      voices[0]
    );
  }
  if (gender === "female") {
    return (
      voices.find((v) => enRe.test(v.lang) && femaleRe.test(v.name)) ||
      voices.find((v) => femaleRe.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang)) ||
      voices[0]
    );
  }
  return (
    voices.find((v) => enRe.test(v.lang)) || voices.find((v) => /en/i.test(v.lang)) || voices[0]
  );
}

export interface PlaybackHandle {
  cancel: () => void;
  onProgress: (cb: (t: number) => void) => void;
  duration: number;
}

/**
 * Speak a voice note. If artifact != null, layer a subtle audible tell.
 * Returns a handle for progress tracking + cancel.
 */
export function playVoiceNote(
  text: string,
  artifact: ArtifactKind | null,
  artifactPos = 0.5,
  gender: SpeakerGender = "neutral",
): PlaybackHandle {
  const duration = estimateDuration(text);
  const listeners: ((t: number) => void)[] = [];
  let cancelled = false;

  const emit = (t: number) => listeners.forEach((l) => l(t));

  // Fake progress ticker (SpeechSynthesis events are unreliable across browsers).
  const startMs = performance.now();
  let raf = 0;
  const tickProgress = () => {
    if (cancelled) return;
    const elapsed = (performance.now() - startMs) / 1000;
    emit(Math.min(1, elapsed / duration));
    if (elapsed < duration + 0.3) raf = requestAnimationFrame(tickProgress);
  };
  raf = requestAnimationFrame(tickProgress);

  // Fallback beeper if SpeechSynthesis is unavailable — plays a benign tone
  const speakOrBeep = () => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      // just tone through the duration
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.value = 220;
      g.gain.value = isMuted() ? 0 : 0.04;
      osc.connect(g).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    const v = pickVoice(gender);

    // Artifact: "pause" splits utterance in two with a long silence between.
    if (artifact === "pause") {
      const words = text.split(" ");
      const splitAt = Math.floor(words.length * artifactPos);
      const a = words.slice(0, splitAt).join(" ");
      const b = words.slice(splitAt).join(" ");
      const u1 = new SpeechSynthesisUtterance(a);
      const u2 = new SpeechSynthesisUtterance(b);
      if (v) {
        u1.voice = v;
        u2.voice = v;
      }
      u1.rate = 1.0;
      u2.rate = 1.0;
      if (isMuted()) {
        u1.volume = 0;
        u2.volume = 0;
      }
      u1.onend = () => {
        if (cancelled) return;
        setTimeout(() => {
          if (!cancelled) synth.speak(u2);
        }, 900);
      };
      synth.speak(u1);
      return;
    }

    // Artifact: "robotic" — a slower, lower-pitch monotone stretch at the artifact position.
    if (artifact === "robotic") {
      const words = text.split(" ");
      const at = Math.floor(words.length * artifactPos);
      const before = words.slice(0, at).join(" ");
      const roboWord = words.slice(at, at + 3).join(" ");
      const after = words.slice(at + 3).join(" ");
      const parts = [before, roboWord, after].filter(Boolean);
      parts.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        if (v) u.voice = v;
        if (i === 1) {
          u.rate = 0.72;
          u.pitch = 0.55;
        } else {
          u.rate = 1.0;
          u.pitch = 1.0;
        }
        if (isMuted()) u.volume = 0;
        synth.speak(u);
      });
      return;
    }

    // Default utterance for glitch / cut / clean
    const u = new SpeechSynthesisUtterance(text);
    if (v) u.voice = v;
    u.rate = 1.0;
    u.pitch = 1.0;
    if (isMuted()) u.volume = 0;
    synth.speak(u);
  };

  speakOrBeep();

  // Schedule audio-only artifacts (glitch/cut) via WebAudio at artifactPos.
  const artifactMs = duration * 1000 * artifactPos;
  if (artifact === "glitch") {
    setTimeout(() => {
      if (!cancelled) glitch(50 + Math.random() * 40, 0.05);
    }, artifactMs);
  } else if (artifact === "cut") {
    const amb = startAmbience();
    if (amb) {
      setTimeout(() => {
        if (!cancelled) amb.stop();
      }, artifactMs);
      // Also stop when playback ends.
      setTimeout(() => amb.stop(), (duration + 0.5) * 1000);
    }
  }

  return {
    duration,
    onProgress: (cb) => listeners.push(cb),
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
  };
}

export function ARTIFACT_LABEL(a: ArtifactKind | null): string {
  if (!a) return "None — the recording was clean.";
  return {
    pause: "Unnatural mid-sentence pause",
    robotic: "Flat, robotic emphasis on a phrase",
    glitch: "Faint audio glitch mid-note",
    cut: "Background ambience cut abruptly",
  }[a];
}
