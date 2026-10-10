import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { rng } from "../lib/ruin";
import { CYCLE, RuinedSwing } from "../lib/ruin-swing";
import type { V3 } from "../lib/ruin-swing";

export interface FatalPageProps {
  /** The page's heading for assistive technology (nothing is written in the picture). @default "BAD" */
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

const STARS = 6500;
const AZIMUTH = 0.8;
const PITCH = 0.5;
const CENTER_Y = 1.5;
// The colours are names (no colour functions in the package); brightness is the canvas's alpha.
const STAR_COLORS = ["red", "crimson", "firebrick", "tomato", "darkred"] as const;
const LEVELS = [0.3, 0.5, 0.75, 1] as const;

interface Star {
  r: number;
  th: number;
  y: number;
  w: number;
  off: V3;
  vel: V3;
  group: number;
}

/**
 * The page for when it has truly gone wrong and there is nothing to show: a 500, a crash, an expired invitation. The enter
 * page's swingset and its cloud of stars, ruined: in the dark the swing is thrashed by gusts, a rope snaps, the frame comes
 * apart piece by piece and falls, sparks burst, and a storm of red stars is thrown outward and wheels on; then it fades to
 * black and begins again, angrier. Under it the message and the one way out stay
 * perfectly legible, and the picture is hidden from assistive technology.
 *
 * It is loud on purpose, so use it rarely, for failures and not for a page that is merely empty (use `NotFound` or
 * `EmptyState`). A person who asks for reduced motion gets one still frame of the wreck. The picture fades in and out through
 * black and never flashes a large area between light and dark, pauses while the tab is hidden, draws with the 2D canvas (no
 * WebGL) and is only decoration, so a browser without canvas shows the dark page with the text.
 */
export function FatalPage({ title = "BAD", message, detail, action, fullscreen = true, className }: FatalPageProps) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext?.("2d") ?? null;
    if (!el || !ctx) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const random = rng(Math.floor(Math.random() * 1e9));

