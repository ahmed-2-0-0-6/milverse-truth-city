import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BadgeToast } from "@/components/BadgeToast";
import { VisualQualityProvider } from "@/lib/visual-quality";
import { AccessProvider } from "@/lib/access";
import { AtmosphereLayer } from "@/components/AtmosphereLayer";
import { GlowCursor } from "@/components/GlowCursor";
import { RouteWipe } from "@/components/RouteWipe";
import { RankUpBeat } from "@/components/RankUpBeat";
import { AssessmentGate } from "@/components/AssessmentGate";
import { Toaster } from "@/components/ui/sonner";
import { installTelemetry, track } from "@/lib/telemetry";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MILVERSE — Train your trust" },
      {
        name: "description",
        content:
          "MILVERSE is a media & information literacy city. Verify people, verify claims, and calibrate your trust — by doing, not by reading tips.",
      },
      { property: "og:title", content: "MILVERSE — Train your trust" },
      {
        property: "og:description",
        content: "Verify people, verify claims, and calibrate your trust — by doing, not by reading tips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MILVERSE — Train your trust" },
      { name: "twitter:description", content: "Verify people, verify claims, and calibrate your trust — by doing, not by reading tips." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d5a6420-ffd9-4775-8625-21924b3f113e/id-preview-9a528e14--b1bda37d-f290-471e-8242-1f3cfcf0f7d7.lovable.app-1784092810821.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d5a6420-ffd9-4775-8625-21924b3f113e/id-preview-9a528e14--b1bda37d-f290-471e-8242-1f3cfcf0f7d7.lovable.app-1784092810821.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      // Fonts are self-hosted via @fontsource in src/styles.css (LAYER-3)
      // The Daily Mirage — newsprint fonts (loaded via <link> per Tailwind v4 remote-import rule).
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" } as never,
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=UnifrakturCook:wght@700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    installTelemetry();
    // Log initial route + every navigation. Skip the passcode-gated
    // /devintel and /review so admin traffic doesn't pollute stats.
    const send = (path: string) => {
      if (path.startsWith("/devintel") || path.startsWith("/review")) return;
      track("route_visit", { route: path });
    };
    send(window.location.pathname + window.location.search);
    const unsub = router.subscribe("onResolved", (ev) => {
      const pathname = ev.toLocation?.pathname ?? window.location.pathname;
      const search = ev.toLocation?.searchStr ?? "";
      send(pathname + search);
    });
    return () => { unsub(); };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <AccessProvider>
        <VisualQualityProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <AssessmentGate />
          <main id="main">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <BadgeToast />
          <Toaster />
          <AtmosphereLayer />
          <GlowCursor />
          <RouteWipe />
          <RankUpBeat />
          <footer className="border-t border-border/60 bg-background/60 py-3 text-center text-[11px] text-muted-foreground">
            <Link to="/charter" className="font-mono tracking-widest hover:text-foreground">
              THE CITY CHARTER
            </Link>
            <span className="mx-2 opacity-40">·</span>
            <span className="italic">A city in the MILtiverse.</span>
          </footer>
        </VisualQualityProvider>
      </AccessProvider>
    </QueryClientProvider>
  );
}
