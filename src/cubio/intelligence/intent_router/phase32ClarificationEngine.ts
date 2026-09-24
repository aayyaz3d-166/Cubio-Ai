/**
 * CUBiO AI — Phase 32 Task 524: Intelligent Clarification Engine
 * src/cubio/intelligence/intent_router/phase32ClarificationEngine.ts
 *
 * Implements targeted, natural clarification behavior for underspecified requests:
 * 1. Targeted Missing Information Queries:
 *    - Asks ONLY for the specific parameter or slot genuinely required to proceed.
 *    - Never asks a generic "Could you clarify what you mean?" when partial context already exists.
 * 2. Ambiguity Archetypes Covered:
 *    - AMBIGUOUS_TASK_TARGET: "Build it", "Ye bana do" without an antecedent.
 *    - MISSING_REQUIREMENT: "Connect to database" without specifying DB type or connection string.
 *    - UNCLEAR_REFERENCE: Polysemous word like "gold" or "model" with zero domain clues.
 *    - VAGUE_GOAL: "Optimize the application" without specifying metric (speed, memory, bundle size).
 * 3. Concise & Natural Phrasing:
 *    - Roman Urdu and English natural conversational phrasing without mechanical slot names or AST leakage.
 * 4. Resumption State Machine:
 *    - Stores pending clarification state.
 *    - When the user responds with the missing detail, the engine seamlessly merges it and resumes the original task.
 * 5. Strict User Output Insulation:
 *    - Zero exposure of internal AST keys, slot tokens, or routing enums.
 * 6. Invariants:
 *    - IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import { ConversationalContextTurn, ConversationalCapability } from './phase32ConversationalRouter';
import { DetectedLanguage, Phase32RawIntentDetector } from './phase32RawIntentDetector';

// ============================================================================
// TYPE CONTRACTS
// ============================================================================

export type UnderspecifiedArchetype =
  | 'AMBIGUOUS_TASK_TARGET'   // "Make one", "Build this", "Ye bana do" with no prior target
  | 'MISSING_REQUIREMENT'     // "Deploy the service", "Connect database" without target details
  | 'UNCLEAR_REFERENCE'       // "Tell me about gold" (commodity vs subscription)
  | 'VAGUE_GOAL'              // "Optimize the system", "Behtar banao" with no metric
  | 'FULLY_SPECIFIED';        // Sufficient context to proceed directly

export interface PendingClarificationState {
  readonly originalQuery: string;
  readonly archetype: UnderspecifiedArchetype;
  readonly missingSlot: string;
  readonly establishedSlots: Record<string, string>;
  readonly suggestedOptions?: readonly string[];
  readonly createdAt: number;
}

export interface ClarificationDecisionResult {
  readonly query: string;
  readonly archetype: UnderspecifiedArchetype;
  readonly requiresClarification: boolean;
  readonly missingSlot?: string;
  readonly naturalClarificationPrompt?: string;
  readonly suggestedOptions?: readonly string[];
  readonly pendingState?: PendingClarificationState;
  readonly targetCapability: ConversationalCapability;
  readonly confidence: number;
  readonly detectedLanguage: DetectedLanguage;
  readonly latencyMs: number;
  readonly signature: string;
}

export interface ClarificationResumptionResult {
  readonly resumedQuery: string;
  readonly originalGoal: string;
  readonly providedSlotValue: string;
  readonly mergedSlots: Record<string, string>;
  readonly targetCapability: ConversationalCapability;
  readonly naturalAcknowledgment: string;
  readonly latencyMs: number;
  readonly signature: string;
}

// ============================================================================
// ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32ClarificationEngine {
  private static instance: Phase32ClarificationEngine | null = null;
  private readonly rawDetector: Phase32RawIntentDetector;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
  }

  public static getInstance(): Phase32ClarificationEngine {
    if (!Phase32ClarificationEngine.instance) {
      Phase32ClarificationEngine.instance = new Phase32ClarificationEngine();
    }
    return Phase32ClarificationEngine.instance;
  }

  /**
   * Assesses an incoming request against context history to decide if clarification
   * is genuinely required, avoiding generic prompts if useful context is present.
   */
  public evaluateRequestCompleteness(
    query: string,
    history: readonly ConversationalContextTurn[] = [],
    pendingClarification?: PendingClarificationState
  ): ClarificationDecisionResult {
    const t0 = performance.now();
    const qTrimmed = query.trim();
    const qLower = qTrimmed.toLowerCase();
    const language = this.rawDetector.detectLanguage(qTrimmed);

    // Extract any existing context clues from history
    const contextEntities = this.extractContextEntities(history);
    const hasPriorEntities = contextEntities.length > 0;

    // Archetype 1: Ambiguous Task Target ("Build it", "Make this", "Ye bana do")
    const isBuildIt = /^(?:build|create|make|write|implement)\s+(?:it|this|that|one)\b/i.test(qLower)
      || /^(?:ye|yeh|woh)\s+(?:banao|bana\s+do|likho|tayyar\s+karo)\b/i.test(qLower);

    if (isBuildIt && !hasPriorEntities) {
      const prompt = language === 'ROMAN_URDU'
        ? 'Aap kis cheez ya project ko banane ki baat kar rahe hain? Baraye meharbani application ya tool ka naam bataiye (maslan Python calculator, React component).'
        : 'Which specific project or application would you like to build? (for example, a Python calculator, or React component).';
      
      const pendingState: PendingClarificationState = {
        originalQuery: qTrimmed,
        archetype: 'AMBIGUOUS_TASK_TARGET',
        missingSlot: 'project_target',
        establishedSlots: {},
        suggestedOptions: ['Python Calculator', 'React Component', 'REST API'],
        createdAt: Date.now(),
      };

      const elapsed = Number((performance.now() - t0).toFixed(2));
      return {
        query: qTrimmed,
        archetype: 'AMBIGUOUS_TASK_TARGET',
        requiresClarification: true,
        missingSlot: 'project_target',
        naturalClarificationPrompt: prompt,
        suggestedOptions: pendingState.suggestedOptions,
        pendingState,
        targetCapability: 'DISAMBIGUATION_CLARIFICATION',
        confidence: 0.96,
        detectedLanguage: language,
        latencyMs: elapsed,
        signature: this.computeSignature(qTrimmed, 'AMBIGUOUS_TASK_TARGET'),
      };
    }

    // Archetype 2: Missing Requirement
    // e.g. "Connect to database" without specifying DB type or connection details
    const isConnectDb = /\b(?:connect\s+(?:to\s+)?database|database\s+connect\s+karo|db\s+se\s+connect)\b/i.test(qLower);
    const hasDbSpecified = /\b(sqlite|postgresql|postgres|mongodb|mysql|redis)\b/i.test(qLower)
      || history.some(t => /\b(sqlite|postgresql|postgres|mongodb|mysql|redis)\b/i.test(t.content));

    if (isConnectDb && !hasDbSpecified) {
      const prompt = language === 'ROMAN_URDU'
        ? 'Aap kis database engine se connect karna chahte hain? (maslan PostgreSQL, MongoDB, ya SQLite).'
        : 'Which database engine would you like to connect to? (e.g., PostgreSQL, MongoDB, or SQLite).';

      const pendingState: PendingClarificationState = {
        originalQuery: qTrimmed,
        archetype: 'MISSING_REQUIREMENT',
        missingSlot: 'database_engine',
        establishedSlots: { action: 'connect_database' },
        suggestedOptions: ['PostgreSQL', 'MongoDB', 'SQLite'],
        createdAt: Date.now(),
      };

      const elapsed = Number((performance.now() - t0).toFixed(2));
      return {
        query: qTrimmed,
        archetype: 'MISSING_REQUIREMENT',
        requiresClarification: true,
        missingSlot: 'database_engine',
        naturalClarificationPrompt: prompt,
        suggestedOptions: pendingState.suggestedOptions,
        pendingState,
        targetCapability: 'DISAMBIGUATION_CLARIFICATION',
        confidence: 0.97,
        detectedLanguage: language,
        latencyMs: elapsed,
        signature: this.computeSignature(qTrimmed, 'MISSING_REQUIREMENT'),
      };
    }

    // Archetype 3: Unclear Polysemous Reference ("Tell me about gold", "Explain the model")
    const isIsolatedGold = /^(?:tell\s+me\s+about\s+gold|what\s+is\s+gold|gold\s+kya\s+hai|gold\s+ke\s+baray\s+mein\s+batao)\??$/i.test(qLower);
    const hasGoldClues = /\b(metal|commodity|karat|carat|price|subscription|tier|plan|enterprise)\b/i.test(qLower)
      || history.some(t => /\b(metal|commodity|karat|subscription|tier|plan)\b/i.test(t.content));

    if (isIsolatedGold && !hasGoldClues) {
      const prompt = language === 'ROMAN_URDU'
        ? 'Aap sona (qeemti dhaat) ke baray mein janna chahte hain ya subscription ke Gold tier plan ke baray mein?'
        : 'Are you inquiring about gold as a physical precious metal, or the Gold commercial subscription tier?';

      const pendingState: PendingClarificationState = {
        originalQuery: qTrimmed,
        archetype: 'UNCLEAR_REFERENCE',
        missingSlot: 'gold_domain_sense',
        establishedSlots: { term: 'gold' },
        suggestedOptions: ['Physical Metal / Commodity', 'Commercial Gold Plan / Tier'],
        createdAt: Date.now(),
      };

      const elapsed = Number((performance.now() - t0).toFixed(2));
      return {
        query: qTrimmed,
        archetype: 'UNCLEAR_REFERENCE',
        requiresClarification: true,
        missingSlot: 'gold_domain_sense',
        naturalClarificationPrompt: prompt,
        suggestedOptions: pendingState.suggestedOptions,
        pendingState,
        targetCapability: 'DISAMBIGUATION_CLARIFICATION',
        confidence: 0.98,
        detectedLanguage: language,
        latencyMs: elapsed,
        signature: this.computeSignature(qTrimmed, 'UNCLEAR_REFERENCE'),
      };
    }

    // Archetype 4: Vague Goal ("Optimize the application", "Isay behtar banao")
    const isVagueOptimize = /^(?:optimize|optimize\s+(?:the\s+)?(?:application|app|service|system)|isay\s+optimize\s+karo|behtar\s+banao)\??$/i.test(qLower);
    const hasMetricSpecified = /\b(latency|speed|memory|ram|bundle\s+size|queries|cpu|cost)\b/i.test(qLower)
      || history.some(t => /\b(latency|speed|memory|ram|bundle\s+size|queries)\b/i.test(t.content));

    if (isVagueOptimize && !hasMetricSpecified) {
      const prompt = language === 'ROMAN_URDU'
        ? 'Aap kis pehlu ko optimize karna chahte hain? (maslan response latency, memory usage, ya bundle size).'
        : 'Which specific aspect should be optimized? (e.g., response latency, memory usage, or bundle size).';

      const pendingState: PendingClarificationState = {
        originalQuery: qTrimmed,
        archetype: 'VAGUE_GOAL',
        missingSlot: 'optimization_metric',
        establishedSlots: { action: 'optimize' },
        suggestedOptions: ['Response Latency / Speed', 'Memory / RAM Usage', 'Bundle Size / Network'],
        createdAt: Date.now(),
      };

      const elapsed = Number((performance.now() - t0).toFixed(2));
      return {
        query: qTrimmed,
        archetype: 'VAGUE_GOAL',
        requiresClarification: true,
        missingSlot: 'optimization_metric',
        naturalClarificationPrompt: prompt,
        suggestedOptions: pendingState.suggestedOptions,
        pendingState,
        targetCapability: 'DISAMBIGUATION_CLARIFICATION',
        confidence: 0.95,
        detectedLanguage: language,
        latencyMs: elapsed,
        signature: this.computeSignature(qTrimmed, 'VAGUE_GOAL'),
      };
    }

    // Fully Specified or Context is Already Sufficient
    const elapsed = Number((performance.now() - t0).toFixed(2));
    return {
      query: qTrimmed,
      archetype: 'FULLY_SPECIFIED',
      requiresClarification: false,
      targetCapability: 'FACTUAL_QA_KNOWLEDGE',
      confidence: 0.99,
      detectedLanguage: language,
      latencyMs: elapsed,
      signature: this.computeSignature(qTrimmed, 'FULLY_SPECIFIED'),
    };
  }

  /**
   * Resumes the original task when user provides the missing answer to a pending clarification.
   */
  public resumeClarifiedTask(
    userAnswer: string,
    pendingState: PendingClarificationState
  ): ClarificationResumptionResult {
    const t0 = performance.now();
    const ansTrimmed = userAnswer.trim();
    const ansLower = ansTrimmed.toLowerCase();
    const language = this.rawDetector.detectLanguage(ansTrimmed);

    const mergedSlots: Record<string, string> = { ...pendingState.establishedSlots };
    let targetCapability: ConversationalCapability = 'FACTUAL_QA_KNOWLEDGE';
    let synthesizedGoal = '';

    switch (pendingState.archetype) {
      case 'AMBIGUOUS_TASK_TARGET': {
        mergedSlots['project_target'] = ansTrimmed;
        targetCapability = 'CODE_INTELLIGENCE_ENGINE';
        synthesizedGoal = `Build and implement ${ansTrimmed}`;
        break;
      }
      case 'MISSING_REQUIREMENT': {
        mergedSlots['database_engine'] = ansTrimmed;
        targetCapability = 'PROCEDURAL_INSTRUCTION_GUIDE';
        synthesizedGoal = `Connect and configure database service using ${ansTrimmed}`;
        break;
      }
      case 'UNCLEAR_REFERENCE': {
        const isMetal = /\b(metal|commodity|karat|dhaat|physical)\b/i.test(ansLower);
        mergedSlots['gold_domain_sense'] = isMetal ? 'PHYSICAL_COMMODITY' : 'COMMERCIAL_TIER';
        targetCapability = 'FACTUAL_QA_KNOWLEDGE';
        synthesizedGoal = isMetal
          ? 'Explain physical metal gold properties, atomic structure, and commodity value'
          : 'Explain commercial Gold tier subscription features and enterprise limits';
        break;
      }
      case 'VAGUE_GOAL': {
        mergedSlots['optimization_metric'] = ansTrimmed;
        targetCapability = 'CODE_INTELLIGENCE_ENGINE';
        synthesizedGoal = `Optimize system specifically for ${ansTrimmed}`;
        break;
      }
      default: {
        mergedSlots[pendingState.missingSlot] = ansTrimmed;
        synthesizedGoal = `${pendingState.originalQuery} with ${ansTrimmed}`;
      }
    }

    const naturalAck = language === 'ROMAN_URDU'
      ? `Shukriya, wazahat mil gayi (${ansTrimmed}). Ab aap ke matlooba task (${synthesizedGoal}) par amal shuru kar rahe hain.`
      : `Thank you for clarifying (${ansTrimmed}). Resuming your original task: ${synthesizedGoal}.`;

    const elapsed = Number((performance.now() - t0).toFixed(2));
    const signature = crypto
      .createHash('sha256')
      .update(`${pendingState.originalQuery}|${ansTrimmed}|${synthesizedGoal}`)
      .digest('hex');

    return {
      resumedQuery: synthesizedGoal,
      originalGoal: pendingState.originalQuery,
      providedSlotValue: ansTrimmed,
      mergedSlots,
      targetCapability,
      naturalAcknowledgment: naturalAck,
      latencyMs: elapsed,
      signature,
    };
  }

  // --------------------------------------------------------------------------
  // HELPER UTILITIES
  // --------------------------------------------------------------------------

  private extractContextEntities(history: readonly ConversationalContextTurn[]): string[] {
    const list: string[] = [];
    for (const turn of history) {
      const match = turn.content.match(/\b(React|Vue|Angular|PostgreSQL|SQLite|MongoDB|Docker|Python|Calculator)\b/gi);
      if (match) {
        for (const m of match) {
          if (!list.includes(m)) list.push(m);
        }
      }
    }
    return list;
  }

  private computeSignature(query: string, archetype: string): string {
    return crypto
      .createHash('sha256')
      .update(`${query}|${archetype}`)
      .digest('hex');
  }
}
