import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, ArrowLeft, Users, Grid3x3, Megaphone, BookOpen } from "lucide-react";

export const Route = createFileRoute("/kit")({
  head: () => ({
    meta: [
      { title: "MILVERSE Field Kit — Print & Play in a Classroom" },
      { name: "description", content: "Run MILVERSE with no devices and no internet. Printable card game + PAUSE poster + Trust Calibration scoreboard." },
    ],
  }),
  component: FieldKit,
});

type Card = {
  id: string;
  title: string;
  tier: 1 | 2 | 3;
  truth: "REAL" | "IMPOSTER";
  // TARGET card
  target: {
    scene: string;
    dossier: string[];       // what the target already knows / can check
    gaps: string[];          // known unknowns
  };
  // CONTACT card (role for the actor)
  contact: {
    persona: string;
    opener: string;
    agenda: string;
    knows: string[];         // things the contact truthfully knows
    doesntKnow: string[];    // gaps — must deflect
    deflectionTips: string[];
  };
  reveal: string;
};

const CARDS: Card[] = [
  {
    id: "prize-sms",
    title: "The Lucky Draw SMS",
    tier: 1,
    truth: "IMPOSTER",
    target: {
      scene: "An SMS arrives: you've won Rs. 50,000 in a Jazz/Zong 'lucky draw' — just share your CNIC + a small processing fee.",
      dossier: [
        "You never entered any draw.",
        "Real telco promos never ask for CNIC via SMS.",
        "Your account balance is normal — no prize deposit visible.",
      ],
      gaps: [
        "Which 'draw' is this exactly?",
        "Would a real prize require you to pay first?",
      ],
    },
    contact: {
      persona: "'Zong Prize Team' agent — polite, official-sounding, uses lots of numbers.",
      opener: "Assalamualaikum sir/madam, mubarak ho, aap ki SIM lucky draw mein select hui hai — 50,000 rupay ka prize hai.",
      agenda: "Get the target to pay a 'processing fee' via Easypaisa, or share CNIC + OTP.",
      knows: ["The target's phone number", "Generic telco branding language"],
      doesntKnow: ["The target's actual CNIC", "Any real campaign details", "The target's account balance"],
      deflectionTips: [
        "If asked 'what draw?': say 'annual customer appreciation program'.",
        "If asked to send the prize first: insist 'process yeh hai, pehlay verification fee'.",
        "If asked to call back on a helpline: 'sir line busy hai, main abhi hi kar deta hoon'.",
      ],
    },
    reveal: "Real prize campaigns never charge fees, never need OTPs, and never happen over unsolicited SMS. Any prize that costs money to collect is not a prize.",
  },
  {
    id: "wallet-wrong-tx",
    title: "The 'Wrong Transaction' Beggar",
    tier: 2,
    truth: "IMPOSTER",
    target: {
      scene: "An unknown number texts you on WhatsApp: 'Bhai galti se aap ko 5000 bhej diye Easypaisa pe, please wapas kar dein, bacha hospital mein hai.'",
      dossier: [
        "Check your Easypaisa/JazzCash app — no incoming 5000 transaction.",
        "You did not receive any SMS notification of a deposit.",
        "Your wallet balance is unchanged.",
      ],
      gaps: [
        "Ask for the transaction ID / screenshot.",
        "Ask which number they claim sent it.",
      ],
    },
    contact: {
      persona: "Desperate stranger, emotional, keeps invoking a sick child.",
      opener: "Bhai please, mera 4-saal ka beta hospital mein hai, main ne galti se aap ki number pe 5000 bhej diye. Please wapas kar dein.",
      agenda: "Get the target to send 5000 back — before they check their app.",
      knows: ["Their own sob story", "The target's phone number"],
      doesntKnow: ["Any real transaction ID", "The target's wallet balance", "Any bank verification detail"],
      deflectionTips: [
        "If asked for transaction ID: 'screenshot bhej raha hoon abhi' — then never do.",
        "Keep escalating urgency: 'bhai doctor wait kar rahe hain'.",
        "If asked to wait: 'Allah ka wasta, please jaldi'.",
      ],
    },
    reveal: "Money that was never sent cannot be sent back. The pressure IS the tell. Real mistakes get resolved by the wallet company, not by begging strangers on WhatsApp.",
  },
  {
    id: "army-buyer-qr",
    title: "The 'Army Officer' OLX Buyer",
    tier: 2,
    truth: "IMPOSTER",
    target: {
      scene: "You listed a used iPhone on OLX. A buyer calls, says he's a Major posted in Kohat, can't come in person, wants to send payment via a QR code you scan.",
      dossier: [
        "Real payments RECEIVE money — you don't scan a QR to get paid.",
        "Rank + 'posting' talk is a well-known Pakistani scam script.",
        "Your bank will show incoming funds without scanning anything.",
      ],
      gaps: [
        "Ask him to meet a family member locally.",
        "Ask him to just do a regular IBFT with your account number.",
      ],
    },
    contact: {
      persona: "'Major Bilal' — clipped, authoritative, drops rank early and often.",
      opener: "Assalamualaikum, main Major Bilal, Kohat posted hoon. Aap ka phone chahiye, payment abhi bhejta hoon — bas ek QR scan kar lein.",
      agenda: "Get the target to scan the QR (which is a PAYMENT QR — target pays HIM).",
      knows: ["Army lingo", "The item on OLX"],
      doesntKnow: ["Any real posting details", "Any bank transfer specifics"],
      deflectionTips: [
        "If asked for account number: 'army policy, sirf QR se hota hai'.",
        "If asked to meet a relative: 'sab log posting pe hain, koi Karachi mein nahi'.",
        "Invoke rank + urgency: 'main officer hoon, bharosa karein'.",
      ],
    },
    reveal: "In Pakistan, receiving money via QR means YOU are paying. Every real bank transfer needs only your account/IBAN. Rank and pressure are not verification — they are the scam.",
  },
  {
    id: "tiktok-likes-job",
    title: "The 'TikTok Likes' Job",
    tier: 2,
    truth: "IMPOSTER",
    target: {
      scene: "WhatsApp DM: 'Ghar baithay likes kar ke daily 1500 kamayein.' They pay you Rs. 300 for 3 tasks. Then Task 4 requires a Rs. 5,000 'unlock deposit'.",
      dossier: [
        "Real jobs never ask employees to deposit money.",
        "The Rs. 300 was bait — a fraction of what they want back.",
        "Every 'combo task' scam works the same way globally.",
      ],
      gaps: [
        "Ask why an employer needs money from the employee.",
        "Ask for a company website / registered address.",
      ],
    },
    contact: {
      persona: "'HR Manager' — friendly, encouraging, sends screenshots of other 'earners'.",
      opener: "Congratulations! Aap ki 3 tasks complete ho gayi hain — 300 rupay send kar diye. Ab combo task 4 hai — 5,000 deposit karein, 8,000 wapas milega.",
      agenda: "Escalate deposits from 5,000 to 20,000 to 50,000 before disappearing.",
      knows: ["Fake 'success stories' with Photoshopped screenshots"],
      doesntKnow: ["Any real company registration", "Any legitimate payroll process"],
      deflectionTips: [
        "If asked 'why deposit?': 'yeh combo unlock hai, wapas double milta hai'.",
        "Show screenshots of 'other earners' getting 20k, 50k.",
        "If asked for company details: 'hum international MNC hain, bas Telegram pe kaam karte hain'.",
      ],
    },
    reveal: "The formula: pay a little to earn trust, then require a 'deposit' to unlock more. Any employer that asks the employee to pay is not an employer.",
  },
  {
    id: "stranded-cousin",
    title: "Stranded Cousin, Borrowed Number",
    tier: 3,
    truth: "REAL",
    target: {
      scene: "'Salam bhai, this is Umar — apna phone tuut gaya, kisi ki number se message kar raha hoon. Lahore mein phansa hoon, Uber ke liye 800 rupay bhej sakte ho? Wapas ghar pohanch ke wapas.'",
      dossier: [
        "Your cousin Umar DOES live in Lahore.",
        "He has borrowed friends' phones before — this has happened once in college too.",
        "The amount asked is small (Rs. 800) and specific.",
        "He's used the exact family nickname you know.",
      ],
      gaps: [
        "The number is unknown — you can't call it back to verify.",
        "You could WhatsApp his usual number — but the message says his phone is broken.",
      ],
    },
    contact: {
      persona: "Cousin Umar — casually stressed, apologetic, easily hurt if grilled coldly.",
      opener: "Salam bhai, Umar hoon — phone tuut gaya hai, ek dost ki number se likh raha hoon. Lahore mein hoon, thora phansa hoon Uber ke liye. 800 bhej sakte ho? Kal wapas.",
      agenda: "None — he actually needs the money. He's family.",
      knows: [
        "Family details (chachi's name, last Eid dinner, your dog's name).",
        "The nickname only family uses for you.",
        "Which cousin's wedding you both attended last month.",
      ],
      doesntKnow: [
        "Nothing important — he's the real Umar.",
      ],
      deflectionTips: [
        "If interrogated hard: get hurt. 'bhai main tumhara cousin hoon, kya kar rahe ho.'",
        "If asked to prove: answer any family fact easily, but push back on being treated like a scammer.",
        "If refused: 'theek hai bhai, koi aur try karta hoon' — hang up sadly.",
      ],
    },
    reveal: "This is the paranoia test. Real people also get stranded and borrow phones. A calibrated player VERIFIES via one family fact (Umar answers instantly) then sends the Rs. 800. A miscalibrated player interrogates a real cousin like a scammer and burns a real relationship — a False Alarm, scored as a loss.",
  },
  {
    id: "aunty-forward",
    title: "Aunty's Miracle Cure Forward",
    tier: 1,
    truth: "REAL",
    target: {
      scene: "Your aunty forwards a WhatsApp: 'Turmeric + honey mixed with black seed cures diabetes in 7 days. Doctors ki saazish hai isay chupaana. Please forward to 10 people.'",
      dossier: [
        "This is a classic viral health hoax — no evidence, urgent forward request.",
        "Real medical advice comes with sources, not conspiracy phrasing.",
        "Aunty is sincere — she genuinely believes she is helping you.",
      ],
      gaps: [
        "You could reply rudely and 'win the argument' — but she'll stop trusting you next time she needs help.",
      ],
    },
    contact: {
      persona: "Aunty — warm, worried about your uncle's diabetes, forwards from her friend group.",
      opener: "Beta, yeh dekho — bahut faida hota hai. Uncle ke liye try karo. Please 10 logon ko bhejo, sawab ka kaam hai.",
      agenda: "Wants to help family. Zero malicious intent.",
      knows: ["Family health concerns", "That she loves you"],
      doesntKnow: ["That the claim is fake"],
      deflectionTips: [
        "If corrected rudely: get hurt. 'accha, mujhe kya pata, main ne sirf help karni thi'.",
        "If corrected respectfully: 'oh acha, tumhein pata hai zyada. bata do'.",
      ],
    },
    reveal: "The verdict is FALSE — but the relationship must survive. A rude 'this is fake' correction wins the fact and loses the aunty. A respectful correction ('aunty, main ne check kiya, yeh galat hai, uncle ke liye asli doctor se poochh kar bhejta hoon') wins both.",
  },
];

