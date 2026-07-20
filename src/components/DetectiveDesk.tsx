import { useEffect, useRef } from "react";
import deskImg from "@/assets/detective-desk.jpg";

/**
 * DetectiveDesk — lightweight cinematic background.
 *
 * Previous version rendered a full R3F scene (~1700 lines, dozens of meshes,
 * per-frame shader work) which tanked scroll performance. This rewrite mirrors
 * the philosophy of HeroType: a heavy visual impression delivered with almost
 * zero runtime cost.
 *
 * Composition:
 *   - One pre-rendered premium image (the "set").
 *   - CSS-only candle flicker + warm sconce glow overlays (GPU compositor).
 *   - A tiny dust-mote layer animated via translate3d keyframes.
 *   - A subtle parallax hooked to scrollY via rAF (no React re-renders).
 *
 * No WebGL, no Three, no per-frame React work.
 */
type Props = { className?: string };

export function DetectiveDesk({ className = "" }: Props) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const candleRef = useRef<HTMLDivElement | null>(null);

  // Cheap parallax — read scroll in rAF, write transform. No state.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    let y = 0;
    const onScroll = () => {
      y = window.scrollY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          // Only apply when the section is roughly on-screen.
          const vh = window.innerHeight || 1;
          const progress = 1 - Math.max(0, Math.min(1, (rect.top + rect.height) / (rect.height + vh)));
          const shift = (progress - 0.5) * 24; // ±12px, very subtle
          el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.04)`;
          ticking = false;
        });
      }
      void y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className}`}
      aria-hidden
    >
      {/* The set — one image, GPU-composited, gently parallaxed. */}
      <div
        ref={sceneRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: `url(${deskImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 60%",
          transform: "translate3d(0,0,0) scale(1.04)",
          filter: "saturate(1.05) contrast(1.05)",
        }}
      />

      {/* Warm candle glow — pure CSS radial, flickers via opacity/scale. */}
      <div
        ref={candleRef}
        className="pointer-events-none absolute candle-glow"
        style={{
          right: "9%",
          bottom: "28%",
          width: "38vmin",
          height: "38vmin",
          background:
            "radial-gradient(circle, rgba(255,180,90,0.55) 0%, rgba(255,140,50,0.22) 30%, transparent 65%)",
          mixBlendMode: "screen",
          filter: "blur(2px)",
        }}
      />

      {/* Sconce halos — left + right. Static gradients, only a slow breathe. */}
      <div
        className="pointer-events-none absolute sconce-breathe"
        style={{
          left: "15%",
          top: "6%",
          width: "26vmin",
          height: "26vmin",
          background:
            "radial-gradient(circle, rgba(255,190,110,0.35) 0%, transparent 60%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="pointer-events-none absolute sconce-breathe"
        style={{
          right: "18%",
          top: "6%",
          width: "26vmin",
          height: "26vmin",
          background:
            "radial-gradient(circle, rgba(255,190,110,0.35) 0%, transparent 60%)",
          mixBlendMode: "screen",
          animationDelay: "-2.3s",
        }}
      />

      {/* Dust motes — one SVG, animated with CSS. Costs ~nothing. */}
      <div className="pointer-events-none absolute inset-0 dust-motes opacity-40" />

      {/* Vignette + top fade so overlaid text stays legible. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%), linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Film grain — static SVG noise, one layer. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/></svg>\")",
          backgroundSize: "220px 220px",
        }}
      />

      <style>{`
        @keyframes candleFlicker {
          0%,100% { opacity: .85; transform: translate3d(0,0,0) scale(1); }
          20%     { opacity: 1;   transform: translate3d(0,-1px,0) scale(1.03); }
          40%     { opacity: .72; transform: translate3d(0,0,0)   scale(.97); }
          65%     { opacity: .95; transform: translate3d(0,0,0)   scale(1.02); }
          80%     { opacity: .8;  transform: translate3d(0,1px,0) scale(1);    }
        }
        .candle-glow {
          animation: candleFlicker 3.6s ease-in-out infinite;
          will-change: opacity, transform;
        }
        @keyframes sconceBreathe {
          0%,100% { opacity: .85; }
          50%     { opacity: 1;   }
        }
        .sconce-breathe {
          animation: sconceBreathe 5.5s ease-in-out infinite;
          will-change: opacity;
        }
        @keyframes dustDrift {
          0%   { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-40px,-60px,0); }
        }
        .dust-motes {
          background-image:
            radial-gradient(1px 1px at 12% 18%, rgba(255,220,170,0.55), transparent 60%),
            radial-gradient(1px 1px at 28% 62%, rgba(255,220,170,0.4),  transparent 60%),
            radial-gradient(1px 1px at 47% 34%, rgba(255,220,170,0.5),  transparent 60%),
            radial-gradient(1px 1px at 63% 78%, rgba(255,220,170,0.35), transparent 60%),
            radial-gradient(1px 1px at 78% 22%, rgba(255,220,170,0.45), transparent 60%),
            radial-gradient(1px 1px at 88% 55%, rgba(255,220,170,0.4),  transparent 60%),
            radial-gradient(1px 1px at 34% 88%, rgba(255,220,170,0.35), transparent 60%);
          background-size: 600px 600px;
          animation: dustDrift 22s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .candle-glow, .sconce-breathe, .dust-motes { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default DetectiveDesk;
