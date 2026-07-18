// Civic primitive — reveals a block once when scrolled into view with a
// left-to-right clip + brightness flash, evoking light raking a fresh
// carving. Content is ALWAYS in the DOM. Under LITE / reduced motion the
// wrapper renders children with no observer attached at all.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVisualMode } from "@/lib/visual-quality";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

function prefersReduced(): boolean {
  if (typeof window === "undefined") return true;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function EngravedReveal({ children, className = "", as: Tag = "div" }: Props) {
  const { mode } = useVisualMode();
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const lite = mode === "lite" || prefersReduced();

  useEffect(() => {
    if (lite) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lite]);

  if (lite) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      ref={ref as never}
      className={`${className} ${revealed ? "engrave-in" : "engrave-idle"}`}
    >
      {children}
    </Tag>
  );
}