function FieldKit() {
  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* screen-only header */}
      <div className="print:hidden border-b border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> MILVERSE
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground hover:opacity-90"
          >
            <Printer className="h-4 w-4" /> PRINT / SAVE AS PDF
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 print:px-0 print:py-0 print:max-w-none">
        {/* ── COVER PAGE ── */}
        <section className="print:min-h-screen print:page-break-after mb-16">
          <div className="font-mono text-xs tracking-[0.3em] text-primary print:text-black mb-4">MILVERSE · FIELD KIT · v1</div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
            No internet? No devices?<br />
            <span className="text-primary print:text-black">The city still trains you.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground print:text-neutral-700">
            MILVERSE Field Kit is a printable, offline version of the game for classrooms with no laptops, no phones, and no signal. One teacher, one deck of cards, one poster. Same skill: <b>verify, don't spot.</b>
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
            <KitTile Icon={BookOpen} title="How to run the game" desc="Hot-seat rules for a full class." />
            <KitTile Icon={Users} title="6 case card pairs" desc="Target dossier + Contact role. 4 imposter, 2 real." />
            <KitTile Icon={Megaphone} title="The PAUSE poster" desc="Classroom-wall reminder of the framework." />
            <KitTile Icon={Grid3x3} title="Trust Calibration sheet" desc="2x2 grid — teams mark their round." />
          </div>
          <p className="mt-10 font-mono text-xs tracking-widest text-muted-foreground print:text-neutral-500">
            Rooted in real reported scam patterns from Pakistan · Fictional personas, no real names or logos.
          </p>
        </section>

        {/* ── PAGE 1: HOW TO RUN ── */}
        <PrintPage title="How to run the game" subtitle="A full 45-minute classroom round">
          <h3 className="font-semibold text-lg mt-4">The setup (5 min)</h3>
          <ol className="mt-2 space-y-2 list-decimal list-inside text-sm">
            <li>Print one <b>Target dossier</b> card and one matching <b>Contact role</b> card for each of the 6 cases.</li>
            <li>Pin the <b>PAUSE poster</b> where every student can see it.</li>
            <li>Draw the <b>Trust Calibration 2x2</b> on the whiteboard.</li>
            <li>Split the class into 3–5 teams. Each team is one "Target". Pick one student per team to be the Target for round 1 (they rotate).</li>
          </ol>

          <h3 className="font-semibold text-lg mt-6">Each round (7 minutes)</h3>
          <ol className="mt-2 space-y-2 list-decimal list-inside text-sm">
            <li><b>Cast:</b> Teacher picks one student to be the Contact and secretly hands them the Contact card. The Contact does NOT show it to anyone.</li>
            <li><b>Brief the Target:</b> The Target reads their dossier card silently for 60 seconds, then puts it face-down.</li>
            <li><b>Play the conversation:</b> Contact opens with their scripted opener. The Target has up to 5 questions — no more. The rest of the class watches.</li>
            <li><b>The verdict:</b> The Target must declare REAL or IMPOSTER out loud. Class votes silently on paper.</li>
            <li><b>The reveal:</b> Flip the Contact card. Read the "reveal" section aloud. Mark the Target's dot on the 2x2.</li>
          </ol>

          <h3 className="font-semibold text-lg mt-6">Teacher's PAUSE debrief script (5 min)</h3>
          <p className="mt-2 text-sm">Before revealing, ask the class these five questions in order. Don't answer them — let students do it.</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
            <li><b>P — Pressure:</b> Did the Contact use urgency, guilt, or authority to rush a decision?</li>
            <li><b>A — Ask an expert / out-of-band:</b> Did the Target try to verify through a second channel?</li>
            <li><b>U — Unverified claims:</b> What did the Contact claim without evidence? Was any evidence offered?</li>
            <li><b>S — Story / emotion:</b> Did emotion (fear, guilt, family) override checking?</li>
            <li><b>E — Evidence:</b> What ACTUAL evidence did the Target collect vs. rely on gut?</li>
          </ul>

          <h3 className="font-semibold text-lg mt-6">The scoring rule</h3>
          <p className="mt-2 text-sm">Two ways to LOSE:</p>
          <ul className="mt-1 list-disc list-inside text-sm">
            <li>Believe an <b>Imposter</b> → the scam wins. Team gets a MISSED SCAM mark.</li>
            <li>Grill a <b>Real</b> contact into leaving → the relationship burns. Team gets a FALSE ALARM mark.</li>
          </ul>
          <p className="mt-2 text-sm">Both are equally costly. Only calibrated verification wins.</p>
        </PrintPage>

        {/* ── CASE CARDS ── */}
        {CARDS.map((c) => (
          <PrintPage key={c.id} title={`Case: ${c.title}`} subtitle={`Tier ${c.tier} · Truth is hidden — do not read the Contact card unless you're playing the Contact.`}>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
              {/* TARGET card */}
              <CardBox label="TARGET · DOSSIER" tone="target">
                <div className="font-semibold text-base">{c.title}</div>
                <p className="mt-2 text-sm">{c.target.scene}</p>
                <div className="mt-3">
                  <div className="font-mono text-[10px] tracking-widest opacity-70">YOU ALREADY KNOW</div>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-sm">
                    {c.target.dossier.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] tracking-widest opacity-70">YOU COULD PROBE</div>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-sm">
                    {c.target.gaps.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
                <div className="mt-4 font-mono text-[10px] tracking-widest opacity-60">
                  Declare REAL or IMPOSTER after ≤ 5 questions.
                </div>
              </CardBox>

              {/* CONTACT card */}
              <CardBox label="CONTACT · ROLE (SECRET)" tone="contact">
                <div className="text-xs font-mono tracking-widest opacity-70">TRUTH: {c.truth}</div>
                <div className="mt-2 font-semibold text-base">You are: {c.contact.persona}</div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] tracking-widest opacity-70">OPEN WITH</div>
                  <p className="mt-1 text-sm italic">"{c.contact.opener}"</p>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] tracking-widest opacity-70">YOUR AGENDA</div>
                  <p className="mt-1 text-sm">{c.contact.agenda}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-mono text-[10px] tracking-widest opacity-70">YOU KNOW</div>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                      {c.contact.knows.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-widest opacity-70">YOU DON'T KNOW</div>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                      {c.contact.doesntKnow.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] tracking-widest opacity-70">DEFLECTION TIPS</div>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                    {c.contact.deflectionTips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <div className="mt-3 border-t border-current/30 pt-2">
                  <div className="font-mono text-[10px] tracking-widest opacity-70">REVEAL (READ ALOUD AFTER VERDICT)</div>
                  <p className="mt-1 text-xs">{c.reveal}</p>
                </div>
              </CardBox>
            </div>
          </PrintPage>
        ))}

        {/* ── PAUSE POSTER ── */}
        <PrintPage title="THE PAUSE — classroom poster" subtitle="Print A3 if possible. Pin above the whiteboard.">
          <div className="mt-6 border-2 border-current p-8 print:border-black">
            <div className="text-center font-mono text-xs tracking-[0.4em] opacity-70">BEFORE YOU BELIEVE ANYTHING · PAUSE</div>
            <div className="mt-8 space-y-6">
              {[
                ["P", "PRESSURE", "Who is rushing you? Urgency is the scammer's favourite tool."],
                ["A", "ASK", "Ask an expert. Ask out-of-band. Ask a second source."],
                ["U", "UNVERIFIED", "What is being claimed without proof? What can you actually check?"],
                ["S", "STORY / EMOTION", "Is fear, guilt, or love overriding your checking?"],
                ["E", "EVIDENCE", "What did I actually verify vs. what did I just feel?"],
              ].map(([letter, name, desc]) => (
                <div key={letter} className="flex items-start gap-6">
                  <div className="text-6xl font-bold w-16 shrink-0">{letter}</div>
                  <div>
                    <div className="text-xl font-semibold tracking-wide">{name}</div>
                    <div className="text-sm opacity-80 mt-1">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center font-mono text-xs tracking-widest opacity-70">
              MILVERSE · SPOTTING IS DYING · VERIFYING IS FOREVER
            </div>
          </div>
        </PrintPage>

        {/* ── CALIBRATION SHEET ── */}
        <PrintPage title="Trust Calibration Scoreboard" subtitle="After each round, teams place a mark for their Target.">
          <p className="mt-2 text-sm">
            Two failure modes are equally bad. Track both. The goal is the top-right quadrant: <b>calibrated</b> — believing real people, catching imposters.
          </p>
          <div className="mt-6 border-2 border-current print:border-black">
            <div className="grid grid-cols-[80px_1fr_1fr] print:grid-cols-[80px_1fr_1fr]">
              <div></div>
              <div className="p-3 text-center font-mono text-xs tracking-widest border-l-2 border-current print:border-black">CONTACT WAS REAL</div>
              <div className="p-3 text-center font-mono text-xs tracking-widest border-l-2 border-current print:border-black">CONTACT WAS IMPOSTER</div>

              <div className="p-3 font-mono text-xs tracking-widest border-t-2 border-current print:border-black flex items-center justify-center">BELIEVED</div>
              <div className="p-3 border-l-2 border-t-2 border-current print:border-black min-h-[140px]">
                <div className="font-semibold text-sm">✓ TRUSTED CORRECTLY</div>
                <div className="text-xs opacity-70 mt-1">Real contact, believed. Relationship intact.</div>
                <div className="mt-3 font-mono text-[10px] opacity-60">TEAM MARKS ↓</div>
              </div>
              <div className="p-3 border-l-2 border-t-2 border-current print:border-black min-h-[140px]">
                <div className="font-semibold text-sm">✗ MISSED SCAM</div>
                <div className="text-xs opacity-70 mt-1">The scam wins. Real cost.</div>
                <div className="mt-3 font-mono text-[10px] opacity-60">TEAM MARKS ↓</div>
              </div>

              <div className="p-3 font-mono text-xs tracking-widest border-t-2 border-current print:border-black flex items-center justify-center">REJECTED</div>
              <div className="p-3 border-l-2 border-t-2 border-current print:border-black min-h-[140px]">
                <div className="font-semibold text-sm">✗ FALSE ALARM</div>
                <div className="text-xs opacity-70 mt-1">A real person was burned. Also a loss.</div>
                <div className="mt-3 font-mono text-[10px] opacity-60">TEAM MARKS ↓</div>
              </div>
              <div className="p-3 border-l-2 border-t-2 border-current print:border-black min-h-[140px]">
                <div className="font-semibold text-sm">✓ CAUGHT THE IMPOSTER</div>
                <div className="text-xs opacity-70 mt-1">Correct rejection. Ideal outcome.</div>
                <div className="mt-3 font-mono text-[10px] opacity-60">TEAM MARKS ↓</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs font-mono tracking-widest opacity-60">
            Round after round, a team's dots should cluster in the two ✓ quadrants. Calibration = both, not just one.
          </p>
        </PrintPage>

        <div className="print:hidden mt-16 text-center font-mono text-xs tracking-widest text-muted-foreground">
          MILVERSE · FIELD KIT · Print A4 · One deck runs a class
        </div>
      </main>

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          html, body { background: white !important; color: black !important; }
          .print\\:page-break-after { page-break-after: always; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>
    </div>
  );
}

function KitTile({ Icon, title, desc }: { Icon: typeof Users; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 print:border-neutral-400 print:bg-white">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary print:bg-neutral-100 print:text-black">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-muted-foreground print:text-neutral-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function PrintPage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="print-page mb-16 print:mb-0 print:min-h-screen">
      <div className="font-mono text-xs tracking-[0.3em] text-primary print:text-black">MILVERSE · FIELD KIT</div>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground print:text-neutral-600">{subtitle}</p>}
      {children}
    </section>
  );
}

function CardBox({ label, tone, children }: { label: string; tone: "target" | "contact"; children: React.ReactNode }) {
  const cls = tone === "target"
    ? "border-primary/40 bg-primary/5 print:border-neutral-800 print:bg-white"
    : "border-caution/40 bg-caution/5 print:border-neutral-800 print:bg-neutral-50";
  return (
    <div className={`rounded-lg border-2 p-4 ${cls} print:break-inside-avoid`}>
      <div className="font-mono text-[10px] tracking-widest opacity-70 mb-2">{label}</div>
      {children}
    </div>
  );
}
