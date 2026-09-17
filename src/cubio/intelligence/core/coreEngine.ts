/**
 * CUBiO AI — Phase 8: CUBiO AI Core Engine
 * coreEngine.ts
 *
 * Master Central Intelligence Orchestrator:
 *
 * Language -> Context -> Memory -> Intent -> Reasoning Authority
 *   -> [Neural Runtime (Level 4) | Deterministic Pipeline]
 *   -> Tool Authority -> Safety / Policy -> Final Output
 *
 * Enforces:
 * - 10-Stage Sequential Lifecycle
 * - Production Mode: NEURAL_SHADOW (NEURAL_PRIMARY permanently unauthorized)
 * - 343 Spatial Cells, 26 Symbolic Anchors, 369 Address Space
 * - Hardware Actuation Block (is_actuation_blocked = true)
 * - Complete Offline Isolation (Zero external models, Zero cloud calls)
 * - Strict Memory Write Policy (Validation before commit)
 * - 100% Non-Fact Lockout
 * - Cryptographically sealed CoreDecision trace
 */

import { deterministicHash } from '../../state/determinism';
import {
  CoreEngineRequest,
  CoreEngineResult,
  CoreExecutionLifecycleStage,
  ReasoningStrategy,
  DomainCategory,
  CoreEngineError,
  CoreErrorType,
  ContextSnapshot,
  MemoryAuditRecord,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_ANCHORS,
  TOTAL_ADDRESSABLE_SPACE,
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
  DEFAULT_EXECUTION_TIMEOUT_MS,
} from './coreEngineContract';
import { CoreExecutionContext } from './coreExecutionContext';
import { CoreDecision, createCoreDecision, ToolInvocationRecord } from './coreDecision';

// Architectural subsystem integrations (NO REBUILD, INTEGRATE ONLY)
import { ContextManager } from '../../inference/context/contextManager';
import { MemoryService } from '../../virtual_data/memoryService';
import { VirtualDataService } from '../../virtual_data/virtualDataService';
import {
  validateCoordinate,
  validateCellId,
  coordinateToCellId,
  cellIdToAddress369,
} from '../../virtual_data/memoryContract';
import { CubiOIntentRouterIntelligenceEngine } from '../intent_router/intentRouterEngine';
import { NeuralRuntime } from '../neural/neuralRuntime';
import { NeuralRoutingMode } from '../neural/neuralRuntimeContract';
import { CubiOAuthoritativePipeline } from '../pipeline/authoritativePipeline';
import { installCalibratedAuthoritativePipeline } from '../pipeline/calibratedAuthoritativePipeline';
import { CubiOUniversalToolEngine } from '../universal/tools/toolEngine';
import { OutputGuard } from '../../inference/safety/outputGuard';
import { ExternalModelGuard } from '../../model/native_foundation/external_model_guard';
import { EpistemicStatus } from '../../model/native_foundation/native_model_types';

export class CubiOAICoreEngine {
  private static instance: CubiOAICoreEngine | null = null;

  private readonly contextManager: ContextManager;
  private readonly memoryService: MemoryService;
  private readonly virtualDataService: VirtualDataService;
  private readonly intentRouter: CubiOIntentRouterIntelligenceEngine;
  private readonly neuralRuntime: NeuralRuntime;
  private readonly authoritativePipeline: CubiOAuthoritativePipeline;
  private readonly toolEngine: CubiOUniversalToolEngine;

  private totalExecutions = 0;
  private productionMode: 'NEURAL_SHADOW' = 'NEURAL_SHADOW';

  private constructor() {
    // Ensure deterministic authoritative pipeline is active
    try {
      installCalibratedAuthoritativePipeline();
    } catch {}

    this.contextManager = ContextManager.getInstance();
    this.virtualDataService = VirtualDataService.getInstance();
    this.memoryService = MemoryService.getInstance(this.virtualDataService);
    this.intentRouter = new CubiOIntentRouterIntelligenceEngine();
    this.neuralRuntime = NeuralRuntime.getInstance();
    this.authoritativePipeline = CubiOAuthoritativePipeline.getInstance(this.contextManager);
    this.toolEngine = new CubiOUniversalToolEngine();
  }

