/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F29: Chat API Integration — Intelligence Service Singleton
 *
 * Production-grade service layer wrapping CubiOIntelligenceClient with:
 * - Typed ChatApiResult<T> envelopes for every API call
 * - Request ID generation and latency tracking
 * - Request deduplication (prevents double-submit within configurable window)
 * - Error boundary wrapping (no thrown exceptions reach the UI)
 * - Mode-aware unified dispatch method
 *
 * INVARIANT: This is a singleton — getIntelligenceService() always returns
 * the same instance within the application lifecycle.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOStateFactory } from '../../state/stateEngine';
import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';
import { CubiOIntelligenceClient } from '../api/intelligenceClient';
import { CubiOIntelligenceApiRouter } from '../api/intelligenceApiRouter';
import {
  IntelligenceChatApiResponse,
  IntelligenceReasonApiResponse,
  IntelligencePredictApiResponse,
  IntelligenceInspectApiResponse,
  IntelligenceGenerateApiResponse,
  IntelligenceDecisionApiResponse,
  IntelligenceHealthApiResponse,
  IntelligenceVirtualMemoryApiResponse,
} from '../api/types';
import { OutputModalityType } from '../generation/types';
import {
  ChatApiResult,
  ChatApiRequestMeta,
  IntelligenceServiceConfig,
  InteractionMode,
  UnifiedDispatchResult,
} from './types';

// ─── Internal Helpers ────────────────────────────────────────────────────

function generateRequestId(prompt: string, mode: string): string {
  const hash = deterministicHash(`REQ:${mode}:${prompt}:${Date.now()}`);
  return `REQF29_${hash.slice(2, 14)}`;
}

function wrapSuccess<T>(data: T, requestId: string, mode: InteractionMode, latencyMs: number): ChatApiResult<T> {
  return Object.freeze({
    success: true,
    data,
    requestId,
    mode,
    latencyMs: Math.max(1, latencyMs),
    timestamp: Date.now(),
  });
}

function wrapError<T>(error: string, requestId: string, mode: InteractionMode, latencyMs: number): ChatApiResult<T> {
  return Object.freeze({
    success: false,
    error,
    requestId,
    mode,
    latencyMs: Math.max(1, latencyMs),
    timestamp: Date.now(),
  });
}

// ─── Service Class ───────────────────────────────────────────────────────

export class CubiOIntelligenceService {
  private client: CubiOIntelligenceClient;
  private config: Required<IntelligenceServiceConfig>;
  private lastRequestHash: string = '';
  private lastRequestTimestamp: number = 0;
  private totalRequests: number = 0;
  private failedRequests: number = 0;

  constructor(client?: CubiOIntelligenceClient, config?: IntelligenceServiceConfig) {
    this.client = client || new CubiOIntelligenceClient();
    this.config = {
      deduplicationWindowMs: config?.deduplicationWindowMs ?? 100,
      maxRetries: config?.maxRetries ?? 1,
      defaultDimension: config?.defaultDimension ?? 'D3',
    };
  }

  /**
   * Returns the underlying CubiOIntelligenceClient instance.
   */
  public getClient(): CubiOIntelligenceClient {
    return this.client;
  }

  /**
   * Returns the underlying CubiOIntelligenceApiRouter instance.
   */
  public getRouter(): CubiOIntelligenceApiRouter {
    return this.client.getRouter();
  }

  /**
   * Returns service execution statistics.
   */
  public getServiceStats(): Readonly<{
    totalRequests: number;
    failedRequests: number;
    successRate: number;
  }> {
    return Object.freeze({
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      successRate: this.totalRequests === 0 ? 1.0 : 1.0 - this.failedRequests / this.totalRequests,
    });
  }

  // ─── Deduplication ───────────────────────────────────────────────────

  private isDuplicate(prompt: string, mode: string): boolean {
    const hash = deterministicHash(`DEDUP:${mode}:${prompt}`);
    const now = Date.now();
    if (hash === this.lastRequestHash && now - this.lastRequestTimestamp < this.config.deduplicationWindowMs) {
      return true;
    }
    this.lastRequestHash = hash;
    this.lastRequestTimestamp = now;
    return false;
  }

  // ─── Chat Mode ─────────────────────────────────────────────────────

