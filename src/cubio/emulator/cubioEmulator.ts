/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: CubiO Headless Simulation Emulator (v0.1)
 *
 * Implements the programmatic execution controller over:
 * - State Universe Manager (CubiOStateManager)
 * - 369 Mathematical Foundations (Math369, CubiO369Encoder)
 * - 7-Tier Spatial Memory Engine (CubiOMemoryEngine)
 * - Dimension Engine (CubiODimensionEngine)
 * - Trajectory Store (TrajectoryStore)
 * - Knowledge Graph (KnowledgeGraphStore)
 *
 * Invariant: 100% headless, zero React/Three.js DOM coupling, deeply immutable states,
 * and deterministic trajectory tracking for future AI agent training.
 */

import { deterministicHash } from '../state/determinism';
import {
  CubiOState,
  CubiORelationship,
  CubiOStateTransition,
  CubiOStateUniverseSnapshot,
} from '../state/types';
import { CubiOStateFactory, CubiOStateManager } from '../state/stateEngine';
import { CubiOMemoryEngine } from '../memory/memoryEngine';
import { MemoryBlock, MemoryIndexEntry } from '../memory/types';
import { CubiODimensionEngine } from '../dimension/dimensionEngine';
import { DimensionTransitionResult } from '../dimension/types';
import { Math369 } from '../engine_369/math369';
import { CubiO369Encoder } from '../engine_369/encoder369';
import { TrajectoryStore } from '../data_architecture/experience/trajectoryStore';
import { KnowledgeGraphStore } from '../data_architecture/knowledge/knowledgeGraph';
import {
  EmulatorCommand,
  EmulatorCommandType,
  EmulatorResult,
  EmulatorConfig,
  EmulatorHarmonic369Metrics,
  CreateStatePayload,
  ReadStatePayload,
  UpdateStatePayload,
  RemoveStatePayload,
  CreateRelationPayload,
  StoreMemoryPayload,
  SearchMemoryPayload,
  TransformStatePayload,
  GetStateHistoryPayload,
  GetUniverseSnapshotPayload,
} from './types';
import { EmulatorEventEmitter, EmulatorEvents, EmulatorEventListener } from './events';

export class CubiOEmulator {
  private readonly stateUniverse: CubiOStateManager;
  private readonly memoryEngine: CubiOMemoryEngine;
  private readonly trajectoryStore: TrajectoryStore;
  private readonly knowledgeGraph: KnowledgeGraphStore;
  private readonly eventEmitter: EmulatorEventEmitter = new EmulatorEventEmitter();
  private readonly config: Required<EmulatorConfig>;

  constructor(
    config: EmulatorConfig = {},
    customUniverse?: CubiOStateManager,
    customMemory?: CubiOMemoryEngine
  ) {
    this.config = {
      autoRecordTrajectories: config.autoRecordTrajectories ?? true,
      strict369Validation: config.strict369Validation ?? false,
      maxCacheBytes: config.maxCacheBytes ?? 50 * 1024 * 1024,
      defaultDimension: config.defaultDimension ?? 'D3',
    };

    this.stateUniverse = customUniverse || new CubiOStateManager();
    this.memoryEngine = customMemory || new CubiOMemoryEngine({ maxCacheBytes: this.config.maxCacheBytes });
    this.trajectoryStore = new TrajectoryStore();
    this.knowledgeGraph = new KnowledgeGraphStore();
  }

  // ─── EVENT SYSTEM ────────────────────────────────────────────────────────

  public on<K extends keyof EmulatorEvents>(event: K, listener: EmulatorEventListener<K>): () => void {
    return this.eventEmitter.on(event, listener);
  }

  // ─── COMMAND DISPATCHER (UNIFIED ENTRY POINT) ────────────────────────────