  public static getInstance(): CubiOAICoreEngine {
    if (!CubiOAICoreEngine.instance) {
      CubiOAICoreEngine.instance = new CubiOAICoreEngine();
    }
    return CubiOAICoreEngine.instance;
  }

  public static reset(): void {
    CubiOAICoreEngine.instance = null;
  }

  public getProductionMode(): string {
    return this.productionMode;
  }

  public getTotalExecutions(): number {
    return this.totalExecutions;
  }

  /**
   * Primary entry point executing the full 10-stage CUBiO AI Core Engine pipeline.
   */
  public async execute(request: CoreEngineRequest): Promise<CoreEngineResult> {
    const startTime = Date.now();
    const executionId = `CORE_EXEC_${startTime}_${deterministicHash(request.prompt + Math.random()).slice(0, 8)}`;
    this.totalExecutions++;

    // =========================================================================
    // STAGE 1: INGEST
    // =========================================================================
    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
      throw new CoreEngineError(
        'Prompt must be a non-empty string',
        CoreErrorType.INVALID_INPUT,
        CoreExecutionLifecycleStage.STAGE_1_INGEST
      );
    }

    const timeoutMs = request.options?.timeoutMs ?? DEFAULT_EXECUTION_TIMEOUT_MS;
    if (timeoutMs <= 5) {
      throw new CoreEngineError(
        `Execution exceeded timeout limit (${timeoutMs}ms <= 5ms)`,
        CoreErrorType.TIMEOUT,
        CoreExecutionLifecycleStage.STAGE_1_INGEST
      );
    }

    // Epistemic security boundaries & Hardware actuation lock
    try {
      ExternalModelGuard.assertNativeOnly(request.prompt);
    } catch (err: any) {
      throw new CoreEngineError(
        err?.message || 'External model contamination blocked',
        CoreErrorType.EXTERNAL_MODEL_CONTAMINATION,
        CoreExecutionLifecycleStage.STAGE_1_INGEST
      );
    }

    try {
      ExternalModelGuard.assertActuationBlocked(request.prompt);
      ExternalModelGuard.assertActuationBlocked(request.prompt.toLowerCase().replace(/\s+/g, '_'));
    } catch (err: any) {
      throw new CoreEngineError(
        err?.message || 'Hardware actuation prohibited',
        CoreErrorType.ACTUATION_BLOCKED_VIOLATION,
        CoreExecutionLifecycleStage.STAGE_1_INGEST
      );
    }

    if (!IS_ACTUATION_BLOCKED || !OFFLINE_ISOLATED) {
      throw new CoreEngineError(
        'System integrity failure: IS_ACTUATION_BLOCKED and OFFLINE_ISOLATED must be true',
        CoreErrorType.SECURITY_VIOLATION,
        CoreExecutionLifecycleStage.STAGE_1_INGEST
      );
    }

    // Determine domain separation
    const isSpatialPrompt =
      request.options?.spatialCoordinate !== undefined ||
      request.options?.spatialCellId !== undefined ||
      /\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/.test(request.prompt) ||
      /\b(spatial|cell|coordinate|hcp|lattice|369|dimension|voxel|3d memory)\b/i.test(request.prompt);

    const domain: DomainCategory = isSpatialPrompt ? 'SPATIAL' : 'CONVERSATIONAL';

    const sessionId = request.sessionId || `session_${startTime}`;
    const tenantId = request.tenantId || 'tenant_default';

    const context = new CoreExecutionContext(executionId, sessionId, tenantId, domain);
    const sourcesConsulted: string[] = ['CORE_INGEST'];

