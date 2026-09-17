/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 2: CubiO State Engine & State Universe Manager
 *
 * Core engine managing the complete CubiOState lifecycle:
 * ID, Position, Dimension, Properties, Relationships, Memory, Timestamp, Parent, Children.
 *
 * Invariant: Deeply frozen immutability, zero-mutation historical tracking, deterministic hashes.
 */

import {
  CubiOState,
  CubiORelationship,
  CubiORelationshipType,
  CubiOMemoryRef,
  CubiODimension,
  CubiOStateTransition,
  CubiOStateUniverseSnapshot,
  CubiOStateDiff,
  CubiOStateValidationReport,
} from './types';
import {
  generateDeterministicStateId,
  generateDeterministicRelationshipId,
  computeRelationshipChecksum,
  computeMemoryRefChecksum,
  computeStateChecksum,
  computeUniverseChecksum,
  deterministicHash,
} from './determinism';

export class CubiOStateFactory {
  public static normalizePositionForDimension(
    position: readonly number[],
    dimension: CubiODimension
  ): readonly number[] {
    const dimLengths: Record<CubiODimension, number> = {
      D0: 1,
      D1: 1,
      D2: 2,
      D3: 3,
      D4: 4,
      D5: 5,
      D6: 6,
      D7: 7,
    };
    const targetLen = dimLengths[dimension];
    const result = new Array(targetLen).fill(0);
    for (let i = 0; i < Math.min(position.length, targetLen); i++) {
      result[i] = position[i];
    }
    return Object.freeze(result);
  }

  public static createState(
    labelOrName: string,
    position: readonly number[],
    dimension: CubiODimension = 'D3',
    properties: Record<string, any> = {},
    relationships: readonly CubiORelationship[] = [],
    memory: readonly CubiOMemoryRef[] = [],
    parent: string | null = null,
    children: readonly string[] = [],
    customId?: string,
    seq = 0
  ): Readonly<CubiOState> {
    const id = customId || generateDeterministicStateId(labelOrName, seq);
    const normalizedPosition = this.normalizePositionForDimension(position, dimension);
    const timestamp = Date.now();

    const frozenProperties = Object.freeze({
      label: labelOrName,
      ...properties,
    });

    const frozenRelationships = Object.freeze([...relationships]);
    const frozenMemory = Object.freeze([...memory]);
    const frozenChildren = Object.freeze([...children]);

    const checksum = computeStateChecksum(
      id,
      normalizedPosition,
      dimension,
      frozenProperties,
      frozenRelationships,
      frozenMemory,
      parent,
      frozenChildren
    );

    const state: CubiOState = {
      id,
      position: normalizedPosition,
      dimension,
      properties: frozenProperties,
      relationships: frozenRelationships,
      memory: frozenMemory,
      timestamp,
      parent,
      children: frozenChildren,
      checksum,
    };

    return Object.freeze(state);
  }

  public static createRelationship(
    sourceStateId: string,
    targetStateId: string,
    type: CubiORelationshipType,
    weight = 1.0,
    bidirectional = false,
    metadata: Record<string, any> = {}
  ): Readonly<CubiORelationship> {
    const relationshipId = generateDeterministicRelationshipId(sourceStateId, targetStateId, type);
    const checksum = computeRelationshipChecksum(targetStateId, type, weight);

    return Object.freeze({
      relationshipId,
      targetStateId,
      type,
      weight,
      bidirectional,
      metadata: Object.freeze({ ...metadata }),
      checksum,
    });
  }

  public static createMemoryRef(
    key: string,
    type: 'EPISODIC' | 'SPATIAL' | 'HOLOGRAPHIC' | 'SYSTEM' = 'SPATIAL',
    resonanceIndex = 9,
    payloadChecksum = ''
  ): Readonly<CubiOMemoryRef> {
    const memoryId = `MREF_${deterministicHash(key + type + resonanceIndex).slice(2, 10)}`;
    const checksum = payloadChecksum || computeMemoryRefChecksum(key, type, resonanceIndex);

    return Object.freeze({
      memoryId,
      key,
      type,
      resonanceIndex,
      timestamp: Date.now(),
      payloadChecksum: checksum,
    });
  }
}

export class CubiOStateManager {
  private states: Map<string, CubiOState> = new Map();
  private transitions: CubiOStateTransition[] = [];
  private transitionCounter = 0;

  constructor(initialStates: readonly CubiOState[] = []) {
    for (const state of initialStates) {
      this.states.set(state.id, state);
    }
  }

  public getState(stateId: string): CubiOState | null {
    return this.states.get(stateId) || null;
  }

