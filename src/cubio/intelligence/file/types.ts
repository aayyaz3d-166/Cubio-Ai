/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F15: CubiO Intelligence File Engine (Types & Contracts)
 *
 * Master specification for .cubio file format container, state serialization,
 * forensic inspection, and intelligence pipeline ingestion.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { Harmonic369StateEnvelope } from '../encoder_369/types';
import { DetectedPatternEntry } from '../pattern/types';
import { AssociativeMemoryNode } from '../memory/types';

export interface CubiOFileHeader {
  readonly magic: 'CUBIO_V1';
  readonly protocolVersion: '1.0.0';
  readonly createdAt: number;
  readonly sourceSystem: string;
  readonly sovereignCubId?: string;
  readonly primaryDimension: CubiODimension;
  readonly harmonicFrequencyHz: number;
  readonly headerChecksum: string;
}

export interface CubiOFilePayload {
  readonly states: readonly CubiOState[];
  readonly patterns?: readonly DetectedPatternEntry[];
  readonly memories?: readonly AssociativeMemoryNode[];
  readonly harmonicEnvelopes?: readonly Harmonic369StateEnvelope[];
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface CubiOFileContainer {
  readonly header: CubiOFileHeader;
  readonly payload: CubiOFilePayload;
  readonly fileChecksum: string;
}

export interface CubiOFileInspectionReport {
  readonly isValid: boolean;
  readonly fileSizeRawBytes: number;
  readonly header: CubiOFileHeader;
  readonly totalStatesCount: number;
  readonly totalPatternsCount: number;
  readonly totalMemoriesCount: number;
  readonly activeDimensions: readonly CubiODimension[];
  readonly digitalRoot369: number;
  readonly isTamperEvident: boolean;
  readonly integrityHash: string;
}

export interface CubiOFileLoadResult {
  readonly success: boolean;
  readonly loadedStatesCount: number;
  readonly loadedPatternsCount: number;
  readonly loadedMemoriesCount: number;
  readonly ingestedStateIds: readonly string[];
  readonly fileId: string;
  readonly loadDurationMs: number;
  readonly loadChecksum: string;
}
