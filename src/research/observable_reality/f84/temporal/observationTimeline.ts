/**
 * 3D Memory Studio — Funnel 84
 * Temporal: Observation Timeline Recorder & History
 */

import { FullState, ObserverState, ProjectionState, ObservationTimeline, ObservationTimelineStep } from '../types';
import { synthesizeObserverExperience } from '../core/observerExperience';
import { computeStateChecksum } from '../core/observationState';

export class ObservationTimelineManager {
  private readonly baselineState: FullState;
  private readonly initialChecksum: string;
  private readonly steps: ObservationTimelineStep[] = [];

  constructor(initialState: FullState) {
    this.baselineState = Object.freeze(JSON.parse(JSON.stringify(initialState)));
    this.initialChecksum = computeStateChecksum(this.baselineState);
  }

  public recordStep(
    actionName: string,
    state: FullState,
    observer: ObserverState,
    projection: ProjectionState,
    options?: { focusTargetId?: string | null }
  ): ObservationTimelineStep {
    const { frame, display, experience } = synthesizeObserverExperience(
      state,
      observer,
      projection,
      {
        focusTargetId: options?.focusTargetId,
        interactionCount: this.steps.length + 1,
      }
    );

    const currentChecksum = computeStateChecksum(state);
    const step: ObservationTimelineStep = Object.freeze({
      stepIndex: this.steps.length,
      timestamp: Date.now(),
      actionName,
      observer,
      frame,
      projection,
      display,
      experience,
      stateChecksum: currentChecksum,
    });

    this.steps.push(step);
    return step;
  }

  public getTimeline(): ObservationTimeline {
    const isInvariant = this.steps.every((s) => s.stateChecksum === this.initialChecksum);
    return Object.freeze({
      timelineId: `TL_${this.baselineState.stateId}`,
      stateId: this.baselineState.stateId,
      steps: Object.freeze([...this.steps]),
      initialChecksum: this.initialChecksum,
      isInvariant,
    });
  }

  public clear(): void {
    this.steps.length = 0;
  }
}
