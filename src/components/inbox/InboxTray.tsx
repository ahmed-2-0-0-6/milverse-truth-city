// MILVERSE — Citizen Inbox tray. Bell button + sheet listing today's arrivals.
import "@/styles/paper-fonts.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Phone, Newspaper } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { loadInbox, markOpened, markPaperRead } from "@/lib/inbox/profile";
import { todaysArrivals, morningEdition, type InboxItem } from "@/lib/inbox/scheduler";
import { getLatestEdition } from "@/lib/paper.functions";
import type { Edition } from "@/lib/paper/types";
import { platformStyle } from "./platform-style";
import { VoicemailSheet } from "./VoicemailSheet";

export function InboxTray() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [allItems, setAllItems] = useState<InboxItem[]>([]);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [voicemail, setVoicemail] = useState<InboxItem | null>(null);
  const navigate = useNavigate();
  const fetchEdition = useServerFn(getLatestEdition);

  useEffect(() => {
    setAllItems(todaysArrivals());
    const on = () => {
      setAllItems(todaysArrivals());
      setTick((t) => t + 1);
    };
    window.addEventListener("milverse:inbox", on);
    window.addEventListener("milverse:profile", on);
    return () => {
      window.removeEventListener("milverse:inbox", on);
      window.removeEventListener("milverse:profile", on);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchEdition()
      .then((row) => {
        if (alive) setEdition((row as unknown as Edition | null) ?? null);
      })
      .catch(() => {
        /* No edition → paper row simply won't appear. */
      });
    return () => {
      alive = false;
    };
  }, [fetchEdition]);

  const { rows, unread } = useMemo(() => {
    // Reference tick so this recomputes when inbox events fire.
    void tick;
    const p = loadInbox();
    const arrived = new Set(p.arrived);
    const opened = new Set(p.opened);
    const paper = morningEdition(new Date(), edition);
    const merged = paper ? [...allItems.filter((x) => x.type !== "paper"), paper] : allItems;
    const rows = merged
      .filter((it) => arrived.has(it.id))
      .map((it) => ({
        ...it,
        // Paper "read" state is bound to paperRead, not the generic opened set.
        read: it.type === "paper" ? p.paperRead === it.editionId : opened.has(it.id),
      }))
      .reverse();
    const unread = rows.filter((r) => !r.read).length;
    return { rows, unread };
  }, [allItems, edition, tick]);

  const badge = unread > 9 ? "9+" : String(unread);

  const openRow = (it: InboxItem) => {
    if (it.type === "call") {
      markOpened(it.id);
      setOpen(false);
      setVoicemail(it);
      return;
    }
    if (it.type === "paper" && it.editionId) {
      markOpened(it.id);
      markPaperRead(it.editionId);
      setOpen(false);
      navigate({ to: "/paper" });
      return;
    }
    markOpened(it.id);
    setOpen(false);
    navigate({ to: it.route });
  };

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative rounded border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label={`Inbox${unread ? `, ${unread} unread` : ""}`}
          title="Inbox"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground"
              aria-hidden
            >
              {badge}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm overflow-y-auto p-0"
        aria-label="Citizen inbox"
      >
        <div className="border-b border-border px-4 py-3">
          <SheetTitle className="stencil text-sm text-foreground">INCOMING</SheetTitle>
          <SheetDescription className="stencil text-[10px] text-muted-foreground mt-0.5">
            Today's arrivals · {rows.length} total · {unread} unread
          </SheetDescription>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="stencil text-[10px] text-muted-foreground mb-3">// STANDBY</div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Nothing new. The city is quiet. It won't stay that way.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((it) => {
              const s = platformStyle(it.platform);
              const isCall = it.type === "call";
              const isPaper = it.type === "paper";
              const leftBorder = isCall ? "#ef4444" : isPaper ? "#c9b78b" : s.border;
              const iconBg = isCall ? "#ef4444" : isPaper ? "#1a1712" : s.border;
              return (
                <li key={it.id}>
                  <button
                    onClick={() => openRow(it)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/40 focus-visible:outline-none focus-visible:bg-accent/60 transition-colors ${
                      it.read ? "opacity-50" : ""
                    }`}
                    style={{ borderLeft: `3px solid ${leftBorder}` }}
                  >
                    <span
                      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: iconBg }}
                      aria-hidden
                    >
                      {isCall ? (
                        <Phone className="h-4 w-4" />
                      ) : isPaper ? (
                        <Newspaper className="h-4 w-4" style={{ color: "#f4efe4" }} />
                      ) : (
                        s.glyph
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground leading-tight">
                        <span
                          className={`truncate ${isPaper ? "" : ""}`}
                          style={
                            isPaper
                              ? { fontFamily: "'Playfair Display', Georgia, serif" }
                              : undefined
                          }
                        >
                          {isPaper ? it.headline : it.senderName}
                        </span>
                        <span className="ml-auto stencil text-[9px] text-muted-foreground">
                          {isCall ? "MISSED" : isPaper ? "MORNING EDITION" : s.label}
                        </span>
                      </span>
                      {isCall && it.number && (
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                          {it.number}
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {isCall
                          ? "Voicemail · tap to play"
                          : isPaper
                            ? "UNFOLD →"
                            : it.preview}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
    {voicemail && (
      <VoicemailSheet
        item={voicemail}
        open={!!voicemail}
        onOpenChange={(o) => !o && setVoicemail(null)}
      />
    )}
    </>
  );
}
