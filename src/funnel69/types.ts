/**
 * 3D Memory Studio — Funnel 69
 * AI Chat & Multi-LLM Model Engine Types
 */

import { DataClassification } from '../funnel47/types';
import { SimulationDimension } from '../funnel52/types';

export type ProviderStatus = 'READY' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'ERROR';
export type ModelStatus = 'READY' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'ERROR';

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type MessageStatus = 'PENDING' | 'STREAMING' | 'COMPLETE' | 'ERROR' | 'CANCELLED';

export type AIActionType =
  | 'FOCUS_STATE'
  | 'FOCUS_CLUSTER'
  | 'FOCUS_RELATIONSHIP'
  | 'SHOW_INFORMATION'
  | 'SHOW_DATABASE'
  | 'SHOW_GRAPH'
  | 'SHOW_CLUSTERS'
  | 'SWITCH_DIMENSION';

export interface AIAction {
  type: AIActionType;
  targetId?: string;
  dimension?: SimulationDimension;
  payload?: Record<string, unknown>;
}

export interface AIResponse {
  text: string;
  actions?: AIAction[];
  citations?: string[];
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  modelId?: string;
  status: MessageStatus;
  actions?: AIAction[];
  citations?: string[];
  error?: string;
}

export interface LLMModelInfo {
  id: string;
  name: string;
  capabilities: string[];
  contextWindow?: number;
  status?: ModelStatus;
}

export interface LLMProviderInfo {
  id: string;
  name: string;
  models: LLMModelInfo[];
  status: ProviderStatus;
  capabilities: string[];
}

export interface AIContext {
  query: string;
  selectedStateId?: string;
  entityType?: string;
  classification?: DataClassification;
  dimension?: SimulationDimension;
  dimensionLabel?: string;
  isPhysicalSpatial?: boolean;
  coordinates?: readonly [number, number, number];
  relationships?: readonly string[];
  clusterId?: string;
  searchResults?: readonly string[];
  formattedPromptContext: string;
}

export interface ChatViewState {
  activeProviderId: string | null;
  activeModelId: string | null;
  status: MessageStatus | 'READY' | 'THINKING';
  messages: readonly ChatMessage[];
  lastError: string | null;
  canSend: boolean;
  canCancel: boolean;
  canRetry: boolean;
}

export interface F69TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F69SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F69TestResult[];
}
