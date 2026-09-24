/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/boundaryDetector.ts
 *
 * Deterministic Boundary Detector:
 * Locates natural structural, semantic, and syntactic seam boundaries
 * within context streams (Markdown headers, code blocks, paragraphs, sentences).
 */

import { BoundaryType } from './types.js';

export interface DetectedBoundary {
  readonly charIndex: number;
  readonly type: BoundaryType;
  readonly priority: number; // Higher number = stronger boundary
}

export class BoundaryDetector {
  /**
   * Scans text to find all natural structural and syntactic boundaries.
   */
  public static scanBoundaries(text: string): readonly DetectedBoundary[] {
    const boundaries: DetectedBoundary[] = [];
    const len = text.length;

    // Boundary 0: Stream start
    boundaries.push({ charIndex: 0, type: 'STREAM_START', priority: 100 });

    let inCodeBlock = false;

    // Scan character by character with lookahead
    for (let i = 0; i < len; i++) {
      // 1. Code Block Fence check (```)
      if (text.startsWith('```', i)) {
        inCodeBlock = !inCodeBlock;
        boundaries.push({ charIndex: i, type: 'CODE_BLOCK', priority: 90 });
        i += 2;
        continue;
      }

      // If inside code block, do not split unless code block ends
      if (inCodeBlock) {
        continue;
      }

      // 2. Markdown Heading check (newline followed by # )
      if (
        (i === 0 || text[i - 1] === '\n') &&
        text[i] === '#' &&
        (text.startsWith('# ', i) ||
          text.startsWith('## ', i) ||
          text.startsWith('### ', i) ||
          text.startsWith('#### ', i))
      ) {
        boundaries.push({ charIndex: i, type: 'MARKDOWN_HEADING', priority: 80 });
        continue;
      }

      // 3. Paragraph Break check (\n\n+)
      if (text[i] === '\n' && i + 1 < len && text[i + 1] === '\n') {
        let skip = 1;
        while (i + skip < len && text[i + skip] === '\n') {
          skip++;
        }
        boundaries.push({ charIndex: i, type: 'PARAGRAPH', priority: 70 });
        i += skip - 1;
        continue;
      }

      // 4. Spatial Coordinate Anchor check (e.g., "[0, 0, 0]" or "HCP-CELL")
      if (text.startsWith('HCP-CELL', i) || (text[i] === '[' && /\b\d+\s*,\s*\d+\s*,\s*\d+\b/.test(text.slice(i, i + 16)))) {
        boundaries.push({ charIndex: i, type: 'SPATIAL_ANCHOR', priority: 65 });
        continue;
      }

      // 5. Sentence Terminator check (.!? followed by whitespace)
      if (
        (text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        i + 1 < len &&
        (text[i + 1] === ' ' || text[i + 1] === '\n')
      ) {
        boundaries.push({ charIndex: i + 1, type: 'SENTENCE', priority: 50 });
        continue;
      }
    }

    // End of stream
    boundaries.push({ charIndex: len, type: 'STREAM_END', priority: 100 });

    // Deduplicate boundaries at same index (keep highest priority)
    const byIndex = new Map<number, DetectedBoundary>();
    for (const b of boundaries) {
      const existing = byIndex.get(b.charIndex);
      if (!existing || b.priority > existing.priority) {
        byIndex.set(b.charIndex, b);
      }
    }

    return Array.from(byIndex.values()).sort((a, b) => a.charIndex - b.charIndex);
  }

  /**
   * Finds the best cut position in text within [minChar, maxChar].
   * Falls back to whitespace if no structural boundary exists.
   */
  public static findBestCut(
    text: string,
    minChar: number,
    maxChar: number,
    boundaries: readonly DetectedBoundary[]
  ): { cutIndex: number; type: BoundaryType } {
    const clampedMin = Math.max(0, minChar);
    const clampedMax = Math.min(text.length, maxChar);

    // 1. Look for highest priority detected boundary within range
    const inRange = boundaries.filter(b => b.charIndex >= clampedMin && b.charIndex <= clampedMax);
    if (inRange.length > 0) {
      // Sort by priority descending, then by position descending (prefer larger chunk within range)
      inRange.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.charIndex - a.charIndex;
      });
      return { cutIndex: inRange[0].charIndex, type: inRange[0].type };
    }

    // 2. Fallback: find nearest whitespace before clampedMax
    for (let i = clampedMax; i >= clampedMin; i--) {
      if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
        return { cutIndex: i + 1, type: 'TOKEN_WINDOW' };
      }
    }

    // 3. Absolute fallback: hard cut at clampedMax
    return { cutIndex: clampedMax, type: 'TOKEN_WINDOW' };
  }
}
