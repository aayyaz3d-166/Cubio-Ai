/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F14: CubiO Intelligence Generation Engine (Types & Contracts)
 *
 * Master specification for multi-modal generative output synthesis:
 * Text/Dialogue, Holographic Visuals, Solfeggio Acoustic Audio, and 3D/4D Geometry.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { ImageGenerationDescriptor, AudioResonanceOutput } from '../types';

export type OutputModalityType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'GEOMETRY';

export interface GeneratedTextArtifact {
  readonly artifactId: string;
  readonly content: string;
  readonly wordCount: number;
  readonly tokenEstimate: number;
  readonly groundedStateId?: string;
  readonly dimension: CubiODimension;
  readonly confidence: number;
  readonly checksum: string;
}

export interface GeneratedImageArtifact {
  readonly artifactId: string;
  readonly descriptor: ImageGenerationDescriptor;
  readonly svgMarkup: string;
  readonly width: number;
  readonly height: number;
  readonly renderStyle: 'HOLOGRAPHIC_CYBER' | 'VOID_TESSERACT' | 'VOLUMETRIC_REALITY';
  readonly dimension: CubiODimension;
  readonly checksum: string;
}

export interface GeneratedAudioArtifact {
  readonly artifactId: string;
  readonly resonanceOutput: AudioResonanceOutput;
  readonly waveformSamples: readonly number[];
  readonly solfeggioHz: number;
  readonly durationMs: number;
  readonly sampleRate: number;
  readonly checksum: string;
}

export interface GeneratedGeometryArtifact {
  readonly artifactId: string;
  readonly geometryType: 'TESSERACT_4D' | 'VORTEX_TORUS_3D' | 'HARMONIC_LATTICE' | 'HYPERCUBE';
  readonly vertices: readonly (readonly number[])[];
  readonly edges: readonly (readonly [number, number])[];
  readonly faces?: readonly (readonly number[])[];
  readonly centroid: readonly number[];
  readonly dimension: CubiODimension;
  readonly checksum: string;
}

export interface GenerationRequest {
  readonly prompt: string;
  readonly targetOutputs?: readonly OutputModalityType[];
  readonly baseState?: CubiOState;
  readonly targetDimension?: CubiODimension;
  readonly harmonicFrequencyHz?: number;
  readonly renderResolution?: { readonly width: number; readonly height: number };
  readonly sovereignCubId?: string;
}

export interface GeneratedArtifactManifest {
  readonly manifestId: string;
  readonly prompt: string;
  readonly targetDimension: CubiODimension;
  readonly baseStateId?: string;
  readonly textArtifact?: GeneratedTextArtifact;
  readonly imageArtifact?: GeneratedImageArtifact;
  readonly audioArtifact?: GeneratedAudioArtifact;
  readonly geometryArtifact?: GeneratedGeometryArtifact;
  readonly overallConfidence: number; // 0.0 .. 1.0
  readonly overallResonanceScore: number; // 0 .. 100
  readonly generationDurationMs: number;
  readonly manifestChecksum: string;
  readonly timestamp: number;
}
