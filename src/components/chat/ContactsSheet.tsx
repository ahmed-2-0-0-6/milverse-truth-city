import { useEffect, useRef } from "react";
import { X, Phone, ShieldOff } from "lucide-react";
import { BASE_CONTACTS, BOSS_CONTACTS, type SavedContact } from "@/lib/chat/contacts";

interface Props {
  open: boolean;
  onClose: () => void;
  /** If provided, appends per-boss contacts (with protocol move ids). */
  bossId?: string;
  /** If true (Mirror-only pure case with no callback), show "no help here" banner. */
  mirrorNoHelp?: boolean;
  onPick?: (contact: SavedContact) => void;
}

export function ContactsSheet({ open, onClose, bossId, mirrorNoHelp, onPick }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    invokerRef.current = (document.activeElement as HTMLElement) ?? null;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      invokerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const boss = bossId ? BOSS_CONTACTS[bossId] ?? [] : [];
  const list = [...boss, ...BASE_CONTACTS];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contacts-sheet-title"
      className="absolute inset-0 z-40 flex items-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full rounded-t-2xl border-t border-white/10 bg-neutral-950 max-h-[80%] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-white/50 font-mono">SAVED CONTACTS</div>
            <div id="contacts-sheet-title" className="text-sm font-semibold text-white">Who do you actually know?</div>
          </div>
          <button ref={closeBtnRef} onClick={onClose} className="p-1.5 min-h-11 min-w-11 flex items-center justify-center text-white/60 hover:text-white" aria-label="Close contacts sheet">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mirrorNoHelp && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <ShieldOff className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-amber-100">No help here — read the conversation.</div>
              <div className="text-amber-200/70 mt-0.5">Nobody in your contacts is connected to this case. Verify inside the chat.</div>
            </div>
          </div>
        )}
        <ul className="flex-1 overflow-y-auto p-2">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onPick?.(c)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-mono font-bold border border-primary/30">
                  {c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                  <div className="truncate font-mono text-[10px] tracking-wider text-white/50">
                    {c.number}{c.role ? ` · ${c.role}` : ""}
                  </div>
                </div>
                {c.protocolMove && (
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 text-[10px] font-mono text-emerald-300">
                    <Phone className="h-3 w-3" /> CALL
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 px-4 py-2 text-[10px] font-mono tracking-wider text-white/40">
          The channel is the truth, not the story.
        </div>
      </div>
    </div>
  );
}
