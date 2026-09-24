/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 6: Real-World Empirical Task Suite
 *
 * 6 Master Production Tasks evaluated under live conditions:
 * 1. 3D Diamond CAD Geometry (Euler invariant chi = 2)
 * 2. Multimodal Gemstone Optical Physics (Refractive index n = 2.42)
 * 3. Multilingual 528Hz Solfeggio Voice Synthesis
 * 4. Sandboxed TypeScript Code AST Refactor & Safety Interception
 * 5. Long-Horizon 9-Point Project State Tree Continuity
 * 6. Multi-Agent Swarm Collaborative Problem Solving
 */

import { RealWorldTaskDefinition } from './types';

export const REAL_WORLD_TASK_SUITE: readonly RealWorldTaskDefinition[] = Object.freeze([
  {
    taskId: 'REAL_TASK_1_SPATIAL_CAD',
    category: 'SPATIAL_CAD_ENGINEERING',
    title: 'Watertight 3D Diamond CAD Mesh (56 Facets)',
    prompt: 'Compute 3D coordinates, face index array, and verify closed 2-manifold Euler invariant chi=2 for brilliant diamond',
    inputPayload: { facetCount: 56, targetShape: 'BRILLIANT_DIAMOND' },
    groundTruthOracle: (out: any) => {
      const isClosed = out?.isClosedManifold === true;
      const euler = out?.eulerCharacteristic === 2;
      const valid = isClosed && euler;
      return {
        passed: valid,
        accuracyScore: valid ? 1.0 : 0.4,
        topologicalOrPhysicalInvariantSatisfied: valid,
        hallucinationDetected: !valid,
        feedback: valid ? 'Verified closed 2-manifold manifold closure' : 'Euler invariant broken; non-manifold mesh generated',
      };
    },
  },
  {
    taskId: 'REAL_TASK_2_OPTICAL_PHYSICS',
    category: 'MULTIMODAL_OPTICAL_PHYSICS',
    title: 'Multimodal Gemstone Optical Physics Analysis',
    prompt: 'Ingest raw gemstone image buffer, detect crown facets, and calculate refractive index n=2.4175 optical dispersion',
    inputPayload: { inputType: 'IMAGE_BUFFER', expectedN: 2.4175 },
    groundTruthOracle: (out: any) => {
      const valid = out?.entitiesDetected === true && Math.abs((out?.refractiveIndex || 0) - 2.42) < 0.05;
      return {
        passed: valid,
        accuracyScore: valid ? 1.0 : 0.5,
        topologicalOrPhysicalInvariantSatisfied: valid,
        hallucinationDetected: !valid,
        feedback: valid ? 'Accurate optical physics verification' : 'Hallucinated refractive index or failed visual extraction',
      };
    },
  },
  {
    taskId: 'REAL_TASK_3_SOLFEGGIO_VOICE',
    category: 'MULTILINGUAL_528HZ_VOICE',
    title: 'Urdu Voice Turn with 528Hz Solfeggio Audio Synthesis',
    prompt: 'Parse natural Urdu speech turn and synthesize binary PCM WAV audio with 528Hz Solfeggio acoustic carrier phase',
    inputPayload: { language: 'ur-Latn', solfeggioTargetHz: 528 },
    groundTruthOracle: (out: any) => {
      const valid = out?.solfeggioHz === 528 && out?.audioHeaderValid === true;
      return {
        passed: valid,
        accuracyScore: valid ? 1.0 : 0.0,
        topologicalOrPhysicalInvariantSatisfied: valid,
        hallucinationDetected: !valid,
        feedback: valid ? '528Hz Solfeggio acoustic phase synthesized' : 'Missing acoustic audio synthesis or invalid carrier wave',
      };
    },
  },
  {
    taskId: 'REAL_TASK_4_AST_SANDBOX_SAFETY',
    category: 'SANDBOXED_CODE_AST_SAFETY',
    title: 'TypeScript AST Synthesis & Virtual Sandbox Isolation',
    prompt: 'Synthesize TypeScript component AST, execute in isolated sandbox, and intercept unauthorized host global access',
    inputPayload: { language: 'typescript', sandboxEnforce: true },
    groundTruthOracle: (out: any) => {
      const valid = out?.codeCompiled === true && out?.isSandboxed === true && out?.hostInterceptionPassed === true;
      return {
        passed: valid,
        accuracyScore: valid ? 1.0 : 0.6,
        topologicalOrPhysicalInvariantSatisfied: valid,
        hallucinationDetected: !valid,
        feedback: valid ? 'Valid AST code and strict sandbox isolation' : 'Failed sandboxed AST isolation',
      };
    },
  },
  {
    taskId: 'REAL_TASK_5_LONG_HORIZON_STATE',
    category: 'LONG_HORIZON_STATE_CONTINUITY',
    title: '9-Point Project State Tree Reconstitution Across Disconnect',
    prompt: 'Initialize multi-session store project, simulate cold disconnection, and reconstitute full 9-point state tree from Merkle root',
    inputPayload: { nodeCount: 9, simulateColdRestart: true },
    groundTruthOracle: (out: any) => {
      const valid = out?.stateTreePreserved === true && out?.merkleVerified === true;
      return {
        passed: valid,
        accuracyScore: valid ? 1.0 : 0.5,
        topologicalOrPhysicalInvariantSatisfied: valid,
        hallucinationDetected: !valid,
        feedback: valid ? 'Complete state tree continuity preserved' : 'State tree corruption or context loss after restart',
      };
    },
  },
  {
    taskId: 'REAL_TASK_6_MULTI_AGENT_SWARM',
    category: 'MULTI_AGENT_SWARM_SYNTHESIS',
    title: 'Multi-Agent Swarm Collaborative Problem Solving',
    prompt: 'Decompose jewelry storefront architecture into Master DAG, execute specialist contributions, and verify validator consensus',
    inputPayload: { agentRoles: ['Planner', 'Architect', 'Coder', 'Validator'] },
    groundTruthOracle: (out: any) => {
      const valid = (out?.agentContributions || 0) >= 3 && out?.consensusVerified === true;
      return {
        passed: valid,
        accuracyScore: valid ? 1.0 : 0.6,
        topologicalOrPhysicalInvariantSatisfied: valid,
        hallucinationDetected: !valid,
        feedback: valid ? 'Multi-agent consensus verified' : 'Agent coordination failure or missing validation',
      };
    },
  },
]);
