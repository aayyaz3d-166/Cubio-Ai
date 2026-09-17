/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Manager Engine
 *
 * Coordinates creation, retrieval, and lineage linking of immutable Workspace versions.
 */

import { PersonalSpace } from '../p68/types';
import { WorkspaceVersion, VersionType, CanonicalWorkspaceState } from './types';
import { StateCanonicalizer } from './stateCanonicalizer';
import {
  generateDeterministicVersionId,
  generateDeterministicLineageId,
} from './determinism';

export class VersionManager {
  private versionsMap: Map<string, WorkspaceVersion> = new Map();
  private workspaceVersions: Map<string, string[]> = new Map(); // workspaceId -> versionIds

  public createVersion(
    space: PersonalSpace,
    versionType: VersionType = 'SAVE',
    parentVersionId: string | null = null,
    changeSummary = 'Saved state version',
    workspaceId = 'WS_DEFAULT_01',
    forced = false
  ): { version: WorkspaceVersion; isDuplicate: boolean } {
    const canonicalState = StateCanonicalizer.canonicalize(space, workspaceId);

    const existingIds = this.workspaceVersions.get(workspaceId) || [];
    const latestVersion = existingIds.length > 0 ? this.versionsMap.get(existingIds[existingIds.length - 1]) : null;

    // Check duplicate state unless forced
    if (!forced && latestVersion && latestVersion.stateChecksum === canonicalState.stateChecksum) {
      return { version: latestVersion, isDuplicate: true };
    }

    const versionIndex = existingIds.length;
    const versionId = generateDeterministicVersionId(workspaceId, versionIndex, versionType);
    const parentLineage = latestVersion ? latestVersion.lineageId : null;
    const lineageId = generateDeterministicLineageId(workspaceId, parentLineage, versionId);

    const version: WorkspaceVersion = Object.freeze({
      versionId,
      workspaceId,
      spaceId: space.spaceId,
      parentVersionId: parentVersionId !== null ? parentVersionId : latestVersion ? latestVersion.versionId : null,
      versionType,
      versionIndex,
      stateChecksum: canonicalState.stateChecksum,
      lineageId,
      statePayload: canonicalState,
      changeSummary,
      createdAt: 0,
      schemaVersion: '6.13.0',
    });

    this.versionsMap.set(versionId, version);
    if (!this.workspaceVersions.has(workspaceId)) {
      this.workspaceVersions.set(workspaceId, []);
    }
    this.workspaceVersions.get(workspaceId)!.push(versionId);

    return { version, isDuplicate: false };
  }

  public getVersion(versionId: string): WorkspaceVersion | undefined {
    return this.versionsMap.get(versionId);
  }

  public getLatestVersion(workspaceId: string): WorkspaceVersion | null {
    const list = this.workspaceVersions.get(workspaceId) || [];
    if (list.length === 0) return null;
    return this.versionsMap.get(list[list.length - 1]) || null;
  }

  public listVersions(workspaceId: string): readonly WorkspaceVersion[] {
    const list = this.workspaceVersions.get(workspaceId) || [];
    return Object.freeze(list.map((id) => this.versionsMap.get(id)!).filter(Boolean));
  }

  public getParent(versionId: string): WorkspaceVersion | null {
    const v = this.versionsMap.get(versionId);
    if (!v || !v.parentVersionId) return null;
    return this.versionsMap.get(v.parentVersionId) || null;
  }

  public getLineage(versionId: string): readonly string[] {
    const ancestry: string[] = [];
    let curr = this.versionsMap.get(versionId);
    while (curr) {
      ancestry.unshift(curr.versionId);
      if (!curr.parentVersionId) break;
      curr = this.versionsMap.get(curr.parentVersionId);
    }
    return Object.freeze(ancestry);
  }

  public deleteVersion(versionId: string): boolean {
    const v = this.versionsMap.get(versionId);
    if (!v) return false;
    this.versionsMap.delete(versionId);
    const list = this.workspaceVersions.get(v.workspaceId);
    if (list) {
      this.workspaceVersions.set(
        v.workspaceId,
        list.filter((id) => id !== versionId)
      );
    }
    return true;
  }

  public clear(): void {
    this.versionsMap.clear();
    this.workspaceVersions.clear();
  }
}
