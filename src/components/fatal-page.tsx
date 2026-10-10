import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { COLLAPSE, CYCLE, corruptText, momentAt, rng, shuffleWord, wave } from "../lib/ruin";

export interface FatalPageProps {
  /** The word. It is drawn small in the picture, its letters shuffled and breaking up, and is the page's heading for assistive technology. @default "BAD" */
  title?: string;
  /** One or two plain sentences: what happened and what the person can do. Always readable, never part of the picture. */
  message?: ReactNode;
  /** A small line in monospace under the message: an error code, a request id. */
  detail?: string;
  /** What the person can do next: a `Button` or `LinkButton` ("Go back", "Ask for a new invitation"). */
  action?: ReactNode;
  /**
   * Fills the window (a page of its own). Set false to draw it inside a box of your own (a gallery, a test): give the
   * element a height with `className`. @default true
   */
  fullscreen?: boolean;
  className?: string;
}

const PIXELS = 70_000;

/**
 * The page for when it has truly gone wrong and there is nothing to show: a 500, a crash, an expired invitation. A full-screen
 * picture of something failing, in red and black: static, torn scanlines, waveforms that stop being waves, blocks of
 * corruption, and a small word that is shuffled and breaking up. It builds toward a collapse, falls, and starts again worse.
 * Under it the message and the one way out stay perfectly legible, and the picture is hidden from assistive technology.
 *
 * It is loud on purpose, so use it rarely, for failures and not for a page that is merely empty (use `NotFound` or `EmptyState`).
 * A person who asks for reduced motion gets one still frame, nothing moves, and nothing flashes: the picture never switches a
 * large part of the screen between light and dark more than a few times a second. The drawing pauses while the tab is hidden and
 * is only decoration, so a browser without canvas simply shows the dark page with the text.
 */
