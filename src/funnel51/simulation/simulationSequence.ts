/**
 * 3D Memory Studio — Funnel 51
 * Simulation Timeline Sequence & Geometry Generator
 *
 * Deterministic timeline calculations and lightweight visual object generators.
 */

import {
  SimulationPhase,
  VisualParticle,
  VisualStateNode,
  VisualRelationship,
} from '../types';
import { SIMULATION_PHASE_ORDER, STANDARD_PHASE_CONFIGS } from './simulationTypes';

/**
 * Calculates total sequence duration in milliseconds
 */
export function getTotalSequenceDuration(prefersReducedMotion = false): number {
  if (prefersReducedMotion) return 300; // 300ms total in reduced motion mode

  let total = 0;
  for (const phase of SIMULATION_PHASE_ORDER) {
    total += STANDARD_PHASE_CONFIGS[phase].durationMs;
  }
  return total;
}

/**
 * Calculates active simulation phase and progress from elapsed time
 */
export function evaluateSequenceAtTime(
  elapsedMs: number,
  prefersReducedMotion = false
): {
  readonly phase: SimulationPhase;
  readonly progress: number;
  readonly phaseProgress: number;
  readonly isCompleted: boolean;
} {
  const totalDuration = getTotalSequenceDuration(prefersReducedMotion);

  if (elapsedMs <= 0) {
    return {
      phase: 'IDLE',
      progress: 0.0,
      phaseProgress: 0.0,
      isCompleted: false,
    };
  }

  if (elapsedMs >= totalDuration) {
    return {
      phase: 'MEMORY_READY',
      progress: 1.0,
      phaseProgress: 1.0,
      isCompleted: true,
    };
  }

  const overallProgress = Math.min(1.0, Math.max(0.0, elapsedMs / totalDuration));

  // Determine current phase by accumulating durations
  let accumulated = 0;
  for (const phase of SIMULATION_PHASE_ORDER) {
    if (phase === 'IDLE' || phase === 'STUDIO_READY') continue;

    const baseDuration = STANDARD_PHASE_CONFIGS[phase].durationMs;
    const duration = prefersReducedMotion ? baseDuration / 20 : baseDuration;

    if (elapsedMs < accumulated + duration) {
      const phaseElapsed = elapsedMs - accumulated;
      const phaseProg = Math.min(1.0, Math.max(0.0, phaseElapsed / (duration || 1)));
      return {
        phase,
        progress: overallProgress,
        phaseProgress: phaseProg,
        isCompleted: false,
      };
    }
    accumulated += duration;
  }

  return {
    phase: 'MEMORY_READY',
    progress: 1.0,
    phaseProgress: 1.0,
    isCompleted: true,
  };
}

/**
 * Generates bounded, deterministic ambient particles (max 30 particles)
 */
