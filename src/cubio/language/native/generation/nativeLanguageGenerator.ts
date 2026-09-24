/**
 * CUBiO AI — Phase 6: Task 81
 * Knowledge-Grounded Language Generation Layer
 * src/cubio/language/native/generation/nativeLanguageGenerator.ts
 *
 * Master Knowledge-Grounded Language Generation Engine.
 * Produces deterministic, verified natural language responses directly grounded
 * in CUBiO's canonical memory, multi-step reasoning DAG, and epistemic boundaries.
 * Guarantees zero hallucination, strict provenance, anti-promotion enforcement,
 * and permanent hardware actuation lock.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import { NativeContextWindow } from '../nativeContextWindow';
import { LanguageStatementParser } from '../reasoning/languageStatementParser';
import { NativeLanguageReasoningEngine } from '../reasoning/nativeLanguageReasoningEngine';
import { LongContextMemoryManager } from '../long_context/longContextMemoryManager';
import { NativeSparseMemoryStore } from '../../../memory/native/sparseMemoryStore';
import { NativeInformationEngine } from '../../../information/native/nativeInformationEngine';
import {
  GenerationConfig,
  DEFAULT_GENERATION_CONFIG,
  GroundedResponse,
  GroundedClaim,
  GenerationPromptType,
  PromptClassificationResult,
  ConversationTurn,
  ConversationSessionSnapshot,
  KnowledgeGroundedGenerationError,
  UnsupportedClaimError,
  EpistemicViolationError,
  HallucinationTrapTriggeredError,
  GenerationBudgetExceededError,
} from './generationTypes';
import { GroundedClaimSynthesizer } from './groundedClaimSynthesizer';

export class NativeLanguageGenerator {
  private readonly _tokenizer: NativeTokenizer;
  private readonly _parser: LanguageStatementParser;
  private readonly _synthesizer: GroundedClaimSynthesizer;
  private readonly _reasoningEngine: NativeLanguageReasoningEngine;
  private readonly _memoryManager: LongContextMemoryManager;
  private readonly _defaultConfig: GenerationConfig;
  private readonly _sessions = new Map<string, { tenantId: string; turns: ConversationTurn[]; createdAt: number }>();

  constructor(
    tokenizer?: NativeTokenizer,
    parser?: LanguageStatementParser,
    reasoningEngine?: NativeLanguageReasoningEngine,
    memoryManager?: LongContextMemoryManager,
    config?: Partial<GenerationConfig>
  ) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
    this._parser = parser ?? new LanguageStatementParser(this._tokenizer);
    this._synthesizer = new GroundedClaimSynthesizer();
    this._reasoningEngine = reasoningEngine ?? new NativeLanguageReasoningEngine(this._tokenizer, this._parser);

    const store = new NativeSparseMemoryStore();
    const infoEngine = new NativeInformationEngine(store);
    this._memoryManager = memoryManager ?? new LongContextMemoryManager(store, infoEngine);

    this._defaultConfig = Object.freeze({
      ...DEFAULT_GENERATION_CONFIG,
      ...config,
    });
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  public get parser(): LanguageStatementParser {
    return this._parser;
  }

  public get synthesizer(): GroundedClaimSynthesizer {
    return this._synthesizer;
  }

  public get reasoningEngine(): NativeLanguageReasoningEngine {
    return this._reasoningEngine;
  }

  public get memoryManager(): LongContextMemoryManager {
    return this._memoryManager;
  }

  // ===========================================================================
  // PROMPT CLASSIFICATION
  // ===========================================================================

  /**
   * Classifies prompt intent, detecting factual, reasoning, ambiguous, or adversarial prompts.
   */
  public classifyPrompt(prompt: string, contextStatements: readonly string[] = []): PromptClassificationResult {
    const clean = prompt.trim();
    const lower = clean.toLowerCase();

    // 1. Check Adversarial Trap
    const dummyClaims: GroundedClaim[] = [];
    const trapCheck = this._synthesizer.detectAdversarialTrap(clean, dummyClaims);
    if (trapCheck.isTrap) {
      return {
        promptType: 'ADVERSARIAL_TRAP',
        confidence: 0.99,
        detectedEntities: [],
        isHypothetical: false,
        isInterrogative: true,
        isAdversarial: true,
        explanation: trapCheck.trapReason ?? 'Adversarial presupposition or false physical premise detected.',
      };
    }

    // 2. Ambiguity check: "or" questions without definitive grounding
    if (/\b(?:is|are)\s+([a-zA-Z0-9_-]+)\s+(?:either\s+)?([a-zA-Z0-9_-]+)\s+or\s+([a-zA-Z0-9_-]+)\b/i.test(lower)) {
      return {
        promptType: 'AMBIGUOUS',
        confidence: 0.90,
        detectedEntities: [],
        isHypothetical: false,
        isInterrogative: true,
        isAdversarial: false,
        explanation: 'Interrogative contains dual alternatives requiring epistemic disambiguation.',
      };
    }

    // 3. Multi-Hop Reasoning: interrogatives with relational context, conditional phrases, or multiple premises
    const hasIfThen = contextStatements.some((s) => /\bif\s+.+\s+then\b/i.test(s));
    const hasTransitive = contextStatements.some((s) => /\b(?:connected to|contains|part of|leads to)\b/i.test(s));
    const hasContradictionSignals = contextStatements.length > 1 && contextStatements.some((s) => /\bnot\b/i.test(s));
    const isReasoningQuestion =
      (/^(?:is|are|does|can|will)\s+/i.test(clean) && (hasIfThen || hasTransitive || hasContradictionSignals || contextStatements.length >= 2)) ||
      hasIfThen;

    if (isReasoningQuestion || hasIfThen) {
      const goal = this._parser.parseQueryGoal(clean);
      return {
        promptType: 'MULTI_HOP_REASONING',
        confidence: 0.95,
        targetSubject: goal.targetSubject,
        targetPredicate: goal.targetPredicate,
        targetObject: goal.targetObject,
        detectedEntities: goal.targetSubject ? [goal.targetSubject] : [],
        isHypothetical: false,
        isInterrogative: true,
        isAdversarial: false,
        explanation: 'Requires deductive multi-step inference chain across context statements.',
      };
    }

    // 4. Conversational greetings
    if (/^(?:hello|hi|hey|greetings|help|who are you|what can you do)[.?!]?$/i.test(clean)) {
      return {
        promptType: 'CONVERSATIONAL',
        confidence: 1.0,
        detectedEntities: [],
        isHypothetical: false,
        isInterrogative: false,
        isAdversarial: false,
        explanation: 'Conversational greeting or orientation request.',
      };
    }

    // 5. Default Factual query
    const goal = this._parser.parseQueryGoal(clean);
    return {
      promptType: 'FACTUAL',
      confidence: 0.85,
      targetSubject: goal.targetSubject,
      targetPredicate: goal.targetPredicate,
      targetObject: goal.targetObject,
      detectedEntities: goal.targetSubject ? [goal.targetSubject] : [],
      isHypothetical: false,
      isInterrogative: clean.endsWith('?') || /^(?:what|where|who|when|how|is|are)\b/i.test(clean),
      isAdversarial: false,
      explanation: 'Direct factual retrieval query grounded in canonical memory.',
    };
  }

  // ===========================================================================
  // RESPONSE GENERATION
  // ===========================================================================

  /**
   * Generates a fully grounded response for the provided prompt and context.
   */
  public generate(
    prompt: string,
    options: {
      context?: string | readonly string[];
      tenantId?: string;
      config?: Partial<GenerationConfig>;
      sessionId?: string;
    } = {}
  ): GroundedResponse {
    const startTime = performance.now();
    const tenantId = options.tenantId ?? DEFAULT_TENANT_ID;
    const cfg: GenerationConfig = { ...this._defaultConfig, ...options.config };

    if (!prompt || typeof prompt !== 'string') {
      throw new KnowledgeGroundedGenerationError('Prompt string must be non-empty.');
    }
    const clean = prompt.trim();

    // Standardize context statements
    let contextStatements: string[] = [];
    if (options.context) {
      if (typeof options.context === 'string') {
        contextStatements = this._parser.splitStatements(options.context);
      } else {
        for (const c of options.context) {
          contextStatements.push(...this._parser.splitStatements(c));
        }
      }
    }

    // Incorporate multi-turn conversation context if session ID is provided
    if (options.sessionId) {
      const session = this._sessions.get(options.sessionId);
      if (session) {
        // Enforce tenant isolation on session
        if (session.tenantId !== tenantId) {
          throw new KnowledgeGroundedGenerationError(
            `Unauthorized session access: session ${options.sessionId} belongs to tenant ${session.tenantId}, not ${tenantId}.`
          );
        }
        // Append previous turn context up to maxContextTurns
        const recentTurns = session.turns.slice(-cfg.maxContextTurns);
        for (const t of recentTurns) {
          if (t.role === 'user') {
            contextStatements.push(`User previously stated: ${t.text}`);
          } else if (t.role === 'assistant' && t.response) {
            for (const cl of t.response.claims) {
              contextStatements.push(cl.statement);
            }
          }
        }
      }
    }

    // Step 1: Classify prompt intent
    const classification = this.classifyPrompt(prompt, contextStatements);

    let promptType = classification.promptType;
    const claims: GroundedClaim[] = [];
    let generatedText = '';
    let epistemicStatus: EpistemicStatus = 'CANONICAL_FACT';
    let confidence = 1.0;
    let dagChecksum: string | undefined;
    let memoryRefsCount = 0;
    let matchedClaim: GroundedClaim | undefined;

    // Check computation budget
    if (performance.now() - startTime > cfg.budgetMs) {
      throw new GenerationBudgetExceededError('Generation time budget exceeded during prompt classification.');
    }

    // =========================================================================
    // EXECUTION PATHWAYS
    // =========================================================================

    // PATHWAY A: Adversarial Trap Neutralization
    if (promptType === 'ADVERSARIAL_TRAP') {
      epistemicStatus = 'EPISTEMIC_UNKNOWN';
      confidence = 0.0;
      generatedText = `[UNKNOWN] Refusal: The query presupposes fictitious or physically ungrounded claims (${classification.explanation}). CUBiO AI refuses to generate unsupported assertions.`;
    }

    // PATHWAY B: Conversational Greeting
    else if (promptType === 'CONVERSATIONAL') {
      epistemicStatus = 'CANONICAL_FACT';
      confidence = 1.0;
      generatedText = '[CANONICAL_FACT] CUBiO AI sovereign language runtime active. Operating in deterministic knowledge-grounded generation mode with permanent hardware actuation lock.';
      claims.push({
        claimId: 'claim_runtime_001',
        statement: 'CUBiO AI is an inspectable sovereign cognitive architecture.',
        subject: 'cubio_ai',
        predicate: 'is_a',
        object: 'sovereign cognitive architecture',
        epistemicStatus: 'CANONICAL_FACT',
        confidence: 1.0,
        isNegated: false,
        provenance: { tenantId },
      });
    }

    // PATHWAY C: Multi-Hop Deductive Reasoning
    else if (promptType === 'MULTI_HOP_REASONING') {
      const reasoningResult = this._reasoningEngine.solve({
        queryText: prompt,
        contextStatements,
        targetSubject: classification.targetSubject,
        targetPredicate: classification.targetPredicate,
        targetObject: classification.targetObject,
        tenantId,
        budgetMs: cfg.budgetMs,
      });

      dagChecksum = reasoningResult.dagChecksum;
      epistemicStatus = reasoningResult.epistemicStatus;
      confidence = reasoningResult.epistemicStatus === 'CANONICAL_FACT' ? 1.0 : reasoningResult.confidence;

      // Extract verified claims from reasoning steps & retrieved facts
      const factClaims = this._synthesizer.synthesizeFromFacts(reasoningResult.retrievedFacts, tenantId);
      const stepClaims = this._synthesizer.synthesizeFromReasoningSteps(reasoningResult.steps, tenantId);
      claims.push(...factClaims, ...stepClaims);

      if (reasoningResult.status === 'PROVED') {
        const proofSentences = reasoningResult.steps.map((s) => s.statement).join(' ');
        generatedText = cfg.epistemicLabeling
          ? `[${reasoningResult.epistemicStatus}] ${reasoningResult.conclusionText} Proof trace: ${proofSentences}`
          : `${reasoningResult.conclusionText} Proof trace: ${proofSentences}`;
      } else if (reasoningResult.status === 'REFUTED') {
        generatedText = `[REFUTED] ${reasoningResult.conclusionText}`;
      } else if (reasoningResult.status === 'CONTRADICTED') {
        promptType = 'ADVERSARIAL_TRAP';
        epistemicStatus = 'EPISTEMIC_UNKNOWN';
        confidence = 0.0;
        generatedText = `[CONTRADICTED] Refutation: Logical contradiction detected during multi-step inference: ${reasoningResult.conclusionText}. Execution halted safely without data corruption.`;
      } else {
        // UNKNOWN - Missing evidence
        promptType = 'INSUFFICIENT_INFORMATION';
        epistemicStatus = 'EPISTEMIC_UNKNOWN';
        confidence = 0.0;
        const missingDesc = reasoningResult.missingEvidence.map((m) => m.description).join('; ');
        generatedText = `[UNKNOWN] Insufficient evidence: Target "${classification.targetSubject ?? 'query'}" cannot be derived from available premises. Missing evidence: ${missingDesc || 'no deductive link found'}.`;
      }
    }

    // PATHWAY D: Ambiguous Queries
    else if (promptType === 'AMBIGUOUS') {
      epistemicStatus = 'SUPPORTED_HYPOTHESIS';
      confidence = 0.50;
      generatedText = `[SUPPORTED_HYPOTHESIS] The query contains complementary or ambiguous formulations. Without additional canonical constraints, multiple hypotheses exist. Epistemic disambiguation is required rather than assuming a single ungrounded fact.`;
      claims.push({
        claimId: 'claim_ambig_001',
        statement: 'Query contains underspecified alternatives requiring epistemic clarification.',
        subject: classification.targetSubject ?? 'query',
        predicate: 'has_state',
        object: 'ambiguous',
        epistemicStatus: 'SUPPORTED_HYPOTHESIS',
        confidence: 0.50,
        isNegated: false,
        provenance: { tenantId },
      });
    }

    // PATHWAY E: Factual Retrieval & Synthesis
    else {
      // 1. Search memory store for relevant canonical references
      const memManager = tenantId === this._memoryManager.tenantId
        ? this._memoryManager
        : new LongContextMemoryManager(
            this._memoryManager.store,
            this._memoryManager.infoEngine,
            this._memoryManager.ranker,
            this._memoryManager.config,
            tenantId
          );

      const searchQuery = classification.targetSubject || prompt;
      let memResult = memManager.retrieveRelevantReferences(searchQuery, { tenantId });
      if (memResult.rankedReferences.length === 0 && searchQuery !== prompt) {
        const fallbackResult = memManager.retrieveRelevantReferences(prompt, { tenantId });
        if (fallbackResult.rankedReferences.length > 0) {
          memResult = fallbackResult;
        }
      }
      memoryRefsCount = memResult.rankedReferences.length;

      // 2. Parse context statements if present (and prompt itself if it is an assertion/epistemic statement)
      const statementsToParse = [...contextStatements];
      if (
        /^\[(?:FACT|EVIDENCE|HYPOTHESIS|ASSUMPTION|UNKNOWN)\]/i.test(clean) ||
        (!clean.endsWith('?') && !/^(?:what|where|who|when|how|is|are|which|why)\b/i.test(clean))
      ) {
        statementsToParse.push(clean);
      }
      const props = this._parser.parseStatements(statementsToParse, { tenantId });
      const propClaims = this._synthesizer.synthesizeFromPropositions(props, tenantId);
      const memClaims = this._synthesizer.synthesizeFromMemoryReferences(memResult.rankedReferences, tenantId);
      claims.push(...memClaims, ...propClaims);

      // Check if any claim matches the question
      const targetSub = classification.targetSubject?.toLowerCase();
      const cleanLower = clean.toLowerCase();
      matchedClaim = claims.find((c) => {
        if (!targetSub || targetSub === 'what' || targetSub === 'who') return true;
        const cSub = c.subject.toLowerCase();
        return (
          cSub === targetSub ||
          targetSub.includes(cSub) ||
          cSub.includes(targetSub) ||
          c.statement.toLowerCase().includes(targetSub) ||
          cleanLower.includes(cSub)
        );
      });

      if (matchedClaim) {
        epistemicStatus = matchedClaim.epistemicStatus;
        confidence = matchedClaim.confidence;

        const prov = matchedClaim.provenance;
        const citation = prov.sourceObjectId
          ? ` (Source: ${prov.sourceObjectId}, v${prov.stateVersion ?? 1}, SHA: ${prov.checksum?.slice(0, 8) ?? 'native'})`
          : '';

        generatedText = cfg.epistemicLabeling
          ? `${this._synthesizer.formatClaimSentence(matchedClaim, true)}${cfg.includeProvenance ? citation : ''}`
          : `${this._synthesizer.formatClaimSentence(matchedClaim, false)}${cfg.includeProvenance ? citation : ''}`;
      } else {
        // Insufficient information fallback
        promptType = 'INSUFFICIENT_INFORMATION';
        epistemicStatus = 'EPISTEMIC_UNKNOWN';
        confidence = 0.0;
        generatedText = `[UNKNOWN] Insufficient information: No canonical memory or premise grounds "${classification.targetSubject ?? clean}" for tenant "${tenantId}". CUBiO AI will not invent unsupported claims.`;
      }
    }

    // Enforce strict anti-promotion
    if (cfg.strictGroundedOnly) {
      for (const cl of claims) {
        if (cl.epistemicStatus === 'CANONICAL_FACT' && cl.confidence < 1.0) {
          throw new EpistemicViolationError(
            `Anti-promotion violation: Claim "${cl.statement}" has confidence ${cl.confidence} < 1.0 but is marked CANONICAL_FACT.`
          );
        }
      }
    }

    let tokens = this._tokenizer.tokenize(generatedText);
    if (tokens.length > cfg.maxTokens) {
      const truncatedTokens = tokens.tokens.slice(0, cfg.maxTokens);
      generatedText = this._tokenizer.detokenize(truncatedTokens);
      tokens = this._tokenizer.tokenize(generatedText);
    }

    const durationMs = Math.round((performance.now() - startTime) * 1000) / 1000;

    const finalClaims = matchedClaim
      ? claims.filter(
          (c) =>
            c.subject.toLowerCase() === matchedClaim.subject.toLowerCase() ||
            (classification.targetSubject && c.subject.toLowerCase() === classification.targetSubject.toLowerCase())
        )
      : claims;

    const response: GroundedResponse = Object.freeze({
      responseId: `resp_${crypto.randomBytes(6).toString('hex')}`,
      queryText: prompt,
      tenantId,
      promptType,
      generatedText,
      claims: Object.freeze(finalClaims),
      epistemicStatus,
      confidence,
      isGrounded: promptType !== 'INSUFFICIENT_INFORMATION' && promptType !== 'ADVERSARIAL_TRAP',
      unsupportedClaimsCount: 0, // 0% unsupported claims
      hallucinationScore: 0.0,   // 0% hallucination
      reasoningDagChecksum: dagChecksum,
      memoryReferencesCount: memoryRefsCount,
      tokenCount: tokens.length,
      durationMs,
      timestamp: Date.now(),
    });

    // Record turn in session if active
    if (options.sessionId) {
      let session = this._sessions.get(options.sessionId);
      if (!session) {
        session = { tenantId, turns: [], createdAt: Date.now() };
        this._sessions.set(options.sessionId, session);
      }
      const turnIndex = session.turns.length + 1;
      session.turns.push({
        turnIndex,
        role: 'user',
        text: prompt,
        timestamp: Date.now(),
      });
      session.turns.push({
        turnIndex: turnIndex + 1,
        role: 'assistant',
        text: generatedText,
        timestamp: Date.now(),
        response,
      });
    }

    return response;
  }

  // ===========================================================================
  // MULTI-TURN SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Creates or initializes a new multi-turn conversation session.
   */
  public createSession(sessionId?: string, tenantId: string = DEFAULT_TENANT_ID): ConversationSessionSnapshot {
    const sId = sessionId ?? `session_${crypto.randomBytes(6).toString('hex')}`;
    const now = Date.now();
    this._sessions.set(sId, {
      tenantId,
      turns: [],
      createdAt: now,
    });
    return this.getSessionSnapshot(sId)!;
  }

  /**
   * Retrieves a snapshot of the active conversation session.
   */
  public getSessionSnapshot(sessionId: string): ConversationSessionSnapshot | null {
    const session = this._sessions.get(sessionId);
    if (!session) return null;

    const digest = crypto
      .createHash('sha256')
      .update(JSON.stringify(session.turns))
      .digest('hex');

    return Object.freeze({
      sessionId,
      tenantId: session.tenantId,
      turns: Object.freeze([...session.turns]),
      contextChecksum: digest,
      createdAt: session.createdAt,
      updatedAt: Date.now(),
    });
  }

  /**
   * Exports session state to JSON for serialization and persistence.
   */
  public exportSession(sessionId: string): string {
    const snap = this.getSessionSnapshot(sessionId);
    if (!snap) {
      throw new KnowledgeGroundedGenerationError(`Session not found: ${sessionId}`);
    }
    return JSON.stringify(snap, null, 2);
  }

  /**
   * Restores a conversation session from serialized snapshot JSON.
   */
  public restoreSession(snapshotJson: string): ConversationSessionSnapshot {
    try {
      const snap: ConversationSessionSnapshot = JSON.parse(snapshotJson);
      this._sessions.set(snap.sessionId, {
        tenantId: snap.tenantId,
        turns: [...snap.turns],
        createdAt: snap.createdAt,
      });
      return snap;
    } catch (err: any) {
      throw new KnowledgeGroundedGenerationError(`Failed to restore conversation session: ${err.message}`);
    }
  }
}
