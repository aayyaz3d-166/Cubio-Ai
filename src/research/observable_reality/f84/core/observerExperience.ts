/**
 * 3D Memory Studio — Funnel 84
 * Core: Observer Experience Orchestrator (D + interaction → E)
 */

import { FullState, ObserverState, ObservationFrame, ProjectionState, DisplayState, ExperienceState } from '../types';
import { generateObservationFrame, computeFNVHash } from './observationState';
import { projectFrameToDisplay } from '../projection/displayProjection';

export function computeExperienceChecksum(exp: ExperienceState): string {
  return computeFNVHash(
    `${exp.experienceId}:${exp.observerId}:${exp.displayId}:${exp.perceivedObjectCount}:${exp.focusTargetId ?? 'NONE'}:${exp.perceivedDimension}:${exp.interactionCount}`
  );
}

export function synthesizeObserverExperience(
  state: FullState,
  observer: ObserverState,
  projection: ProjectionState,
  options: {
    focusTargetId?: string | null;
    interactionCount?: number;
    width?: number;
    height?: number;
  } = {}
): {
  frame: ObservationFrame;
  display: DisplayState;
  experience: ExperienceState;
} {
  // 1. Observe: X + O → F
  const frame = generateObservationFrame(state, observer);

  // 2. Project: F + P → D
  const display = projectFrameToDisplay(frame, projection, options.width ?? 800, options.height ?? 600);

  // 3. Experience: D + interaction → E
  const perceivedObjects = display.displayObjects.filter((o) => o.visible);
  const perceivedObjectCount = perceivedObjects.length;
  const focusTargetId = options.focusTargetId ?? null;
  const interactionCount = options.interactionCount ?? 0;

  const experienceId = `EXP_${observer.observerId}_${display.displayId}`;
  const summary = `Observer [${observer.name}] perceived ${perceivedObjectCount} objects under ${projection.projectionType} (Focus: ${focusTargetId ?? 'NONE'})`;

  const partialExperience: ExperienceState = {
    experienceId,
    observerId: observer.observerId,
    displayId: display.displayId,
    perceivedObjectCount,
    focusTargetId,
    perceivedDimension: projection.targetDimension,
    interactionCount,
    experienceSummary: summary,
    experienceChecksum: '',
  };

  const experienceChecksum = computeExperienceChecksum(partialExperience);

  const experience: ExperienceState = Object.freeze({
    ...partialExperience,
    experienceChecksum,
  });

  return {
    frame,
    display,
    experience,
  };
}