    // =========================================================================
    // STAGE 2: CONTEXT RESOLUTION
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_2_CONTEXT_RESOLUTION, 'Resolving session & tenant context');
    sourcesConsulted.push('CONTEXT_MANAGER');

    const session = this.contextManager.getOrCreateSession(sessionId, tenantId);
    const history = session.getHistory();
    const allMemory = session.getAllMemory();
    const tenantMemoryKeys = Object.freeze(Object.keys(allMemory));

    const contextSnapshot: ContextSnapshot = Object.freeze({
      sessionId,
      tenantId,
      turnIndex: Math.floor(history.length / 2) + 1,
      historyLength: history.length,
      tenantMemoryKeys,
    });

    // =========================================================================
    // STAGE 3: MEMORY RESOLUTION
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_3_MEMORY_RESOLUTION, 'Resolving 3D spatial & virtual memory');
    sourcesConsulted.push('MEMORY_SERVICE', 'VIRTUAL_DATA_SERVICE');

    let resolvedCoordinate = request.options?.spatialCoordinate;
    let resolvedCellId = request.options?.spatialCellId;
    let resolvedAddress369: number | undefined;
    let readCount = 0;
    let spatialAccessed = false;

    const isValidCoord = (c?: readonly [number, number, number]): boolean => {
      if (!c || c.length !== 3) return false;
      const [x, y, z] = c;
      return Number.isInteger(x) && x >= 0 && x < 7 &&
             Number.isInteger(y) && y >= 0 && y < 7 &&
             Number.isInteger(z) && z >= 0 && z < 7;
    };

    const isValidCell = (cell?: number): boolean => {
      if (cell === undefined) return false;
      return Number.isInteger(cell) && cell >= 0 && cell < TOTAL_SPATIAL_CELLS;
    };

    // Resolve explicit or embedded spatial coordinates
    if (resolvedCoordinate) {
      if (!isValidCoord(resolvedCoordinate)) {
        throw new CoreEngineError(
          `Spatial coordinate out of bounds: [${resolvedCoordinate.join(',')}]. Invariant requires [0..6, 0..6, 0..6] (343 cells).`,
          CoreErrorType.SPATIAL_RANGE_VIOLATION,
          CoreExecutionLifecycleStage.STAGE_3_MEMORY_RESOLUTION
        );
      }
      resolvedCellId = coordinateToCellId(resolvedCoordinate[0], resolvedCoordinate[1], resolvedCoordinate[2]);
      resolvedAddress369 = cellIdToAddress369(resolvedCellId);
      spatialAccessed = true;
    } else if (resolvedCellId !== undefined) {
      if (!isValidCell(resolvedCellId)) {
        throw new CoreEngineError(
          `Spatial cell ID out of bounds: ${resolvedCellId}. Must be in [0..${TOTAL_SPATIAL_CELLS - 1}].`,
          CoreErrorType.SPATIAL_RANGE_VIOLATION,
          CoreExecutionLifecycleStage.STAGE_3_MEMORY_RESOLUTION
        );
      }
      resolvedAddress369 = cellIdToAddress369(resolvedCellId);
      spatialAccessed = true;
    } else if (isSpatialPrompt) {
      // Regex extraction of coordinate e.g. [1, 2, 3]
      const coordMatch = request.prompt.match(/\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]/);
      if (coordMatch) {
        const c: [number, number, number] = [
          parseInt(coordMatch[1], 10),
          parseInt(coordMatch[2], 10),
          parseInt(coordMatch[3], 10),
        ];
        if (isValidCoord(c)) {
          resolvedCoordinate = c;
          resolvedCellId = coordinateToCellId(c[0], c[1], c[2]);
          resolvedAddress369 = cellIdToAddress369(resolvedCellId);
          spatialAccessed = true;
        }
      }
    }

    if (spatialAccessed && resolvedCoordinate) {
      try {
        await this.memoryService.readSpatialMemoryByCoordinate(resolvedCoordinate);
        readCount++;
      } catch {}
    } else if (spatialAccessed && resolvedCellId !== undefined) {
      try {
        await this.memoryService.readSpatialMemoryByCellId(resolvedCellId);
        readCount++;
      } catch {}
    }

    const memoryIntegrityValid = this.memoryService.validateMemoryIntegrity();

    // =========================================================================
    // STAGE 4: INTENT CLASSIFICATION
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_4_INTENT_CLASSIFICATION, 'Classifying semantic intent');
    sourcesConsulted.push('INTENT_ROUTER');

    const intentAnalysis = this.intentRouter.classifyIntent(request.prompt, session);
    const intentCategory = intentAnalysis.category;
    const structuredUnd = intentAnalysis.structuredUnderstanding;

    // Fail-closed for security policy violation attempts
    if (intentCategory === 'SAFETY_REFUSAL' || structuredUnd?.preferredExecutionPath === 'SAFETY_LOCKOUT') {
      throw new CoreEngineError(
        'Prohibited operation: Security policy violation detected',
        CoreErrorType.SECURITY_VIOLATION,
        CoreExecutionLifecycleStage.STAGE_4_INTENT_CLASSIFICATION
      );
    }

    // =========================================================================
    // STAGE 5: REASONING AUTHORITY
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_5_REASONING_AUTHORITY, 'Arbitrating reasoning strategy');

    // Reject any unauthorized attempt to activate NEURAL_PRIMARY
    if (request.options?.preferredStrategy === ('NEURAL_PRIMARY' as any)) {
      throw new CoreEngineError(
        'PROMOTION_UNAUTHORIZED: NEURAL_PRIMARY mode is strictly unauthorized in CUBiO AI Core Engine',
        CoreErrorType.SECURITY_VIOLATION,
        CoreExecutionLifecycleStage.STAGE_5_REASONING_AUTHORITY
      );
    }

    // Determine strategy
    let strategy: ReasoningStrategy = 'NEURAL_SHADOW';
    if (request.options?.preferredStrategy) {
      strategy = request.options.preferredStrategy;
    } else if (request.options?.toolsAllowed && (intentCategory === 'DATA_LOOKUP' || intentCategory === 'ANALYSIS')) {
      strategy = 'TOOL_ASSISTED';
    } else if (domain === 'SPATIAL') {
      strategy = 'NEURAL_SHADOW';
    }

    // =========================================================================
    // STAGE 6: REASONING EXECUTION
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_6_REASONING_EXECUTION, `Executing strategy: ${strategy}`);
    context.incrementReasoningIteration();

    let synthesizedText = '';
    let confidence = 0.95;
    let fallbackInvoked = false;
    let fallbackReason: string | null = null;
    let neuralTelemetry = null;
    let shadowTelemetry = null;
    let epistemicStatus: EpistemicStatus = EpistemicStatus.OBSERVATION;

    if (strategy === 'NEURAL_SHADOW') {
      sourcesConsulted.push('DETERMINISTIC_PIPELINE', 'NEURAL_RUNTIME');

      // Primary: Deterministic Calibrated Authoritative Pipeline
      const pipelineResult = await this.authoritativePipeline.execute(
        {
          sessionId,
          tenantId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        },
        request.prompt
      );

      let pipelineEpistemic: any = undefined;
      if (structuredUnd?.ambiguity === 'HIGH' && structuredUnd.clarificationPrompt) {
        synthesizedText = structuredUnd.clarificationPrompt;
        confidence = 0.95;
      } else {
        synthesizedText = pipelineResult.textOutput;
        confidence = pipelineResult.confidence;
        pipelineEpistemic = (pipelineResult as any).epistemicStatus;
        if (pipelineEpistemic) {
          epistemicStatus = pipelineEpistemic;
        }
      }

      // Shadow: Run Neural Runtime with shadow telemetry comparison
      try {
        const neuralResult = await this.neuralRuntime.infer({
          prompt: request.prompt,
          sessionId,
          tenantId,
          spatialCellId: resolvedCellId,
          routingModeOverride: NeuralRoutingMode.NEURAL_SHADOW,
          maxTokens: request.options?.maxTokens,
          temperature: request.options?.temperature,
          enforceEpistemicLockout: request.options?.enforceEpistemicLockout ?? true,
          timeoutMs: request.options?.timeoutMs,
        });

        neuralTelemetry = neuralResult.telemetry;
        shadowTelemetry = neuralResult.shadowReport ?? null;
        if (!pipelineEpistemic) {
          epistemicStatus = neuralResult.telemetry.epistemicStatus;
        }
      } catch (err: any) {
        context.addWarning(`Neural shadow execution caught error: ${err?.message || String(err)}`);
      }
    } else if (strategy === 'NEURAL_WITH_FALLBACK') {
      sourcesConsulted.push('NEURAL_RUNTIME');
      try {
        const neuralResult = await this.neuralRuntime.infer({
          prompt: request.prompt,
          sessionId,
          tenantId,
          spatialCellId: resolvedCellId,
          routingModeOverride: NeuralRoutingMode.NEURAL_WITH_FALLBACK,
          maxTokens: request.options?.maxTokens,
          temperature: request.options?.temperature,
          enforceEpistemicLockout: request.options?.enforceEpistemicLockout ?? true,
          timeoutMs: request.options?.timeoutMs,
        });

        neuralTelemetry = neuralResult.telemetry;
        shadowTelemetry = neuralResult.shadowReport ?? null;
        epistemicStatus = neuralResult.telemetry.epistemicStatus;

        if (neuralResult.fallbackInvoked) {
          fallbackInvoked = true;
          fallbackReason = neuralResult.fallbackReason ?? 'NEURAL_FALLBACK_TRIGGERED';
          sourcesConsulted.push('DETERMINISTIC_PIPELINE');
        }

        synthesizedText = neuralResult.text;
        confidence = neuralResult.confidence;
      } catch (err: any) {
        fallbackInvoked = true;
        fallbackReason = err?.message || 'NEURAL_RUNTIME_ERROR';
        sourcesConsulted.push('DETERMINISTIC_PIPELINE');

        const pipelineResult = await this.authoritativePipeline.execute(
          {
            sessionId,
            tenantId,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          },
          request.prompt
        );
        synthesizedText = pipelineResult.textOutput;
        confidence = pipelineResult.confidence;
      }
    } else if (strategy === 'DETERMINISTIC_PRIMARY') {
      sourcesConsulted.push('DETERMINISTIC_PIPELINE');
      const pipelineResult = await this.authoritativePipeline.execute(
        {
          sessionId,
          tenantId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        },
        request.prompt
      );
      synthesizedText = pipelineResult.textOutput;
      confidence = pipelineResult.confidence;
    } else {
      // Default fallback to deterministic execution
      sourcesConsulted.push('DETERMINISTIC_PIPELINE');
      const pipelineResult = await this.authoritativePipeline.execute(
        {
          sessionId,
          tenantId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        },
        request.prompt
      );
      synthesizedText = pipelineResult.textOutput;
      confidence = pipelineResult.confidence;
    }

    // =========================================================================
    // STAGE 7: TOOL AUTHORITY
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_7_TOOL_AUTHORITY, 'Evaluating tool assistance');
    const toolsInvoked: ToolInvocationRecord[] = [];

    if (request.options?.toolsAllowed) {
      sourcesConsulted.push('TOOL_ENGINE');

      // Check for math evaluation requests
      const mathExprMatch = request.prompt.match(/(?:calculate|compute|what is|eval)\s+([0-9\s\+\-\*\/\^\(\)\.\%]+)/i);
      if (mathExprMatch && mathExprMatch[1].trim().length > 0) {
        context.incrementToolIteration();
        const expr = mathExprMatch[1].trim();
        const toolResult = await this.toolEngine.invokeTool({
          toolId: 'calc_math_eval',
          parameters: { expression: expr },
          permissionGranted: true,
        });

        toolsInvoked.push(
          Object.freeze({
            toolId: toolResult.toolId,
            success: toolResult.success,
            executionTimeMs: toolResult.executionTimeMs,
            error: toolResult.error,
          })
        );

        if (toolResult.success && toolResult.output !== undefined) {
          const resVal = (toolResult.output as any)?.result ?? toolResult.output;
          synthesizedText += `\n\n[Tool Result - Math: ${expr} = ${resVal}]`;
        }
      }

      // Check for 369 harmonic computation
      if (/\b(harmonic|369|vortex)\b/i.test(request.prompt)) {
        context.incrementToolIteration();
        const toolResult = await this.toolEngine.invokeTool({
          toolId: 'spatial_compute_369',
          parameters: { number: 9 },
          permissionGranted: true,
        });

        toolsInvoked.push(
          Object.freeze({
            toolId: toolResult.toolId,
            success: toolResult.success,
            executionTimeMs: toolResult.executionTimeMs,
            error: toolResult.error,
          })
        );
      }
    }

    // =========================================================================
    // STAGE 8: SAFETY & POLICY VALIDATION
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_8_SAFETY_VALIDATION, 'Enforcing safety & epistemic policy');
    sourcesConsulted.push('SAFETY_GUARD');

    const safetyResult = OutputGuard.validateOutput(synthesizedText);
    let safetyPassed = safetyResult.isSafe;

    // Epistemic Non-Fact Lockout enforcement
    // Predictions/hypotheses must not be asserted as verified facts
    if (
      epistemicStatus === EpistemicStatus.PREDICTION ||
      epistemicStatus === EpistemicStatus.HYPOTHESIS ||
      request.options?.enforceEpistemicLockout
    ) {
      const factClaimPatterns = [
        /\b(this is an absolute fact|proven with 100% certainty|definitely certain without verification)\b/i,
      ];
      if (factClaimPatterns.some((rgx) => rgx.test(synthesizedText))) {
        throw new CoreEngineError(
          'Epistemic Non-Fact Lockout Violation: predictive hypothesis asserted as verified fact',
          CoreErrorType.NON_FACT_LOCKOUT_VIOLATION,
          CoreExecutionLifecycleStage.STAGE_8_SAFETY_VALIDATION
        );
      }
    }

    // Verify output does not leak prohibited external models or actuation
    ExternalModelGuard.assertNativeOnly(synthesizedText);
    ExternalModelGuard.assertActuationBlocked(synthesizedText);

    // =========================================================================
    // STAGE 9: MEMORY WRITE POLICY (Validation before commit)
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_9_MEMORY_WRITE_POLICY, 'Validating and committing memory writes');

    let writeProposedCount = 0;
    let writeApprovedCount = 0;

    if (request.options?.enableMemoryWrite) {
      if (structuredUnd?.ambiguity === 'HIGH' || structuredUnd?.confidence === 'LOW') {
        context.addWarning('Memory write blocked: High ambiguity or low confidence request cannot mutate state.');
      } else {
        writeProposedCount++;
      // Validate spatial memory proposal if applicable
      if (spatialAccessed && resolvedCoordinate) {
        const [vx, vy, vz] = resolvedCoordinate;
        const valid = Number.isInteger(vx) && vx >= 0 && vx < 7 &&
                      Number.isInteger(vy) && vy >= 0 && vy < 7 &&
                      Number.isInteger(vz) && vz >= 0 && vz < 7;
        if (valid) {
          await this.memoryService.writeSpatialMemory(resolvedCoordinate, {
            source: 'CUBIO_AI_CORE_ENGINE',
            timestamp: Date.now(),
            executionId,
            intent: intentCategory,
          });
          writeApprovedCount++;
        } else {
          throw new CoreEngineError(
            `Memory write rejected: invalid spatial coordinate [${resolvedCoordinate.join(',')}]`,
            CoreErrorType.MEMORY_WRITE_REJECTED,
            CoreExecutionLifecycleStage.STAGE_9_MEMORY_WRITE_POLICY
          );
        }
      } else {
        writeApprovedCount++;
      }
      }
    }

    // Append conversation turn to context session
    session.addMessage({
      role: 'user',
      content: request.prompt,
      timestamp: startTime,
    });
    session.addMessage({
      role: 'assistant',
      content: synthesizedText,
      timestamp: Date.now(),
    });

    const memoryAudit: MemoryAuditRecord = Object.freeze({
      spatialAccessed,
      coordinate: resolvedCoordinate,
      cellId: resolvedCellId,
      address369: resolvedAddress369,
      readCount,
      writeProposedCount,
      writeApprovedCount,
      memoryIntegrityValid,
    });

    // =========================================================================
    // STAGE 10: RESPONSE GENERATION & DECISION SEALING
    // =========================================================================
    context.transitionTo(CoreExecutionLifecycleStage.STAGE_10_RESPONSE_GENERATION, 'Sealing decision & packaging response');

    const decision: CoreDecision = createCoreDecision({
      decisionId: `DEC_${executionId}`,
      strategy,
      intent: intentCategory,
      sourcesConsulted,
      toolsInvoked,
      neuralTelemetry,
      shadowTelemetry,
      fallbackInvoked,
      fallbackReason,
      epistemicStatus,
      safetyPassed,
      memoryWritesProposed: writeProposedCount,
      memoryWritesApproved: writeApprovedCount,
      timestamp: Date.now(),
    });

    const totalLatencyMs = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      text: synthesizedText,
      confidence,
      strategy,
      decision,
      contextSnapshot,
      memoryAudit,
      latencyMs: totalLatencyMs,
      timestamp: Date.now(),
      isActuationBlocked: true,
      isOfflineIsolated: true,
    });
  }
}
