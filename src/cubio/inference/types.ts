/**
 * CubiO — Universal Spatial Operating Environment
 * Production Inference Runtime & Pretrained Model Types
 *
 * Specifications for:
 * - End-to-End Chat & Streaming Inference Pipeline
 * - Real Pretrained Model Weights & Tokenizer
 * - ONNX Runtime Tensor Forward Execution
 * - Autoregressive Token Generation Loop & Chunk Streaming
 * - Multi-Turn Context Window & Dynamic Memory Retention
 * - Honest Provenance (Pretrained vs Synthetic)
 * - Real-Time Latency Telemetry (TTFT, ITL, Tokens/Sec)
 */

import { ResultClassification } from '../foundation/v1/types';

// ─── 1. INFERENCE REQUEST & RESPONSE TYPES ──────────────────────────────────

export interface InferenceGenerationConfig {
  readonly maxNewTokens?: number;
  readonly temperature?: number;
  readonly topK?: number;
  readonly topP?: number;
  readonly repetitionPenalty?: number;
  readonly stopSequences?: readonly string[];
  readonly seed?: number;
  readonly stream?: boolean;
}

export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
  readonly timestamp?: number;
}

export interface InferenceChatRequest {
  readonly messages: readonly ChatMessage[];
  readonly sessionId?: string;
  readonly tenantId?: string;
  readonly config?: InferenceGenerationConfig;
}

export interface InferenceStreamChunk {
  readonly chunkId: string;
  readonly textChunk: string;
  readonly tokenIndex: number;
  readonly tokenId: number;
  readonly isFinal: boolean;
  readonly finishReason?: 'stop' | 'length' | 'error';
  readonly ttftMs?: number;
  readonly latencyMs?: number;
}

export interface InferenceTelemetryInfo {
  readonly inputTokenIds: readonly number[];
  readonly modelIdentifier: string;
  readonly logitsChecksum: string;
  readonly first10SampledTokenIds: readonly number[];
  readonly generatedTokenCount: number;
  readonly finalDecodedText: string;
  readonly sourceFunction: string;
  readonly entropy?: number;
  readonly logitMin?: number;
  readonly logitMax?: number;
  readonly logitMean?: number;
  readonly logitStd?: number;
}

export interface InferenceProvenance {
  readonly modelType: 'pretrained' | 'synthetic' | 'cubio_core_hybrid';
  readonly modelCheckpointHash: string;
  readonly modelArchitecture: string;
  readonly parameterCount: number | string;
  readonly weightsSource: string;
  readonly tokenizer: string;
  readonly inferenceRuntime: string;
  readonly syntheticFallback: boolean;
  readonly verifiedNonFallback: boolean;
}

export interface InferenceChatResponse {
  readonly responseId: string;
  readonly sessionId: string;
  readonly message: ChatMessage;
  readonly generatedTokenCount: number;
  readonly promptTokenCount: number;
  readonly finishReason: 'stop' | 'length' | 'error';
  readonly metrics: InferenceMetrics;
  readonly provenance: InferenceProvenance;
  readonly responseType: 'REAL_MODEL_RESPONSE';
  readonly classification: ResultClassification;
  readonly telemetry?: InferenceTelemetryInfo;
  readonly pipelineTrace?: any;
}

// ─── 2. TELEMETRY & LATENCY CONTRACTS ───────────────────────────────────────

export interface InferenceMetrics {
  readonly timeToFirstTokenMs: number;
  readonly totalLatencyMs: number;
  readonly generationLatencyMs: number;
  readonly tokensPerSecond: number;
  readonly interTokenLatencyMs: number;
  readonly peakMemoryRSSBytes: number;
}

// ─── 3. BACKEND & HEALTH TYPES ──────────────────────────────────────────────

export interface BackendHealthStatus {
  readonly status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  readonly modelLoaded: boolean;
  readonly checkpointHash: string;
  readonly activeSessions: number;
  readonly totalRequestsHandled: number;
  readonly averageLatencyMs: number;
  readonly uptimeSeconds: number;
  readonly fallbackOccurred: boolean;
  readonly modelProvenance?: InferenceProvenance;
}
