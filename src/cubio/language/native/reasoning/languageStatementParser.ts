/**
 * CUBiO AI — Phase 6: Task 80
 * Multi-Step Language Reasoning Layer
 * src/cubio/language/native/reasoning/languageStatementParser.ts
 *
 * Deterministic Natural Language Statement & Proposition Parser.
 * Translates unstructured and semi-structured linguistic text, compound statements,
 * relational assertions, and spatial locations into canonical propositions,
 * reasoning premises, and canonical facts.
 */

import * as crypto from 'crypto';
import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import {
  ReasoningPremise,
  PremiseType,
  EpistemicStatus as ReasoningEpistemicStatus,
} from '../../../reasoning/native/reasoningTypes';
import { CanonicalFact } from '../../../reasoning/state/reasoningStateTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import {
  ParsedProposition,
  PropositionRelationType,
  LanguageReasoningQuery,
} from './languageReasoningTypes';

export class LanguageStatementParser {
  private readonly _tokenizer: NativeTokenizer;

  constructor(tokenizer?: NativeTokenizer) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  /**
   * Splits a multi-line or compound text passage into individual proposition strings.
   */
  public splitStatements(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    // Split on newlines, semicolons, and periods (preserving abbreviations/decimals)
    const rawLines = text
      .split(/\r?\n|;/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const statements: string[] = [];
    for (const line of rawLines) {
      // Split on sentence-ending periods, exclamation, or question marks
      const sentences = line
        .split(/(?<=[.?!])\s+(?=[A-Z0-9\[])/)
        .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
        .filter((s) => s.length > 0);

      for (const s of sentences) {
        statements.push(s);
      }
    }

    return statements;
  }

  /**
   * Parses an individual statement into a structured proposition.
   */
  public parseStatement(
    statement: string,
    options: {
      tenantId?: string;
      domain?: CanonicalDomain;
      sourceObjectId?: string;
      sourceSequenceId?: string;
    } = {}
  ): ParsedProposition {
    const raw = statement.trim();
    let clean = raw;

    // 1. Detect Epistemic Status & Tag
    let epistemicStatus: EpistemicStatus = 'CANONICAL_FACT';
    let confidence = 1.0;

    if (/^\[FACT\]|^\(?FACT\)?:\s*/i.test(clean)) {
      epistemicStatus = 'CANONICAL_FACT';
      confidence = 1.0;
      clean = clean.replace(/^\[FACT\]\s*|^\(?FACT\)?:\s*/i, '');
    } else if (/^\[EVIDENCE\]|^\(?EVIDENCE\)?:\s*/i.test(clean)) {
      epistemicStatus = 'EMPIRICAL_EVIDENCE';
      confidence = 0.85;
      clean = clean.replace(/^\[EVIDENCE\]\s*|^\(?EVIDENCE\)?:\s*/i, '');
    } else if (/^\[HYPOTHESIS\]|^\(?HYPOTHESIS\)?:\s*/i.test(clean)) {
      epistemicStatus = 'SUPPORTED_HYPOTHESIS';
      confidence = 0.60;
      clean = clean.replace(/^\[HYPOTHESIS\]\s*|^\(?HYPOTHESIS\)?:\s*/i, '');
    } else if (/^\[ASSUMPTION\]|^\(?ASSUMPTION\)?:\s*/i.test(clean)) {
      epistemicStatus = 'PROVISIONAL_ASSUMPTION';
      confidence = 0.45;
      clean = clean.replace(/^\[ASSUMPTION\]\s*|^\(?ASSUMPTION\)?:\s*/i, '');
    } else if (/^\[UNKNOWN\]|^\(?UNKNOWN\)?:\s*/i.test(clean)) {
      epistemicStatus = 'EPISTEMIC_UNKNOWN';
      confidence = 0.0;
      clean = clean.replace(/^\[UNKNOWN\]\s*|^\(?UNKNOWN\)?:\s*/i, '');
    } else {
      // Natural language speculative words heuristic
      if (/\b(might|maybe|perhaps|could|possibly|hypothetically)\b/i.test(clean)) {
        epistemicStatus = 'SUPPORTED_HYPOTHESIS';
        confidence = 0.55;
      }
    }

    // 2. Detect Negation
    let isNegated = false;
    if (/\b(is not|are not|cannot|does not|has no|never|not|no longer)\b/i.test(clean)) {
      isNegated = true;
    }

    // 3. Detect Spatial Coordinates & Cells
    let spatialCellId: number | undefined;
    const cellMatch = clean.match(/\b(?:cell|cellId|lattice cell)\s*[:=]?\s*([0-9]{1,3})\b/i);
    if (cellMatch) {
      const parsedCell = parseInt(cellMatch[1], 10);
      if (parsedCell >= 0 && parsedCell < 343) {
        spatialCellId = parsedCell;
      }
    }

    // 4. Parse Subject, RelationType, Predicate, and Object
    const parsed = this._extractSubjectPredicateObject(clean, isNegated, spatialCellId);

    const propHash = crypto
      .createHash('sha256')
      .update(`${parsed.subject}:${parsed.predicate}:${parsed.object}:${isNegated}:${epistemicStatus}`)
      .digest('hex')
      .slice(0, 12);

    return Object.freeze({
      propositionId: `prop_${propHash}`,
      subject: parsed.subject,
      predicate: parsed.predicate,
      relationType: parsed.relationType,
      object: parsed.object,
      isNegated,
      epistemicStatus,
      confidence,
      spatialCellId: spatialCellId ?? parsed.spatialCellId,
      rawStatement: raw,
      sourceSequenceId: options.sourceSequenceId,
      sourceObjectId: options.sourceObjectId,
    });
  }

  /**
   * Parses an array of statements into propositions.
   */
  public parseStatements(
    statements: readonly string[],
    options: {
      tenantId?: string;
      domain?: CanonicalDomain;
      sourceObjectId?: string;
      sourceSequenceId?: string;
    } = {}
  ): ParsedProposition[] {
    const propositions: ParsedProposition[] = [];
    for (const stmt of statements) {
      const subs = this.splitStatements(stmt);
      for (const s of subs) {
        propositions.push(this.parseStatement(s, options));
      }
    }
    return propositions;
  }

  /**
   * Converts parsed propositions into canonical facts for genesis state DAG.
   */
  public toCanonicalFacts(propositions: readonly ParsedProposition[]): CanonicalFact[] {
    const facts: CanonicalFact[] = [];
    for (const p of propositions) {
      // Unsupported assumptions, hypotheses, or unknown claims cannot become canonical facts
      if (
        p.epistemicStatus === 'SUPPORTED_HYPOTHESIS' ||
        p.epistemicStatus === 'PROVISIONAL_ASSUMPTION' ||
        p.epistemicStatus === 'EPISTEMIC_UNKNOWN'
      ) {
        continue;
      }

      const factChecksum = crypto
        .createHash('sha256')
        .update(`${p.subject}:${p.predicate}:${p.object}:${p.confidence}`)
        .digest('hex');

      const fact: CanonicalFact = Object.freeze({
        factId: `fact_${p.propositionId.replace('prop_', '')}`,
        subject: p.subject,
        predicate: p.isNegated ? `not_${p.predicate}` : p.predicate,
        object: p.object,
        confidence: p.confidence,
        sourceObjectId: p.sourceObjectId,
        cellId: p.spatialCellId,
        checksum: factChecksum,
      });

      facts.push(fact);
    }
    return facts;
  }

  /**
   * Converts parsed propositions into ReasoningPremise objects for the rule engine.
   */
  public toReasoningPremises(
    propositions: readonly ParsedProposition[],
    tenantId: string = DEFAULT_TENANT_ID
  ): ReasoningPremise[] {
    const premises: ReasoningPremise[] = [];

    for (let i = 0; i < propositions.length; i++) {
      const p = propositions[i];
      let premiseType: PremiseType = 'OBSERVED_FACT';
      let rStatus: ReasoningEpistemicStatus = 'ESTABLISHED_FACT';

      if (p.epistemicStatus === 'SUPPORTED_HYPOTHESIS') {
        premiseType = 'PROPOSED_HYPOTHESIS';
        rStatus = 'SUPPORTED_HYPOTHESIS';
      } else if (p.epistemicStatus === 'PROVISIONAL_ASSUMPTION' || p.epistemicStatus === 'EPISTEMIC_UNKNOWN') {
        premiseType = 'PROPOSED_HYPOTHESIS';
        rStatus = 'UNSUPPORTED';
      }

      const predicateStr = p.isNegated ? `not_${p.predicate}` : p.predicate;

      premises.push(
        Object.freeze({
          premiseId: `prem_${p.propositionId.replace('prop_', '')}_${i}`,
          type: premiseType,
          statement: p.rawStatement,
          subject: p.subject,
          predicate: predicateStr,
          object: p.object,
          confidence: p.confidence,
          epistemicStatus: rStatus,
          spatialCellId: p.spatialCellId,
          sourceObjectId: p.sourceObjectId,
          sourceStorageKey: p.sourceObjectId ? `${tenantId}:${p.sourceObjectId}` : undefined,
          timestamp: Date.now(),
        })
      );
    }

    return premises;
  }

  /**
   * Analyzes an interrogative question or goal text to extract the target subject, predicate, and object.
   */
  public parseQueryGoal(queryText: string): {
    targetSubject?: string;
    targetPredicate?: string;
    targetObject?: string | number;
  } {
    let clean = queryText
      .trim()
      .replace(/[?]+$/, '')
      .trim();

    // Pattern: "Is X connected to Y?"
    let m = clean.match(/^is\s+([a-zA-Z0-9_-]+)\s+connected\s+to\s+(.+)$/i);
    if (m) {
      return { targetSubject: m[1].toLowerCase(), targetPredicate: 'connected_to', targetObject: m[2].toLowerCase() };
    }

    // Pattern: "Does X have Y?" or "Has X Y?"
    m = clean.match(/^(?:does|do)\s+([a-zA-Z0-9_-]+)\s+(?:have|possess|contain)\s+(.+)$/i);
    if (m) {
      return { targetSubject: m[1].toLowerCase(), targetPredicate: 'has', targetObject: m[2].toLowerCase() };
    }

    // Pattern: "Where is X located?" or "Where is X?"
    m = clean.match(/^where\s+is\s+([a-zA-Z0-9_-]+)(?:\s+located)?$/i);
    if (m) {
      return { targetSubject: m[1].toLowerCase(), targetPredicate: 'located_at' };
    }

    // Pattern: "What is X?" or "Who is X?" or "What are X?"
    m = clean.match(/^(?:what|who)\s+(?:is|are)\s+(?:a\s+|an\s+|the\s+)?(.+)$/i);
    if (m) {
      return { targetSubject: m[1].trim().toLowerCase(), targetPredicate: 'is_a' };
    }

    // Pattern: "What does X orbit?"
    m = clean.match(/^what\s+does\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+)$/i);
    if (m) {
      return { targetSubject: m[1].toLowerCase(), targetPredicate: m[2].toLowerCase() };
    }

    // General Pattern: "Is X Y?" or "Are X Y?"
    m = clean.match(/^(?:is|are)\s+([a-zA-Z0-9_-]+)\s+(.+)$/i);
    if (m) {
      return { targetSubject: m[1].toLowerCase(), targetPredicate: 'is_a', targetObject: m[2].toLowerCase() };
    }

    // Fallback: simple token decomposition
    const words = clean.split(/\s+/);
    if (words.length >= 3) {
      return {
        targetSubject: words[0].toLowerCase(),
        targetPredicate: words[1].toLowerCase(),
        targetObject: words.slice(2).join(' ').toLowerCase(),
      };
    } else if (words.length === 2) {
      return {
        targetSubject: words[0].toLowerCase(),
        targetPredicate: words[1].toLowerCase(),
      };
    } else if (words.length === 1) {
      return {
        targetSubject: words[0].toLowerCase(),
      };
    }

    return {};
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private _extractSubjectPredicateObject(
    cleanText: string,
    isNegated: boolean,
    existingCellId?: number
  ): {
    subject: string;
    predicate: string;
    relationType: PropositionRelationType;
    object: string | number;
    spatialCellId?: number;
  } {
    let text = cleanText.replace(/[.!?,]$/, '').trim();

    // 1. Spatial statement: "X is located at cell Y" or "X is at cell Y"
    const spatialMatch = text.match(
      /^([a-zA-Z0-9_-]+)\s+(?:is\s+)?(?:located\s+at|at|in)\s+(?:cell\s*)?([0-9]{1,3})$/i
    );
    if (spatialMatch) {
      const cell = parseInt(spatialMatch[2], 10);
      return {
        subject: spatialMatch[1].toLowerCase(),
        predicate: 'located_at',
        relationType: 'LOCATED_AT',
        object: cell,
        spatialCellId: cell,
      };
    }

    // 2. Spatial adjacency: "X is adjacent to Y"
    const adjMatch = text.match(/^([a-zA-Z0-9_-]+)\s+(?:is\s+)?adjacent\s+to\s+([a-zA-Z0-9_-]+)$/i);
    if (adjMatch) {
      return {
        subject: adjMatch[1].toLowerCase(),
        predicate: 'adjacent_to',
        relationType: 'ADJACENT_TO',
        object: adjMatch[2].toLowerCase(),
      };
    }

    // 3. Conditional: "If X then Y"
    const condMatch = text.match(/^if\s+(.+?)\s+then\s+(.+)$/i);
    if (condMatch) {
      return {
        subject: condMatch[1].toLowerCase(),
        predicate: 'implies',
        relationType: 'CAUSES',
        object: condMatch[2].toLowerCase(),
      };
    }

    // 4. Categorical: "All X are Y" or "Every X is Y"
    const catAllMatch = text.match(/^(?:all|every|each)\s+([a-zA-Z0-9_-]+)\s+(?:are|is)\s+(.+)$/i);
    if (catAllMatch) {
      return {
        subject: catAllMatch[1].toLowerCase(),
        predicate: 'is_a',
        relationType: 'IS_A',
        object: catAllMatch[2].toLowerCase(),
      };
    }

    // 5. Transitive Connected: "X is connected to Y" or "X connects to Y"
    const connMatch = text.match(
      /^([a-zA-Z0-9_-]+)\s+(?:is\s+connected\s+to|connects\s+to|connected\s+to)\s+([a-zA-Z0-9_-]+)$/i
    );
    if (connMatch) {
      return {
        subject: connMatch[1].toLowerCase(),
        predicate: 'connected_to',
        relationType: 'CONNECTED_TO',
        object: connMatch[2].toLowerCase(),
      };
    }

    // 6. Transitive Transitions: "X transitions to Y"
    const transMatch = text.match(
      /^([a-zA-Z0-9_-]+)\s+(?:transitions\s+to|leads\s+to)\s+([a-zA-Z0-9_-]+)$/i
    );
    if (transMatch) {
      return {
        subject: transMatch[1].toLowerCase(),
        predicate: 'transitions_to',
        relationType: 'TRANSITIONS_TO',
        object: transMatch[2].toLowerCase(),
      };
    }

    // 7. Part-of: "X is part of Y"
    const partMatch = text.match(/^([a-zA-Z0-9_-]+)\s+(?:is\s+)?part\s+of\s+(.+)$/i);
    if (partMatch) {
      return {
        subject: partMatch[1].toLowerCase(),
        predicate: 'part_of',
        relationType: 'PART_OF',
        object: partMatch[2].toLowerCase(),
      };
    }

    // 8. Contains: "X contains Y"
    const containsMatch = text.match(/^([a-zA-Z0-9_-]+)\s+contains\s+(.+)$/i);
    if (containsMatch) {
      return {
        subject: containsMatch[1].toLowerCase(),
        predicate: 'contains',
        relationType: 'CONTAINS',
        object: containsMatch[2].toLowerCase(),
      };
    }

    // 9. Comparative: "X is greater than Y" or "X is smaller than Y"
    const compMatch = text.match(
      /^([a-zA-Z0-9_-]+)\s+(?:is\s+)?(greater|bigger|larger|smaller|less)\s+than\s+([a-zA-Z0-9_-]+)$/i
    );
    if (compMatch) {
      const isGreater = /greater|bigger|larger/i.test(compMatch[2]);
      return {
        subject: compMatch[1].toLowerCase(),
        predicate: isGreater ? 'greater_than' : 'less_than',
        relationType: isGreater ? 'GREATER_THAN' : 'LESS_THAN',
        object: compMatch[3].toLowerCase(),
      };
    }

    // 10. General "X is Y" or "X is not Y"
    const isMatch = text.match(/^([a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)*)\s+(?:is|are)(?:\s+not)?\s+(?:a\s+|an\s+)?(.+)$/i);
    if (isMatch) {
      return {
        subject: isMatch[1].trim().toLowerCase(),
        predicate: 'is_a',
        relationType: 'IS_A',
        object: isMatch[2].trim().toLowerCase(),
      };
    }

    // 11. General "X has Y" or "X has no Y"
    const hasMatch = text.match(/^([a-zA-Z0-9_-]+)\s+has(?:\s+no)?\s+(?:a\s+|an\s+)?(.+)$/i);
    if (hasMatch) {
      return {
        subject: hasMatch[1].toLowerCase(),
        predicate: 'has',
        relationType: 'HAS',
        object: hasMatch[2].toLowerCase(),
      };
    }

    // Fallback: whitespace split
    const tokens = text.split(/\s+/);
    if (tokens.length >= 3) {
      const subject = tokens[0].toLowerCase();
      const predicate = tokens[1].toLowerCase();
      const object = tokens.slice(2).join(' ').toLowerCase();
      return { subject, predicate, relationType: 'CUSTOM', object };
    }

    if (tokens.length === 2) {
      return { subject: tokens[0].toLowerCase(), predicate: 'is_a', relationType: 'IS_A', object: tokens[1].toLowerCase() };
    }

    return { subject: text.toLowerCase(), predicate: 'exists', relationType: 'CUSTOM', object: 'true' };
  }
}