  public getAllStates(): readonly CubiOState[] {
    return Object.freeze([...this.states.values()]);
  }

  public getStateMap(): Readonly<Record<string, CubiOState>> {
    const record: Record<string, CubiOState> = {};
    for (const [id, state] of this.states.entries()) {
      record[id] = state;
    }
    return Object.freeze(record);
  }

  public getRootStates(): readonly CubiOState[] {
    const roots: CubiOState[] = [];
    for (const state of this.states.values()) {
      if (state.parent === null) {
        roots.push(state);
      }
    }
    return Object.freeze(roots);
  }

  public getChildren(stateId: string): readonly CubiOState[] {
    const state = this.states.get(stateId);
    if (!state) return Object.freeze([]);
    const result: CubiOState[] = [];
    for (const childId of state.children) {
      const child = this.states.get(childId);
      if (child) result.push(child);
    }
    return Object.freeze(result);
  }

  public getAncestors(stateId: string): readonly CubiOState[] {
    const ancestors: CubiOState[] = [];
    const visited = new Set<string>();
    let curr = this.states.get(stateId);

    while (curr && curr.parent && !visited.has(curr.parent)) {
      visited.add(curr.id);
      const parent = this.states.get(curr.parent);
      if (parent) {
        ancestors.push(parent);
        curr = parent;
      } else {
        break;
      }
    }

    return Object.freeze(ancestors);
  }

  public getDescendants(stateId: string): readonly CubiOState[] {
    const descendants: CubiOState[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      const state = this.states.get(id);
      if (!state || visited.has(id)) return;
      visited.add(id);

      for (const childId of state.children) {
        const child = this.states.get(childId);
        if (child) {
          descendants.push(child);
          traverse(childId);
        }
      }
    };

    traverse(stateId);
    return Object.freeze(descendants);
  }

  // ─── MUTATIONS (IMMUTABLE STATE EVOLUTION) ───

  public registerState(state: CubiOState, actor = 'SYSTEM', reason = 'STATE_REGISTRATION'): CubiOState {
    const prevChecksum = '0x0000000000000000';
    this.states.set(state.id, state);
    this.recordTransition(state.id, prevChecksum, state.checksum, 'REGISTER', actor, reason);
    return state;
  }

  public updateProperties(
    stateId: string,
    newProperties: Record<string, any>,
    actor = 'SYSTEM',
    reason = 'PROPERTIES_UPDATE'
  ): CubiOState {
    const current = this.states.get(stateId);
    if (!current) throw new Error(`State '${stateId}' does not exist.`);

    const updated = CubiOStateFactory.createState(
      newProperties.label || current.properties.label || current.id,
      current.position,
      current.dimension,
      { ...current.properties, ...newProperties },
      current.relationships,
      current.memory,
      current.parent,
      current.children,
      current.id
    );

    this.states.set(stateId, updated);
    this.recordTransition(stateId, current.checksum, updated.checksum, 'UPDATE_PROPERTIES', actor, reason);
    return updated;
  }

  public setParent(
    childId: string,
    parentId: string | null,
    actor = 'SYSTEM',
    reason = 'SET_PARENT'
  ): { child: CubiOState; parent: CubiOState | null } {
    const child = this.states.get(childId);
    if (!child) throw new Error(`Child state '${childId}' not found.`);

    // Remove from old parent if existed
    if (child.parent && child.parent !== parentId) {
      const oldParent = this.states.get(child.parent);
      if (oldParent) {
        const updatedOldParentChildren = oldParent.children.filter((id) => id !== childId);
        const newOldParent = CubiOStateFactory.createState(
          oldParent.properties.label || oldParent.id,
          oldParent.position,
          oldParent.dimension,
          oldParent.properties,
          oldParent.relationships,
          oldParent.memory,
          oldParent.parent,
          updatedOldParentChildren,
          oldParent.id
        );
        this.states.set(oldParent.id, newOldParent);
      }
    }

    // Attach to new parent
    let updatedParent: CubiOState | null = null;
    if (parentId) {
      const parent = this.states.get(parentId);
      if (!parent) throw new Error(`Parent state '${parentId}' not found.`);

      // Check circular loop
      const ancestors = this.getAncestors(parentId);
      if (ancestors.some((a) => a.id === childId) || parentId === childId) {
        throw new Error(`Circular hierarchy detected: cannot set parent '${parentId}' on '${childId}'.`);
      }

      const newChildren = parent.children.includes(childId) ? parent.children : [...parent.children, childId];
      updatedParent = CubiOStateFactory.createState(
        parent.properties.label || parent.id,
        parent.position,
        parent.dimension,
        parent.properties,
        parent.relationships,
        parent.memory,
        parent.parent,
        newChildren,
        parent.id
      );
      this.states.set(parentId, updatedParent);
    }

    // Update child
    const updatedChild = CubiOStateFactory.createState(
      child.properties.label || child.id,
      child.position,
      child.dimension,
      child.properties,
      child.relationships,
      child.memory,
      parentId,
      child.children,
      child.id
    );
    this.states.set(childId, updatedChild);

    this.recordTransition(childId, child.checksum, updatedChild.checksum, 'SET_PARENT', actor, reason);

    return { child: updatedChild, parent: updatedParent };
  }

