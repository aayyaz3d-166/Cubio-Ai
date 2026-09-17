/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F27: CubiO Intelligence Multimodal Chat Router (Types & Contracts)
 *
 * Master specification for multi-modal stream identification,
 * dynamic pipeline selection, cross-modal tensor fusion, and unified conversation responses.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { EngineCapability, IntelligenceContextEnvelope } from '../core/types';

export type ModalitySignature =
  | 'TEXT_ONLY'
  | 'IMAGE_ONLY'
  | 'IMAGE_TEXT'
  | 'AUDIO_ONLY'
  | 'AUDIO_TEXT'
  | 'MULTIMODAL_HYBRID';

export type MultimodalPipelineType =
  | 'TEXT_REASONING_PIPELINE'
  | 'VISION_SPATIAL_PIPELINE'
  | 'ACOUSTIC_RESONANCE_PIPELINE'
  | 'UNIFIED_CROSS_MODAL_PIPELINE';

export interface DetectedModalities {
  readonly hasText: boolean;
  readonly hasImage: boolean;
  readonly hasAudio: boolean;
  readonly has3DGeometry: boolean;
  readonly modalitySignature: ModalitySignature;
}

export interface MultimodalInputPayload {
  readonly text?: string;
  readonly imageUrl?: string;
  readonly imageDataBase64?: string;
  readonly audioUrl?: string;
  readonly audioFrequencyHz?: number;
  readonly audioSample?: readonly number[];
  readonly meshData?: {
    readonly vertices: readonly (readonly number[])[];
    readonly meshId?: string;
  };
  readonly activeDimension?: CubiODimension;
  readonly sovereignCubId?: string;
}

export interface MultimodalPipelineStage {
  readonly stageIndex: number;
  readonly engineId: string;
  readonly capability: EngineCapability;
  readonly description: string;
}

export interface MultimodalPipelineRouting {
  readonly routingId: string;
  readonly detectedModalities: DetectedModalities;
  readonly selectedPipeline: MultimodalPipelineType;
  readonly pipelineStages: readonly MultimodalPipelineStage[];
  readonly fusedEnvelope: IntelligenceContextEnvelope;
  readonly routingChecksum: string;
}

export interface UnifiedMultimodalResponse {
  readonly responseId: string;
  readonly textResponse: string;
  readonly visualArtifact?: {
    readonly type: 'SVG' | 'IMAGE_URL';
    readonly content: string;
  };
  readonly audioArtifact?: {
    readonly frequencyHz: number;
    readonly solfeggioNote: string;
    readonly durationMs: number;
  };
  readonly spatialStateArtifact?: Partial<CubiOState>;
  readonly modalitySignature: ModalitySignature;
  readonly resonanceScore: number;
  readonly confidence: number;
  readonly checksum: string;
}
