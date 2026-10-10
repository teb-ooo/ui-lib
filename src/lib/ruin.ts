/**
 * The maths of `FatalPage`'s picture: a seeded random source, how chaotic it is at a moment, how a word falls apart, and
 * a waveform that stops being one. Pure and deterministic for a seed, so it can be tested without a canvas.
 */

/** A small seeded random source (mulberry32): the same seed gives the same sequence. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seconds per cycle: the picture builds toward a collapse, falls, and starts again worse. */
export const CYCLE = 9;
/** The last part of a cycle, in seconds, that is the collapse. */
export const COLLAPSE = 1.4;

export interface Moment {
  /** 0 (a flicker of trouble) to 1 (everything at once). */
  chaos: number;
  /** 0 to 1 through the collapse at the end of a cycle, else 0. */
  collapse: number;
  /** Which cycle this is, from 0: later ones start angrier. */
  cycle: number;
}

/** How bad it is at `t` seconds. It builds over a cycle, collapses, and each cycle starts higher than the last. */
export function momentAt(t: number): Moment {
  const cycle = Math.floor(t / CYCLE);
  const into = t - cycle * CYCLE;
  const base = Math.min(0.55, 0.22 + cycle * 0.12);
  const build = Math.min(1, into / (CYCLE - COLLAPSE));
  const collapse = into > CYCLE - COLLAPSE ? (into - (CYCLE - COLLAPSE)) / COLLAPSE : 0;
  const chaos = Math.min(1, base + (1 - base) * build * build + collapse * 0.4);
  return { chaos, collapse: Math.min(1, collapse), cycle };
}

const DEBRIS = ["█", "▓", "▒", "░", "▄", "▀", "▌", "▐", "╳", "?", "#"];

/**
 * The title as it is drawn at a moment: each letter may drop out, be replaced by wreckage, or stay, more of them the worse
 * it gets. Spaces stay. At `chaos` 0 it is the word.
 */
export function corruptText(text: string, chaos: number, random: () => number): string {
  let out = "";
  for (const ch of text) {
    if (ch === " ") {
      out += ch;
      continue;
    }
    const r = random();
    if (r < chaos * 0.28) out += DEBRIS[Math.floor(random() * DEBRIS.length)];
    else if (r < chaos * 0.4) out += " ";
    else out += ch;
  }
  return out;
}

/**
 * One waveform's height (-1 to 1) at horizontal position `x` (0 to 1): a clean sine at no chaos, then harmonics, jitter and
 * clipping, and at the top of the range it is mostly noise with the sine still struggling underneath.
 */
export function wave(x: number, t: number, chaos: number, random: () => number, seed: number): number {
  const base = Math.sin((x * (6 + seed * 3) + t * (1.5 + seed)) * Math.PI * 2 * 0.5);
  const harmonics = Math.sin(x * 47 + t * 9 + seed) * chaos * 0.6 + Math.sin(x * 113 - t * 21) * chaos * chaos * 0.5;
  const noise = (random() * 2 - 1) * chaos * chaos * 1.1;
  const v = base * (1 - chaos * 0.35) + harmonics + noise;
  // it clips, like something overdriven
  return Math.max(-1, Math.min(1, v * (1 + chaos)));
}
