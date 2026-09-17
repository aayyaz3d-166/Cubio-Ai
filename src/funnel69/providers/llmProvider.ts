/**
 * 3D Memory Studio — Funnel 69
 * LLM Provider Neutral Interface
 */

import { LLMModelInfo, ProviderStatus, AIResponse } from '../types';

export interface ProviderRequestOptions {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly status: ProviderStatus;
  readonly capabilities: readonly string[];
  getModels(): readonly LLMModelInfo[];
  getModel(modelId: string): LLMModelInfo | undefined;
  request(
    messages: readonly { role: string; content: string }[],
    options: ProviderRequestOptions
  ): Promise<AIResponse>;
}
