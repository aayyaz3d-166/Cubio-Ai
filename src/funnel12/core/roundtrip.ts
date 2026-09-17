/**
 * 3D Memory Studio - Funnel 12: Exact Roundtrip Verification Engine
 * 
 * Pipeline:
 * Original Memory + Funnel 11 Selected Selection
 *       ↓
 * Funnel 12 Encoder (compact3d-v4)
 *       ↓
 * Binary Artifact (Uint8Array)
 *       ↓
 * Independent Decoder
 *       ↓
 * Reconstructed Memory
 *       ↓
 * Field-by-Field Lossless Comparison
 */

import { MemoryBlock, MemoryCell, RootMemory } from '../../types/memory';
import { CompositeSelectionResult } from '../../funnel11/types/selection';
import { Compact3DArtifactV4 } from '../types/artifact';
import { DecodedMemory, DecodeResult } from '../types/decoder';
import { F12DictionaryEntry, F12PrimitiveRecord, F12RawCellRecord } from '../types/records';
import { RoundtripComparisonResult } from '../types/validation';
import { decodeCompact3DV4 } from './decoder';
import { encodeHierarchyCompact3DV4, EncoderInputData } from './encoder';

export interface RoundtripTestResult {
  readonly success: boolean;
  readonly artifact: Compact3DArtifactV4;
  readonly decodeResult: DecodeResult;
  readonly comparison: RoundtripComparisonResult;
  readonly durationMs: number;
}

/**
 * Compares an original set of memory cells with reconstructed decoded memory.
 */
export function compareOriginalWithDecoded(
  originalCells: readonly MemoryCell[],
  decodedMemory: DecodedMemory | null
): RoundtripComparisonResult {
  if (!decodedMemory) {
    return {
      isLossless: false,
      originalCellCount: originalCells.length,
      decodedCellCount: 0,
      originalSequenceLength: originalCells.length,
      decodedSequenceLength: 0,
      cellsMatch: false,
      coordinatesMatch: false,
      symbolsMatch: false,
      sequenceIndicesMatch: false,
      blocksMatch: false,
      statesMatch: false,
      mismatches: ['Decoded memory is null'],
      diagnosticSummary: 'FAILURE: Decoded memory is null',
    };
  }

  const mismatches: string[] = [];

  // 1. Cell Count Check
  const cellCountMatch = originalCells.length === decodedMemory.totalCellsCount;
  if (!cellCountMatch) {
    mismatches.push(`Cell count mismatch: original (${originalCells.length}) !== decoded (${decodedMemory.totalCellsCount})`);
  }

  // 2. Build fast lookup maps by `${blockId}:${cellId}`
  const originalMap = new Map<string, MemoryCell>();
  for (const cell of originalCells) {
    originalMap.set(`${cell.blockId}:${cell.id}`, cell);
  }

  let coordinatesMatch = true;
  let symbolsMatch = true;
  let blocksMatch = true;
  let statesMatch = true;

  for (const decCell of decodedMemory.allCells) {
    const key = `${decCell.blockId}:${decCell.cellId}`;
    const orig = originalMap.get(key);
    if (!orig) {
      mismatches.push(`Decoded cell ${key} does not exist in original memory`);
      coordinatesMatch = false;
      continue;
    }

    if (orig.x !== decCell.x || orig.y !== decCell.y || orig.z !== decCell.z) {
      mismatches.push(`Coordinate mismatch for ${key}: orig (${orig.x},${orig.y},${orig.z}) vs decoded (${decCell.x},${decCell.y},${decCell.z})`);
      coordinatesMatch = false;
    }

    if (orig.symbol && orig.symbol !== decCell.symbol) {
      mismatches.push(`Symbol mismatch for ${key}: orig '${orig.symbol}' vs decoded '${decCell.symbol}'`);
      symbolsMatch = false;
    }

    if (orig.blockId !== decCell.blockId) {
      mismatches.push(`BlockId mismatch for ${key}: orig ${orig.blockId} vs decoded ${decCell.blockId}`);
      blocksMatch = false;
    }
  }

  // 3. Sequence Step Order Check
  let sequenceIndicesMatch = true;
  const origSequenceSteps: { step: number; symbol: string; blockId: number; cellId: number }[] = [];
  for (const c of originalCells) {
    const step = c.stepIndices && c.stepIndices.length > 0 ? c.stepIndices[0] : 0;
    origSequenceSteps.push({
      step,
      symbol: c.symbol || 'A',
      blockId: c.blockId,
      cellId: c.id,
    });
  }
  origSequenceSteps.sort((a, b) => a.step - b.step);

  const decSequenceSteps = decodedMemory.sequence;
  if (origSequenceSteps.length !== decSequenceSteps.length) {
    mismatches.push(`Sequence length mismatch: ${origSequenceSteps.length} vs ${decSequenceSteps.length}`);
    sequenceIndicesMatch = false;
  } else {
    for (let i = 0; i < origSequenceSteps.length; i++) {
      const origS = origSequenceSteps[i];
      const decS = decSequenceSteps[i];
      if (origS.symbol !== decS.symbol) {
        mismatches.push(`Sequence step ${i} token mismatch: '${origS.symbol}' vs '${decS.symbol}'`);
        sequenceIndicesMatch = false;
        break;
      }
    }
  }

  const isLossless = (
    cellCountMatch &&
    coordinatesMatch &&
    symbolsMatch &&
    blocksMatch &&
    statesMatch &&
    mismatches.length === 0
  );

  const diagnosticSummary = isLossless
    ? `SUCCESS: 100% Lossless Roundtrip across ${originalCells.length} cells and ${origSequenceSteps.length} sequence steps.`
    : `FAILURE: ${mismatches.length} mismatches detected.`;

  return {
    isLossless,
    originalCellCount: originalCells.length,
    decodedCellCount: decodedMemory.totalCellsCount,
    originalSequenceLength: origSequenceSteps.length,
    decodedSequenceLength: decSequenceSteps.length,
    cellsMatch: cellCountMatch,
    coordinatesMatch,
    symbolsMatch,
    sequenceIndicesMatch,
    blocksMatch,
    statesMatch,
    mismatches,
    diagnosticSummary,
  };
}

/**
 * Runs a complete end-to-end roundtrip test:
 * Original Memory -> Encode compact3d-v4 -> Independent Decode -> Exact Validation
 */
export function runRoundtripTest(input: EncoderInputData): RoundtripTestResult {
  const startTime = performance.now();

  // 1. Extract original active cells
  const blocks = Array.isArray(input.memory) ? input.memory : (input.memory as RootMemory).blocks || [];
  const originalCells: MemoryCell[] = [];
  for (const b of blocks) {
    for (const c of b.cells) {
      if (c.state === 1) {
        originalCells.push(c);
      }
    }
  }

  // 2. Encode to compact3d-v4 binary artifact
  const artifact = encodeHierarchyCompact3DV4(input);

  // 3. Decode binary buffer using independent decoder
  const decodeResult = decodeCompact3DV4(artifact.binaryBuffer);

  // 4. Validate exact equality
  const comparison = compareOriginalWithDecoded(originalCells, decodeResult.decodedMemory);

  const durationMs = performance.now() - startTime;
  const success = decodeResult.success && comparison.isLossless;

  return {
    success,
    artifact,
    decodeResult,
    comparison,
    durationMs,
  };
}
