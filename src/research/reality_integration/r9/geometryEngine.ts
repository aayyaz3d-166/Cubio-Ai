/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Master Geometry Engine
 *
 * Orchestrates geometry session lifecycle, creation, editing, boolean operations,
 * measurements, previews, commits, undo/redo, and causality auditing.
 *
 * Epistemic Rule: ΔReality = 0 for all operations.
 */

import {
  GeometrySession,
  WorkspaceGeometry,
  GeometryPrimitiveType,
  GeometryDimensions,
  GeometryTransform,
  RealityGeometryReference,
  BooleanOperationType,
  Measurement,
  GeometryPreview,
  GeometryCommit,
  GeometryValidationReport,
  GeometryExecutionSignature,
  GeometryBindingState,
} from './types';
import { R8GeometryBinding, R8GeometryAdapter } from './r8Adapters';
import { R9GeometryPrimitiveEngine } from './geometryPrimitiveEngine';
import { R9GeometryConstructionEngine } from './geometryConstruction';
import { R9GeometryEditingEngine } from './geometryEditing';
import { R9BooleanEngine } from './booleanEngine';
import { R9MeasurementEngine } from './measurementEngine';
import { R9GeometryPreviewEngine } from './geometryPreview';
import { R9GeometryCommitEngine } from './geometryCommit';
import { R9HistoryEngine } from './history';
import { R9UndoRedoEngine } from './undoRedo';
import { R9StaleStateEngine } from './staleState';
import { R9CausalityAuditor } from './causality';
import { R9GeometryValidator } from './validator';
import { R9SnapshotEngine } from './snapshot';
import {
  computeSessionChecksum,
  generateDeterministicOperationId,
  deterministicHash,
} from './determinism';

export class R9GeometryEngine {
  private _session: GeometrySession;
  private _causalityAuditor: R9CausalityAuditor;
  private _historySnapshots: Record<string, Readonly<Record<string, WorkspaceGeometry>>> = {};
  private _currentRealityChecksum: string;
  private _currentWorkspaceChecksum: string;

  constructor(
    sessionId: string,
    realityStateId: string,
    workspaceId: string,
    interactionSessionId: string,
    realityChecksum: string,
    workspaceChecksum: string
  ) {
    this._causalityAuditor = new R9CausalityAuditor();
    this._currentRealityChecksum = realityChecksum;
    this._currentWorkspaceChecksum = workspaceChecksum;

    const sessionChecksum = computeSessionChecksum(sessionId, 'IDLE', 0, 0);

    this._session = Object.freeze({
      sessionId,
      realityStateId,
      workspaceId,
      interactionSessionId,
      state: 'IDLE',
      geometries: Object.freeze({}),
      selectedGeometryIds: Object.freeze([]),
      activePreview: null,
      history: Object.freeze([]),
      undoStack: Object.freeze([]),
      redoStack: Object.freeze([]),
      measurements: Object.freeze([]),
      sessionChecksum,
    });

    this._causalityAuditor.logEvent('INIT_SESSION', 'GEOMETRY', realityChecksum, realityChecksum);
  }

  /**
   * Initializes session from R8 binding.
   */
  public static fromR8Binding(
    binding: R8GeometryBinding,
    sessionId: string = `SESS_R9_${binding.interactionSessionId}`
  ): R9GeometryEngine {
    const engine = new R9GeometryEngine(
      sessionId,
      binding.realityStateId,
      binding.workspaceId,
      binding.interactionSessionId,
      binding.realityChecksum,
      binding.workspaceChecksum
    );

    // Populate initial geometries from R8 targets if any
    let seq = 0;
    for (const target of Object.values(binding.targets)) {
      const realityRef = R8GeometryAdapter.extractRealityReference(target, binding.realityChecksum);
      const boxGeo = R9GeometryPrimitiveEngine.createBox(
        sessionId,
        2,
        2,
        2,
        target.workspaceObjectId,
        realityRef,
        seq++
      );
      engine.addGeometryDirect(boxGeo);
    }

    return engine;
  }

