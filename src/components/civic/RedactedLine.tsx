// Civic primitive — text under a decorative redaction bar. Hover / focus
// / tap lifts the bar. Screen readers read the text directly (bar is
// aria-hidden). Under reduced motion the bar is a dotted underline and
// text is simply visible.

import { useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function RedactedLine({ children, className = "" }: Props) {
  const [lifted, setLifted] = useState(false);

  return (
    <span
      tabIndex={0}
      role="button"
      aria-label="Redacted word, activate to reveal"
      className={`relative inline-block align-baseline outline-none ${className}`}
      onMouseEnter={() => setLifted(true)}
      onMouseLeave={() => setLifted(false)}
      onFocus={() => setLifted(true)}
      onBlur={() => setLifted(false)}
      onTouchStart={() => setLifted(true)}
      onClick={() => setLifted((v) => !v)}
    >
      <span className="redact-text">{children}</span>
      <span
        aria-hidden="true"
        className={`redact-bar ${lifted ? "redact-lifted" : ""}`}
      />
    </span>
  );
}
