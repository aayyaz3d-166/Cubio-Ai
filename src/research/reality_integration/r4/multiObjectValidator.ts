/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Multi-Object & Relationship Validator
 *
 * Validates objects, relationships, collections, coordinate integrity,
 * and absence of orphan edges or self-referential paradoxes.
 */

import {
  RealityObject,
  RealityRelationship,
  RealityObjectCollection,
  RealityObjectValidationReport,
  RealityRelationshipValidationReport,
  ObjectValidationStatus,
  RelationshipValidationStatus,
} from './types';
import {
  computeObjectChecksum,
  computeRelationshipChecksum,
  deterministicHash,
} from './determinism';

export class RealityMultiObjectValidator {
  public static validateObject(obj: RealityObject | null | undefined): RealityObjectValidationReport {
    if (!obj) {
      return Object.freeze({
        status: 'INVALID_OBJECT_ID',
        isValid: false,
        issues: Object.freeze(['RealityObject is null or undefined']),
        objectId: '',
        reportChecksum: deterministicHash('NULL_OBJECT'),
      });
    }

    const issues: string[] = [];

    // 1. Identity check
    if (!obj.identity || !obj.identity.objectId || !obj.identity.targetRealityStateId) {
      issues.push('Invalid or missing object identity');
    }

    // 2. Coordinates finite check
    if (obj.coordinates) {
      const [x, y, z] = obj.coordinates;
      if (
        !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) ||
        Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)
      ) {
        return Object.freeze({
          status: 'NON_FINITE_COORDINATES',
          isValid: false,
          issues: Object.freeze([`Non-finite coordinates in object: [${x}, ${y}, ${z}]`]),
          objectId: obj.identity.objectId,
          reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
        });
      }
    }

    // 3. Positive dimensions check
    if (obj.dimensions) {
      const [w, h, d] = obj.dimensions;
      if (
        !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d) ||
        w <= 0 || h <= 0 || d <= 0
      ) {
        return Object.freeze({
          status: 'INVALID_DIMENSIONS',
          isValid: false,
          issues: Object.freeze([`Invalid non-positive dimensions: [${w}, ${h}, ${d}]`]),
          objectId: obj.identity.objectId,
          reportChecksum: deterministicHash('INVALID_DIMENSIONS'),
        });
      }
    }

    // 4. Lineage check
    if (!obj.lineage || !obj.lineage.lineageId || !obj.lineage.rootObjectId) {
      return Object.freeze({
        status: 'BROKEN_LINEAGE',
        isValid: false,
        issues: Object.freeze(['Broken or missing object lineage']),
        objectId: obj.identity.objectId,
        reportChecksum: deterministicHash('BROKEN_LINEAGE'),
      });
    }

    // 5. Checksum verification
    const expectedChecksum = computeObjectChecksum(
      obj.identity.objectId,
      obj.identity.targetRealityStateId,
      obj.realityStateChecksum,
      obj.objectType,
      obj.coordinates,
      obj.dimensions,
      obj.certainty,
      obj.origin,
      obj.lineage.version
    );

    if (obj.objectChecksum !== expectedChecksum) {
      return Object.freeze({
        status: 'CHECKSUM_MISMATCH',
        isValid: false,
        issues: Object.freeze([`Object checksum mismatch. Expected ${expectedChecksum}, got ${obj.objectChecksum}`]),
        objectId: obj.identity.objectId,
        reportChecksum: deterministicHash('CHECKSUM_MISMATCH'),
      });
    }

    const isValid = issues.length === 0;
    const status: ObjectValidationStatus = isValid ? 'OBJECT_VALID' : 'INVALID_OBJECT_ID';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      objectId: obj.identity.objectId,
      reportChecksum,
    });
  }

  public static validateRelationship(
    rel: RealityRelationship,
    existingObjectIds: ReadonlySet<string>
  ): RealityRelationshipValidationReport {
    const issues: string[] = [];

    if (!rel.relationshipId) {
      issues.push('Missing relationshipId');
    }

    if (!existingObjectIds.has(rel.sourceObjectId)) {
      issues.push(`Missing source object: ${rel.sourceObjectId}`);
    }

    if (!existingObjectIds.has(rel.targetObjectId)) {
      issues.push(`Missing target object: ${rel.targetObjectId}`);
    }

    if (rel.sourceObjectId === rel.targetObjectId) {
      issues.push(`Invalid self-reference relationship on ${rel.sourceObjectId}`);
    }

    const expectedChecksum = computeRelationshipChecksum(
      rel.relationshipId,
      rel.sourceObjectId,
      rel.targetObjectId,
      rel.relationshipType,
      rel.evidence,
      rel.certainty,
      rel.targetRealityStateId
    );

    if (rel.relationshipChecksum !== expectedChecksum) {
      issues.push(`Relationship checksum mismatch`);
    }

    const isValid = issues.length === 0;
    const status: RelationshipValidationStatus = isValid
      ? 'RELATIONSHIP_VALID'
      : issues.some((i) => i.includes('self-reference'))
      ? 'INVALID_SELF_REFERENCE'
      : issues.some((i) => i.includes('Missing source'))
      ? 'MISSING_SOURCE_OBJECT'
      : issues.some((i) => i.includes('Missing target'))
      ? 'MISSING_TARGET_OBJECT'
      : 'INVALID_RELATIONSHIP_ID';

    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      relationshipId: rel.relationshipId,
      reportChecksum,
    });
  }

  public static validateCollection(collection: RealityObjectCollection): {
    isValid: boolean;
    issues: readonly string[];
    reportChecksum: string;
  } {
    const issues: string[] = [];
    const objIds = new Set<string>();

    // Verify object uniqueness and validity
    for (const obj of collection.objects) {
      if (objIds.has(obj.identity.objectId)) {
        issues.push(`Duplicate object ID: ${obj.identity.objectId}`);
      }
      objIds.add(obj.identity.objectId);

      const objReport = RealityMultiObjectValidator.validateObject(obj);
      if (!objReport.isValid) {
        issues.push(...objReport.issues);
      }
    }

    // Verify relationships and orphan edges
    const relIds = new Set<string>();
    for (const rel of collection.relationships) {
      if (relIds.has(rel.relationshipId)) {
        issues.push(`Duplicate relationship ID: ${rel.relationshipId}`);
      }
      relIds.add(rel.relationshipId);

      const relReport = RealityMultiObjectValidator.validateRelationship(rel, objIds);
      if (!relReport.isValid) {
        issues.push(...relReport.issues);
      }
    }

    const isValid = issues.length === 0;
    const reportChecksum = deterministicHash(issues.join(';') + `_${isValid}`);

    return Object.freeze({
      isValid,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
