/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Multi-Observer Workspace & Reality Reconstruction — Type Definitions
 *
 * Types for simultaneous multi-observer viewpoints (O0, O1, O2),
 * observable frame sets (F0, F1, F2), constraint intersections,
 * candidate space reduction, and causal separation.
 *
 * Scientific boundary: This is a computational research model only.
 * No claims about physical reality, higher dimensions, or consciousness.
 */

import {
  WorkspaceObject,
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceDimension,
} from '../p61/types';
import {
  ObservableFrame,
  ObserverFrame,
  ReconstructionIntersection,
  CertaintyLevel,
  PropertyRecoveryStatus,
} from '../../observation_reconstruction/p52/types';

export type ObserverKey = 'O0' | 'O1' | 'O2';
export type FrameKey = 'F0' | 'F1' | 'F2';
export type ObserverCombinationKey = 'F0' | 'F1' | 'F2' | 'F0+F1' | 'F0+F2' | 'F1+F2' | 'F0+F1+F2';

export interface P63ObserverSet {
  readonly O0: WorkspaceObserver;
  readonly O1: WorkspaceObserver;
  readonly O2: WorkspaceObserver;
}

export interface P63ObservableFrameSet {
  readonly F0: ObservableFrame;
  readonly F1: ObservableFrame;
  readonly F2: ObservableFrame;
  readonly f0Checksum: string;
  readonly f1Checksum: string;
  readonly f2Checksum: string;
}

export interface CandidateSpaceState {
  readonly combinationKey: ObserverCombinationKey;
  readonly volume: number;
  readonly reductionRatio: number;
  readonly isUniqueSolution: boolean;
}

export interface P63ReconstructionResult {
  readonly combinationKey: ObserverCombinationKey;
  readonly activeObserverKeys: readonly ObserverKey[];
  readonly totalObjects: number;
  readonly reconstructedCoordinates: ReadonlyArray<{
    readonly recordId: string;
    readonly truePosition: readonly [number, number, number];
    readonly reconstructedPosition: readonly [number | null, number | null, number | null];
    readonly error: number;
    readonly certainty: CertaintyLevel;
  }>;
  readonly accuracyScore: number;
  readonly informationLoss: number;
  readonly informationGain: number;
  readonly certainty: CertaintyLevel;
  readonly isExact: boolean;
  readonly candidateSpace: CandidateSpaceState;
  readonly propertyStatuses: readonly PropertyRecoveryStatus[];
}

export interface P63CausalityAuditRecord {
  readonly stepIndex: number;
  readonly eventType: 'REALITY_MUTATION' | 'OBSERVER_MUTATION' | 'COMBINATION_CHANGE';
  readonly description: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly observerChecksumsBefore: readonly [string, string, string];
  readonly observerChecksumsAfter: readonly [string, string, string];
  readonly frameChecksumsBefore: readonly [string, string, string];
  readonly frameChecksumsAfter: readonly [string, string, string];
  readonly reconstructionAccuracy: number;
  readonly isCausallySeparated: boolean;
}

export interface P63AmbiguityExperimentResult {
  readonly experimentId: string;
  readonly stateNearId: string;
  readonly stateFarId: string;
  readonly f0Identical: boolean;
  readonly f1Identical: boolean;
  readonly f2Identical: boolean;
  readonly singleObserverAmbiguous: boolean;
  readonly multiObserverResolved: boolean;
  readonly remainingAmbiguity: 'NONE' | 'PARTIAL' | 'PERSISTENT';
  readonly description: string;
}

export interface P63PayloadExperimentResult {
  readonly experimentId: string;
  readonly statesDifferInPayload: boolean;
  readonly geometryIdentical: boolean;
  readonly geometryRecoveryRatio: number;
  readonly payloadRecoveryRatio: number;
  readonly classification: 'NON_GEOMETRIC_INFORMATION_UNOBSERVABLE';
  readonly description: string;
}
