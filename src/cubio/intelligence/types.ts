/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 9: CubiO Intelligence Engine Types
 *
 * Formal specification for Multi-Modal Spatial AI:
 * Ingestion: Context -> Memory -> 369 State -> Dimension State -> LLM -> Reasoning -> Output.
 * Capabilities: Chat, Image, Audio, Reasoning, Memory, Planning, Prediction.
 */

import { CubiODimension } from '../types';
import { CubiOState } from '../state/types';
import { CubiOHarmonic369, CubiOMemoryNode } from '../types';

export type { CubiODimension };

export type CubiOAIModality =
  | 'CHAT'
  | 'IMAGE'
  | 'AUDIO'
  | 'REASONING'
  | 'MEMORY'
  | 'PLANNING'
  | 'PREDICTION';

export interface ReasoningStep {
  readonly stepIndex: number;
  readonly claim: string;
  readonly evidence: string;
  readonly dimension: CubiODimension;
  readonly confidence: number; // [0..1]
  readonly resonanceScore: number; // [0..100]
}

export interface SpatialPlanTask {
  readonly taskId: string;
  readonly title: string;
  readonly actionType: 'ELEVATE_DIMENSION' | 'PROJECT_DIMENSION' | 'MUTATE_STATE' | 'QUERY_MEMORY' | 'RESOLVE_SUPERPOSITION' | 'SYNTHESIZE_HARMONIC';
  readonly targetStateId?: string;
  readonly targetDimension?: CubiODimension;
  readonly dependencies: readonly string[];
  readonly estimatedCost: number;
}

export interface SpatialPlan {
  readonly planId: string;
  readonly goal: string;
  readonly tasks: readonly SpatialPlanTask[];
  readonly totalSteps: number;
  readonly estimatedDurationMs: number;
  readonly planChecksum: string;
}

export interface SpatialPrediction {
  readonly predictionId: string;
  readonly baseStateId: string;
  readonly timeHorizonMs: number;
  readonly forecastDimension: CubiODimension;
  readonly forecastedTrajectory: readonly (readonly number[])[];
  readonly riskFactor: number; // [0..1]
  readonly confidence: number; // [0..1]
  readonly predictionEntropy: number;
  readonly predictionChecksum: string;
}

export interface AudioResonanceOutput {
  readonly audioId: string;
  readonly fundamentalFrequencyHz: number;
  readonly harmonicFrequencies: readonly number[];
  readonly waveform: 'SINE' | 'TRIADIC_VORTEX' | 'SOLFEGGIO_369';
  readonly durationMs: number;
  readonly sampleRate: number;
  readonly acousticFluxScore: number;
}

export interface ImageGenerationDescriptor {
  readonly imageId: string;
  readonly prompt: string;
  readonly spatialDimension: CubiODimension;
  readonly cameraPerspective: readonly number[];
  readonly renderStyle: 'HOLOGRAPHIC_CYBER' | 'VOID_TESSERACT' | 'VOLUMETRIC_REALITY';
  readonly resolution: string;
  readonly promptChecksum: string;
}

export interface CubiOIntelligenceContext {
  readonly queryPrompt: string;
  readonly activeDimension: CubiODimension;
  readonly activeState?: CubiOState;
  readonly memoryContext?: readonly CubiOMemoryNode[];
  readonly harmonic: CubiOHarmonic369;
  readonly modality: CubiOAIModality;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly sessionId?: string;
}

export interface CubiOIntelligenceResponse {
  readonly responseId: string;
  readonly modality: CubiOAIModality;
  readonly prompt: string;
  readonly textOutput: string;
  readonly reasoningSteps: readonly ReasoningStep[];
  readonly plan?: SpatialPlan;
  readonly prediction?: SpatialPrediction;
  readonly audio?: AudioResonanceOutput;
  readonly image?: ImageGenerationDescriptor;
  readonly confidence: number;
  readonly resonanceScore: number;
  readonly executionTimeMs: number;
  readonly responseChecksum: string;
  readonly timestamp: number;
}
