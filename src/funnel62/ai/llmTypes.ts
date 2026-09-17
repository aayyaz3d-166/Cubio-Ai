/**
 * 3D Memory Studio — Funnel 62
 * AI LLM Provider & Hub Types
 */

import { DataClassification } from '../../funnel47/types';

export type LLMProviderId = 'GOOGLE_GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'LOCAL_LLM' | 'CUSTOM';

export interface LLMModelInfo {
  readonly modelId: string;
  readonly providerId: LLMProviderId;
  readonly providerName: string;
  readonly displayName: string;
  readonly contextWindowTokens: number;
  readonly isAvailable: boolean;
  readonly isDefault?: boolean;
}

export interface AIContextPayload {
  readonly selectedStateId: string;
  readonly entityName: string;
  readonly category: string;
  readonly classification: DataClassification;
  readonly dimension: number;
  readonly coordinates: readonly number[];
  readonly connectedRelationships: readonly {
    readonly relationshipId: string;
    readonly type: string;
    readonly targetStateId: string;
    readonly strength: number;
  }[];
  readonly clusterInfo?: {
    readonly clusterId: string;
    readonly clusterType: string;
    readonly memberCount: number;
  };
  readonly sourceMetadata: {
    readonly domain: string;
    readonly url: string;
  };
  readonly timestamp: number;
}

export interface LLMRequest {
  readonly modelId: string;
  readonly prompt: string;
  readonly context: AIContextPayload | null;
}

export interface LLMResponse {
  readonly modelId: string;
  readonly text: string;
  readonly usageTokens: number;
  readonly durationMs: number;
}
