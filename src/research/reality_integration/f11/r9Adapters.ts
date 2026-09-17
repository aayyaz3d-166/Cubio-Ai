/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: R9 Read-Only Adapter
 *
 * Ingests downstream geometry entities, transforms, topology, dimensions, and measurements
 * from R9 without mutating R9 state.
 * Invariant: ΔReality = 0.
 */

import { R9GeometryEngine } from '../r9/geometryEngine';
import {
  WorkspaceGeometry,
  GeometrySession,
  Measurement,
  GeometryBindingState,
} from '../r9/types';

export class F11R9Adapter {
  private readonly r9Engine: R9GeometryEngine;

  constructor(r9Engine: R9GeometryEngine) {
    this.r9Engine = r9Engine;
  }

  public getSession(): GeometrySession {
    return this.r9Engine.getSession();
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

  public getMeasurements(): readonly Measurement[] {
    return this.r9Engine.getSession().measurements;
  }

  public getBindingState(): GeometryBindingState {
    return this.r9Engine.getBindingState();
  }

  public verifyRealityInvariant(): boolean {
    return this.r9Engine.getCausalityAuditor().verifyInvariant();
  }
}