  public getSession(): GeometrySession {
    return this._session;
  }

  public getCausalityAuditor(): R9CausalityAuditor {
    return this._causalityAuditor;
  }

  /**
   * Directly adds a geometry without history (e.g. at initialization).
   */
  public addGeometryDirect(geometry: WorkspaceGeometry): void {
    const updatedGeos: Record<string, WorkspaceGeometry> = {
      ...this._session.geometries,
      [geometry.geometryId]: geometry,
    };

    this._session = Object.freeze({
      ...this._session,
      geometries: Object.freeze(updatedGeos),
      sessionChecksum: computeSessionChecksum(
        this._session.sessionId,
        this._session.state,
        Object.keys(updatedGeos).length,
        this._session.history.length
      ),
    });
  }

  /**
   * Creates a primitive geometry in the session.
   */
  public createPrimitive(
    type: GeometryPrimitiveType,
    dimensions: GeometryDimensions,
    transform?: GeometryTransform,
    workspaceObjectId: string = '',
    realityRef: RealityGeometryReference | null = null,
    name?: string
  ): WorkspaceGeometry {
    const realityBefore = this._currentRealityChecksum;
    const seq = Object.keys(this._session.geometries).length;
    const geometry = R9GeometryConstructionEngine.createPrimitive(
      this._session.sessionId,
      type,
      dimensions,
      transform,
      workspaceObjectId,
      realityRef,
      'USER_CONSTRUCTED',
      'EXACT',
      name,
      seq
    );

    const stateBefore = Object.keys(this._session.geometries);
    const updatedGeos: Record<string, WorkspaceGeometry> = {
      ...this._session.geometries,
      [geometry.geometryId]: geometry,
    };
    const stateAfter = Object.keys(updatedGeos);

    const opId = generateDeterministicOperationId(this._session.sessionId, `CREATE_${type}`, this._session.history.length);
    const operation = Object.freeze({
      operationId: opId,
      operationType: 'CREATE' as const,
      targetGeometryIds: Object.freeze([geometry.geometryId]),
      resultGeometryId: geometry.geometryId,
      provenance: geometry.provenance,
      timestamp: 0,
      operationChecksum: `OP_CS_${deterministicHash(`${opId}_${geometry.geometryId}`)}`,
    });

    const updatedHistory = R9HistoryEngine.appendHistoryEntry(
      this._session.sessionId,
      operation,
      this._session.history,
      stateBefore,
      stateAfter,
      geometry.provenance
    );

    this._historySnapshots[updatedHistory[updatedHistory.length - 1].entryId] = this._session.geometries;

    this._session = Object.freeze({
      ...this._session,
      state: 'COMMITTED',
      geometries: Object.freeze(updatedGeos),
      selectedGeometryIds: Object.freeze([geometry.geometryId]),
      history: updatedHistory,
      sessionChecksum: computeSessionChecksum(
        this._session.sessionId,
        'COMMITTED',
        stateAfter.length,
        updatedHistory.length
      ),
    });

    this._causalityAuditor.logEvent(`CREATE_${type}`, 'GEOMETRY', realityBefore, this._currentRealityChecksum);
    return geometry;
  }

