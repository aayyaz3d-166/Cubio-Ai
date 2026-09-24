/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F102: Canonical Intelligence Weight Matrix
 *
 * Enforces strictly normalized weights summing to 1.00 across all 7 intelligence pillars:
 * 1. Reasoning & Determinism (20%)
 * 2. Code Intelligence & AST (15%)
 * 3. Multi-Modal Vision Optics (15%)
 * 4. Multilingual Voice & Acoustics (10%)
 * 5. Universal Tools & Safety (15%)
 * 6. Multi-Agent Swarm Solving (15%)
 * 7. Autonomous Workflows & Long-Horizon State (10%)
 */

import { PillarWeightConfig } from './types';

export const CANONICAL_INTELLIGENCE_WEIGHTS: readonly PillarWeightConfig[] = Object.freeze([
  {
    pillarId: 'REASONING_AND_DETERMINISM',
    displayName: '1. Reasoning & Deterministic Mathematics',
    weight: 0.20,
    description: '3-6-9 Harmonic field, digital roots, closed 2-manifold spatial topology (sigma^2 = 0)',
  },
  {
    pillarId: 'CODE_INTELLIGENCE_AND_AST',
    displayName: '2. Code Intelligence & AST Synthesis',
    weight: 0.15,
    description: 'TypeScript component synthesis, AST parsing, static analysis, sandboxed execution',
  },
  {
    pillarId: 'VISION_AND_OPTICAL_PHYSICS',
    displayName: '3. Multi-Modal Vision & Gemstone Optics',
    weight: 0.15,
    description: 'Gemstone facet count, crown angle, setting inspection, refractive index n=2.42',
  },
  {
    pillarId: 'MULTILINGUAL_VOICE_AND_ACOUSTICS',
    displayName: '4. Multilingual Voice & Acoustics',
    weight: 0.10,
    description: 'Urdu, Roman Urdu, English semantic comprehension and 528Hz Solfeggio audio synthesis',
  },
  {
    pillarId: 'UNIVERSAL_TOOLS_AND_SAFETY',
    displayName: '5. Universal Tools & Governance Safety',
    weight: 0.15,
    description: '7-Category tool execution, single-use anti-replay token validation, policy enforcement',
  },
  {
    pillarId: 'MULTI_AGENT_SWARM_SOLVING',
    displayName: '6. Multi-Agent Swarm Problem Solving',
    weight: 0.15,
    description: 'Master Agent DAG decomposition, specialist consensus, validator verification audits',
  },
  {
    pillarId: 'AUTONOMOUS_WORKFLOWS_AND_STATE',
    displayName: '7. Autonomous Workflows & State Continuity',
    weight: 0.10,
    description: '8-Stage workflow progression, 9-point project state tree recovery across sessions',
  },
]);
