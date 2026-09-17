/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Observable Reality State Engine
 *
 * Implements deterministic multi-state management, authorized mutations,
 * branching, restoration, history tracking, and diff generation.
 */

import {
  RealityState,
  RealityTransition,
  RealityMutation,
  RealityTransitionType,
  RealityStateDiff,
  RealityStateValidationReport,
  RealityStateEngineResult,
  RealityStateExecutionSignature,
  RealityStateCertainty,
  RealityStateOrigin,
} from './types';
import { RealityStateFactory } from './realityState';
import { RealityStateValidator } from './realityStateValidator';
import { RealityStateDiffEngine } from './stateDiff';
import {
  generateDeterministicTransitionId,
  generateDeterministicMutationId,
  deterministicHash,
} from './determinism';
import { R2CausalityAuditor } from './causality';

export class RealityStateEngine {
  private states: Map<string, RealityState> = new Map();
  private transitions: RealityTransition[] = [];
  private currentStateId: string;
  private rootStateId: string;
  private causalityAuditor: R2CausalityAuditor;

  constructor(
    initialCoordinates: readonly [number, number, number] = RealityStateFactory.CANONICAL_COORDINATES,
    initialDimensions: readonly [number, number, number] = RealityStateFactory.CANONICAL_DIMENSIONS,
    certainty: RealityStateCertainty = 'EXACT',
    origin: RealityStateOrigin = 'OBSERVED'
  ) {
    this.causalityAuditor = new R2CausalityAuditor();
    const rootState = RealityStateFactory.createInitialState(
      'CANONICAL_ROOT',
      initialCoordinates,
      initialDimensions,
      certainty,
      origin
    );

    this.rootStateId = rootState.stateId;
    this.currentStateId = rootState.stateId;
    this.states.set(rootState.stateId, rootState);

    const initialTransition: RealityTransition = Object.freeze({
      transitionId: 'TRN_INITIALIZE',
      transitionType: 'INITIALIZE',
      sourceStateId: null,
      targetStateId: rootState.stateId,
      sourceChecksum: null,
      targetChecksum: rootState.checksum,
      mutation: null,
      description: 'Initialized authoritative Reality root state',
      timestamp: 0,
    });

    this.transitions.push(initialTransition);
    this.causalityAuditor.logEvent(
      'REALITY',
      'REALITY',
      'INITIALIZE_ROOT',
      rootState.checksum,
      rootState.checksum
    );
  }

  public getCurrentState(): RealityState {
    const state = this.states.get(this.currentStateId);
    if (!state) {
      throw new Error(`Current state ${this.currentStateId} not found`);
    }
    return state;
  }

  public getState(stateId: string): RealityState | null {
    return this.states.get(stateId) ?? null;
  }

  public getAllStates(): readonly RealityState[] {
    return Object.freeze(Array.from(this.states.values()));
  }

  public getTransitions(): readonly RealityTransition[] {
    return Object.freeze([...this.transitions]);
  }

  public getCausalityAuditor(): R2CausalityAuditor {
    return this.causalityAuditor;
  }

  public applyAuthorizedMutation(
    newCoordinates: readonly [number, number, number],
    newDimensions: readonly [number, number, number] = this.getCurrentState().dimensions,
    reason = 'AUTHORIZED_REALITY_MUTATION',
    authorizedBy = 'RESEARCH_AUTHORITY',
    certainty: RealityStateCertainty = this.getCurrentState().certainty,
    origin: RealityStateOrigin = this.getCurrentState().origin
  ): RealityStateEngineResult {
    const parent = this.getCurrentState();

    // Validate coordinates
    const [x, y, z] = newCoordinates;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
      const invalidValidation: RealityStateValidationReport = Object.freeze({
        status: 'NON_FINITE_COORDINATES',
        isValid: false,
        issues: Object.freeze(['Non-finite coordinates in mutation']),
        stateId: parent.stateId,
        reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
      });
      return {
        state: parent,
        transition: this.transitions[this.transitions.length - 1],
        validation: invalidValidation,
      };
    }

    const mutationId = generateDeterministicMutationId(parent.stateId, reason);
    const mutation: RealityMutation = Object.freeze({
      mutationId,
      sourceStateId: parent.stateId,
      targetCoordinates: Object.freeze([...newCoordinates] as [number, number, number]),
      targetDimensions: Object.freeze([...newDimensions] as [number, number, number]),
      certainty,
      origin,
      reason,
      authorizedBy,
      timestamp: 0,
    });

    const nextState = RealityStateFactory.createDerivedState(
      parent,
      newCoordinates,
      newDimensions,
      'TRN_MUTATION',
      'AUTHORIZED_MUTATION',
      certainty,
      origin
    );

    const transitionId = generateDeterministicTransitionId(parent.stateId, nextState.stateId, 'AUTHORIZED_MUTATION');
    const transition: RealityTransition = Object.freeze({
      transitionId,
      transitionType: 'AUTHORIZED_MUTATION',
      sourceStateId: parent.stateId,
      targetStateId: nextState.stateId,
      sourceChecksum: parent.checksum,
      targetChecksum: nextState.checksum,
      mutation,
      description: `Applied authorized mutation: ${reason}`,
      timestamp: 0,
    });

