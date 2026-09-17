/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F26: CubiO Intelligence Model Bridge (Types & Contracts)
 *
 * Master specification for connecting CubiO spatial 369/dimension architecture to LLM/model layers,
 * with deterministic spatial grounding, harmonic conditioning, and fault-tolerant failover.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';

export type ModelProviderType =
  | 'DETERMINISTIC_SPATIAL'
  | 'OPENAI_COMPATIBLE'
  | 'ANTHROPIC'
  | 'GEMINI'
  | 'OLLAMA_LOCAL'
  | 'CUSTOM_ADAPTER';

export interface ModelBridgeConfig {
  readonly provider: ModelProviderType;
  readonly modelName: string;
  readonly apiKey?: string;
  readonly endpointUrl?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly harmonicConditioning: boolean;
  readonly fallbackToSpatial: boolean;
}

export interface SpatialModelPromptEnvelope {
  readonly userPrompt: string;
  readonly systemInstruction: string;
  readonly activeDimension: CubiODimension;
  readonly spatialCoordinates: readonly number[];
  readonly vortexState369: number;
  readonly harmonicFlux: number;
  readonly resonanceScore: number;
  readonly activeEntities: readonly string[];
  readonly promptChecksum: string;
}

export interface ModelBridgeExecutionResult {
  readonly bridgeResultId: string;
  readonly providerUsed: ModelProviderType;
  readonly modelName: string;
  readonly rawModelResponse: string;
  readonly decodedSpatialState?: Partial<CubiOState>;
  readonly extractedReasoningSteps: readonly any[];
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
  readonly latencyMs: number;
  readonly resonanceScore: number;
  readonly fallbackTriggered: boolean;
  readonly bridgeChecksum: string;
}
