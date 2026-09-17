/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Reconstruction Synchronization Engine
 *
 * Synchronizes single- or multi-observer reconstruction R from observable frames.
 */

import { WorkspaceReality, WorkspaceObserver } from '../p61/types';
import {
  ObservableFrame,
  ObserverFrame,
  ReconstructionIntersection,
} from '../../observation_reconstruction/p52/types';
import {
  bridgeWorkspaceToP5Reality,
  bridgeWorkspaceToP5Observer,
} from '../p61/observationBridge';
import {
  createObserverO0,
  createObserverO1,
  createObserverO2,
  projectStateToObserver,
} from '../../observation_reconstruction/p52/multiObserver';
import { reconstructFromMultiObservers } from '../../observation_reconstruction/p52/reconstruction';

export class ReconstructionSyncEngine {
  public static syncReconstruction(
    reality: WorkspaceReality,
    observer: WorkspaceObserver,
    activeFrame: ObservableFrame
  ): ReconstructionIntersection {
    const p5State = bridgeWorkspaceToP5Reality(reality);
    const p5Observer = bridgeWorkspaceToP5Observer(observer);

    return reconstructFromMultiObservers(
      p5State,
      [p5Observer],
      [activeFrame],
      observer.dimension
    );
  }

  public static syncMultiObserverReconstruction(
    reality: WorkspaceReality,
    dimension = 2,
    combination: 'F0' | 'F0+F1' | 'F0+F2' | 'F1+F2' | 'F0+F1+F2' = 'F0+F1'
  ): {
    reconstruction: ReconstructionIntersection;
    frames: readonly ObservableFrame[];
    observers: readonly ObserverFrame[];
  } {
    const p5State = bridgeWorkspaceToP5Reality(reality);
    const o0 = createObserverO0(dimension as any);
    const o1 = createObserverO1(dimension as any);
    const o2 = createObserverO2(dimension as any);

    const f0 = projectStateToObserver(p5State, o0);
    const f1 = projectStateToObserver(p5State, o1);
    const f2 = projectStateToObserver(p5State, o2);

    let activeObservers: ObserverFrame[] = [];
    let activeFrames: ObservableFrame[] = [];

    switch (combination) {
      case 'F0':
        activeObservers = [o0];
        activeFrames = [f0];
        break;
      case 'F0+F1':
        activeObservers = [o0, o1];
        activeFrames = [f0, f1];
        break;
      case 'F0+F2':
        activeObservers = [o0, o2];
        activeFrames = [f0, f2];
        break;
      case 'F1+F2':
        activeObservers = [o1, o2];
        activeFrames = [f1, f2];
        break;
      case 'F0+F1+F2':
        activeObservers = [o0, o1, o2];
        activeFrames = [f0, f1, f2];
        break;
    }

    const reconstruction = reconstructFromMultiObservers(
      p5State,
      activeObservers,
      activeFrames,
      dimension as any
    );

    return {
      reconstruction,
      frames: Object.freeze(activeFrames),
      observers: Object.freeze(activeObservers),
    };
  }
}
