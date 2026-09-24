/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal UI Types & Contracts
 *
 * Full contracts for the unified 10-capability UI interface.
 */

import { UniversalApiResponse } from '../api/types';

export type UniversalUITab =
  | 'CHAT'
  | 'IMAGE'
  | 'VOICE'
  | 'FILES'
  | 'CODE'
  | 'PROJECT'
  | 'WORKFLOW'
  | 'AGENTS'
  | 'ARTIFACTS';

export interface UniversalUIMessage {
  readonly id: string;
  readonly sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  readonly text: string;
  readonly timestamp: number;
  readonly modalities?: readonly string[];
  readonly artifacts?: readonly unknown[];
  readonly audioUrl?: string;
  readonly imageUrl?: string;
  readonly codeSnippet?: string;
}

export interface UniversalUIState {
  readonly activeTab: UniversalUITab;
  readonly messages: readonly UniversalUIMessage[];
  readonly inputText: string;
  readonly selectedImage?: { readonly url: string; readonly width: number; readonly height: number };
  readonly isRecordingVoice: boolean;
  readonly attachedFiles: readonly { readonly path: string; readonly name: string }[];
  readonly codeBuffer: string;
  readonly projectHealthScore: number;
  readonly projectProgressPercent: number;
  readonly workflowStagesStatus: readonly { readonly stage: string; readonly status: string }[];
  readonly workflowAwaitingAuthorization: boolean;
  readonly artifactsList: readonly { readonly name: string; readonly type: string; readonly uri?: string }[];
  readonly isProcessing: boolean;
  readonly currentDimension: string;
}

export interface IUniversalUIBridge {
  sendOmniRequest(state: Partial<UniversalUIState>): Promise<Readonly<UniversalApiResponse>>;
  authorizeCurrentWorkflow(): Promise<Readonly<UniversalApiResponse>>;
}
