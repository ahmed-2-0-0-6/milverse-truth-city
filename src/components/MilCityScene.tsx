// LAYER-7.5 — Premium canvas MIL city for beat 4.
// Two-stage render: heavy static geometry (skyline silhouettes, base windows,
// bridge, road) is baked into an offscreen canvas on build/resize. Per-frame
// only paints the animated overlay: window flicker + bloom, neon billboards,
// dot-matrix scan facades, signal rings, aviation blinks, packet bursts,
// helicopter + searchlight cone, car headlight/taillight streams, drifting
// clouds, wet-street reflections, rain veil, film grain, vignette.
// IntersectionObserver-gated. Respects prefers-reduced-motion.
import { useEffect, useRef } from "react";

type Layer = 0 | 1 | 2;

type Window = { x: number; y: number; w: number; h: number; hue: number; base: number; phase: number; layer: Layer };
type Building = {
  x: number; w: number; h: number; layer: Layer;
  yTop: number;
  antenna?: { h: number; struts: number; blink: number; ring?: boolean };
  spire?: number;
  watertank?: boolean;


  crown?: { hue: number; phase: number }; // rooftop crown lights
};

type Car = { lane: number; x: number; dir: 1 | -1; speed: number };
type Packet = { x: number; y: number; tx: number; ty: number; t: number; hue: number };

