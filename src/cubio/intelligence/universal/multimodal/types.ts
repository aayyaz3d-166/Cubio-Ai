/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F48: Multimodal Intelligence Layer Types
 *
 * Core contracts for representing Text, Image, Audio, Video, and 3D Geometry
 * into a unified canonical CubiO Common Multimodal State across D0-D8+.
 */

import { CubiODimension } from '../../../types';
import { DimensionalStateLevel } from '../universalTypes';

export type UniversalInputModality =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'GEOMETRY_3D'
  | 'STRUCTURED';

export interface TextInputPayload {
  readonly text: string;
  readonly language?: string;
  readonly tokens?: readonly string[];
  readonly sentiment?: number;
}

export interface ImageInputPayload {
  readonly imageData?: Uint8Array;
  readonly imageUrl?: string;
  readonly mimeType?: string;
  readonly width?: number;
  readonly height?: number;
  readonly colorHistogram?: readonly number[];
  readonly detectedObjects?: readonly string[];
  readonly spatialBounds?: readonly [number, number, number, number]; // [minX, minY, maxX, maxY]
  readonly depthMap?: readonly number[];
}

export interface AudioInputPayload {
  readonly audioData?: Uint8Array;
  readonly audioUrl?: string;
  readonly mimeType?: string;
  readonly sampleRate?: number;
  readonly channels?: number;
  readonly durationMs?: number;
  readonly frequencyHz?: number;
  readonly solfeggioNote?: string;
  readonly waveformSample?: readonly number[];
  readonly spectralEnergy?: number;
}

export interface VideoKeyframe {
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly width: number;
  readonly height: number;
  readonly frameData?: Uint8Array;
  readonly visualFeatures: readonly number[];
  readonly detectedEntities?: readonly string[];
}

export interface VideoMotionVector {
  readonly sourceFrame: number;
  readonly targetFrame: number;
  readonly dx: number;
  readonly dy: number;
  readonly magnitude: number;
}

export interface VideoInputPayload {
  readonly videoData?: Uint8Array;
  readonly videoUrl?: string;
  readonly mimeType?: string;
  readonly durationMs: number;
  readonly frameRate: number;
  readonly totalFrames: number;
  readonly width?: number;
  readonly height?: number;
  readonly keyframes?: readonly VideoKeyframe[];
  readonly motionVectors?: readonly VideoMotionVector[];
  readonly audioTrack?: AudioInputPayload;
}

export interface GeometryInputPayload {
  readonly meshId?: string;
  readonly vertices: readonly (readonly [number, number, number])[];
  readonly faces?: readonly (readonly [number, number, number])[];
  readonly centroid?: readonly [number, number, number];
  readonly boundingBox?: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
  readonly eulerCharacteristic?: number;
  readonly manifoldType?: string;
}

export interface MultimodalInputBundle {
  readonly bundleId: string;
  readonly text?: TextInputPayload;
  readonly image?: ImageInputPayload;
  readonly audio?: AudioInputPayload;
  readonly video?: VideoInputPayload;
  readonly geometry?: GeometryInputPayload;
  readonly structuredData?: Readonly<Record<string, unknown>>;
  readonly targetDimension?: CubiODimension;
  readonly timestamp: number;
}

export interface ModalityFeatureTensor {
  readonly modality: UniversalInputModality;
  readonly tensor: readonly number[];
  readonly rawSummary: string;
  readonly energy: number;
  readonly confidence: number;
  readonly checksum: string;
}

export interface SpatiotemporalTrajectory {
  readonly horizons: readonly (readonly [number, number, number, number])[]; // [x, y, z, t]
  readonly velocityVector: readonly [number, number, number];
  readonly accelerationVector: readonly [number, number, number];
  readonly temporalSpanMs: number;
}

export interface CubiOCommonMultimodalState {
  readonly commonStateId: string;
  readonly activeModalities: readonly UniversalInputModality[];
  readonly modalityFeatures: Readonly<Partial<Record<UniversalInputModality, ModalityFeatureTensor>>>;
  readonly fusedTensor: readonly number[];
  readonly crossModalCoherence: number; // 0.0 .. 1.0
  readonly overallResonanceScore: number; // 0 .. 100
  readonly spatialCoordinates: readonly [number, number, number];
  readonly spatiotemporalTrajectory?: SpatiotemporalTrajectory;
  readonly targetDimension: CubiODimension;
  readonly dimensionalLevel: DimensionalStateLevel;
  readonly semanticDescription: string;
  readonly stateChecksum: string;
  readonly timestamp: number;
}
