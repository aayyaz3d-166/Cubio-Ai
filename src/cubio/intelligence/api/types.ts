/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F17: CubiO Intelligence API (Types & Contracts)
 *
 * Universal request and response DTO specifications connecting Studio frontend
 * controls to backend CubiO Intelligence Core engines.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';
import { ReasoningMode, ReasoningProofReport } from '../reasoning/types';
import { StatePredictionReport } from '../prediction/types';
import { DecisionCandidateOption, DecisionReport } from '../decision/types';
import { GeneratedArtifactManifest, OutputModalityType } from '../generation/types';
import { CubiOFileInspectionReport } from '../file/types';
import { VirtualMemoryStats } from '../virtual_memory/types';
import { EngineHealthReport } from '../core/types';

export interface BaseApiRequest {
  readonly clientRequestId?: string;
  readonly sovereignCubId?: string;
  readonly activeDimension?: CubiODimension;
  readonly harmonic?: Partial<CubiOHarmonic369>;
}

export interface BaseApiResponse {
  readonly success: boolean;
  readonly responseId: string;
  readonly timestamp: number;
  readonly latencyMs: number;
  readonly checksum: string;
}

// 1. Chat API
export interface IntelligenceChatApiRequest extends BaseApiRequest {
  readonly prompt: string;
  readonly conversationId?: string;
  readonly baseState?: CubiOState;
  readonly history?: readonly { role: 'USER' | 'ASSISTANT'; content: string }[];
}

export interface IntelligenceChatApiResponse extends BaseApiResponse {
  readonly textOutput: string;
  readonly confidence: number;
  readonly resonanceScore: number;
  readonly activeDimension: CubiODimension;
  readonly reasoningSteps?: readonly {
    stepIndex: number;
    claim: string;
    evidence: string;
    dimension: CubiODimension;
    confidence: number;
    resonanceScore: number;
  }[];
  readonly artifacts?: GeneratedArtifactManifest;
}

// 2. Reasoning API
export interface IntelligenceReasonApiRequest extends BaseApiRequest {
  readonly hypothesis: string;
  readonly mode?: ReasoningMode;
  readonly baseState?: CubiOState;
  readonly states?: readonly CubiOState[];
}

export interface IntelligenceReasonApiResponse extends BaseApiResponse {
  readonly proofReport: ReasoningProofReport;
  readonly theoremValidated: boolean;
}

// 3. Prediction API
export interface IntelligencePredictApiRequest extends BaseApiRequest {
  readonly baseState: CubiOState;
  readonly horizonSteps?: number;
  readonly candidateCountPerStep?: number;
  readonly interventions?: readonly string[];
}

export interface IntelligencePredictApiResponse extends BaseApiResponse {
  readonly predictionReport: StatePredictionReport;
}

// 4. Inspection API
export interface IntelligenceInspectApiRequest extends BaseApiRequest {
  readonly rawCubioFileContent?: string;
  readonly stateId?: string;
}

export interface IntelligenceInspectApiResponse extends BaseApiResponse {
  readonly fileReport?: CubiOFileInspectionReport;
  readonly stateSnapshot?: CubiOState;
  readonly digitalRoot369: number;
  readonly isTamperEvident: boolean;
}

// 5. Generation API
export interface IntelligenceGenerateApiRequest extends BaseApiRequest {
  readonly prompt: string;
  readonly modalities: readonly OutputModalityType[];
  readonly baseState?: CubiOState;
  readonly targetDimension?: CubiODimension;
}

export interface IntelligenceGenerateApiResponse extends BaseApiResponse {
  readonly manifest: GeneratedArtifactManifest;
}

// 6. Decision API
export interface IntelligenceDecisionApiRequest extends BaseApiRequest {
  readonly contextPrompt: string;
  readonly candidateOptions?: readonly DecisionCandidateOption[];
  readonly currentState?: CubiOState;
}

export interface IntelligenceDecisionApiResponse extends BaseApiResponse {
  readonly decisionReport: DecisionReport;
}

// 7. Virtual Memory Stats API
export interface IntelligenceVirtualMemoryApiResponse extends BaseApiResponse {
  readonly stats: VirtualMemoryStats;
}

// 8. Health API
export interface IntelligenceHealthApiResponse extends BaseApiResponse {
  readonly systemStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  readonly engines: Record<string, EngineHealthReport>;
}
