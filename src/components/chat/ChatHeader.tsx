import { Users, ChevronLeft, Phone, MoreVertical, ShieldAlert, BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  name: string;
  number?: string;
  isSaved?: boolean;
  subtitle?: string;
  avatarInitials?: string;
  onContacts?: () => void;
  onBack?: () => void;
  onCall?: () => void;
  right?: ReactNode;
  accent?: "primary" | "destructive";
}

export function ChatHeader({
  name, number, isSaved, subtitle, avatarInitials,
  onContacts, onBack, onCall, right, accent = "primary",
}: Props) {
  const initials = avatarInitials ?? name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const accentBg = accent === "destructive" ? "bg-red-500/20 text-red-300 border-red-500/40" : "bg-primary/15 text-primary border-primary/30";

  return (
    <div className="border-b border-white/10 bg-neutral-950/90 backdrop-blur shadow-[0_1px_0_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {onBack && (
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-colors" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold shadow-sm ${accentBg}`}>
          {initials.slice(0, 2) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-sm font-semibold text-white">{name}</div>
            {isSaved && (
              <span className="flex items-center gap-0.5 rounded-sm bg-emerald-500/15 border border-emerald-500/30 px-1 py-[1px] text-[9px] font-mono uppercase tracking-widest text-emerald-300">
                <BadgeCheck className="h-2.5 w-2.5" /> saved
              </span>
            )}
          </div>
          <div className="truncate font-mono text-[10px] text-white/50 tracking-wider">
            {subtitle ?? (number ?? "—")}
          </div>
        </div>
        {onCall && (
          <button onClick={onCall} className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-colors" aria-label="Call">
            <Phone className="h-4 w-4" />
          </button>
        )}
        {onContacts && (
          <button onClick={onContacts} className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-colors" aria-label="Contacts">
            <Users className="h-4 w-4" />
          </button>
        )}
        {right}
        <button className="p-2 text-white/30 cursor-not-allowed" aria-label="More" disabled>
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      {number && !isSaved && (
        <div
          role="note"
          aria-label={`Warning: the number ${number} is not in your contacts. Any name shown is what the sender claims, not who they are.`}
          className="flex items-start gap-2 border-t border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-200"
        >
          <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
          <div>
            <div className="font-semibold text-amber-100">This number is not in your contacts.</div>
            <div className="text-amber-200/80 mt-0.5">
              Any name shown is what the sender <em>claims</em>, not who they are.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
