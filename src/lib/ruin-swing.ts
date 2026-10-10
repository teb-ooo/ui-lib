import { rng } from "./ruin";

/**
 * The swingset of `FatalPage`, in three dimensions and the same shape as the enter page's, but ruined: it is thrashed by
 * gusts, a rope snaps, the frame comes apart piece by piece and falls, and everything ends on the ground. A small rope
 * simulation (Verlet particles that cannot stretch but can go slack) for the ropes and the seat, and free-falling sticks for
 * the frame. Pure maths with a seeded random source, so it can be tested without a canvas.
 */

export type V3 = [number, number, number];

export const BEAM_Y = 3;
export const BEAM_HALF = 2.1;
const LEG_SPREAD = 0.9;
const CROSSBAR_Y = 0.3;
const ROPE_LENGTH = 2.2;
const ROPE_PARTS = 6;
const SEAT_WIDTH = 1.2;
const SEAT_DEPTH = 0.34;
const ROPE_X = SEAT_WIDTH / 2;
const GRAVITY = 15;
const AIR = 0.995;

/** Seconds from the start of a cycle: the rope snaps, the frame starts to come apart, and when it is all down. */
export const SNAP_AT = 5.2;
export const COLLAPSE_AT = 6.2;
export const CYCLE = 11;

interface Stick {
  a: V3;
  b: V3;
  pa: V3;
  pb: V3;
  len: number;
  free: boolean;
  freeAt: number;
}
interface Rope {
  p: Float32Array;
  q: Float32Array;
  /** The particle after which the rope has snapped (-1: whole). */
  broken: number;
}
export interface Spark {
  p: V3;
  v: V3;
  life: number;
  hot: number;
}

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function makeStick(a: V3, b: V3, freeAt: number): Stick {
  return { a: [...a], b: [...b], pa: [...a], pb: [...b], len: dist(a, b), free: false, freeAt };
}

export class RuinedSwing {
  t = 0;
  readonly sticks: Stick[] = [];
  readonly ropes: Rope[] = [];
  sparks: Spark[] = [];
  /** Events since the last `take`: the star field is pushed outward when they happen. */
  private events: { kind: "snap" | "fall" | "hit"; at: V3 }[] = [];
  private random: () => number;
  private snapped = false;
  private nextGust = 0.4;
  private hits = new Set<Stick>();
  readonly violence: number;

  /** `violence` (0 to 1) is how angry this cycle is from the start; later cycles are worse. */
  constructor(seed: number, violence = 0) {
    this.random = rng(seed);
    this.violence = violence;
    const r = this.random;
    const add = (a: V3, b: V3, at: number) => this.sticks.push(makeStick(a, b, at));
    // the beam and the two A-shaped ends: legs go in a random order
    add([-BEAM_HALF, BEAM_Y, 0], [BEAM_HALF, BEAM_Y, 0], COLLAPSE_AT + 1.1 + r() * 0.4);
    for (const x of [-BEAM_HALF, BEAM_HALF]) {
      add([x, BEAM_Y, 0], [x, 0, -LEG_SPREAD], COLLAPSE_AT + r() * 0.9);
      add([x, BEAM_Y, 0], [x, 0, LEG_SPREAD], COLLAPSE_AT + r() * 0.9);
      const zb = LEG_SPREAD * (1 - CROSSBAR_Y / BEAM_Y);
      add([x, CROSSBAR_Y, -zb], [x, CROSSBAR_Y, zb], COLLAPSE_AT + 0.3 + r() * 0.9);
    }
    for (const x of [-ROPE_X, ROPE_X]) this.ropes.push(this.makeRope(x, 0.9 + violence * 0.4));
  }