  public addRelationship(
    sourceStateId: string,
    targetStateId: string,
    type: CubiORelationshipType,
    weight = 1.0,
    bidirectional = false,
    actor = 'SYSTEM'
  ): CubiOState {
    const src = this.states.get(sourceStateId);
    const tgt = this.states.get(targetStateId);
    if (!src || !tgt) throw new Error(`Source '${sourceStateId}' or target '${targetStateId}' not found.`);

    const rel = CubiOStateFactory.createRelationship(sourceStateId, targetStateId, type, weight, bidirectional);
    const existing = src.relationships.filter((r) => !(r.targetStateId === targetStateId && r.type === type));
    const newRels = [...existing, rel];

    const updatedSrc = CubiOStateFactory.createState(
      src.properties.label || src.id,
      src.position,
      src.dimension,
      src.properties,
      newRels,
      src.memory,
      src.parent,
      src.children,
      src.id
    );
    this.states.set(sourceStateId, updatedSrc);

    if (bidirectional) {
      const inverseType: CubiORelationshipType =
        type === 'PARENT_OF' ? 'CHILD_OF' : type === 'CHILD_OF' ? 'PARENT_OF' : type === 'ABOVE' ? 'BELOW' : type === 'BELOW' ? 'ABOVE' : type;
      const invRel = CubiOStateFactory.createRelationship(targetStateId, sourceStateId, inverseType, weight, true);
      const tgtExisting = tgt.relationships.filter((r) => !(r.targetStateId === sourceStateId && r.type === inverseType));
      const updatedTgt = CubiOStateFactory.createState(
        tgt.properties.label || tgt.id,
        tgt.position,
        tgt.dimension,
        tgt.properties,
        [...tgtExisting, invRel],
        tgt.memory,
        tgt.parent,
        tgt.children,
        tgt.id
      );
      this.states.set(targetStateId, updatedTgt);
    }

    this.recordTransition(sourceStateId, src.checksum, updatedSrc.checksum, 'ADD_RELATIONSHIP', actor, `Linked ${type} to ${targetStateId}`);
    return updatedSrc;
  }

  public attachMemory(
    stateId: string,
    memoryRef: CubiOMemoryRef,
    actor = 'SYSTEM'
  ): CubiOState {
    const state = this.states.get(stateId);
    if (!state) throw new Error(`State '${stateId}' not found.`);

    const updated = CubiOStateFactory.createState(
      state.properties.label || state.id,
      state.position,
      state.dimension,
      state.properties,
      state.relationships,
      [...state.memory, memoryRef],
      state.parent,
      state.children,
      state.id
    );
    this.states.set(stateId, updated);
    this.recordTransition(stateId, state.checksum, updated.checksum, 'ATTACH_MEMORY', actor, `Attached memory ${memoryRef.key}`);
    return updated;
  }

  public projectDimension(
    stateId: string,
    targetDimension: CubiODimension,
    actor = 'SYSTEM'
  ): CubiOState {
    const state = this.states.get(stateId);
    if (!state) throw new Error(`State '${stateId}' not found.`);

    const projected = CubiOStateFactory.createState(
      state.properties.label || state.id,
      state.position,
      targetDimension,
      state.properties,
      state.relationships,
      state.memory,
      state.parent,
      state.children,
      state.id
    );
    this.states.set(stateId, projected);
    this.recordTransition(stateId, state.checksum, projected.checksum, 'PROJECT_DIMENSION', actor, `Projected to ${targetDimension}`);
    return projected;
  }

  // ─── GRAPH & PATHFINDING ───

