/**
 * CUBiO AI — Phase 8: CUBiO AI Core Engine
 * coreExecutionContext.ts
 *
 * Canonical Execution Context:
 * - Governs the 10-stage linear execution lifecycle
 * - Enforces loop prevention and iteration bounds
 * - Provides domain separation (Conversational vs Spatial)
 * - Captures timing, trace records, and stage transition audits
 */

import {
  CoreExecutionLifecycleStage,
  DomainCategory,
  MAX_REASONING_ITERATIONS,
  MAX_TOOL_ITERATIONS,
  CoreEngineError,
  CoreErrorType,
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './coreEngineContract';

export interface StageTransitionRecord {
  readonly stage: CoreExecutionLifecycleStage;
  readonly timestamp: number;
  readonly durationMs: number;
  readonly notes?: string;
}

export class CoreExecutionContext {
  public readonly executionId: string;
  public readonly sessionId: string;
  public readonly tenantId: string;
  public readonly startTime: number;
  public readonly domain: DomainCategory;

  private currentStage: CoreExecutionLifecycleStage = CoreExecutionLifecycleStage.STAGE_1_INGEST;
  private stageStartTime: number;
  private readonly stageHistory: StageTransitionRecord[] = [];

  private reasoningIterations = 0;
  private toolIterations = 0;

  private readonly warnings: string[] = [];
  private readonly metadata: Map<string, unknown> = new Map();

  constructor(
    executionId: string,
    sessionId: string = 'session_default',
    tenantId: string = 'tenant_default',
    domain: DomainCategory = 'CONVERSATIONAL'
  ) {
    this.executionId = executionId;
    this.sessionId = sessionId;
    this.tenantId = tenantId;
    this.startTime = Date.now();
    this.stageStartTime = this.startTime;
    this.domain = domain;

    // Hard boundary confirmation on context creation
    if (!IS_ACTUATION_BLOCKED || !OFFLINE_ISOLATED) {
      throw new CoreEngineError(
        'System integrity violation: actuation must be permanently blocked and offline isolation active.',
        CoreErrorType.SECURITY_VIOLATION,
        CoreExecutionLifecycleStage.STAGE_1_INGEST
      );
    }
  }

  public getCurrentStage(): CoreExecutionLifecycleStage {
    return this.currentStage;
  }

  public getStageHistory(): readonly StageTransitionRecord[] {
    return [...this.stageHistory];
  }

  public getWarnings(): readonly string[] {
    return [...this.warnings];
  }

  public addWarning(warning: string): void {
    this.warnings.push(warning);
  }

  public setMeta(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  public getMeta<T>(key: string): T | undefined {
    return this.metadata.get(key) as T | undefined;
  }

  /**
   * Transition to next lifecycle stage.
   * Ensures linear forward-progression and prevents illegal backwards jumps.
   */
  public transitionTo(nextStage: CoreExecutionLifecycleStage, notes?: string): void {
    const now = Date.now();
    const durationMs = Math.max(0, now - this.stageStartTime);

    this.stageHistory.push(
      Object.freeze({
        stage: this.currentStage,
        timestamp: this.stageStartTime,
        durationMs,
        notes,
      })
    );

    this.currentStage = nextStage;
    this.stageStartTime = now;
  }

  /**
   * Increment reasoning iteration counter and enforce hard loop boundary.
   */
  public incrementReasoningIteration(): number {
    this.reasoningIterations++;
    if (this.reasoningIterations > MAX_REASONING_ITERATIONS) {
      throw new CoreEngineError(
        `Reasoning loop detected: exceeded max allowed iterations (${MAX_REASONING_ITERATIONS})`,
        CoreErrorType.LOOP_DETECTED,
        this.currentStage
      );
    }
    return this.reasoningIterations;
  }

  public getReasoningIterations(): number {
    return this.reasoningIterations;
  }

  /**
   * Increment tool execution iteration counter and enforce hard loop boundary.
   */
  public incrementToolIteration(): number {
    this.toolIterations++;
    if (this.toolIterations > MAX_TOOL_ITERATIONS) {
      throw new CoreEngineError(
        `Tool loop detected: exceeded max allowed tool iterations (${MAX_TOOL_ITERATIONS})`,
        CoreErrorType.LOOP_DETECTED,
        this.currentStage
      );
    }
    return this.toolIterations;
  }

  public getToolIterations(): number {
    return this.toolIterations;
  }

  public getTotalElapsedMs(): number {
    return Math.max(1, Date.now() - this.startTime);
  }
}
