import { Link } from "@tanstack/react-router";
import { setActive } from "@/lib/firstPhone/profile";
import { useState } from "react";
import { ShieldCheck, Car, Users, Award } from "lucide-react";

export function ParentPitch({ onStart }: { onStart: () => void }) {
  const [name, setName] = useState("");

  function start() {
    setActive(true, name.trim() || "Citizen");
    onStart();
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="font-mono text-[11px] tracking-widest text-primary">FIRST PHONE PROGRAM</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold leading-tight">
          Your first phone shouldn't be real.
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          A 10-lesson program that gives kids a phone that <em>feels</em> real inside MILVERSE — scams, forwards, impersonators and all — so their first real phone isn't their first real test.
        </p>
      </header>

      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 flex items-start gap-4">
        <Car className="h-6 w-6 text-primary flex-none mt-1" />
        <div>
          <div className="font-semibold">We don't hand over car keys without lessons.</div>
          <div className="text-sm text-muted-foreground mt-1">
            Phones shouldn't be different. This is driver's ed for the phone.
          </div>
        </div>
      </div>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="font-mono text-[10px] tracking-widest text-primary">WHAT'S COVERED</div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>· Prize / giveaway scams and phishing</li>
            <li>· Chain forwards and viral rumors</li>
            <li>· Impersonation (\"new number, it's me\")</li>
            <li>· Out-of-context photos and reverse search</li>
            <li>· AI-generated voices and images</li>
            <li>· When to hold, when to ask an adult</li>
          </ul>
        </div>
        <div className="rounded-xl border border-caution/40 bg-caution/5 p-5">
          <div className="font-mono text-[10px] tracking-widest text-caution">WHAT'S EXPLICITLY NOT</div>
          <p className="mt-3 text-sm">
            This program does <strong>not</strong> simulate predatory contact, romance, or body-image pressure.
            That domain belongs to child-safety professionals — see our resources page for organizations that specialize in it.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-4 w-4" />
          <span className="font-mono text-[10px] tracking-widest">FAMILY CODE</span>
        </div>
        <p className="mt-2 text-sm">
          Create a code, share it with your kid. You see skills, badges, and the license status — never conversation content.
        </p>
        <Link to="/family" className="mt-3 inline-block text-sm text-primary hover:underline">Set up a Family Code →</Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <Award className="h-4 w-4" />
          <span className="font-mono text-[10px] tracking-widest">THE LICENSE</span>
        </div>
        <p className="mt-2 text-sm">
          Finish all 10 lessons and the city issues the <strong>First Phone License</strong> — a printable card frameable on the fridge.
          Ten endorsements, city seal, license number. Zero personal data required.
        </p>
      </section>

      <div className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-6">
        <div className="font-mono text-[10px] tracking-widest text-primary">READY?</div>
        <label className="block mt-3 text-xs text-muted-foreground">Kid's chosen city-name (for the license — nickname is fine)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rania"
          maxLength={24}
          className="mt-1 w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={start}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <ShieldCheck className="h-4 w-4" /> Start the program
        </button>
        <p className="mt-4 text-xs text-muted-foreground italic">
          Other tools childproof the phone. MILVERSE phone-proofs the child.
        </p>
      </div>
    </div>
  );
}
