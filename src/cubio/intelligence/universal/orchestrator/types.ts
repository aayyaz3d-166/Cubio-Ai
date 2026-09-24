/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F60: Universal Intelligence Orchestrator Types
 *
 * Grand unified contracts orchestrating LLMs, AI Models (Image, Voice), Tools (FS, Terminal, Web, API),
 * Multi-Agents (F55), 4-tier Universal Memory (F56), Intelligence Router (F57),
 * D0..D7 Dimensional State Model (F58), and 369 Adapter (F59).
 */

import { CubiODimension } from '../../../types';
import { LanguageCode } from '../language/types';
import { DimensionalStateNode } from '../dimension/types';
import { Derived369State } from '../adapter369/types';
import { MemoryRetrievalResult } from '../memory/types';
import { ConsensusReport } from '../agent/types';
import { UniversalWorkflowPlan } from '../workflow/types';

export type MasterOrchestratorExecutionMode =
  | 'AUTONOMOUS_PROJECT'
  | 'MULTI_AGENT_SOLVE'
  | 'VOICE_DIALOGUE'
  | 'TOOL_ASSISTED'
  | 'DIRECT_CONVERSATION';

export interface MasterOrchestratorRequest {
  readonly requestId?: string;
  readonly prompt: string;
  readonly mode?: MasterOrchestratorExecutionMode;
  readonly conversationId?: string;
  readonly projectId?: string;
  readonly targetDimension?: CubiODimension;
  readonly language?: LanguageCode;
  readonly voiceEnabled?: boolean;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface MasterOrchestratorResponse {
  readonly requestId: string;
  readonly effectivePrompt: string;
  readonly detectedLanguage: string;
  readonly mode: MasterOrchestratorExecutionMode;
  readonly textOutput: string;
  readonly voiceAudioWav?: Uint8Array;
  readonly artifactsCreated: readonly string[];
  readonly multiAgentConsensus?: ConsensusReport;
  readonly workflowPlan?: UniversalWorkflowPlan;
  readonly dimensionalState: DimensionalStateNode;
  readonly derived369State?: Derived369State;
  readonly memoryRetrieval: MemoryRetrievalResult;
  readonly executionTimeMs: number;
  readonly verificationPassed: boolean;
  readonly masterChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalMasterOrchestrator {
  executeUniversal(request: MasterOrchestratorRequest): Promise<MasterOrchestratorResponse>;
}
