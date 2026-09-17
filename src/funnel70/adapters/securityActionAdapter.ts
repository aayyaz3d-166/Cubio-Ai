/**
 * 3D Memory Studio — Funnel 70
 * Security Action Adapter (F47 Authority Gate)
 *
 * Strictly blocks RED classified states, clusters, relationships,
 * or payloads from becoming action targets or query targets.
 */

import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';
import { DataClassification } from '../../funnel47/types';

export const SECURITY_REJECTION_REASON = 'SECURITY_BOUNDARY';

export class SecurityActionAdapter {
  public isPermitted(classification: DataClassification): boolean {
    return isPermittedInWorkspace(classification);
  }

  public isTargetPermitted(targetId?: string): boolean {
    if (!targetId) return true;
    const upper = targetId.toUpperCase();
    if (upper.includes('RED') || upper.includes('RESTRICTED') || upper.includes('CONFIDENTIAL')) {
      return false;
    }
    return true;
  }
}