  public async chat(
    prompt: string,
    options: {
      activeDimension?: CubiODimension;
      baseState?: CubiOState;
      harmonic?: Partial<CubiOHarmonic369>;
      conversationId?: string;
    } = {}
  ): Promise<ChatApiResult<IntelligenceChatApiResponse>> {
    const requestId = generateRequestId(prompt, 'CHAT');
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const response = await this.client.chat({
        prompt,
        activeDimension: options.activeDimension || this.config.defaultDimension,
        baseState: options.baseState,
        harmonic: options.harmonic,
        conversationId: options.conversationId,
      });

      return wrapSuccess(response, requestId, 'CHAT', Date.now() - startTime);
    } catch (err: any) {
      this.failedRequests++;
      return wrapError(err?.message || 'Chat request failed', requestId, 'CHAT', Date.now() - startTime);
    }
  }

  // ─── Reason Mode ──────────────────────────────────────────────────

  public async reason(
    hypothesis: string,
    options: {
      activeDimension?: CubiODimension;
      baseState?: CubiOState;
      states?: readonly CubiOState[];
      harmonic?: Partial<CubiOHarmonic369>;
      mode?: 'DEDUCTIVE' | 'INDUCTIVE' | 'ABDUCTIVE' | 'HARMONIC_369' | 'HYBRID_SPATIAL';
    } = {}
  ): Promise<ChatApiResult<IntelligenceReasonApiResponse>> {
    const requestId = generateRequestId(hypothesis, 'REASONING');
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const response = await this.client.reason({
        hypothesis,
        activeDimension: options.activeDimension || this.config.defaultDimension,
        baseState: options.baseState,
        states: options.states,
        harmonic: options.harmonic,
        mode: options.mode || 'DEDUCTIVE',
      });

      return wrapSuccess(response, requestId, 'REASONING', Date.now() - startTime);
    } catch (err: any) {
      this.failedRequests++;
      return wrapError(err?.message || 'Reason request failed', requestId, 'REASONING', Date.now() - startTime);
    }
  }

  // ─── Predict Mode ─────────────────────────────────────────────────

  public async predict(
    baseState: CubiOState,
    options: {
      activeDimension?: CubiODimension;
      horizonSteps?: number;
      candidateCountPerStep?: number;
      interventions?: readonly string[];
      harmonic?: Partial<CubiOHarmonic369>;
    } = {}
  ): Promise<ChatApiResult<IntelligencePredictApiResponse>> {
    const state =
      baseState ||
      CubiOStateFactory.createState(
        'ST_PRED_DEFAULT',
        [0, 0, 0],
        options.activeDimension || this.config.defaultDimension
      );
    const requestId = generateRequestId(state.id, 'PREDICTION');
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const response = await this.client.predict({
        baseState: state,
        activeDimension: options.activeDimension || this.config.defaultDimension,
        horizonSteps: options.horizonSteps || 3,
        candidateCountPerStep: options.candidateCountPerStep || 3,
        interventions: options.interventions,
        harmonic: options.harmonic,
      });

      return wrapSuccess(response, requestId, 'PREDICTION', Date.now() - startTime);
    } catch (err: any) {
      this.failedRequests++;
      return wrapError(err?.message || 'Predict request failed', requestId, 'PREDICTION', Date.now() - startTime);
    }
  }

  // ─── Inspect Mode ─────────────────────────────────────────────────

  public async inspect(
    options: {
      stateId?: string;
      rawCubioFileContent?: string;
      activeDimension?: CubiODimension;
      harmonic?: Partial<CubiOHarmonic369>;
    } = {}
  ): Promise<ChatApiResult<IntelligenceInspectApiResponse>> {
    const requestId = generateRequestId(options.stateId || 'INSPECT', 'INSPECTION');
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const response = await this.client.inspect({
        stateId: options.stateId,
        rawCubioFileContent: options.rawCubioFileContent,
        activeDimension: options.activeDimension || this.config.defaultDimension,
        harmonic: options.harmonic,
      });

      return wrapSuccess(response, requestId, 'INSPECTION', Date.now() - startTime);
    } catch (err: any) {
      this.failedRequests++;
      return wrapError(err?.message || 'Inspect request failed', requestId, 'INSPECTION', Date.now() - startTime);
    }
  }

  // ─── Generate ─────────────────────────────────────────────────────

  public async generate(
    prompt: string,
    modalities: readonly OutputModalityType[],
    options: {
      activeDimension?: CubiODimension;
      baseState?: CubiOState;
      harmonic?: Partial<CubiOHarmonic369>;
    } = {}
  ): Promise<ChatApiResult<IntelligenceGenerateApiResponse>> {
    const requestId = generateRequestId(prompt, 'GENERATE');
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const response = await this.client.generate({
        prompt,
        modalities,
        activeDimension: options.activeDimension,
        baseState: options.baseState,
        harmonic: options.harmonic,
      });

      return wrapSuccess(response, requestId, 'CHAT', Date.now() - startTime);
    } catch (err: any) {
      this.failedRequests++;
      return wrapError(err?.message || 'Generate request failed', requestId, 'CHAT', Date.now() - startTime);
    }
  }

  // ─── Decision ─────────────────────────────────────────────────────

  public async decide(
    contextPrompt: string,
    options: {
      activeDimension?: CubiODimension;
      currentState?: CubiOState;
      harmonic?: Partial<CubiOHarmonic369>;
    } = {}
  ): Promise<ChatApiResult<IntelligenceDecisionApiResponse>> {
    const requestId = generateRequestId(contextPrompt, 'DECISION');
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const response = await this.client.decide({
        contextPrompt,
        activeDimension: options.activeDimension,
        currentState: options.currentState,
        harmonic: options.harmonic,
      });

      return wrapSuccess(response, requestId, 'CHAT', Date.now() - startTime);
    } catch (err: any) {
      this.failedRequests++;
      return wrapError(err?.message || 'Decision request failed', requestId, 'CHAT', Date.now() - startTime);
    }
  }

  // ─── Health & VM Stats ────────────────────────────────────────────

  public async getHealth(): Promise<ChatApiResult<IntelligenceHealthApiResponse>> {
    const requestId = generateRequestId('HEALTH', 'HEALTH');
    const startTime = Date.now();

    try {
      const response = await this.client.getHealth();
      return wrapSuccess(response, requestId, 'CHAT', Date.now() - startTime);
    } catch (err: any) {
      return wrapError(err?.message || 'Health check failed', requestId, 'CHAT', Date.now() - startTime);
    }
  }

  public async getVmStats(): Promise<ChatApiResult<IntelligenceVirtualMemoryApiResponse>> {
    const requestId = generateRequestId('VM_STATS', 'VM');
    const startTime = Date.now();

    try {
      const response = await this.client.getVirtualMemoryStats();
      return wrapSuccess(response, requestId, 'CHAT', Date.now() - startTime);
    } catch (err: any) {
      return wrapError(err?.message || 'VM stats failed', requestId, 'CHAT', Date.now() - startTime);
    }
  }

  // ─── Unified Mode-Aware Dispatch ──────────────────────────────────

  /**
   * Dispatches a user prompt to the correct backend API based on the active mode.
   * This is the primary entry point used by the React hook.
   */
  public async dispatch(
    prompt: string,
    mode: InteractionMode,
    options: {
      activeDimension?: CubiODimension;
      baseState?: CubiOState;
      harmonic?: Partial<CubiOHarmonic369>;
      conversationId?: string;
      activeStateId?: string;
    } = {}
  ): Promise<UnifiedDispatchResult> {
    // Deduplication guard
    if (this.isDuplicate(prompt, mode)) {
      const requestId = generateRequestId(prompt, mode);
      return wrapError('Duplicate request detected within deduplication window', requestId, mode, 0);
    }

    const dim = options.activeDimension || this.config.defaultDimension;
    const baseState = options.baseState || CubiOStateFactory.createState(
      options.activeStateId || 'ST_DISPATCH_DEFAULT',
      [0, 0, 0],
      dim,
      { mode, flux: options.harmonic?.harmonicFlux ?? 0.963 }
    );

    switch (mode) {
      case 'CHAT':
        return this.chat(prompt, {
          activeDimension: dim,
          baseState,
          harmonic: options.harmonic,
          conversationId: options.conversationId,
        });

      case 'REASONING':
        return this.reason(prompt, {
          activeDimension: dim,
          baseState,
          harmonic: options.harmonic,
          mode: 'DEDUCTIVE',
        });

      case 'PREDICTION':
        return this.predict(baseState, {
          activeDimension: dim,
          horizonSteps: 3,
          candidateCountPerStep: 3,
          harmonic: options.harmonic,
        });

      case 'INSPECTION':
        return this.inspect({
          stateId: options.activeStateId || baseState.id,
          activeDimension: dim,
          harmonic: options.harmonic,
        });

      default:
        return this.chat(prompt, {
          activeDimension: dim,
          baseState,
          harmonic: options.harmonic,
          conversationId: options.conversationId,
        });
    }
  }
}

// ─── Singleton Accessor ──────────────────────────────────────────────────

let _singletonService: CubiOIntelligenceService | null = null;

/**
 * Returns the application-wide singleton CubiOIntelligenceService instance.
 * The singleton is lazily created on first access.
 */
export function getIntelligenceService(config?: IntelligenceServiceConfig): CubiOIntelligenceService {
  if (!_singletonService) {
    _singletonService = new CubiOIntelligenceService(undefined, config);
  }
  return _singletonService;
}

/**
 * Resets the singleton (useful for testing). Not for production use.
 */
export function resetIntelligenceServiceSingleton(): void {
  _singletonService = null;
}