    const validation = RealityStateValidator.validateState(nextState);
    if (validation.isValid) {
      this.states.set(nextState.stateId, nextState);
      this.currentStateId = nextState.stateId;
      this.transitions.push(transition);
      this.causalityAuditor.logEvent(
        'REALITY',
        'REALITY',
        'AUTHORIZED_MUTATION',
        parent.checksum,
        nextState.checksum
      );
    }

    return {
      state: nextState,
      transition,
      validation,
    };
  }

  public branchState(
    branchName: string,
    newCoordinates?: readonly [number, number, number],
    newDimensions?: readonly [number, number, number]
  ): RealityStateEngineResult {
    const parent = this.getCurrentState();
    const coords = newCoordinates ?? parent.coordinates;
    const dims = newDimensions ?? parent.dimensions;

    const transitionId = generateDeterministicTransitionId(parent.stateId, `BRANCH_${branchName}`, 'BRANCH');
    const branchState = RealityStateFactory.createDerivedState(
      parent,
      coords,
      dims,
      transitionId,
      'BRANCH',
      parent.certainty,
      parent.origin,
      branchName
    );

    const transition: RealityTransition = Object.freeze({
      transitionId,
      transitionType: 'BRANCH',
      sourceStateId: parent.stateId,
      targetStateId: branchState.stateId,
      sourceChecksum: parent.checksum,
      targetChecksum: branchState.checksum,
      mutation: null,
      description: `Created branch: ${branchName}`,
      timestamp: 0,
    });

    const validation = RealityStateValidator.validateState(branchState);
    if (validation.isValid) {
      this.states.set(branchState.stateId, branchState);
      this.currentStateId = branchState.stateId;
      this.transitions.push(transition);
      this.causalityAuditor.logEvent(
        'REALITY',
        'REALITY',
        `BRANCH_${branchName}`,
        parent.checksum,
        branchState.checksum
      );
    }

    return {
      state: branchState,
      transition,
      validation,
    };
  }

  public restoreState(targetStateId: string): RealityStateEngineResult {
    const targetState = this.states.get(targetStateId);
    if (!targetState) {
      throw new Error(`Target state ${targetStateId} does not exist in registry`);
    }

    const current = this.getCurrentState();
    const transitionId = generateDeterministicTransitionId(current.stateId, targetState.stateId, 'RESTORE');
    const transition: RealityTransition = Object.freeze({
      transitionId,
      transitionType: 'RESTORE',
      sourceStateId: current.stateId,
      targetStateId: targetState.stateId,
      sourceChecksum: current.checksum,
      targetChecksum: targetState.checksum,
      mutation: null,
      description: `Restored active state to ${targetState.stateId}`,
      timestamp: 0,
    });

    this.currentStateId = targetState.stateId;
    this.transitions.push(transition);
    this.causalityAuditor.logEvent(
      'REALITY',
      'REALITY',
      'RESTORE_STATE',
      current.checksum,
      targetState.checksum
    );

    const validation = RealityStateValidator.validateState(targetState);
    return {
      state: targetState,
      transition,
      validation,
    };
  }

  public resetState(): RealityStateEngineResult {
    return this.restoreState(this.rootStateId);
  }

  public getStateLineage(stateId: string): readonly RealityState[] {
    const lineage: RealityState[] = [];
    let curr: RealityState | undefined = this.states.get(stateId);
    while (curr) {
      lineage.unshift(curr);
      if (curr.lineage.parentStateId) {
        curr = this.states.get(curr.lineage.parentStateId);
      } else {
        break;
      }
    }
    return Object.freeze(lineage);
  }

  public compareStates(stateAId: string, stateBId: string): RealityStateDiff {
    const sA = this.states.get(stateAId);
    const sB = this.states.get(stateBId);
    if (!sA || !sB) {
      throw new Error(`One or both states not found: ${stateAId}, ${stateBId}`);
    }
    return RealityStateDiffEngine.compareStates(sA, sB);
  }

  public getStateDiff(stateA: RealityState, stateB: RealityState): RealityStateDiff {
    return RealityStateDiffEngine.compareStates(stateA, stateB);
  }

  public getExecutionSignature(): RealityStateExecutionSignature {
    const root = this.states.get(this.rootStateId);
    const current = this.getCurrentState();
    const rootChecksum = root?.checksum ?? '';
    const currentChecksum = current.checksum;
    const stateCount = this.states.size;
    const transitionCount = this.transitions.length;

    const raw = JSON.stringify([
      rootChecksum,
      currentChecksum,
      stateCount,
      transitionCount,
      Array.from(this.states.keys()),
      this.transitions.map((t) => t.transitionId),
    ]);

    const executionHash = deterministicHash(raw);

    return Object.freeze({
      rootChecksum,
      currentChecksum,
      stateCount,
      transitionCount,
      executionHash,
    });
  }
}
