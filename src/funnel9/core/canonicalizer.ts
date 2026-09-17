/**
 * 3D Memory Studio - Funnel 9: Canonicalizer Engine
 * 
 * Implements the deterministic canonicalization process for Level 3 Composite patterns.
 * 
 * =========================================================================
 * CANONICAL ORIGIN RULE (Documented Standard):
 * =========================================================================
 * 1. Zero-child composites are strictly invalid and rejected (EMPTY_CHILDREN).
 * 2. All transformations must be 'TRANSLATION' (UNSUPPORTED_TRANSFORM on any other).
 * 3. The logical ordering of children is strictly preserved (never sorted or altered).
 * 4. The Canonical Anchor Point (Canonical Origin) is defined as the 3D position
 *    of the first child in logical order (Child 0):
 *      Anchor = (X_0, Y_0, Z_0)
 * 5. Every child's canonical offset is computed as:
 *      dx_i = X_i - X_0
 *      dy_i = Y_i - Y_0
 *      dz_i = Z_i - Z_0
 *    Child 0 is guaranteed to reside at canonical offset (0, 0, 0).
 *    All subsequent children preserve their exact relative displacements.
 * 6. Global Translation Invariance:
 *    For any arbitrary global translation vector T = (tx, ty, tz) applied to all children:
 *      (X_i + tx) - (X_0 + tx) = X_i - X_0 = dx_i
 *    The resulting canonical representation, signature, and fingerprint are 100% identical.
 * 7. Negative relative offsets are fully supported and preserved.
 * =========================================================================
 */

import {
  CanonicalChildRecord,
  CanonicalComposite,
  CanonicalizationResult,
  CanonicalOffset3D,
  FUNNEL9_TRANSFORM,
  RawCompositeChildInput,
  RawCompositeInput,
  Vector3D,
} from '../types/canonical';
import { calculateCompositeFingerprint, calculateCompositeSignature } from './signature';

/**
 * Extracts 3D coordinate from Vector3D or CanonicalOffset3D
 */
function extractCoord(pos: Vector3D | CanonicalOffset3D, origin?: Vector3D): { x: number; y: number; z: number } {
  const ox = origin ? origin.x : 0;
  const oy = origin ? origin.y : 0;
  const oz = origin ? origin.z : 0;

  if ('x' in pos && typeof pos.x === 'number') {
    return { x: pos.x + ox, y: pos.y + oy, z: pos.z + oz };
  }
  if ('dx' in pos && typeof pos.dx === 'number') {
    return { x: pos.dx + ox, y: pos.dy + oy, z: pos.dz + oz };
  }
  return { x: ox, y: oy, z: oz };
}

/**
 * Checks if a transform string is supported (only 'TRANSLATION' is supported in Funnel 9)
 */
export function isFunnel9TransformSupported(transform?: string): boolean {
  if (!transform) return true; // Default is TRANSLATION
  return transform.trim().toUpperCase() === FUNNEL9_TRANSFORM;
}

/**
 * Canonicalizes a raw composite input into an immutable, origin-invariant CanonicalComposite.
 */
