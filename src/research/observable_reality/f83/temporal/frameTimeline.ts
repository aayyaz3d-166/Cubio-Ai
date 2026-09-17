/**
 * 3D Memory Studio — Funnel 83
 * Temporal Reality State & Observer Traversal Timeline
 *
 * Disentangles State Mutations from Observer Frame Transitions:
 * (X0, O0) -> (X0, O1) -> (X1, O1) -> (X1, O2)
 */

import {
  TemporalTraversalLog,
  TemporalTraversalEvent,
  TraversalStepType,
  ObserverFrameConfig,
} from '../types';
import { FullState } from '../../f82/types';
import { FrameProjectionEngine } from '../projection/frameProjection';

export interface TimelineTransitionNode {
  readonly state: FullState;
  readonly observerFrame: ObserverFrameConfig;
}

export class FrameTimelineEngine {
  private projectionEngine = new FrameProjectionEngine();

  public traceTimeline(
    nodes: readonly TimelineTransitionNode[]
  ): TemporalTraversalLog {
    if (!nodes || nodes.length === 0) {
      throw new Error('TimelineTransitionNode array cannot be empty');
    }

    const events: TemporalTraversalEvent[] = [];
    let stateTransitions = 0;
    let observerTransitions = 0;

    for (let i = 0; i < nodes.length; i++) {
      const current = nodes[i];
      const { frame } = this.projectionEngine.projectFrame(current.state, current.observerFrame);

      let stepType: TraversalStepType = 'STATIC_EQUIVALENCE';
      let stateChanged = false;
      let observerChanged = false;
      let obsChanged = false;

      if (i > 0) {
        const prev = nodes[i - 1];
        stateChanged = prev.state.stateHash !== current.state.stateHash;
        observerChanged = prev.observerFrame.frameId !== current.observerFrame.frameId;

        const prevFrame = this.projectionEngine.projectFrame(prev.state, prev.observerFrame).frame;
        obsChanged = prevFrame.frameHash !== frame.frameHash;

        if (stateChanged && observerChanged) {
          stepType = 'JOINT_STATE_AND_OBSERVER_TRANSITION';
          stateTransitions++;
          observerTransitions++;
        } else if (stateChanged) {
          stepType = 'UNDERLYING_STATE_MUTATION';
          stateTransitions++;
        } else if (observerChanged) {
          stepType = 'OBSERVER_FRAME_TRANSITION';
          observerTransitions++;
        } else {
          stepType = 'STATIC_EQUIVALENCE';
        }
      }

      events.push(
        Object.freeze({
          eventIndex: i,
          stateId: current.state.stateId,
          stateHash: current.state.stateHash,
          observerFrameId: current.observerFrame.frameId,
          observableFrameHash: frame.frameHash,
          stepType,
          underlyingStateChanged: stateChanged,
          observerChanged,
          observationChanged: obsChanged,
        })
      );
    }

    const logId = 'TIMELINE_LOG_' + nodes.length + 'NODES';
    const logStr = events.map((e) => e.eventIndex + ':' + e.stepType + ':' + e.observableFrameHash).join(':::');

    let hashVal = 0x811c9dc5;
    for (let k = 0; k < logStr.length; k++) {
      hashVal ^= logStr.charCodeAt(k);
      hashVal = Math.imul(hashVal, 0x01000193);
    }
    const logHash = 'HASH_LOG_' + (hashVal >>> 0).toString(16).padStart(8, '0').toUpperCase();

    return Object.freeze({
      logId,
      events: Object.freeze(events),
      totalEvents: events.length,
      stateTransitionCount: stateTransitions,
      observerTransitionCount: observerTransitions,
      logHash,
    });
  }
}
