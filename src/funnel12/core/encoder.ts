/**
 * 3D Memory Studio - Funnel 12: Hierarchical Encoder Core Engine
 * 
 * Takes the authoritative, profitable composite selection result from Funnel 11,
 * Level 2 dictionary definitions from Funnel 5, and remaining residual cells / primitives,
 * and encodes them into the deterministic compact3d-v4 binary artifact.
 * 
 * Invariants:
 * 1. NO RE-OPTIMIZATION: Does not add, remove, or re-evaluate composite profitability.
 * 2. Strict Bounded Depth = 3 (Cells -> Primitives -> Dict -> Composites).
 * 3. Sequence & Block Preservation: Retains exact cell sequence order and block IDs.
 * 4. Deterministic byte-for-byte serialization.
 */

import { MemoryBlock, MemoryCell, RootMemory } from '../../types/memory';
import { SpatialPatternDictionary } from '../../types/spatialDictionary';
import { CompositeSelectionResult, SelectedCompositeEntry } from '../../funnel11/types/selection';
import { Compact3DArtifactV4 } from '../types/artifact';
import {
  F12CompositeChildDef,
  F12CompositeDefinition,
  F12CompositeReference,
  F12DictionaryEntry,
  F12PrimitiveRecord,
  F12RawCellRecord,
  RelOffset3D,
} from '../types/records';
import { serializeCompact3DV4, SerializerInput } from './serializer';

export interface EncoderInputData {
  readonly memory: RootMemory | readonly MemoryBlock[];
  readonly selectionResult?: CompositeSelectionResult | null;
  readonly dictionary?: SpatialPatternDictionary | readonly F12DictionaryEntry[] | null;
  readonly primitiveRecords?: readonly F12PrimitiveRecord[];
  readonly rawCellRecords?: readonly F12RawCellRecord[];
  readonly comparativeMetrics?: {
    readonly originalBytes: number;
    readonly funnel4Bytes: number;
    readonly funnel5Bytes: number;
    readonly funnel11SelectedBytes: number;
  };
}

export function encodeHierarchyCompact3DV4(input: EncoderInputData): Compact3DArtifactV4 {
  // 1. Extract memory blocks
  const blocks: readonly MemoryBlock[] = Array.isArray(input.memory)
    ? input.memory
    : (input.memory as RootMemory).blocks || [];

  // Flatten active cells from blocks
  const allActiveCells: MemoryCell[] = [];
  for (const block of blocks) {
    for (const cell of block.cells) {
      if (cell.state === 1) {
        allActiveCells.push(cell);
      }
    }
  }

  // 2. Build Dictionary Table
  const dictEntriesMap = new Map<number, F12DictionaryEntry>();

  if (Array.isArray(input.dictionary)) {
    for (const entry of input.dictionary as F12DictionaryEntry[]) {
      dictEntriesMap.set(entry.dictId, entry);
    }
  } else if (input.dictionary && 'entries' in input.dictionary) {
    const spatialDict = input.dictionary as SpatialPatternDictionary;
    for (const entry of spatialDict.entries) {
      const offsets: RelOffset3D[] = (entry.canonicalRule.parameters.relativeOffsets || [{ x: 0, y: 0, z: 0 }]).map((o) => ({
        dx: o.x,
        dy: o.y,
        dz: o.z,
      }));
      const symbol = entry.canonicalRule.parameters.symbols?.[0] || 'A';
      dictEntriesMap.set(entry.dictId, {
        dictId: entry.dictId,
        ruleType: 0x01,
        relativeOffsets: offsets,
        symbol,
        flags: 0,
      });
    }
  }

  // 3. Build Composite Definitions and Composite References from Funnel 11 Selection
  const compDefs: F12CompositeDefinition[] = [];
  const compRefs: F12CompositeReference[] = [];
  const compositeCoveredCells = new Set<string>(); // key: `${blockId}:${cellId}`

  if (input.selectionResult && input.selectionResult.selectedEntries) {
    for (const selected of input.selectionResult.selectedEntries) {
      // Build definition
      const children: F12CompositeChildDef[] = selected.canonical.children.map((c) => {
        // Ensure dict entry is registered
        if (!dictEntriesMap.has(c.dictId)) {
          // Provide standard single cell / default if missing
          dictEntriesMap.set(c.dictId, {
            dictId: c.dictId,
            ruleType: 0x01,
            relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }],
            symbol: 'A',
            flags: 0,
          });
        }
        return {
          childDictId: c.dictId,
          offset: { dx: c.offset.dx, dy: c.offset.dy, dz: c.offset.dz },
          order: c.order ?? 0,
          transform: 0x01, // TRANSLATION
        };
      });

      compDefs.push({
        compositeId: selected.compositeId,
        childCount: children.length,
        transformType: 0x01,
        flags: 0,
        children,
      });

      // Build occurrence references
      for (const occ of selected.occurrences) {
        const startSeq = occ.sequenceIndices && occ.sequenceIndices.length > 0
          ? occ.sequenceIndices[0]
          : 0;

        compRefs.push({
          opcode: 0x0C,
          blockId: occ.blockId,
          compositeId: occ.compositeId,
          originCellId: occ.originCellId,
          coveredCount: occ.coveredCells.length,
          startSeqIndex: startSeq,
          flags: 0,
        });

        for (const cId of occ.coveredCells) {
          compositeCoveredCells.add(`${occ.blockId}:${cId}`);
        }
      }
    }
  }

  // 4. Incorporate Primitive Records (Level 1)
  const primitiveRecords: F12PrimitiveRecord[] = [];
  if (input.primitiveRecords) {
    for (const prim of input.primitiveRecords) {
      primitiveRecords.push(prim);
    }
  }

  // 5. Gather Uncovered Cells as RAW Records (Level 0)
  const rawCellRecords: F12RawCellRecord[] = [];
  if (input.rawCellRecords && input.rawCellRecords.length > 0) {
    for (const raw of input.rawCellRecords) {
      if (!compositeCoveredCells.has(`${raw.blockId}:${raw.cellId}`)) {
        rawCellRecords.push(raw);
      }
    }
  } else {
    // Generate RAW records for all cells not covered by composites
    for (const cell of allActiveCells) {
      const key = `${cell.blockId}:${cell.id}`;
      if (!compositeCoveredCells.has(key)) {
        const stepIdx = cell.stepIndices && cell.stepIndices.length > 0 ? cell.stepIndices[0] : 0;
        rawCellRecords.push({
          opcode: 0x00,
          blockId: cell.blockId,
          cellId: cell.id,
          sequenceIndex: stepIdx,
          state: 1,
          symbol: cell.symbol || 'A',
        });
      }
    }
  }

  // Calculate total sequence steps
  const totalActiveCellsCount = allActiveCells.length > 0
    ? allActiveCells.length
    : (compRefs.reduce((sum, r) => sum + r.coveredCount, 0) + rawCellRecords.length + primitiveRecords.reduce((sum, p) => sum + p.cellCount, 0));

  const totalSeq = totalActiveCellsCount;

  // 6. Build Serializer Input & Output Binary Artifact
  const serializerInput: SerializerInput = {
    blockCount: blocks.length > 0 ? blocks.length : 1,
    totalActiveCells: totalActiveCellsCount,
    totalSequenceSteps: totalSeq,
    dictionaryEntries: Array.from(dictEntriesMap.values()),
    compositeDefinitions: compDefs,
    compositeReferences: compRefs,
    primitiveRecords,
    rawCellRecords,
    comparativeMetrics: input.comparativeMetrics,
  };

  return serializeCompact3DV4(serializerInput);
}
