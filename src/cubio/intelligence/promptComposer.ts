/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 9: CubiO Prompt Composer
 *
 * Assembles the 5-layer neural context envelope:
 * Context -> Memory -> 369 State -> Dimension State -> User Query.
 */

import { deterministicHash } from '../state/determinism';
import { CUBIO_DIMENSION_DESCRIPTORS } from '../dimension/descriptors';
import { CubiOIntelligenceContext } from './types';

export class CubiOPromptComposer {
  /**
   * Composes a structured 5-layer prompt envelope for spatial LLM inference.
   */
  public static composeEnvelope(context: CubiOIntelligenceContext): {
    systemPrompt: string;
    assembledUserPrompt: string;
    contextChecksum: string;
  } {
    const dimDescriptor = CUBIO_DIMENSION_DESCRIPTORS[context.activeDimension];

    // Layer 1: System Operational Framework
    const systemPrompt = [
      'You are CUBiO — The Universal Spatial Intelligence & Multi-Dimensional Reasoning Engine.',
      `Active Dimension: ${context.activeDimension} (${dimDescriptor.name} - Rank ${dimDescriptor.tensorRank}).`,
      `State Space Description: ${dimDescriptor.description}`,
      'Harmonic Basis: 3-6-9 Vortex Math & Orthogonal Energy Conservation.',
      'Core Axiom: Maintain invariant identity, causal causality, and zero hallucination boundaries.',
    ].join('\n');

    // Layer 2: Memory Context
    const memContext = context.memoryContext || [];
    const memoryLines =
      memContext.length > 0
        ? memContext.map((m, i) => `  [MEM-${i + 1}] (${m.type} @ ${m.dimension}) ${m.key}: ${JSON.stringify(m.payload)}`).join('\n')
        : '  [No relevant active memories loaded]';

    // Layer 3: 369 Harmonic Resonance Context
    const harmonicLines = [
      `  - Triadic Nexus: [${context.harmonic.triad.join(', ')}]`,
      `  - Vortex State: ${context.harmonic.vortexState}`,
      `  - Active Frequency: ${context.harmonic.activeFrequencyHz} Hz`,
      `  - Harmonic Flux: ${context.harmonic.harmonicFlux.toFixed(4)}`,
      `  - Resonance Score: ${context.harmonic.resonanceScore.toFixed(2)}%`,
    ].join('\n');

    // Layer 4: Active Entity State Space
    const stateLines = context.activeState
      ? [
          `  - State ID: ${context.activeState.id}`,
          `  - Position: [${context.activeState.position.join(', ')}]`,
          `  - Dimension: ${context.activeState.dimension}`,
          `  - Properties: ${JSON.stringify(context.activeState.properties)}`,
        ].join('\n')
      : '  - [No active entity bound]';

    // Layer 5: Assembled Multi-Layer Query
    const assembledUserPrompt = [
      '=== CUBiO 5-LAYER INTELLIGENCE CONTEXT ===',
      '',
      '[LAYER 1: SPATIAL SITUATION]',
      `Modality: ${context.modality}`,
      `Target Dimension: ${context.activeDimension}`,
      '',
      '[LAYER 2: RETRIEVED SPATIAL MEMORY]',
      memoryLines,
      '',
      '[LAYER 3: 369 HARMONIC ENERGY STATE]',
      harmonicLines,
      '',
      '[LAYER 4: ACTIVE DIMENSION ENTITY STATE]',
      stateLines,
      '',
      '[LAYER 5: USER QUERY / OBJECTIVE]',
      context.queryPrompt,
      '==========================================',
    ].join('\n');

    const contextChecksum = deterministicHash(systemPrompt + assembledUserPrompt);

    return {
      systemPrompt,
      assembledUserPrompt,
      contextChecksum,
    };
  }
}
