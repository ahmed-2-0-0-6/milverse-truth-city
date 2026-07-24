import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign In — MILVERSE" },
      {
        name: "description",
        content:
          "Sign in to MILVERSE with Apple. Optional. Your case work stays on your device either way.",
      },
      { property: "og:title", content: "Sign In — MILVERSE" },
      {
        property: "og:description",
        content: "Sign in to MILVERSE with Apple. Optional — play stays local.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AppleGlyph() {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function AuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Apple turned us down. Try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-16 text-amber-100">
      <div className="mx-auto w-full max-w-sm">
        <div className="stencil text-[10px] tracking-widest text-amber-300">
          CITY DESK · ACCESS
        </div>
        <h1
          className="mt-2 text-3xl font-black leading-tight text-amber-100"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          SIGN IN
        </h1>
        <p className="mt-2 text-sm text-amber-200/70">
          Optional. Cases and progress live on this device. Signing in only carries
          your file between devices.
        </p>

        <div className="mt-8 rounded-lg border border-amber-400/30 bg-black/40 p-5">
          {user ? (
            <>
              <div className="text-[11px] uppercase tracking-widest text-amber-300/70">
                Signed in
              </div>
              <div className="mt-1 truncate text-sm text-amber-100">
                {user.email ?? user.id}
              </div>
              <button
                onClick={signOut}
                className="tap mt-4 w-full rounded-sm border border-amber-400/40 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-400/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={signIn}
                disabled={busy}
                className="tap flex w-full items-center justify-center gap-2 rounded-sm bg-amber-100 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
              >
                <AppleGlyph />
                {busy ? "Talking to Apple\u2026" : "Continue with Apple"}
              </button>
              {error ? (
                <p className="mt-3 text-xs text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        <Link
          to="/"
          className="mt-6 inline-block text-xs text-amber-200/60 underline underline-offset-4 hover:text-amber-100"
        >
          Back to the city
        </Link>
      </div>
    </main>
  );
}
