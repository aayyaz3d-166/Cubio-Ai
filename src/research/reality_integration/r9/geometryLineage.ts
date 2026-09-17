/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Lineage Engine
 *
 * Implements end-to-end multi-hop lineage tracing:
 * Reality → Reality State → Reality Object → Workspace Object → Visual Object → Interaction → Geometry Construction → Geometry Edit → Derived Geometry.
 *
 * Invariant: Every geometry state remains fully auditable and traceable to its root epistemic source.
 */

import { GeometryLineage, WorkspaceGeometry } from './types';
import { generateDeterministicLineageId } from './determinism';

export interface LineageHop {
  readonly hopIndex: number;
  readonly entityType: 'REALITY_STATE' | 'REALITY_OBJECT' | 'WORKSPACE_OBJECT' | 'VISUAL_OBJECT' | 'INTERACTION' | 'GEOMETRY' | 'OPERATION' | 'DERIVED_GEOMETRY';
  readonly entityId: string;
  readonly description: string;
}

export interface LineageTrace {
  readonly lineageId: string;
  readonly geometryId: string;
  readonly rootRealityStateId: string;
  readonly hops: readonly LineageHop[];
  readonly totalHops: number;
  readonly isRootedInReality: boolean;
}

export class R9GeometryLineageEngine {
  /**
   * Constructs an initial lineage record for a newly created geometry.
   */
  public static createLineage(
    sessionId: string,
    geometryId: string,
    realityStateId: string,
    workspaceObjectId: string,
    visualObjectId: string,
    parentGeometryId: string | null = null,
    operationId: string | null = null
  ): GeometryLineage {
    return Object.freeze({
      lineageId: generateDeterministicLineageId(sessionId, geometryId),
      realityStateId,
      workspaceObjectId,
      visualObjectId,
      interactionSessionId: sessionId,
      geometryId,
      parentGeometryId,
      operationId,
      derivedFrom: parentGeometryId ? 'DERIVED_FROM_GEOMETRY' : null,
      version: 0,
    });
  }

  /**
   * Traces multi-hop lineage for a given workspace geometry.
   */
  public static traceLineage(
    geometry: WorkspaceGeometry,
    allGeometries: Readonly<Record<string, WorkspaceGeometry>>
  ): LineageTrace {
    const hops: LineageHop[] = [];
    let hopIndex = 0;

    // 1. Reality State Hop
    if (geometry.lineage.realityStateId) {
      hops.push(Object.freeze({
        hopIndex: hopIndex++,
        entityType: 'REALITY_STATE',
        entityId: geometry.lineage.realityStateId,
        description: 'Authoritative Reality State Reference',
      }));
    }

    // 2. Reality Object Hop
    if (geometry.realityReference?.realityObjectId) {
      hops.push(Object.freeze({
        hopIndex: hopIndex++,
        entityType: 'REALITY_OBJECT',
        entityId: geometry.realityReference.realityObjectId,
        description: `Authoritative Reality Object (${geometry.realityReference.realityCoordinates.join(', ')})`,
      }));
    }

    // 3. Workspace Object Hop
    if (geometry.workspaceObjectId) {
      hops.push(Object.freeze({
        hopIndex: hopIndex++,
        entityType: 'WORKSPACE_OBJECT',
        entityId: geometry.workspaceObjectId,
        description: 'Downstream Workspace Container Object',
      }));
    }

    // 4. Interaction Hop
    hops.push(Object.freeze({
      hopIndex: hopIndex++,
      entityType: 'INTERACTION',
      entityId: geometry.lineage.interactionSessionId,
      description: 'Interaction Session Context',
    }));

    // 5. Parent Geometry Hops (trace backwards)
    const lineageChain: WorkspaceGeometry[] = [geometry];
    let currentGeo = geometry;
    while (currentGeo.lineage.parentGeometryId && allGeometries[currentGeo.lineage.parentGeometryId]) {
      currentGeo = allGeometries[currentGeo.lineage.parentGeometryId];
      lineageChain.unshift(currentGeo);
    }

    for (let i = 0; i < lineageChain.length; i++) {
      const g = lineageChain[i];
      if (g.lineage.operationId) {
        hops.push(Object.freeze({
          hopIndex: hopIndex++,
          entityType: 'OPERATION',
          entityId: g.lineage.operationId,
          description: `Geometry Operation (${g.provenance.reason})`,
        }));
      }
      hops.push(Object.freeze({
        hopIndex: hopIndex++,
        entityType: i === lineageChain.length - 1 ? 'GEOMETRY' : 'DERIVED_GEOMETRY',
        entityId: g.geometryId,
        description: `${g.identity.geometryType} (${g.identity.origin})`,
      }));
    }

    return Object.freeze({
      lineageId: geometry.lineage.lineageId,
      geometryId: geometry.geometryId,
      rootRealityStateId: geometry.lineage.realityStateId,
      hops: Object.freeze(hops),
      totalHops: hops.length,
      isRootedInReality: Boolean(geometry.lineage.realityStateId && geometry.realityReference),
    });
  }
}
