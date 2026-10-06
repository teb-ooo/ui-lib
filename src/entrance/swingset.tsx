import { useEffect, useRef } from "react";
import {
  BufferGeometry,
  Color,
  DepthTexture,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { createMist, INTRO, type Mist } from "./mist";
import { loadCloud } from "./mist-load";

/**
 * A swingset as thick line art in three dimensions in a cloud of mist, small enough for a 48 pixel mark. The frame is
 * rigid; dragging sideways anywhere on the page swirls the mist round it (or unswirls it). The swing is a physical rope
 * simulation: each rope is a chain of particles that cannot stretch but can go slack, the ends are joined by a rigid
 * bar carrying a flat rectangular seat, gravity and a little air drag act on all of it. A user grabs the seat, drags
 * it and lets go; hovering or brushing past it does nothing. The swing and the mist share one scene (see ./mist): the
 * frame is drawn into a texture with its depth and the mist is drawn around it, in front of it and behind it. The canvas
 * covers the whole scrolling area so the swing is never cut off. Custom drawing (web/src/custom): everything takes the
 * theme's ink colour; a user who asks for reduced motion gets one still frame and no interaction. The element fills
 * its parent and is hidden from assistive technology.
 */

const BEAM_Y = 3;
const BEAM_HALF = 2.1;
const LEG_SPREAD = 0.9;
const CROSSBAR_Y = 0.3;
const ROPE_LENGTH = 2.2;
const ROPE_PARTS = 6;
const SEAT_WIDTH = 1.2;
const SEAT_DEPTH = 0.34;
const ROPE_X = SEAT_WIDTH / 2;
const GRAVITY = 15;
const STEP = 1 / 60;
const AZIMUTH = 0.8; // how far the camera starts turned round the frame
const PITCH = 0.5; // and how far it looks down
const SWIRL_PER_PX = 0.2; // seconds of the mist's own turning added or taken away per pixel dragged sideways
const SWIRL_EASE = 6; // how quickly the mist follows the drag (per second)
const SWIRL_MAX = 240; // the most turning, either way, that dragging can add (seconds)
const CAMERA_DISTANCE = 40; // orthographic: only keeps the whole ground in front of the camera
const VIEW = 2.0; // half the height of the view, in scene units, so the whole frame fits its box
const INTRO_AZIMUTH = 0.7; // the camera starts this far round (radians) and settles
const INTRO_PITCH = 0.28; // and this much higher
const START_ANGLE = 0.85; // the swing starts raised this far (radians), so the page opens with it already in motion
const SEGMENTS = 2 * ROPE_PARTS + 4; // the ropes and the four edges of the seat

type V = [number, number, number];

/** Pairs of points of the frame: a beam and the two A-shaped ends with their crossbars, nothing else. */
function frameSegments(): number[] {
  const seg: number[] = [];
  const add = (a: V, b: V) => seg.push(...a, ...b);
  add([-BEAM_HALF, BEAM_Y, 0], [BEAM_HALF, BEAM_Y, 0]);
  for (const x of [-BEAM_HALF, BEAM_HALF]) {
    add([x, BEAM_Y, 0], [x, 0, -LEG_SPREAD]);
    add([x, BEAM_Y, 0], [x, 0, LEG_SPREAD]);
    // the crossbar between the two legs of each end
    const zb = LEG_SPREAD * (1 - CROSSBAR_Y / BEAM_Y);
    add([x, CROSSBAR_Y, -zb], [x, CROSSBAR_Y, zb]);
  }
  return seg;
}

/** A computed CSS colour in any syntax, as a Color, through a one pixel canvas. */
function cssColor(css: string): Color {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  const out = new Color(0x808080);
  if (!ctx) return out;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return out.setRGB((d[0] ?? 0) / 255, (d[1] ?? 0) / 255, (d[2] ?? 0) / 255);
}

interface Rope {
  /** Positions and previous positions (Verlet), x y z per particle; particle 0 is the anchor on the beam. */
  p: Float32Array;
  q: Float32Array;
}

function makeRope(x: number, theta: number): Rope {
  const n = ROPE_PARTS + 1;
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // Straight and taut, raised by theta toward the viewer's side of the frame, so it starts already about to swing.
    const d = (ROPE_LENGTH * i) / ROPE_PARTS;
    p[i * 3] = x;
    p[i * 3 + 1] = BEAM_Y - d * Math.cos(theta);
    p[i * 3 + 2] = d * Math.sin(theta);
  }
  return { p, q: Float32Array.from(p) };
}

