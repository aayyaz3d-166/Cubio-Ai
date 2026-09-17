/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F24: CubiO Intelligence Natural Response Engine (Types & Contracts)
 *
 * Master specification for converting raw spatial engine outputs and mathematical proofs
 * into articulate, user-friendly natural language dialogues.
 */

import { CubiODimension } from '../../types';
import { EngineExecutionResult } from '../core/types';

export type ResponseToneStyle =
  | 'CONVERSATIONAL'
  | 'EXECUTIVE_SUMMARY'
  | 'TECHNICAL_PROOFS'
  | 'CREATIVE_POETIC'
  | 'TUTORIAL_WALKTHROUGH';

export interface NaturalResponseRequest {
  readonly requestId: string;
  readonly userPrompt: string;
  readonly rawEngineResult: EngineExecutionResult;
  readonly preferredTone?: ResponseToneStyle;
  readonly includeFormalProofs?: boolean;
  readonly activeDimension?: CubiODimension;
  readonly conversationContext?: {
    readonly previousPrompt?: string;
    readonly previousResponse?: string;
    readonly turnCount?: number;
  };
}

export interface NaturalResponseResult {
  readonly responseId: string;
  readonly naturalText: string;
  readonly executiveSummary: string;
  readonly actionableTakeaways: readonly string[];
  readonly toneStyle: ResponseToneStyle;
  readonly resonanceScore: number;
  readonly sourceEngineId: string;
  readonly underlyingProofChecksum: string;
  readonly responseChecksum: string;
}
