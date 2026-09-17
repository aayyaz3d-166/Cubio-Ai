/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Multi-Object Engine
 *
 * Implements deterministic multi-object collection management and relationship graph integration.
 */

import {
  RealityObject,
  RealityObjectIdentity,
  RealityObjectType,
  RealityObjectCertainty,
  RealityObjectOrigin,
  RealityObjectProvenance,
  RealityObjectLineage,
  RealityObjectGeometryReference,
  RealityObjectObservationReference,
  RealityObjectCollection,
  RealityMultiObjectExecutionSignature,
} from './types';
import { RealityState } from '../r2/types';
import {
  generateDeterministicObjectId,
  generateDeterministicObjectLineageId,
  computeObjectChecksum,
  computeCollectionChecksum,
  deterministicHash,
} from './determinism';
import { RealityObjectGraph } from './objectGraph';
import { RealityRelationshipEngine } from './relationshipEngine';
import { RealityObjectStateEngine } from './objectStateEngine';
import { RealityMultiObjectCausalityAuditor } from './causality';

export class RealityMultiObjectEngine {
  private objects: Map<string, RealityObject> = new Map();
  private graph: RealityObjectGraph;
  private relationshipEngine: RealityRelationshipEngine;
  private stateEngine: RealityObjectStateEngine;
  private causalityAuditor: RealityMultiObjectCausalityAuditor;
  private realityStateId: string;
  private realityStateChecksum: string;

  constructor(realityStateId = 'RST_DEFAULT', realityStateChecksum = 'CS_R2_DEFAULT') {
    this.realityStateId = realityStateId;
    this.realityStateChecksum = realityStateChecksum;
    this.graph = new RealityObjectGraph();
    this.relationshipEngine = new RealityRelationshipEngine();
    this.stateEngine = new RealityObjectStateEngine();
    this.causalityAuditor = new RealityMultiObjectCausalityAuditor();
  }

  public createObject(
    realityState: RealityState,
    tag: string,
    name: string,
    objectType: RealityObjectType = 'SOLID',
    coordinates?: readonly [number, number, number],
    dimensions?: readonly [number, number, number],
    certainty: RealityObjectCertainty = 'EXACT',
    origin: RealityObjectOrigin = 'OBSERVED',
    creatorId = 'OPERATOR_PRIMARY',
    geometryRef?: RealityObjectGeometryReference,
    obsRefs: readonly RealityObjectObservationReference[] = []
  ): RealityObject {
    const seq = this.objects.size;
    const objectId = generateDeterministicObjectId(realityState.stateId, tag, seq);

    const identity: RealityObjectIdentity = Object.freeze({
      objectId,
      targetRealityId: realityState.lineage.rootStateId,
      targetRealityStateId: realityState.stateId,
      schemaVersion: 'R4_SCHEMA_V1',
    });

    const provenance: RealityObjectProvenance = Object.freeze({
      creatorId,
      source: 'R4_MULTI_OBJECT_ENGINE',
    });

    const lineage: RealityObjectLineage = Object.freeze({
      lineageId: generateDeterministicObjectLineageId(objectId, null, 1),
      rootObjectId: objectId,
      parentObjectId: null,
      version: 1,
      depth: 0,
    });

    const geometryReference: RealityObjectGeometryReference = geometryRef ?? Object.freeze({
      geometryType: objectType,
    });

    const objectChecksum = computeObjectChecksum(
      objectId,
      realityState.stateId,
      realityState.checksum,
      objectType,
      coordinates,
      dimensions,
      certainty,
      origin,
      1
    );

    const obj: RealityObject = Object.freeze({
      identity,
      name,
      objectType,
      coordinates: coordinates ? Object.freeze([...coordinates] as [number, number, number]) : undefined,
      dimensions: dimensions ? Object.freeze([...dimensions] as [number, number, number]) : undefined,
      certainty,
      origin,
      provenance,
      lineage,
      geometryReference,
      observationReferences: Object.freeze([...obsRefs]),
      realityStateChecksum: realityState.checksum,
      objectChecksum,
    });

    this.objects.set(objectId, obj);
    this.graph.addNode(obj);
    this.stateEngine.recordObjectState(obj, coordinates, dimensions, certainty, origin);

    // Causality logging (Delta Reality = 0)
    this.causalityAuditor.logEvent('CREATE_OBJECT', 'OBJECT', realityState.checksum, realityState.checksum);

    return obj;
  }

