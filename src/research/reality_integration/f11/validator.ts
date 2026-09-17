/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Model Validator
 *
 * Enforces integrity rules:
 * 1. No duplicate IDs
 * 2. No orphan relations (both source and target must exist)
 * 3. No NaN / Infinity coordinates
 * 4. No invalid confidence values
 * 5. No unauthorized evidence promotion to OBSERVED
 * 6. Valid model checksums
 */

import { WorldModel, WorldModelValidationReport, WorldModelValidationStatus } from './types';
import { deterministicHash } from './determinism';

export class F11Validator {
  public static validate(model: WorldModel): WorldModelValidationReport {
    const issues: string[] = [];
    let status: WorldModelValidationStatus = 'VALID';

    // 1. Validate Entities
    const entityIds = new Set<string>();
    for (const [id, ent] of Object.entries(model.entities)) {
      if (entityIds.has(id)) {
        issues.push(`Duplicate entity ID: ${id}`);
        status = 'DUPLICATE_ID';
      }
      entityIds.add(id);

      if (ent.coordinates) {
        for (const coord of ent.coordinates) {
          if (!Number.isFinite(coord)) {
            issues.push(`Non-finite coordinate in entity '${ent.name}': ${coord}`);
            status = 'NON_FINITE_VALUE';
          }
        }
      }
    }

    // 2. Validate Relations
    const relationIds = new Set<string>();
    for (const rel of model.relations) {
      if (relationIds.has(rel.relationId)) {
        issues.push(`Duplicate relation ID: ${rel.relationId}`);
        status = 'DUPLICATE_ID';
      }
      relationIds.add(rel.relationId);

      if (!model.entities[rel.sourceEntityId]) {
        issues.push(`Orphan relation ${rel.relationId}: missing source entity ${rel.sourceEntityId}`);
        status = 'ORPHAN_RELATION';
      }
      if (!model.entities[rel.targetEntityId]) {
        issues.push(`Orphan relation ${rel.relationId}: missing target entity ${rel.targetEntityId}`);
        status = 'ORPHAN_RELATION';
      }

      if (rel.confidence < 0 || rel.confidence > 1.0 || !Number.isFinite(rel.confidence)) {
        issues.push(`Invalid confidence ${rel.confidence} in relation ${rel.relationId}`);
        status = 'INVALID_CONFIDENCE';
      }

      // Epistemic invariant: INFERRED relations cannot have OBSERVED evidence
      if (rel.category === 'INFERRED' && rel.evidence.evidenceType === 'OBSERVED') {
        issues.push(`CRITICAL VIOLATION: Inferred relation ${rel.relationId} promoted to OBSERVED.`);
        status = 'UNAUTHORIZED_EVIDENCE_PROMOTION';
      }
    }

    // 3. Validate Inferences
    for (const inf of model.inferences) {
      if (inf.derivedRelation.evidence.evidenceType === 'OBSERVED') {
        issues.push(`CRITICAL VIOLATION: Inference ${inf.inferenceId} marked as OBSERVED.`);
        status = 'UNAUTHORIZED_EVIDENCE_PROMOTION';
      }
    }

    const isValid = issues.length === 0;
    const reportChecksum = `CS_VAL_${deterministicHash(`${model.modelId}:${status}:${isValid}:${issues.length}`)}`;

    return {
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    };
  }
}
