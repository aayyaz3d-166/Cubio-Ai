/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Timeline Coordinator
 *
 * Manages chronological sequence, branch heads, and DAG navigation of workspace versions.
 */

import { WorkspaceVersion, VersionTimeline } from './types';
import { deterministicHash } from './determinism';

export class TimelineCoordinator {
  private timelineMap: Map<string, WorkspaceVersion[]> = new Map(); // workspaceId -> versions

  public appendVersion(version: WorkspaceVersion): void {
    if (!this.timelineMap.has(version.workspaceId)) {
      this.timelineMap.set(version.workspaceId, []);
    }
    this.timelineMap.get(version.workspaceId)!.push(version);
  }

  public getTimeline(workspaceId: string): VersionTimeline {
    const versions = this.timelineMap.get(workspaceId) || [];
    const headVersionId = versions.length > 0 ? versions[versions.length - 1].versionId : '';
    const raw = JSON.stringify([
      workspaceId,
      versions.map((v) => [v.versionId, v.stateChecksum, v.versionType, v.parentVersionId]),
    ]);
    const timelineChecksum = deterministicHash(raw);

    return Object.freeze({
      workspaceId,
      versions: Object.freeze([...versions]),
      headVersionId,
      timelineChecksum,
    });
  }

  public findById(workspaceId: string, versionId: string): WorkspaceVersion | undefined {
    const list = this.timelineMap.get(workspaceId) || [];
    return list.find((v) => v.versionId === versionId);
  }

  public getChildren(workspaceId: string, parentVersionId: string): readonly WorkspaceVersion[] {
    const list = this.timelineMap.get(workspaceId) || [];
    return Object.freeze(list.filter((v) => v.parentVersionId === parentVersionId));
  }

  public getBranches(workspaceId: string): readonly WorkspaceVersion[] {
    const list = this.timelineMap.get(workspaceId) || [];
    return Object.freeze(list.filter((v) => v.versionType === 'BRANCH'));
  }

  public getHead(workspaceId: string): WorkspaceVersion | null {
    const list = this.timelineMap.get(workspaceId) || [];
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  public clear(): void {
    this.timelineMap.clear();
  }
}
