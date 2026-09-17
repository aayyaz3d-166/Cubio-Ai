/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F13: CubiO Intelligence Multimodal Engine (Types & Contracts)
 *
 * Master specification for multi-modal perception, cross-modal tensor fusion,
 * Solfeggio acoustic attunement, visual-spatial binding, and unified common state representation.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { ImageGenerationDescriptor, AudioResonanceOutput } from '../types';

export type ModalityChannel =
  | 'TEXT_CHAT'
  | 'IMAGE_VISION'
  | 'AUDIO_ACOUSTIC'
  | 'GEOMETRY_3D'
  | 'STRUCTURED_DATA';

export interface ModalityFeatureVector {
  readonly channel: ModalityChannel;
  readonly featureTensor: readonly number[];
  readonly dimension: CubiODimension;
  readonly rawSummary: string;
  readonly resonanceScore: number; // 0 .. 100
  readonly confidence: number; // 0.0 .. 1.0
  readonly channelChecksum: string;
}

export interface CrossModalFusionRequest {
  readonly fusionId?: string;
  readonly textChat?: {
    readonly prompt: string;
    readonly userIntent?: string;
    readonly conversationContext?: readonly string[];
  };
  readonly imageVision?: {
    readonly imageUrl?: string;
    readonly width?: number;
    readonly height?: number;
    readonly colorHistogram?: readonly number[];
    readonly detectedObjects?: readonly string[];
    readonly spatialBounds?: readonly number[];
  };
  readonly audioAcoustic?: {
    readonly frequencyHz?: number;
    readonly solfeggioNote?: string;
    readonly waveformSample?: readonly number[];
    readonly durationMs?: number;
  };
  readonly geometry3D?: {
    readonly vertices?: readonly (readonly number[])[];
    readonly centroid?: readonly number[];
    readonly meshId?: string;
  };
  readonly structuredData?: Readonly<Record<string, any>>;
  readonly targetDimension?: CubiODimension;
  readonly sovereignCubId?: string;
}

export interface MultimodalUnifiedState {
  readonly unifiedStateId: string;
  readonly canonicalState: CubiOState;
  readonly activeChannels: readonly ModalityChannel[];
  readonly channelFeatures: Readonly<Partial<Record<ModalityChannel, ModalityFeatureVector>>>;
  readonly crossModalCoherence: number; // 0.0 .. 1.0
  readonly overallResonanceScore: number; // 0 .. 100
  readonly fusedTensor: readonly number[];
  readonly semanticDescription: string;
  readonly unifiedStateChecksum: string;
  readonly timestamp: number;
}

export interface MultimodalSynthesisReport {
  readonly synthesisId: string;
  readonly unifiedState: MultimodalUnifiedState;
  readonly chatResponse: string;
  readonly imageDescriptor?: ImageGenerationDescriptor;
  readonly audioResonance?: AudioResonanceOutput;
  readonly synthesisDurationMs: number;
  readonly synthesisChecksum: string;
  readonly timestamp: number;
}