  /**
   * Applies transform edit to geometry.
   */
  public applyTransform(
    geometryId: string,
    deltaT: readonly [number, number, number] = [0, 0, 0],
    deltaR: readonly [number, number, number] = [0, 0, 0],
    deltaS: readonly [number, number, number] = [1, 1, 1]
  ): WorkspaceGeometry | null {
    const geo = this._session.geometries[geometryId];
    if (!geo) return null;

    const realityBefore = this._currentRealityChecksum;
    const seq = this._session.history.length;
    const updated = R9GeometryEditingEngine.applyTransform(this._session.sessionId, geo, deltaT, deltaR, deltaS, seq);

    const updatedGeos: Record<string, WorkspaceGeometry> = {
      ...this._session.geometries,
      [geometryId]: updated,
    };

    const opId = generateDeterministicOperationId(this._session.sessionId, 'TRANSFORM', seq);
    const operation = Object.freeze({
      operationId: opId,
      operationType: 'TRANSFORM' as const,
      targetGeometryIds: Object.freeze([geometryId]),
      resultGeometryId: geometryId,
      provenance: updated.provenance,
      timestamp: 0,
      operationChecksum: `OP_CS_${deterministicHash(`${opId}_${geometryId}`)}`,
    });

    const updatedHistory = R9HistoryEngine.appendHistoryEntry(
      this._session.sessionId,
      operation,
      this._session.history,
      Object.keys(this._session.geometries),
      Object.keys(updatedGeos),
      updated.provenance
    );

    this._historySnapshots[updatedHistory[updatedHistory.length - 1].entryId] = this._session.geometries;

    this._session = Object.freeze({
      ...this._session,
      geometries: Object.freeze(updatedGeos),
      history: updatedHistory,
      sessionChecksum: computeSessionChecksum(
        this._session.sessionId,
        this._session.state,
        Object.keys(updatedGeos).length,
        updatedHistory.length
      ),
    });

    this._causalityAuditor.logEvent('TRANSFORM', 'GEOMETRY', realityBefore, this._currentRealityChecksum);
    return updated;
  }

  /**
   * Executes Boolean operation between two geometries.
   */
  public executeBoolean(
    type: BooleanOperationType,
    geoAId: string,
    geoBId: string
  ): WorkspaceGeometry | null {
    const geoA = this._session.geometries[geoAId];
    const geoB = this._session.geometries[geoBId];
    if (!geoA || !geoB) return null;

    const realityBefore = this._currentRealityChecksum;
    const seq = this._session.history.length;
    const result = R9BooleanEngine.executeBoolean(this._session.sessionId, type, geoA, geoB, seq);

    const updatedGeos: Record<string, WorkspaceGeometry> = {
      ...this._session.geometries,
      [result.resultGeometry.geometryId]: result.resultGeometry,
    };

    const opId = generateDeterministicOperationId(this._session.sessionId, `BOOLEAN_${type}`, seq);
    const operation = Object.freeze({
      operationId: opId,
      operationType: `BOOLEAN_${type}` as const,
      targetGeometryIds: Object.freeze([geoAId, geoBId]),
      resultGeometryId: result.resultGeometry.geometryId,
      provenance: result.resultGeometry.provenance,
      timestamp: 0,
      operationChecksum: `OP_CS_${deterministicHash(`${opId}_${result.resultGeometry.geometryId}`)}`,
    });

    const updatedHistory = R9HistoryEngine.appendHistoryEntry(
      this._session.sessionId,
      operation,
      this._session.history,
      Object.keys(this._session.geometries),
      Object.keys(updatedGeos),
      result.resultGeometry.provenance
    );

    this._historySnapshots[updatedHistory[updatedHistory.length - 1].entryId] = this._session.geometries;

    this._session = Object.freeze({
      ...this._session,
      geometries: Object.freeze(updatedGeos),
      selectedGeometryIds: Object.freeze([result.resultGeometry.geometryId]),
      history: updatedHistory,
      sessionChecksum: computeSessionChecksum(
        this._session.sessionId,
        this._session.state,
        Object.keys(updatedGeos).length,
        updatedHistory.length
      ),
    });

    this._causalityAuditor.logEvent(`BOOLEAN_${type}`, 'BOOLEAN', realityBefore, this._currentRealityChecksum);
    return result.resultGeometry;
  }

  /**
   * Adds a measurement.
   */
  public addMeasurement(measurement: Measurement): void {
    const realityBefore = this._currentRealityChecksum;
    const updated = Object.freeze([...this._session.measurements, measurement]);

    this._session = Object.freeze({
      ...this._session,
      measurements: updated,
    });

    this._causalityAuditor.logEvent(`MEASURE_${measurement.measurementType}`, 'MEASUREMENT', realityBefore, this._currentRealityChecksum);
  }

