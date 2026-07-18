// Look-alike platform chrome for inbox surfaces. Pure presentation.
import type { InboxPlatform } from "@/lib/inbox/scheduler";

export interface PlatformStyle {
  border: string; // css color
  dot: string; // css color
  glyph: string; // 1-char / short glyph
  label: string;
}

export function platformStyle(p: InboxPlatform): PlatformStyle {
  switch (p) {
    case "whatsapp":
      return { border: "#005c4b", dot: "#25d366", glyph: "◉", label: "Messenger" };
    case "sms":
      return { border: "#0a84ff", dot: "#0a84ff", glyph: "✉", label: "SMS" };
    case "instagram":
      return { border: "#e1306c", dot: "#e1306c", glyph: "◈", label: "DM" };
    case "drop":
      return { border: "oklch(0.82 0.14 195)", dot: "oklch(0.82 0.14 195)", glyph: "★", label: "Aaj ka Forward" };
  }
}
