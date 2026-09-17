/**
 * CUBiO AI — Phase 6: Task 85
 * Hallucination Detection & Self-Verification Layer
 * src/cubio/language/native/verification/claimExtractor.ts
 *
 * Deterministic Natural Language Proposition & Claim Extractor.
 * Deconstructs candidate native responses, conversational texts, and reasoning
 * outputs into discrete, inspectable atomic factual claims with parsed
 * subject-predicate-object tuples, epistemic claims, and spatial boundaries.
 */

import * as crypto from 'crypto';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { ExtractedClaim } from './hallucinationVerificationTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import { LanguageStatementParser } from '../reasoning/languageStatementParser';

export class DeterministicClaimExtractor {
  private readonly _tokenizer: NativeTokenizer;
  private readonly _parser: LanguageStatementParser;

  constructor(tokenizer?: NativeTokenizer, parser?: LanguageStatementParser) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
    this._parser = parser ?? new LanguageStatementParser(this._tokenizer);
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  public get parser(): LanguageStatementParser {
    return this._parser;
  }

  /**
   * Extracts all atomic factual and declarative claims from candidate text.
   */
  public extractClaims(text: string): ExtractedClaim[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return [];
    }

    const claims: ExtractedClaim[] = [];
    const rawStatements = this._parser.splitStatements(trimmed);

    for (const stmt of rawStatements) {
      if (this._isConversationalOrStructuralFiller(stmt)) {
        continue;
      }

      const prop = this._parser.parseStatement(stmt);

      // Find character span in original text
      const startIdx = text.indexOf(stmt);
      const endIdx = startIdx >= 0 ? startIdx + stmt.length : 0;

      // Extract claimed epistemic status and confidence
      let claimedStatus: EpistemicStatus = prop.epistemicStatus;
      let claimedConfidence = prop.confidence;

      if (/^\[CANONICAL_FACT\]|^\[FACT\]/i.test(stmt)) {
        claimedStatus = 'CANONICAL_FACT';
        claimedConfidence = 1.0;
      } else if (/^\[EMPIRICAL_EVIDENCE\]|^\[EVIDENCE\]/i.test(stmt)) {
        claimedStatus = 'EMPIRICAL_EVIDENCE';
        claimedConfidence = 0.85;
      } else if (/^\[SUPPORTED_HYPOTHESIS\]|^\[HYPOTHESIS\]/i.test(stmt)) {
        claimedStatus = 'SUPPORTED_HYPOTHESIS';
        claimedConfidence = 0.60;
      } else if (/^\[PROVISIONAL_ASSUMPTION\]|^\[ASSUMPTION\]/i.test(stmt)) {
        claimedStatus = 'PROVISIONAL_ASSUMPTION';
        claimedConfidence = 0.45;
      } else if (/^\[EPISTEMIC_UNKNOWN\]|^\[UNKNOWN\]/i.test(stmt)) {
        claimedStatus = 'EPISTEMIC_UNKNOWN';
        claimedConfidence = 0.0;
      }

      // Extract spatial cell ID from statement if present (including out-of-bounds)
      let rawCellId: number | undefined = prop.spatialCellId;
      const cellMatch = stmt.match(/\b(?:cell|cellId|lattice cell)\s*[:=]?\s*(-?[0-9]+)\b/i);
      if (cellMatch) {
        rawCellId = parseInt(cellMatch[1], 10);
      }

      const claimHash = crypto
        .createHash('sha256')
        .update(`${prop.subject}:${prop.predicate}:${prop.object}:${prop.isNegated}:${claimedStatus}:${rawCellId}`)
        .digest('hex')
        .slice(0, 12);

      const claim: ExtractedClaim = Object.freeze({
        claimId: `claim_${claimHash}`,
        statement: stmt,
        subject: prop.subject.trim(),
        predicate: prop.predicate.trim(),
        object: typeof prop.object === 'string' ? prop.object.trim() : prop.object,
        isNegated: prop.isNegated,
        claimedEpistemicStatus: claimedStatus,
        claimedConfidence,
        spatialCellId: rawCellId,
        charSpan: Object.freeze({
          start: Math.max(0, startIdx),
          end: Math.max(0, endIdx),
        }),
      });

      claims.push(claim);
    }

    return claims;
  }

  /**
   * Filters out conversational greetings or meta-text that does not represent factual claims.
   */
  private _isConversationalOrStructuralFiller(stmt: string): boolean {
    const clean = stmt.trim().toLowerCase();
    if (
      /^(?:hello|hi|hey|greetings|welcome|thank you|thanks)[.?!]?$/i.test(clean) ||
      /^(?:operating in deterministic|permanent hardware actuation lock)[.?!]?$/i.test(clean) ||
      /^(?:proof trace:.*)$/i.test(clean)
    ) {
      return true;
    }
    return false;
  }
}
