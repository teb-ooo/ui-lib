/** Small helpers for `FatalPage`: a seeded random source and the word with its letters in the wrong order. Pure and testable. */

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

/** The word with its letters in a new order (a Fisher-Yates shuffle): the same letters, wrongly arranged. Spaces stay put. */
export function shuffleWord(text: string, random: () => number): string {
  const chars = [...text];
  const at = chars.map((c, i) => (c === " " ? -1 : i)).filter((i) => i >= 0);
  const letters = at.map((i) => chars[i]!);
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [letters[i], letters[j]] = [letters[j]!, letters[i]!];
  }
  at.forEach((pos, k) => {
    chars[pos] = letters[k]!;
  });
  return chars.join("");
}