  public async execute<T = any, R = any>(command: EmulatorCommand<T>): Promise<EmulatorResult<R>> {
    const startTime = Date.now();
    const commandId = command.commandId || `CMD_${deterministicHash(`${command.type}:${Date.now()}:${Math.random()}`).slice(2, 12)}`;

    try {
      let resultData: any;
      let harmonicMetrics: EmulatorHarmonic369Metrics | undefined;
      const observationDelta: Record<string, any> = {};

      switch (command.type) {
        case 'CREATE_STATE': {
          const payload = command.payload as CreateStatePayload;
          const state = this.executeCreateState(payload, command.actor);
          resultData = state;
          harmonicMetrics = this.computeHarmonicMetrics(state.position, state.properties);
          observationDelta.createdStateId = state.id;
          observationDelta.checksum = state.checksum;
          this.eventEmitter.emit('stateCreated', { state });
          break;
        }

        case 'READ_STATE': {
          const payload = command.payload as ReadStatePayload;
          const state = this.executeReadState(payload.stateId);
          resultData = state;
          harmonicMetrics = this.computeHarmonicMetrics(state.position, state.properties);
          observationDelta.readStateId = state.id;
          break;
        }

        case 'UPDATE_STATE': {
          const payload = command.payload as UpdateStatePayload;
          const { state, prevChecksum } = this.executeUpdateState(payload, command.actor);
          resultData = state;
          harmonicMetrics = this.computeHarmonicMetrics(state.position, state.properties);
          observationDelta.updatedStateId = state.id;
          observationDelta.prevChecksum = prevChecksum;
          observationDelta.newChecksum = state.checksum;
          this.eventEmitter.emit('stateUpdated', { state, previousChecksum: prevChecksum });
          break;
        }

        case 'REMOVE_STATE': {
          const payload = command.payload as RemoveStatePayload;
          this.executeRemoveState(payload.stateId, command.actor, payload.reason);
          resultData = { removedStateId: payload.stateId };
          observationDelta.removedStateId = payload.stateId;
          this.eventEmitter.emit('stateRemoved', { stateId: payload.stateId });
          break;
        }

        case 'CREATE_RELATION': {
          const payload = command.payload as CreateRelationPayload;
          const relation = this.executeCreateRelation(payload);
          resultData = relation;
          observationDelta.relationId = relation.relationshipId;
          this.eventEmitter.emit('relationCreated', {
            relation,
            sourceStateId: payload.sourceStateId,
            targetStateId: payload.targetStateId,
          });
          break;
        }

        case 'STORE_MEMORY': {
          const payload = command.payload as StoreMemoryPayload;
          const indexEntry = this.executeStoreMemory(payload);
          resultData = indexEntry;
          observationDelta.memoryId = indexEntry.memoryId;
          observationDelta.cid = indexEntry.cid;
          this.eventEmitter.emit('memoryStored', { indexEntry });
          break;
        }

        case 'SEARCH_MEMORY': {
          const payload = command.payload as SearchMemoryPayload;
          const blocks = this.executeSearchMemory(payload);
          resultData = blocks;
          observationDelta.matchCount = blocks.length;
          this.eventEmitter.emit('memoryRetrieved', { filter: payload, count: blocks.length });
          break;
        }

        case 'TRANSFORM_STATE': {
          const payload = command.payload as TransformStatePayload;
          const transition = this.executeTransformState(payload);
          resultData = transition;
          observationDelta.transformedStateId = payload.stateId;
          observationDelta.targetDimension = payload.targetDimension;
          this.eventEmitter.emit('stateTransformed', { transition });
          break;
        }

        case 'GET_STATE_HISTORY': {
          const payload = command.payload as GetStateHistoryPayload;
          const history = this.executeGetStateHistory(payload.stateId);
          resultData = history;
          observationDelta.transitionCount = history.length;
          break;
        }

        case 'GET_UNIVERSE_SNAPSHOT': {
          const snapshot = this.executeGetUniverseSnapshot();
          resultData = snapshot;
          observationDelta.totalStateCount = snapshot.totalStateCount;
          observationDelta.universeChecksum = snapshot.universeChecksum;
          break;
        }

        default:
          throw new Error(`Unsupported emulator command type: '${(command as any).type}'`);
      }

      const latencyMs = Math.max(1, Date.now() - startTime);

      // Trajectory Recording
      let trajectoryId: string | undefined;
      if (this.config.autoRecordTrajectories) {
        const traj = this.trajectoryStore.recordTrajectory(
          `EMULATOR_TASK_${command.type}`,
          { commandId, type: command.type, actor: command.actor || 'SYSTEM' },
          [
            {
              stepIndex: 0,
              toolInvoked: `Emulator.${command.type}`,
              parametersDigest: JSON.stringify(command.payload).slice(0, 256),
              observationDelta,
              stepLatencyMs: latencyMs,
            },
          ],
          {
            isSuccess: true,
            ciiScoreAchieved: 1.0,
            physicalDefectsDetected: 0,
            totalExecutionTimeMs: latencyMs,
          }
        );
        trajectoryId = traj.trajectoryId;
      }

      const result: EmulatorResult<R> = Object.freeze({
        success: true,
        commandId,
        commandType: command.type,
        data: resultData as R,
        latencyMs,
        timestamp: Date.now(),
        harmonic369: harmonicMetrics,
        trajectoryId,
      });

      this.eventEmitter.emit('commandCompleted', { result });
      return result;
    } catch (err: any) {
      const latencyMs = Math.max(1, Date.now() - startTime);
      const errorMessage = err?.message || 'Command execution failed';

      // Record failure trajectory
      let trajectoryId: string | undefined;
      if (this.config.autoRecordTrajectories) {
        const traj = this.trajectoryStore.recordTrajectory(
          `EMULATOR_FAIL_${command.type}`,
          { commandId, type: command.type },
          [
            {
              stepIndex: 0,
              toolInvoked: `Emulator.${command.type}`,
              parametersDigest: JSON.stringify(command.payload || {}).slice(0, 256),
              observationDelta: { error: errorMessage },
              stepLatencyMs: latencyMs,
            },
          ],
          {
            isSuccess: false,
            ciiScoreAchieved: 0.0,
            physicalDefectsDetected: 1,
            totalExecutionTimeMs: latencyMs,
          }
        );
        trajectoryId = traj.trajectoryId;
      }

      const failResult: EmulatorResult<R> = Object.freeze({
        success: false,
        commandId,
        commandType: command.type,
        error: errorMessage,
        latencyMs,
        timestamp: Date.now(),
        trajectoryId,
      });

      this.eventEmitter.emit('commandFailed', { command, error: errorMessage });
      return failResult;
    }
  }