export function canonicalizeComposite(input: RawCompositeInput): CanonicalizationResult {
  // 1. Validation: Non-empty children
  if (!input.children || input.children.length === 0) {
    return {
      success: false,
      error: 'Composite must contain at least one child pattern. Empty composites are not permitted.',
      errorCode: 'EMPTY_CHILDREN',
    };
  }

  // 2. Validation: Composite transform
  if (input.transform && !isFunnel9TransformSupported(input.transform)) {
    return {
      success: false,
      error: `Unsupported composite transform '${input.transform}'. Funnel 9 only supports 'TRANSLATION'.`,
      errorCode: 'UNSUPPORTED_TRANSFORM',
    };
  }

  // 3. Validation & Position Extraction for all children
  const childCoords: {
    dictId: number;
    coord: { x: number; y: number; z: number };
    order: number;
    transformMetadata?: Readonly<Record<string, unknown>>;
  }[] = [];

  for (let i = 0; i < input.children.length; i++) {
    const rawChild = input.children[i];

    // Check child dictId
    if (typeof rawChild.dictId !== 'number' || !Number.isInteger(rawChild.dictId) || rawChild.dictId <= 0) {
      return {
        success: false,
        error: `Child at index ${i} has invalid dictionary ID '${rawChild.dictId}'. Must be a positive integer.`,
        errorCode: 'INVALID_DICT_ID',
      };
    }

    // Check child transform
    if (rawChild.transform && !isFunnel9TransformSupported(rawChild.transform)) {
      return {
        success: false,
        error: `Child #${rawChild.dictId} at index ${i} uses unsupported transform '${rawChild.transform}'. Only 'TRANSLATION' is supported.`,
        errorCode: 'UNSUPPORTED_TRANSFORM',
      };
    }

    const coord = extractCoord(rawChild.position, input.origin);
    if (!Number.isFinite(coord.x) || !Number.isFinite(coord.y) || !Number.isFinite(coord.z)) {
      return {
        success: false,
        error: `Child #${rawChild.dictId} at index ${i} has non-finite coordinate (${coord.x}, ${coord.y}, ${coord.z}).`,
        errorCode: 'INVALID_COORDINATES',
      };
    }

    const order = rawChild.order !== undefined ? rawChild.order : i;
    childCoords.push({
      dictId: rawChild.dictId,
      coord,
      order,
      transformMetadata: rawChild.transformMetadata ? Object.freeze({ ...rawChild.transformMetadata }) : undefined,
    });
  }

  // 4. Canonical Origin Rule:
  // Anchor position is defined as the 3D position of Child 0 (first in logical order)
  const anchor = childCoords[0].coord;

  let minDx = 0;
  let maxDx = 0;
  let minDy = 0;
  let maxDy = 0;
  let minDz = 0;
  let maxDz = 0;

  const canonicalChildren: CanonicalChildRecord[] = [];

  for (let i = 0; i < childCoords.length; i++) {
    const c = childCoords[i];
    const dx = c.coord.x - anchor.x;
    const dy = c.coord.y - anchor.y;
    const dz = c.coord.z - anchor.z;

    if (dx < minDx) minDx = dx;
    if (dx > maxDx) maxDx = dx;
    if (dy < minDy) minDy = dy;
    if (dy > maxDy) maxDy = dy;
    if (dz < minDz) minDz = dz;
    if (dz > maxDz) maxDz = dz;

    const childRecord: CanonicalChildRecord = Object.freeze({
      dictId: c.dictId,
      offset: Object.freeze({ dx, dy, dz }),
      order: c.order,
      transform: FUNNEL9_TRANSFORM,
      transformMetadata: c.transformMetadata,
      hierarchyLevel: 2 as const,
    });

    canonicalChildren.push(childRecord);
  }

  const frozenChildren = Object.freeze(canonicalChildren);

  // 5. Generate deterministic signature and lookup fingerprint
  const signature = calculateCompositeSignature(
    frozenChildren,
    FUNNEL9_TRANSFORM,
    input.transformMetadata ? Object.freeze({ ...input.transformMetadata }) : undefined
  );
  const fingerprint = calculateCompositeFingerprint(signature);

  const relativeBoundingBox = Object.freeze({
    minDx,
    maxDx,
    minDy,
    maxDy,
    minDz,
    maxDz,
    spanX: maxDx - minDx + 1,
    spanY: maxDy - minDy + 1,
    spanZ: maxDz - minDz + 1,
  });

  const canonicalComposite: CanonicalComposite = Object.freeze({
    hierarchyLevel: 3 as const,
    childCount: frozenChildren.length,
    children: frozenChildren,
    transform: FUNNEL9_TRANSFORM,
    transformMetadata: input.transformMetadata ? Object.freeze({ ...input.transformMetadata }) : undefined,
    signature,
    fingerprint,
    relativeBoundingBox,
  });

  return {
    success: true,
    canonical: canonicalComposite,
  };
}

/**
 * Creates a translated instance of a raw composite for testing invariance
 */
export function translateRawComposite(
  input: RawCompositeInput,
  translationVector: Vector3D
): RawCompositeInput {
  const newOrigin: Vector3D = {
    x: (input.origin ? input.origin.x : 0) + translationVector.x,
    y: (input.origin ? input.origin.y : 0) + translationVector.y,
    z: (input.origin ? input.origin.z : 0) + translationVector.z,
  };

  return {
    compositeId: input.compositeId,
    origin: newOrigin,
    children: input.children.map((c) => ({ ...c })),
    transform: input.transform,
    transformMetadata: input.transformMetadata,
  };
}
