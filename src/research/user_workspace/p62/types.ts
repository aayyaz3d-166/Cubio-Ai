/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Interactive Reality Editing & Observation — Type Definitions
 *
 * Provides formal types for interactive reality mutations, selection states,
 * transform operations, live observation synchronization, mutation audits,
 * and multi-observer reconstruction tracking.
 *
 * Scientific boundary: This is a computational research model only.
 * No claims about physical reality, higher-dimensional beings, or consciousness.
 */

import {
  WorkspaceObject,
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceDimension,
} from '../p61/types';
import {
  ObservableFrame,
  ReconstructionIntersection,
} from '../../observation_reconstruction/p52/types';

export type InteractiveActionType =
  | 'CREATE'
  | 'SELECT'
  | 'DESELECT'
  | 'MOVE'
  | 'TRANSFORM'
  | 'DUPLICATE'
  | 'DELETE'
  | 'RESET_REALITY'
  | 'RESET_OBSERVER'
  | 'ORBIT'
  | 'PAN'
  | 'ZOOM'
  | 'SWITCH_DIMENSION'
  | 'MULTI_OBSERVER_SELECT'
  | 'RESTORE_SNAPSHOT'
  | 'IMPORT';

export interface RealityMutationRecord {
  readonly mutationId: string;
  readonly action: InteractiveActionType;
  readonly targetObjectId: string | null;
  readonly oldPosition: readonly [number, number, number] | null;
  readonly newPosition: readonly [number, number, number] | null;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly frameChecksumBefore: string;
  readonly frameChecksumAfter: string;
  readonly observerChecksum: string;
  readonly timestamp: number;
  readonly stepIndex: number;
}

export interface InteractiveSelectionState {
  readonly selectedObjectId: string | null;
  readonly multiSelectedIds: readonly string[];
  readonly selectionActive: boolean;
  readonly lastSelectedPosition: readonly [number, number, number] | null;
}

export interface SynchronizedPipelineOutput {
  readonly reality: WorkspaceReality;
  readonly observer: WorkspaceObserver;
  readonly observableFrame: ObservableFrame;
  readonly reconstruction: ReconstructionIntersection;
  readonly realityChecksum: string;
  readonly observerChecksum: string;
  readonly frameChecksum: string;
  readonly isExactReconstruction: boolean;
  readonly informationLoss: number;
}

export interface MultiObserverSelectionConfig {
  readonly activeObserverKeys: readonly ('O0' | 'O1' | 'O2')[];
  readonly combinationKey: 'F0' | 'F0+F1' | 'F0+F2' | 'F1+F2' | 'F0+F1+F2';
}

export interface CausalityVerificationRecord {
  readonly testId: string;
  readonly mutationType: 'REALITY_MUTATION' | 'OBSERVER_MUTATION';
  readonly realityChanged: boolean;
  readonly observerChanged: boolean;
  readonly frameChanged: boolean;
  readonly reconstructionChanged: boolean;
  readonly isCausalityPreserved: boolean;
}
