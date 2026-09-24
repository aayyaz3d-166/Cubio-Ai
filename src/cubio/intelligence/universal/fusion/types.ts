/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F65: Universal Multimodal Fusion Types & Contracts
 *
 * Combines Text + Image + Voice + Code + Spatial + Data + Tools across the full stack:
 * Voice (STT) + Image (Vision) -> LLM Reasoning -> Spatial/CAD Analysis -> Workflow Engine -> Project Intelligence -> Response
 */

export interface MultimodalVoiceInput {
  readonly audioData?: Uint8Array;
  readonly sampleRate?: number;
  readonly language?: string;
  readonly audioText?: string; // Pre-transcribed or simulated speech
}

export interface MultimodalImageInput {
  readonly imageData?: Uint8Array;
  readonly imageUrl?: string;
  readonly width?: number;
  readonly height?: number;
  readonly mimeType?: string;
}

export interface MultimodalSpatialInput {
  readonly vertices?: readonly (readonly [number, number, number])[];
  readonly targetDimension?: string;
}

export interface MultimodalFusionInput {
  readonly text?: string;
  readonly voice?: MultimodalVoiceInput;
  readonly image?: MultimodalImageInput;
  readonly code?: string;
  readonly spatial?: MultimodalSpatialInput;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly tools?: readonly string[];
}

export interface VisionAnalysisResult {
  readonly detectedEntities: readonly string[];
  readonly colorPalette: readonly string[];
  readonly spatialBounds: readonly [number, number, number, number];
  readonly visualConfidence: number;
}

export interface LLMReasoningSynthesis {
  readonly coreIntent: string;
  readonly domain: string;
  readonly suggestedImprovements: readonly string[];
  readonly architecturalDirectives: readonly string[];
  readonly confidence: number;
}

export interface SpatialCadAnalysisResult {
  readonly vertexCount: number;
  readonly edgeCount: number;
  readonly faceCount: number;
  readonly isClosedManifold: boolean;
  readonly eulerCharacteristic: number; // V - E + F
  readonly spatialChecksum: string;
}

export interface WorkflowProposalResult {
  readonly planId: string;
  readonly totalSteps: number;
  readonly stagingUrl: string;
  readonly workflowChecksum: string;
}

export interface ProjectContextFusionResult {
  readonly projectId: string;
  readonly healthScore: number;
  readonly overallProgressPercent: number;
  readonly activeTasksCount: number;
}

export interface MultimodalFusionResult {
  readonly fusionId: string;
  readonly voiceTranscription: string;
  readonly visionAnalysis: VisionAnalysisResult;
  readonly llmReasoning: LLMReasoningSynthesis;
  readonly spatialAnalysis: SpatialCadAnalysisResult;
  readonly workflowProposal: WorkflowProposalResult;
  readonly projectContext: ProjectContextFusionResult;
  readonly responseText: string;
  readonly fusionChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalMultimodalFusionEngine {
  fuseMultimodal(input: MultimodalFusionInput): Promise<Readonly<MultimodalFusionResult>>;
}
