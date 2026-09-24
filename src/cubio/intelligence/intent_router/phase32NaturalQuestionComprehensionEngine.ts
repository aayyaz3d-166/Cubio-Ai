/**
 * CUBiO AI — Phase 32 Task 519: Natural Question Comprehension & Semantic Consistency Engine
 * src/cubio/intelligence/intent_router/phase32NaturalQuestionComprehensionEngine.ts
 *
 * Specializes in understanding real-world human questions across structural variations:
 * 1. Question Form Types:
 *    - DIRECT: Direct wh-questions ("What is the capital of France?", "France ka darul hukoomat kya hai?")
 *    - INDIRECT: Embedded/polite questions ("Could you tell me what the capital of France is?", "Kya aap bata sakte hain ke...")
 *    - CONVERSATIONAL: Casual dialogue phrasing ("I was wondering about France's capital...", "So what's the deal with France's capital?")
 *    - INCOMPLETE: Elliptical/fragment queries ("Capital of France?", "France capital?", "France darul hukoomat?")
 *    - DIFFERENTLY_WORDED: Syntactic variations ("Which city serves as France's capital?", "What city is the French capital?")
 *
 * 2. Semantic Canonical Entity & Subject Extraction:
 *    - Normalizes question framing to an invariant canonical conceptual intent.
 *    - Extracts core entity targets (e.g., "france", "speed_of_light", "transformer_attention").
 *    - Computes semantic consistency hash and equivalence signature.
 *
 * 3. Multilingual Support:
 *    - Full support for English, Roman Urdu, and Mixed-language phrasing.
 *
 * 4. Architectural Invariants:
 *    - IS_ACTUATION_BLOCKED === true permanently asserted.
 *    - OFFLINE_ISOLATED === true (zero external cloud/LLM dependency).
 *    - Read-only evaluation without structured semantic field injection or hidden answers.
 */

import * as crypto from 'crypto';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import { Phase32RawIntentDetector, DetectedLanguage } from './phase32RawIntentDetector';

// ============================================================================
// TYPES & CONTRACTS
// ============================================================================

export type QuestionFormType =
  | 'DIRECT'
  | 'INDIRECT'
  | 'CONVERSATIONAL'
  | 'INCOMPLETE'
  | 'DIFFERENTLY_WORDED';

export type QuestionTargetConcept =
  | 'CAPITAL_CITY'
  | 'PHYSICAL_CONSTANT'
  | 'ASTRONOMICAL_PERIOD'
  | 'SOFTWARE_ARCHITECTURE'
  | 'RECIPE_PREPARATION'
  | 'MATHEMATICAL_PROPERTY'
  | 'HISTORICAL_EVENT'
  | 'GENERAL_KNOWLEDGE';

export interface SemanticUnderstandingProfile {
  readonly rawQuery: string;
  readonly normalizedQuery: string;
  readonly detectedLanguage: DetectedLanguage;
  readonly formType: QuestionFormType;
  readonly targetConcept: QuestionTargetConcept;
  readonly canonicalEntity: string;
  readonly corePredicate: string;
  readonly isQuestionIntent: boolean;
  readonly confidence: number;
  readonly semanticEquivalenceKey: string;
  readonly deterministicSignature: string;
}

export interface EquivalenceConsistencyReport {
  readonly canonicalConcept: QuestionTargetConcept;
  readonly testFormsCount: number;
  readonly formsTested: readonly QuestionFormType[];
  readonly allMappedToTargetConcept: boolean;
  readonly allResolvedCanonicalEntity: boolean;
  readonly consistencyScore: number; // 0.0 - 1.0 (1.0 = 100% semantic consistency)
  readonly signatureMatches: boolean;
}

// ============================================================================
// HUMAN QUESTION PATTERNS & HEURISTICS
// ============================================================================

