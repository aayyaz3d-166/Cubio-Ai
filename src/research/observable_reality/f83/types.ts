/**
 * 3D Memory Studio — Funnel 83
 * Observer Frame Navigation & Reality State Traversal Engine — Types
 *
 * Models navigation through multiple observer frames against deterministic underlying states.
 * Invariant: UNDERLYING STATE REMAINS IMMUTABLE UNDER OBSERVER FRAME CHANGES.
 */

import {
  FullState,
  Observer,
  ObservationBoundary,
  ObservationFrame,
  ObservableRepresentation,
  F82ProjectionType,
  Coordinate3D,
} from '../f82/types';

export interface ObserverFrameConfig {
  readonly frameId: string;
  readonly observerId: string;
  readonly position: Coordinate3D;
  readonly orientation: Coordinate3D;
  readonly projectionType: F82ProjectionType;
  readonly observationBoundary: ObservationBoundary;
  readonly fovDegrees: number;
  readonly focalLength: number;
  readonly sliceW: number;
  readonly sliceThickness: number;
  readonly frameMetadata: Readonly<Record<string, unknown>>;
}

export interface FrameTraversalStep {
  readonly stepIndex: number;
  readonly stateId: string;
  readonly observerFrame: ObserverFrameConfig;
  readonly observableRepresentation: ObservableRepresentation;
  readonly observationFrame: ObservationFrame;
  readonly stepHash: string;
}

export interface FrameTraversalSequence {
  readonly sequenceId: string;
  readonly stateId: string;
  readonly steps: readonly FrameTraversalStep[];
  readonly totalSteps: number;
  readonly traversalHash: string;
}

export interface StateInvarianceReport {
  readonly stateId: string;
  readonly initialHash: string;
  readonly finalHash: string;
  readonly isStateMutated: boolean;
  readonly totalObserverFramesApplied: number;
  readonly verificationTimestamp: number;
}

export interface FrameDifferenceReport {
  readonly frameAId: string;
  readonly frameBId: string;
  readonly observerAId: string;
  readonly observerBId: string;
  readonly positionDelta: Coordinate3D;
  readonly positionDeltaMagnitude: number;
  readonly representationMatches: boolean;
  readonly visibleObjectCountA: number;
  readonly visibleObjectCountB: number;
  readonly changedObjectIds: readonly string[];
  readonly unchangedObjectIds: readonly string[];
}

export interface FrameReversibilityReport {
  readonly experimentId: string;
  readonly stateId: string;
  readonly frame0Id: string;
  readonly frame1Id: string;
  readonly frame0PrimeId: string;
  readonly hashF0: string;
  readonly hashF0Prime: string;
  readonly isReversible: boolean;
  readonly coordinateTolerance: number;
}

export interface MultiObserverView {
  readonly observerId: string;
  readonly frameId: string;
  readonly projectionType: F82ProjectionType;
  readonly representationHash: string;
  readonly frameHash: string;
  readonly visibleCount: number;
}

export interface MultiObserverComparisonReport {
  readonly stateId: string;
  readonly stateHash: string;
  readonly views: readonly MultiObserverView[];
  readonly totalObservers: number;
  readonly allRepresentationsDistinct: boolean;
  readonly pairwiseHashCollisions: number;
}

export type TraversalStepType =
  | 'OBSERVER_FRAME_TRANSITION'
  | 'UNDERLYING_STATE_MUTATION'
  | 'JOINT_STATE_AND_OBSERVER_TRANSITION'
  | 'STATIC_EQUIVALENCE';

export interface TemporalTraversalEvent {
  readonly eventIndex: number;
  readonly stateId: string;
  readonly stateHash: string;
  readonly observerFrameId: string;
  readonly observableFrameHash: string;
  readonly stepType: TraversalStepType;
  readonly underlyingStateChanged: boolean;
  readonly observerChanged: boolean;
  readonly observationChanged: boolean;
}

export interface TemporalTraversalLog {
  readonly logId: string;
  readonly events: readonly TemporalTraversalEvent[];
  readonly totalEvents: number;
  readonly stateTransitionCount: number;
  readonly observerTransitionCount: number;
  readonly logHash: string;
}