  public findShortestPath(sourceId: string, targetId: string): readonly string[] | null {
    if (sourceId === targetId) return Object.freeze([sourceId]);
    if (!this.states.has(sourceId) || !this.states.has(targetId)) return null;

    const queue: { id: string; path: string[] }[] = [{ id: sourceId, path: [sourceId] }];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      const state = this.states.get(id);
      if (!state) continue;

      const neighbors: string[] = [
        ...state.relationships.map((r) => r.targetStateId),
        ...(state.parent ? [state.parent] : []),
        ...state.children,
      ];

      for (const nextId of neighbors) {
        if (nextId === targetId) {
          return Object.freeze([...path, nextId]);
        }
        if (!visited.has(nextId) && this.states.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }

    return null;
  }

  // ─── SNAPSHOTS, HISTORY & DIFFS ───

  public createSnapshot(): CubiOStateUniverseSnapshot {
    const stateMap = this.getStateMap();
    const universeChecksum = computeUniverseChecksum(stateMap);
    const roots = this.getRootStates().map((s) => s.id);

    return Object.freeze({
      snapshotId: `SNAP_${deterministicHash(universeChecksum + Date.now()).slice(2, 12)}`,
      universeChecksum,
      timestamp: Date.now(),
      states: stateMap,
      rootStateIds: roots,
      totalStateCount: this.states.size,
      transitionsHistory: Object.freeze([...this.transitions]),
    });
  }

  public restoreSnapshot(snapshot: CubiOStateUniverseSnapshot): void {
    this.states.clear();
    for (const [id, state] of Object.entries(snapshot.states)) {
      this.states.set(id, state);
    }
  }

  public diffSnapshot(snapshot: CubiOStateUniverseSnapshot): CubiOStateDiff {
    const current = this.getStateMap();
    const snapStates = snapshot.states;

    const addedStateIds: string[] = [];
    const removedStateIds: string[] = [];
    const modifiedStateIds: string[] = [];

    const allKeys = new Set([...Object.keys(current), ...Object.keys(snapStates)]);

    for (const key of allKeys) {
      if (!snapStates[key] && current[key]) {
        addedStateIds.push(key);
      } else if (snapStates[key] && !current[key]) {
        removedStateIds.push(key);
      } else if (snapStates[key] && current[key]) {
        if (snapStates[key].checksum !== current[key].checksum) {
          modifiedStateIds.push(key);
        }
      }
    }

    const isIdentical = addedStateIds.length === 0 && removedStateIds.length === 0 && modifiedStateIds.length === 0;

    return Object.freeze({
      diffId: `DIFF_${deterministicHash(snapshot.snapshotId + Date.now()).slice(2, 10)}`,
      addedStateIds: Object.freeze(addedStateIds),
      removedStateIds: Object.freeze(removedStateIds),
      modifiedStateIds: Object.freeze(modifiedStateIds),
      relationshipChangesCount: 0,
      isIdentical,
    });
  }

  // ─── VALIDATION ───

  public validateUniverse(): CubiOStateValidationReport {
    const issues: string[] = [];

    for (const state of this.states.values()) {
      // 1. Verify Parent existence
      if (state.parent && !this.states.has(state.parent)) {
        issues.push(`Orphan parent reference in '${state.id}': parent '${state.parent}' does not exist.`);
      }

      // 2. Verify Children existence
      for (const childId of state.children) {
        if (!this.states.has(childId)) {
          issues.push(`Orphan child reference in '${state.id}': child '${childId}' does not exist.`);
        }
      }

      // 3. Verify Target relationships
      for (const rel of state.relationships) {
        if (!this.states.has(rel.targetStateId)) {
          issues.push(`Broken relationship in '${state.id}': target '${rel.targetStateId}' not found.`);
        }
      }

      // 4. Verify Position Coordinates finiteness
      for (const coord of state.position) {
        if (!Number.isFinite(coord)) {
          issues.push(`Non-finite coordinate in state '${state.id}': ${coord}`);
        }
      }
    }

    const universeChecksum = computeUniverseChecksum(this.getStateMap());

    return Object.freeze({
      isValid: issues.length === 0,
      errorCount: issues.length,
      warningCount: 0,
      issues: Object.freeze(issues),
      universeChecksum,
    });
  }

  private recordTransition(
    stateId: string,
    previousChecksum: string,
    nextChecksum: string,
    action: string,
    actor: string,
    deltaDescription: string
  ): void {
    this.transitionCounter++;
    const transition: CubiOStateTransition = {
      transitionId: `TR_${deterministicHash(`${stateId}:${this.transitionCounter}:${nextChecksum}`).slice(2, 10)}`,
      stateId,
      previousChecksum,
      nextChecksum,
      action,
      actor,
      timestamp: Date.now(),
      deltaDescription,
    };
    this.transitions.push(transition);
  }
}
