/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F29: Chat API Integration — useCubiOIntelligence React Hook
 *
 * Production React hook consuming the CubiOIntelligenceService singleton.
 * Provides stateful access to Chat / Reason / Predict / Inspect modes with:
 * - Automatic loading/error state management
 * - Mode-aware dispatch
 * - Abort-on-unmount safety
 * - Typed results for each interaction mode
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';
import { getIntelligenceService, CubiOIntelligenceService } from './intelligenceService';
import {
  ChatApiStatus,
  InteractionMode,
  UnifiedDispatchResult,
  ChatApiResult,
} from './types';
import {
  IntelligenceChatApiResponse,
  IntelligenceReasonApiResponse,
  IntelligencePredictApiResponse,
  IntelligenceInspectApiResponse,
} from '../api/types';

export interface UseCubiOIntelligenceOptions {
  readonly activeDimension?: CubiODimension;
  readonly activeStateId?: string;
  readonly conversationId?: string;
  readonly harmonic?: Partial<CubiOHarmonic369>;
}

export interface UseCubiOIntelligenceReturn {
  /** Current request lifecycle status */
  readonly status: ChatApiStatus;
  /** Whether a request is in flight */
  readonly isLoading: boolean;
  /** Last successful or failed result */
  readonly lastResult: UnifiedDispatchResult | null;
  /** Last error message, if any */
  readonly lastError: string | null;
  /** Latency of the last completed request */
  readonly latencyMs: number;
  /** The underlying service instance */
  readonly service: CubiOIntelligenceService;

  /**
   * Unified mode-aware dispatch. Send a prompt through the correct backend API
   * based on the provided mode (CHAT, REASONING, PREDICTION, INSPECTION).
   */
  sendMessage: (
    prompt: string,
    mode: InteractionMode,
    options?: {
      baseState?: CubiOState;
      activeDimension?: CubiODimension;
    }
  ) => Promise<UnifiedDispatchResult | null>;

  /** Direct Chat mode call */
  sendChat: (prompt: string, baseState?: CubiOState) => Promise<ChatApiResult<IntelligenceChatApiResponse> | null>;
  /** Direct Reason mode call */
  sendReason: (hypothesis: string, baseState?: CubiOState) => Promise<ChatApiResult<IntelligenceReasonApiResponse> | null>;
  /** Direct Predict mode call */
  sendPredict: (baseState: CubiOState) => Promise<ChatApiResult<IntelligencePredictApiResponse> | null>;
  /** Direct Inspect mode call */
  sendInspect: (stateId?: string) => Promise<ChatApiResult<IntelligenceInspectApiResponse> | null>;
}

export function useCubiOIntelligence(
  options: UseCubiOIntelligenceOptions = {}
): UseCubiOIntelligenceReturn {
  const service = useMemo(() => getIntelligenceService(), []);
  const [status, setStatus] = useState<ChatApiStatus>('IDLE');
  const [lastResult, setLastResult] = useState<UnifiedDispatchResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Abort-on-unmount ref
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Unified Dispatch ──────────────────────────────────────────────

  const sendMessage = useCallback(
    async (
      prompt: string,
      mode: InteractionMode,
      callOptions?: { baseState?: CubiOState; activeDimension?: CubiODimension }
    ): Promise<UnifiedDispatchResult | null> => {
      if (!mountedRef.current) return null;
      setStatus('LOADING');
      setLastError(null);

      const result = await service.dispatch(prompt, mode, {
        activeDimension: callOptions?.activeDimension || options.activeDimension,
        baseState: callOptions?.baseState,
        harmonic: options.harmonic,
        conversationId: options.conversationId,
        activeStateId: options.activeStateId,
      });

      if (!mountedRef.current) return null;

      setLatencyMs(result.latencyMs);
      if (result.success) {
        setStatus('SUCCESS');
        setLastResult(result);
        setLastError(null);
      } else {
        setStatus('ERROR');
        setLastResult(result);
        setLastError(result.error || 'Unknown error');
      }

      return result;
    },
    [service, options.activeDimension, options.harmonic, options.conversationId, options.activeStateId]
  );

  // ─── Direct Mode Calls ─────────────────────────────────────────────

  const sendChat = useCallback(
    async (prompt: string, baseState?: CubiOState) => {
      if (!mountedRef.current) return null;
      setStatus('LOADING');
      setLastError(null);

      const result = await service.chat(prompt, {
        activeDimension: options.activeDimension,
        baseState,
        harmonic: options.harmonic,
        conversationId: options.conversationId,
      });

      if (!mountedRef.current) return null;
      setLatencyMs(result.latencyMs);
      setStatus(result.success ? 'SUCCESS' : 'ERROR');
      setLastResult(result as UnifiedDispatchResult);
      if (!result.success) setLastError(result.error || 'Chat failed');
      return result;
    },
    [service, options.activeDimension, options.harmonic, options.conversationId]
  );

  const sendReason = useCallback(
    async (hypothesis: string, baseState?: CubiOState) => {
      if (!mountedRef.current) return null;
      setStatus('LOADING');
      setLastError(null);

      const result = await service.reason(hypothesis, {
        activeDimension: options.activeDimension,
        baseState,
        harmonic: options.harmonic,
        mode: 'DEDUCTIVE',
      });

      if (!mountedRef.current) return null;
      setLatencyMs(result.latencyMs);
      setStatus(result.success ? 'SUCCESS' : 'ERROR');
      setLastResult(result as UnifiedDispatchResult);
      if (!result.success) setLastError(result.error || 'Reason failed');
      return result;
    },
    [service, options.activeDimension, options.harmonic]
  );

  const sendPredict = useCallback(
    async (baseState: CubiOState) => {
      if (!mountedRef.current) return null;
      setStatus('LOADING');
      setLastError(null);

      const result = await service.predict(baseState, {
        activeDimension: options.activeDimension,
        horizonSteps: 3,
        candidateCountPerStep: 3,
        harmonic: options.harmonic,
      });

      if (!mountedRef.current) return null;
      setLatencyMs(result.latencyMs);
      setStatus(result.success ? 'SUCCESS' : 'ERROR');
      setLastResult(result as UnifiedDispatchResult);
      if (!result.success) setLastError(result.error || 'Predict failed');
      return result;
    },
    [service, options.activeDimension, options.harmonic]
  );

  const sendInspect = useCallback(
    async (stateId?: string) => {
      if (!mountedRef.current) return null;
      setStatus('LOADING');
      setLastError(null);

      const result = await service.inspect({
        stateId: stateId || options.activeStateId,
        activeDimension: options.activeDimension,
        harmonic: options.harmonic,
      });

      if (!mountedRef.current) return null;
      setLatencyMs(result.latencyMs);
      setStatus(result.success ? 'SUCCESS' : 'ERROR');
      setLastResult(result as UnifiedDispatchResult);
      if (!result.success) setLastError(result.error || 'Inspect failed');
      return result;
    },
    [service, options.activeDimension, options.harmonic, options.activeStateId]
  );

  return {
    status,
    isLoading: status === 'LOADING',
    lastResult,
    lastError,
    latencyMs,
    service,
    sendMessage,
    sendChat,
    sendReason,
    sendPredict,
    sendInspect,
  };
}
