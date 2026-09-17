/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Observation Synchronization Engine
 *
 * Keeps Observable Frame F in lockstep with Workspace Reality X and Observer O.
 */

import { WorkspaceReality, WorkspaceObserver } from '../p61/types';
import { ObservableFrame } from '../../observation_reconstruction/p52/types';
import {
  bridgeWorkspaceToP5Reality,
  bridgeWorkspaceToP5Observer,
} from '../p61/observationBridge';
import { projectStateToObserver } from '../../observation_reconstruction/p52/multiObserver';

export class ObservationSyncEngine {
  public static syncObservableFrame(
    reality: WorkspaceReality,
    observer: WorkspaceObserver
  ): {
    observableFrame: ObservableFrame;
    frameChecksum: string;
    visibleCount: number;
  } {
    const p5State = bridgeWorkspaceToP5Reality(reality);
    const p5Observer = bridgeWorkspaceToP5Observer(observer);
    const observableFrame = projectStateToObserver(p5State, p5Observer);

    return {
      observableFrame,
      frameChecksum: observableFrame.frameChecksum,
      visibleCount: observableFrame.visibleCount,
    };
  }
}
