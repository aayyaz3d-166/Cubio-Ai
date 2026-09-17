/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Simultaneous Multi-Observer Observation Synchronization
 *
 * Synchronously projects Reality X through O0, O1, and O2 to generate observable frames F0, F1, and F2.
 */

import { WorkspaceReality } from '../p61/types';
import { P63ObserverSet, P63ObservableFrameSet } from './types';
import { bridgeWorkspaceToP5Reality, bridgeWorkspaceToP5Observer } from '../p61/observationBridge';
import { projectStateToObserver } from '../../observation_reconstruction/p52/multiObserver';

export class MultiObservationSync {
  public static syncAllFrames(
    reality: WorkspaceReality,
    observerSet: P63ObserverSet
  ): P63ObservableFrameSet {
    const p5State = bridgeWorkspaceToP5Reality(reality);

    const p5O0 = bridgeWorkspaceToP5Observer(observerSet.O0);
    const p5O1 = bridgeWorkspaceToP5Observer(observerSet.O1);
    const p5O2 = bridgeWorkspaceToP5Observer(observerSet.O2);

    const f0 = projectStateToObserver(p5State, p5O0);
    const f1 = projectStateToObserver(p5State, p5O1);
    const f2 = projectStateToObserver(p5State, p5O2);

    return Object.freeze({
      F0: f0,
      F1: f1,
      F2: f2,
      f0Checksum: f0.frameChecksum,
      f1Checksum: f1.frameChecksum,
      f2Checksum: f2.frameChecksum,
    });
  }
}
