/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Target Selector & Routing Decider
 *
 * Selects the optimal engine, agent, or model target based on intent classification.
 */

import { deterministicHash } from '../../../state/determinism';
import { ClassifiedIntent } from './intentClassifier';
import { RouterTargetType, UniversalRoutingDecision } from './types';

export function selectRoutingTarget(prompt: string, classified: ClassifiedIntent): Readonly<UniversalRoutingDecision> {
  const p = prompt.trim();
  let selectedTarget: RouterTargetType = 'NATURAL_RESPONSE';
  let targetReasoning = 'Routed to natural response language core.';

  switch (classified.intent) {
    case 'IMAGE_GENERATION':
      selectedTarget = 'IMAGE_ENGINE';
      targetReasoning = 'Visual scene or procedural rendering request routed to Image Intelligence Engine (F49).';
      break;

    case 'VOICE_INTERACTION':
      selectedTarget = 'VOICE_ENGINE';
      targetReasoning = 'Acoustic / Speech audio transcription or Solfeggio TTS routed to Voice Intelligence Engine (F50).';
      break;

    case 'CODE_ENGINEERING':
      selectedTarget = 'CODING_ENGINE';
      targetReasoning = 'Code synthesis, debugging, refactoring, or test generation routed to Coding Intelligence Engine (F51).';
      break;

    case 'PROJECT_UNDERSTANDING':
      selectedTarget = 'PROJECT_ENGINE';
      targetReasoning = 'Project structure, dependency graphs, and health scoring routed to Project Intelligence Engine (F52).';
      break;

    case 'WORKFLOW_EXECUTION':
      selectedTarget = 'WORKFLOW_ENGINE';
      targetReasoning = 'Multi-stage software development instruction routed to Workflow Intelligence Engine (F53).';
      break;

    case 'TOOL_INVOCATION':
      selectedTarget = 'TOOL_ENGINE';
      targetReasoning = 'Sandboxed file, terminal, browser, or API execution routed to Tool Engine (F54).';
      break;

    case 'MULTI_AGENT_SOLVE':
      selectedTarget = 'MULTI_AGENT_SOLVER';
      targetReasoning = 'Complex multi-disciplinary problem routed to Multi-Agent Problem Solver (F55).';
      break;

    case 'SPATIAL_369_COMPUTE':
      selectedTarget = 'SPATIAL_369_ENGINE';
      targetReasoning = 'Tesla 3-6-9 vortex mathematics or 4D hyperspatial geometry routed to Spatial 369 Engine.';
      break;

    case 'NATURAL_CONVERSATION':
    default:
      selectedTarget = 'NATURAL_RESPONSE';
      targetReasoning = 'Standard conversational dialogue routed to Universal Core Reasoning.';
      break;
  }

  const routingChecksum = deterministicHash(
    `ROUTE:${classified.intent}:${selectedTarget}:${classified.problemType}:${p.length}`
  );
  const decisionId = `RDEC_${routingChecksum.slice(2, 10)}`;

  return Object.freeze({
    decisionId,
    prompt: p,
    detectedIntent: classified.intent,
    problemType: classified.problemType,
    requiredCapabilities: classified.requiredCapabilities,
    selectedTarget,
    targetReasoning,
    confidence: classified.confidence,
    routingChecksum,
  });
}