export function generateInitialParticles(count = 28): readonly VisualParticle[] {
  const particles: VisualParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count;
    const radius = 60 + (i % 5) * 30;
    particles.push(
      Object.freeze({
        id: `PARTICLE_${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: ((i % 7) - 3) * 15,
        radius: 1.5 + (i % 3) * 0.8,
        alpha: 0.2 + ((i % 4) * 0.15),
        colorHex: i % 4 === 0 ? '#38bdf8' : i % 3 === 0 ? '#10b981' : '#06b6d4',
        vx: Math.cos(angle + Math.PI / 2) * 0.4,
        vy: Math.sin(angle + Math.PI / 2) * 0.4,
      })
    );
  }
  return Object.freeze(particles);
}

/**
 * Generates visual state nodes across simulation phases (bounded max 8 nodes)
 */
export function generateVisualStateNodes(
  phase: SimulationPhase,
  progress: number
): readonly VisualStateNode[] {
  if (phase === 'IDLE' || phase === 'STARTING') {
    return Object.freeze([]);
  }

  const rawDefinitions = [
    { id: 'W3C_LDP', label: 'W3C LDP Standard', cat: 'STANDARDS', cls: 'GREEN', angle: 0, rad: 160, col: '#10b981', seq: '369369369', crd: 'X3.Y6.Z9' },
    { id: 'HTTP2_RFC', label: 'HTTP/2 Protocol', cat: 'PROTOCOLS', cls: 'GREEN', angle: 45, rad: 180, col: '#06b6d4', seq: '639639639', crd: 'X6.Y3.Z9' },
    { id: 'RDF_SCHEMA', label: 'RDF Schema Ontology', cat: 'ONTOLOGY', cls: 'GREEN', angle: 90, rad: 170, col: '#10b981', seq: '963963963', crd: 'X9.Y6.Z3' },
    { id: 'LLM_CLAUDE_35', label: 'Claude 3.5 Sonnet', cat: 'AI_MODEL', cls: 'GREEN', angle: 135, rad: 200, col: '#38bdf8', seq: '369639963', crd: 'X3.Y9.Z6' },
    { id: 'LLM_GEMINI_15', label: 'Gemini 1.5 Pro', cat: 'AI_MODEL', cls: 'GREEN', angle: 180, rad: 200, col: '#38bdf8', seq: '639963369', crd: 'X6.Y9.Z3' },
    { id: 'LLM_GPT4O', label: 'GPT-4o', cat: 'AI_MODEL', cls: 'GREEN', angle: 225, rad: 200, col: '#38bdf8', seq: '963369639', crd: 'X9.Y3.Z6' },
    { id: 'LLM_LLAMA_31', label: 'Llama 3.1 405B', cat: 'AI_MODEL', cls: 'GREEN', angle: 270, rad: 190, col: '#38bdf8', seq: '369369639', crd: 'X3.Y3.Z9' },
    { id: 'DARKWEB_LEAK', label: 'Darkweb Leak (Restricted)', cat: 'SECURITY', cls: 'RED', angle: 315, rad: 230, col: '#f43f5e', seq: undefined, crd: undefined },
  ] as const;

  const nodeCount = phase === 'INITIALIZING' ? 3 : phase === 'STATE_FORMATION' ? 6 : rawDefinitions.length;

  return Object.freeze(
    rawDefinitions.slice(0, nodeCount).map((def, idx) => {
      const rad = def.rad * (0.6 + progress * 0.4);
      const radAngle = (def.angle * Math.PI) / 180;
      const targetX = Math.cos(radAngle) * rad;
      const targetY = Math.sin(radAngle) * rad;

      const isGreen = def.cls === 'GREEN';

      return Object.freeze({
        nodeId: `NODE_${def.id}`,
        label: def.label,
        category: def.cat,
        classification: def.cls as 'GREEN' | 'RED',
        x: targetX * Math.min(1.0, progress * 1.5),
        y: targetY * Math.min(1.0, progress * 1.5),
        targetX,
        targetY,
        opacity: Math.min(1.0, Math.max(0.2, (progress - 0.1) * 2)),
        scale: 0.8 + Math.min(0.4, progress * 0.5),
        colorHex: def.col,
        sequence369Preview: isGreen ? def.seq : undefined,
        coordinatePreview: isGreen ? def.crd : undefined,
      });
    })
  );
}

/**
 * Generates visual relationship lines connecting nodes (bounded max 10 edges)
 */
export function generateVisualRelationships(
  nodes: readonly VisualStateNode[],
  progress: number
): readonly VisualRelationship[] {
  if (nodes.length < 2 || progress < 0.4) {
    return Object.freeze([]);
  }

  const relationships: VisualRelationship[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const src = nodes[i];
    const tgt = nodes[i + 1];
    relationships.push(
      Object.freeze({
        id: `REL_${src.nodeId}->${tgt.nodeId}`,
        sourceNodeId: src.nodeId,
        targetNodeId: tgt.nodeId,
        opacity: Math.min(0.6, (progress - 0.4) * 1.5),
        colorHex: src.classification === 'GREEN' ? '#06b6d4' : '#f43f5e',
      })
    );
  }

  return Object.freeze(relationships);
}
