/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Observer Fusion, Constraint Manifold & Information Boundary — Type Definitions
 *
 * Types for arbitrary observer fusion, constraint manifold intersections, candidate-space
 * monotonicity, information boundaries (geometric vs observable vs unobservable),
 * and recovery saturation analysis.
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
  CertaintyLevel,
  PropertyRecoveryStatus,
} from '../../observation_reconstruction/p52/types';
import { ObserverKey } from '../p63/types';

export type ExtendedObserverKey = 'O0' | 'O1' | 'O2' | 'O3_REDUNDANT' | 'O4_NOISY';

export type InformationDomainCategory =
  | 'GEOMETRIC_SPATIAL'
  | 'OBSERVABLE_NON_GEOMETRIC'
  | 'UNOBSERVABLE_INTERNAL_PAYLOAD';

export interface ConstraintAxisInterval {
  readonly axis: 'X' | 'Y' | 'Z';
  readonly min: number;
  readonly max: number;
  readonly isConstrained: boolean;
  readonly isExact: boolean;
}

export interface CandidateSpaceState {
  readonly activeObserverCount: number;
  readonly activeKeys: readonly string[];
  readonly volume: number;
  readonly reductionRatio: number;
  readonly isMonotonicallyDecreased: boolean;
  readonly isUniqueSolution: boolean;
}

export interface PropertyInformationBoundary {
  readonly propertyName: string;
  readonly category: InformationDomainCategory;
  readonly trueValue: unknown;
  readonly recoveredValue: unknown;
  readonly isRecoverableInPrinciple: boolean;
  readonly certainty: CertaintyLevel;
  readonly errorMagnitude: number;
}

export interface FusionResult {
  readonly fusionId: string;
  readonly activeObserverKeys: readonly string[];
  readonly totalObjects: number;
  readonly reconstructedCoordinates: ReadonlyArray<{
    readonly recordId: string;
    readonly truePosition: readonly [number, number, number];
    readonly reconstructedPosition: readonly [number | null, number | null, number | null];
    readonly error: number;
    readonly certainty: CertaintyLevel;
    readonly axisIntervals: readonly ConstraintAxisInterval[];
  }>;
  readonly geometricAccuracy: number;
  readonly geometricInformationLoss: number;
  readonly geometricInformationGain: number;
  readonly candidateSpace: CandidateSpaceState;
  readonly informationBoundaries: readonly PropertyInformationBoundary[];
  readonly payloadRecoveryRatio: number;
  readonly isSaturated: boolean;
  readonly redundancyGain: number;
}

export interface ObserverFusionConfig {
  readonly enabledKeys: readonly ExtendedObserverKey[];
  readonly noiseMagnitude: number; // For controlled perturbation experiments
}

export interface FusionCausalityRecord {
  readonly stepIndex: number;
  readonly eventType: 'REALITY_MUTATION' | 'OBSERVER_MUTATION' | 'FUSION_SUBSET_CHANGE' | 'PERTURBATION_INJECTED';
  readonly description: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly affectedObserverKeys: readonly string[];
  readonly unaffectedObserverKeys: readonly string[];
  readonly frameChecksumsBefore: Readonly<Record<string, string>>;
  readonly frameChecksumsAfter: Readonly<Record<string, string>>;
  readonly geometricAccuracy: number;
  readonly isCausallyIsolated: boolean;
}

export interface FusionSnapshot {
  readonly snapshotId: string;
  readonly label: string;
  readonly reality: WorkspaceReality;
  readonly observers: Readonly<Record<string, WorkspaceObserver>>;
  readonly fusionConfig: ObserverFusionConfig;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
}

export interface P64ExportData {
  readonly schemaVersion: '6.4.0';
  readonly reality: WorkspaceReality;
  readonly observers: Readonly<Record<string, WorkspaceObserver>>;
  readonly fusionConfig: ObserverFusionConfig;
  readonly checksum: string;
  readonly timestamp: number;
}
