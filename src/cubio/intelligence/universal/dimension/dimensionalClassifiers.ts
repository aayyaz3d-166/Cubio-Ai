/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: Dimensional State Classifiers
 *
 * Automatically maps arbitrary computational data structures to their canonical
 * dimensional abstraction levels D0 through D8.
 */

import { CubiODimensionalLevel } from './types';

/**
 * Classifies arbitrary input data into its canonical dimensional level D0..D8.
 */
export function classifyDataDimension(data: unknown): CubiODimensionalLevel {
  if (data === null || data === undefined) return 'D0';

  // 1. D0 — Scalar / Point Singularity
  if (typeof data === 'number' || typeof data === 'boolean') {
    return 'D0';
  }

  // 2. Objects & Complex Structures
  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    // D8 — Universal Super-Intelligence Metaverse Attractor
    if ('metaverse' in obj || 'omniAttractor' in obj || 'unifiedState' in obj || 'universalSynthesis' in obj) {
      return 'D8';
    }

    // D7 — Project Context (goals, files, ADR decisions, artifacts)
    if ('projectId' in obj && ('goal' in obj || 'activeFiles' in obj || 'decisions' in obj)) {
      return 'D7';
    }

    // D6 — Multi-Agent Workflow (tasks, agents, stages, steps)
    if (('tasks' in obj && 'decomposition' in obj) || ('stages' in obj && 'steps' in obj) || 'agentId' in obj) {
      return 'D6';
    }

    // D5 — Cognitive & Semantic Latent (embeddings, concept graphs, reasoning DAGs)
    if ('embedding' in obj || 'conceptGraph' in obj || 'reasoningTree' in obj) {
      return 'D5';
    }

    // D4 — 4D Hyper-Spatial / Spacetime (w coordinate, tesseract vertices, spacetime)
    if ('w' in obj && 'x' in obj && 'y' in obj && 'z' in obj) {
      return 'D4';
    }
    if ('tesseract' in obj || 'hypercube' in obj || 'spacetimeState' in obj) {
      return 'D4';
    }

    // D3 — 3D Volumetric / Spatial Manifold (x, y, z mesh, voxel, scene)
    if ('x' in obj && 'y' in obj && 'z' in obj && !('w' in obj)) {
      return 'D3';
    }
    if ('vertices' in obj || 'mesh' in obj || 'voxelGrid' in obj || 'geometryType' in obj) {
      return 'D3';
    }

    // D2 — Planar / Structured Matrix (tables, JSON schemas, ASTs)
    if ('ast' in obj || 'schema' in obj || 'table' in obj || 'rows' in obj) {
      return 'D2';
    }
  }

  // 3. Arrays & Vectors
  if (Array.isArray(data)) {
    // 8-element or 9-element coordinate ([x0..x7] -> D8)
    if (data.length >= 8 && data.length <= 9 && data.every((v) => typeof v === 'number')) {
      return 'D8';
    }
    // Large numeric array (latent embedding -> D5)
    if (data.length >= 32 && data.every((v) => typeof v === 'number')) {
      return 'D5';
    }
    // 4-element coordinate ([x, y, z, w] -> D4)
    if (data.length === 4 && data.every((v) => typeof v === 'number')) {
      return 'D4';
    }
    // 3-element coordinate ([x, y, z] -> D3)
    if (data.length === 3 && data.every((v) => typeof v === 'number')) {
      return 'D3';
    }
    // 2D Matrix (array of arrays -> D2)
    if (data.length > 0 && Array.isArray(data[0])) {
      return 'D2';
    }
    // 1D Linear Sequence / Vector -> D1
    return 'D1';
  }

  // 4. Strings
  if (typeof data === 'string') {
    // Code block with newlines / interfaces -> D2 Planar Matrix
    if (data.includes('\n') && (data.includes('class ') || data.includes('interface ') || data.includes('function '))) {
      return 'D2';
    }
    // Linear token sequence / Prompt text -> D1
    return 'D1';
  }

  return 'D0';
}
