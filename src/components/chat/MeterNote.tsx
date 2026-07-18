// MILVERSE — MeterNote strip.
// Renders the current band's note beneath the meter bar. Announces on band
// change (up OR down). Dismisses on next player send or after 6s. Never
// enters the chat transcript, the saved sim record, or the tape.
//
// The visual strip may hide before a screen-reader finishes; the live region
// holds its content independently so announcements complete.

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Stable key for the current band (e.g. "steady", "intact"). */
  bandKey: string;
  /** Human label — shown as a stencil tag ahead of the note. */
  label: string;
  /** The band's descriptive note. */
  note: string;
  /**
   * Incremented by the parent every time the player sends a message. Used to
   * dismiss the strip on the next send.
   */
  sendTick: number;
  /**
   * When true on first mount, show the mount band once (used for very first
   * case only). Returning players start silent.
   */
  showOnMount?: boolean;
}

export function MeterNote({ bandKey, label, note, sendTick, showOnMount }: Props) {
  const [visible, setVisible] = useState(false);
  const [liveText, setLiveText] = useState("");
  const mountedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const sendTickRef = useRef(sendTick);

  // Band change (and optional first mount) → show + announce.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!showOnMount) return;
    }
    setVisible(true);
    setLiveText(`${label}. ${note}`);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), 6000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandKey]);

  // Player send → dismiss (visual only; live region keeps its text).
  useEffect(() => {
    if (sendTick === sendTickRef.current) return;
    sendTickRef.current = sendTick;
    setVisible(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, [sendTick]);

  return (
    <>
      {visible && (
        <div className="mt-1 rounded-sm border-l-2 border-primary/40 bg-neutral-900/60 px-2 py-1 font-mono text-[10px] tracking-wide text-white/70">
          <span className="stencil tracking-widest text-primary mr-1.5">{label}</span>
          <span className="normal-case tracking-normal">{note}</span>
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {liveText}
      </div>
    </>
  );
}
