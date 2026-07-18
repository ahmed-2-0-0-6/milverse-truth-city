// Shared scripted-drill data used by /quick-tour and the first-visit
// "First Call" onboarding overlay. Zero AI, zero cloud, hand-authored.
//
// This file is the single source of truth for the Sana imposter drill
// text. Do not edit wording here without matching the /quick-tour and
// FirstCall render sites — but both sites import from here, so as long
// as the array/interface shape is preserved the wording will stay in sync
// automatically.

export interface Scripted {
  from: "contact" | "player" | "system";
  text: string;
  tip?: string;
  meter?: number;
  isTell?: boolean;
}

export const MIRROR_SCRIPT: Scripted[] = [
  { from: "system", text: "THE MIRROR · personal deception" },
  {
    from: "contact",
    text: "Hi — it's Sana. Lost my phone, this is a temp number. Small urgent favor?",
    meter: 90,
    tip: "New number + urgency + a favor. Your real Sana calls after hours, not texts.",
  },
  { from: "player", text: "Wait — what was your old number's last 4 digits?" },
  {
    from: "contact",
    text: "temp SIM. don't call the old one, it's bricked.",
    meter: 78,
    isTell: true,
    tip: "She DODGED a dossier question. A real Sana says '4472' instantly.",
  },
  { from: "player", text: "Can I call you back through Slack?" },
  {
    from: "contact",
    text: "phone's dying, no time — sms is faster, promise.",
    meter: 65,
    isTell: true,
    tip: "REFUSED out-of-band verification. That's the imposter signature.",
  },
];
