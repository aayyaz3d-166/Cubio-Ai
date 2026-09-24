/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F101: Frontier Model Profiles & Candidate Specifications
 */

import { ModelCandidateId, ModelProfile } from './types';

export const MODEL_PROFILES: Record<ModelCandidateId, ModelProfile> = {
  CUBIO_SOVEREIGN_ENSEMBLE: {
    modelId: 'CUBIO_SOVEREIGN_ENSEMBLE',
    displayName: 'CubiO Sovereign Spatial Ensemble',
    provider: 'CubiO Native Engine Pool',
    architecture: 'Deterministic 3-6-9 Kernel + Multi-Agent DAG + AST Sandbox',
    isSovereignLocal: true,
    contextWindowTokens: 2000000,
    typicalLatencyMs: 18.5,
    nativeVoiceSupport: true,
    native3DManifoldSupport: true,
  },
  OPENAI_GPT_4O: {
    modelId: 'OPENAI_GPT_4O',
    displayName: 'OpenAI GPT-4o',
    provider: 'OpenAI Cloud API',
    architecture: 'Autoregressive Transformer (Omni-Modal)',
    isSovereignLocal: false,
    contextWindowTokens: 128000,
    typicalLatencyMs: 780.0,
    nativeVoiceSupport: false, // In text/JSON chat pipeline
    native3DManifoldSupport: false,
  },
  ANTHROPIC_CLAUDE_3_7_SONNET: {
    modelId: 'ANTHROPIC_CLAUDE_3_7_SONNET',
    displayName: 'Anthropic Claude 3.7 Sonnet',
    provider: 'Anthropic Cloud API',
    architecture: 'Hybrid Autoregressive / Extended Thinking Transformer',
    isSovereignLocal: false,
    contextWindowTokens: 200000,
    typicalLatencyMs: 920.0,
    nativeVoiceSupport: false,
    native3DManifoldSupport: false,
  },
  GOOGLE_GEMINI_2_0_PRO: {
    modelId: 'GOOGLE_GEMINI_2_0_PRO',
    displayName: 'Google Gemini 2.0 Pro',
    provider: 'Google Vertex / AI Studio API',
    architecture: 'MoE Multimodal Transformer',
    isSovereignLocal: false,
    contextWindowTokens: 2000000,
    typicalLatencyMs: 640.0,
    nativeVoiceSupport: false,
    native3DManifoldSupport: false,
  },
  DEEPSEEK_R1: {
    modelId: 'DEEPSEEK_R1',
    displayName: 'DeepSeek-R1 (Reasoning Model)',
    provider: 'DeepSeek Cloud / Local Weights',
    architecture: 'Reinforcement-Trained Reasoning MoE Transformer',
    isSovereignLocal: false,
    contextWindowTokens: 64000,
    typicalLatencyMs: 1100.0,
    nativeVoiceSupport: false,
    native3DManifoldSupport: false,
  },
};
