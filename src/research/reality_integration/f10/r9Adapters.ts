/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: R9 Read-Only Adapter & Workspace Operation Bridge
 *
 * Provides safe, verified execution bridge from F10 to R9 without duplicating geometry logic.
 * Invariant: ΔReality = 0 for every operation.
 */

import { R9GeometryEngine } from '../r9/geometryEngine';
import {
  WorkspaceGeometry,
  GeometryPrimitiveType,
  BooleanOperationType,
  MeasurementType,
  GeometrySession,
  GeometryBindingState,
} from '../r9/types';
import { R9MeasurementEngine } from '../r9/measurementEngine';
import { R9GeometryEditingEngine } from '../r9/geometryEditing';
import { R9GeometryPreviewEngine } from '../r9/geometryPreview';

export class F10R9Adapter {
  private readonly r9Engine: R9GeometryEngine;

  constructor(r9Engine: R9GeometryEngine) {
    this.r9Engine = r9Engine;
  }

  public getSession(): GeometrySession {
    return this.r9Engine.getSession();
  }

  public getBindingState(): GeometryBindingState {
    return this.r9Engine.getBindingState();
  }

  public getGeometries(): Readonly<Record<string, WorkspaceGeometry>> {
    return this.r9Engine.getSession().geometries;
  }

  public getGeometry(geometryId: string): WorkspaceGeometry | null {
    return this.r9Engine.getSession().geometries[geometryId] ?? null;
  }

  public getSelectedGeometryId(): string | null {
    return this.r9Engine.getSession().selectedGeometryIds[0] ?? null;
  }

  public selectGeometry(geometryId: string): void {
    this.r9Engine.selectGeometry(geometryId);
  }

  public deselect(): void {
    // Empty selection
    this.r9Engine.selectGeometry('');
  }

  // ─── Creation Operations ───
  public createPrimitive(
    type: GeometryPrimitiveType,
    dimensions?: { width?: number; height?: number; depth?: number; radius?: number },
    name?: string
  ): WorkspaceGeometry {
    const dims = {
      width: dimensions?.width ?? 2,
      height: dimensions?.height ?? 2,
      depth: dimensions?.depth ?? 2,
      radius: dimensions?.radius ?? (dimensions?.width ? dimensions.width / 2 : 1),
    };
    return this.r9Engine.createPrimitive(type, dims, undefined, 'WOBJ_F10_AI', null, name);
  }

  // ─── Transform Operations ───
  public translateGeometry(geometryId: string, deltaTranslation: readonly [number, number, number]): void {
    this.r9Engine.applyTransform(geometryId, deltaTranslation, [0, 0, 0], [1, 1, 1]);
  }

  public rotateGeometry(geometryId: string, deltaRotation: readonly [number, number, number]): void {
    this.r9Engine.applyTransform(geometryId, [0, 0, 0], deltaRotation, [1, 1, 1]);
  }

  public scaleGeometry(geometryId: string, factorScale: readonly [number, number, number]): void {
    this.r9Engine.applyTransform(geometryId, [0, 0, 0], [0, 0, 0], factorScale);
  }

  // ─── Boolean Operations ───
  public executeBoolean(type: BooleanOperationType, targetAId: string, targetBId: string): WorkspaceGeometry | null {
    return this.r9Engine.executeBoolean(type, targetAId, targetBId);
  }

  // ─── Mesh Editing Operations ───
  public extrudeFace(geometryId: string, amount = 1.5): WorkspaceGeometry | null {
    const geo = this.getGeometry(geometryId);
    if (!geo || geo.mesh.faces.length === 0) return null;
    const faceId = geo.mesh.faces[0].faceId;
    const result = R9GeometryEditingEngine.extrudeFace(this.r9Engine.getSession().sessionId, geo, faceId, amount);
    this.r9Engine.addGeometryDirect(result);
    return result;
  }

  public subdivide(geometryId: string): WorkspaceGeometry | null {
    const geo = this.getGeometry(geometryId);
    if (!geo) return null;
    const result = R9GeometryEditingEngine.subdivide(this.r9Engine.getSession().sessionId, geo);
    this.r9Engine.addGeometryDirect(result);
    return result;
  }

  public mirror(geometryId: string, axis: 'X' | 'Y' | 'Z'): WorkspaceGeometry | null {
    const geo = this.getGeometry(geometryId);
    if (!geo) return null;
    const result = R9GeometryEditingEngine.mirror(this.r9Engine.getSession().sessionId, geo, axis);
    this.r9Engine.addGeometryDirect(result);
    return result;
  }

  // ─── Measurements ───
  public measureDistance(targetAId: string, targetBId: string): number {
    const geoA = this.getGeometry(targetAId);
    const geoB = this.getGeometry(targetBId);
    if (!geoA || !geoB) return 0;

    const meas = R9MeasurementEngine.measureDistance(
      this.r9Engine.getSession().sessionId,
      geoA.transform.translation,
      geoB.transform.translation,
      [targetAId, targetBId]
    );
    this.r9Engine.addMeasurement(meas);
    return meas.value;
  }

  // ─── Undo / Redo ───
  public undo(): boolean {
    this.r9Engine.undo();
    return true;
  }

  public redo(): boolean {
    this.r9Engine.redo();
    return true;
  }

  // ─── Invariant Verification ───
  public verifyRealityInvariant(): boolean {
    return this.r9Engine.getCausalityAuditor().verifyInvariant();
  }
}