  // ─── CONVENIENCE METHOD WRAPPERS ─────────────────────────────────────────

  public async createState(payload: CreateStatePayload, actor = 'SYSTEM'): Promise<EmulatorResult<CubiOState>> {
    return this.execute<CreateStatePayload, CubiOState>({
      commandId: `CMD_CREATE_${deterministicHash(payload.label + Date.now()).slice(2, 10)}`,
      type: 'CREATE_STATE',
      payload,
      timestamp: Date.now(),
      actor,
    });
  }

  public async readState(stateId: string): Promise<EmulatorResult<CubiOState>> {
    return this.execute<ReadStatePayload, CubiOState>({
      commandId: `CMD_READ_${stateId}`,
      type: 'READ_STATE',
      payload: { stateId },
      timestamp: Date.now(),
    });
  }

  public async updateState(payload: UpdateStatePayload, actor = 'SYSTEM'): Promise<EmulatorResult<CubiOState>> {
    return this.execute<UpdateStatePayload, CubiOState>({
      commandId: `CMD_UPD_${payload.stateId}_${Date.now()}`,
      type: 'UPDATE_STATE',
      payload,
      timestamp: Date.now(),
      actor,
    });
  }

  public async removeState(stateId: string, reason?: string, actor = 'SYSTEM'): Promise<EmulatorResult<{ removedStateId: string }>> {
    return this.execute<RemoveStatePayload, { removedStateId: string }>({
      commandId: `CMD_REM_${stateId}`,
      type: 'REMOVE_STATE',
      payload: { stateId, reason },
      timestamp: Date.now(),
      actor,
    });
  }

