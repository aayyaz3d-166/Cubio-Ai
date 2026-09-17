/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Serialization Engine
 *
 * Implements deterministic export and import for WorkspaceState and WorkspaceSnapshot.
 * Schema: R6_SCHEMA_V1
 */

import { WorkspaceState, WorkspaceSnapshot } from './types';
import { WorkspaceValidator } from './workspaceValidator';

export class WorkspaceSerializationEngine {
  public static readonly SCHEMA_VERSION = 'R6_SCHEMA_V1';

  public static exportWorkspaceState(ws: WorkspaceState): string {
    return JSON.stringify(ws, null, 2);
  }

  public static importWorkspaceState(json: string): WorkspaceState | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.workspaceId || !parsed.realityBinding) return null;

      const val = WorkspaceValidator.validateWorkspace(parsed);
      if (!val.isValid) return null;

      return Object.freeze({
        workspaceId: parsed.workspaceId,
        realityBinding: Object.freeze({ ...parsed.realityBinding }),
        objects: Object.freeze([...parsed.objects.map((o: any) => Object.freeze({ ...o }))]),
        relationships: Object.freeze([...parsed.relationships.map((r: any) => Object.freeze({ ...r }))]),
        spatialRelations: Object.freeze([...parsed.spatialRelations.map((s: any) => Object.freeze({ ...s }))]),
        topology: parsed.topology ? Object.freeze({ ...parsed.topology }) : null,
        selection: Object.freeze({ ...parsed.selection }),
        camera: Object.freeze({
          ...parsed.camera,
          position: Object.freeze([...parsed.camera.position]),
          target: Object.freeze([...parsed.camera.target]),
        }),
        uiPanels: Object.freeze({ ...parsed.uiPanels }),
        workspaceChecksum: parsed.workspaceChecksum,
        version: parsed.version,
      });
    } catch {
      return null;
    }
  }

  public static exportSnapshot(snapshot: WorkspaceSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static importSnapshot(json: string): WorkspaceSnapshot | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.schemaVersion !== 'R6_SNAPSHOT_V1') return null;
      if (!parsed.snapshotId || !parsed.workspaceChecksum) return null;

      const ws = WorkspaceSerializationEngine.importWorkspaceState(
        JSON.stringify(parsed.workspaceState)
      );
      if (!ws) return null;

      return Object.freeze({
        snapshotId: parsed.snapshotId,
        workspaceState: ws,
        realityStateChecksum: parsed.realityStateChecksum,
        workspaceChecksum: parsed.workspaceChecksum,
        snapshotChecksum: parsed.snapshotChecksum ?? '',
        schemaVersion: WorkspaceSnapshotEngine.SCHEMA_VERSION,
        timestamp: parsed.timestamp ?? 0,
      });
    } catch {
      return null;
    }
  }
}
import { WorkspaceSnapshotEngine } from './workspaceSnapshot';