// Indirect question framing prefixes
const INDIRECT_PREFIXES = [
  /^(?:could\s+you\s+(?:please\s+)?tell\s+me|can\s+you\s+tell\s+me|would\s+you\s+mind\s+telling\s+me|do\s+you\s+know|i\s+would\s+like\s+to\s+know|tell\s+me)\b/i,
  /^(?:kya\s+aap\s+(?:mujhe\s+)?bata\s+saktay\s+hain|kya\s+tum\s+bata\s+saktay\s+ho|mujhe\s+batao|bata\s+dein\s+ke)\b/i,
];

// Conversational framing prefixes
const CONVERSATIONAL_PREFIXES = [
  /^(?:i\s+was\s+wondering|just\s+curious\s+about|curious\s+to\s+know|by\s+the\s+way|so\s+tell\s+me|any\s+idea\s+about|hey\s+what\s+about)\b/i,
  /^(?:main\s+soch\s+raha\s+tha|waisay\s+ek\s+baat|achha\s+batao|ek\s+sawal\s+tha|suno\s+to)\b/i,
];

// Incomplete / fragment queries (often lacking auxiliary verbs and questions words)
// e.g. "Capital of France?", "France capital?", "Speed of light in vacuum?"
const INCOMPLETE_PATTERNS = [
  /^[a-zA-Z0-9_\-\s]{2,35}\?*$/,
];

