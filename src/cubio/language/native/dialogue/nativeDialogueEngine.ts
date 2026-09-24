/**
 * CUBiO AI — Phase 6: Task 82
 * Native Dialogue & Conversation Learning Layer
 * src/cubio/language/native/dialogue/nativeDialogueEngine.ts
 *
 * Sovereign Native Dialogue & Conversation Learning Engine.
 * Orchestrates multi-turn inspectable dialogue interactions:
 * - Separates working dialogue context from persistent canonical memory.
 * - Resolves coreferences and tracks active topics across turns.
 * - Detects and refutes cross-turn contradictions without state corruption.
 * - Generates structured clarification requests for underspecified inputs.
 * - Retrieves historical memories on demand (zero full-transcript duplication).
 * - Enforces permanent hardware actuation lock and strict tenant isolation.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import { LanguageStatementParser } from '../reasoning/languageStatementParser';
import { NativeLanguageGenerator } from '../generation/nativeLanguageGenerator';
import { GroundedResponse, GroundedClaim } from '../generation/generationTypes';
import {
  DialogueConfig,
  DEFAULT_DIALOGUE_CONFIG,
  DialogueTurn,
  DialogueSession,
  DialogueSessionSnapshot,
  ContradictionAlert,
  ClarificationRequest,
  DialogueError,
  UnauthorizedDialogueAccessError,
  DialogueContradictionError,
  DialogueBudgetExceededError,
  InvalidDialogueStateError,
} from './dialogueTypes';
import { TopicTracker } from './topicTracker';
import { DialogueContradictionDetector } from './dialogueContradictionDetector';
import { DialogueMemoryBridge } from './dialogueMemoryBridge';

export class NativeDialogueEngine {
  private readonly _tokenizer: NativeTokenizer;
  private readonly _parser: LanguageStatementParser;
  private readonly _topicTracker: TopicTracker;
  private readonly _contradictionDetector: DialogueContradictionDetector;
  private readonly _memoryBridge: DialogueMemoryBridge;
  private readonly _generator: NativeLanguageGenerator;
  private readonly _defaultConfig: DialogueConfig;

  /** Session store: sessionId -> internal session state */
  private readonly _sessions = new Map<
    string,
    {
      sessionId: string;
      tenantId: string;
      createdAt: number;
      updatedAt: number;
      turns: DialogueTurn[];
      consolidatedMemoryObjectIds: string[];
      activeContradictions: ContradictionAlert[];
      topicTracker: TopicTracker;
    }
  >();

  constructor(
    tokenizer?: NativeTokenizer,
    parser?: LanguageStatementParser,
    memoryBridge?: DialogueMemoryBridge,
    generator?: NativeLanguageGenerator,
    config?: Partial<DialogueConfig>
  ) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
    this._parser = parser ?? new LanguageStatementParser(this._tokenizer);
    this._topicTracker = new TopicTracker(this._parser);
    this._contradictionDetector = new DialogueContradictionDetector(this._parser);
    this._memoryBridge = memoryBridge ?? new DialogueMemoryBridge();
    this._generator =
      generator ??
      new NativeLanguageGenerator(
        this._tokenizer,
        this._parser,
        undefined,
        this._memoryBridge.memoryManager
      );

    this._defaultConfig = Object.freeze({
      ...DEFAULT_DIALOGUE_CONFIG,
      ...config,
    });
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  public get parser(): LanguageStatementParser {
    return this._parser;
  }

  public get memoryBridge(): DialogueMemoryBridge {
    return this._memoryBridge;
  }

  public get generator(): NativeLanguageGenerator {
    return this._generator;
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Initializes a new isolated conversation session.
   */
  public startSession(
    sessionId?: string,
    tenantId: string = DEFAULT_TENANT_ID,
    config?: Partial<DialogueConfig>
  ): DialogueSession {
    const sId = sessionId?.trim() || `session_${crypto.randomBytes(6).toString('hex')}`;
    const tId = tenantId.trim() || DEFAULT_TENANT_ID;
    const now = Date.now();

    const sessionData = {
      sessionId: sId,
      tenantId: tId,
      createdAt: now,
      updatedAt: now,
      turns: [] as DialogueTurn[],
      consolidatedMemoryObjectIds: [] as string[],
      activeContradictions: [] as ContradictionAlert[],
      topicTracker: new TopicTracker(this._parser),
      config: { ...this._defaultConfig, ...config },
    };

    this._sessions.set(sId, sessionData);

    return this.getSession(sId)!;
  }

  /**
   * Retrieves an immutable view of an active session.
   */
  public getSession(sessionId: string): DialogueSession | null {
    const s = this._sessions.get(sessionId);
    if (!s) return null;

    return Object.freeze({
      sessionId: s.sessionId,
      tenantId: s.tenantId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      topicState: s.topicTracker.state,
      turns: Object.freeze([...s.turns]),
      consolidatedMemoryObjectIds: Object.freeze([...s.consolidatedMemoryObjectIds]),
      activeContradictions: Object.freeze([...s.activeContradictions]),
    });
  }

  /**
   * Checks if a session exists.
   */
  public hasSession(sessionId: string): boolean {
    return this._sessions.has(sessionId);
  }

  // ===========================================================================
  // CORE CONVERSATIONAL PROCESSING
  // ===========================================================================

  /**
   * Processes a user utterance in the conversation session and produces a grounded response.
   */
  public chat(
    utterance: string,
    options: {
      sessionId?: string;
      tenantId?: string;
      config?: Partial<DialogueConfig>;
    } = {}
  ): GroundedResponse {
    const startTime = performance.now();
    const clean = (utterance ?? '').trim();

    if (!clean) {
      throw new DialogueError('Utterance string must be non-empty.');
    }

    const tenantId = options.tenantId?.trim() || DEFAULT_TENANT_ID;
    const sId = options.sessionId?.trim() || 'default_session';

    // 1. Session Retrieval & Tenant Isolation Guard
    let session = this._sessions.get(sId);
    if (!session) {
      this.startSession(sId, tenantId, options.config);
      session = this._sessions.get(sId)!;
    }

    if (session.tenantId !== tenantId) {
      throw new UnauthorizedDialogueAccessError(sId, tenantId, session.tenantId);
    }

    const cfg: DialogueConfig = { ...this._defaultConfig, ...(session as any).config, ...options.config };
    const userTurnIndex = session.turns.length + 1;

    // Check budget
    if (performance.now() - startTime > cfg.budgetMs) {
      throw new DialogueBudgetExceededError('Turn budget exceeded during pre-processing.');
    }

    // 2. Cross-Turn Contradiction Check
    const contradictionCheck = this._contradictionDetector.checkUtteranceAgainstTurns(
      clean,
      userTurnIndex,
      session.turns,
      tenantId
    );

    if (contradictionCheck.hasContradiction && contradictionCheck.alert) {
      const alert = contradictionCheck.alert;
      session.activeContradictions.push(alert);

      if (cfg.strictContradictionHalt) {
        // Safe halting: construct explicit refutation response without corrupting state
        const refutationText = `[CONTRADICTED] Refutation: Utterance "${clean}" directly contradicts prior dialogue state established in Turn ${alert.priorTurnIndex}: "${alert.previousStatement}". Execution safely halted without memory corruption.`;

        const contradictionResponse: GroundedResponse = Object.freeze({
          responseId: `resp_contra_${crypto.randomBytes(4).toString('hex')}`,
          queryText: clean,
          tenantId,
          promptType: 'ADVERSARIAL_TRAP',
          generatedText: refutationText,
          claims: Object.freeze([]),
          epistemicStatus: 'EPISTEMIC_UNKNOWN',
          confidence: 0.0,
          isGrounded: false,
          unsupportedClaimsCount: 0,
          hallucinationScore: 0.0,
          memoryReferencesCount: 0,
          tokenCount: this._tokenizer.tokenize(refutationText).length,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
          timestamp: Date.now(),
        });

        // Record turns
        this._recordTurnPair(session, clean, contradictionResponse, userTurnIndex, alert.epistemicStatus);
        return contradictionResponse;
      }
    }

    // 3. Clarification Behavior for Underspecified Queries (checked against active session topic)
    const priorTopic = session.topicTracker.state.activeTopic;
    const isUnderspecified = this._checkUnderspecifiedInput(clean, priorTopic);
    if (isUnderspecified.needsClarification) {
      const clarText = `[UNKNOWN] Clarification required: ${isUnderspecified.clarification?.clarificationPrompt}`;

      const clarResponse: GroundedResponse = Object.freeze({
        responseId: `resp_clar_${crypto.randomBytes(4).toString('hex')}`,
        queryText: clean,
        tenantId,
        promptType: 'AMBIGUOUS',
        generatedText: clarText,
        claims: Object.freeze([]),
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        unsupportedClaimsCount: 0,
        hallucinationScore: 0.0,
        memoryReferencesCount: 0,
        tokenCount: this._tokenizer.tokenize(clarText).length,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        timestamp: Date.now(),
      });

      this._recordTurnPair(
        session,
        clean,
        clarResponse,
        userTurnIndex,
        'EPISTEMIC_UNKNOWN',
        priorTopic,
        isUnderspecified.clarification
      );
      return clarResponse;
    }

    // 4. Topic Tracking & Coreference Resolution
    const topicResult = session.topicTracker.updateTopic(clean, userTurnIndex);
    const corefResult = session.topicTracker.resolveCoreferences(clean);
    const resolvedUtterance = corefResult.resolvedUtterance;
    const currentTopic = topicResult.activeTopic ?? corefResult.resolvedSubject;

    // 5. On-Demand Memory Retrieval & Bounded Context Assembly
    // Principle: STORE ONCE -> REFERENCE EVERYWHERE -> LOAD ON DEMAND
    // Retrieve only relevant historical memories, never copy entire past transcripts
    const memQuery = currentTopic || resolvedUtterance;
    const relevantMemories = this._memoryBridge.retrieveRelevantMemory(
      memQuery,
      tenantId,
      cfg.relevanceThreshold
    );

    const boundedContext: string[] = [];

    // Include recent dialogue turns up to bounded window (capped at 4)
    const maxRecent = Math.min(cfg.maxActiveTurns, 4);
    const recentTurns = session.turns.slice(-maxRecent);
    for (const t of recentTurns) {
      // If current topic is set, do not leak turns belonging to other different topics
      if (currentTopic && t.topic && t.topic.toLowerCase() !== currentTopic.toLowerCase()) {
        continue;
      }
      if (t.role === 'user') {
        boundedContext.push(t.utterance.slice(0, 160));
      } else if (t.role === 'assistant' && t.response) {
        for (const cl of t.response.claims.slice(0, 2)) {
          boundedContext.push(cl.statement.slice(0, 160));
        }
      }
    }

    // Include summaries of retrieved relevant memory references (top 2)
    for (const ref of relevantMemories.slice(0, 2)) {
      if (ref.summaryText) {
        boundedContext.push(ref.summaryText.slice(0, 160));
      }
    }

    // Include current utterance in context if it is an explicit assertion or tagged statement
    const contextStatements = [...boundedContext];
    if (
      /^\[(?:FACT|EVIDENCE|HYPOTHESIS|ASSUMPTION)\]/i.test(resolvedUtterance) ||
      (!resolvedUtterance.endsWith('?') && !/^(?:what|where|who|when|how|is|are|which|why)\b/i.test(resolvedUtterance))
    ) {
      contextStatements.push(resolvedUtterance);
    }

    // 6. Grounded Response Generation
    const response = this._generator.generate(resolvedUtterance, {
      context: contextStatements,
      tenantId,
      config: {
        maxTokens: cfg.maxContextTokens,
        seed: cfg.seed,
        budgetMs: cfg.budgetMs,
      },
    });

    // 7. Episodic Memory Consolidation
    if (cfg.allowEpisodicConsolidation && response.isGrounded) {
      const assistantTurn: DialogueTurn = {
        turnId: `turn_${crypto.randomBytes(4).toString('hex')}`,
        turnIndex: userTurnIndex + 1,
        role: 'assistant',
        utterance: response.generatedText,
        timestamp: Date.now(),
        response,
        topic: currentTopic,
        epistemicStatus: response.epistemicStatus,
        extractedClaims: response.claims,
        memoryReferences: relevantMemories.map((r) => r.objectId),
      };

      const consolidatedId = this._memoryBridge.consolidateTurnToMemory(
        sId,
        assistantTurn,
        tenantId
      );
      if (consolidatedId) {
        session.consolidatedMemoryObjectIds.push(consolidatedId);
      }
    }

    // 8. Record Turn Pair
    this._recordTurnPair(
      session,
      clean,
      response,
      userTurnIndex,
      response.epistemicStatus,
      currentTopic,
      undefined,
      relevantMemories.map((r) => r.objectId)
    );

    session.updatedAt = Date.now();
    return response;
  }

  // ===========================================================================
  // CHECKPOINT & RESTORATION
  // ===========================================================================

  /**
   * Serializes a conversation session to JSON snapshot.
   */
  public exportSession(sessionId: string): string {
    const s = this._sessions.get(sessionId);
    if (!s) {
      throw new DialogueError(`Cannot export non-existent session: "${sessionId}".`);
    }

    const payload = JSON.stringify({
      sessionId: s.sessionId,
      tenantId: s.tenantId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      turns: s.turns,
      topicState: s.topicTracker.state,
      consolidatedMemoryObjectIds: s.consolidatedMemoryObjectIds,
    });

    const checksum = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

    const snapshot: DialogueSessionSnapshot = Object.freeze({
      sessionId: s.sessionId,
      tenantId: s.tenantId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      turns: Object.freeze([...s.turns]),
      topicState: s.topicTracker.state,
      consolidatedMemoryObjectIds: Object.freeze([...s.consolidatedMemoryObjectIds]),
      contextChecksum: checksum,
    });

    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Restores a conversation session from a serialized snapshot JSON into this engine.
   */
  public restoreSession(snapshotJson: string): DialogueSession {
    try {
      const snap: DialogueSessionSnapshot = JSON.parse(snapshotJson);
      if (!snap.sessionId || !snap.tenantId) {
        throw new InvalidDialogueStateError('Snapshot missing required sessionId or tenantId.');
      }

      const tracker = new TopicTracker(this._parser);
      if (snap.topicState) {
        tracker.restoreState(snap.topicState);
      }

      const sessionData = {
        sessionId: snap.sessionId,
        tenantId: snap.tenantId,
        createdAt: snap.createdAt,
        updatedAt: snap.updatedAt,
        turns: [...snap.turns],
        consolidatedMemoryObjectIds: [...(snap.consolidatedMemoryObjectIds || [])],
        activeContradictions: [] as ContradictionAlert[],
        topicTracker: tracker,
        config: { ...this._defaultConfig },
      };

      this._sessions.set(snap.sessionId, sessionData);
      return this.getSession(snap.sessionId)!;
    } catch (err: any) {
      throw new InvalidDialogueStateError(`Failed to restore dialogue session: ${err.message}`);
    }
  }

  // ===========================================================================
  // PRIVATE HELPER ROUTINES
  // ===========================================================================

  private _recordTurnPair(
    session: {
      turns: DialogueTurn[];
      topicTracker: TopicTracker;
    },
    userUtterance: string,
    response: GroundedResponse,
    userTurnIndex: number,
    epistemicStatus: EpistemicStatus,
    topic?: string,
    clarification?: ClarificationRequest,
    memoryReferences: string[] = []
  ): void {
    const userTurn: DialogueTurn = Object.freeze({
      turnId: `turn_u_${userTurnIndex}`,
      turnIndex: userTurnIndex,
      role: 'user',
      utterance: userUtterance,
      timestamp: Date.now(),
      topic,
      epistemicStatus: 'CANONICAL_FACT',
      extractedClaims: Object.freeze([]),
      memoryReferences: Object.freeze([]),
    });

    const assistantTurn: DialogueTurn = Object.freeze({
      turnId: `turn_a_${userTurnIndex + 1}`,
      turnIndex: userTurnIndex + 1,
      role: 'assistant',
      utterance: response.generatedText,
      timestamp: Date.now(),
      response,
      topic,
      epistemicStatus,
      extractedClaims: response.claims,
      memoryReferences: Object.freeze(memoryReferences),
      isClarificationRequest: Boolean(clarification),
      clarificationDetails: clarification,
    });

    session.turns.push(userTurn, assistantTurn);
  }

  private _checkUnderspecifiedInput(
    utterance: string,
    activeTopic?: string
  ): { needsClarification: boolean; clarification?: ClarificationRequest } {
    const clean = utterance.toLowerCase().trim().replace(/[?.,!]+$/, '');

    // Case 1: Imperative / request with zero entity and zero active topic
    // e.g. "Configure it", "Set parameters", "Diagnose system"
    const genericImperatives = /^(?:configure|diagnose|adjust|operate|evaluate|run diagnostic|tune)\s+(?:it|this|that|system|component)?$/i;
    if (genericImperatives.test(clean) && !activeTopic) {
      return {
        needsClarification: true,
        clarification: {
          reason: 'Missing target entity: Command lacks explicit subject and no active conversation topic exists.',
          clarificationPrompt: 'Please specify which component, subsystem, or device you wish to address.',
        },
      };
    }

    // Case 2: Underspecified "Which one?" or "Which mode?"
    if (/^(?:which one|which mode|what type|which configuration)$/i.test(clean) && !activeTopic) {
      return {
        needsClarification: true,
        clarification: {
          reason: 'Underspecified alternative: Query lacks reference entity.',
          clarificationPrompt: 'Please specify the domain or subsystem context for this question.',
        },
      };
    }

    return { needsClarification: false };
  }
}
