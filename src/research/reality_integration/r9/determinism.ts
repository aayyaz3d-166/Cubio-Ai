/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Determinism Engine
 *
 * All ID generation and checksum computation. σ²=0.
 * Identical inputs → identical outputs across all cycles.
 */

export function deterministicHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export const generateDeterministicGeometryId = (sessionId: string, type: string, seq: number): string =>
  `GEO_R9_${deterministicHash(`${sessionId}_${type}_${seq}`)}`;

export const generateDeterministicVertexId = (meshId: string, seq: number): string =>
  `VERT_R9_${deterministicHash(`${meshId}_v_${seq}`)}`;

export const generateDeterministicEdgeId = (meshId: string, seq: number): string =>
  `EDGE_R9_${deterministicHash(`${meshId}_e_${seq}`)}`;

export const generateDeterministicFaceId = (meshId: string, seq: number): string =>
  `FACE_R9_${deterministicHash(`${meshId}_f_${seq}`)}`;

export const generateDeterministicMeshId = (geometryId: string, seq: number): string =>
  `MESH_R9_${deterministicHash(`${geometryId}_mesh_${seq}`)}`;

export const generateDeterministicOperationId = (sessionId: string, opType: string, seq: number): string =>
  `OP_R9_${deterministicHash(`${sessionId}_${opType}_${seq}`)}`;

export const generateDeterministicConstructionId = (sessionId: string, seq: number): string =>
  `CONSTR_R9_${deterministicHash(`${sessionId}_constr_${seq}`)}`;

export const generateDeterministicEditId = (geometryId: string, seq: number): string =>
  `EDIT_R9_${deterministicHash(`${geometryId}_edit_${seq}`)}`;

export const generateDeterministicSnapshotId = (sessionId: string, seq: number): string =>
  `SNAP_R9_${deterministicHash(`${sessionId}_snap_${seq}`)}`;

export const generateDeterministicLineageId = (sessionId: string, geometryId: string): string =>
  `LIN_R9_${deterministicHash(`${sessionId}_${geometryId}`)}`;

export const generateDeterministicHistoryEntryId = (sessionId: string, seq: number): string =>
  `HIST_R9_${deterministicHash(`${sessionId}_hist_${seq}`)}`;

export const generateDeterministicCommitId = (geometryId: string, seq: number): string =>
  `COMMIT_R9_${deterministicHash(`${geometryId}_commit_${seq}`)}`;

export const generateDeterministicPreviewId = (sessionId: string, geometryId: string, seq: number): string =>
  `PREV_R9_${deterministicHash(`${sessionId}_${geometryId}_prev_${seq}`)}`;

export const generateDeterministicMeasurementId = (sessionId: string, seq: number): string =>
  `MEAS_R9_${deterministicHash(`${sessionId}_meas_${seq}`)}`;

export const generateDeterministicBooleanId = (sessionId: string, opType: string, seq: number): string =>
  `BOOL_R9_${deterministicHash(`${sessionId}_${opType}_bool_${seq}`)}`;

export const computeVertexChecksum = (position: readonly [number, number, number]): string =>
  `CS_V_${deterministicHash(`${position[0]}_${position[1]}_${position[2]}`)}`;

export const computeEdgeChecksum = (vertexA: string, vertexB: string): string =>
  `CS_E_${deterministicHash(`${vertexA}_${vertexB}`)}`;

export const computeFaceChecksum = (vertexIds: readonly string[], normal: readonly [number, number, number]): string =>
  `CS_F_${deterministicHash(`${vertexIds.join('_')}_${normal[0]}_${normal[1]}_${normal[2]}`)}`;

export const computeMeshChecksum = (vc: number, ec: number, fc: number, vertexData: string): string =>
  `CS_MESH_${deterministicHash(`${vc}_${ec}_${fc}_${vertexData}`)}`;

export const computeTopologyChecksum = (vc: number, ec: number, fc: number, isManifold: boolean): string =>
  `CS_TOPO_${deterministicHash(`${vc}_${ec}_${fc}_${isManifold}`)}`;

export const computeGeometryChecksum = (geoId: string, meshCS: string, transformCS: string): string =>
  `CS_GEO_${deterministicHash(`${geoId}_${meshCS}_${transformCS}`)}`;

export const computeTransformChecksum = (
  t: readonly [number, number, number],
  r: readonly [number, number, number],
  s: readonly [number, number, number]
): string => `CS_XFORM_${deterministicHash(`${t[0]}_${t[1]}_${t[2]}_${r[0]}_${r[1]}_${r[2]}_${s[0]}_${s[1]}_${s[2]}`)}`;

export const computeSessionChecksum = (sessionId: string, state: string, geoCount: number, histCount: number): string =>
  `CS_SESS_${deterministicHash(`${sessionId}_${state}_${geoCount}_${histCount}`)}`;