  private makeRope(x: number, theta: number): Rope {
    const n = ROPE_PARTS + 1;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const d = (ROPE_LENGTH * i) / ROPE_PARTS;
      p[i * 3] = x;
      p[i * 3 + 1] = BEAM_Y - d * Math.cos(theta);
      p[i * 3 + 2] = d * Math.sin(theta);
    }
    return { p, q: Float32Array.from(p), broken: -1 };
  }

  /** Where the beam is, so the ropes hang from it wherever it goes. */
  private anchor(x: number): V3 {
    const beam = this.sticks[0]!;
    const k = (x + BEAM_HALF) / (2 * BEAM_HALF);
    return [beam.a[0] + (beam.b[0] - beam.a[0]) * k, beam.a[1] + (beam.b[1] - beam.a[1]) * k, beam.a[2] + (beam.b[2] - beam.a[2]) * k];
  }

  /** How bad it is, 0 to 1: it builds to the snap, peaks while the frame falls, and stays high. */
  chaos(): number {
    const build = Math.min(1, this.t / SNAP_AT);
    const base = 0.25 + this.violence * 0.3;
    const c = base + (1 - base) * build * build;
    return this.t > COLLAPSE_AT ? 1 : c;
  }

  /** The events since the last call (the caller pushes the star field outward at each). */
  take() {
    const e = this.events;
    this.events = [];
    return e;
  }

  step(dt: number) {
    this.t += dt;
    const r = this.random;
    // gusts: random shoves to the seat, faster and harder as it gets worse
    if (this.t < COLLAPSE_AT + 1 && this.t >= this.nextGust) {
      const c = this.chaos();
      this.nextGust = this.t + 0.25 + (1 - c) * 0.9 * r();
      const m = 0.025 + c * 0.05;
      this.nudge((r() - 0.5) * 2 * m, (r() - 0.3) * m, (r() - 0.5) * 2 * m * 1.6);
    }
    if (!this.snapped && this.t >= SNAP_AT) this.snap();
    this.integrateRopes(dt);
    this.solveRopes();
    this.stepSticks(dt);
    this.stepSparks(dt);
  }

  private nudge(dx: number, dy: number, dz: number) {
    const last = ROPE_PARTS * 3;
    for (const rope of this.ropes) {
      rope.q[last] = (rope.q[last] ?? 0) - dx;
      rope.q[last + 1] = (rope.q[last + 1] ?? 0) - dy;
      rope.q[last + 2] = (rope.q[last + 2] ?? 0) - dz;
    }
  }

  private snap() {
    this.snapped = true;
    const rope = this.ropes[this.random() < 0.5 ? 0 : 1]!;
    rope.broken = 2 + Math.floor(this.random() * 2);
    const at: V3 = [rope.p[rope.broken * 3] ?? 0, rope.p[rope.broken * 3 + 1] ?? 0, rope.p[rope.broken * 3 + 2] ?? 0];
    this.events.push({ kind: "snap", at });
    this.burst(at, 90, 9);
    // the seat is flung by the release
    this.nudge((this.random() - 0.5) * 0.3, 0.12, (this.random() - 0.5) * 0.4);
  }

  private burst(at: V3, n: number, speed: number) {
    for (let i = 0; i < n; i += 1) {
      const a = this.random() * Math.PI * 2;
      const b = (this.random() - 0.3) * Math.PI;
      const s = speed * (0.3 + this.random());
      this.sparks.push({ p: [...at], v: [Math.cos(a) * Math.cos(b) * s, Math.sin(b) * s + 2, Math.sin(a) * Math.cos(b) * s], life: 0.6 + this.random() * 1.6, hot: this.random() });
    }
  }

  private integrateRopes(dt: number) {
    const g = GRAVITY * dt * dt;
    const k = dt * 60;
    for (const [ri, rope] of this.ropes.entries()) {
      const anchor = this.anchor(ri === 0 ? -ROPE_X : ROPE_X);
      for (let i = 0; i <= ROPE_PARTS; i += 1) {
        if (i === 0 && rope.broken < 0) {
          for (let c = 0; c < 3; c += 1) {
            rope.q[c] = rope.p[c] ?? 0;
            rope.p[c] = anchor[c]!;
          }
          continue;
        }
        if (i === 0) {
          // a snapped rope's top still hangs from the beam
          for (let c = 0; c < 3; c += 1) {
            rope.q[c] = rope.p[c] ?? 0;
            rope.p[c] = anchor[c]!;
          }
          continue;
        }
        for (let c = 0; c < 3; c += 1) {
          const j = i * 3 + c;
          const cur = rope.p[j] ?? 0;
          let next = cur + (cur - (rope.q[j] ?? 0)) * Math.pow(AIR, k);
          if (c === 1) next -= g;
          rope.q[j] = cur;
          rope.p[j] = next;
        }
        if ((rope.p[i * 3 + 1] ?? 0) < 0.05) {
          if ((rope.q[i * 3 + 1] ?? 0) - (rope.p[i * 3 + 1] ?? 0) > 0.05 && this.random() < 0.1) this.burst([rope.p[i * 3] ?? 0, 0.05, rope.p[i * 3 + 2] ?? 0], 5, 3);
          rope.p[i * 3 + 1] = 0.05; // the ground
        }
      }
    }
  }

  private pull(rope: Rope, a: number, b: number, rest: number, wa: number, wb: number) {
    const ax = rope.p[a * 3] ?? 0;
    const ay = rope.p[a * 3 + 1] ?? 0;
    const az = rope.p[a * 3 + 2] ?? 0;
    const dx = (rope.p[b * 3] ?? 0) - ax;
    const dy = (rope.p[b * 3 + 1] ?? 0) - ay;
    const dz = (rope.p[b * 3 + 2] ?? 0) - az;
    const d = Math.hypot(dx, dy, dz) || 1e-6;
    if (d <= rest) return; // a rope can go slack
    const f = (d - rest) / d / (wa + wb);
    rope.p[a * 3] = ax + dx * f * wa;
    rope.p[a * 3 + 1] = ay + dy * f * wa;
    rope.p[a * 3 + 2] = az + dz * f * wa;
    rope.p[b * 3] = (rope.p[b * 3] ?? 0) - dx * f * wb;
    rope.p[b * 3 + 1] = (rope.p[b * 3 + 1] ?? 0) - dy * f * wb;
    rope.p[b * 3 + 2] = (rope.p[b * 3 + 2] ?? 0) - dz * f * wb;
  }

  private solveRopes() {
    const seg = ROPE_LENGTH / ROPE_PARTS;
    const last = ROPE_PARTS * 3;
    const [l, r] = this.ropes as [Rope, Rope];
    for (let it = 0; it < 24; it += 1) {
      for (const rope of this.ropes) {
        for (let i = 0; i < ROPE_PARTS; i += 1) {
          if (i === rope.broken) continue; // snapped here: the two halves are no longer joined
          this.pull(rope, i, i + 1, seg, i === 0 ? 0 : 1, i + 1 === ROPE_PARTS ? 0.25 : 1);
        }
      }
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
  }

  private stepSticks(dt: number) {
    const g = GRAVITY * dt * dt;
    for (const s of this.sticks) {
      if (!s.free && this.t >= s.freeAt) {
        s.free = true;
        const mid: V3 = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2, (s.a[2] + s.b[2]) / 2];
        this.events.push({ kind: "fall", at: mid });
        this.burst(mid, 30, 5);
        // a shove so it topples rather than drops
        s.pa[0] -= (this.random() - 0.5) * 0.05;
        s.pb[0] += (this.random() - 0.5) * 0.05;
        s.pa[2] -= (this.random() - 0.5) * 0.06;
      }
      if (!s.free) continue;
      for (const [p, q] of [[s.a, s.pa], [s.b, s.pb]] as const) {
        for (let c = 0; c < 3; c += 1) {
          const cur = p[c]!;
          let next = cur + (cur - q[c]!) * 0.995;
          if (c === 1) next -= g;
          q[c] = cur;
          p[c] = next;
        }
        if (p[1] < 0) {
          if (q[1] - p[1] > 0.04 && !this.hits.has(s)) {
            this.hits.add(s);
            this.events.push({ kind: "hit", at: [p[0], 0, p[2]] });
            this.burst([p[0], 0.05, p[2]], 25, 4);
          }
          p[1] = 0;
          q[1] = p[1] + (q[1] - p[1]) * -0.35; // a bounce that dies
          q[0] = p[0] - (p[0] - q[0]) * 0.8; // and drags
          q[2] = p[2] - (p[2] - q[2]) * 0.8;
        }
      }
      for (let it = 0; it < 6; it += 1) {
        const d = dist(s.a, s.b) || 1e-6;
        const f = (d - s.len) / d / 2;
        for (let c = 0; c < 3; c += 1) {
          const delta = (s.b[c]! - s.a[c]!) * f;
          s.a[c] = s.a[c]! + delta;
          s.b[c] = s.b[c]! - delta;
        }
      }
      // nothing goes through the ground, whatever the constraint did
      s.a[1] = Math.max(0, s.a[1]);
      s.b[1] = Math.max(0, s.b[1]);
    }
  }

  private stepSparks(dt: number) {
    for (const s of this.sparks) {
      s.life -= dt;
      s.v[1] -= GRAVITY * 0.5 * dt;
      for (let c = 0; c < 3; c += 1) s.p[c] = s.p[c]! + s.v[c]! * dt;
      if (s.p[1] < 0.02) {
        s.p[1] = 0.02;
        s.v[1] *= -0.3;
      }
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }

  /** The seat's four corners, from the two rope ends. */
  seat(): V3[] {
    const last = ROPE_PARTS * 3;
    const [l, r] = this.ropes as [Rope, Rope];
    const a: V3 = [l.p[last] ?? 0, l.p[last + 1] ?? 0, l.p[last + 2] ?? 0];
    const b: V3 = [r.p[last] ?? 0, r.p[last + 1] ?? 0, r.p[last + 2] ?? 0];
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ul = Math.hypot(...u) || 1;
    const un: V3 = [u[0] / ul, u[1] / ul, u[2] / ul];
    // a depth direction: perpendicular to the bar, as flat as the ropes allow
    const above: V3 = [(l.p[last - 3] ?? 0) - a[0], (l.p[last - 2] ?? 0) - a[1], (l.p[last - 1] ?? 0) - a[2]];
    const w: V3 = [un[1] * above[2] - un[2] * above[1], un[2] * above[0] - un[0] * above[2], un[0] * above[1] - un[1] * above[0]];
    const wl = Math.hypot(...w) || 1;
    const k = SEAT_DEPTH / 2 / wl;
    const floor = (v: V3): V3 => [v[0], Math.max(0.02, v[1]), v[2]];
    return ([
      [a[0] - w[0] * k, a[1] - w[1] * k, a[2] - w[2] * k],
      [b[0] - w[0] * k, b[1] - w[1] * k, b[2] - w[2] * k],
      [b[0] + w[0] * k, b[1] + w[1] * k, b[2] + w[2] * k],
      [a[0] + w[0] * k, a[1] + w[1] * k, a[2] + w[2] * k],
    ] as V3[]).map(floor);
  }

  /** Every line to draw: frame sticks, rope links (not across a snap) and the seat's outline, as pairs of 3D points. */
  lines(): { a: V3; b: V3; kind: "frame" | "rope" | "seat" }[] {
    const out: { a: V3; b: V3; kind: "frame" | "rope" | "seat" }[] = [];
    for (const s of this.sticks) out.push({ a: s.a, b: s.b, kind: "frame" });
    for (const rope of this.ropes) {
      for (let i = 0; i < ROPE_PARTS; i += 1) {
        if (i === rope.broken) continue;
        out.push({ a: [rope.p[i * 3] ?? 0, rope.p[i * 3 + 1] ?? 0, rope.p[i * 3 + 2] ?? 0], b: [rope.p[i * 3 + 3] ?? 0, rope.p[i * 3 + 4] ?? 0, rope.p[i * 3 + 5] ?? 0], kind: "rope" });
      }
    }
    const seat = this.seat();
    for (let i = 0; i < 4; i += 1) out.push({ a: seat[i]!, b: seat[(i + 1) % 4]!, kind: "seat" });
    return out;
  }
}
