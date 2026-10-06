/**
 * The shape of the mist and the cloud of points that fills it. Working the cloud out takes a moment (a noise volume, then
 * rejection sampling), so it is done in slices that hand the page back in between (`buildCloudSliced`) and the page stays usable.
 */

export const RADIUS = 17.6; // the mist fades to nothing at this distance from the swingset, at the ground
export const HEIGHT = 2.6; // the mist fades to nothing at this height
const SCALE = 0.3; // wisps across the field, per world unit (smaller is larger wisps)
const SCALE_UP = 0.18; // the same, for height (smaller makes the mist flatter)
export const SPIN = 0.04; // radians per second round the swingset; the direction alternates with height
export const SPIN_HEIGHT = 1.9; // radians of the alternation per unit of height
const THICKNESS = 0.8; // the mist thins out by this factor for every this many units of height
const POINTS = 48750; // the size of the cloud
const REACH = 2.2; // how much more of the cloud sits in the thick mist than in the thin
export const DOT_PX = 0.7; // the size of a point, in CSS pixels (below a device pixel it is drawn as one, fainter)
export const POINT_ALPHA = 0.4; // how strong a point is
export const SPARKS = 0.006; // the share of points that are bright and a little larger
export const FOOT = 0.3; // below this height the legs fade to nothing
export const HEAD_START = 25; // seconds the mist has already been gyrating when the page loads, so it starts a little stirred

const FX = 64; // the volume is computed once into a texture of this many voxels across, deep and tall
const FZ = 16;

