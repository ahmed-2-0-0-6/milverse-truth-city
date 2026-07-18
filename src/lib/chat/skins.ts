// MILVERSE — chat platform skins. Pure presentation: which look-alike app a
// case conversation renders inside the CitizenOS phone. Ground truth, engine
// logic, and scenario content never live here — a skin can never change an
// outcome, only how the surface dresses it.

import type { CSSProperties } from "react";

export type ChatPlatform = "whatsapp" | "instagram" | "sms";

export interface ChatSkin {
  id: ChatPlatform;
  /** Chat scroll-area classes (background). */
  bodyClass: string;
  bodyStyle?: CSSProperties;
  /** Incoming / outgoing bubble classes. */
  inBubble: string;
  outBubble: string;
  /** Under-bubble meta: how receipts read on this platform. */
  receiptStyle: "ticks" | "seen" | "delivered";
  readColor: string; // tailwind text class for the read state
  /** Header chrome. */
  headerClass: string;
  presenceLine?: string; // e.g. "Active now" (insta), "Text Message · SMS"
  avatarRing?: boolean; // insta story ring
  /** Composer. */
  placeholder: string;
  /** Optional system pill at the top of the conversation. */
  systemNote?: string;
}

export const CHAT_SKINS: Record<ChatPlatform, ChatSkin> = {
  whatsapp: {
    id: "whatsapp",
    bodyClass: "",
    bodyStyle: {
      backgroundColor: "#0b141a",
      backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1.2px)",
      backgroundSize: "22px 22px",
    },
    inBubble: "bg-[#202c33] text-white rounded-lg rounded-tl-none",
    outBubble: "bg-[#005c4b] text-white rounded-lg rounded-tr-none",
    receiptStyle: "ticks",
    readColor: "text-[#53bdeb]",
    headerClass: "bg-[#202c33]",
    placeholder: "Message",
    systemNote: "Messages and calls are end-to-end encrypted.",
  },
  instagram: {
    id: "instagram",
    bodyClass: "bg-black",
    inBubble: "bg-[#262626] text-white rounded-3xl rounded-bl-md",
    outBubble: "bg-[#3797f0] text-white rounded-3xl rounded-br-md",
    receiptStyle: "seen",
    readColor: "text-white/50",
    headerClass: "bg-black",
    presenceLine: "Active now",
    avatarRing: true,
    placeholder: "Message…",
  },
  sms: {
    id: "sms",
    bodyClass: "bg-black",
    inBubble: "bg-[#26252a] text-white rounded-2xl rounded-bl-md",
    outBubble: "bg-[#0a84ff] text-white rounded-2xl rounded-br-md",
    receiptStyle: "delivered",
    readColor: "text-white/45",
    headerClass: "bg-neutral-950",
    presenceLine: "Text Message · SMS",
    placeholder: "Text message",
    systemNote: "Sender is not in your contacts. SMS has no identity check.",
  },
};

/**
 * Which platform each case conversation renders in. Presentation judgment
 * only — chosen for where this kind of traffic actually arrives in Pakistan:
 * bank/prize/txn blasts land as SMS, school-age contacts live in DMs,
 * everything else is the family-and-strangers messenger.
 */
const CASE_PLATFORM: Record<string, ChatPlatform> = {
  // SMS lane
  "pk-prize-sms": "sms",
  "pk-wrong-txn": "sms",
  "t3-fraud-dept": "sms",
  "t3-real-bank": "sms",
  "survivor-bankfraud": "sms",
  // DM lane
  "classmate-danish": "instagram",
  "t4-ghost-friend": "instagram",
};

export function platformForCase(caseId: string): ChatPlatform {
  return CASE_PLATFORM[caseId] ?? "whatsapp";
}

export function skinForCase(caseId: string): ChatSkin {
  return CHAT_SKINS[platformForCase(caseId)];
}

/** Under-bubble receipt text for a player message on this skin. */
export function receiptFor(
  skin: ChatSkin,
  read: boolean,
  stamp: string,
): { text: string; showTicks: boolean } {
  if (skin.receiptStyle === "seen") {
    return { text: read ? "Seen" : stamp, showTicks: false };
  }
  if (skin.receiptStyle === "delivered") {
    return { text: read ? `Delivered · ${stamp}` : stamp, showTicks: false };
  }
  return { text: stamp, showTicks: true };
}