  public async createRelation(payload: CreateRelationPayload): Promise<EmulatorResult<CubiORelationship>> {
    return this.execute<CreateRelationPayload, CubiORelationship>({
      commandId: `CMD_REL_${payload.sourceStateId}_${payload.targetStateId}`,
      type: 'CREATE_RELATION',
      payload,
      timestamp: Date.now(),
    });
  }

  public async storeMemory<T = any>(payload: StoreMemoryPayload<T>): Promise<EmulatorResult<MemoryIndexEntry>> {
    return this.execute<StoreMemoryPayload<T>, MemoryIndexEntry>({
      commandId: `CMD_STORE_MEM_${payload.key}`,
      type: 'STORE_MEMORY',
      payload,
      timestamp: Date.now(),
    });
  }

  public async searchMemory(filter: SearchMemoryPayload): Promise<EmulatorResult<readonly MemoryBlock[]>> {
    return this.execute<SearchMemoryPayload, readonly MemoryBlock[]>({
      commandId: `CMD_SEARCH_MEM_${Date.now()}`,
      type: 'SEARCH_MEMORY',
      payload: filter,
      timestamp: Date.now(),
    });
  }

  public async transformState(payload: TransformStatePayload): Promise<EmulatorResult<DimensionTransitionResult>> {
    return this.execute<TransformStatePayload, DimensionTransitionResult>({
      commandId: `CMD_TRANS_${payload.stateId}_${payload.targetDimension}`,
      type: 'TRANSFORM_STATE',
      payload,
      timestamp: Date.now(),
    });
  }

  public async getStateHistory(stateId: string): Promise<EmulatorResult<readonly CubiOStateTransition[]>> {
    return this.execute<GetStateHistoryPayload, readonly CubiOStateTransition[]>({
      commandId: `CMD_HIST_${stateId}`,
      type: 'GET_STATE_HISTORY',
      payload: { stateId },
      timestamp: Date.now(),
    });
  }

  public async getUniverseSnapshot(): Promise<EmulatorResult<CubiOStateUniverseSnapshot>> {
    return this.execute<GetUniverseSnapshotPayload, CubiOStateUniverseSnapshot>({
      commandId: `CMD_SNAP_${Date.now()}`,
      type: 'GET_UNIVERSE_SNAPSHOT',
      payload: {},
      timestamp: Date.now(),
    });
  }

  // ─── INTERNAL ENGINE EXECUTORS ───────────────────────────────────────────

  private executeCreateState(payload: CreateStatePayload, actor = 'SYSTEM'): CubiOState {
    const dim = payload.dimension || this.config.defaultDimension;
    const pos = payload.position || [0, 0, 0];

    const state = CubiOStateFactory.createState(
      payload.label,
      pos,
      dim,
      payload.properties || {},
      [],
      [],
      payload.parentId || null,
      [],
      payload.customId
    );

    // Register with State Universe
    this.stateUniverse.registerState(state, actor, 'EMULATOR_CREATE_STATE');

    // Attach to parent in universe if specified
    if (payload.parentId) {
      this.stateUniverse.setParent(state.id, payload.parentId, actor, 'EMULATOR_ATTACH_PARENT');
    }

    // Automatically index in STATE_MEMORY tier
    this.memoryEngine.store('STATE_MEMORY', state.id, state, state.dimension, {
      tags: [state.properties.label || state.id, 'STATE_SNAPSHOT', dim],
      resonanceIndex: Math369.computeDigitalRoot(state.timestamp),
    });

    return this.stateUniverse.getState(state.id)!;
  }

  private executeReadState(stateId: string): CubiOState {
    const state = this.stateUniverse.getState(stateId);
    if (!state) {
      throw new Error(`State '${stateId}' not found in CubiO State Universe.`);
    }
    return state;
  }

