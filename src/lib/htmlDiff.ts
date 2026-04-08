/**
 * htmlDiff.ts
 *
 * Word-level LCS diff between two HTML strings.
 * Returns HTML with <ins> and <del> tags marking changes.
 *
 * Strategy:
 *   1. Tokenize both strings into words/spaces/punctuation (preserving HTML tags as atomic tokens).
 *   2. Run a classic LCS-based diff on the token arrays.
 *   3. Re-assemble the token stream, wrapping deltas with <ins> / <del>.
 *
 * Performance: works well for documents up to ~5 000 words (typical contract).
 * For larger documents the DP table can be chunked; that is a Phase 2 concern.
 */

type DiffType = 'equal' | 'insert' | 'delete';
interface DiffToken { type: DiffType; value: string }

// Tokenize: HTML tags are kept as atomic units so they are never split mid-tag.
function tokenize(html: string): string[] {
  // Match: HTML tags | whitespace runs | non-whitespace word chars | punctuation
  return html.match(/<[^>]+>|\s+|[^\s<>]+/g) ?? [];
}

// Iterative LCS backtrack to avoid stack-overflow on large docs
function lcsBacktrack(a: string[], b: string[]): DiffToken[] {
  const m = a.length;
  const n = b.length;

  // Build DP table (LCS lengths)
  // Use Uint16Array for memory efficiency; max LCS len ≤ 65 535 which covers any contract
  const dp: Uint16Array[] = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack iteratively
  const result: DiffToken[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal',  value: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'delete', value: a[i - 1] });
      i--;
    }
  }
  return result;
}

// Merge consecutive same-type tokens so we don't wrap each word in its own tag
function merge(tokens: DiffToken[]): DiffToken[] {
  const out: DiffToken[] = [];
  for (const t of tokens) {
    if (out.length > 0 && out[out.length - 1].type === t.type) {
      out[out.length - 1].value += t.value;
    } else {
      out.push({ ...t });
    }
  }
  return out;
}

/**
 * Returns HTML string with inline <ins> and <del> marks.
 *
 * Styles are inline so they render correctly even without a stylesheet.
 * The calling component can override via CSS targeting ins.diff-ins / del.diff-del.
 */
export function htmlDiff(oldHtml: string, newHtml: string): string {
  if (oldHtml === newHtml) return newHtml;

  const a = tokenize(oldHtml);
  const b = tokenize(newHtml);
  const tokens = merge(lcsBacktrack(a, b));

  const parts: string[] = [];
  for (const { type, value } of tokens) {
    if (type === 'equal') {
      parts.push(value);
    } else if (type === 'insert') {
      parts.push(
        `<ins class="diff-ins" style="background:#dcfce7;text-decoration:underline;color:#166534;border-radius:2px;">${value}</ins>`
      );
    } else {
      parts.push(
        `<del class="diff-del" style="background:#fee2e2;text-decoration:line-through;color:#991b1b;border-radius:2px;">${value}</del>`
      );
    }
  }
  return parts.join('');
}

/** Count the number of changed tokens (insertions + deletions) */
export function countChanges(oldHtml: string, newHtml: string): number {
  if (oldHtml === newHtml) return 0;
  const a = tokenize(oldHtml);
  const b = tokenize(newHtml);
  return lcsBacktrack(a, b).filter(t => t.type !== 'equal').length;
}
