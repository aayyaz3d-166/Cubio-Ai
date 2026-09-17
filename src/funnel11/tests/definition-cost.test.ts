/**
 * Test TC-F11-03: Definition Metadata Cost
 * 
 * Verifies that all composite definition fields, headers, and child records are fully counted in bytes.
 */

import { CanonicalComposite } from '../../funnel9/types/canonical';
import {
  F11_COMPOSITE_CHILD_RECORD_BYTES,
  F11_COMPOSITE_DEF_HEADER_BYTES,
  getCompositeDefinitionByteLength,
  serializeCompositeDefinition,
} from '../core/serializer';

export function testDefinitionMetadataCost(): { passed: boolean; details: string } {
  const childCounts = [2, 3, 4, 5, 8];

  for (const count of childCounts) {
    const children = Array.from({ length: count }, (_, i) => ({
      dictId: 100 + i,
      offset: { dx: i, dy: 0, dz: 0 },
      order: i,
      transform: 'TRANSLATION' as const,
      hierarchyLevel: 2 as const,
    }));

    const canonical: CanonicalComposite = {
      hierarchyLevel: 3,
      childCount: count,
      children,
      transform: 'TRANSLATION',
      signature: `COMPOSITE{${count}_CHILDREN}`,
      fingerprint: 'DEF_TEST',
      relativeBoundingBox: { minDx: 0, maxDx: count, minDy: 0, maxDy: 0, minDz: 0, maxDz: 0, spanX: count, spanY: 0, spanZ: 0 },
    };

    const expectedLength = F11_COMPOSITE_DEF_HEADER_BYTES + count * F11_COMPOSITE_CHILD_RECORD_BYTES;
    const computedLength = getCompositeDefinitionByteLength(count);

    if (computedLength !== expectedLength) {
      return {
        passed: false,
        details: `Mismatch in computed definition length for ${count} children: expected ${expectedLength}, got ${computedLength}`,
      };
    }

    const binary = serializeCompositeDefinition(canonical, 42);
    if (binary.length !== expectedLength) {
      return {
        passed: false,
        details: `Serialized buffer length (${binary.length}) does not match expected definition length (${expectedLength}) for ${count} children`,
      };
    }

    // Check magic bytes 'CD' (0x43, 0x44)
    if (binary[0] !== 0x43 || binary[1] !== 0x44) {
      return {
        passed: false,
        details: `Invalid magic bytes: 0x${binary[0].toString(16)}, 0x${binary[1].toString(16)}`,
      };
    }

    // Check Version (0x01)
    if (binary[2] !== 0x01) {
      return {
        passed: false,
        details: `Invalid version byte: 0x${binary[2].toString(16)}`,
      };
    }

    // Check Composite ID (42)
    const view = new DataView(binary.buffer);
    const readCompId = view.getUint16(3, false);
    if (readCompId !== 42) {
      return {
        passed: false,
        details: `Invalid composite ID in binary header: expected 42, read ${readCompId}`,
      };
    }

    // Check Child Count
    const readChildCount = view.getUint16(5, false);
    if (readChildCount !== count) {
      return {
        passed: false,
        details: `Invalid child count in binary header: expected ${count}, read ${readChildCount}`,
      };
    }
  }

  return {
    passed: true,
    details: 'Successfully verified definition metadata cost and exact binary buffer layout across 2 to 8 children.',
  };
}
