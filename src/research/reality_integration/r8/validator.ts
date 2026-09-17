/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Interaction Validator
 *
 * Deep validation rejecting NaN, Infinity, invalid transforms, zero/negative scale,
 * malformed rotations, missing Reality references, duplicate IDs, broken lineage,
 * orphan selections, fabricated timestamps, and unauthorized Reality mutations.
 */

import {
  InteractionValidationReport,
  InteractionValidationStatus,
  RealityInteractionSession,
  WorkspaceTransform,
  InteractionTarget,
} from './types';
import { deterministicHash } from './determinism';

export class R8InteractionValidator {
  public static validateTransform(transform: WorkspaceTransform): InteractionValidationReport {
    const t = transform.translation;
    const r = transform.rotation;
    const s = transform.scale;

    for (let i = 0; i < 3; i++) {
      if (!Number.isFinite(t[i]) || Number.isNaN(t[i])) {
        return R8InteractionValidator.fail('NON_FINITE_TRANSFORM', `Non-finite translation[${i}]: ${t[i]}`);
      }
      if (!Number.isFinite(r[i]) || Number.isNaN(r[i])) {
        return R8InteractionValidator.fail('MALFORMED_ROTATION', `Non-finite rotation[${i}]: ${r[i]}`);
      }
      if (!Number.isFinite(s[i]) || Number.isNaN(s[i])) {
        return R8InteractionValidator.fail('NON_FINITE_TRANSFORM', `Non-finite scale[${i}]: ${s[i]}`);
      }
      if (s[i] <= 0) {
        return R8InteractionValidator.fail('INVALID_SCALE', `Zero or negative scale[${i}]: ${s[i]}`);
      }
    }

    return R8InteractionValidator.pass();
  }

  public static validateTarget(target: InteractionTarget | null | undefined): InteractionValidationReport {
    if (!target) {
      return R8InteractionValidator.fail('MISSING_REALITY_REFERENCE', 'Target is null or undefined');
    }
    if (!target.realityObjectId || !target.realityStateId) {
      return R8InteractionValidator.fail('MISSING_REALITY_REFERENCE', 'Missing Reality reference in target');
    }
    if (!target.workspaceObjectId) {
      return R8InteractionValidator.fail('BROKEN_WORKSPACE_REFERENCE', 'Missing workspace object reference');
    }
    return R8InteractionValidator.validateTransform(target.workspaceTransform);
  }

  public static validateSession(session: RealityInteractionSession | null | undefined): InteractionValidationReport {
    if (!session) {
      return R8InteractionValidator.fail('MISSING_REALITY_REFERENCE', 'Session is null');
    }
    if (!session.realityStateId) {
      return R8InteractionValidator.fail('MISSING_REALITY_REFERENCE', 'Missing realityStateId');
    }

    // Duplicate interaction ID check
    const targetIds = Object.keys(session.targets);
    const targetIdSet = new Set(targetIds);
    if (targetIdSet.size !== targetIds.length) {
      return R8InteractionValidator.fail('DUPLICATE_INTERACTION_ID', 'Duplicate target IDs');
    }

    // Orphan selection check
    for (const selId of session.selection.selectedObjectIds) {
      if (!session.targets[selId]) {
        return R8InteractionValidator.fail('ORPHAN_SELECTION', `Selected ID ${selId} not in targets`);
      }
    }

    // Duplicate operation ID check in history
    const opIds = new Set<string>();
    for (const entry of session.history) {
      if (opIds.has(entry.operation.operationId)) {
        return R8InteractionValidator.fail('DUPLICATE_OPERATION_ID', `Duplicate operation: ${entry.operation.operationId}`);
      }
      opIds.add(entry.operation.operationId);
    }

    // History chain validation
    for (let i = 1; i < session.history.length; i++) {
      if (session.history[i].parentEntryId !== session.history[i - 1].entryId) {
        return R8InteractionValidator.fail('INVALID_HISTORY_CHAIN', `Broken chain at index ${i}`);
      }
    }

    // Validate all target transforms
    for (const target of Object.values(session.targets)) {
      const vr = R8InteractionValidator.validateTarget(target);
      if (!vr.isValid) return vr;
    }

    return R8InteractionValidator.pass();
  }

  public static rejectUnauthorizedRealityMutation(
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): InteractionValidationReport {
    const downstreamDomains = [
      'INTERACTION', 'SELECTION', 'TRANSFORM', 'PREVIEW', 'COMMIT',
      'UNDO', 'REDO', 'CAMERA', 'UI', 'RESET', 'CANCEL',
    ];
    if (downstreamDomains.includes(domain) && realityChecksumBefore !== realityChecksumAfter) {
      return R8InteractionValidator.fail(
        'UNAUTHORIZED_REALITY_MUTATION',
        `Domain ${domain} attempted Reality mutation`
      );
    }
    return R8InteractionValidator.pass();
  }

  public static rejectFabricatedTimestamp(timestamp: number): InteractionValidationReport {
    if (timestamp !== 0) {
      return R8InteractionValidator.fail('BROKEN_LINEAGE', `Fabricated timestamp: ${timestamp}`);
    }
    return R8InteractionValidator.pass();
  }

  private static pass(): InteractionValidationReport {
    return Object.freeze({
      status: 'INTERACTION_VALID' as InteractionValidationStatus,
      isValid: true,
      issues: Object.freeze([]),
      reportChecksum: deterministicHash('INTERACTION_VALID'),
    });
  }

  private static fail(status: InteractionValidationStatus, issue: string): InteractionValidationReport {
    return Object.freeze({
      status,
      isValid: false,
      issues: Object.freeze([issue]),
      reportChecksum: deterministicHash(issue),
    });
  }
}
