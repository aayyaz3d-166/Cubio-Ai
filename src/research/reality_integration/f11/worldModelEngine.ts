/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Master World Model Engine
 *
 * Master orchestrator for the Spatial World Model & Reasoning Layer:
 * - Upstream state ingestion & live synchronization
 * - Direct relationship derivation & multi-hop inference
 * - Structured & natural language spatial queries
 * - Constraint evaluation & non-destructive planning
 * - Counterfactual simulations
 * - Causality auditing (ΔReality = 0)
 * - Deterministic execution signatures (σ² = 0)
 */

import { R9GeometryEngine } from '../r9/geometryEngine';
import {
  WorldModel,
  WorldEntity,
  SpatialQuery,
  SpatialQueryResult,
  SpatialConstraint,
  ConstraintEvaluation,
  SpatialPlan,
  CounterfactualState,
  WorldModelSnapshot,
  WorldModelValidationReport,
  WorldModelExecutionSignature,
} from './types';
import { F11R9Adapter } from './r9Adapters';
import { F11WorldEntityEngine } from './worldEntityEngine';
import { F11WorldModelFactory } from './worldModel';
import { F11QueryEngine } from './queryEngine';
import { F11SpatialReasoningEngine } from './spatialReasoningEngine';
import { F11CounterfactualEngine } from './counterfactualEngine';
import { F11PlanningEngine } from './planningEngine';
import { F11SpatialMemory } from './spatialMemory';
import { F11SnapshotEngine } from './snapshot';
import { F11SerializationEngine } from './serialization';
import { F11Validator } from './validator';
import { F11CausalityAuditor } from './causality';
import { F11StaleStateEngine } from './staleState';
import { computeExecutionHash, computeInferenceChecksum } from './determinism';

export class WorldModelEngine {
  private readonly modelId: string;
  private readonly r9Adapter: F11R9Adapter;
  private readonly spatialMemory: F11SpatialMemory;
  private readonly causalityAuditor: F11CausalityAuditor;

  private currentModel: WorldModel;
  private version = 1;
  private queryCount = 0;

  constructor(modelId: string, r9Engine: R9GeometryEngine) {
    this.modelId = modelId;
    this.r9Adapter = new F11R9Adapter(r9Engine);
    this.spatialMemory = new F11SpatialMemory();
    this.causalityAuditor = new F11CausalityAuditor(modelId);

    // Initial World Model Ingestion
    this.currentModel = this.buildModelFromR9(1);
    this.spatialMemory.recordModelVersion(this.currentModel);
  }

  public getModelId(): string {
    return this.modelId;
  }

  public getModel(): WorldModel {
    return this.currentModel;
  }

  public getSpatialMemory(): F11SpatialMemory {
    return this.spatialMemory;
  }

  public getCausalityAuditor(): F11CausalityAuditor {
    return this.causalityAuditor;
  }

  /**
   * Re-synchronizes World Model with current R9 workspace state.
   */
  public synchronize(): WorldModel {
    const realityBefore = this.r9Adapter.getBindingState().realityStateChecksum;
    this.version++;
    this.currentModel = this.buildModelFromR9(this.version);
    this.spatialMemory.recordModelVersion(this.currentModel);

    const realityAfter = this.r9Adapter.getBindingState().realityStateChecksum;
    this.causalityAuditor.logEvent('SYNCHRONIZE', 'WORLD_MODEL', realityBefore, realityAfter);

    return this.currentModel;
  }

  /**
   * Executes a spatial query against the active World Model.
   */
  public query(queryText: string): SpatialQueryResult {
    this.queryCount++;
    const realityBefore = this.r9Adapter.getBindingState().realityStateChecksum;

    const parsed = F11QueryEngine.parseQuery(queryText, this.currentModel);
    const result = F11QueryEngine.executeQuery(parsed, this.currentModel);

    const realityAfter = this.r9Adapter.getBindingState().realityStateChecksum;
    this.causalityAuditor.logEvent('QUERY', 'REASONING', realityBefore, realityAfter);

    return result;
  }

  /**
   * Evaluates all active spatial constraints.
   */
  public evaluateConstraints(): readonly ConstraintEvaluation[] {
    return F11SpatialReasoningEngine.evaluateAllConstraints(this.currentModel);
  }

