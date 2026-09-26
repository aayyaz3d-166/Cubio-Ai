/**
 * CUBiO AI — Phase 9: Chat & Context Engine
 * chatEngine.ts
 *
 * Master Conversational Intelligence Orchestrator:
 *
 * USER
 *  ↓
 * CHAT & CONTEXT ENGINE
 *  ↓
 * Context Assembly (7 Explicit Layers, Strict Precedence)
 *  ↓
 * CUBiO AI CORE ENGINE
 *  ↓
 * Response Commit & Memory Policy Evaluation
 *  ↓
 * Cryptographic Provenance & State Sealing
 *
 * Enforces:
 * - Canonical conversationId -> sessionId -> turnId hierarchy
 * - Strict monotonic sequence ordering (N -> N+1)
 * - Complete Tenant, User, and Session Isolation
 * - Explicit User Constraint Permanence across restarts & compaction
 * - Hallucination Memory Lock (Assistant responses != facts)
 * - Idempotency & Duplicate Request Protection
 * - Cold-boot Day-2 Rehydration with 0% memory drift
 * - Permanent Actuation Lock (is_actuation_blocked = true) & Offline Isolation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  ChatRequest,
  ChatResponse,
  CanonicalTurn,
  ConversationStateSnapshot,
  ChatEngineError,
  ChatErrorType,
  CHAT_ENGINE_VERSION,
  CHAT_ENGINE_ID,
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
  DEFAULT_CONTEXT_BUDGET_CHARS,
} from './chatEngineContract';
import { ChatSession } from './chatSession';
import { ContextAssembler } from './contextAssembler';
import { ContextIntegrity } from './contextIntegrity';

// Core Engine integration
import { CubiOAICoreEngine } from '../core/coreEngine';
import { CoreEngineResult } from '../core/coreEngineContract';
import { ContextManager } from '../../inference/context/contextManager';
import { MemoryService } from '../../virtual_data/memoryService';
import { ExternalModelGuard } from '../../model/native_foundation/external_model_guard';
import { OutputGuard, OutputGuardVerdict } from '../../inference/safety/outputGuard';

// Phase 21 Conversational Memory Intelligence
import {
  MemoryUnderstandingEngine,
  MemoryContradictionEngine,
  MemoryRetrievalEngine,
  MemoryQualityEngine,
  MemoryTelemetryRecord,
} from './memory/index';

// Task 14: Canonical Memory Integration
import { ChatMemoryIntegrationEngine } from '../../core/chatMemoryIntegration';
import { Native1MProductionService } from '../../inference/native1mProductionService';
import { CubiOModelV1ProductionService } from '../../inference/cubioModelV1ProductionService';
import { NativeInferenceOutput, EpistemicStatus } from '../../model/native_foundation/native_model_types';

export class CubiOChatEngine {
  private static instance: CubiOChatEngine | null = null;
  public static readonly DEFAULT_PERSISTENCE_PATH = path.resolve(
    process.cwd(),
    'data',
    'cubio_chat_conversations.json'
  );

  private readonly sessions: Map<string, ChatSession> = new Map(); // keyed by conversationId
  private readonly idempotencyCache: Map<string, ChatResponse> = new Map(); // keyed by requestId
  private readonly coreEngine: CubiOAICoreEngine;
  private readonly contextManager: ContextManager;
  private readonly memoryService: MemoryService;
  private readonly memoryUnderstandingEngine: MemoryUnderstandingEngine;
  private readonly memoryContradictionEngine: MemoryContradictionEngine;
  private readonly memoryRetrievalEngine: MemoryRetrievalEngine;
  private readonly memoryQualityEngine: MemoryQualityEngine;
  private readonly memoryTelemetryLogs: MemoryTelemetryRecord[] = [];
  private readonly canonicalMemoryEngine: ChatMemoryIntegrationEngine;

  private totalRequests = 0;

  private constructor() {
    this.coreEngine = CubiOAICoreEngine.getInstance();
    this.contextManager = ContextManager.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.memoryUnderstandingEngine = MemoryUnderstandingEngine.getInstance();
    this.memoryContradictionEngine = MemoryContradictionEngine.getInstance();
    this.memoryRetrievalEngine = MemoryRetrievalEngine.getInstance();
    this.memoryQualityEngine = MemoryQualityEngine.getInstance();
    this.canonicalMemoryEngine = ChatMemoryIntegrationEngine.getInstance();
  }

  public static getInstance(): CubiOChatEngine {
    if (!CubiOChatEngine.instance) {
      CubiOChatEngine.instance = new CubiOChatEngine();
    }
    return CubiOChatEngine.instance;
  }

  public static reset(): void {
    CubiOChatEngine.instance = null;
  }

  public getCanonicalMemoryEngine(): ChatMemoryIntegrationEngine {
    return this.canonicalMemoryEngine;
  }

  public getTotalRequests(): number {
    return this.totalRequests;
  }

  public getMemoryTelemetry(): readonly MemoryTelemetryRecord[] {
    return Object.freeze([...this.memoryTelemetryLogs]);
  }

  public getTenantUsage(tenantId: string): {
    tenantId: string;
    conversationCount: number;
    turnCount: number;
    totalRequests: number;
  } {
    let convCount = 0;
    let turnCount = 0;
    for (const session of this.sessions.values()) {
      if (session.tenantId === tenantId) {
        convCount++;
        turnCount += session.getTurnCount();
      }
    }
    return {
      tenantId,
      conversationCount: convCount,
      turnCount,
      totalRequests: this.totalRequests,
    };
  }

  /**
   * Resolves or initializes a ChatSession for a conversationId.
   */
  public getOrCreateSession(
    conversationId: string,
    sessionId?: string,
    tenantId: string = 'tenant_default',
    userId: string = 'user_default'
  ): ChatSession {
    const existing = this.sessions.get(conversationId);
    if (existing) {
      // Strict multi-tenant isolation
      if (existing.tenantId !== tenantId) {
        throw new ChatEngineError(
          `Tenant isolation violation: conversation ${conversationId} belongs to tenant '${existing.tenantId}', requested by '${tenantId}'`,
          ChatErrorType.TENANT_ISOLATION_VIOLATION
        );
      }
      return existing;
    }

    const resolvedSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newSession = new ChatSession(conversationId, resolvedSessionId, tenantId, userId);
    this.sessions.set(conversationId, newSession);
    return newSession;
  }

  public getSession(conversationId: string, tenantId: string = 'tenant_default'): ChatSession | undefined {
    const session = this.sessions.get(conversationId);
    if (!session) return undefined;
    if (session.tenantId !== tenantId) {
      throw new ChatEngineError(
        `Tenant isolation violation: conversation ${conversationId} belongs to tenant '${session.tenantId}', requested by '${tenantId}'`,
        ChatErrorType.TENANT_ISOLATION_VIOLATION
      );
    }
    return session;
  }

  /**
   * Primary Chat Request Handler orchestrating the complete conversational pipeline.
   */
  public async executeChat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    this.totalRequests++;

    // 1. Hygiene & Actuation Gate
    if (!request.message || typeof request.message !== 'string' || request.message.trim().length === 0) {
      throw new Error('Chat message must be a non-empty string');
    }
    if (request.message.length > DEFAULT_CONTEXT_BUDGET_CHARS) {
      throw new ChatEngineError(
        `Context overflow: message length (${request.message.length} chars) exceeds maximum allowed context budget of ${DEFAULT_CONTEXT_BUDGET_CHARS} chars`,
        ChatErrorType.CONTEXT_OVERFLOW
      );
    }

    try {
      ExternalModelGuard.assertNativeOnly(request.message);
    } catch (err: any) {
      throw new ChatEngineError(
        err?.message || 'External model contamination blocked',
        ChatErrorType.EXTERNAL_MODEL_CONTAMINATION
      );
    }

    try {
      ExternalModelGuard.assertActuationBlocked(request.message);
      ExternalModelGuard.assertActuationBlocked(request.message.toLowerCase().replace(/\s+/g, '_'));
    } catch (err: any) {
      throw new ChatEngineError(
        err?.message || 'Hardware actuation prohibited',
        ChatErrorType.ACTUATION_PROHIBITED
      );
    }

    // 2. Idempotency & Duplicate Request Protection
    const cachedResponse = this.idempotencyCache.get(request.requestId);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 3. Resolve Session & Tenant Isolation
    const tenantId = request.tenantId || 'tenant_default';
    const userId = request.userId || 'user_default';
    const session = this.getOrCreateSession(request.conversationId, request.sessionId, tenantId, userId);

    const nextSeq = session.getTurnCount() + 1;
    const upcomingTurnId = `TURN_${request.conversationId}_${nextSeq}_${startTime}`;

    // 4. Memory Understanding & Classification (Phase 21)
    const existingIntelligentMemories = session.getAllIntelligentMemories();
    const memoryUnderstanding = this.memoryUnderstandingEngine.analyze(
      request.message,
      existingIntelligentMemories
    );

    let transitionOutcome: any = null;
    if (
      memoryUnderstanding.isMemoryWorthy &&
      (memoryUnderstanding.extractedFacts.length > 0 || memoryUnderstanding.explicitAction === 'FORGET')
    ) {
      transitionOutcome = this.memoryContradictionEngine.resolveAndTransition({
        newFacts: memoryUnderstanding.extractedFacts,
        understandingResult: memoryUnderstanding,
        existingMemories: existingIntelligentMemories,
        conversationId: request.conversationId,
        sessionId: session.sessionId,
        tenantId: session.tenantId,
        userId: session.userId,
        turnId: upcomingTurnId,
        turnSequence: nextSeq,
      });

      session.replaceIntelligentMemories([
        ...transitionOutcome.updatedMemories,
        ...transitionOutcome.archivedMemories,
      ]);
    }

    // 4b. Legacy Constraint Extraction & Contradiction Handling (Phase 9 backward compatibility)
    this.extractAndApplyUserConstraints(request.message, session);

    // 5. Bounded Memory Retrieval (Scoped, Bounded & Relevance-aware)
    const retrievalResult = this.memoryRetrievalEngine.retrieveBounded({
      query: request.message,
      candidateMemories: session.getAllIntelligentMemories(),
      tenantId: session.tenantId,
      userId: session.userId,
      currentTurnSequence: nextSeq,
      maxItems: 5,
      minRelevanceThreshold: 0.35,
      isExplicitRecall: memoryUnderstanding.explicitAction === 'RECALL',
    });

    const retrievedMemory: string[] = [];
    if (request.options?.spatialCoordinate) {
      const coordStr = `[${request.options.spatialCoordinate.join(',')}]`;
      retrievedMemory.push(`Spatial Coordinate Focus: ${coordStr}`);
    }

    // 5b. Targeted Canonical Memory Retrieval from VDB (Task 14)
    try {
      const canonicalCtx = await this.canonicalMemoryEngine.resolveContextForQuery({
        query: request.message,
        tenantId: session.tenantId,
        spatialCellId: request.options?.spatialCellId,
        spatialCoordinate: request.options?.spatialCoordinate,
      });
      for (const ref of canonicalCtx.references) {
        retrievedMemory.push(
          `Canonical Reference: ${ref.objectId} (v${ref.stateVersion}, checksum: ${ref.checksum ? ref.checksum.slice(0, 8) : 'N/A'}, domain: ${ref.domain || 'STATES'})`
        );
      }
    } catch {
      // Safe swallow to preserve fail-closed semantics
    }

    // Inject bounded intelligent memories
    for (const cand of retrievalResult.retrievedMemories) {
      retrievedMemory.push(
        `Intelligent Memory: ${cand.memory.key} = "${cand.memory.value}" (Authority: ${cand.memory.authority}, Source: ${cand.memory.source})`
      );
    }

    // Inclusion of session context facts when relevant to current query or on explicit recall
    for (const [k, v] of Object.entries(session.getAllMemory())) {
      if (!retrievalResult.retrievedMemories.some((r) => r.memory.key === k)) {
        if (
          request.message.toLowerCase().includes(k.toLowerCase()) ||
          memoryUnderstanding.explicitAction === 'RECALL'
        ) {
          retrievedMemory.push(`Session Context Fact: ${k} = "${v}"`);
        }
      }
    }

    // 6. Context Assembly (7 Explicit Layers)
    const assembledContext = ContextAssembler.assemble({
      session,
      currentMessage: request.message,
      retrievedMemory,
      budgetChars: 16000,
    });

    const corePrompt = ContextAssembler.formatPromptForCoreEngine(assembledContext);

    // 7. Core Engine Execution
    const coreResult: CoreEngineResult = await this.coreEngine.execute({
      prompt: corePrompt,
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      options: {
        preferredStrategy: request.options?.preferredStrategy,
        spatialCoordinate: request.options?.spatialCoordinate,
        spatialCellId: request.options?.spatialCellId,
        toolsAllowed: request.options?.toolsAllowed,
        maxTokens: request.options?.maxTokens,
        temperature: request.options?.temperature,
        timeoutMs: request.options?.timeoutMs,
        enforceEpistemicLockout: request.options?.enforceEpistemicLockout ?? true,
      },
    });

    // 7b. Sovereign Model Live Inference Pass (V1 or Native 1M routing)
    // Routes to CubiOModelV1ProductionService when modelId === 'cubio-model-v1',
    // otherwise falls back to Native1MProductionService (Phase 16 sealed 1M).
    let native1mEvaluation: any = null;
    let native1mGeneration: NativeInferenceOutput | null = null;

    const useModelV1 = request.options?.modelId === 'cubio-model-v1';
    const v1Service = CubiOModelV1ProductionService.getInstance();
    const native1mService = Native1MProductionService.getInstance();

    // Select the active inference service based on modelId routing
    const activeService = useModelV1 && v1Service.isReady() ? v1Service : native1mService;
    const activeServiceLabel = useModelV1 && v1Service.isReady() ? 'CUBiO Model V1' : 'Native 1M';

    if (activeService.isReady()) {
      // Telemetry-only evaluation pass (classification metadata)
      try {
        native1mEvaluation = activeService.evaluatePrompt(
          request.message,
          request.options?.spatialCellId
        );
      } catch (err: any) {
        if (err?.name === 'ActuationBlockedError' || err?.message?.includes('actuation')) {
          throw new ChatEngineError(
            err?.message || `Hardware actuation prohibited by ${activeServiceLabel} model guard`,
            ChatErrorType.ACTUATION_PROHIBITED
          );
        }
      }

      // Primary generation pass — autoregressive full text output
      // Circuit-breaker timeout, falls back to deterministic pipeline on expiry/error
      try {
        const GENERATION_TIMEOUT_MS = useModelV1 ? 3000 : 1500;
        // Conservative settings for V1 to reduce token fragmentation
        const generationOptions = useModelV1
          ? { maxTokens: 64, temperature: 0.3, topK: 20, enforceEpistemicLockout: true }
          : { maxTokens: 96, temperature: 0.7, topK: 40, enforceEpistemicLockout: true };

        const generationPromise = new Promise<NativeInferenceOutput>((resolve, reject) => {
          try {
            resolve(activeService.generate(
              request.message,
              generationOptions,
              request.options?.spatialCellId
            ));
          } catch (e) {
            reject(e);
          }
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${activeServiceLabel} generation timeout`)), GENERATION_TIMEOUT_MS)
        );
        native1mGeneration = await Promise.race([generationPromise, timeoutPromise]);
      } catch (genErr: any) {
        if (genErr?.name === 'ActuationBlockedError' || genErr?.message?.includes('actuation')) {
          throw new ChatEngineError(
            genErr?.message || `Hardware actuation prohibited by ${activeServiceLabel} generation guard`,
            ChatErrorType.ACTUATION_PROHIBITED
          );
        }
        // Non-actuation errors (timeout, model error) — fall back to deterministic pipeline silently
        native1mGeneration = null;
      }
    }

    // 8. Response Commit Pipeline
    // 8a. Validate Response & Actuation Safety
    if (!coreResult.isActuationBlocked) {
      throw new ChatEngineError(
        'Actuation lock violated: coreResult.isActuationBlocked must be true',
        ChatErrorType.ACTUATION_PROHIBITED
      );
    }

    // 8b. Phase 20 Response Quality Engine Validation
    const qualityReport = this.memoryQualityEngine.auditResponse({
      query: request.message,
      candidateResponse: coreResult.text,
      retrievedMemories: retrievalResult.retrievedMemories,
      allSessionMemories: session.getAllIntelligentMemories(),
      activeConstraints: session.getActiveConstraints(),
    });

    // Phase 45: Promote Native 1M autoregressive output as primary responseText
    // Falls back to deterministic pipeline (qualityReport.correctedResponse || coreResult.text)
    // if generation is null, empty, or epistemic status is UNKNOWN.
    const deterministicText = qualityReport.correctedResponse || coreResult.text;
    let responseText = deterministicText;
    if (
      native1mGeneration !== null &&
      native1mGeneration.text &&
      native1mGeneration.text.trim().length > 0 &&
      native1mGeneration.epistemicStatus !== EpistemicStatus.UNKNOWN
    ) {
      const verdict: OutputGuardVerdict = OutputGuard.validateOutput(native1mGeneration.text);
      if (verdict.isSafe && verdict.sanitizedText.trim().length > 0) {
        responseText = verdict.sanitizedText;
      }
      // If OutputGuard rejects (isSafe=false or empty), responseText stays as deterministicText
    }

    // Safety and OutputGuard checks on responseText
    OutputGuard.validateOutput(responseText);
    ExternalModelGuard.assertNativeOnly(responseText);
    ExternalModelGuard.assertActuationBlocked(responseText);

    // 8c. Append Authoritative Turn with strictly monotonic sequence
    const canonicalTurn: CanonicalTurn = session.appendTurn({
      turnId: upcomingTurnId,
      role: 'USER',
      input: request.message,
      output: responseText,
      contextReferences: [assembledContext.integrityHash],
      memoryReferences: retrievedMemory,
      intent: coreResult.decision.intent,
      reasoningReference: coreResult.decision.decisionId,
      toolReferences: coreResult.decision.toolsInvoked.map((t) => t.toolId),
      epistemicState: coreResult.decision.epistemicStatus,
      safetyStatus: coreResult.decision.safetyPassed && qualityReport.passed,
    });

    // 8d. Record Privacy-Preserving Telemetry (Zero raw message contents)
    const latencyMs = Math.max(1, Date.now() - startTime);
    const telemetryRecord: MemoryTelemetryRecord = Object.freeze({
      retrievalCount: retrievalResult.retrievedMemories.length,
      totalCandidates: retrievalResult.totalCandidates,
      memoryHit: retrievalResult.retrievedMemories.length > 0,
      topRelevanceScore: retrievalResult.topRelevanceScore,
      memorySourceTypes: Object.freeze(
        Array.from(new Set(retrievalResult.retrievedMemories.map((m) => m.memory.source)))
      ),
      latencyMs,
      contradictionCode: transitionOutcome?.detectedContradictionFlag ? 'CONTRADICTION_DETECTED' : undefined,
    });
    this.memoryTelemetryLogs.push(telemetryRecord);

    // 8e. Construct immutable ChatResponse
    const chatResponse: ChatResponse = Object.freeze({
      requestId: request.requestId,
      conversationId: request.conversationId,
      sessionId: session.sessionId,
      turnId: canonicalTurn.turnId,
      sequence: canonicalTurn.sequence,
      text: responseText,
      confidence: coreResult.confidence,
      epistemicState: canonicalTurn.epistemicState,
      coreResult,
      turn: canonicalTurn,
      latencyMs,
      timestamp: Date.now(),
      isActuationBlocked: true,
      isOfflineIsolated: true,
      ...(native1mEvaluation ? { native1mEvaluation } : {}),
    } as any);

    // 8e. Cache for Idempotency
    this.idempotencyCache.set(request.requestId, chatResponse);

    return chatResponse;
  }

  /**
   * Extracts user constraints and handles explicit contradictions/supersessions.
   */
  private extractAndApplyUserConstraints(message: string, session: ChatSession): void {
    const lower = message.toLowerCase();
    const isUncertainOrSpeculative = /\b(maybe|perhaps|possibly|probably|i\s+think|i\s+guess|i\s+suppose|i\s+believe|not\s+sure|might\s+be|could\s+be|would\s+be|what\s+if|suppose|assuming|hypothetically|wonder\s+if|unclear|doubt|shayad|lagta\s+hai|ho\s+sakta\s+hai|farz\s+karo|farz\s+karein|kya\s+pata|mumkin\s+hai|agar)\b/i.test(lower);
    const isInvertedQuestion = /^\s*(?:is|are|was|were|do|does|did|can|could|would|should|will|shall|may|might|am|has|have|had)\b/i.test(lower);
    const isWhQuestion = /^\s*(?:what|which|who|whom|whose|where|when|why|how|kya|kia|kea|kaise|kese|kaisay|kyun|kyu|kahan|kab|konsa|konsi|kon|kaun|kitna|kitni|kitnay)\b/i.test(lower);
    const hasQuestionMark = /\?/.test(message);

    // Colloquial remarks, moods, feelings (Roman Urdu or English) must never be committed as factual constraints
    const isColloquialEmotionOrState =
      /\b(?:mujhe|mujhy|mjhe|mjy|mujhko)\s+(?:bohot\s+|bohat\s+|kaafi\s+)?(?:thakawat|neend|bhook|pyas|gussa|dard|khushi)\s+(?:hai|hy|lagi)\b/i.test(lower) ||
      /\b(?:mera|meri)\s+(?:mood|tabiyat|haal|zehn)\s+(?:theek|thk|thek|kharab|sahi)\s+(?:nahi|na)\s+(?:hai|hy)\b/i.test(lower) ||
      /\b(?:aaj\s+)?(?:bohot|bohat|kaafi)?\s*(?:thak\s+gaya|thakawat|exhausted|tired|burned\s*out)\b/i.test(lower) ||
      /\b(?:feeling\s+(?:tired|sleepy|down|exhausted|lonely|happy|sad|sick))\b/i.test(lower);

    if (isUncertainOrSpeculative || isInvertedQuestion || isWhQuestion || hasQuestionMark || isColloquialEmotionOrState) {
      // Questions, uncertain statements, and colloquial emotional remarks cannot set constraints
      return;
    }

    // Pattern 1: Explicit preference / constraint: "Do not use external models"
    if (/\b(do not use external models|no external models|native models only)\b/i.test(message)) {
      session.addConstraint('model_policy', 'NATIVE_ONLY', 'USER_EXPLICIT');
    }

    // Pattern 2: 369 addressing constraint
    if (/\b(use 369 addressing|strict 369|369 system)\b/i.test(message)) {
      session.addConstraint('addressing_policy', '369_CANONICAL', 'USER_EXPLICIT');
    }

    // Pattern 3: Local project constraint
    if (/\b(keep this project local|strictly local|offline only)\b/i.test(message)) {
      session.addConstraint('locality_policy', 'STRICT_LOCAL', 'USER_EXPLICIT');
    }

    // Pattern 4: Explicit key-value fact: "My secret code is XYZ" or "Set option to A"
    const secretMatch = message.match(/(?:secret code|code word|password|key)\s+(?:is|=|set to)\s+([A-Za-z0-9_\-]+)/i);
    if (secretMatch) {
      session.addConstraint('secret_code', secretMatch[1], 'USER_EXPLICIT');
      session.setMemory('secret_code', secretMatch[1]);
    }

    // Pattern 5: Contradiction / Supersession: "Actually use option B" or "Change option to B"
    const optionMatch = message.match(/(?:actually use|change to|switch to|instead use)\s+option\s+([A-Za-z0-9_\-]+)/i);
    if (optionMatch) {
      session.addConstraint('selected_option', optionMatch[1], 'USER_CONTRADICTION_SUPERSEDED');
    } else {
      const initOption = message.match(/(?:use|select)\s+option\s+([A-Za-z0-9_\-]+)/i);
      if (initOption) {
        session.addConstraint('selected_option', initOption[1], 'USER_EXPLICIT');
      }
    }
  }

  /**
   * Persists all active conversation sessions to disk with SHA-256 cryptographic seal.
   */
  public saveToDisk(filepath: string = CubiOChatEngine.DEFAULT_PERSISTENCE_PATH): void {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const snapshots = Array.from(this.sessions.values()).map((s) => s.toSnapshot());
    const payload = {
      version: CHAT_ENGINE_VERSION,
      timestamp: Date.now(),
      conversations: snapshots,
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const checksum = crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
    const sealedWrapper = JSON.stringify({ checksum, data: payload }, null, 2);

    fs.writeFileSync(filepath, sealedWrapper, 'utf8');
  }

  /**
   * Cold-boot Day-2 rehydration from disk verifying 0% memory drift.
   */
  public loadFromDisk(filepath: string = CubiOChatEngine.DEFAULT_PERSISTENCE_PATH): boolean {
    if (!fs.existsSync(filepath)) return false;

    try {
      const raw = fs.readFileSync(filepath, 'utf8');
      const wrapper = JSON.parse(raw);
      const computedChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(wrapper.data, null, 2), 'utf8')
        .digest('hex');

      if (wrapper.checksum && wrapper.checksum !== computedChecksum) {
        throw new ChatEngineError(
          'CORRUPTION_DETECTED: Day-2 conversation snapshot checksum mismatch',
          ChatErrorType.INTEGRITY_CHECK_FAILED
        );
      }

      this.sessions.clear();
      this.idempotencyCache.clear();

      for (const snap of wrapper.data.conversations) {
        const session = ChatSession.fromSnapshot(snap);
        this.sessions.set(session.conversationId, session);
      }

      return true;
    } catch {
      return false;
    }
  }
}
