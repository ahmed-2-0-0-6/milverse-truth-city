// LAYER-7.4 — Animated overlay for beat 4 (media-literacy skyline).
// Gated by IntersectionObserver so it costs nothing off-screen. GPU is free
// here because the hero 3D city has already unmounted upstream.
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Element to observe for visibility. Defaults to the FX root itself. */
  targetRef?: React.RefObject<HTMLElement>;
};

export function BroadcastCityFX({ targetRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const target = targetRef?.current ?? rootRef.current;
    if (!target) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setLive(e.isIntersecting);
      },
      { threshold: 0.15 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [targetRef]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const play = live && !reduced;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
      style={{ contain: "strict" }}
    >
      {/* Aurora shimmer over the sky */}
      <div
        className="absolute inset-x-0 top-0 h-[52%]"
        style={{
          background:
            "radial-gradient(80% 60% at 30% 20%, rgba(56,189,248,0.10) 0%, transparent 60%), radial-gradient(70% 50% at 80% 10%, rgba(251,146,60,0.10) 0%, transparent 55%)",
          animation: play ? "bfx-aurora 14s ease-in-out infinite" : undefined,
          mixBlendMode: "screen",
        }}
      />

      {/* Signal rings from tallest tower */}
      <svg
        className="absolute"
        style={{ left: "62%", top: "18%", width: "26%", height: "34%" }}
        viewBox="0 0 200 200"
      >
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r="20"
            fill="none"
            stroke="rgba(103,232,249,0.55)"
            strokeWidth="0.6"
            style={{
              transformOrigin: "100px 100px",
              animation: play
                ? `bfx-ring 4.2s ease-out ${i * 1.4}s infinite`
                : undefined,
              opacity: play ? 0 : 0.15,
            }}
          />
        ))}
      </svg>

      {/* Antenna tip aviation lights (positions tuned to image) */}
      {ANTENNA_LIGHTS.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: 4,
            height: 4,
            background: "rgba(248,113,113,0.95)",
            boxShadow:
              "0 0 6px 2px rgba(248,113,113,0.7), 0 0 14px 4px rgba(248,113,113,0.35)",
            animation: play
              ? `bfx-blink 1.6s ease-in-out ${i * 0.2}s infinite`
              : undefined,
            opacity: play ? undefined : 0.6,
          }}
        />
      ))}

      {/* Two media-screen facades (positioned over the painted screens) */}
      <MediaScreen
        style={{ left: "24%", top: "38%", width: "7%", height: "13%" }}
        hue="cyan"
        play={play}
        delay={0}
      />
      <MediaScreen
        style={{ left: "32%", top: "44%", width: "6.5%", height: "12%" }}
        hue="magenta"
        play={play}
        delay={1.2}
      />
      <MediaScreen
        style={{ left: "72%", top: "40%", width: "5%", height: "13%" }}
        hue="violet"
        play={play}
        delay={0.6}
      />

      {/* Data stream along the highway curve */}
      <div
        className="absolute"
        style={{
          left: "6%",
          top: "72%",
          width: "50%",
          height: "3px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,180,120,0.9) 50%, transparent 100%)",
          filter: "blur(1px)",
          transform: "rotate(-6deg)",
          maskImage:
            "linear-gradient(90deg, transparent, black 20%, black 80%, transparent)",
          animation: play ? "bfx-stream 3.8s linear infinite" : undefined,
          opacity: play ? undefined : 0,
        }}
      />
      <div
        className="absolute"
        style={{
          left: "28%",
          top: "76%",
          width: "40%",
          height: "2px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(103,232,249,0.85) 50%, transparent 100%)",
          filter: "blur(0.7px)",
          transform: "rotate(-3deg)",
          animation: play
            ? "bfx-stream 4.6s linear 1.1s infinite"
            : undefined,
          opacity: play ? undefined : 0,
        }}
      />

      {/* Helicopter drifting with searchlight */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: "34%",
          width: "100%",
          height: "1px",
          animation: play ? "bfx-heli 42s linear infinite" : undefined,
          opacity: play ? 1 : 0,
        }}
      >
        <div className="relative" style={{ transform: "translateX(-6%)" }}>
          {/* Search beam */}
          <div
            className="absolute"
            style={{
              left: "6px",
              top: "6px",
              width: "160px",
              height: "220px",
              transformOrigin: "6px 6px",
              background:
                "conic-gradient(from 150deg at 6px 6px, transparent 0deg, rgba(255,255,255,0.22) 8deg, rgba(255,255,255,0.05) 22deg, transparent 30deg)",
              filter: "blur(2px)",
              animation: play ? "bfx-beam 5.2s ease-in-out infinite" : undefined,
              mixBlendMode: "screen",
            }}
          />
          {/* Body dot + blink */}
          <span
            className="absolute rounded-full"
            style={{
              left: 0,
              top: 0,
              width: 8,
              height: 4,
              background: "rgba(20,25,35,0.95)",
              boxShadow: "0 0 4px 1px rgba(0,0,0,0.6)",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              left: -2,
              top: 1,
              width: 3,
              height: 3,
              background: "rgba(248,113,113,1)",
              boxShadow: "0 0 6px 2px rgba(248,113,113,0.75)",
              animation: play ? "bfx-blink 0.9s ease-in-out infinite" : undefined,
            }}
          />
        </div>
      </div>

      {/* Blimp — very slow drift, opposite direction */}
      <div
        className="absolute"
        style={{
          right: 0,
          top: "10%",
          width: "100%",
          animation: play ? "bfx-blimp 90s linear infinite" : undefined,
          opacity: play ? 1 : 0.7,
        }}
      >
        <div
          className="ml-auto"
          style={{
            width: 44,
            height: 12,
            borderRadius: "999px",
            background:
              "linear-gradient(180deg, rgba(210,220,235,0.85), rgba(120,140,170,0.85))",
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.35), inset 0 0 6px rgba(0,0,0,0.25)",
          }}
        />
      </div>

      {/* Rain veil (very light) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(100deg, rgba(160,190,220,0.05) 0px, rgba(160,190,220,0.05) 1px, transparent 1px, transparent 6px)",
          animation: play ? "bfx-rain 2.4s linear infinite" : undefined,
          opacity: play ? 0.35 : 0,
          mixBlendMode: "screen",
        }}
      />

      <style>{`
        @keyframes bfx-aurora {
          0%,100% { transform: translate3d(0,0,0); opacity: 0.9; }
          50% { transform: translate3d(-2%, 1%, 0); opacity: 1; }
        }
        @keyframes bfx-ring {
          0% { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(3.6); opacity: 0; }
        }
        @keyframes bfx-blink {
          0%,60%,100% { opacity: 1; }
          70%,90% { opacity: 0.15; }
        }
        @keyframes bfx-stream {
          0% { transform: translateX(-40%) rotate(var(--r,-6deg)); }
          100% { transform: translateX(140%) rotate(var(--r,-6deg)); }
        }
        @keyframes bfx-heli {
          0% { transform: translate3d(-8%, 0, 0); }
          50% { transform: translate3d(55%, -1.5%, 0); }
          100% { transform: translate3d(110%, 0, 0); }
        }
        @keyframes bfx-beam {
          0%,100% { transform: rotate(-12deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes bfx-blimp {
          0% { transform: translateX(6%); }
          100% { transform: translateX(-110%); }
        }
        @keyframes bfx-rain {
          0% { background-position: 0 0; }
          100% { background-position: -40px 120px; }
        }
        @keyframes bfx-bars {
          0% { transform: translateY(60%); }
          100% { transform: translateY(-60%); }
        }
        @keyframes bfx-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(120%); }
        }
      `}</style>
    </div>
  );
}

function MediaScreen({
  style,
  hue,
  play,
  delay,
}: {
  style: React.CSSProperties;
  hue: "cyan" | "magenta" | "violet";
  play: boolean;
  delay: number;
}) {
  const color =
    hue === "cyan"
      ? "rgba(103,232,249,0.85)"
      : hue === "magenta"
      ? "rgba(244,114,182,0.85)"
      : "rgba(167,139,250,0.85)";
  return (
    <div
      className="absolute overflow-hidden rounded-[2px]"
      style={{
        ...style,
        boxShadow: `0 0 18px ${color.replace("0.85", "0.35")}`,
        background: "rgba(10,15,25,0.55)",
        mixBlendMode: "screen",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 5px)`,
          animation: play
            ? `bfx-bars 2.6s ease-in-out ${delay}s infinite alternate`
            : undefined,
          opacity: 0.9,
        }}
      />
      <div
        className="absolute inset-x-0 h-[35%]"
        style={{
          background: `linear-gradient(180deg, transparent, ${color.replace(
            "0.85",
            "0.35"
          )}, transparent)`,
          animation: play ? `bfx-scan 3.4s linear ${delay}s infinite` : undefined,
        }}
      />
    </div>
  );
}

const ANTENNA_LIGHTS: { x: string; y: string }[] = [
  { x: "12%", y: "12%" },
  { x: "18%", y: "18%" },
  { x: "27%", y: "16%" },
  { x: "44%", y: "22%" },
  { x: "63%", y: "10%" },
  { x: "75%", y: "20%" },
  { x: "88%", y: "17%" },
];
