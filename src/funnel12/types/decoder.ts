/**
 * 3D Memory Studio - Funnel 12: Independent Decoder Types
 */

import { Coordinate3D } from '../../types/memory';
import { CoverageReport } from './validation';

/**
 * A fully reconstructed cell produced by the independent decoder
 */
export interface DecodedCell {
  readonly blockId: number;
  readonly cellId: number; // 0..342
  readonly x: number; // 0..6
  readonly y: number; // 0..6
  readonly z: number; // 0..6
  readonly coordinate: Coordinate3D;
  readonly symbol: string;
  readonly sequenceIndex: number;
  readonly state: number; // 1 = active
  readonly level: number; // 0=RAW, 1=Primitive, 2=Dict, 3=Composite
  readonly sourceOriginId?: number;
  readonly compositeId?: number;
  readonly dictId?: number;
}

/**
 * A reconstructed memory block
 */
export interface DecodedBlock {
  readonly blockId: number;
  readonly activeCells: readonly DecodedCell[];
  readonly cellCount: number;
}

/**
 * Complete reconstructed memory state
 */
export interface DecodedMemory {
  readonly blocks: readonly DecodedBlock[];
  readonly allCells: readonly DecodedCell[];
  readonly sequence: readonly {
    readonly step: number;
    readonly blockId: number;
    readonly cellId: number;
    readonly symbol: string;
    readonly coordinate: Coordinate3D;
  }[];
  readonly totalCellsCount: number;
  readonly totalSequenceSteps: number;
}

/**
 * Result of the independent decoding process
 */
export interface DecodeResult {
  readonly success: boolean;
  readonly decodedMemory: DecodedMemory | null;
  readonly checksumValid: boolean;
  readonly calculatedChecksumHex: string;
  readonly expectedChecksumHex: string;
  readonly coverageReport: CoverageReport;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly decodeTimeMs: number;
  readonly counts: {
    readonly blocks: number;
    readonly dictEntries: number;
    readonly compositeDefs: number;
    readonly compositeRefs: number;
    readonly primitiveRecords: number;
    readonly rawCells: number;
    readonly totalReconstructedCells: number;
  };
}
