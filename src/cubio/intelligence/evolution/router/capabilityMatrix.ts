/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F103: Multi-Model Capability & Cost Matrix
 */

import { ModelCandidateId } from '../comparative/types';
import { TaskModalityIntent } from './types';

export interface ModelCapabilityEntry {
  readonly modelId: ModelCandidateId;
  readonly costPer1kInputTokensUsd: number;
  readonly costPer1kOutputTokensUsd: number;
  readonly typicalLatencyMs: number;
  readonly maxContextTokens: number;
  readonly supportedModalities: readonly TaskModalityIntent[];
  readonly modalityScores: Readonly<Record<TaskModalityIntent, number>>; // 0.0 .. 1.0
  readonly isZeroVarianceDeterministic: boolean;
  readonly isSovereignOfflineReady: boolean;
}

export const MODEL_CAPABILITY_MATRIX: Record<ModelCandidateId, ModelCapabilityEntry> = {
  CUBIO_SOVEREIGN_ENSEMBLE: {
    modelId: 'CUBIO_SOVEREIGN_ENSEMBLE',
    costPer1kInputTokensUsd: 0.0,
    costPer1kOutputTokensUsd: 0.0,
    typicalLatencyMs: 15.0,
    maxContextTokens: 2000000,
    supportedModalities: [
      'SPATIAL_3D_CAD_GEOMETRY',
      'ACOUSTIC_528HZ_VOICE',
      'AST_CODE_SYNTHESIS_REPAIR',
      'VISION_GEMSTONE_OPTICS',
      'DEEP_RECURSIVE_MATH',
      'MASSIVE_CONTEXT_INGESTION',
      'RAPID_CONVERSATION_CHAT',
      'SECURITY_GOVERNED_TOOL',
    ],
    modalityScores: {
      SPATIAL_3D_CAD_GEOMETRY: 1.0,
      ACOUSTIC_528HZ_VOICE: 1.0,
      AST_CODE_SYNTHESIS_REPAIR: 0.95,
      VISION_GEMSTONE_OPTICS: 0.98,
      DEEP_RECURSIVE_MATH: 0.99,
      MASSIVE_CONTEXT_INGESTION: 0.94,
      RAPID_CONVERSATION_CHAT: 0.99,
      SECURITY_GOVERNED_TOOL: 1.0,
    },
    isZeroVarianceDeterministic: true,
    isSovereignOfflineReady: true,
  },

  ANTHROPIC_CLAUDE_3_7_SONNET: {
    modelId: 'ANTHROPIC_CLAUDE_3_7_SONNET',
    costPer1kInputTokensUsd: 0.003,
    costPer1kOutputTokensUsd: 0.015,
    typicalLatencyMs: 900.0,
    maxContextTokens: 200000,
    supportedModalities: [
      'AST_CODE_SYNTHESIS_REPAIR',
      'DEEP_RECURSIVE_MATH',
      'RAPID_CONVERSATION_CHAT',
      'VISION_GEMSTONE_OPTICS',
    ],
    modalityScores: {
      SPATIAL_3D_CAD_GEOMETRY: 0.65,
      ACOUSTIC_528HZ_VOICE: 0.0,
      AST_CODE_SYNTHESIS_REPAIR: 0.99, // Best-in-class coding
      VISION_GEMSTONE_OPTICS: 0.90,
      DEEP_RECURSIVE_MATH: 0.94,
      MASSIVE_CONTEXT_INGESTION: 0.88,
      RAPID_CONVERSATION_CHAT: 0.92,
      SECURITY_GOVERNED_TOOL: 0.75,
    },
    isZeroVarianceDeterministic: false,
    isSovereignOfflineReady: false,
  },

  OPENAI_GPT_4O: {
    modelId: 'OPENAI_GPT_4O',
    costPer1kInputTokensUsd: 0.0025,
    costPer1kOutputTokensUsd: 0.01,
    typicalLatencyMs: 750.0,
    maxContextTokens: 128000,
    supportedModalities: [
      'VISION_GEMSTONE_OPTICS',
      'RAPID_CONVERSATION_CHAT',
      'AST_CODE_SYNTHESIS_REPAIR',
    ],
    modalityScores: {
      SPATIAL_3D_CAD_GEOMETRY: 0.68,
      ACOUSTIC_528HZ_VOICE: 0.0,
      AST_CODE_SYNTHESIS_REPAIR: 0.92,
      VISION_GEMSTONE_OPTICS: 0.94,
      DEEP_RECURSIVE_MATH: 0.88,
      MASSIVE_CONTEXT_INGESTION: 0.80,
      RAPID_CONVERSATION_CHAT: 0.94,
      SECURITY_GOVERNED_TOOL: 0.70,
    },
    isZeroVarianceDeterministic: false,
    isSovereignOfflineReady: false,
  },

  GOOGLE_GEMINI_2_0_PRO: {
    modelId: 'GOOGLE_GEMINI_2_0_PRO',
    costPer1kInputTokensUsd: 0.00125,
    costPer1kOutputTokensUsd: 0.005,
    typicalLatencyMs: 600.0,
    maxContextTokens: 2000000, // 2M tokens
    supportedModalities: [
      'MASSIVE_CONTEXT_INGESTION',
      'VISION_GEMSTONE_OPTICS',
      'RAPID_CONVERSATION_CHAT',
    ],
    modalityScores: {
      SPATIAL_3D_CAD_GEOMETRY: 0.62,
      ACOUSTIC_528HZ_VOICE: 0.0,
      AST_CODE_SYNTHESIS_REPAIR: 0.88,
      VISION_GEMSTONE_OPTICS: 0.92,
      DEEP_RECURSIVE_MATH: 0.85,
      MASSIVE_CONTEXT_INGESTION: 0.99, // Best-in-class context window
      RAPID_CONVERSATION_CHAT: 0.90,
      SECURITY_GOVERNED_TOOL: 0.70,
    },
    isZeroVarianceDeterministic: false,
    isSovereignOfflineReady: false,
  },

  DEEPSEEK_R1: {
    modelId: 'DEEPSEEK_R1',
    costPer1kInputTokensUsd: 0.00055,
    costPer1kOutputTokensUsd: 0.00219,
    typicalLatencyMs: 1100.0,
    maxContextTokens: 64000,
    supportedModalities: [
      'DEEP_RECURSIVE_MATH',
      'AST_CODE_SYNTHESIS_REPAIR',
    ],
    modalityScores: {
      SPATIAL_3D_CAD_GEOMETRY: 0.60,
      ACOUSTIC_528HZ_VOICE: 0.0,
      AST_CODE_SYNTHESIS_REPAIR: 0.94,
      VISION_GEMSTONE_OPTICS: 0.50,
      DEEP_RECURSIVE_MATH: 0.98, // Extreme mathematical reasoning
      MASSIVE_CONTEXT_INGESTION: 0.70,
      RAPID_CONVERSATION_CHAT: 0.80,
      SECURITY_GOVERNED_TOOL: 0.70,
    },
    isZeroVarianceDeterministic: false,
    isSovereignOfflineReady: false,
  },
};
