/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F2: CubiO Intelligence Input Engine (Types & Contracts)
 *
 * Master specification for multi-modal ingestion, decoding, and normalization:
 * Modalities: TEXT, NUMERIC, IMAGE, AUDIO, GEOMETRY_3D, SENSOR_TELEMETRY, STRUCTURED_DATA.
 *
 * CRITICAL INVARIANTS:
 * - "Every raw input is normalized into a standard CubiOStandardInput envelope."
 * - "Zero entropy loss across deterministic tensor transformations (sigma^2 = 0)."
 * - "Plugs seamlessly into F1 Core Foundation as an IIntelligenceEngine."
 */

import { CubiODimension } from '../../types';

export type InputModality =
  | 'TEXT'
  | 'NUMERIC'
  | 'IMAGE'
  | 'AUDIO'
  | 'GEOMETRY_3D'
  | 'SENSOR_TELEMETRY'
  | 'STRUCTURED_DATA';

export type InputSourceType =
  | 'DIRECT_USER'
  | 'STREAM'
  | 'FILE'
  | 'API_PAYLOAD'
  | 'SENSOR_DEVICE'
  | 'DATABASE_RECORD';

export interface RawInputEnvelope {
  readonly inputId?: string;
  readonly modality: InputModality;
  readonly sourceType: InputSourceType;
  readonly data: any; // Raw payload (string, number[], Uint8Array/Buffer, object, etc.)
  readonly metadata?: Readonly<Record<string, any>>;
  readonly targetDimension?: CubiODimension;
  readonly sovereignCubId?: string;
  readonly timestamp?: number;
}

export interface CubiOStandardInput {
  readonly standardInputId: string;
  readonly modality: InputModality;
  readonly sourceType: InputSourceType;
  readonly normalizedText: string;
  readonly tensorVector: readonly number[];
  readonly spatialDimension: CubiODimension;
  readonly structuredPayload: Readonly<Record<string, any>>;
  readonly rawByteLength: number;
  readonly entropy: number;
  readonly contentHash: string;
  readonly sovereignCubId?: string;
  readonly timestamp: number;
}

export interface InputNormalizationResult {
  readonly isSuccess: boolean;
  readonly standardInput: Readonly<CubiOStandardInput>;
  readonly validationErrors: readonly string[];
  readonly processingTimeMs: number;
}

export interface InputStreamBufferStatus {
  readonly streamId: string;
  readonly modality: InputModality;
  readonly totalIngestedChunks: number;
  readonly totalBytes: number;
  readonly lastChunkTimestamp: number;
  readonly isActive: boolean;
}
