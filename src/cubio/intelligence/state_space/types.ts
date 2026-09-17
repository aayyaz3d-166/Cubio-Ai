/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F4: CubiO Intelligence State Space Engine (Types & Contracts)
 *
 * Master specification for organizing 369 states into coordinate spaces,
 * topological relationship graphs, and observing immutable state transitions.
 */

import { CubiODimension } from '../../types';
import {
  CubiOState,
  CubiORelationship,
  CubiORelationshipType,
  CubiOStateTransition,
  CubiOStateUniverseSnapshot,
} from '../../state/types';
import { Harmonic369StateEnvelope } from '../encoder_369/types';

export interface StateSpaceNode {
  readonly state: Readonly<CubiOState>;
  readonly harmonic369?: Readonly<Harmonic369StateEnvelope>;
  readonly boundingRadius: number;
  readonly neighborEdgeCount: number;
  readonly lastObservedTimestamp: number;
}

export interface StateTransitionRecord {
  readonly transitionId: string;
  readonly stateId: string;
  readonly previousChecksum: string;
  readonly nextChecksum: string;
  readonly action: string;
  readonly actor: string;
  readonly deltaDescription: string;
  readonly spatialDisplacement: number;
  readonly resonanceDelta: number;
  readonly timestamp: number;
}

export interface StateSpaceQueryFilter {
  readonly dimension?: CubiODimension;
  readonly centerPosition?: readonly number[];
  readonly maxRadius?: number;
  readonly labelQuery?: string;
  readonly relationshipTargetId?: string;
  readonly relationshipType?: CubiORelationshipType;
  readonly limit?: number;
}

export interface StateSpaceUniverseReport {
  readonly totalStateCount: number;
  readonly totalTransitionsObserved: number;
  readonly activeDimensions: readonly CubiODimension[];
  readonly totalRelationships: number;
  readonly universeMerkleChecksum: string;
  readonly timestamp: number;
}

export type {
  CubiOState,
  CubiORelationship,
  CubiORelationshipType,
  CubiOStateTransition,
  CubiOStateUniverseSnapshot,
};