  public updateObject(
    objectId: string,
    realityState: RealityState,
    newCoordinates?: readonly [number, number, number],
    newDimensions?: readonly [number, number, number],
    certainty?: RealityObjectCertainty,
    origin?: RealityObjectOrigin
  ): RealityObject {
    const prev = this.objects.get(objectId);
    if (!prev) {
      throw new Error(`Object ${objectId} not found`);
    }

    const version = prev.lineage.version + 1;
    const lineage: RealityObjectLineage = Object.freeze({
      lineageId: generateDeterministicObjectLineageId(prev.lineage.rootObjectId, prev.identity.objectId, version),
      rootObjectId: prev.lineage.rootObjectId,
      parentObjectId: prev.identity.objectId,
      version,
      depth: prev.lineage.depth + 1,
    });

    const coords = newCoordinates ?? prev.coordinates;
    const dims = newDimensions ?? prev.dimensions;
    const cert = certainty ?? prev.certainty;
    const orig = origin ?? prev.origin;

    const objectChecksum = computeObjectChecksum(
      prev.identity.objectId,
      realityState.stateId,
      realityState.checksum,
      prev.objectType,
      coords,
      dims,
      cert,
      orig,
      version
    );

    const updated: RealityObject = Object.freeze({
      ...prev,
      coordinates: coords ? Object.freeze([...coords] as [number, number, number]) : undefined,
      dimensions: dims ? Object.freeze([...dims] as [number, number, number]) : undefined,
      certainty: cert,
      origin: orig,
      lineage,
      objectChecksum,
    });

    this.objects.set(objectId, updated);
    this.graph.addNode(updated);
    this.stateEngine.recordObjectState(updated, coords, dims, cert, orig);

    this.causalityAuditor.logEvent('UPDATE_OBJECT', 'OBJECT', realityState.checksum, realityState.checksum);
    return updated;
  }

  public getObject(objectId: string): RealityObject | null {
    return this.objects.get(objectId) ?? null;
  }

  public listObjects(): readonly RealityObject[] {
    return Object.freeze(Array.from(this.objects.values()));
  }

  public removeObject(objectId: string): boolean {
    const existed = this.objects.delete(objectId);
    if (existed) {
      this.graph.removeNode(objectId);
      this.causalityAuditor.logEvent('REMOVE_OBJECT', 'OBJECT', this.realityStateChecksum, this.realityStateChecksum);
    }
    return existed;
  }

  public getGraph(): RealityObjectGraph {
    return this.graph;
  }

  public getRelationshipEngine(): RealityRelationshipEngine {
    return this.relationshipEngine;
  }

  public getStateEngine(): RealityObjectStateEngine {
    return this.stateEngine;
  }

  public getCausalityAuditor(): RealityMultiObjectCausalityAuditor {
    return this.causalityAuditor;
  }

  public getCollection(): RealityObjectCollection {
    const objects = this.listObjects();
    const relationships = this.relationshipEngine.listRelationships();
    const objChecksums = objects.map((o) => o.objectChecksum);
    const relChecksums = relationships.map((r) => r.relationshipChecksum);
    const collectionId = `COLL_${this.realityStateId}`;
    const collectionChecksum = computeCollectionChecksum(collectionId, this.realityStateId, objChecksums, relChecksums);

    return Object.freeze({
      collectionId,
      realityStateId: this.realityStateId,
      objects,
      relationships,
      collectionChecksum,
    });
  }

  public getExecutionSignature(): RealityMultiObjectExecutionSignature {
    const coll = this.getCollection();
    const raw = JSON.stringify([
      this.realityStateChecksum,
      coll.collectionChecksum,
      coll.objects.length,
      coll.relationships.length,
    ]);
    const executionHash = deterministicHash(raw);

    return Object.freeze({
      realityStateChecksum: this.realityStateChecksum,
      collectionChecksum: coll.collectionChecksum,
      objectCount: coll.objects.length,
      relationshipCount: coll.relationships.length,
      executionHash,
    });
  }
}