export function FatalPage({ title = "BAD", message, detail, action, fullscreen = true, className }: FatalPageProps) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext?.("2d", { willReadFrequently: true }) ?? null;
    if (!el || !ctx) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const scene = document.createElement("canvas");
    const sctx = scene.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;

    const mono = getComputedStyle(el).getPropertyValue("--font-mono").trim() || "monospace";
    let W = 0;
    let H = 0;
    let frame = 0;
    let raf = 0;
    let last = 0;
    let tAt = 0;
    const random = rng(Math.floor(Math.random() * 1e9));
    let shown = "";
    const at = { x: 0, y: 0 };
    let shownUntil = 0;

    const size = () => {
      const r = el.getBoundingClientRect();
      const aspect = Math.max(0.3, Math.min(3, (r.width || 16) / (r.height || 9)));
      W = Math.max(64, Math.round(Math.sqrt(PIXELS * aspect)));
      H = Math.max(36, Math.round(PIXELS / W));
      el.width = scene.width = W;
      el.height = scene.height = H;
    };

    const draw = (t: number) => {
      const m = momentAt(t);
      const c = m.chaos;
      const fall = m.collapse * m.collapse;
      // --- the scene: black, waveforms, the word, blocks ---
      sctx.fillStyle = "black";
      sctx.fillRect(0, 0, W, H);
      sctx.lineWidth = Math.max(1, H / 140);
      for (let k = 0; k < 3; k += 1) {
        sctx.beginPath();
        sctx.strokeStyle = k === 0 ? "tomato" : k === 1 ? "red" : "darkred";
        const mid = H * (0.28 + k * 0.22) + fall * H * 0.4 * (k + 1);
        const amp = H * 0.11 * (1 - fall * 0.7);
        for (let i = 0; i <= 120; i += 1) {
          const x = i / 120;
          const y = mid + wave(x, t, c, random, k) * amp;
          if (i === 0) sctx.moveTo(0, y);
          else sctx.lineTo(x * W, y);
        }
        sctx.stroke();
      }
      // The word is small and wrong: its letters re-shuffled and breaking up, turning up somewhere new a few times a second.
      if (t >= shownUntil) {
        shown = corruptText(shuffleWord(title, random), c * 0.8, random);
        at.x = W * (0.12 + random() * 0.76);
        at.y = H * (0.14 + random() * 0.66);
        shownUntil = t + 0.1 + random() * 0.3;
      }
      const fs = Math.max(8, H * (0.07 + c * 0.02));
      sctx.font = `bold ${fs}px ${mono}`;
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      const jx = (random() - 0.5) * W * 0.02 * c;
      const jy = (random() - 0.5) * H * 0.02 * c + fall * H * 0.4;
      sctx.fillStyle = "red";
      sctx.fillText(shown, at.x + jx, at.y + jy);
      // a hot flash of it now and then, kept to red hues and to a few frames in a cycle so it never strobes
      if (c > 0.8 && random() < 0.12) {
        sctx.fillStyle = "salmon";
        sctx.fillText(shown, at.x + jx, at.y + jy);
      }
      // blocks of corruption
      const blocks = Math.floor(c * c * 14);
      for (let b = 0; b < blocks; b += 1) {
        const bw = random() * W * 0.3 * c + 3;
        const bh = random() * H * 0.04 + 1;
        sctx.fillStyle = random() < 0.5 ? "red" : random() < 0.5 ? "black" : "darkred";
        sctx.fillRect(random() * W, random() * H, bw, bh);
      }

      // --- the damage: tearing, a roll, static, scanlines, darkness ---
      const src = sctx.getImageData(0, 0, W, H);
      const out = ctx.createImageData(W, H);
      const rowShift = new Int16Array(H);
      const bands = Math.floor(2 + c * 9);
      for (let b = 0; b < bands; b += 1) {
        const y0 = Math.floor(random() * H);
        const h = 1 + Math.floor(random() * H * 0.08 * (0.3 + c));
        const dx = Math.round((random() - 0.5) * W * 0.5 * c);
        for (let y = y0; y < Math.min(H, y0 + h); y += 1) rowShift[y] = dx;
      }
      const roll = fall > 0 ? Math.floor(fall * H * 0.9) : random() < c * 0.06 ? Math.floor(random() * H * 0.2) : 0;
      const noiseAmt = 0.1 + c * 0.42 + fall * 0.2;
      const cx = W / 2;
      const cy = H / 2;
      for (let y = 0; y < H; y += 1) {
        const sy = (y + roll) % H;
        const sh = rowShift[sy] ?? 0;
        const dark = y % 3 === 0 ? 0.55 : 1;
        for (let x = 0; x < W; x += 1) {
          const xs = Math.min(W - 1, Math.max(0, x + sh));
          const row = sy * W;
          let r = src.data[(row + xs) * 4] ?? 0;
          let g = src.data[(row + xs) * 4 + 1] ?? 0;
          let b = src.data[(row + xs) * 4 + 2] ?? 0;
          // static: red-heavy grain
          const n = random();
          const grain = n * 255 * noiseAmt * (n > 0.97 ? 1.6 : 1);
          r += grain * 0.95;
          g += grain * 0.18;
          b += grain * 0.12;
          // vignette: the edges go to black
          const dx = (x - cx) / cx;
          const dy = (y - cy) / cy;
          const v = Math.max(0.12, 1 - (dx * dx + dy * dy) * (0.55 + c * 0.35));
          const i = (y * W + x) * 4;
          out.data[i] = Math.min(255, r * v * dark);
          out.data[i + 1] = Math.min(255, g * v * dark);
          out.data[i + 2] = Math.min(255, b * v * dark);
          out.data[i + 3] = 255;
        }
      }
      ctx.putImageData(out, 0, 0);
    };

    size();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(size);
    ro?.observe(el);

    if (still) {
      draw(CYCLE - COLLAPSE - 0.5);
      return () => ro?.disconnect();
    }
    // About 24 pictures a second: slow enough that the static does not strobe, fast enough to feel violent.
    const step = 1000 / 24;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - last < step) return;
      last = now;
      tAt += step / 1000;
      frame += 1;
      draw(tAt);
      el.dataset.frame = String(frame);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [title]);

  return (
    <div
      role="alert"
      className={cn("relative isolate overflow-hidden always-dark bg-black text-white", fullscreen ? "fixed inset-0 z-50 h-dvh w-full" : "h-full min-h-72 w-full", className)}
    >
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover [image-rendering:pixelated]" />
      <h1 className="sr-only">{title}</h1>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pt-16 pb-8 text-center">
        {message ? <p className="max-w-xl text-white">{message}</p> : null}
        {detail ? <p className="text-white/60">{detail}</p> : null}
        {action}
      </div>
    </div>
  );
}
