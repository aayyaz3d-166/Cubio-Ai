/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Serialization Engine
 *
 * Lossless JSON export and import for R9 geometry snapshots and sessions.
 * Conforms to R9_SCHEMA_V1.
 */

import {
  GeometrySnapshot,
  WorkspaceGeometry,
  GeometrySession,
} from './types';

export class R9SerializationEngine {
  public static readonly SCHEMA_VERSION = 'R9_SCHEMA_V1';

  /**
   * Serializes a snapshot to a JSON string.
   */
  public static exportSnapshotToJson(snapshot: GeometrySnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Deserializes a snapshot from a JSON string.
   */
  public static importSnapshotFromJson(json: string): GeometrySnapshot {
    const parsed = JSON.parse(json) as GeometrySnapshot;
    if (parsed.schemaVersion !== this.SCHEMA_VERSION) {
      throw new Error(`Unsupported schema version: ${parsed.schemaVersion}. Expected ${this.SCHEMA_VERSION}`);
    }

    const frozenGeos: Record<string, WorkspaceGeometry> = {};
    for (const [id, geo] of Object.entries(parsed.geometries)) {
      frozenGeos[id] = Object.freeze({
        ...geo,
        identity: Object.freeze({ ...geo.identity }),
        mesh: Object.freeze({
          ...geo.mesh,
          vertices: Object.freeze(geo.mesh.vertices.map((v) => Object.freeze({ ...v }))),
          edges: Object.freeze(geo.mesh.edges.map((e) => Object.freeze({ ...e }))),
          faces: Object.freeze(geo.mesh.faces.map((f) => Object.freeze({ ...f }))),
          topology: Object.freeze({ ...geo.mesh.topology }),
          boundingBox: Object.freeze({ ...geo.mesh.boundingBox }),
        }),
        transform: Object.freeze({ ...geo.transform }),
        dimensions: Object.freeze({ ...geo.dimensions }),
        provenance: Object.freeze({ ...geo.provenance }),
        lineage: Object.freeze({ ...geo.lineage }),
      });
    }

    return Object.freeze({
      snapshotId: parsed.snapshotId,
      geometries: Object.freeze(frozenGeos),
      realityChecksum: parsed.realityChecksum,
      workspaceChecksum: parsed.workspaceChecksum,
      geometryChecksum: parsed.geometryChecksum,
      topologyChecksum: parsed.topologyChecksum,
      schemaVersion: parsed.schemaVersion,
      timestamp: parsed.timestamp,
    });
  }

  /**
   * Serializes a session to a JSON string.
   */
  public static exportSessionToJson(session: GeometrySession): string {
    return JSON.stringify(session, null, 2);
  }

  /**
   * Deserializes a session from JSON.
   */
  public static importSessionFromJson(json: string): GeometrySession {
    const parsed = JSON.parse(json) as GeometrySession;
    return Object.freeze({
      ...parsed,
      geometries: Object.freeze({ ...parsed.geometries }),
      selectedGeometryIds: Object.freeze([...parsed.selectedGeometryIds]),
      history: Object.freeze([...parsed.history]),
      undoStack: Object.freeze([...parsed.undoStack]),
      redoStack: Object.freeze([...parsed.redoStack]),
      measurements: Object.freeze([...parsed.measurements]),
    });
  }
}