const SKY = {
  top: "#04070d",
  mid: "#0a1626",
  horizon: "#1a3348",
  glow: "#3a3040",
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
    let windowsByLayer: Window[][] = [[], [], []];
    let bakedSky: HTMLCanvasElement | null = null;      // sky + stars + fog + moon
    let bakedCity: HTMLCanvasElement | null = null;     // silhouettes + base windows + bridge + road
    let bakedNoise: HTMLCanvasElement | null = null;    // film grain tile
    let cars: Car[] = [];
    let packets: Packet[] = [];
    let mainAnt: { x: number; y: number } | null = null;
    let bridge: { x1: number; x2: number; y: number; pylons: number[]; deckH: number } | null = null;

    const R = (a: number, b: number) => a + Math.random() * (b - a);
    const IR = (a: number, b: number) => Math.floor(R(a, b + 1));
    const CHOICE = <T,>(arr: T[]) => arr[IR(0, arr.length - 1)];

    function makeOffscreen(w: number, h: number) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.floor(w * DPR));
      c.height = Math.max(1, Math.floor(h * DPR));
      c.style.width = w + "px";
      c.style.height = h + "px";
      const g = c.getContext("2d")!;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      return { c, g };
    }

    function bakeNoise() {
      const size = 128;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const g = c.getContext("2d")!;
      const img = g.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 200 + Math.random() * 55;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = Math.random() * 26;
      }
      g.putImageData(img, 0, 0);
      bakedNoise = c;
    }

    function bakeSky() {
      const { c, g } = makeOffscreen(W, H);

      // Sky gradient
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, SKY.top);
      grd.addColorStop(0.45, SKY.mid);
      grd.addColorStop(0.78, SKY.horizon);
      grd.addColorStop(1, SKY.glow);
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);

      // Stars
      const starCount = Math.floor((W * H) / 6500);
      for (let i = 0; i < starCount; i++) {
        const x = R(0, W), y = R(0, H * 0.55);
        const a = R(0.15, 0.75);
        g.fillStyle = `rgba(210,225,245,${a})`;
        g.fillRect(x, y, R(0.3, 1.1), R(0.3, 1.1));
      }
      // A few brighter cross-flare stars
      for (let i = 0; i < 6; i++) {
        const x = R(0, W), y = R(0, H * 0.4);
        g.fillStyle = "rgba(255,255,255,0.9)";
        g.fillRect(x - 3, y, 6, 0.6);
        g.fillRect(x, y - 3, 0.6, 6);
        g.fillStyle = "rgba(255,255,255,1)";
        g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill();
      }

      // Moon + halo
      const moonX = W * 0.82, moonY = H * 0.2;
      const halo = g.createRadialGradient(moonX, moonY, 0, moonX, moonY, 220);
      halo.addColorStop(0, "rgba(255,225,190,0.55)");
      halo.addColorStop(0.35, "rgba(255,180,130,0.16)");
      halo.addColorStop(1, "transparent");
      g.fillStyle = halo;
      g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,238,208,0.95)";
      g.beginPath(); g.arc(moonX, moonY, 30, 0, Math.PI * 2); g.fill();
      // Craters
      g.fillStyle = "rgba(200,180,150,0.35)";
      g.beginPath(); g.arc(moonX - 8, moonY - 3, 5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(moonX + 6, moonY + 8, 4, 0, Math.PI * 2); g.fill();

      // Distant fog washes
      const fogT = g.createRadialGradient(W * 0.3, H * 0.35, 0, W * 0.3, H * 0.35, W * 0.55);
      fogT.addColorStop(0, "rgba(56,189,248,0.11)"); fogT.addColorStop(1, "transparent");
      g.fillStyle = fogT; g.fillRect(0, 0, W, H);
      const fogA = g.createRadialGradient(W * 0.78, H * 0.22, 0, W * 0.78, H * 0.22, W * 0.5);
      fogA.addColorStop(0, "rgba(251,146,60,0.09)"); fogA.addColorStop(1, "transparent");
      g.fillStyle = fogA; g.fillRect(0, 0, W, H);

      // Horizon glow (city bounce light)
      const hz = g.createLinearGradient(0, H * 0.38, 0, H * 0.72);
      hz.addColorStop(0, "transparent");
      hz.addColorStop(0.7, "rgba(255,170,110,0.10)");
      hz.addColorStop(1, "rgba(255,170,110,0.22)");
      g.fillStyle = hz;
      g.fillRect(0, H * 0.38, W, H * 0.34);

      bakedSky = c;
    }

    function buildingSilhouette(g: CanvasRenderingContext2D, b: Building, yBase: number) {
      const bx = b.x, bw = b.w, bh = b.h, by = yBase - bh;
      // Base block
      const grd = g.createLinearGradient(bx, by, bx + bw, by);
      const dark = b.layer === 0 ? "#0f1e30" : b.layer === 1 ? "#08131f" : "#03070d";
      const dark2 = b.layer === 0 ? "#0b1826" : b.layer === 1 ? "#050d17" : "#020508";
      grd.addColorStop(0, dark2); grd.addColorStop(0.5, dark); grd.addColorStop(1, dark2);
      g.fillStyle = grd;
      g.fillRect(bx, by, bw, bh);

      // Setback (upper third narrower on some tall near buildings)
      if (b.layer === 2 && bh > 220 && Math.random() < 0.5) {
        const sbW = bw * 0.7;
        const sbH = bh * 0.28;
        const sbx = bx + (bw - sbW) / 2;
        g.fillStyle = dark;
        g.fillRect(sbx, by - sbH * 0.15, sbW, sbH);
      }
      // Water tank
      if (b.watertank) {
        const tw = Math.min(22, bw * 0.35);
        const th = tw * 0.9;
        const tx = bx + bw * 0.15;
        g.fillStyle = "#050a12";
        g.fillRect(tx, by - th, tw, th);
        g.fillRect(tx + 2, by - th - 4, tw - 4, 4);
      }
      // Spire
      if (b.spire) {
        g.fillStyle = "#03060b";
        g.beginPath();
        g.moveTo(bx + bw / 2 - 3, by);
        g.lineTo(bx + bw / 2, by - b.spire);
        g.lineTo(bx + bw / 2 + 3, by);
        g.closePath();
        g.fill();
      }
      // Edge highlight on one side (rim light from moon direction)
      g.fillStyle = "rgba(255,215,175,0.05)";
      g.fillRect(bx + bw - 1, by, 1, bh);
    }

    function bakeCity() {
      const { c, g } = makeOffscreen(W, H);
      buildings = [];
      windowsByLayer = [[], [], []];

      const layerDefs: { z: Layer; yBase: number; minW: number; maxW: number; minH: number; maxH: number; hueRange: [number, number]; density: number }[] = [
        { z: 0, yBase: H * 0.48, minW: 24, maxW: 60,  minH: 60,  maxH: 160, hueRange: [190, 215], density: 0.32 },
        { z: 1, yBase: H * 0.58, minW: 42, maxW: 100, minH: 140, maxH: 280, hueRange: [30, 55],   density: 0.48 },
        { z: 2, yBase: H * 0.72, minW: 70, maxW: 170, minH: 220, maxH: 420, hueRange: [200, 220], density: 0.6 },
      ];

      for (const L of layerDefs) {
        // Pre-fill a distant haze band for this layer
        const bandTop = L.yBase - L.maxH - 30;
        const bandH = L.yBase - bandTop + 6;
        const bg = g.createLinearGradient(0, bandTop, 0, L.yBase);
        if (L.z === 0) { bg.addColorStop(0, "rgba(20,40,70,0)"); bg.addColorStop(1, "rgba(30,55,90,0.18)"); }
        else if (L.z === 1) { bg.addColorStop(0, "rgba(10,20,40,0)"); bg.addColorStop(1, "rgba(20,35,60,0.22)"); }
        g.fillStyle = bg;
        g.fillRect(0, bandTop, W, bandH);

        let x = -30;
        while (x < W + 40) {
          const w = R(L.minW, L.maxW);
          const h = R(L.minH, Math.min(L.maxH, L.yBase - 40));
          const b: Building = {
            x, w, h, layer: L.z,
            yTop: L.yBase - h,
          };
          if (L.z >= 1 && h > (L.z === 2 ? 260 : 180) && Math.random() < 0.5) {
            b.antenna = { h: R(30, 70), struts: IR(3, 5), blink: R(0, Math.PI * 2), ring: false };
          }
          if (L.z === 2 && Math.random() < 0.2) b.spire = R(30, 70);
          if (L.z >= 1 && Math.random() < 0.35) b.watertank = true;
          // (billboards + dot-matrix facades removed — didn't read as real
          //  city elements at this scale)

          if (L.z >= 1 && Math.random() < 0.55) {
            b.crown = { hue: CHOICE([200, 40, 180, 320]), phase: R(0, Math.PI * 2) };
          }
          buildings.push(b);

          // Silhouette
          buildingSilhouette(g, b, L.yBase);

          // (Base windows removed — read as flat teal stripes at this scale.)


          x += w + R(-2, 6);
        }
      }

      // Pick tallest layer-2 for main broadcast
      let tallest: Building | null = null;
      for (const b of buildings) {
        if (b.layer !== 2) continue;
        const t = b.h + (b.antenna?.h ?? 0) + (b.spire ?? 0);
        const tt = tallest ? tallest.h + (tallest.antenna?.h ?? 0) + (tallest.spire ?? 0) : -1;
        if (t > tt) tallest = b;
      }
      if (tallest) {
        if (!tallest.antenna) tallest.antenna = { h: 80, struts: 5, blink: 0, ring: true };
        else { tallest.antenna.h = Math.max(tallest.antenna.h, 80); tallest.antenna.ring = true; }
        mainAnt = { x: tallest.x + tallest.w / 2, y: H * 0.72 - tallest.h - tallest.antenna.h };
      }

      // Antennas + struts baked as silhouette
      for (const b of buildings) {
        if (!b.antenna) continue;
        const yBase = b.layer === 0 ? H * 0.52 : b.layer === 1 ? H * 0.61 : H * 0.72;
        const ax = b.x + b.w / 2;
        const ay = yBase - b.h;
        g.strokeStyle = "#02050a";
        g.lineWidth = b.layer === 2 ? 1.8 : 1.2;
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax, ay - b.antenna.h); g.stroke();
        g.lineWidth = 0.8;
        for (let k = 1; k <= b.antenna.struts; k++) {
          const yy = ay - (b.antenna.h * k) / (b.antenna.struts + 1);
          const ww = 7 - k;
          g.beginPath(); g.moveTo(ax - ww, yy); g.lineTo(ax + ww, yy); g.stroke();
        }
      }

      // River band (between mid and near skyline)
      const riverY = H * 0.62;
      const riverH = H * 0.06;
      const riverGrd = g.createLinearGradient(0, riverY, 0, riverY + riverH);
      riverGrd.addColorStop(0, "#020408");
      riverGrd.addColorStop(1, "#050a14");
      g.fillStyle = riverGrd;
      g.fillRect(0, riverY, W, riverH);

      // Bridge — cable-stay across mid distance
      const pyx1 = W * 0.28, pyx2 = W * 0.55, deckY = riverY + 4;
      bridge = { x1: pyx1, x2: pyx2, y: deckY, pylons: [pyx1, pyx2], deckH: 3 };
      g.fillStyle = "#04070d";
      g.fillRect(pyx1 - 20, deckY - 2, pyx2 - pyx1 + 40, 3);
      // Pylons
      for (const px of [pyx1, pyx2]) {
        g.fillRect(px - 1.5, deckY - 34, 3, 34);
        g.strokeStyle = "rgba(255,215,175,0.35)";
        g.lineWidth = 0.4;
        for (let s = 0; s < 6; s++) {
          const off = 5 + s * 6;
          g.beginPath(); g.moveTo(px, deckY - 34); g.lineTo(px - off, deckY); g.stroke();
          g.beginPath(); g.moveTo(px, deckY - 34); g.lineTo(px + off, deckY); g.stroke();
        }
      }
      // Deck lights (small warm dots)
      for (let x = pyx1 - 18; x <= pyx2 + 18; x += 5) {
        g.fillStyle = "rgba(255,190,120,0.9)";
        g.fillRect(x, deckY - 3, 1, 1);
      }

      // Foreground road / rooftop bar
      const roadY = H * 0.735;
      const roadGrd = g.createLinearGradient(0, roadY, 0, H);
      roadGrd.addColorStop(0, "#020407");
      roadGrd.addColorStop(0.5, "#04080f");
      roadGrd.addColorStop(1, "#010204");
      g.fillStyle = roadGrd;
      g.fillRect(0, roadY, W, H - roadY);

      // Lane dividers (perspective-ish subtle)
      g.strokeStyle = "rgba(255,200,150,0.15)";
      g.lineWidth = 0.5;
      for (let ly = roadY + 12; ly < H; ly += 14) {
        for (let lx = 0; lx < W; lx += 30) {
          g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 14, ly); g.stroke();
        }
      }

      // Rooftop clutter silhouettes on foreground
      // Left satellite dish
      g.fillStyle = "#02060b";
      g.beginPath(); g.arc(W * 0.06, H * 0.75, 14, Math.PI, 0); g.closePath(); g.fill();
      g.fillRect(W * 0.06 - 0.5, H * 0.75, 1, 18);
      // Right press camera on tripod
      g.fillStyle = "#02060b";
      g.fillRect(W * 0.905 - 10, H * 0.74, 20, 10);
      g.fillRect(W * 0.905 + 6, H * 0.737, 8, 6);
      g.strokeStyle = "#02060b"; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(W * 0.905 - 6, H * 0.75); g.lineTo(W * 0.905 - 10, H * 0.77);
      g.moveTo(W * 0.905,     H * 0.75); g.lineTo(W * 0.905,      H * 0.77);
      g.moveTo(W * 0.905 + 6, H * 0.75); g.lineTo(W * 0.905 + 10, H * 0.77);
      g.stroke();

      bakedCity = c;

      // Cars — 4 lanes filling the full foreground road, each lane one direction
      // to prevent head-on collisions. Cars in the same lane are spaced evenly.
      cars = [];
      const roadTop = H * 0.735;
      const roadBot = H;
      const laneCount = 4;
      const laneStep = (roadBot - roadTop) / (laneCount + 1);
      const laneYs: number[] = [];
      for (let i = 0; i < laneCount; i++) laneYs.push(roadTop + laneStep * (i + 1));
      const perLane = 6;
      for (let li = 0; li < laneCount; li++) {
        const dir: 1 | -1 = li % 2 === 0 ? 1 : -1;
        const speed = R(50, 110);
        const gap = (W + 200) / perLane;
        for (let k = 0; k < perLane; k++) {
          cars.push({
            lane: li,
            x: -100 + k * gap + R(-8, 8),
            dir,
            speed,
          });
        }
      }
      (cars as unknown as { laneYs?: number[] } & Car[]).laneYs = laneYs;

    }

    let raf = 0;
    let last = performance.now();
    let t0 = performance.now();

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const T = (now - t0) / 1000;

      // Sky
      if (bakedSky) ctx.drawImage(bakedSky, 0, 0, W, H);

      // Slow-drifting clouds (soft radial gradients)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 4; i++) {
        const cx = ((T * (6 + i * 2) + i * 400) % (W + 400)) - 200;
        const cy = H * (0.12 + i * 0.06);
        const cr = 160 + i * 40;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, `rgba(120,150,190,${0.05 + i * 0.01})`);
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
      }
      ctx.restore();

      // Baked city silhouettes + base windows
      if (bakedCity) ctx.drawImage(bakedCity, 0, 0, W, H);

      // Water reflection: flip a slice of the baked city into the river band
      const riverY = H * 0.62;
      const riverH = H * 0.06;
      if (bakedCity) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.translate(0, riverY * 2 + riverH);
        ctx.scale(1, -1);
        // Distort slightly via horizontal ripple by drawing in 3 bands with offset
        for (let i = 0; i < 3; i++) {
          const off = Math.sin(T * 1.4 + i) * 1.4;
          ctx.drawImage(
            bakedCity,
            0, (riverY - 60 + i * 20) * DPR, W * DPR, 20 * DPR,
            off, riverY - 60 + i * 20, W, 20
          );
        }
        ctx.restore();
        // Water shimmer overlay
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 40; i++) {
          const rx = ((i * 73 + T * 20) % W);
          const ry = riverY + ((i * 13) % riverH);
          ctx.fillStyle = `rgba(120,180,220,${0.05 + (Math.sin(T * 3 + i) + 1) * 0.04})`;
          ctx.fillRect(rx, ry, 2, 0.6);
        }
        ctx.restore();
      }

      // Animated window flicker + bloom (subset per frame)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const layer of [0, 1, 2] as const) {
        const arr = windowsByLayer[layer];
        for (const w of arr) {
          const flick = 0.75 + 0.25 * Math.sin(T * 2.2 + w.phase);
          // occasionally cut out (someone turns lights off)
          const alive = ((Math.sin(T * 0.15 + w.phase * 3) + 1) * 0.5) > 0.06;
          if (!alive) continue;
          const a = w.base * flick * (layer === 2 ? 0.65 : layer === 1 ? 0.5 : 0.35);
          ctx.fillStyle = `hsla(${w.hue}, 85%, 70%, ${a})`;
          ctx.fillRect(w.x, w.y, w.w, w.h);
          // occasional bright bloom
          if (layer >= 1 && Math.random() < 0.002) {
            ctx.fillStyle = `hsla(${w.hue}, 100%, 80%, 0.35)`;
            ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 3.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      ctx.restore();

      // (Neon billboards and dot-matrix news facades removed)


      // Rooftop crown lights (colored strips atop tall buildings)
      for (const b of buildings) {
        if (!b.crown) continue;
        const yBase = b.layer === 0 ? H * 0.52 : b.layer === 1 ? H * 0.61 : H * 0.72;
        const cy = yBase - b.h;
        const a = 0.5 + 0.5 * Math.sin(T * 1.4 + b.crown.phase);
        ctx.fillStyle = `hsla(${b.crown.hue}, 100%, 65%, ${0.4 + 0.4 * a})`;
        ctx.fillRect(b.x + 2, cy + 1, b.w - 4, 1.2);
      }

      // Antenna aviation blinks + signal rings + data packets
      for (const b of buildings) {
        if (!b.antenna) continue;
        const yBase = b.layer === 0 ? H * 0.52 : b.layer === 1 ? H * 0.61 : H * 0.72;
        const ax = b.x + b.w / 2;
        const ay = yBase - b.h - b.antenna.h;
        const blink = 0.5 + 0.5 * Math.sin(T * 3 + b.antenna.blink);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(248,113,113,${0.35 + 0.6 * blink})`;
        ctx.beginPath(); ctx.arc(ax, ay, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(248,113,113,${0.18 * blink})`;
        ctx.beginPath(); ctx.arc(ax, ay, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        if (b.antenna.ring && b.layer === 2) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          for (let k = 0; k < 3; k++) {
            const p = ((T * 0.5 + k / 3) % 1);
            const r = 8 + p * 260;
            ctx.strokeStyle = `rgba(103,232,249,${(1 - p) * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore();
          if (mainAnt && Math.random() < 0.05 && packets.length < 30) {
            packets.push({
              x: ax, y: ay,
              tx: R(0, W), ty: R(H * 0.08, H * 0.35),
              t: 0, hue: CHOICE([180, 40, 320]),
            });
          }
        }
      }

      // Packets
      for (const p of packets) p.t += dt * 0.55;
      packets = packets.filter((p) => p.t < 1);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const p of packets) {
        const x = p.x + (p.tx - p.x) * p.t;
        const y = p.y + (p.ty - p.y) * p.t - Math.sin(p.t * Math.PI) * 22;
        const a = 1 - p.t;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${a})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${0.25 * a})`;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // Cars on foreground road with head/tail lights
      const laneYs = ((cars as unknown as { laneYs: number[] }).laneYs) || [H * 0.78, H * 0.83, H * 0.88, H * 0.93];
      for (const car of cars) {
        car.x += car.speed * car.dir * dt;
        if (car.dir === 1 && car.x > W + 60) car.x = -60;
        if (car.dir === -1 && car.x < -60) car.x = W + 60;
        const y = laneYs[car.lane];
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        // Nearer lanes (bottom) render bigger/brighter
        const depth = car.lane / (laneYs.length - 1 || 1); // 0 far → 1 near
        const len = 14 + depth * 26;
        const wid = 1 + depth * 1.6;
        const hue = car.dir === 1 ? 45 : 0;
        const front = car.x + (car.dir === 1 ? len : -len);
        const grd = ctx.createLinearGradient(car.x, y, front, y);
        grd.addColorStop(0, `hsla(${hue}, 100%, 65%, ${0.5 + depth * 0.4})`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(Math.min(car.x, front), y - wid / 2, len, wid);
        // Point
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.9)`;
        ctx.fillRect(car.x - 1, y - wid / 2, 2, wid);
        ctx.restore();
      }


      // Bridge deck traffic — small warm streaks
      if (bridge) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 6; i++) {
          const p = ((T * 0.12 + i / 6) % 1);
          const x = bridge.x1 + (bridge.x2 - bridge.x1) * p;
          ctx.fillStyle = `rgba(255,180,110,${0.6 + Math.sin(T * 4 + i) * 0.2})`;
          ctx.fillRect(x, bridge.y - 3, 3, 0.8);
          const p2 = ((T * 0.1 + i / 6 + 0.4) % 1);
          const x2 = bridge.x2 - (bridge.x2 - bridge.x1) * p2;
          ctx.fillStyle = `rgba(255,80,80,${0.5 + Math.sin(T * 3 + i) * 0.2})`;
          ctx.fillRect(x2, bridge.y - 3, 3, 0.8);
        }
        ctx.restore();
      }

      // (Helicopter and blimp removed — read as toys at this scale.)


      // Wet street reflection on foreground road
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const roadY = H * 0.735;
      const wet = ctx.createLinearGradient(0, roadY, 0, H);
      wet.addColorStop(0, "rgba(80,120,180,0.05)");
      wet.addColorStop(1, "rgba(30,60,100,0.15)");
      ctx.fillStyle = wet;
      ctx.fillRect(0, roadY, W, H - roadY);
      // Streaked reflections from car lights
      for (const car of cars) {
        const y = laneYs[car.lane];
        ctx.fillStyle = car.dir === 1 ? "rgba(255,190,120,0.08)" : "rgba(255,80,80,0.08)";
        ctx.fillRect(car.x - 12, y + 4, 30, 2);
      }
      ctx.restore();

      // Rain veil
      ctx.save();
      ctx.strokeStyle = "rgba(180,205,235,0.24)";
      ctx.lineWidth = 0.55;
      const offset = (T * 320) % 26;
      ctx.beginPath();
      for (let i = 0; i < 80; i++) {
        const x = ((i * 53) % (W + 60)) - offset;
        const y = ((i * 97) % H);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 5, y + 16);
      }
      ctx.stroke();
      ctx.restore();

      // Film grain
      if (bakedNoise) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        const nx = Math.floor((T * 40) % 128);
        const ny = Math.floor((T * 27) % 128);
        for (let y = -ny; y < H; y += 128) {
          for (let x = -nx; x < W; x += 128) {
            ctx.drawImage(bakedNoise, x, y);
          }
        }
        ctx.restore();
      }

      // Vignette
      const vg = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.28, W / 2, H * 0.55, Math.max(W, H) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.78)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(frame);
    }

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
      bakeSky();
      bakeCity();
      if (!bakedNoise) bakeNoise();
    }

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