  private executeUpdateState(
    payload: UpdateStatePayload,
    actor = 'SYSTEM'
  ): { state: CubiOState; prevChecksum: string } {
    const current = this.executeReadState(payload.stateId);
    const prevChecksum = current.checksum;

    let updated: CubiOState;

    if (payload.properties) {
      updated = this.stateUniverse.updateProperties(
        payload.stateId,
        payload.properties,
        actor,
        payload.reason || 'EMULATOR_UPDATE_PROPERTIES'
      );
    } else {
      updated = current;
    }

    // If position/dimension changed
    if (payload.position || payload.dimension) {
      const nextPos = payload.position || updated.position;
      const nextDim = payload.dimension || updated.dimension;

      const fullUpdate = CubiOStateFactory.createState(
        updated.properties.label || updated.id,
        nextPos,
        nextDim,
        updated.properties,
        updated.relationships,
        updated.memory,
        updated.parent,
        updated.children,
        updated.id
      );

      this.stateUniverse.registerState(fullUpdate, actor, 'EMULATOR_UPDATE_COORDINATES');
      updated = fullUpdate;
    }

    // Update STATE_MEMORY index
    this.memoryEngine.store('STATE_MEMORY', updated.id, updated, updated.dimension, {
      tags: [updated.properties.label || updated.id, 'STATE_SNAPSHOT'],
      resonanceIndex: Math369.computeDigitalRoot(updated.timestamp),
    });

    return { state: updated, prevChecksum };
  }

  private executeRemoveState(stateId: string, actor = 'SYSTEM', reason = 'EMULATOR_REMOVE_STATE'): void {
    // Check state existence
    this.executeReadState(stateId);
    const snap = this.stateUniverse.createSnapshot();
    const newStates: Record<string, CubiOState> = {};

    for (const [id, s] of Object.entries(snap.states)) {
      if (id !== stateId) {
        const cleanedChildren = s.children.filter((c) => c !== stateId);
        const cleanedRels = s.relationships.filter((r) => r.targetStateId !== stateId);
        const cleanedParent = s.parent === stateId ? null : s.parent;

        newStates[id] = CubiOStateFactory.createState(
          s.properties.label || s.id,
          s.position,
          s.dimension,
          s.properties,
          cleanedRels,
          s.memory,
          cleanedParent,
          cleanedChildren,
          s.id
        );
      }
    }

    this.stateUniverse.restoreSnapshot({
      snapshotId: `SNAP_DEL_${Date.now()}`,
      universeChecksum: deterministicHash(`UNIV_DEL:${stateId}:${Date.now()}`),
      timestamp: Date.now(),
      states: newStates,
      rootStateIds: Object.values(newStates).filter((s) => s.parent === null).map((s) => s.id),
      totalStateCount: Object.keys(newStates).length,
      transitionsHistory: snap.transitionsHistory,
    });
  }

  private executeCreateRelation(payload: CreateRelationPayload): CubiORelationship {
    const source = this.executeReadState(payload.sourceStateId);
    const target = this.executeReadState(payload.targetStateId);

    const relId = `REL_${deterministicHash(`${source.id}:${payload.relationType}:${target.id}:${Date.now()}`).slice(2, 12)}`;
    const checksum = deterministicHash(`${relId}:${source.id}:${target.id}:${payload.relationType}`);

    const rel: CubiORelationship = Object.freeze({
      relationshipId: relId,
      targetStateId: target.id,
      type: payload.relationType,
      weight: payload.weight ?? 1.0,
      bidirectional: payload.bidirectional ?? false,
      metadata: payload.metadata,
      checksum,
    });

    // Add relation to source state
    const updatedSource = CubiOStateFactory.createState(
      source.properties.label || source.id,
      source.position,
      source.dimension,
      source.properties,
      [...source.relationships, rel],
      source.memory,
      source.parent,
      source.children,
      source.id
    );

    this.stateUniverse.registerState(updatedSource, 'EMULATOR', 'CREATE_RELATION');

    // If bidirectional, attach inverse to target
    if (payload.bidirectional) {
      const inverseRel: CubiORelationship = Object.freeze({
        relationshipId: `REL_INV_${relId}`,
        targetStateId: source.id,
        type: payload.relationType,
        weight: payload.weight ?? 1.0,
        bidirectional: true,
        metadata: payload.metadata,
        checksum: deterministicHash(`INV:${checksum}`),
      });

      const updatedTarget = CubiOStateFactory.createState(
        target.properties.label || target.id,
        target.position,
        target.dimension,
        target.properties,
        [...target.relationships, inverseRel],
        target.memory,
        target.parent,
        target.children,
        target.id
      );

      this.stateUniverse.registerState(updatedTarget, 'EMULATOR', 'CREATE_INVERSE_RELATION');
    }

    // Register in Knowledge Graph
    this.knowledgeGraph.addRelation(source.id, target.id, payload.relationType as any, payload.weight ?? 1.0);

    return rel;
  }