/**
 * `excited` keeps the swing moving. `contained` is for a scene inside a page that scrolls and has other things on it (a
 * gallery, a page with content): the canvas covers only its own box, the page's touch gestures are left alone, and only a
 * drag that starts on the scene swirls the mist. Without it the scene covers the whole scrolling area and takes every drag.
 */
export default function Swingset({ excited = false, contained = false }: { excited?: boolean; contained?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const excitedRef = useRef(excited);
  const wakeRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    excitedRef.current = excited;
    if (excited) wakeRef.current();
  }, [excited]);

  useEffect(() => {
    const el = host.current;
    const holder = wrap.current;
    if (!el || !holder) return;
    if (typeof window.matchMedia !== "function") return; // not a browser that can draw it
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      return; // no WebGL: the page works without the picture
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    renderer.setClearAlpha(0);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    holder.appendChild(canvas);
    holder.style.opacity = "0";
    holder.style.transition = "opacity 800ms ease-out";

    // One scene: the frame and the swing are drawn into a texture with their depth (`frameTarget`), and the mist's shader
    // draws the picture from that, putting the mist in front of and behind them where it really is. The picture is drawn
    // on every animation frame, because the mist never stops moving.
    // The cloud of points is worked out in a worker, so the page is usable at once; the picture appears when it is ready.
    let mist: Mist | null = null;
    let disposed = false;
    let frameTarget: WebGLRenderTarget;
    try {
      frameTarget = new WebGLRenderTarget(1, 1, { samples: 4, depthTexture: new DepthTexture(1, 1) });
    } catch {
      renderer.dispose();
      canvas.remove();
      return; // the page works without the picture
    }

    const scene = new Scene();
    // The frame and the swing are drawn as solid white lines into a texture (with their depth); the mist's shader reads only
    // how much of a pixel they cover and how far away they are, and draws them in the theme's ink.
    const material = new LineMaterial({ color: 0xffffff, linewidth: 2, worldUnits: false });
    // the swing is grey in the texture (the frame white), so the mist's shader can bring it in after the frame
    const swingMaterial = new LineMaterial({ color: 0x808080, linewidth: 2, worldUnits: false });
    const framePoints = Float32Array.from(frameSegments());
    const frameGeometry = new LineSegmentsGeometry().setPositions(framePoints);
    // The seat is a filled quad that follows the rope ends; its outline is drawn with the ropes.
    const seatGeometry = new BufferGeometry();
    seatGeometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(18), 3));
    const seatMaterial = new MeshBasicMaterial({ color: 0x808080, side: DoubleSide });
    const seatFill = new Mesh(seatGeometry, seatMaterial);
    seatFill.frustumCulled = false;
    scene.add(seatFill);
    scene.add(new LineSegments2(frameGeometry, material));
    const swingGeometry = new LineSegmentsGeometry();
    swingGeometry.setPositions(new Float32Array(6 * SEGMENTS));
    const swingLines = new LineSegments2(swingGeometry, swingMaterial);
    swingLines.frustumCulled = false;
    scene.add(swingLines);

    // The theme's ink, read from a real element so the tokens stay the single source. The CSS follows the system's colour
    // scheme by itself; the picture reads the ink again twice a second, so it follows too without asking about the scheme.
    const ink = new Color(0x000000);
    const probe = document.createElement("span");
    probe.className = "text-ink";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    el.appendChild(probe);
    let lastInkCss = "";
    const readInk = () => {
      const css = getComputedStyle(probe).color;
      if (css === lastInkCss) return false;
      lastInkCss = css;
      ink.copy(cssColor(css));
      mist?.setColor(ink);
      return true;
    };
    const recolor = () => {
      readInk();
      draw();
      present(0);
    };

    // The camera looks at the swingset from a fixed distance and stays there (but for the opening, which settles it).
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
    const right = new Vector3();
    const up = new Vector3();
    const camAz = AZIMUTH;
    const camPitch = PITCH;
    // The opening: the camera starts turned and higher and settles to where it was dragged to (zero when there is no opening).
    let introAz = still ? 0 : INTRO_AZIMUTH;
    let introPitch = still ? 0 : INTRO_PITCH;
    const placeCamera = () => {
      camera.position.set(
        Math.sin(camAz + introAz) * CAMERA_DISTANCE,
        1.5 + Math.sin(camPitch + introPitch) * CAMERA_DISTANCE,
        Math.cos(camAz + introAz) * CAMERA_DISTANCE,
      );
      camera.lookAt(0, 1.5, 0);
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      up.setFromMatrixColumn(camera.matrixWorld, 1);
    };
    placeCamera();
    let boxW = 1;
    let boxH = 1;
    let bigW = 1;
    let bigH = 1;
    let halfW = 2;
    let halfH = 2;
    const resize = () => {
      boxW = Math.max(1, el.clientWidth);
      boxH = Math.max(1, el.clientHeight);
      // The canvas covers the whole area that scrolls, and no more (that would make the page scroll sideways), so the
      // swing can go anywhere it can reach without being cut off.
      const r = el.getBoundingClientRect();
      const area = contained ? r : (el.closest("main") ?? document.documentElement).getBoundingClientRect();
      const extL = Math.max(0, r.left - area.left);
      const extR = Math.max(0, area.right - r.right);
      const extT = Math.max(0, r.top - area.top);
      const extB = Math.max(0, area.bottom - r.bottom);
      bigW = boxW + extL + extR;
      bigH = boxH + extT + extB;
      for (const h of [holder]) {
        h.style.left = `${-extL}px`;
        h.style.top = `${-extT}px`;
        h.style.width = `${bigW}px`;
        h.style.height = `${bigH}px`;
      }
      renderer.setSize(bigW, bigH, false);
      const buffer = renderer.getDrawingBufferSize(new Vector2());
      frameTarget.setSize(buffer.x, buffer.y);
      material.resolution.set(bigW, bigH);
      swingMaterial.resolution.set(bigW, bigH);
      const aspect = boxW / boxH;
      halfH = Math.max(VIEW, VIEW / aspect);
      halfW = halfH * aspect;
      // The box shows exactly what it showed without the extra room; the rest of the canvas only adds to it.
      const wpp = (halfW * 2) / boxW;
      camera.left = -halfW - extL * wpp;
      camera.right = halfW + extR * wpp;
      camera.top = halfH + extT * wpp;
      camera.bottom = -halfH - extB * wpp;
      camera.updateProjectionMatrix();
    };

    // The simulation: two ropes whose last particles are joined by a rigid seat bar.
    const start = still ? 0.5 : START_ANGLE;
    const ropes = [makeRope(-ROPE_X, start), makeRope(ROPE_X, start)];
    const nParts = ROPE_PARTS + 1;
    const last = ROPE_PARTS * 3;
    const segLen = ROPE_LENGTH / ROPE_PARTS;
    const invMass = (i: number) => (i === 0 ? 0 : i === ROPE_PARTS ? 0.25 : 1);
    // Adds velocity to the seat ends (a displacement per step), never more speed than a hand could give.
    const MAX_STEP = 0.06;
    const nudge = (dx: number, dy: number, dz: number) => {
      for (const r of ropes) {
        const vx = (r.p[last] ?? 0) - (r.q[last] ?? 0) + dx;
        const vy = (r.p[last + 1] ?? 0) - (r.q[last + 1] ?? 0) + dy;
        const vz = (r.p[last + 2] ?? 0) - (r.q[last + 2] ?? 0) + dz;
        const m = Math.hypot(vx, vy, vz);
        const c = m > MAX_STEP ? MAX_STEP / m : 1;
        r.q[last] = (r.p[last] ?? 0) - vx * c;
        r.q[last + 1] = (r.p[last + 1] ?? 0) - vy * c;
        r.q[last + 2] = (r.p[last + 2] ?? 0) - vz * c;
      }
    };

    const integrate = () => {
      for (const r of ropes) {
        for (let i = 1; i < nParts; i++) {
          for (let k = 0; k < 3; k++) {
            const j = i * 3 + k;
            const cur = r.p[j] ?? 0;
            let next = cur + (cur - (r.q[j] ?? 0)) * 0.995;
            if (k === 1) next -= GRAVITY * STEP * STEP;
            r.q[j] = cur;
            r.p[j] = next;
          }
          if ((r.p[i * 3 + 1] ?? 0) < 0.05) r.p[i * 3 + 1] = 0.05; // the ground
        }
      }
    };
    const pull = (r: Rope, a: number, b: number, rest: number, onlyLonger: boolean) => {
      const ax = r.p[a * 3] ?? 0;
      const ay = r.p[a * 3 + 1] ?? 0;
      const az = r.p[a * 3 + 2] ?? 0;
      const dx = (r.p[b * 3] ?? 0) - ax;
      const dy = (r.p[b * 3 + 1] ?? 0) - ay;
      const dz = (r.p[b * 3 + 2] ?? 0) - az;
      const d = Math.hypot(dx, dy, dz) || 1e-6;
      if (onlyLonger && d <= rest) return; // a rope can go slack
      const wa = invMass(a);
      const wb = invMass(b);
      const f = (d - rest) / d / (wa + wb);
      r.p[a * 3] = ax + dx * f * wa;
      r.p[a * 3 + 1] = ay + dy * f * wa;
      r.p[a * 3 + 2] = az + dz * f * wa;
      r.p[b * 3] = (r.p[b * 3] ?? 0) - dx * f * wb;
      r.p[b * 3 + 1] = (r.p[b * 3 + 1] ?? 0) - dy * f * wb;
      r.p[b * 3 + 2] = (r.p[b * 3 + 2] ?? 0) - dz * f * wb;
    };
    const solve = () => {
      const [l, r] = ropes as [Rope, Rope];
      for (let it = 0; it < 24; it++) {
        for (const rope of ropes) for (let i = 0; i < ROPE_PARTS; i++) pull(rope, i, i + 1, segLen, true);
        // the seat: a rigid bar between the two rope ends
        const ax = l.p[last] ?? 0;
        const ay = l.p[last + 1] ?? 0;
        const az = l.p[last + 2] ?? 0;
        const dx = (r.p[last] ?? 0) - ax;
        const dy = (r.p[last + 1] ?? 0) - ay;
        const dz = (r.p[last + 2] ?? 0) - az;
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const f = (d - SEAT_WIDTH) / d / 2;
        l.p[last] = ax + dx * f;
        l.p[last + 1] = ay + dy * f;
        l.p[last + 2] = az + dz * f;
        r.p[last] = (r.p[last] ?? 0) - dx * f;
        r.p[last + 1] = (r.p[last + 1] ?? 0) - dy * f;
        r.p[last + 2] = (r.p[last + 2] ?? 0) - dz * f;
      }
    };

    const seatMid = (out: Vector3) =>
      out.set(
        ((ropes[0]?.p[last] ?? 0) + (ropes[1]?.p[last] ?? 0)) / 2,
        ((ropes[0]?.p[last + 1] ?? 0) + (ropes[1]?.p[last + 1] ?? 0)) / 2,
        ((ropes[0]?.p[last + 2] ?? 0) + (ropes[1]?.p[last + 2] ?? 0)) / 2,
      );

    const buffer = new Float32Array(6 * SEGMENTS);
    const a = new Vector3();
    const b = new Vector3();
    const u = new Vector3();
    const w = new Vector3();
    const upRope = new Vector3();
    // The picture: the frame and the swing into the texture, then the mist and the frame to the canvas.
    const present = (seconds: number) => {
      if (!mist) return;
      renderer.setRenderTarget(frameTarget);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      mist.draw(renderer, camera, frameTarget, seconds);
    };
    const draw = () => {
      let o = 0;
      for (const r of ropes) {
        for (let i = 0; i < ROPE_PARTS; i++) {
          for (let k = 0; k < 6; k++) buffer[o++] = r.p[i * 3 + k] ?? 0;
        }
      }
      // The seat: one flat rectangle lying across the two rope ends, tilting with them.
      a.set(ropes[0]?.p[last] ?? 0, ropes[0]?.p[last + 1] ?? 0, ropes[0]?.p[last + 2] ?? 0);
      b.set(ropes[1]?.p[last] ?? 0, ropes[1]?.p[last + 1] ?? 0, ropes[1]?.p[last + 2] ?? 0);
      u.subVectors(b, a).normalize();
      upRope
        .set(
          ((ropes[0]?.p[last - 3] ?? 0) + (ropes[1]?.p[last - 3] ?? 0)) / 2 - (a.x + b.x) / 2,
          ((ropes[0]?.p[last - 2] ?? 0) + (ropes[1]?.p[last - 2] ?? 0)) / 2 - (a.y + b.y) / 2,
          ((ropes[0]?.p[last - 1] ?? 0) + (ropes[1]?.p[last - 1] ?? 0)) / 2 - (a.z + b.z) / 2,
        )
        .normalize();
      w.crossVectors(u, upRope);
      if (w.lengthSq() < 1e-6) w.set(0, 0, 1);
      w.normalize().multiplyScalar(SEAT_DEPTH / 2);
      const corners = [
        [a.x - w.x, a.y - w.y, a.z - w.z],
        [b.x - w.x, b.y - w.y, b.z - w.z],
        [b.x + w.x, b.y + w.y, b.z + w.z],
        [a.x + w.x, a.y + w.y, a.z + w.z],
      ] as const;
      for (let i = 0; i < 4; i++) {
        const p = corners[i] as readonly number[];
        const q = corners[(i + 1) % 4] as readonly number[];
        for (let k = 0; k < 3; k++) buffer[o++] = p[k] ?? 0;
        for (let k = 0; k < 3; k++) buffer[o++] = q[k] ?? 0;
      }
      const tri = seatGeometry.getAttribute("position");
      const c = (i: number) => corners[i] as readonly number[];
      for (const [slot, ci] of [0, 1, 2, 0, 2, 3].entries())
        tri.setXYZ(slot, c(ci)[0] ?? 0, c(ci)[1] ?? 0, c(ci)[2] ?? 0);
      tri.needsUpdate = true;
      swingGeometry.setPositions(buffer);
    };

    // The pointer: pressing on the seat grabs it, moving drags it, letting go lets it swing on its own. Nothing else moves it.
    const mid = new Vector3();
    const target = new Vector3();
    const pivot = new Vector3(0, BEAM_Y, 0);
    const reachable = new Vector3();
    let dragging = false;
    const seatOnScreen = () => {
      seatMid(mid);
      const n = mid.clone().project(camera);
      return { x: ((n.x + 1) / 2) * bigW, y: ((1 - n.y) / 2) * bigH };
    };
    const reach = () => Math.max(14, Math.min(boxW, boxH) * 0.22);
    const local = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const onMove = (e: PointerEvent) => {
      if (swirling) {
        // Dragging sideways swirls the mist one way and the other way unswirls it; up and down do nothing.
        swirlTarget = clamp(swirling.swirl + (e.clientX - swirling.x) * SWIRL_PER_PX, -SWIRL_MAX, SWIRL_MAX);
        return;
      }
      const now = local(e);
      const s = seatOnScreen();
      const near = Math.hypot(now.x - s.x, now.y - s.y) < reach();
      document.body.style.cursor = near || dragging ? "grab" : "";
      if (!dragging) return; // the swing only moves when it is grabbed
      const wpp = (halfW * 2) / boxW;
      target
        .copy(mid)
        .addScaledVector(right, (now.x - s.x) * wpp)
        .addScaledVector(up, -(now.y - s.y) * wpp);
      // Only where the ropes can reach: a hand cannot stretch them.
      reachable.copy(target).sub(pivot);
      if (reachable.length() > ROPE_LENGTH * 0.95) reachable.setLength(ROPE_LENGTH * 0.95);
      target.copy(pivot).add(reachable);
      target.y = Math.max(0.2, target.y);
      wake();
    };
    // Dragging sideways anywhere that is not the seat or something clickable swirls the mist (or unswirls it).
    let swirling: { x: number; swirl: number } | null = null;
    let swirlTarget = 0;
    let swirl = 0;
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    const onDown = (e: PointerEvent) => {
      if (contained && !el.contains(e.target as Node)) return;
      const now = local(e);
      const s = seatOnScreen();
      if (Math.hypot(now.x - s.x, now.y - s.y) > reach()) {
        const hit = e.target as Element | null;
        if (hit?.closest("button, a, input, select, textarea, label, [role=button], [role=menuitem], dialog")) return;
        swirling = { x: e.clientX, swirl: swirlTarget };
        document.body.style.cursor = "grabbing";
        if (e.pointerType !== "touch") e.preventDefault();
        return;
      }
      dragging = true;
      e.preventDefault();
      target.copy(mid);
      wake();
    };
    // A finger anywhere on the page can swirl the mist, so the browser must not take the touch for its own gestures: no
    // scrolling or panning, no pull to refresh or bounce at the edges, no text selection or press menu. The page has
    // nothing to scroll to while the swingset is on it. (A browser's swipe in from the screen edge is not ours to stop.)
    const locks = (contained ? [] : [el.closest("main"), document.body, document.documentElement]).filter(
      (n): n is HTMLElement => n instanceof HTMLElement,
    );
    const lockProps = ["touchAction", "overscrollBehavior", "overflow", "userSelect", "webkitTouchCallout"] as const;
    const lockValues = ["none", "none", "hidden", "none", "none"] as const;
    const was = locks.map((n) => lockProps.map((p) => n.style[p as never] as string));
    for (const n of locks) lockProps.forEach((p, i) => ((n.style as never)[p] = lockValues[i] as never));
    // Where a browser ignores touch-action, the move itself is cancelled while a drag is going.
    const onTouchMove = (e: TouchEvent) => {
      if (swirling || dragging) e.preventDefault();
    };
    const onUp = () => {
      dragging = false;
      if (swirling) document.body.style.cursor = "";
      swirling = null;
    };
    const onLeave = () => {
      document.body.style.cursor = "";
    };

    // The swing's loop runs while it moves and stops by itself when it is still. The mist has a loop of its own below.
    let raf = 0;
    let running = false;
    let acc = 0;
    let lastT = 0;
    let calm = 0;
    let pushDir = 1;
    const frame = (now: number) => {
      // The swing is held as it starts until the opening lets it go.
      if (!still && (mist?.elapsed() ?? 0) < INTRO.swingGo) {
        lastT = now;
        acc = 0;
        draw();
        raf = requestAnimationFrame(frame);
        return;
      }
      acc += Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      let moved = 0;
      while (acc >= STEP) {
        acc -= STEP;
        if (dragging) {
          const dx = (target.x - mid.x) * 0.35;
          const dy = (target.y - mid.y) * 0.35;
          const dz = (target.z - mid.z) * 0.35;
          for (const r of ropes) {
            r.p[last] = (r.p[last] ?? 0) + dx;
            r.p[last + 1] = (r.p[last + 1] ?? 0) + dy;
            r.p[last + 2] = (r.p[last + 2] ?? 0) + dz;
          }
        }
        if (excitedRef.current) {
          const vz = (ropes[0]?.p[last + 2] ?? 0) - (ropes[0]?.q[last + 2] ?? 0);
          if (Math.abs(vz) > 1e-4) pushDir = Math.sign(vz);
          nudge(0, 0, -pushDir * 0.0009); // keeps it swinging while the page waits
        }
        integrate();
        solve();
        seatMid(mid);
        moved =
          Math.abs((ropes[0]?.p[last] ?? 0) - (ropes[0]?.q[last] ?? 0)) +
          Math.abs((ropes[0]?.p[last + 2] ?? 0) - (ropes[0]?.q[last + 2] ?? 0));
      }
      draw();
      calm = moved < 1e-5 && !dragging && !excitedRef.current ? calm + 1 : 0;
      if (calm > 90) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      calm = 0;
      if (running || still) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    // The mist: it gyrates on its own clock, whatever the swing does, until the page closes (and not at all for a user
    // who asks for reduced motion, who gets one still frame).
    let mistRaf = 0;
    let lastMist = 0;
    let lastInk = 0;
    const mistFrame = (now: number) => {
      mistRaf = requestAnimationFrame(mistFrame);
      // The mist's turning eases toward where it was dragged to; the picture is drawn on every frame.
      const k = 1 - Math.exp(-SWIRL_EASE * Math.min(0.1, (now - lastMist) / 1000));
      lastMist = now;
      swirl += (swirlTarget - swirl) * k;
      mist?.setSwirl(swirl);
      if (mist && !still) {
        const q = Math.min(1, mist.elapsed() / INTRO.cameraTake);
        const settle = (1 - q) ** 3;
        if (settle > 1e-4 || introAz !== 0) {
          introAz = INTRO_AZIMUTH * settle;
          introPitch = INTRO_PITCH * settle;
          if (q >= 1) introAz = introPitch = 0;
          placeCamera();
        }
      }
      if (now - lastInk > 500) {
        lastInk = now;
        readInk();
      }
      present(now / 1000);
    };

    resize();
    recolor();
    loadCloud()
      .then((places) => {
        if (disposed) return;
        mist = createMist(places, !still);
        mist.setColor(ink);
        present(performance.now() / 1000);
        // it fades in, so a late arrival looks meant
        holder.style.opacity = "1";
        performance.mark("swingset:shown");
      })
      .catch(() => undefined); // no cloud: the page works without the picture
    const onResize = () => {
      resize();
      draw();
      present(performance.now() / 1000);
    };
    const ro = new ResizeObserver(() => {
      resize();
      draw();
      present(performance.now() / 1000);
    });
    ro.observe(el);
    window.addEventListener("resize", onResize);
    if (!still) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("blur", onLeave);
      document.documentElement.addEventListener("pointerleave", onLeave);
      wake();
      mistRaf = requestAnimationFrame(mistFrame);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(mistRaf);
      running = false;
      wakeRef.current = () => undefined;
      ro.disconnect();
      probe.remove();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.body.style.cursor = "";
      for (const [i, n] of locks.entries())
        lockProps.forEach((p, j) => ((n.style as never)[p] = (was[i]?.[j] ?? "") as never));
      frameGeometry.dispose();
      swingGeometry.dispose();
      material.dispose();
      swingMaterial.dispose();
      seatMaterial.dispose();
      seatGeometry.dispose();
      renderer.dispose();
      canvas.remove();
      disposed = true;
      mist?.dispose();
      frameTarget.dispose();
    };
  }, [contained]);

  return (
    <div ref={host} className="absolute inset-0 touch-none" aria-hidden="true">
      {/* Larger than the box and centred on it, so nothing the swing does is cut off at the edge of the picture. */}
      <div ref={wrap} className="pointer-events-none absolute" />
    </div>
  );
}
