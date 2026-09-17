/**
 * 3D Memory Studio - Funnel 12: Validation & Roundtrip Verification Types
 */

/**
 * Coverage validation details
 */
export interface CoverageReport {
  readonly isValid: boolean;
  readonly expectedTotalCells: number;
  readonly coveredCellsCount: number;
  readonly missingCellsCount: number;
  readonly duplicateCellsCount: number;
  readonly unexpectedCellsCount: number;
  readonly duplicateCellDetails: readonly {
    readonly blockId: number;
    readonly cellId: number;
    readonly occurrencesCount: number;
  }[];
  readonly missingCellDetails: readonly {
    readonly blockId: number;
    readonly cellId: number;
  }[];
  readonly issues: readonly string[];
}

/**
 * Roundtrip equality check comparison result
 */
export interface RoundtripComparisonResult {
  readonly isLossless: boolean;
  readonly originalCellCount: number;
  readonly decodedCellCount: number;
  readonly originalSequenceLength: number;
  readonly decodedSequenceLength: number;
  readonly cellsMatch: boolean;
  readonly coordinatesMatch: boolean;
  readonly symbolsMatch: boolean;
  readonly sequenceIndicesMatch: boolean;
  readonly blocksMatch: boolean;
  readonly statesMatch: boolean;
  readonly mismatches: readonly string[];
  readonly diagnosticSummary: string;
}

/**
 * Specific error codes for failure modes
 */
export type Funnel12ErrorCode =
  | 'INVALID_MAGIC'
  | 'UNSUPPORTED_VERSION'
  | 'EXCEEDS_MAX_DEPTH'
  | 'BUFFER_UNDERFLOW'
  | 'CHECKSUM_MISMATCH'
  | 'UNSUPPORTED_TRANSFORM'
  | 'CROSS_BLOCK_COMPOSITE'
  | 'MISSING_DICT_ENTRY'
  | 'MISSING_COMPOSITE_DEF'
  | 'COORDINATE_OUT_OF_BOUNDS'
  | 'COVERAGE_DUPLICATE_CELL'
  | 'COVERAGE_MISSING_CELL'
  | 'SEQUENCE_COLLISION'
  | 'F11_SELECTION_MISMATCH'
  | 'MALFORMED_RECORD';