  private executeStoreMemory(payload: StoreMemoryPayload): MemoryIndexEntry {
    return this.memoryEngine.store(
      payload.tier,
      payload.key,
      payload.payload,
      payload.dimension || this.config.defaultDimension,
      {
        tags: payload.tags,
        resonanceIndex: payload.resonanceIndex,
      }
    );
  }

  private executeSearchMemory(filter: SearchMemoryPayload): readonly MemoryBlock[] {
    const entries = this.memoryEngine.queryIndex(filter);
    const blocks: MemoryBlock[] = [];
    for (const entry of entries) {
      try {
        const block = this.memoryEngine.load(entry.memoryId);
        blocks.push(block);
      } catch {
        blocks.push({
          indexEntry: entry,
          payload: null,
          isLoaded: false,
          accessCount: 0,
          loadedAt: 0,
        });
      }
    }
    return Object.freeze(blocks);
  }

  private executeTransformState(payload: TransformStatePayload): DimensionTransitionResult {
    const state = this.executeReadState(payload.stateId);
    const tensor = CubiODimensionEngine.createTensorState(state.id, state.dimension, state.position, {
      ...state.properties,
    });

    const transition = CubiODimensionEngine.transformTensor(tensor, payload.targetDimension);

    // Apply transformed coordinates back to state universe
    const transformedState = CubiOStateFactory.createState(
      state.properties.label || state.id,
      transition.outputTensor.coordinateVector,
      payload.targetDimension,
      { ...state.properties, dimensionTransition: transition.transitionType },
      state.relationships,
      state.memory,
      state.parent,
      state.children,
      state.id
    );

    this.stateUniverse.registerState(transformedState, 'EMULATOR', `TRANSFORM_${transition.transitionType}`);
    return transition;
  }

  private executeGetStateHistory(stateId: string): readonly CubiOStateTransition[] {
    const snap = this.stateUniverse.createSnapshot();
    return Object.freeze(snap.transitionsHistory.filter((t) => t.stateId === stateId));
  }

  private executeGetUniverseSnapshot(): CubiOStateUniverseSnapshot {
    return this.stateUniverse.createSnapshot();
  }

  // ─── 369 HARMONIC METRICS COMPUTATION ────────────────────────────────────

  private computeHarmonicMetrics(
    position: readonly number[],
    properties: Readonly<Record<string, any>>
  ): EmulatorHarmonic369Metrics {
    const triadicVector = Math369.deriveTriadicHarmonicVector(position, properties);
    const digitalRoot = triadicVector.digitalRoot;
    const isValid369 = digitalRoot === 3 || digitalRoot === 6 || digitalRoot === 9;
    const vortexValue = Math369.getVortexDoublingValue(digitalRoot);

    return Object.freeze({
      digitalRoot,
      isValid369,
      harmonicFlux: triadicVector.fluxRatio,
      vortexSequenceValue: vortexValue,
      triadicVector: [triadicVector.r3, triadicVector.r6, triadicVector.r9] as const,
    });
  }

  // ─── ENGINE ACCESSORS ────────────────────────────────────────────────────

  public getStateUniverse(): CubiOStateManager {
    return this.stateUniverse;
  }

  public getMemoryEngine(): CubiOMemoryEngine {
    return this.memoryEngine;
  }

  public getTrajectoryStore(): TrajectoryStore {
    return this.trajectoryStore;
  }

  public getKnowledgeGraph(): KnowledgeGraphStore {
    return this.knowledgeGraph;
  }
}
