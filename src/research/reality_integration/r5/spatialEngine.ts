/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Engine (High-Level Facade)
 *
 * Unified engine coordinating distance, direction, containment, topology,
 * lineage, diff, validation, causality, and snapshots.
 *
 * Core Invariant: Delta Reality = 0.
 * Spatial analysis never mutates authoritative Reality state.
 */

import { RealityObject, RealityObjectCollection } from '../r4/types';
import { RealityState } from '../r2/types';
import {
  SpatialRelation,
  SpatialRelationResult,
  SpatialRelationQuery,
  SpatialTopologyGraph,
  SpatialSnapshot,
  SpatialValidationReport,
  SpatialExecutionSignature,
  SpatialDiff,
  SpatialNode,
} from './types';
import { SpatialRelationshipEngine } from './spatialRelationship';
import { SpatialTopologyEngine, SpatialPathResult } from './spatialTopology';
import { SpatialDiffEngine } from './spatialDiff';
import { SpatialValidator } from './spatialValidator';
import { RealitySpatialCausalityAuditor, R5CausalityEvent } from './causality';
import { RealitySpatialSnapshotEngine } from './snapshot';
import { R4SpatialAdapter } from './r4Adapters';
import { deterministicHash } from './determinism';

export class RealitySpatialEngine {
  private topologyEngine: SpatialTopologyEngine;
  private causalityAuditor: RealitySpatialCausalityAuditor;
  private relations: Map<string, SpatialRelation> = new Map();
  private realityStateId: string;
  private realityStateChecksum: string;

  constructor(realityStateId: string, realityStateChecksum: string) {
    this.realityStateId = realityStateId;
    this.realityStateChecksum = realityStateChecksum;
    this.topologyEngine = new SpatialTopologyEngine(realityStateId);
    this.causalityAuditor = new RealitySpatialCausalityAuditor();
  }

  // ─── Object Registration ───

  public registerObject(obj: RealityObject): SpatialNode {
    const node = R4SpatialAdapter.convertObjectToSpatialNode(obj);
    this.topologyEngine.addNode(node);
    this.causalityAuditor.logEvent(
      'REGISTER_OBJECT',
      'SPATIAL',
      this.realityStateChecksum,
      this.realityStateChecksum
    );
    return node;
  }

  public registerCollection(collection: RealityObjectCollection): readonly SpatialNode[] {
    const nodes = R4SpatialAdapter.convertCollectionToSpatialNodes(collection);
    for (const node of nodes) {
      this.topologyEngine.addNode(node);
    }
    this.causalityAuditor.logEvent(
      'REGISTER_COLLECTION',
      'SPATIAL',
      this.realityStateChecksum,
      this.realityStateChecksum
    );
    return nodes;
  }

  // ─── Spatial Evaluation ───

  public evaluateRelation(sourceObj: RealityObject, targetObj: RealityObject): SpatialRelation {
    const rel = SpatialRelationshipEngine.evaluateRelation(
      sourceObj,
      targetObj,
      this.realityStateId
    );
    this.relations.set(rel.relationId, rel);
    this.topologyEngine.addEdge(rel, true);
    this.causalityAuditor.logEvent(
      'EVALUATE_RELATION',
      'SPATIAL',
      this.realityStateChecksum,
      this.realityStateChecksum
    );
    return rel;
  }

  public queryRelation(query: SpatialRelationQuery): SpatialRelationResult {
    // Check direct
    for (const rel of this.relations.values()) {
      if (
        (rel.sourceObjectId === query.sourceObjectId && rel.targetObjectId === query.targetObjectId) ||
        (rel.sourceObjectId === query.targetObjectId && rel.targetObjectId === query.sourceObjectId)
      ) {
        return Object.freeze({
          query,
          directRelation: rel,
          derivedRelation: null,
          pathFound: true,
          isDirect: true,
          hopCount: 1,
        });
      }
    }

    // Try multi-hop
    const pathResult = this.topologyEngine.findMultiHopPath(query.sourceObjectId, query.targetObjectId);
    return Object.freeze({
      query,
      directRelation: null,
      derivedRelation: null,
      pathFound: pathResult.pathFound,
      isDirect: false,
      hopCount: pathResult.hopCount,
    });
  }

  // ─── Topology ───

  public getTopology(): SpatialTopologyGraph {
    return this.topologyEngine.getGraph();
  }

  public findPath(sourceId: string, targetId: string): SpatialPathResult {
    return this.topologyEngine.findMultiHopPath(sourceId, targetId);
  }

  public detectCycles(): boolean {
    return this.topologyEngine.detectCycles();
  }

  public detectOrphanEdges(): readonly string[] {
    return this.topologyEngine.detectOrphanEdges();
  }

  // ─── Diff ───

  public diffRelations(relA: SpatialRelation, relB: SpatialRelation): SpatialDiff {
    return SpatialDiffEngine.compareRelations(relA, relB);
  }

  // ─── Validation ───

  public validateRelation(
    rel: SpatialRelation,
    objectIds?: ReadonlySet<string>
  ): SpatialValidationReport {
    return SpatialValidator.validateRelation(rel, objectIds);
  }

  public validateTopology(): { isValid: boolean; issues: readonly string[]; reportChecksum: string } {
    return SpatialValidator.validateTopologyGraph(this.getTopology());
  }

  // ─── Causality ───

  public getCausalityAuditor(): RealitySpatialCausalityAuditor {
    return this.causalityAuditor;
  }

  public getCausalityEvents(): readonly R5CausalityEvent[] {
    return this.causalityAuditor.getEvents();
  }

  // ─── Snapshot ───

  public createSnapshot(seq = 0): SpatialSnapshot {
    const relations = Array.from(this.relations.values());
    const topology = this.getTopology();
    return RealitySpatialSnapshotEngine.createSnapshot(
      this.realityStateId,
      this.realityStateChecksum,
      relations,
      topology,
      seq
    );
  }

  // ─── Execution Signature ───

  public computeExecutionSignature(): SpatialExecutionSignature {
    const topology = this.getTopology();
    const raw = JSON.stringify([
      this.realityStateChecksum,
      topology.graphChecksum,
      this.relations.size,
      topology.nodes.length,
    ]);
    const executionHash = `EXEC_R5_${deterministicHash(raw)}`;

    return Object.freeze({
      realityStateChecksum: this.realityStateChecksum,
      topologyChecksum: topology.graphChecksum,
      relationCount: this.relations.size,
      nodeCount: topology.nodes.length,
      executionHash,
    });
  }

  // ─── Listing ───

  public listRelations(): readonly SpatialRelation[] {
    return Object.freeze(Array.from(this.relations.values()));
  }

  public getRelation(relationId: string): SpatialRelation | undefined {
    return this.relations.get(relationId);
  }
}