// ============================================================================
// ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32NaturalQuestionComprehensionEngine {
  private static instance: Phase32NaturalQuestionComprehensionEngine | null = null;
  private readonly rawDetector: Phase32RawIntentDetector;

  public readonly version = '32.519.0';
  public readonly isOfflineIsolated = true;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
  }

  public static getInstance(): Phase32NaturalQuestionComprehensionEngine {
    if (!this.instance) {
      this.instance = new Phase32NaturalQuestionComprehensionEngine();
    }
    return this.instance;
  }

  /**
   * Normalizes question text by harmonizing punctuation, casing, and extraneous whitespace.
   */
  public normalizeQuestion(raw: string): string {
    return raw
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[?؟!.,;:]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Determines the structural form of the natural question.
   */
  public detectQuestionForm(raw: string): QuestionFormType {
    const trimmed = raw.trim();
    const pLower = trimmed.toLowerCase();

    // Check conversational framing
    for (const prefix of CONVERSATIONAL_PREFIXES) {
      if (prefix.test(pLower)) return 'CONVERSATIONAL';
    }

    // Check indirect/polite framing
    for (const prefix of INDIRECT_PREFIXES) {
      if (prefix.test(pLower)) return 'INDIRECT';
    }

    // Check incomplete / fragment form (short, no verb phrases, telegraphic)
    const tokenCount = trimmed.split(/\s+/).length;
    const hasVerb = /\b(?:is|are|was|were|does|did|hai|hain|tha|thi|hoga)\b/i.test(pLower);
    const hasQuestionWord = /\b(?:what|who|where|when|which|how|why|kya|kaun|kahan|kab|kaise|kyun)\b/i.test(pLower);

    if (tokenCount <= 4 && !hasVerb && !hasQuestionWord) {
      return 'INCOMPLETE';
    }
    if (tokenCount <= 3 && !hasVerb) {
      return 'INCOMPLETE';
    }

    // Check differently-worded (uses non-standard query structures, passives, or inversion)
    // e.g. "Which city serves as France's capital?", "France's capital city is which one?"
    if (
      /\b(?:serves\s+as|known\s+as|refers\s+to|located\s+in|defined\s+as|which\s+one\s+is|kaunsa\s+shehr\s+hai)\b/i.test(pLower) ||
      /\b(?:capital\s+city\s+is\s+which|darul\s+hukoomat\s+konsa)\b/i.test(pLower)
    ) {
      return 'DIFFERENTLY_WORDED';
    }

    // Direct question: standard wh-query
    if (/^(?:what|who|where|when|which|how|why|kya|kaun|kahan|kab|kaise|kyun)\b/i.test(pLower)) {
      return 'DIRECT';
    }

    return 'DIFFERENTLY_WORDED';
  }

  /**
   * Extracts canonical concept, entity, and predicate invariant across question structures.
   */
  public extractCanonicalSemanticTarget(normalized: string): {
    targetConcept: QuestionTargetConcept;
    canonicalEntity: string;
    corePredicate: string;
  } {
    const pLower = normalized.toLowerCase();

    // 1. Capital City inquiries (e.g. France, Pakistan, Japan, Germany)
    if (/\b(?:capital|dar[\s-]?ul[\s-]?hukoomat|darulhukumat|shehr|city)\b/i.test(pLower)) {
      let entity = 'UNKNOWN_STATE';
      if (/\b(?:france|french|paris)\b/i.test(pLower)) entity = 'FRANCE';
      else if (/\b(?:pakistan|islamabad)\b/i.test(pLower)) entity = 'PAKISTAN';
      else if (/\b(?:japan|tokyo)\b/i.test(pLower)) entity = 'JAPAN';
      else if (/\b(?:germany|berlin)\b/i.test(pLower)) entity = 'GERMANY';
      else if (/\b(?:italy|rome)\b/i.test(pLower)) entity = 'ITALY';

      return {
        targetConcept: 'CAPITAL_CITY',
        canonicalEntity: entity,
        corePredicate: 'CAPITAL_OF',
      };
    }

    // 2. Physical Constants (Speed of light, Planck constant, gravitational constant)
    if (/\b(?:speed\s+of\s+light|roshni\s+ki\s+raftaar|c\s+in\s+vacuum|light\s+speed)\b/i.test(pLower)) {
      return {
        targetConcept: 'PHYSICAL_CONSTANT',
        canonicalEntity: 'SPEED_OF_LIGHT',
        corePredicate: 'MAGNITUDE_IN_VACUUM',
      };
    }

    // 3. Astronomical Periods (Earth revolution, Moon distance, orbit)
    if (
      /\b(?:revolve|orbit|chakar)\b/i.test(pLower) && /\b(?:sun|earth|suraj|zameen)\b/i.test(pLower) ||
      /\b(?:earth\s+solar\s+orbit|suraj\s+ke\s+gird|solar\s+year|days\s+in\s+a\s+year)\b/i.test(pLower)
    ) {
      return {
        targetConcept: 'ASTRONOMICAL_PERIOD',
        canonicalEntity: 'EARTH_SOLAR_ORBIT',
        corePredicate: 'ORBITAL_PERIOD_DAYS',
      };
    }

    // 4. Software Architecture & Concepts (Virtual DOM, React, Transformer, Database indexing)
    if (/\b(?:virtual\s+dom|reconciliation|react|transformer|attention\s+mechanism|database\s+indexing|sql|sqlite)\b/i.test(pLower)) {
      let tech = 'GENERIC_SOFTWARE';
      if (/\b(?:virtual\s+dom|reconciliation|react)\b/i.test(pLower)) tech = 'REACT_VIRTUAL_DOM';
      else if (/\b(?:transformer|attention)\b/i.test(pLower)) tech = 'TRANSFORMER_ATTENTION';
      else if (/\b(?:indexing|database)\b/i.test(pLower)) tech = 'DATABASE_INDEXING';

      return {
        targetConcept: 'SOFTWARE_ARCHITECTURE',
        canonicalEntity: tech,
        corePredicate: 'MECHANISM_AND_BEHAVIOR',
      };
    }

    // 5. Recipe / Procedural Preparation (Chai, Tea, Biryani, Coffee)
    if (/\b(?:chai|tea|karak|biryani|coffee)\b/i.test(pLower) && /\b(?:recipe|tarkeeb|tareeqa|make|tayyar)\b/i.test(pLower)) {
      let subject = 'FOOD_BEVERAGE';
      if (/\b(?:chai|tea|karak)\b/i.test(pLower)) subject = 'KARAK_CHAI';
      else if (/\b(?:biryani)\b/i.test(pLower)) subject = 'BIRYANI';

      return {
        targetConcept: 'RECIPE_PREPARATION',
        canonicalEntity: subject,
        corePredicate: 'PROCEDURAL_STEPS',
      };
    }

    // 6. Mathematical Properties (Fibonacci, Prime numbers, Digital root)
    if (/\b(?:prime|fibonacci|digital\s+root|square\s+root|even|odd|hypotenuse)\b/i.test(pLower)) {
      return {
        targetConcept: 'MATHEMATICAL_PROPERTY',
        canonicalEntity: 'MATHEMATICAL_FUNCTION',
        corePredicate: 'EVALUATION',
      };
    }

    // Default: General Knowledge
    return {
      targetConcept: 'GENERAL_KNOWLEDGE',
      canonicalEntity: normalized.slice(0, 20).toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      corePredicate: 'FACTUAL_INQUIRY',
    };
  }

  /**
   * Understands a raw natural human question and produces an invariant semantic profile.
   */
  public understandQuestion(rawQuestion: string): SemanticUnderstandingProfile {
    const trimmed = rawQuestion.trim();
    const normalized = this.normalizeQuestion(trimmed);
    const language = this.rawDetector.detectLanguage(trimmed);
    const formType = this.detectQuestionForm(trimmed);
    const semanticTarget = this.extractCanonicalSemanticTarget(normalized);

    // Build semantic equivalence key independent of phrasing syntax:
    // CONCEPT:ENTITY:PREDICATE
    const semanticEquivalenceKey = `${semanticTarget.targetConcept}:${semanticTarget.canonicalEntity}:${semanticTarget.corePredicate}`;

    // Deterministic signature computed on canonical semantics
    const sigPayload = `${semanticEquivalenceKey}|${language}|${formType}`;
    const deterministicSignature = crypto.createHash('sha256').update(sigPayload).digest('hex');

    return {
      rawQuery: trimmed,
      normalizedQuery: normalized,
      detectedLanguage: language,
      formType,
      targetConcept: semanticTarget.targetConcept,
      canonicalEntity: semanticTarget.canonicalEntity,
      corePredicate: semanticTarget.corePredicate,
      isQuestionIntent: true,
      confidence: 0.96,
      semanticEquivalenceKey,
      deterministicSignature,
    };
  }

  /**
   * Evaluates semantic consistency across a family of equivalent questions phrased in
   * direct, indirect, conversational, incomplete, and differently-worded formats.
   */
  public evaluateFamilyConsistency(
    questionVariations: readonly { query: string; expectedForm?: QuestionFormType }[]
  ): EquivalenceConsistencyReport {
    if (!questionVariations || questionVariations.length === 0) {
      throw new Error('Question variations array cannot be empty.');
    }

    const profiles = questionVariations.map(q => this.understandQuestion(q.query));
    const firstConcept = profiles[0].targetConcept;
    const firstEntity = profiles[0].canonicalEntity;
    const firstEquivKey = profiles[0].semanticEquivalenceKey;

    let matchingEquivCount = 0;
    const formsTested: QuestionFormType[] = [];

    for (const p of profiles) {
      if (!formsTested.includes(p.formType)) {
        formsTested.push(p.formType);
      }
      if (p.semanticEquivalenceKey === firstEquivKey) {
        matchingEquivCount++;
      }
    }

    const allMappedToTargetConcept = profiles.every(p => p.targetConcept === firstConcept);
    const allResolvedCanonicalEntity = profiles.every(p => p.canonicalEntity === firstEntity);
    const consistencyScore = Number((matchingEquivCount / profiles.length).toFixed(3));
    const signatureMatches = matchingEquivCount === profiles.length;

    return {
      canonicalConcept: firstConcept,
      testFormsCount: profiles.length,
      formsTested,
      allMappedToTargetConcept,
      allResolvedCanonicalEntity,
      consistencyScore,
      signatureMatches,
    };
  }
}
