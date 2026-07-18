import type { ReactNode, CSSProperties } from "react";
import { StatusBar } from "./StatusBar";

interface Props {
  header: ReactNode;
  children: ReactNode;
  composer?: ReactNode;
  /** Rendered floating above content (notifications, sheets, call screens). */
  overlay?: ReactNode;
  className?: string;
  /**
   * ADDITIVE: visual sub-theme. "detective" (default) = noir black.
   * "junior" = the kid's First Phone — softer, brighter, less grain.
   * Both reuse the same StatusBar and layout tokens.
   */
  variant?: "detective" | "junior";
  /** Optional style (used by junior surface to paint the wallpaper behind). */
  style?: CSSProperties;
  /**
   * When true (default) the scrolling content region carries role="log" for
   * screen readers. Consumers with tabbed panels (Mirror NOTES, Feed TOOLKIT)
   * should set false and place role="log" on the actual message scroller so
   * non-chat panels stay outside chat-log semantics.
   */
  logRegion?: boolean;
}


/**
 * CitizenOS phone frame. On desktop, renders a rounded device silhouette on the
 * noir backdrop. On mobile, becomes full-bleed — the player's real phone IS the
 * case phone.
 */
export function ChatShell({
  header,
  children,
  composer,
  overlay,
  className,
  variant = "detective",
  style,
  logRegion = true,
}: Props) {
  const isJunior = variant === "junior";
  const outer = isJunior
    ? "chat-shell-backdrop chat-shell-backdrop--junior"
    : "chat-shell-backdrop";
  const frame = isJunior
    ? "bg-neutral-900 text-white sm:rounded-[40px] sm:ring-1 sm:ring-white/10"
    : "bg-black text-white sm:rounded-[36px] sm:ring-1 sm:ring-white/5";
  const inner = isJunior ? "bg-neutral-900/80" : "bg-neutral-950";
  const composerBg = isJunior ? "bg-neutral-900/95" : "bg-neutral-950/95";
  const contentAria = logRegion
    ? {
        role: "log" as const,
        "aria-live": "polite" as const,
        "aria-relevant": "additions text" as const,
        "aria-label": "Chat conversation",
      }
    : {};
  return (
    <div className={`${outer} min-h-[100dvh] w-full ${className ?? ""}`} style={style}>
      <div
        className={`mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col sm:my-6 sm:min-h-0 sm:h-[min(880px,calc(100dvh-3rem))] sm:border sm:border-white/10 sm:shadow-2xl sm:overflow-hidden relative ${frame}`}
      >
        <StatusBar />
        {header}
        <div
          {...contentAria}
          className={`relative flex-1 min-h-0 flex flex-col overflow-hidden ${inner}`}
        >
          {children}
        </div>

        {composer && <div className={`border-t border-white/10 ${composerBg}`}>{composer}</div>}
        {overlay}
      </div>
    </div>
  );
}
