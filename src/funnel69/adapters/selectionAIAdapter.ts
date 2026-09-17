/**
 * 3D Memory Studio — Funnel 69
 * Selection AI Adapter (Single Selection Authority Synchronizer)
 */

import { DataClassification } from '../../funnel47/types';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';

export class SelectionAIAdapter {
  private selectedStateId: string | null = null;
  private selectedClassification: DataClassification = 'GREEN';

  public getSelectedStateId(): string | null {
    return this.selectedStateId;
  }

  public getSelectedClassification(): DataClassification {
    return this.selectedClassification;
  }

  public setSelectedStateId(
    stateId: string | null,
    classification: DataClassification = 'GREEN'
  ): boolean {
    if (!stateId) {
      this.selectedStateId = null;
      return true;
    }
    if (!isPermittedInWorkspace(classification) || stateId.toUpperCase().includes('RED')) {
      return false; // Strictly blocked
    }
    this.selectedStateId = stateId;
    this.selectedClassification = classification;
    return true;
  }

  public clear(): void {
    this.selectedStateId = null;
    this.selectedClassification = 'GREEN';
  }
}
