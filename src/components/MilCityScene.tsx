// LAYER-7.5 — Premium canvas-driven MIL city for beat 4.
// Pure 2D canvas (no WebGL), DPR-aware, gated by IntersectionObserver so it
// costs zero when off-screen. Replaces the rooftop backdrop image with a
// fully live, layered "media literacy" skyline: parallax silhouettes,
// twinkling windows, broadcast antennas with pulsing signal rings, aviation
// lights, dot-matrix media facades, drifting helicopter with searchlight,
// blimp, highway light-streaks, rising data packets, rain veil, vignette.
//
// Respects prefers-reduced-motion (renders one static frame).
import { useEffect, useRef } from "react";

type Building = {
  x: number; w: number; h: number;
  layer: 0 | 1 | 2;            // 0 far, 1 mid, 2 near
  hue: number;                 // window hue
  windows: Uint8Array;         // per-window on/off intensity
  cols: number; rows: number;
  antenna?: { h: number; blink: number; ring?: boolean };
  screen?: { x: number; y: number; w: number; h: number; hue: number; phase: number };
  brand?: { text: string; hue: number };
};

type Heli = { x: number; y: number; vx: number; beam: number };
type Blimp = { x: number; y: number; vx: number };
type Streak = { x: number; y: number; vx: number; len: number; hue: number; a: number };
type Packet = { x: number; y: number; tx: number; ty: number; t: number; hue: number };
type Star = { x: number; y: number; r: number; tw: number };

const PALETTE = {
  skyTop: "#05080f",
  skyMid: "#0a1424",
  skyHorizon: "#183246",
  dawn: "#2a2a3a",
  fogTeal: "rgba(56,189,248,0.10)",
  fogAmber: "rgba(251,146,60,0.08)",
};

