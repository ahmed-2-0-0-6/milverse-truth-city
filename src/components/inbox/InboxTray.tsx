// MILVERSE — Citizen Inbox tray. Bell button + sheet listing today's arrivals.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Phone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { loadInbox, markOpened } from "@/lib/inbox/profile";
import { todaysArrivals, type InboxItem } from "@/lib/inbox/scheduler";
import { platformStyle } from "./platform-style";
import { VoicemailSheet } from "./VoicemailSheet";

export function InboxTray() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [allItems, setAllItems] = useState<InboxItem[]>([]);
  const navigate = useNavigate();

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

  const { rows, unread } = useMemo(() => {
    // Reference tick so this recomputes when inbox events fire.
    void tick;
    const p = loadInbox();
    const arrived = new Set(p.arrived);
    const opened = new Set(p.opened);
    const rows = allItems
      .filter((it) => arrived.has(it.id))
      .map((it) => ({ ...it, read: opened.has(it.id) }))
      .reverse();
    const unread = rows.filter((r) => !r.read).length;
    return { rows, unread };
  }, [allItems, tick]);

  const badge = unread > 9 ? "9+" : String(unread);

  const openRow = (it: InboxItem) => {
    markOpened(it.id);
    setOpen(false);
    navigate({ to: it.route });
  };

  return (
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
              return (
                <li key={it.id}>
                  <button
                    onClick={() => openRow(it)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/40 focus-visible:outline-none focus-visible:bg-accent/60 transition-colors ${
                      it.read ? "opacity-50" : ""
                    }`}
                    style={{ borderLeft: `3px solid ${s.border}` }}
                  >
                    <span
                      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: s.border }}
                      aria-hidden
                    >
                      {s.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground leading-tight">
                        <span className="truncate">{it.senderName}</span>
                        <span className="ml-auto stencil text-[9px] text-muted-foreground">
                          {s.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {it.preview}
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
  );
}
