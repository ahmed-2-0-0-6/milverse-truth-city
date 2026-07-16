import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  amount: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  /** Small tell that ONLY appears when scenario defines a mismatch (kept collapsed by default like real banking apps). */
  mismatchNote?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  reducedMotion?: boolean;
}

export function BankConfirmSheet({
  open, amount, beneficiaryName, beneficiaryAccount, mismatchNote,
  onCancel, onConfirm, reducedMotion,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const HOLD_MS = reducedMotion ? 300 : 1200;

  useEffect(() => { if (!open) { setHoldProgress(0); setDetailsOpen(false); } }, [open]);

  function beginHold() {
    startRef.current = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - startRef.current) / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        holdRef.current = null;
        onConfirm();
        return;
      }
      holdRef.current = requestAnimationFrame(tick);
    };
    holdRef.current = requestAnimationFrame(tick);
  }
  function endHold() {
    if (holdRef.current) cancelAnimationFrame(holdRef.current);
    holdRef.current = null;
    if (holdProgress < 1) setHoldProgress(0);
  }

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full bg-neutral-950 rounded-t-2xl border-t border-white/10 flex flex-col max-h-[92%] animate-in slide-in-from-bottom duration-200">
        {/* Bank-app header — noir, not iOS-clone */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-950 to-neutral-950 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-white text-xs font-black">CP</div>
            <div>
              <div className="text-sm font-semibold text-white">CitizenPay</div>
              <div className="text-[10px] font-mono tracking-wider text-white/50">Confirm transfer</div>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 text-white/60 hover:text-white" aria-label="Cancel">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="px-5 py-6 text-center border-b border-white/5">
          <div className="text-[10px] font-mono tracking-[0.3em] text-white/40">AMOUNT</div>
          <div className="mt-1 text-4xl font-bold text-white tracking-tight">{amount}</div>
        </div>

        {/* Beneficiary — full name shown, details collapsed */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="text-[10px] font-mono tracking-[0.3em] text-white/40 mb-1">TO</div>
          <div className="text-lg text-white font-semibold">{beneficiaryName}</div>
          <button
            onClick={() => setDetailsOpen((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
          >
            {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {detailsOpen ? "hide details" : "view details"}
          </button>
          {detailsOpen && (
            <div className="mt-3 rounded border border-white/10 bg-black/40 px-3 py-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-mono">Account</span>
                <span className="text-white font-mono">{beneficiaryAccount}</span>
              </div>
              {mismatchNote && (
                <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200 leading-snug">
                  {mismatchNote}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hold-to-confirm */}
        <div className="px-5 py-6">
          <button
            onMouseDown={beginHold}
            onTouchStart={beginHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchEnd={endHold}
            onTouchCancel={endHold}
            className={`relative w-full h-14 rounded-xl overflow-hidden border border-indigo-400/40 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold tracking-widest text-sm ${reducedMotion ? "" : "animate-[heartbeat_1.6s_ease-in-out_infinite]"}`}
          >
            <span
              className="absolute inset-y-0 left-0 bg-white/25 transition-none"
              style={{ width: `${holdProgress * 100}%` }}
            />
            <span className="relative flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {holdProgress > 0 ? "HOLDING…" : "HOLD TO CONFIRM TRANSFER"}
            </span>
          </button>
          <div className="mt-3 text-center text-[11px] text-white/50">
            Once confirmed, this cannot be reversed.
          </div>
          <button onClick={onCancel} className="mt-4 w-full py-2 text-sm text-white/60 hover:text-white">
            Cancel — go back to chat
          </button>
        </div>
      </div>
    </div>
  );
}