  /**
   * Simulates hypothetical counterfactual position changes in an isolated sandbox.
   */
  public simulateCounterfactual(
    targetEntityId: string,
    hypotheticalPosition: readonly [number, number, number],
    description = ''
  ): CounterfactualState {
    const realityBefore = this.r9Adapter.getBindingState().realityStateChecksum;

    const res = F11CounterfactualEngine.simulatePositionChange(
      this.currentModel,
      targetEntityId,
      hypotheticalPosition,
      description
    );

    const realityAfter = this.r9Adapter.getBindingState().realityStateChecksum;
    this.causalityAuditor.logEvent('COUNTERFACTUAL', 'REASONING', realityBefore, realityAfter);

    return res;
  }

  /**
   * Generates a non-destructive machine-readable spatial plan to achieve a desired relation.
   */
  public planSpatialGoal(
    targetEntityId: string,
    goalRelation: any,
    referenceEntityId: string
  ): SpatialPlan {
    const realityBefore = this.r9Adapter.getBindingState().realityStateChecksum;

    const plan = F11PlanningEngine.planSpatialGoal(
      this.currentModel,
      targetEntityId,
      goalRelation,
      referenceEntityId
    );

    const realityAfter = this.r9Adapter.getBindingState().realityStateChecksum;
    this.causalityAuditor.logEvent('PLANNING', 'REASONING', realityBefore, realityAfter);

    return plan;
  }

  /**
   * Creates an immutable frozen snapshot of the current World Model.
   */
  public createSnapshot(): Readonly<WorldModelSnapshot> {
    const realityBefore = this.r9Adapter.getBindingState().realityStateChecksum;
    const snap = F11SnapshotEngine.createSnapshot(this.currentModel);
    const realityAfter = this.r9Adapter.getBindingState().realityStateChecksum;
    this.causalityAuditor.logEvent('SNAPSHOT', 'WORLD_MODEL', realityBefore, realityAfter);
    return snap;
  }

  /**
   * Validates the integrity of the active World Model.
   */
  public validate(): WorldModelValidationReport {
    return F11Validator.validate(this.currentModel);
  }

  /**
   * Returns deterministic execution signature for telemetry and verification (σ² = 0).
   */
  public getExecutionSignature(): WorldModelExecutionSignature {
    const infChecksum = computeInferenceChecksum(this.currentModel.inferences);
    const execHash = computeExecutionHash(
      this.currentModel.realityChecksum,
      this.currentModel.modelChecksum,
      this.currentModel.graphChecksum,
      infChecksum
    );

    return {
      realityChecksum: this.currentModel.realityChecksum,
      modelChecksum: this.currentModel.modelChecksum,
      graphChecksum: this.currentModel.graphChecksum,
      inferenceChecksum: infChecksum,
      entityCount: Object.keys(this.currentModel.entities).length,
      relationCount: this.currentModel.relations.length,
      inferenceCount: this.currentModel.inferences.length,
      queryCount: this.queryCount,
      modelVersion: this.currentModel.version,
      syncStatus: this.currentModel.syncStatus,
      isCausalityValid: this.causalityAuditor.verifyInvariant(),
      executionHash: execHash,
    };
  }

  private buildModelFromR9(version: number): WorldModel {
    const geos = this.r9Adapter.getGeometries();
    const entities: Record<string, WorldEntity> = {};
    let seq = 0;

    for (const geo of Object.values(geos)) {
      const pos = geo.transform.translation;
      const dims = geo.dimensions;

      const ent = F11WorldEntityEngine.createEntity(
        this.modelId,
        geo.identity.name,
        'OBJECT',
        geo.identity.origin === 'OBSERVED' ? 'OBSERVED' : 'USER_CONSTRUCTED',
        geo.identity.certainty,
        pos,
        dims,
        geo.transform,
        null,
        { geometryId: geo.geometryId, geometryType: geo.identity.geometryType },
        'SYSTEM',
        'R9_INGESTION',
        seq++
      );
      entities[ent.entityId] = ent;
    }

    const binding = this.r9Adapter.getBindingState();
    const syncStatus = F11StaleStateEngine.evaluateSyncStatus(
      { realityChecksum: binding.realityStateChecksum, workspaceChecksum: binding.workspaceChecksum } as any,
      binding.realityStateChecksum,
      binding.workspaceChecksum
    );

    return F11WorldModelFactory.buildWorldModel(
      this.modelId,
      version,
      'STATE_REALITY_CANONICAL',
      'WS_PRODUCTION_STUDIO',
      entities,
      [],
      [],
      binding.realityStateChecksum,
      binding.workspaceChecksum,
      syncStatus
    );
  }
}