/** A well mixed 32 bit hash of a lattice point and a seed (no visible lattice, unlike a hash built from sines). */
function hash32(a: number, b: number, c: number, seed: number): number {
  let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x2c1b3c6d) ^ Math.imul(seed, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
/** Gradient noise in three dimensions: smooth, about -1 to 1, with no grid-aligned blocks. */
function perlin(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const dot = (i: number, j: number, k: number) => {
    const h = hash32(ix + i, iy + j, iz + k, seed);
    const a = (h / 4294967296) * Math.PI * 2;
    const c = (hash32(h, 7, 3, seed) / 4294967296) * 2 - 1; // the cosine of the other angle
    const s = Math.sqrt(1 - c * c);
    return Math.cos(a) * s * (fx - i) + Math.sin(a) * s * (fy - j) + c * (fz - k);
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const u = fade(fx);
  const v = fade(fy);
  const w = fade(fz);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const plane = (k: number) => lerp(lerp(dot(0, 0, k), dot(1, 0, k), u), lerp(dot(0, 1, k), dot(1, 1, k), u), v);
  return lerp(plane(0), plane(1), w) * 1.15;
}
/** Four octaves, each turned against the one before and shifted, so no direction or position repeats. */
function fbm(x: number, y: number, z: number, seed: number): number {
  let amp = 0.5;
  let sum = 0;
  let px = x;
  let py = y;
  let pz = z;
  for (let i = 0; i < 4; i++) {
    sum += amp * perlin(px, py, pz, seed + i * 31);
    const rx = px * 0.8 - py * 0.6;
    const ry = px * 0.6 + py * 0.8;
    px = rx * 2 + 17.1 * (i + 1);
    py = ry * 2 + 9.2 * (i + 1);
    pz = pz * 2 + 5.3 * (i + 1);
    amp *= 0.5;
  }
  return sum; // about -0.5 to 0.5
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The wisps of the volume: noise warped by more noise, thresholded into clumps and gaps. */
function* wispSteps(): Generator<void, Uint8Array> {
  const out = new Uint8Array(FX * FX * FZ);
  const size = RADIUS * 2;
  // the warp is the same at every height, so it is worked out once for every column
  const warp = new Float32Array(FX * FX * 2);
  for (let j = 0; j < FX; j++) {
    for (let i = 0; i < FX; i++) {
      const x = ((i + 0.5) / FX - 0.5) * size * SCALE;
      const y = ((j + 0.5) / FX - 0.5) * size * SCALE;
      warp[(j * FX + i) * 2] = fbm(x + 3, y + 3, 0.5, 11);
      warp[(j * FX + i) * 2 + 1] = fbm(x - 3, y - 3, 0.5, 23);
    }
    yield; // a row of the warp: time to hand the page back if the slice is used up
  }
  for (let k = 0; k < FZ; k++) {
    const z = ((k + 0.5) / FZ) * HEIGHT * SCALE_UP;
    for (let j = 0; j < FX; j++) {
      for (let i = 0; i < FX; i++) {
        const x = ((i + 0.5) / FX - 0.5) * size * SCALE;
        const y = ((j + 0.5) / FX - 0.5) * size * SCALE;
        const wx = warp[(j * FX + i) * 2] as number;
        const wy = warp[(j * FX + i) * 2 + 1] as number;
        const n = 0.5 + fbm(x + 2.2 * wx, y + 2.2 * wy, z, 37);
        out[(k * FX + j) * FX + i] = Math.round(255 * smooth(0.44, 0.58, n));
      }
      yield; // a row of the volume
    }
  }
  return out;
}

/** The cloud: places in the mist's own frame of reference, more where the mist is thicker, three numbers for each point. */
function* cloudSteps(): Generator<void, Float32Array> {
  const field = yield* wispSteps();
  const out = new Float32Array(POINTS * 3);
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) + 0x297a2d39) | 0;
    seed ^= seed >>> 12;
    seed = Math.imul(seed ^ (seed >>> 17), 0x165667b1);
    return (seed >>> 0) / 4294967296;
  };
  const at = (i: number, j: number, k: number) => field[(k * FX + j) * FX + i] ?? 0;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let n = 0;
  for (let tries = 0; n < POINTS && tries < POINTS * 400; tries++) {
    if (tries % 4000 === 3999) yield; // the rejection sampling: hand the page back now and then
    const x = (random() * 2 - 1) * RADIUS;
    const z = (random() * 2 - 1) * RADIUS;
    const y = random() * HEIGHT;
    const up = y / HEIGHT;
    const r = Math.hypot(x, z);
    const reach = RADIUS * (1 - 0.5 * smooth(0, 1, up));
    const d = r / reach;
    const weight =
      Math.exp(-3.5 * d * d) * (1 - smooth(0.75, 1, d)) * Math.exp(-y / THICKNESS) * (1 - smooth(0.6, 1, up));
    if (weight < 0.003) continue;
    // the field, read with a smooth (trilinear) lookup
    const fx = Math.min(FX - 1.001, Math.max(0, (x / (2 * RADIUS) + 0.5) * FX - 0.5));
    const fy = Math.min(FX - 1.001, Math.max(0, (z / (2 * RADIUS) + 0.5) * FX - 0.5));
    const fz = Math.min(FZ - 1.001, Math.max(0, up * FZ - 0.5));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const k = Math.floor(fz);
    const plane = (kk: number) =>
      lerp(lerp(at(i, j, kk), at(i + 1, j, kk), fx - i), lerp(at(i, j + 1, kk), at(i + 1, j + 1, kk), fx - i), fy - j);
    const mist = (lerp(plane(k), plane(k + 1), fz - k) / 255) * weight;
    if (random() > smooth(0.1, 0.7, mist * REACH)) continue; // contrast: clumps and clear gaps
    out[n * 3] = x;
    out[n * 3 + 1] = y;
    out[n * 3 + 2] = z;
    n++;
  }
  return n < POINTS ? out.slice(0, n * 3) : out;
}

/** The cloud, worked out in one go (a test, a script). The page uses `buildCloudSliced`. */
export function buildCloud(): Float32Array {
  const steps = cloudSteps();
  for (let r = steps.next(); ; r = steps.next()) if (r.done) return r.value;
}

/** Gives the page back to the browser: a message to ourselves, unlike a timer, is not held back to at least a few milliseconds. */
function breathe(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
}

/**
 * The cloud, worked out on the page's own thread in slices of a few milliseconds with the page handed back in between, so
 * the page stays usable (it took about a second in one piece on a fast machine, which is why it was once done in a worker;
 * a worker file is a bundler's and a content security policy's business, a slice is nobody's). The result is exactly what
 * `buildCloud` makes.
 */
export async function buildCloudSliced(sliceMs = 6): Promise<Float32Array> {
  const steps = cloudSteps();
  for (;;) {
    const until = performance.now() + sliceMs;
    do {
      const r = steps.next();
      if (r.done) return r.value;
    } while (performance.now() < until);
    await breathe();
  }
}

/** Names the cloud these constants make, so a cloud kept from an earlier visit is used only while it is still the same one. */
export const CLOUD_KEY = [RADIUS, HEIGHT, SCALE, SCALE_UP, THICKNESS, POINTS, REACH, FX, FZ, "cloud-1"].join("/");