export function MilCityScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let W = 0, H = 0, DPR = 1;
    let buildings: Building[] = [];
    let stars: Star[] = [];
    let helis: Heli[] = [];
    let blimps: Blimp[] = [];
    let streaks: Streak[] = [];
    let packets: Packet[] = [];
    let mainAntennaX = 0, mainAntennaY = 0;

    function rand(a: number, b: number) { return a + Math.random() * (b - a); }
    function irand(a: number, b: number) { return Math.floor(rand(a, b + 1)); }

    function build() {
      const rect = wrap.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(320, Math.floor(rect.width));
      H = Math.max(320, Math.floor(rect.height));
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // Stars (upper sky)
      stars = [];
      const starCount = Math.floor((W * H) / 9000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: rand(0, W),
          y: rand(0, H * 0.55),
          r: rand(0.3, 1.2),
          tw: rand(0, Math.PI * 2),
        });
      }

      // Buildings across 3 parallax layers
      buildings = [];
      const layers: { z: 0 | 1 | 2; yBase: number; minW: number; maxW: number; minH: number; maxH: number; hueBase: number }[] = [
        { z: 0, yBase: H * 0.62, minW: 22, maxW: 52, minH: 60,  maxH: 140, hueBase: 200 },
        { z: 1, yBase: H * 0.74, minW: 36, maxW: 84, minH: 110, maxH: 240, hueBase: 195 },
        { z: 2, yBase: H * 0.88, minW: 60, maxW: 140, minH: 180, maxH: 360, hueBase: 30 },
      ];

      layers.forEach((L) => {
        let x = -20;
        while (x < W + 40) {
          const w = rand(L.minW, L.maxW);
          const h = rand(L.minH, Math.min(L.maxH, L.yBase - 20));
          const cols = Math.max(2, Math.floor(w / (L.z === 2 ? 9 : L.z === 1 ? 7 : 5)));
          const rows = Math.max(3, Math.floor(h / (L.z === 2 ? 11 : L.z === 1 ? 8 : 6)));
          const windows = new Uint8Array(cols * rows);
          for (let i = 0; i < windows.length; i++) {
            const on = Math.random() < (L.z === 2 ? 0.55 : L.z === 1 ? 0.45 : 0.35);
            windows[i] = on ? irand(120, 255) : 0;
          }
          const hue = L.hueBase + rand(-18, 18);
          const b: Building = {
            x, w, h, layer: L.z, hue, windows, cols, rows,
          };
          // Antennas on tall near/mid buildings
          if (L.z >= 1 && h > (L.z === 2 ? 240 : 170) && Math.random() < 0.55) {
            b.antenna = { h: rand(24, 60), blink: rand(0, Math.PI * 2), ring: L.z === 2 && Math.random() < 0.5 };
          }
          // Dot-matrix media screens
          if (L.z >= 1 && Math.random() < 0.35) {
            const sw = rand(w * 0.4, w * 0.8);
            const sh = rand(h * 0.18, h * 0.35);
            b.screen = {
              x: rand(w * 0.1, w - sw - w * 0.1),
              y: rand(h * 0.15, h * 0.55),
              w: sw, h: sh,
              hue: [180, 320, 260, 40][irand(0, 3)],
              phase: rand(0, Math.PI * 2),
            };
          }
          // Brand callouts on near buildings — MIL-flavored
          if (L.z === 2 && Math.random() < 0.35) {
            const words = ["MIL", "TRUTH", "VERIFY", "PRESS", "SIGNAL", "FACT"];
            b.brand = { text: words[irand(0, words.length - 1)], hue: [180, 40, 200][irand(0, 2)] };
          }
          buildings.push(b);
          x += w + rand(-2, 6);
        }
      });

      // Pick tallest near building as the main broadcast antenna
      let tallest: Building | null = null;
      buildings.forEach((b) => {
        if (b.layer === 2 && (!tallest || b.h + (b.antenna?.h ?? 0) > tallest.h + (tallest.antenna?.h ?? 0))) {
          tallest = b;
        }
      });
      if (tallest) {
        const t: Building = tallest;
        if (!t.antenna) t.antenna = { h: 70, blink: 0, ring: true };
        else { t.antenna.h = Math.max(t.antenna.h, 70); t.antenna.ring = true; }
        mainAntennaX = t.x + t.w / 2;
        mainAntennaY = H * 0.88 - t.h - t.antenna.h;
      }

      // Actors
      helis = [{ x: -80, y: H * 0.28, vx: 18, beam: 0 }];
      blimps = [{ x: W + 100, y: H * 0.18, vx: -4 }];
      streaks = [];
      packets = [];
    }

    let raf = 0;
    let last = performance.now();
    let t0 = performance.now();

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const T = (now - t0) / 1000;

      // Sky
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, PALETTE.skyTop);
      g.addColorStop(0.45, PALETTE.skyMid);
      g.addColorStop(0.78, PALETTE.skyHorizon);
      g.addColorStop(1, PALETTE.dawn);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Atmospheric fog washes
      const fog1 = ctx.createRadialGradient(W * 0.3, H * 0.25, 0, W * 0.3, H * 0.25, W * 0.6);
      fog1.addColorStop(0, PALETTE.fogTeal);
      fog1.addColorStop(1, "transparent");
      ctx.fillStyle = fog1;
      ctx.fillRect(0, 0, W, H);
      const fog2 = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, W * 0.55);
      fog2.addColorStop(0, PALETTE.fogAmber);
      fog2.addColorStop(1, "transparent");
      ctx.fillStyle = fog2;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.save();
      for (const s of stars) {
        const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(T * 1.4 + s.tw));
        ctx.fillStyle = `rgba(200,225,255,${a * 0.7})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Moon/dawn glow
      const moon = ctx.createRadialGradient(W * 0.82, H * 0.22, 0, W * 0.82, H * 0.22, 140);
      moon.addColorStop(0, "rgba(255,220,180,0.55)");
      moon.addColorStop(0.5, "rgba(255,180,120,0.12)");
      moon.addColorStop(1, "transparent");
      ctx.fillStyle = moon;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,235,205,0.9)";
      ctx.beginPath();
      ctx.arc(W * 0.82, H * 0.22, 26, 0, Math.PI * 2);
      ctx.fill();

      // Buildings — draw layer by layer
      for (let z = 0 as 0 | 1 | 2; z <= 2; z = (z + 1) as 0 | 1 | 2) {
        const yBase = z === 0 ? H * 0.62 : z === 1 ? H * 0.74 : H * 0.88;
        // Layer haze
        ctx.fillStyle = z === 0 ? "rgba(20,40,70,0.55)" : z === 1 ? "rgba(10,20,40,0.55)" : "rgba(0,0,0,0.0)";
        for (const b of buildings) {
          if (b.layer !== z) continue;
          const bx = b.x;
          const by = yBase - b.h;
          // Silhouette
          ctx.fillStyle = z === 0 ? "#0d1a2b" : z === 1 ? "#08111f" : "#03060b";
          ctx.fillRect(bx, by, b.w, b.h);

          // Windows
          const cw = b.w / b.cols;
          const rh = b.h / b.rows;
          const winW = Math.max(1, cw * 0.55);
          const winH = Math.max(1, rh * 0.5);
          for (let ry = 0; ry < b.rows; ry++) {
            for (let cx = 0; cx < b.cols; cx++) {
              const v = b.windows[ry * b.cols + cx];
              if (!v) continue;
              // Flicker: occasional twinkle
              const flick = 0.85 + 0.15 * Math.sin(T * 3 + cx * 1.7 + ry * 2.3 + b.x);
              const a = (v / 255) * flick * (z === 2 ? 1 : z === 1 ? 0.8 : 0.55);
              ctx.fillStyle = `hsla(${b.hue}, 80%, 65%, ${a})`;
              ctx.fillRect(bx + cx * cw + (cw - winW) / 2, by + ry * rh + (rh - winH) / 2, winW, winH);
            }
          }

          // Media screen facade
          if (b.screen) {
            const s = b.screen;
            const sx = bx + s.x, sy = by + s.y;
            // frame glow
            ctx.fillStyle = `hsla(${s.hue}, 90%, 55%, 0.10)`;
            ctx.fillRect(sx - 2, sy - 2, s.w + 4, s.h + 4);
            // scan bars
            const bars = 10;
            for (let i = 0; i < bars; i++) {
              const p = (T * 0.6 + s.phase + i / bars) % 1;
              const a = 0.15 + 0.45 * Math.sin(p * Math.PI);
              ctx.fillStyle = `hsla(${s.hue}, 90%, 60%, ${a})`;
              const yy = sy + (i / bars) * s.h;
              ctx.fillRect(sx, yy, s.w, s.h / bars * 0.6);
            }
            // moving scanline
            const scanY = sy + ((T * 40 + s.phase * 20) % s.h);
            ctx.fillStyle = `hsla(${s.hue}, 100%, 80%, 0.35)`;
            ctx.fillRect(sx, scanY, s.w, 2);
          }

          // Brand callout
          if (b.brand && z === 2) {
            ctx.font = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace";
            const tw = ctx.measureText(b.brand.text).width + 8;
            const th = 14;
            const tx = bx + (b.w - tw) / 2;
            const ty = by + b.h * 0.7;
            ctx.fillStyle = `hsla(${b.brand.hue}, 90%, 55%, 0.18)`;
            ctx.fillRect(tx, ty, tw, th);
            ctx.strokeStyle = `hsla(${b.brand.hue}, 90%, 65%, 0.45)`;
            ctx.lineWidth = 0.6;
            ctx.strokeRect(tx, ty, tw, th);
            ctx.fillStyle = `hsla(${b.brand.hue}, 100%, 80%, ${0.6 + 0.4 * Math.sin(T * 2 + b.x)})`;
            ctx.fillText(b.brand.text, tx + 4, ty + 10);
          }

          // Antenna
          if (b.antenna) {
            const ax = bx + b.w / 2;
            const ay = by;
            ctx.strokeStyle = "#0a1522";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax, ay - b.antenna.h);
            ctx.stroke();
            // cross struts
            ctx.lineWidth = 1;
            for (let k = 1; k < 4; k++) {
              const yy = ay - (b.antenna.h * k) / 4;
              const ww = 6 - k;
              ctx.beginPath();
              ctx.moveTo(ax - ww, yy);
              ctx.lineTo(ax + ww, yy);
              ctx.stroke();
            }
            // Aviation blink tip
            const blink = 0.5 + 0.5 * Math.sin(T * 3 + b.antenna.blink);
            ctx.fillStyle = `rgba(248,113,113,${0.4 + 0.6 * blink})`;
            ctx.beginPath();
            ctx.arc(ax, ay - b.antenna.h, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(248,113,113,${0.15 * blink})`;
            ctx.beginPath();
            ctx.arc(ax, ay - b.antenna.h, 7, 0, Math.PI * 2);
            ctx.fill();

            // Signal rings from main antenna
            if (b.antenna.ring && z === 2) {
              for (let k = 0; k < 3; k++) {
                const p = ((T * 0.45 + k / 3) % 1);
                const r = 10 + p * 220;
                const a = (1 - p) * 0.35;
                ctx.strokeStyle = `rgba(103,232,249,${a})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(ax, ay - b.antenna.h, r, 0, Math.PI * 2);
                ctx.stroke();
              }
              // Emit data packets occasionally
              if (Math.random() < 0.04) {
                packets.push({
                  x: ax, y: ay - b.antenna.h,
                  tx: rand(0, W), ty: rand(H * 0.1, H * 0.35),
                  t: 0, hue: [180, 40, 320][irand(0, 2)],
                });
              }
            }
          }
        }
      }

      // Highway light streaks along the horizon band
      if (Math.random() < 0.4 && streaks.length < 24) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        streaks.push({
          x: dir === 1 ? -30 : W + 30,
          y: H * (0.86 + Math.random() * 0.06),
          vx: dir * rand(120, 220),
          len: rand(30, 80),
          hue: Math.random() < 0.5 ? 40 : 200,
          a: rand(0.5, 0.9),
        });
      }
      streaks = streaks.filter((s) => s.x > -80 && s.x < W + 80);
      for (const s of streaks) {
        s.x += s.vx * dt;
        const grd = ctx.createLinearGradient(s.x - s.len, s.y, s.x + s.len, s.y);
        const c = `hsla(${s.hue}, 100%, 65%, ${s.a})`;
        grd.addColorStop(0, "transparent");
        grd.addColorStop(0.5, c);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(s.x - s.len, s.y - 1, s.len * 2, 2);
      }

      // Data packets flying from main antenna
      for (const p of packets) p.t += dt * 0.6;
      packets = packets.filter((p) => p.t < 1);
      for (const p of packets) {
        const x = p.x + (p.tx - p.x) * p.t;
        const y = p.y + (p.ty - p.y) * p.t - Math.sin(p.t * Math.PI) * 20;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${1 - p.t})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${0.25 * (1 - p.t)})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Blimp
      for (const bl of blimps) {
        bl.x += bl.vx * dt;
        if (bl.x < -120) bl.x = W + 120;
        ctx.save();
        ctx.translate(bl.x, bl.y);
        ctx.fillStyle = "rgba(190,205,220,0.9)";
        ellipse(ctx, 0, 0, 34, 10);
        ctx.fillStyle = "rgba(20,30,45,0.9)";
        ctx.fillRect(-6, 8, 12, 4);
        // Banner
        ctx.strokeStyle = "rgba(103,232,249,0.4)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-30, 14, 60, 10);
        ctx.fillStyle = `rgba(103,232,249,${0.5 + 0.5 * Math.sin(T * 3)})`;
        ctx.font = "700 8px ui-monospace, monospace";
        ctx.fillText("VERIFY · SIGNAL", -26, 22);
        ctx.restore();
      }

      // Helicopter with searchlight
      for (const h of helis) {
        h.x += h.vx * dt;
        h.y = H * 0.28 + Math.sin(T * 0.6) * 8;
        if (h.x > W + 80) h.x = -80;
        h.beam += dt;
        const bx = h.x, by = h.y;
        // Search beam
        const beamAngle = Math.sin(h.beam * 0.8) * 0.5 + Math.PI / 2;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(beamAngle - Math.PI / 2);
        const beam = ctx.createLinearGradient(0, 0, 0, 260);
        beam.addColorStop(0, "rgba(255,255,255,0.28)");
        beam.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-50, 260);
        ctx.lineTo(50, 260);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Body
        ctx.fillStyle = "rgba(15,20,30,0.95)";
        ellipse(ctx, bx, by, 10, 4);
        ctx.fillRect(bx - 2, by - 6, 1, 6);
        ctx.strokeStyle = "rgba(80,90,110,0.6)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(bx - 14, by - 6);
        ctx.lineTo(bx + 14, by - 6);
        ctx.stroke();
        // Blink
        const bl = 0.5 + 0.5 * Math.sin(T * 6);
        ctx.fillStyle = `rgba(248,113,113,${0.4 + 0.6 * bl})`;
        ctx.beginPath(); ctx.arc(bx - 8, by, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(103,232,249,${0.4 + 0.6 * (1 - bl)})`;
        ctx.beginPath(); ctx.arc(bx + 8, by, 1.4, 0, Math.PI * 2); ctx.fill();
      }

      // Foreground rooftop silhouette bar
      ctx.fillStyle = "#01030618";
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, H * 0.94, W, H * 0.06);
      // Rooftop antenna + satellite dish silhouettes
      drawRooftopProps(ctx, W, H, T);

      // Rain veil (thin, angular)
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = "rgba(170,200,230,1)";
      ctx.lineWidth = 0.6;
      const offset = (T * 260) % 24;
      for (let i = 0; i < 60; i++) {
        const x = ((i * 47) % W) - offset;
        const y = ((i * 91) % H);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4, y + 14);
        ctx.stroke();
      }
      ctx.restore();

      // Vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(frame);
    }

    function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
    }

    function drawRooftopProps(c: CanvasRenderingContext2D, W: number, H: number, T: number) {
      // Left: satellite dish
      c.save();
      c.translate(W * 0.08, H * 0.93);
      c.strokeStyle = "#000";
      c.fillStyle = "#0b1420";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, 0, 14, Math.PI, 0);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(0, 16);
      c.moveTo(-10, 16); c.lineTo(10, 16);
      c.stroke();
      // Signal ping
      c.strokeStyle = `rgba(103,232,249,${0.4 + 0.4 * Math.sin(T * 2)})`;
      c.beginPath();
      c.arc(0, -2, 20 + (T * 20) % 20, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      c.restore();

      // Right: press camera tripod silhouette
      c.save();
      c.translate(W * 0.9, H * 0.93);
      c.fillStyle = "#000";
      c.fillRect(-10, -8, 20, 10);
      c.fillRect(6, -12, 8, 6);
      c.strokeStyle = "#000"; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-6, 2); c.lineTo(-10, 22);
      c.moveTo(0, 2); c.lineTo(0, 22);
      c.moveTo(6, 2); c.lineTo(10, 22);
      c.stroke();
      // Red REC dot
      c.fillStyle = `rgba(248,113,113,${0.5 + 0.5 * Math.sin(T * 4)})`;
      c.beginPath(); c.arc(-6, -3, 1.6, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    // Init + IntersectionObserver gating
    build();
    let running = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !running && !reduced) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(frame);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      }
    }, { threshold: 0.05 });
    io.observe(wrap);

    // Static single-frame render if reduced motion
    if (reduced) frame(performance.now());

    const ro = new ResizeObserver(() => {
      build();
      if (reduced) frame(performance.now());
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
