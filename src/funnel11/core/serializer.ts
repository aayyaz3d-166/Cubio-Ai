/**
 * 3D Memory Studio - Funnel 11: Deterministic Binary Serializer
 * 
 * Implements deterministic binary encoding and byte-length calculations for Level 3
 * Composite definitions, composite occurrence references, and expanded child representations.
 * 
 * Invariants:
 * - 100% deterministic (same input produces exact byte-for-byte identical output).
 * - No timestamps, no random IDs, no JSON measurements.
 * - Big-endian integers, explicit signed byte offsets, explicit opcode bytes.
 */

import { CompositeCandidateOccurrence, CompositeChildOccurrence } from '../../funnel10/types/candidate';
import { CanonicalComposite } from '../../funnel9/types/canonical';

// ============================================================================
// CONSTANTS & BINARY LAYOUT SPECIFICATION
// ============================================================================

export const F11_MAGIC_DEF = [0x43, 0x44]; // 'CD' (Composite Definition)
export const F11_FORMAT_VERSION = 0x01;

export const OPCODE_COMPOSITE_REF_F11 = 0x0B; // Funnel 11 Composite Reference Opcode
export const OPCODE_EXPANDED_CHILD_REF = 0x06; // Standard Level 2 Dictionary Reference Opcode

export const F11_COMPOSITE_DEF_HEADER_BYTES = 9; // [Magic (2B), Version (1B), CompId (2B), ChildCount (2B), Transform (1B), Flags (1B)]
export const F11_COMPOSITE_CHILD_RECORD_BYTES = 8; // [ChildDictId (2B), RelDX (1B), RelDY (1B), RelDZ (1B), Order (2B), Transform (1B)]
export const F11_COMPOSITE_REF_RECORD_BYTES = 12;  // [Opcode (1B), BlockId (2B), CompId (2B), OriginCellId (2B), CoveredCount (2B), StartSeq (2B), Flags (1B)]
export const F11_EXPANDED_CHILD_RECORD_BYTES = 9;  // [Opcode (1B), BlockId (2B), DictId (2B), OriginCellId (2B), CoveredCount (2B)]

export const TRANSFORM_CODE_TRANSLATION = 0x01;

// ============================================================================
// SERIALIZATION FUNCTIONS
// ============================================================================

/**
 * Calculates the exact serialized byte length for a composite definition.
 */
export function getCompositeDefinitionByteLength(childCount: number): number {
  return F11_COMPOSITE_DEF_HEADER_BYTES + childCount * F11_COMPOSITE_CHILD_RECORD_BYTES;
}

/**
 * Calculates the exact serialized byte length for a single composite occurrence reference.
 */
export function getCompositeReferenceByteLength(): number {
  return F11_COMPOSITE_REF_RECORD_BYTES;
}

/**
 * Calculates the exact serialized byte length of expanding all children individually for one occurrence.
 */
export function getExpandedCostPerOccurrence(childCount: number): number {
  return childCount * F11_EXPANDED_CHILD_RECORD_BYTES;
}

/**
 * Deterministically serializes a canonical composite definition into an exact binary buffer.
 */
export function serializeCompositeDefinition(
  canonical: CanonicalComposite,
  compositeId: number
): Uint8Array {
  const childCount = canonical.childCount;
  const totalLength = getCompositeDefinitionByteLength(childCount);
  const buffer = new Uint8Array(totalLength);
  const view = new DataView(buffer.buffer);

  let offset = 0;

  // 1. Magic bytes [2B]
  buffer[offset++] = F11_MAGIC_DEF[0];
  buffer[offset++] = F11_MAGIC_DEF[1];

  // 2. Version [1B]
  buffer[offset++] = F11_FORMAT_VERSION;

  // 3. Composite ID [2B] (uint16)
  view.setUint16(offset, compositeId, false);
  offset += 2;

  // 4. Child Count [2B] (uint16)
  view.setUint16(offset, childCount, false);
  offset += 2;

  // 5. Transform Type [1B] (0x01 = TRANSLATION)
  buffer[offset++] = TRANSFORM_CODE_TRANSLATION;

  // 6. Flags / Reserved [1B]
  buffer[offset++] = 0x00;

  // 7. Child Records [8B each]
  for (let i = 0; i < childCount; i++) {
    const child = canonical.children[i];

    // Child Dict ID [2B]
    view.setUint16(offset, child.dictId, false);
    offset += 2;

    // Relative DX [1B signed int8]
    view.setInt8(offset, Math.max(-128, Math.min(127, child.offset.dx)));
    offset += 1;

    // Relative DY [1B signed int8]
    view.setInt8(offset, Math.max(-128, Math.min(127, child.offset.dy)));
    offset += 1;

    // Relative DZ [1B signed int8]
    view.setInt8(offset, Math.max(-128, Math.min(127, child.offset.dz)));
    offset += 1;

    // Child Order [2B]
    view.setUint16(offset, child.order ?? i, false);
    offset += 2;

    // Child Transform [1B]
    buffer[offset++] = TRANSFORM_CODE_TRANSLATION;
  }

  return buffer;
}

/**
 * Deterministically serializes a composite occurrence reference into an exact binary buffer.
 */
export function serializeCompositeReference(
  occurrence: CompositeCandidateOccurrence,
  compositeId: number
): Uint8Array {
  const buffer = new Uint8Array(F11_COMPOSITE_REF_RECORD_BYTES);
  const view = new DataView(buffer.buffer);

  let offset = 0;

  // 1. Opcode [1B]
  buffer[offset++] = OPCODE_COMPOSITE_REF_F11;

  // 2. Block ID [2B]
  view.setUint16(offset, occurrence.blockId, false);
  offset += 2;

  // 3. Composite ID [2B]
  view.setUint16(offset, compositeId, false);
  offset += 2;

  // 4. Origin Cell ID [2B]
  view.setUint16(offset, occurrence.originCellId, false);
  offset += 2;

  // 5. Covered Cell Count [2B]
  view.setUint16(offset, occurrence.coveredCells.length, false);
  offset += 2;

  // 6. Start Sequence Index [2B]
  const startSeq = occurrence.sequenceIndices.length > 0 ? occurrence.sequenceIndices[0] : 0;
  view.setUint16(offset, startSeq, false);
  offset += 2;

  // 7. Flags [1B]
  buffer[offset++] = 0x00;

  return buffer;
}

/**
 * Deterministically serializes an individual expanded child dictionary reference.
 */
export function serializeExpandedChildReference(
  child: CompositeChildOccurrence,
  blockId: number
): Uint8Array {
  const buffer = new Uint8Array(F11_EXPANDED_CHILD_RECORD_BYTES);
  const view = new DataView(buffer.buffer);

  let offset = 0;

  // 1. Opcode [1B]
  buffer[offset++] = OPCODE_EXPANDED_CHILD_REF;

  // 2. Block ID [2B]
  view.setUint16(offset, blockId, false);
  offset += 2;

  // 3. Dictionary ID [2B]
  view.setUint16(offset, child.dictId, false);
  offset += 2;

  // 4. Origin Cell ID / Anchor [2B]
  const originCellId = child.coveredCells.length > 0 ? child.coveredCells[0] : 0;
  view.setUint16(offset, originCellId, false);
  offset += 2;

  // 5. Covered Cell Count [2B]
  view.setUint16(offset, child.coveredCells.length, false);
  offset += 2;

  return buffer;
}
