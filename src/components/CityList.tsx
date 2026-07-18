// MILVERSE — Accessibility/low-bandwidth fallback of the world map.
// Zero animation, zero SVG. Same data. Flawless on 360px.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Play,
  Eye,
  Newspaper,
  Clapperboard,
  Library,
  Landmark as LandmarkIcon,
  Store,
  Swords,
  BookOpen,
  IdCard,
  GraduationCap,
  NotebookPen,
} from "lucide-react";
import {
  buildMirrorStations,
  buildFeedStations,
  MIRROR_COLOR,
  FEED_COLOR,
  type Station,
} from "@/lib/city/world-data";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { getMirrorRecommendations } from "@/lib/recommendations";
import { SIGNAGE, signFor } from "@/lib/city/signage";


export function CityList({ onSwitchToMap }: { onSwitchToMap: () => void }) {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const mirror = useMemo(buildMirrorStations, []);
  const feed = useMemo(buildFeedStations, []);
  const played = useMemo(() => {
    const s = new Set<string>();
    profile?.history.forEach((h) => s.add(h.caseId));
    return s;
  }, [profile]);
  const recIds = useMemo(
    () => new Set(getMirrorRecommendations(profile).map((r) => r.scenario.id)),
    [profile],
  );

  const mirrorDone = mirror.filter((s) => played.has(s.scenario.id)).length;
  const feedDone = feed.filter((s) => played.has(s.scenario.id)).length;

  return (
    <div className="rounded-sm border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1 rounded-sm border border-primary/40 px-1 py-0.5 stencil text-[10px]">
          <button
            onClick={onSwitchToMap}
            className="px-2 py-1 rounded-sm text-muted-foreground hover:text-foreground"
          >
            MAP
          </button>
          <button className="px-2 py-1 rounded-sm bg-primary text-primary-foreground">LIST</button>
        </div>
        <div className="stencil text-[10px] text-muted-foreground">LIST VIEW · LOW-DATA</div>
      </div>

      {/* Landmark districts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 border-b border-border">
        <LandmarkTile to="/paper" Icon={NotebookPen} label="The Paper" sub={SIGNAGE.paper.sub} badge="TODAY" />
        <LandmarkTile to="/drop" Icon={Play} label="Daily Drop" sub={SIGNAGE.drop.sub} />
        <LandmarkTile to="/shift" Icon={Swords} label="The Shift" sub={SIGNAGE.shift.sub} />
        <LandmarkTile to="/boss" Icon={Swords} label="Boss Fights" sub={SIGNAGE.boss.sub} />
        <LandmarkTile to="/city-hall" Icon={LandmarkIcon} label="City Hall" sub={SIGNAGE["city-hall"].sub} />
        <LandmarkTile to="/studio" Icon={Clapperboard} label="The Studio" sub={SIGNAGE.studio.sub} />
        <LandmarkTile
          to="/archive"
          Icon={Library}
          label="The Archive"
          sub={SIGNAGE.archive.sub}
          badge={
            profile?.history?.length
              ? `${new Set(profile.history.map((h) => h.caseId)).size} ON SHELF`
              : undefined
          }
        />
        <LandmarkTile to="/manual" Icon={BookOpen} label="Field Manual" sub={SIGNAGE.manual.sub} badge="MIL" />
        <LandmarkTile to="/profile" Icon={IdCard} label="Operator Profile" sub={SIGNAGE.profile.sub} />
        <LandmarkTile to="/educators" Icon={GraduationCap} label="For Educators" sub="Classroom kit and lesson plans" />
        <LandmarkTile to="/arena" Icon={Swords} label="The Arena" sub={SIGNAGE.arena.sub} />
        <LandmarkTile to="/market" Icon={Store} label="The Market" sub={SIGNAGE.market.sub} muted />
      </div>

      <DistrictSection
        color={MIRROR_COLOR}
        Icon={Eye}
        title="The Mirror"
        subtitle={SIGNAGE.mirror.sub}
        done={mirrorDone}
        total={mirror.length}
        stations={mirror}
        played={played}
        recIds={recIds}
        routePrefix="mirror"
      />
      <DistrictSection
        color={FEED_COLOR}
        Icon={Newspaper}
        title="The Feed"
        subtitle={SIGNAGE.feed.sub}
        done={feedDone}
        total={feed.length}
        stations={feed}
        played={played}
        recIds={recIds}
        routePrefix="feed"
      />
    </div>
  );
}


function LandmarkTile({
  to,
  Icon,
  label,
  muted,
  badge,
}: {
  to: string;
  Icon: typeof Eye;
  label: string;
  muted?: boolean;
  badge?: string;
}) {
  return (
    <Link
      to={to as "/city-hall"}
      className={`flex items-center gap-2 rounded-sm border p-2 text-sm ${muted ? "border-dashed border-primary/30 text-muted-foreground" : "border-border hover:border-primary"}`}
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="stencil text-[9px] text-primary shrink-0">{badge}</span>}
    </Link>
  );
}

function DistrictSection({
  color,
  Icon,
  title,
  subtitle,
  done,
  total,
  stations,
  played,
  recIds,
  routePrefix,
}: {
  color: string;
  Icon: typeof Eye;
  title: string;
  subtitle: string;
  done: number;
  total: number;
  stations: Station[];
  played: Set<string>;
  recIds: Set<string>;
  routePrefix: "mirror" | "feed";
}) {
  const nav = useNavigate();
  return (
    <section className="border-b border-border last:border-b-0">
      <header className="flex items-center gap-3 p-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-sm border"
          style={{ borderColor: color, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="stencil text-sm" style={{ color }}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="stencil text-[10px] text-muted-foreground">
          {done}/{total}
        </div>
      </header>
      <ul className="divide-y divide-border">
        {stations.map((s) => {
          const isPlayed = played.has(s.scenario.id);
          const isBeacon = recIds.has(s.scenario.id) && !isPlayed;
          const to = routePrefix === "mirror" ? "/mirror/$caseId" : "/feed/$caseId";
          return (
            <li key={s.scenario.id}>
              <button
                onClick={() => nav({ to, params: { caseId: s.scenario.id } })}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary/5"
              >
                <span className="stencil text-[10px] w-14 shrink-0" style={{ color }}>
                  {s.code}
                </span>
                <span className="flex-1 text-sm truncate">{s.scenario.title}</span>
                <span className="stencil text-[9px] text-muted-foreground shrink-0">T{s.tier}</span>
                {isBeacon && (
                  <span
                    className="stencil text-[9px] px-1.5 py-0.5 rounded-sm"
                    style={{ background: `${color}22`, color }}
                  >
                    PLAN
                  </span>
                )}
                {isPlayed && (
                  <span className="stencil text-[9px] text-primary shrink-0">✓ DONE</span>
                )}
                <Play className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