  /**
   * Performs undo.
   */
  public undo(): void {
    const realityBefore = this._currentRealityChecksum;
    this._session = R9UndoRedoEngine.undo(this._session, this._historySnapshots);
    this._causalityAuditor.logEvent('UNDO', 'GEOMETRY', realityBefore, this._currentRealityChecksum);
  }

  /**
   * Performs redo.
   */
  public redo(): void {
    const realityBefore = this._currentRealityChecksum;
    this._session = R9UndoRedoEngine.redo(this._session, this._historySnapshots);
    this._causalityAuditor.logEvent('REDO', 'GEOMETRY', realityBefore, this._currentRealityChecksum);
  }

  /**
   * Selection management.
   */
  public selectGeometry(geometryId: string): void {
    const realityBefore = this._currentRealityChecksum;
    this._session = Object.freeze({
      ...this._session,
      selectedGeometryIds: Object.freeze([geometryId]),
    });
    this._causalityAuditor.logEvent('SELECT', 'UI', realityBefore, this._currentRealityChecksum);
  }

  /**
   * Evaluates binding and stale state.
   */
  public getBindingState(): GeometryBindingState {
    const geoChecksum = `CS_GEO_AGGR_${deterministicHash(
      Object.values(this._session.geometries).map((g) => g.geometryChecksum).join('_') || 'EMPTY'
    )}`;

    return R9StaleStateEngine.evaluateBindingState(
      this._session.geometries,
      this._currentRealityChecksum,
      this._currentWorkspaceChecksum,
      geoChecksum
    );
  }

  /**
   * Simulates an authorized Reality mutation (for testing and validation).
   */
  public simulateAuthorizedRealityMutation(newRealityChecksum: string): void {
    this._currentRealityChecksum = newRealityChecksum;
  }

  /**
   * Resyncs geometries to current reality authority.
   */
  public resyncGeometries(): void {
    const updatedGeos: Record<string, WorkspaceGeometry> = {};
    for (const [id, geo] of Object.entries(this._session.geometries)) {
      updatedGeos[id] = R9StaleStateEngine.resyncGeometry(geo, this._currentRealityChecksum);
    }
    this._session = Object.freeze({
      ...this._session,
      geometries: Object.freeze(updatedGeos),
    });
  }

  /**
   * Generates execution signature for determinism testing.
   */
  public getExecutionSignature(): GeometryExecutionSignature {
    const binding = this.getBindingState();
    let totalVerts = 0;
    let totalEdges = 0;
    let totalFaces = 0;

    for (const geo of Object.values(this._session.geometries)) {
      totalVerts += geo.mesh.vertices.length;
      totalEdges += geo.mesh.edges.length;
      totalFaces += geo.mesh.faces.length;
    }

    const topologyChecksum = `CS_TOPO_AGGR_${deterministicHash(
      Object.values(this._session.geometries).map((g) => g.mesh.topology.topologyChecksum).join('_') || 'EMPTY'
    )}`;

    const executionHash = deterministicHash(
      `${binding.realityStateChecksum}_${binding.workspaceChecksum}_${binding.geometryChecksum}_${topologyChecksum}_${Object.keys(this._session.geometries).length}_${totalVerts}_${this._session.history.length}`
    );

    return Object.freeze({
      realityChecksum: binding.realityStateChecksum,
      workspaceChecksum: binding.workspaceChecksum,
      geometryChecksum: binding.geometryChecksum,
      topologyChecksum,
      geometryCount: Object.keys(this._session.geometries).length,
      vertexCount: totalVerts,
      edgeCount: totalEdges,
      faceCount: totalFaces,
      historyCount: this._session.history.length,
      syncStatus: binding.staleState,
      executionHash,
    });
  }
}
