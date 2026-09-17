/**
 * 3D Memory Studio - Funnel 9: Comparator & Equality Engine
 * 
 * Implements strict canonical composite comparison and hash collision-safe lookup verification.
 * 
 * Rules:
 * - Compares exact relative geometry (dx, dy, dz), child dictionary IDs, child ordering, and transform metadata.
 * - Ignores global origin, runtime pointers, timestamps, and memory locations.
 * - Hash/Fingerprint is ONLY an indexing accelerator. Full canonical comparison is MANDATORY.
 */

import { CanonicalComposite } from '../types/canonical';
import { CanonicalComparisonResult } from '../types/signature';
import { deterministicStringify } from './signature';

/**
 * Compares two CanonicalComposite objects for complete structural and relative spatial equality.
 * Returns true if and only if both represent the exact same canonical composite pattern.
 */
export function areCanonicalCompositesEqual(
  a: CanonicalComposite,
  b: CanonicalComposite
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // 1. Child Count Check
  if (a.childCount !== b.childCount) {
    return false;
  }

  // 2. Transform Check
  if (a.transform !== b.transform) {
    return false;
  }

  // 3. Transform Metadata Check
  const metaA = a.transformMetadata ? deterministicStringify(a.transformMetadata) : '';
  const metaB = b.transformMetadata ? deterministicStringify(b.transformMetadata) : '';
  if (metaA !== metaB) {
    return false;
  }

  // 4. Per-Child Deep Check (Preserving logical order)
  for (let i = 0; i < a.children.length; i++) {
    const childA = a.children[i];
    const childB = b.children[i];

    if (childA.dictId !== childB.dictId) {
      return false;
    }

    if (childA.order !== childB.order) {
      return false;
    }

    if (
      childA.offset.dx !== childB.offset.dx ||
      childA.offset.dy !== childB.offset.dy ||
      childA.offset.dz !== childB.offset.dz
    ) {
      return false;
    }

    if (childA.transform !== childB.transform) {
      return false;
    }

    const cMetaA = childA.transformMetadata ? deterministicStringify(childA.transformMetadata) : '';
    const cMetaB = childB.transformMetadata ? deterministicStringify(childB.transformMetadata) : '';
    if (cMetaA !== cMetaB) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two canonical composites and produces a detailed diagnostic report explaining exact differences if any.
 */
export function compareCanonicalComposites(
  a: CanonicalComposite,
  b: CanonicalComposite
): CanonicalComparisonResult {
  if (a === b) {
    return { areEqual: true, differenceType: 'NONE' };
  }
  if (!a || !b) {
    return {
      areEqual: false,
      reason: 'One of the canonical composite operands is null or undefined.',
      differenceType: 'CHILD_COUNT_MISMATCH',
    };
  }

  if (a.childCount !== b.childCount) {
    return {
      areEqual: false,
      reason: `Child count mismatch: composite A has ${a.childCount} children, composite B has ${b.childCount} children.`,
      differenceType: 'CHILD_COUNT_MISMATCH',
    };
  }

  if (a.transform !== b.transform) {
    return {
      areEqual: false,
      reason: `Transform mismatch: composite A uses '${a.transform}', composite B uses '${b.transform}'.`,
      differenceType: 'TRANSFORM_MISMATCH',
    };
  }

  const metaA = a.transformMetadata ? deterministicStringify(a.transformMetadata) : '';
  const metaB = b.transformMetadata ? deterministicStringify(b.transformMetadata) : '';
  if (metaA !== metaB) {
    return {
      areEqual: false,
      reason: 'Transform metadata differs between composites.',
      differenceType: 'METADATA_MISMATCH',
    };
  }

  for (let i = 0; i < a.children.length; i++) {
    const childA = a.children[i];
    const childB = b.children[i];

    if (childA.dictId !== childB.dictId) {
      return {
        areEqual: false,
        reason: `Child dictionary ID mismatch at index ${i}: child A is Dict #${childA.dictId}, child B is Dict #${childB.dictId}.`,
        differenceType: 'DICT_ID_MISMATCH',
        differingChildIndex: i,
      };
    }

    if (childA.order !== childB.order) {
      return {
        areEqual: false,
        reason: `Child ordering index mismatch at index ${i}: child A has order ${childA.order}, child B has order ${childB.order}.`,
        differenceType: 'ORDER_MISMATCH',
        differingChildIndex: i,
      };
    }

    if (
      childA.offset.dx !== childB.offset.dx ||
      childA.offset.dy !== childB.offset.dy ||
      childA.offset.dz !== childB.offset.dz
    ) {
      return {
        areEqual: false,
        reason: `Child spatial relative offset mismatch at index ${i}: child A offset is (${childA.offset.dx},${childA.offset.dy},${childA.offset.dz}), child B offset is (${childB.offset.dx},${childB.offset.dy},${childB.offset.dz}).`,
        differenceType: 'OFFSET_MISMATCH',
        differingChildIndex: i,
      };
    }

    const cMetaA = childA.transformMetadata ? deterministicStringify(childA.transformMetadata) : '';
    const cMetaB = childB.transformMetadata ? deterministicStringify(childB.transformMetadata) : '';
    if (cMetaA !== cMetaB) {
      return {
        areEqual: false,
        reason: `Child transform metadata mismatch at index ${i}.`,
        differenceType: 'METADATA_MISMATCH',
        differingChildIndex: i,
      };
    }
  }

  return { areEqual: true, differenceType: 'NONE' };
}

/**
 * Hash Collision-Safe Lookup Helper
 * 
 * Two-stage lookup protocol:
 * Stage 1: Fast bucket retrieval using the 32-bit fingerprint (O(1) average)
 * Stage 2: Mandatory full canonical equality verification across bucket candidates
 * 
 * Guarantees that hash collisions NEVER cause two structurally distinct patterns to be treated as identical.
 */
export class CanonicalCompositeCatalog {
  private readonly buckets: Map<string, CanonicalComposite[]> = new Map();

  /**
   * Registers a canonical composite into the lookup catalog.
   */
  public register(composite: CanonicalComposite): void {
    const bucket = this.buckets.get(composite.fingerprint) || [];
    // Check if already registered
    const exists = bucket.some((existing) => areCanonicalCompositesEqual(existing, composite));
    if (!exists) {
      bucket.push(composite);
      this.buckets.set(composite.fingerprint, bucket);
    }
  }

  /**
   * Looks up an exact canonical match in the catalog using two-stage safe resolution.
   */
  public findMatch(target: CanonicalComposite): CanonicalComposite | null {
    const bucket = this.buckets.get(target.fingerprint);
    if (!bucket || bucket.length === 0) {
      return null;
    }

    // Two-stage validation: full structural comparison on candidates in the bucket
    for (const candidate of bucket) {
      if (areCanonicalCompositesEqual(candidate, target)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Total registered composites count
   */
  public size(): number {
    let count = 0;
    for (const bucket of this.buckets.values()) {
      count += bucket.length;
    }
    return count;
  }

  /**
   * Retrieves all items sharing a specific fingerprint (for collision testing)
   */
  public getBucket(fingerprint: string): readonly CanonicalComposite[] {
    return this.buckets.get(fingerprint) || [];
  }
}
