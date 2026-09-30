/** Result of matching a query against one string. */
export interface FuzzyMatch {
  /** Higher is better. Comparable only between matches of the same query. */
  score: number;
  /** Indices into the text (UTF-16 code units) of the matched characters, ascending. */
  indices: number[];
}

const BONUS_BOUNDARY = 8;
const BONUS_FIRST = 4;
const BONUS_CONSECUTIVE = 6;
const BONUS_EXACT_CASE = 0.5;
const PENALTY_GAP = 1;
const PENALTY_LEADING = 0.5;
const PENALTY_LENGTH = 0.02;
const BONUS_PREFIX = 10;
const BONUS_WHOLE = 20;

function isSeparator(ch: string): boolean {
  return /[\s\-_./:,;()[\]{}<>|\\'"]/u.test(ch);
}

/** True when index `i` starts a word: text start, after a separator, or a lower to upper camel transition. */
function isBoundary(text: string, i: number): boolean {
  if (i === 0) return true;
  const prev = text.charAt(i - 1);
  const cur = text.charAt(i);
  if (isSeparator(prev)) return true;
  return prev !== prev.toUpperCase() && cur !== cur.toLowerCase();
}

const NEG = Number.NEGATIVE_INFINITY;

/**
 * Case-insensitive subsequence match with bonuses for word boundaries and consecutive characters.
 * Finds the best-scoring alignment (dynamic programming), so "sh" prefers the start of "Show hidden"
 * over the middle of "Fresh". Returns `null` when `query` is not a subsequence of `text`.
 * An empty (or whitespace-only) query matches everything with score 0 and no indices.
 * Spaces in the query are ignored, so "go set" matches "Go to Settings".
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.replace(/\s+/gu, "");
  if (q === "") return { score: 0, indices: [] };
  const qLower = q.toLowerCase();
  const tLower = text.toLowerCase();
  const n = q.length;
  const m = text.length;
  if (n > m) return null;

  // score[i][j]: best score with q[i] matched at text[j]; from[i][j]: matched index of q[i-1].
  const score: number[][] = [];
  const from: number[][] = [];
  for (let i = 0; i < n; i++) {
    score.push(new Array<number>(m).fill(NEG));
    from.push(new Array<number>(m).fill(-1));
  }

  for (let j = 0; j < m; j++) {
    if (tLower.charAt(j) !== qLower.charAt(0)) continue;
    let s = 1 + (q.charAt(0) === text.charAt(j) ? BONUS_EXACT_CASE : 0);
    if (isBoundary(text, j)) s += BONUS_BOUNDARY;
    if (j === 0) s += BONUS_FIRST;
    s -= Math.min(j, 10) * PENALTY_LEADING;
    (score[0] as number[])[j] = s;
  }

  for (let i = 1; i < n; i++) {
    const prevRow = score[i - 1] as number[];
    const row = score[i] as number[];
    const fromRow = from[i] as number[];
    for (let j = i; j < m; j++) {
      if (tLower.charAt(j) !== qLower.charAt(i)) continue;
      let base = 1 + (q.charAt(i) === text.charAt(j) ? BONUS_EXACT_CASE : 0);
      if (isBoundary(text, j)) base += BONUS_BOUNDARY;
      let best = NEG;
      let bestK = -1;
      for (let k = i - 1; k < j; k++) {
        const p = prevRow[k] as number;
        if (p === NEG) continue;
        const gap = j - k - 1;
        const cand = p + base + (gap === 0 ? BONUS_CONSECUTIVE : -Math.min(gap, 6) * PENALTY_GAP);
        if (cand > best) {
          best = cand;
          bestK = k;
        }
      }
      if (bestK >= 0) {
        row[j] = best;
        fromRow[j] = bestK;
      }
    }
  }

  const last = score[n - 1] as number[];
  let bestScore = NEG;
  let bestJ = -1;
  for (let j = 0; j < m; j++) {
    const s = last[j] as number;
    if (s > bestScore) {
      bestScore = s;
      bestJ = j;
    }
  }
  if (bestJ < 0) return null;

  const indices = new Array<number>(n);
  let j = bestJ;
  for (let i = n - 1; i >= 0; i--) {
    indices[i] = j;
    j = (from[i] as number[])[j] as number;
  }

  let total = bestScore - text.length * PENALTY_LENGTH;
  if (tLower.startsWith(qLower)) total += BONUS_PREFIX;
  if (tLower === qLower) total += BONUS_WHOLE;
  return { score: total, indices };
}

/** Splits `text` into runs for highlighting: `[text, matched]` pairs covering the whole string. */
export function highlightRuns(text: string, indices: readonly number[]): Array<[string, boolean]> {
  if (indices.length === 0) return [[text, false]];
  const set = new Set(indices);
  const runs: Array<[string, boolean]> = [];
  let buf = "";
  let cur = false;
  for (let i = 0; i < text.length; i++) {
    const hit = set.has(i);
    if (i > 0 && hit !== cur) {
      runs.push([buf, cur]);
      buf = "";
    }
    cur = hit;
    buf += text.charAt(i);
  }
  if (buf !== "") runs.push([buf, cur]);
  return runs;
}
