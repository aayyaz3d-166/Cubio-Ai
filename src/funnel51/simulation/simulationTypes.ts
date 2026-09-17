/**
 * 3D Memory Studio — Funnel 51
 * Internal Simulation Types & Constants
 */

import { SimulationPhase, SimulationPhaseConfig } from '../types';

export const SIMULATION_PHASE_ORDER: readonly SimulationPhase[] = Object.freeze([
  'IDLE',
  'STARTING',
  'INITIALIZING',
  'STATE_FORMATION',
  'STRUCTURE_FORMATION',
  'DIMENSIONAL_FORMATION',
  'MEMORY_READY',
  'STUDIO_READY',
]);

export const STANDARD_PHASE_CONFIGS: Readonly<Record<SimulationPhase, SimulationPhaseConfig>> = Object.freeze({
  IDLE: {
    phase: 'IDLE',
    title: '3D MEMORY STUDIO',
    subtitle: 'Information Visualization',
    durationMs: 0,
    progressStart: 0.0,
    progressEnd: 0.0,
  },
  STARTING: {
    phase: 'STARTING',
    title: 'STARTING SIMULATION',
    subtitle: 'Preparing computational viewport...',
    durationMs: 500,
    progressStart: 0.0,
    progressEnd: 0.1,
  },
  INITIALIZING: {
    phase: 'INITIALIZING',
    title: 'PHASE 01 // INITIALIZING MEMORY SPACE',
    subtitle: 'Generating central information origin and computational coordinate grid',
    durationMs: 1200,
    progressStart: 0.1,
    progressEnd: 0.3,
  },
  STATE_FORMATION: {
    phase: 'STATE_FORMATION',
    title: 'PHASE 02 // FORMING INFORMATION STATES',
    subtitle: 'Deriving discrete state nodes from captured research payloads',
    durationMs: 1400,
    progressStart: 0.3,
    progressEnd: 0.55,
  },
  STRUCTURE_FORMATION: {
    phase: 'STRUCTURE_FORMATION',
    title: 'PHASE 03 // BUILDING RELATIONSHIPS & 369 LINKAGES',
    subtitle: 'Synthesizing ternary 369 sequences and relational graph connections',
    durationMs: 1400,
    progressStart: 0.55,
    progressEnd: 0.75,
  },
  DIMENSIONAL_FORMATION: {
    phase: 'DIMENSIONAL_FORMATION',
    title: 'PHASE 04 // FORMING DIMENSIONAL MEMORY SPACE',
    subtitle: 'Projecting spatial coordinates across multidimensional layers (Z1..Z16)',
    durationMs: 1400,
    progressStart: 0.75,
    progressEnd: 0.95,
  },
  MEMORY_READY: {
    phase: 'MEMORY_READY',
    title: 'PHASE 05 // MEMORY SPACE READY',
    subtitle: '3D Information Architecture online. Ready to enter Studio.',
    durationMs: 800,
    progressStart: 0.95,
    progressEnd: 1.0,
  },
  STUDIO_READY: {
    phase: 'STUDIO_READY',
    title: '3D MEMORY STUDIO ACTIVE',
    subtitle: 'Live Interactive Studio Shell',
    durationMs: 0,
    progressStart: 1.0,
    progressEnd: 1.0,
  },
});
