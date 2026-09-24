/**
 * CUBiO AI — Task 175: Context Compression & Summarization
 * src/cubio/model/native_compression/antiFabricationVerifier.ts
 *
 * Anti-Fabrication & Grounding Verification Guard:
 * Rigorously checks compressed summaries against source contexts to prevent
 * hallucinations, fabricated claims, or unauthorized speculative assertions.
 * Rejects ungrounded summaries fail-closed.
 */

import { FabricatedSummaryRejectionError } from './types.js';

export interface GroundingVerificationResult {
  readonly isValid: boolean;
  readonly groundingFidelity: number;
  readonly totalContentTerms: number;
  readonly groundedTermsCount: number;
  readonly ungroundedTerms: readonly string[];
}

export class AntiFabricationVerifier {
  private static readonly STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
    'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
    'both', 'but', 'by', 'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
    'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
    'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
    'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
    'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
    'you', 'your', 'yours', 'yourself', 'yourselves',
  ]);

  private static readonly STRUCTURAL_KEYWORDS = new Set([
    'context', 'reference', 'references', 'index', 'total', 'ref', 'objectid',
    'tokens', 'checksum', 'epistemic', 'summary', 'section', 'propositions',
    'key', 'outline', 'canonical', 'spatial', 'anchor', 'export', 'function',
  ]);

  /**
   * Extracts clean normalized terms from text.
   */
  public static extractTerms(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\.]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().replace(/^[\.\-]+|[\.\-]+$/g, ''))
      .filter(t => t.length > 1);
  }

  /**
   * Verifies that the summary text is strictly grounded in the source text.
   * Throws FabricatedSummaryRejectionError if grounding is below threshold or
   * fabricated numeric/spatial coordinates are detected.
   */
  public static verifyGrounding(
    summaryText: string,
    sourceContent: string | readonly string[],
    threshold: number = 0.85
  ): GroundingVerificationResult {
    const combinedSource = Array.isArray(sourceContent) ? sourceContent.join('\n') : sourceContent;
    const sourceTerms = new Set(this.extractTerms(combinedSource));

    const summaryTerms = this.extractTerms(summaryText);
    const contentTerms = summaryTerms.filter(t => !this.STOP_WORDS.has(t));

    if (contentTerms.length === 0) {
      return {
        isValid: true,
        groundingFidelity: 1.0,
        totalContentTerms: 0,
        groundedTermsCount: 0,
        ungroundedTerms: [],
      };
    }

    const ungrounded: string[] = [];
    let groundedCount = 0;

    for (const term of contentTerms) {
      if (sourceTerms.has(term) || this.STRUCTURAL_KEYWORDS.has(term)) {
        groundedCount++;
      } else {
        // Structural tokens like markdown headers (#) or bullets (*) are stripped by extractTerms,
        // so any remaining token must appear in source
        ungrounded.push(term);
      }
    }

    // Strictly check for fabricated numbers or spatial cell anchors (e.g. HCP-CELL-*)
    const summarySpatialAnchors = summaryText.match(/hcp-cell-\d+-\d+-\d+/gi) || [];
    for (const anchor of summarySpatialAnchors) {
      if (!combinedSource.toLowerCase().includes(anchor.toLowerCase())) {
        ungrounded.push(anchor);
      }
    }

    const fidelity = groundedCount / contentTerms.length;

    if (fidelity < threshold || ungrounded.length > contentTerms.length * (1 - threshold)) {
      throw new FabricatedSummaryRejectionError(ungrounded, fidelity, threshold);
    }

    return Object.freeze({
      isValid: true,
      groundingFidelity: fidelity,
      totalContentTerms: contentTerms.length,
      groundedTermsCount: groundedCount,
      ungroundedTerms: Object.freeze(ungrounded),
    });
  }
}
