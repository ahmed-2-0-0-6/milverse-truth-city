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

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v7.4h12.7c-.3 2.1-1.6 5.3-4.7 7.4l7.6 5.9c4.5-4.2 6.5-10.3 6.5-16.6z" />
      <path fill="#FBBC05" d="M10.4 28.6a14.5 14.5 0 0 1 0-9.3l-7.8-6.1a24 24 0 0 0 0 21.5l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2 1.4-4.8 2.4-8.3 2.4-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(provider: "apple" | "google") {
    setBusy(provider);
    setError(null);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(
        provider === "apple"
          ? "Apple turned us down. Try again."
          : "Google turned us down. Try again.",
      );
      setBusy(null);
      return;
    }
    if (result.redirected) return;
    setBusy(null);
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
