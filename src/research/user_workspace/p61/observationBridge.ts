/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Observation & Reconstruction Bridge
 *
 * Bridges the user workspace layer to the verified Phase 5 observation & reconstruction pipeline.
 * Converts WorkspaceReality -> UnderlyingState and WorkspaceObserver -> ObserverFrame,
 * then triggers P5.1 projection and P5.2 reconstruction.
 */

import { WorkspaceReality, WorkspaceObserver } from './types';
import {
  UnderlyingState,
  ObserverFrame,
  ObservableFrame,
  ReconstructionIntersection,
} from '../../observation_reconstruction/p52/types';
import { projectStateToObserver } from '../../observation_reconstruction/p52/multiObserver';
import { reconstructFromMultiObservers } from '../../observation_reconstruction/p52/reconstruction';

export interface WorkspaceObservationResult {
  readonly underlyingState: UnderlyingState;
  readonly observerFrame: ObserverFrame;
  readonly observableFrame: ObservableFrame;
  readonly reconstruction: ReconstructionIntersection;
  readonly realityChecksum: string;
  readonly observerChecksum: string;
  readonly frameChecksum: string;
  readonly reconstructionChecksum: string;
  readonly isExactReconstruction: boolean;
  readonly informationLoss: number;
}

export function bridgeWorkspaceToP5Reality(reality: WorkspaceReality): UnderlyingState {
  const records = reality.objects.map((o) => ({
    id: o.id,
    entityName: o.label,
    canonicalPosition: o.position,
    category: o.category,
    color: o.color,
    relationships: [],
    internalPayload: o.internalPayload || 'UNSPECIFIED_PAYLOAD',
  }));

  return Object.freeze({
    stateId: `BRIDGE_${reality.realityId}`,
    checksum: reality.realityChecksum,
    records: Object.freeze(records),
    timestamp: reality.timestamp,
  });
}

export function bridgeWorkspaceToP5Observer(observer: WorkspaceObserver): ObserverFrame {
  return Object.freeze({
    observerId: observer.observerId,
    label: observer.label,
    position: observer.position,
    target: observer.target,
    up: observer.up,
    yaw: observer.yaw,
    pitch: observer.pitch,
    distance: observer.distance,
    fov: observer.fov,
    dimension: observer.dimension,
    viewportWidth: observer.viewportWidth,
    viewportHeight: observer.viewportHeight,
    frameHash: observer.observerChecksum,
  });
}

export function generateWorkspaceObservation(
  reality: WorkspaceReality,
  observer: WorkspaceObserver
): WorkspaceObservationResult {
  const p5State = bridgeWorkspaceToP5Reality(reality);
  const p5Observer = bridgeWorkspaceToP5Observer(observer);

  const observableFrame = projectStateToObserver(p5State, p5Observer);
  const reconstruction = reconstructFromMultiObservers(
    p5State,
    [p5Observer],
    [observableFrame],
    observer.dimension
  );

  return Object.freeze({
    underlyingState: p5State,
    observerFrame: p5Observer,
    observableFrame,
    reconstruction,
    realityChecksum: reality.realityChecksum,
    observerChecksum: observer.observerChecksum,
    frameChecksum: observableFrame.frameChecksum,
    reconstructionChecksum: reconstruction.combinationKey,
    isExactReconstruction: reconstruction.isExact,
    informationLoss: reconstruction.informationLoss,
  });
}
