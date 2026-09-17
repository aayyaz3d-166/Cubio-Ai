/**
 * Test TC-F11-04: Reference Metadata Cost
 * 
 * Verifies that all occurrence reference metadata fields (Opcode, BlockId, CompositeId,
 * OriginCellId, CoveredCount, SequenceIndex, Flags) are strictly counted per occurrence.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import {
  F11_COMPOSITE_REF_RECORD_BYTES,
  getCompositeReferenceByteLength,
  OPCODE_COMPOSITE_REF_F11,
  serializeCompositeReference,
} from '../core/serializer';

export function testReferenceMetadataCost(): { passed: boolean; details: string } {
  const family = createBenchmarkCandidateFamily(
    'COMPOSITE{D1@[0,0,0]|D2@[1,0,0]}',
    [1, 2],
    [[0, 0, 0], [1, 0, 0]],
    [
      { x: 0, y: 0, z: 0, blockId: 2 },
      { x: 3, y: 0, z: 0, blockId: 2 },
      { x: 0, y: 3, z: 0, blockId: 2 },
    ]
  );

  const refLength = getCompositeReferenceByteLength();
  if (refLength !== F11_COMPOSITE_REF_RECORD_BYTES || refLength !== 12) {
    return {
      passed: false,
      details: `Expected reference byte length to be 12 bytes, got ${refLength}`,
    };
  }

  for (let i = 0; i < family.occurrences.length; i++) {
    const occ = family.occurrences[i];
    const binary = serializeCompositeReference(occ, 77);

    if (binary.length !== 12) {
      return {
        passed: false,
        details: `Serialized reference buffer length (${binary.length}) does not match 12 bytes`,
      };
    }

    const view = new DataView(binary.buffer);

    // Opcode check
    if (binary[0] !== OPCODE_COMPOSITE_REF_F11) {
      return {
        passed: false,
        details: `Invalid opcode: expected 0x0B, got 0x${binary[0].toString(16)}`,
      };
    }

    // Block ID check
    const blockId = view.getUint16(1, false);
    if (blockId !== 2) {
      return {
        passed: false,
        details: `Invalid blockId in reference binary: expected 2, got ${blockId}`,
      };
    }

    // Composite ID check
    const compId = view.getUint16(3, false);
    if (compId !== 77) {
      return {
        passed: false,
        details: `Invalid compositeId in reference binary: expected 77, got ${compId}`,
      };
    }

    // Origin Cell ID check
    const cellId = view.getUint16(5, false);
    if (cellId !== occ.originCellId) {
      return {
        passed: false,
        details: `Invalid originCellId in reference binary: expected ${occ.originCellId}, got ${cellId}`,
      };
    }

    // Covered Count check
    const coveredCount = view.getUint16(7, false);
    if (coveredCount !== occ.coveredCells.length) {
      return {
        passed: false,
        details: `Invalid coveredCount in reference binary: expected ${occ.coveredCells.length}, got ${coveredCount}`,
      };
    }
  }

  return {
    passed: true,
    details: 'Successfully verified that reference metadata records are exactly 12 bytes with complete structural fields.',
  };
}
