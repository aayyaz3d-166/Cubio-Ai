/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Visualization Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of R7 scene graphs.
 * Invariant: Snapshots are immutable (Object.isFrozen === true).
 */

import { R7SceneGraph, R7VisualizationSnapshot } from './types';
import {
  generateDeterministicVisualizationSnapshotId,
  deterministicHash,
} from './determinism';

export class VisualizationSnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R7_SNAPSHOT_V1';

  public static createSnapshot(
    sceneGraph: R7SceneGraph,
    realityStateChecksum: string,
    workspaceChecksum: string,
    seq = 0
  ): R7VisualizationSnapshot {
    const snapshotId = generateDeterministicVisualizationSnapshotId(sceneGraph.sceneId, seq);

    const raw = JSON.stringify([
      snapshotId,
      sceneGraph.sceneId,
      realityStateChecksum,
      workspaceChecksum,
      sceneGraph.sceneChecksum,
      VisualizationSnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_R7_${deterministicHash(raw)}`;

    return Object.freeze({
      snapshotId,
      sceneGraph: Object.freeze({
        ...sceneGraph,
        nodes: Object.freeze([...sceneGraph.nodes.map((n) => Object.freeze({ ...n }))]),
        relationships: Object.freeze([...sceneGraph.relationships.map((r) => Object.freeze({ ...r }))]),
        spatialRelations: Object.freeze([...sceneGraph.spatialRelations.map((s) => Object.freeze({ ...s }))]),
        topologyEdges: Object.freeze([...sceneGraph.topologyEdges.map((e) => Object.freeze({ ...e }))]),
      }),
      realityStateChecksum,
      workspaceChecksum,
      sceneChecksum: sceneGraph.sceneChecksum,
      snapshotChecksum,
      schemaVersion: VisualizationSnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }
}
