import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";

interface Props {
  header: ReactNode;
  children: ReactNode;
  composer?: ReactNode;
  /** Rendered floating above content (notifications, sheets, call screens). */
  overlay?: ReactNode;
  /** If true, no desktop device frame — full-bleed (mobile). Auto by breakpoint. */
  className?: string;
}

/**
 * CitizenOS phone frame. On desktop, renders a rounded device silhouette on the
 * noir backdrop. On mobile, becomes full-bleed — the player's real phone IS the
 * case phone.
 */
export function ChatShell({ header, children, composer, overlay, className }: Props) {
  return (
    <div className={`chat-shell-backdrop min-h-[100dvh] w-full ${className ?? ""}`}>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col bg-black text-white sm:my-6 sm:min-h-0 sm:h-[min(880px,calc(100dvh-3rem))] sm:rounded-[36px] sm:border sm:border-white/10 sm:shadow-2xl sm:overflow-hidden sm:ring-1 sm:ring-white/5 relative">
        <StatusBar />
        {header}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Chat conversation"
          className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-neutral-950"
        >
          {children}
        </div>
        {composer && <div className="border-t border-white/10 bg-neutral-950/95">{composer}</div>}
        {overlay}
      </div>
    </div>
  );
}
