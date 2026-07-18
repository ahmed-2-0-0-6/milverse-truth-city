// MILVERSE — Voicemail sheet. Plays the caller's voice note through the
// existing VoiceNote UI (transcript visible), then links to the case.

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { VoiceNote } from "@/components/VoiceNote";
import { markOpened } from "@/lib/inbox/profile";
import type { InboxItem } from "@/lib/inbox/scheduler";

interface Props {
  item: InboxItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoicemailSheet({ item, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  // Mark arrived-only until the player actually opens the chat.
  // Escape → sheet close is handled by <SheetContent>.
  useEffect(() => {
    // no-op; markArrived already fired at call end.
  }, [item.id]);

  function openChat() {
    markOpened(item.id);
    onOpenChange(false);
    navigate({ to: item.route });
  }

  const voicemailText = item.voicemailText || "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto p-0"
        aria-label="Voicemail"
      >
        <div className="border-b border-border px-5 py-4">
          <SheetTitle className="stencil text-sm text-foreground">VOICEMAIL</SheetTitle>
          <SheetDescription className="mt-1 text-xs text-muted-foreground">
            From <span className="font-semibold text-foreground">{item.senderName}</span>
            {item.number ? (
              <>
                {" "}
                · <span className="font-mono">{item.number}</span>
              </>
            ) : null}
          </SheetDescription>
          <div className="mt-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
            Not in your contacts. The name is what they claim.
          </div>
        </div>

        <div className="px-5 py-6">
          {voicemailText ? (
            <VoiceNote
              voice={{ text: voicemailText }}
              speakerName={item.senderName}
              speakerVoiceDesc={item.speakerVoiceDesc}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              The line went dead before anything came through.
            </p>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            onClick={openChat}
            className="w-full rounded border border-primary/60 bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            OPEN THE CHAT →
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
