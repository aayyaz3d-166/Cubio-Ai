/**
 * 3D Memory Studio — Funnel 83
 * Observer Frame Traversal Sequence Builder
 */

import { FrameTraversalSequence, FrameTraversalStep, ObserverFrameConfig } from '../types';
import { FullState } from '../../f82/types';
import { ObservableProjectionEngine } from '../../f82/projection/observableProjectionEngine';
import { toF82Observer } from './observerFrame';

export class FrameTraversalEngine {
  private projectionEngine = new ObservableProjectionEngine();

  public traverse(
    state: FullState,
    observerFrames: readonly ObserverFrameConfig[]
  ): FrameTraversalSequence {
    if (!observerFrames || observerFrames.length === 0) {
      throw new Error('observerFrames array cannot be empty');
    }

    const steps: FrameTraversalStep[] = [];

    for (let i = 0; i < observerFrames.length; i++) {
      const oFrame = observerFrames[i];
      const observer = toF82Observer(oFrame);

      const representation = this.projectionEngine.project(state, observer);
      const observationFrame = this.projectionEngine.renderFrame(representation, observer);

      const stepStr = [
        String(i),
        state.stateId,
        state.stateHash,
        oFrame.frameId,
        representation.frameHash,
        observationFrame.frameHash,
      ].join(':::');

      let hash = 0x811c9dc5;
      for (let k = 0; k < stepStr.length; k++) {
        hash ^= stepStr.charCodeAt(k);
        hash = Math.imul(hash, 0x01000193);
      }
      const stepHash = 'HASH_STEP_' + (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();

      steps.push(
        Object.freeze({
          stepIndex: i,
          stateId: state.stateId,
          observerFrame: oFrame,
          observableRepresentation: representation,
          observationFrame,
          stepHash,
        })
      );
    }

    const sequenceId = 'SEQ_TRAV_' + state.stateId + '_' + observerFrames.length + 'FRAMES';
    const seqStr = steps.map((s) => s.stepHash).join(':::');

    let seqHashVal = 0x811c9dc5;
    for (let k = 0; k < seqStr.length; k++) {
      seqHashVal ^= seqStr.charCodeAt(k);
      seqHashVal = Math.imul(seqHashVal, 0x01000193);
    }
    const traversalHash = 'HASH_TRAV_SEQ_' + (seqHashVal >>> 0).toString(16).padStart(8, '0').toUpperCase();

    return Object.freeze({
      sequenceId,
      stateId: state.stateId,
      steps: Object.freeze(steps),
      totalSteps: steps.length,
      traversalHash,
    });
  }
}
