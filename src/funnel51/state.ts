/**
 * 3D Memory Studio — Funnel 51
 * Deterministic Simulation State Machine Reducer
 */

import { SimulationExperienceState, SimulationPhase } from './types';
import {
  evaluateSequenceAtTime,
  generateInitialParticles,
  generateVisualStateNodes,
  generateVisualRelationships,
  getTotalSequenceDuration,
} from './simulation/simulationSequence';

/**
 * Creates the initial IDLE simulation experience state
 */
export function createInitialSimulationState(
  prefersReducedMotion = false
): SimulationExperienceState {
  return Object.freeze({
    currentPhase: 'IDLE',
    progress: 0.0,
    elapsedMs: 0,
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    prefersReducedMotion,
    particles: generateInitialParticles(28),
    nodes: Object.freeze([]),
    relationships: Object.freeze([]),
    activeDimension: 3,
  });
}

/**
 * Steps the simulation experience state forward by deltaMs
 */
export function stepSimulationState(
  state: SimulationExperienceState,
  deltaMs: number
): SimulationExperienceState {
  if (!state.isRunning || state.isPaused || state.isCompleted) {
    return state;
  }

  const nextElapsed = state.elapsedMs + deltaMs;
  const evaluation = evaluateSequenceAtTime(nextElapsed, state.prefersReducedMotion);

  const nextNodes = generateVisualStateNodes(evaluation.phase, evaluation.progress);
  const nextRelationships = generateVisualRelationships(nextNodes, evaluation.progress);

  // Derive active dimension mapping from progress
  let activeDim = 3;
  if (evaluation.progress > 0.8) activeDim = 16;
  else if (evaluation.progress > 0.6) activeDim = 8;
  else if (evaluation.progress > 0.4) activeDim = 4;

  return Object.freeze({
    ...state,
    currentPhase: evaluation.phase,
    progress: evaluation.progress,
    elapsedMs: nextElapsed,
    isCompleted: evaluation.isCompleted,
    nodes: nextNodes,
    relationships: nextRelationships,
    activeDimension: activeDim,
  });
}

/**
 * Transitions state to STARTING / running
 */
export function startSimulation(state: SimulationExperienceState): SimulationExperienceState {
  return Object.freeze({
    ...state,
    currentPhase: 'STARTING',
    isRunning: true,
    isPaused: false,
    isCompleted: false,
    elapsedMs: 1,
  });
}

/**
 * Pauses active simulation
 */
export function pauseSimulation(state: SimulationExperienceState): SimulationExperienceState {
  return Object.freeze({
    ...state,
    isPaused: true,
  });
}

/**
 * Resumes paused simulation
 */
export function resumeSimulation(state: SimulationExperienceState): SimulationExperienceState {
  return Object.freeze({
    ...state,
    isPaused: false,
  });
}

/**
 * Resets simulation back to IDLE
 */
export function restartSimulation(state: SimulationExperienceState): SimulationExperienceState {
  return createInitialSimulationState(state.prefersReducedMotion);
}

/**
 * Skips simulation sequence immediately to MEMORY_READY
 */
export function skipSimulation(state: SimulationExperienceState): SimulationExperienceState {
  const totalDuration = getTotalSequenceDuration(state.prefersReducedMotion);
  const nodes = generateVisualStateNodes('MEMORY_READY', 1.0);
  const rels = generateVisualRelationships(nodes, 1.0);

  return Object.freeze({
    ...state,
    currentPhase: 'MEMORY_READY',
    progress: 1.0,
    elapsedMs: totalDuration,
    isRunning: true,
    isPaused: false,
    isCompleted: true,
    nodes,
    relationships: rels,
    activeDimension: 16,
  });
}

/**
 * Transitions into STUDIO_READY
 */
export function enterStudioState(state: SimulationExperienceState): SimulationExperienceState {
  return Object.freeze({
    ...state,
    currentPhase: 'STUDIO_READY',
    isRunning: false,
    isPaused: false,
    isCompleted: true,
  });
}
