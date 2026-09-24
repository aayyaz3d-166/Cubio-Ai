/**
 * CUBiO AI — Phase 32 Task 518: Conversational Intent Classification & Routing Layer
 * src/cubio/intelligence/intent_router/phase32ConversationalRouter.ts
 *
 * Provides authoritative semantic intent classification and deterministic routing:
 * - Direct mapping from raw user request to appropriate conversational capability.
 * - Semantic-context weighted scoring to prevent keyword-only matching from overriding semantic intent.
 * - Resolution of overlapping, compound, and ambiguous intents with epistemic clarification.
 * - Multi-turn conversational context preservation and reference continuity.
 * - Strict preservation of Core boundaries (IS_ACTUATION_BLOCKED === true, OFFLINE_ISOLATED === true).
 * - Comprehensive user insulation: Zero exposure of internal routing labels or enum names.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import {
  Phase32RawIntentDetector,
  RawIntentCategory,
  DetectedLanguage,
  SafetyDisposition,
} from './phase32RawIntentDetector';
import { Phase28EntitySemanticAmbiguityDisambiguator } from '../../integration/phase28EntitySemanticAmbiguityDisambiguator';
import { Phase28CompoundMultiStepRequestEngine } from '../../integration/phase28CompoundMultiStepRequestEngine';

// ============================================================================
// ROUTING TAXONOMY & CAPABILITY CONTRACTS
// ============================================================================

export type ConversationalCapability =
  | 'FACTUAL_QA_KNOWLEDGE'           // Factual inquiries, definitions, general information
  | 'PROCEDURAL_INSTRUCTION_GUIDE'    // Actionable instructions, steps, configurations, recipes
  | 'DOCUMENT_SYNTHESIS_REQUEST'      // Drafts, professional letters, creative requests, favors
  | 'CONCEPTUAL_EXPLANATION'          // Deep-dive "why/how", architectural mechanisms, simple-terms breakdown
  | 'CODE_INTELLIGENCE_ENGINE'        // Programming snippets, debugging, algorithms, syntax fixes
  | 'STRATEGIC_PLANNING_ROADMAP'      // Phased roadmaps, project timelines, budget plans
  | 'INTERACTIVE_DIALOGUE_CHAT'       // Greetings, courtesies, identity, pleasantries
  | 'DISAMBIGUATION_CLARIFICATION'    // Ambiguous polysemous or unresolvable inquiries
  | 'COMPOUND_MULTISTEP_EXECUTION'    // Complex compound requests requiring sequential/parallel sub-tasks
  | 'SECURITY_POLICY_LOCKOUT'         // Safety refusals, system prompt protection, password queries
  | 'ACTUATION_SAFETY_BLOCK';         // Hardware / motor / physical actuation lockout

export interface ConversationalContextTurn {
  readonly role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  readonly content: string;
  readonly timestamp?: string;
}

export interface IntentWeightBreakdown {
  readonly category: RawIntentCategory;
  readonly keywordScore: number;
  readonly semanticContextScore: number;
  readonly finalWeightedScore: number;
}

export interface ConversationalRoutingDecision {
  readonly query: string;
  readonly primaryIntent: RawIntentCategory;
  readonly targetCapability: ConversationalCapability;
  readonly confidence: number;
  readonly detectedLanguage: DetectedLanguage;
  readonly isOverlapping: boolean;
  readonly secondaryIntent?: RawIntentCategory;
  readonly isAmbiguous: boolean;
  readonly clarificationPrompt?: string;
  readonly isCompound: boolean;
  readonly safetyDisposition: SafetyDisposition;
  readonly weightBreakdown: readonly IntentWeightBreakdown[];
  readonly contextTurnCount: number;
  readonly sanitizedUserResponse?: string;
  readonly latencyMs: number;
  readonly routingSignature: string;
}

// ============================================================================
// SEMANTIC CONTEXT KEYWORD & CONCEPT MATRICES
// ============================================================================

// Conversational capability mapping
const CATEGORY_TO_CAPABILITY: Record<RawIntentCategory, ConversationalCapability> = {
  QUESTION: 'FACTUAL_QA_KNOWLEDGE',
  INSTRUCTION: 'PROCEDURAL_INSTRUCTION_GUIDE',
  REQUEST: 'DOCUMENT_SYNTHESIS_REQUEST',
  EXPLANATION: 'CONCEPTUAL_EXPLANATION',
  CODING: 'CODE_INTELLIGENCE_ENGINE',
  PLANNING: 'STRATEGIC_PLANNING_ROADMAP',
  CONVERSATION: 'INTERACTIVE_DIALOGUE_CHAT',
};

// Patterns where keywords could deceptively trigger the wrong category:
// e.g. "write" in "write a Python script" -> CODING, not REQUEST/WRITING
// e.g. "explain" in "explain why this code produces IndexError" -> CODING, not general EXPLANATION
// e.g. "plan" in "what is the execution plan of this SQL query" -> CODING, not PLANNING
// e.g. "calculate" in "calculate the velocity of an object" -> QUESTION, not pure math tool
// e.g. "what is" in "what is the best roadmap for Q3" -> PLANNING, not general QUESTION

// ============================================================================
// PHASE 32 CONVERSATIONAL ROUTER IMPLEMENTATION
// ============================================================================

export class Phase32ConversationalRouter {
  private static instance: Phase32ConversationalRouter | null = null;
  private readonly rawDetector: Phase32RawIntentDetector;
  private readonly disambiguator: Phase28EntitySemanticAmbiguityDisambiguator;
  private readonly compoundEngine: Phase28CompoundMultiStepRequestEngine;

  public readonly version = '32.518.0';
  public readonly isOfflineIsolated = true;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
    this.disambiguator = Phase28EntitySemanticAmbiguityDisambiguator.getInstance();
    this.compoundEngine = Phase28CompoundMultiStepRequestEngine.getInstance();
  }

  public static getInstance(): Phase32ConversationalRouter {
    if (!this.instance) {
      this.instance = new Phase32ConversationalRouter();
    }
    return this.instance;
  }

  /**
   * Evaluates semantic context scores across multi-turn context and prompt syntax.
   */
  private computeSemanticContextWeights(
    query: string,
    contextTurns: readonly ConversationalContextTurn[] = []
  ): Record<RawIntentCategory, { keyword: number; context: number }> {
    const pLower = query.toLowerCase();
    const historyText = contextTurns.map(t => t.content.toLowerCase()).join(' ');

    const scores: Record<RawIntentCategory, { keyword: number; context: number }> = {
      QUESTION: { keyword: 0, context: 0 },
      INSTRUCTION: { keyword: 0, context: 0 },
      REQUEST: { keyword: 0, context: 0 },
      EXPLANATION: { keyword: 0, context: 0 },
      CODING: { keyword: 0, context: 0 },
      PLANNING: { keyword: 0, context: 0 },
      CONVERSATION: { keyword: 0, context: 0 },
    };

    // 1. Coding semantic features
    const hasCodeSyntax = /```[\s\S]*?```|`[^`]+`|\b(?:def |function |const |let |class |import |interface |return |async )\b/.test(query);
    const hasCodeKeywords = /\b(?:python|typescript|javascript|c\+\+|rust|sql|bug|syntax|compiler|runtime|indexerror|typeerror|refactor|binary\s+search|algorithm|array|loop)\b/i.test(pLower);
    const hasCodeInHistory = /\b(?:python|typescript|code|function|debug|script|interface|class)\b/i.test(historyText);

    if (hasCodeSyntax) scores.CODING.keyword += 0.6;
    if (hasCodeKeywords) scores.CODING.keyword += 0.4;
    if (hasCodeInHistory) scores.CODING.context += 0.3;

    // 2. Planning semantic features
    const hasPlanningKeywords = /\b(?:roadmap|phased|timeline|milestone|schedule|budget|sprint|quarterly|rollout|mansooba)\b/i.test(pLower);
    const hasPlanningStructure = /\b(?:phase\s+[1-4]|q[1-4]|3-month|6-month|step-by-step\s+plan)\b/i.test(pLower);
    const hasPlanningInHistory = /\b(?:roadmap|timeline|schedule|project\s+plan)\b/i.test(historyText);

    if (hasPlanningKeywords) scores.PLANNING.keyword += 0.5;
    if (hasPlanningStructure) scores.PLANNING.keyword += 0.4;
    if (hasPlanningInHistory) scores.PLANNING.context += 0.25;

    // 3. Explanation semantic features
    const hasExplainKeywords = /\b(?:explain|wazahat|samjhao|how\s+does\s+.*?\s+work|why\s+does|kaise\s+kaam|under\s+the\s+hood|difference\s+between|muwazna|farq|in\s+simple\s+terms)\b/i.test(pLower);
    if (hasExplainKeywords) scores.EXPLANATION.keyword += 0.6;

    // 4. Request semantic features (Polite asks, drafting, appeals)
    const hasRequestPoliteness = /\b(?:can\s+you\s+please|could\s+you\s+please|would\s+you\s+mind|please\s+help|baraye\s+meharbani|plz|madad\s+karein)\b/i.test(pLower);
    const hasDraftTarget = /\b(?:draft\s+(?:an?\s+)?(?:email|letter|application|resignation|memo)|email\s+likh\s+(?:do|dein))\b/i.test(pLower);
    if (hasRequestPoliteness) scores.REQUEST.keyword += 0.4;
    if (hasDraftTarget) scores.REQUEST.keyword += 0.5;

    // 5. Instruction semantic features (Direct commands, step-by-step configurations)
    const hasDirectCommand = /^(?:configure|setup|install|deploy|initialize|build|execute|run|convert)\b/i.test(query.trim());
    const hasRecipeOrGuide = /\b(?:step\s+by\s+step\s+guide|recipe|tarkeeb|tareeqa|bana(?:ne)?\s+ka\s+tareeqa)\b/i.test(pLower);
    if (hasDirectCommand) scores.INSTRUCTION.keyword += 0.5;
    if (hasRecipeOrGuide) scores.INSTRUCTION.keyword += 0.4;

    // 6. Question semantic features (Factual QA, inquiries)
    const hasQuestionFormat = /^(?:what\s+is|what\s+are|who\s+is|who\s+was|where\s+is|when\s+was|which\s+is|how\s+many)\b/i.test(pLower) || /\?$/.test(query.trim());
    const hasFactualTokens = /\b(?:capital\s+of|speed\s+of|currency\s+of|president\s+of|darul\s+hukoomat|kitne\s+din)\b/i.test(pLower);
    if (hasQuestionFormat) scores.QUESTION.keyword += 0.4;
    if (hasFactualTokens) scores.QUESTION.keyword += 0.4;

    // 7. Conversation semantic features (Greetings, pleasantries)
    const hasGreeting = /\b(?:hello|hi|hey|good\s+(?:morning|afternoon|evening)|salam|assalam|adab)\b/i.test(pLower);
    const hasCourtesies = /\b(?:thank\s+you|thanks|shukriya|meharbani|who\s+are\s+you|what\s+is\s+your\s+name|aap\s+kaun)\b/i.test(pLower);
    if (hasGreeting) scores.CONVERSATION.keyword += 0.6;
    if (hasCourtesies) scores.CONVERSATION.keyword += 0.4;

    return scores;
  }

  /**
   * Resolves semantic priority and prevents keyword collision.
   * e.g. "Write a Python script" -> contains keyword "write" (REQUEST/INSTRUCTION) but semantic subject is Python script (CODING).
   * e.g. "Explain why this code throws an error" -> contains "explain" but is specific code debugging (CODING).
   */
  private arbitrateSemanticIntent(
    query: string,
    contextTurns: readonly ConversationalContextTurn[] = []
  ): {
    primaryIntent: RawIntentCategory;
    secondaryIntent?: RawIntentCategory;
    isOverlapping: boolean;
    confidence: number;
    weightBreakdown: IntentWeightBreakdown[];
  } {
    const rawResult = this.rawDetector.detectIntent(query);
    const weights = this.computeSemanticContextWeights(query, contextTurns);

    const categories: RawIntentCategory[] = [
      'CODING',
      'PLANNING',
      'EXPLANATION',
      'REQUEST',
      'INSTRUCTION',
      'QUESTION',
      'CONVERSATION',
    ];

    const weightBreakdown: IntentWeightBreakdown[] = categories.map((cat) => {
      const kw = weights[cat].keyword;
      const ctx = weights[cat].context;
      // 60% prompt keyword signal, 40% contextual/semantic weight
      const finalWeightedScore = Number((kw * 0.6 + ctx * 0.4).toFixed(3));
      return {
        category: cat,
        keywordScore: kw,
        semanticContextScore: ctx,
        finalWeightedScore,
      };
    });

    // Sort by weighted score descending
    const sorted = [...weightBreakdown].sort((a, b) => b.finalWeightedScore - a.finalWeightedScore);

    // Disambiguate overlapping intents and multi-turn context continuity:
    // Case 1: Coding keyword overrides writing/request ("Write a Python function...")
    const pLower = query.toLowerCase();
    const isCodeWrite = /\b(?:write|likh|likho|banao)\b/i.test(pLower) && /\b(?:code|function|script|python|javascript|typescript|c\+\+|sql|regex)\b/i.test(pLower);
    const isCodeExplain = /\b(?:explain|samjhao)\b/i.test(pLower) && /\b(?:code|error|bug|syntax|traceback|exception|typeerror)\b/i.test(pLower);
    const isPlanInquiry = /\b(?:what\s+is|explain|batao)\b/i.test(pLower) && /\b(?:roadmap|phased\s+rollout|migration\s+plan|timeline|milestones)\b/i.test(pLower);

    // Case 2: Multi-turn context continuity (e.g. asking "How should I structure the connection pool... for it?" in a coding discussion)
    const hasPriorCodingContext = contextTurns.some(t => /\b(?:python|fastapi|sqlalchemy|sql|code|backend|database|service)\b/i.test(t.content));
    const isFollowUpCoding = hasPriorCodingContext && /\b(?:structure|handle|configure|pool|sessions|optimize|implement|fix|deploy)\b/i.test(pLower);

    let primaryIntent: RawIntentCategory = rawResult.category;
    let secondaryIntent: RawIntentCategory | undefined;
    let isOverlapping = false;
    let confidence = rawResult.confidence;

    if (isCodeWrite || isCodeExplain) {
      primaryIntent = 'CODING';
      isOverlapping = true;
      secondaryIntent = isCodeExplain ? 'EXPLANATION' : 'REQUEST';
      confidence = 0.98;
    } else if (isFollowUpCoding) {
      primaryIntent = 'CODING';
      isOverlapping = true;
      secondaryIntent = 'QUESTION';
      confidence = 0.95;
    } else if (isPlanInquiry) {
      primaryIntent = 'PLANNING';
      isOverlapping = true;
      secondaryIntent = 'QUESTION';
      confidence = 0.96;
    } else if (sorted[0].finalWeightedScore > 0.4 && sorted[1].finalWeightedScore > 0.3) {
      // Meaningful overlap detected
      isOverlapping = true;
      primaryIntent = sorted[0].category;
      secondaryIntent = sorted[1].category;
      confidence = Number((0.85 + sorted[0].finalWeightedScore * 0.1).toFixed(2));
    } else if (sorted[0].finalWeightedScore > 0.5 && sorted[0].category !== primaryIntent) {
      // Semantic contextual score decisively out-weighed the raw detector fallback
      primaryIntent = sorted[0].category;
      confidence = Number((0.85 + sorted[0].finalWeightedScore * 0.1).toFixed(2));
    }

    return {
      primaryIntent,
      secondaryIntent,
      isOverlapping,
      confidence,
      weightBreakdown,
    };
  }

  /**
   * Routes raw natural-language user query to appropriate conversational capability.
   */
  public routeRequest(
    rawUserInput: string,
    contextTurns: readonly ConversationalContextTurn[] = []
  ): ConversationalRoutingDecision {
    const t0 = performance.now();
    const trimmed = rawUserInput.trim();
    const language = this.rawDetector.detectLanguage(trimmed);
    const safety = this.rawDetector.evaluateSafety(trimmed);

    // 1. Safety Locks (Absolute Priority)
    if (safety === 'BLOCKED_ACTUATION') {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const sig = crypto.createHash('sha256').update(`${trimmed}|ACTUATION_SAFETY_BLOCK|${elapsed}`).digest('hex');
      const response = language === 'ROMAN_URDU'
        ? 'CUBiO sovereign safety guard: Physical motor ya hardware actuation policy ke tehat sakhti se blocked hai.'
        : 'CUBiO sovereign safety policy: Physical motor and hardware actuation is strictly prohibited under safety policy.';

      return {
        query: trimmed,
        primaryIntent: 'INSTRUCTION',
        targetCapability: 'ACTUATION_SAFETY_BLOCK',
        confidence: 1.0,
        detectedLanguage: language,
        isOverlapping: false,
        isAmbiguous: false,
        isCompound: false,
        safetyDisposition: 'BLOCKED_ACTUATION',
        weightBreakdown: [],
        contextTurnCount: contextTurns.length,
        sanitizedUserResponse: response,
        latencyMs: elapsed,
        routingSignature: sig,
      };
    }

    if (safety === 'SECURITY_REFUSAL') {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const sig = crypto.createHash('sha256').update(`${trimmed}|SECURITY_POLICY_LOCKOUT|${elapsed}`).digest('hex');
      const response = language === 'ROMAN_URDU'
        ? 'Aap ki darkhwast security policy ki khilaf-warzi ki bina par fail-closed lockout ke tehat reject kar di gayi hai.'
        : 'Your request violates sovereign security policies and has been rejected fail-closed under security policy lockout.';

      return {
        query: trimmed,
        primaryIntent: 'QUESTION',
        targetCapability: 'SECURITY_POLICY_LOCKOUT',
        confidence: 1.0,
        detectedLanguage: language,
        isOverlapping: false,
        isAmbiguous: false,
        isCompound: false,
        safetyDisposition: 'SECURITY_REFUSAL',
        weightBreakdown: [],
        contextTurnCount: contextTurns.length,
        sanitizedUserResponse: response,
        latencyMs: elapsed,
        routingSignature: sig,
      };
    }

    // 2. Compound Multi-Step Check
    const isCompound = this.compoundEngine.isCompoundRequest(trimmed);
    if (isCompound) {
      const arbitration = this.arbitrateSemanticIntent(trimmed, contextTurns);
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const sig = crypto.createHash('sha256').update(`${trimmed}|COMPOUND|${elapsed}`).digest('hex');

      return {
        query: trimmed,
        primaryIntent: arbitration.primaryIntent,
        targetCapability: 'COMPOUND_MULTISTEP_EXECUTION',
        confidence: 0.95,
        detectedLanguage: language,
        isOverlapping: true,
        secondaryIntent: arbitration.secondaryIntent || 'INSTRUCTION',
        isAmbiguous: false,
        isCompound: true,
        safetyDisposition: 'SAFE',
        weightBreakdown: arbitration.weightBreakdown,
        contextTurnCount: contextTurns.length,
        latencyMs: elapsed,
        routingSignature: sig,
      };
    }

    // 3. Polysemous Semantic Ambiguity Disambiguation
    // Checks for isolated polysemous terms or underspecified multi-polysemous combinations (gold, silver, model, memory, core, version)
    const historyStrings = contextTurns.map(t => t.content);
    let disambiguation = this.disambiguator.disambiguate(trimmed, historyStrings);

    // If query contains polysemous terms without definitive domain context (e.g. "Tell me about the gold and silver models")
    if (!disambiguation) {
      const pLower = trimmed.toLowerCase();
      const hasPolysemousTerm = /\b(gold|silver|model|memory|core|version)\b/i.test(pLower);
      const hasDefinitiveDomainContext = /\b(metal|au|ag|ounce|karat|ram|ddr|semver|cpu|intel|blender|gltf|cad|mesh|fashion|runway|plan|tier|subscription|pricing)\b/i.test(pLower);
      if (hasPolysemousTerm && !hasDefinitiveDomainContext) {
        // Attempt disambiguation on extracted isolated polysemous token
        const match = pLower.match(/\b(gold|silver|model|memory|core|version)\b/i);
        if (match) {
          disambiguation = this.disambiguator.disambiguate(match[1]);
        }
      }
    }

    if (disambiguation && disambiguation.requiresClarification) {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const sig = crypto.createHash('sha256').update(`${trimmed}|DISAMBIGUATION|${elapsed}`).digest('hex');

      return {
        query: trimmed,
        primaryIntent: 'QUESTION',
        targetCapability: 'DISAMBIGUATION_CLARIFICATION',
        confidence: disambiguation.confidence,
        detectedLanguage: language,
        isOverlapping: false,
        isAmbiguous: true,
        clarificationPrompt: disambiguation.clarificationPrompt,
        isCompound: false,
        safetyDisposition: 'SAFE',
        weightBreakdown: [],
        contextTurnCount: contextTurns.length,
        sanitizedUserResponse: disambiguation.explanatoryText,
        latencyMs: elapsed,
        routingSignature: sig,
      };
    }

    // 4. Semantic Intent Arbitration (Preventing keyword collision)
    const arbitration = this.arbitrateSemanticIntent(trimmed, contextTurns);
    const targetCapability = CATEGORY_TO_CAPABILITY[arbitration.primaryIntent];
    const elapsed = Number((performance.now() - t0).toFixed(2));
    const sig = crypto.createHash('sha256').update(`${trimmed}|${targetCapability}|${elapsed}`).digest('hex');

    return {
      query: trimmed,
      primaryIntent: arbitration.primaryIntent,
      targetCapability,
      confidence: arbitration.confidence,
      detectedLanguage: language,
      isOverlapping: arbitration.isOverlapping,
      secondaryIntent: arbitration.secondaryIntent,
      isAmbiguous: false,
      isCompound: false,
      safetyDisposition: 'SAFE',
      weightBreakdown: arbitration.weightBreakdown,
      contextTurnCount: contextTurns.length,
      latencyMs: elapsed,
      routingSignature: sig,
    };
  }
}
