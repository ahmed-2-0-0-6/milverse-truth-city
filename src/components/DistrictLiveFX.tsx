// LAYER-3 — Live overlays that sit on top of the district art image.
// Pure CSS + SVG; zero JS animation loops. Respects CINEMATIC/LITE.
//   mirror     → lightning strike flashes + subtle rain hint
//   feed       → diagonal rain streaks + phone-screen glow + notification pings
//   studio     → coffee steam plume + drifting paper haze
//   archive    → warm lamp pulse + floating library dust motes
//   cleanroom  → sliding door reveal + scan sweep
//
// All layers are `pointer-events-none` and clipped to the parent image container.

import { useVisualMode } from "@/lib/visual-quality";

export type DistrictKey = "mirror" | "feed" | "studio" | "archive" | "cleanroom";

export function DistrictLiveFX({
  district,
  intensity = "normal",
}: {
  district: DistrictKey;
  intensity?: "normal" | "soft";
}) {
  const { mode } = useVisualMode();
  if (mode !== "cinematic") return null;
  const dim = intensity === "soft" ? "opacity-60" : "";
  return (
    <div
      aria-hidden
      className={`district-fx pointer-events-none absolute inset-0 overflow-hidden ${dim}`}
    >
      {district === "mirror" && <MirrorFX />}
      {district === "feed" && <FeedFX />}
      {district === "studio" && <StudioFX />}
      {district === "archive" && <ArchiveFX />}
      {district === "cleanroom" && <CleanroomFX />}
    </div>
  );
}

function MirrorFX() {
  return (
    <>
      {/* soft distant rain wash */}
      <div className="fx-rain absolute inset-0 opacity-25" />
      {/* two lightning flash layers, offset timing */}
      <div className="fx-lightning fx-lightning-a absolute inset-0" />
      <div className="fx-lightning fx-lightning-b absolute inset-0" />
      {/* forked bolt SVG that occasionally strikes */}
      <svg
        className="fx-bolt absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        <path
          d="M240 0 L215 90 L245 95 L190 210 L215 215 L165 300"
          fill="none"
          stroke="rgba(200,225,255,0.95)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          style={{
            filter:
              "drop-shadow(0 0 6px rgba(180,215,255,0.9)) drop-shadow(0 0 14px rgba(120,180,255,0.6))",
          }}
        />
      </svg>
    </>
  );
}

function FeedFX() {
  return (
    <>
      {/* diagonal rain streaks */}
      <div className="fx-rain fx-rain-hard absolute inset-0" />
      {/* rain drips down the "glass" */}
      <div className="fx-drips absolute inset-0" />
      {/* pulsing phone-screen glow (positioned generically bottom-right) */}
      <div className="fx-phone-glow absolute" />
      {/* notification pings — three offset dots */}
      <span className="fx-ping fx-ping-1" />
      <span className="fx-ping fx-ping-2" />
      <span className="fx-ping fx-ping-3" />
    </>
  );
}

function StudioFX() {
  return (
    <>
      {/* steam column rising */}
      <div className="fx-steam fx-steam-a absolute" />
      <div className="fx-steam fx-steam-b absolute" />
      {/* drifting paper haze */}
      <div className="fx-paper-air absolute inset-0" />
      {/* warm desk-lamp flicker */}
      <div className="fx-lamp absolute inset-0" />
    </>
  );
}

function ArchiveFX() {
  return (
    <>
      {/* warm lamp glow, top-left */}
      <div className="fx-arc-lamp absolute inset-0" />
      {/* dust motes: 12 tiny drifting dots via CSS */}
      <div className="fx-motes absolute inset-0" />
      {/* subtle god-rays through shelves */}
      <div className="fx-godrays absolute inset-0" />
    </>
  );
}

function CleanroomFX() {
  return (
    <>
      {/* opening-door reveal — two panels slide out and gently close */}
      <div className="fx-door fx-door-l absolute" />
      <div className="fx-door fx-door-r absolute" />
      {/* diagnostic scan sweep */}
      <div className="fx-scan absolute inset-0" />
      {/* subtle grid pulse */}
      <div className="fx-grid absolute inset-0" />
    </>
  );
}