    let W = 1;
    let H = 1;
    let dpr = 1;
    const size = () => {
      const r = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2, 1800 / Math.max(1, r.width));
      W = Math.max(2, Math.round(r.width * dpr));
      H = Math.max(2, Math.round(r.height * dpr));
      el.width = W;
      el.height = H;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, W, H);
    };

    // The stars: a thick low cloud round the swingset that thins with height and distance, wheeling the way the enter page's does.
    const stars: Star[] = [];
    for (let i = 0; i < STARS; i += 1) {
      const r = 0.6 + 9 * Math.sqrt(random());
      const y = Math.min(9, -Math.log(1 - random() * 0.999) * 1.9);
      const w = (0.12 + random() * 0.5) * (1 + 1.5 * Math.exp(-r * 0.25)) * Math.cos(y * 0.35) * (random() < 0.5 ? 1 : 0.7);
      stars.push({ r, th: random() * Math.PI * 2, y, w, off: [0, 0, 0], vel: [0, 0, 0], group: Math.floor(random() * STAR_COLORS.length) * LEVELS.length + Math.floor(random() * random() * LEVELS.length) });
    }
    const prevX = new Float32Array(STARS);
    const prevY = new Float32Array(STARS);
    const groups: number[][] = Array.from({ length: STAR_COLORS.length * LEVELS.length }, () => []);
    stars.forEach((s, i) => groups[s.group]!.push(i));

    let cycle = 0;
    let swing = new RuinedSwing(random() * 1e9, 0);
    // the camera: fixed, looking down at the swingset from the side, as the enter page does
    const rx = Math.cos(AZIMUTH);
    const rz = -Math.sin(AZIMUTH);
    const cx = Math.sin(AZIMUTH) * Math.cos(PITCH);
    const cy = Math.sin(PITCH);
    const cz = Math.cos(AZIMUTH) * Math.cos(PITCH);
    // up = c x right
    const ux = cy * rz;
    const uy = cz * rx - cx * rz;
    const uz = -cy * rx;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let shakeX = 0;
    let shakeY = 0;
    const px = new Float32Array(2);
    const project = (x: number, y: number, z: number) => {
      const dy = y - CENTER_Y;
      px[0] = ox + shakeX + (x * rx + z * rz) * scale;
      px[1] = oy + shakeY - (x * ux + dy * uy + z * uz) * scale;
    };

    const push = (at: V3, mag: number) => {
      for (const s of stars) {
        const x = s.r * Math.cos(s.th) + s.off[0] - at[0];
        const y = s.y + s.off[1] - at[1];
        const z = s.r * Math.sin(s.th) + s.off[2] - at[2];
        const d = Math.hypot(x, y, z) + 0.4;
        const f = mag / (d * d) * (0.6 + random());
        s.vel[0] += (x / d) * f;
        s.vel[1] += (y / d) * f + f * 0.3;
        s.vel[2] += (z / d) * f;
      }
    };

    const stepWorld = (dt: number) => {
      swing.step(dt);
      const c = swing.chaos();
      for (const e of swing.take()) push(e.at, e.kind === "snap" ? 30 : e.kind === "fall" ? 14 : 8);
      for (const s of stars) {
        s.th += s.w * dt * (1 + 2.5 * c);
        // turbulence: a random walk in velocity that grows with the chaos, and a pull back to the cloud
        for (let k = 0; k < 3; k += 1) {
          s.vel[k] = s.vel[k]! * (1 - 0.6 * dt) + (random() - 0.5) * c * c * 9 * dt - s.off[k]! * 0.35 * dt;
          s.off[k] = s.off[k]! + s.vel[k]! * dt;
        }
        // in the end they fall
        if (swing.t > 6.2) s.vel[1] = s.vel[1]! - 2.2 * dt;
        if (s.y + s.off[1]! < 0.02) {
          s.off[1] = 0.02 - s.y;
          s.vel[1] = Math.abs(s.vel[1]!) * 0.3;
        }
      }
    };

    const draw = (fade: boolean) => {
      const c = swing.chaos();
      ctx.globalAlpha = fade ? 0.5 - c * 0.24 : 1; // the more it rages, the longer the trails
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, W, H);
      scale = Math.min(H / 4.9, W / 7);
      ox = W / 2;
      oy = H * 0.52;
      if (!still) {
        const shake = c * c * dpr * (swing.t > 5 ? 9 : 4);
        shakeX = (random() - 0.5) * shake;
        shakeY = (random() - 0.5) * shake;
      }
      // stars
      groups.forEach((list, g) => {
        const color = STAR_COLORS[Math.floor(g / LEVELS.length)]!;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.globalAlpha = Math.min(1, LEVELS[g % LEVELS.length]! * (0.8 + 0.4 * c));
        ctx.lineWidth = Math.max(1, dpr * (1 + (g % LEVELS.length === 3 ? 1 : 0)));
        ctx.beginPath();
        for (const i of list) {
          const s = stars[i]!;
          project(s.r * Math.cos(s.th) + s.off[0], s.y + s.off[1], s.r * Math.sin(s.th) + s.off[2]);
          const x = px[0]!;
          const y = px[1]!;
          const dx = x - (prevX[i] ?? x);
          const dy = y - (prevY[i] ?? y);
          prevX[i] = x;
          prevY[i] = y;
          const moved = Math.hypot(dx, dy);
          if (moved > dpr * 1.5 && moved < W * 0.3) {
            // fast: a streak along where it has just been, longer the harder it is thrown
            ctx.moveTo(x - dx * (1 + c), y - dy * (1 + c));
            ctx.lineTo(x, y);
          } else {
            const d = Math.max(1, dpr * (1 + (g % LEVELS.length === 3 ? 1 : 0)));
            ctx.rect(x, y, d, d);
          }
        }
        ctx.fill();
        ctx.stroke();
      });
      // the swingset
      ctx.globalAlpha = 1;
      ctx.lineCap = "round";
      for (const l of swing.lines()) {
        project(...l.a);
        const ax = px[0]!;
        const ay = px[1]!;
        project(...l.b);
        ctx.strokeStyle = l.kind === "frame" ? "red" : l.kind === "rope" ? "tomato" : "salmon";
        ctx.lineWidth = Math.max(1, dpr * (l.kind === "frame" ? 2.4 : 1.6));
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(px[0]!, px[1]!);
        ctx.stroke();
      }
      // sparks
      for (const sp of swing.sparks) {
        project(...sp.p);
        ctx.fillStyle = sp.hot > 0.6 ? "salmon" : "tomato";
        ctx.globalAlpha = Math.min(1, sp.life * 1.5);
        const d = Math.max(1, dpr * (1 + sp.hot * 1.5));
        ctx.fillRect(px[0]!, px[1]!, d, d);
      }
      ctx.globalAlpha = 1;
    };

    size();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(size);
    ro?.observe(el);

    if (still) {
      // one frame: the wreck, a little after the frame has come down
      for (let i = 0; i < 60 * 9.2; i += 1) stepWorld(1 / 60);
      draw(false);
      return () => ro?.disconnect();
    }

    let raf = 0;
    let last = 0;
    let acc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) {
        last = 0;
        return;
      }
      const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= 1 / 60) {
        stepWorld(1 / 60);
        acc -= 1 / 60;
      }
      if (swing.t > CYCLE) {
        // fade through black into the next one, worse
        cycle += 1;
        swing = new RuinedSwing(random() * 1e9, Math.min(1, cycle * 0.25));
        for (const s of stars) {
          s.off = [0, 0, 0];
          s.vel = [0, 0, 0];
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, W, H);
      }
      draw(true);
      // The picture comes out of black and goes back into it: nothing flashes.
      const t = swing.t;
      el.style.opacity = String(Math.max(0, Math.min(1, t / 1.2, (CYCLE - t) / 1.5)));
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  return (
    <div role="alert" className={cn("isolate overflow-hidden always-dark bg-black text-white", fullscreen ? "fixed inset-0 z-50 h-dvh w-full" : "relative h-full min-h-72 w-full", className)}>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 -z-20 size-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_45%,transparent_30%,black_100%)]" />
      <h1 className="sr-only">{title}</h1>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pt-16 pb-8 text-center">
        {message ? <p className="max-w-xl text-white">{message}</p> : null}
        {detail ? <p className="text-white/60">{detail}</p> : null}
        {action}
      </div>
    </div>
  );
}
