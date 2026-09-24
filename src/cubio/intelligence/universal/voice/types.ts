/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F51: Voice Intelligence Types & Contracts
 *
 * Core contracts for Speech-to-Text (STT), Text-to-Speech (TTS),
 * Solfeggio Acoustic Attunement, Interruption Handling (Barge-in),
 * and Conversational Context Memory.
 *
 * Architecture:
 * Microphone -> STT -> Universal Intelligence -> LLM / Engines -> TTS -> Voice Output
 */

import { LanguageCode, ProviderInfo, ProviderStatus } from '../universalTypes';

export type VoicePersona =
  | 'CUBIO_SOVEREIGN'
  | 'HARMONIC_ORACLE'
  | 'SPATIAL_NAVIGATOR'
  | 'NEO_SAGE';

export type SolfeggioAttunementHz = 528 | 432 | 963 | 369 | 639;

export interface VoiceTranscriptionOptions {
  readonly language?: LanguageCode;
  readonly prompt?: string;
  readonly sampleRate?: number;
}

export interface VoiceTranscriptionResult {
  readonly text: string;
  readonly language: LanguageCode;
  readonly confidence: number;
  readonly durationMs: number;
  readonly providerId: string;
  readonly transcriptionChecksum: string;
}

export interface VoiceSynthesisOptions {
  readonly persona?: VoicePersona;
  readonly solfeggioHz?: SolfeggioAttunementHz;
  readonly language?: LanguageCode;
  readonly sampleRate?: number;
  readonly pitchShift?: number;
  readonly speedRate?: number;
}

export interface VoiceSynthesisResult {
  readonly audioData: Uint8Array;
  readonly format: 'wav' | 'mp3' | 'ogg';
  readonly sampleRate: number;
  readonly durationMs: number;
  readonly solfeggioHz: SolfeggioAttunementHz;
  readonly persona: VoicePersona;
  readonly providerId: string;
  readonly synthesisChecksum: string;
}

// ─── INTERRUPTION & CONVERSATIONAL CONTEXT ─────────────────────────────────

export interface VoiceInterruptionSignal {
  readonly sessionId: string;
  readonly turnId: string;
  readonly interruptedAtMs: number;
  readonly reason: 'USER_BARGE_IN' | 'EXPLICIT_CANCEL' | 'TIMEOUT';
}

export interface VoiceTurnInterruptionEvent {
  readonly eventId: string;
  readonly turnId: string;
  readonly playbackHalted: boolean;
  readonly timestamp: number;
}

export interface VoiceConversationalContext {
  readonly conversationId: string;
  readonly preferredLanguage: LanguageCode;
  readonly activePersona: VoicePersona;
  readonly solfeggioHz: SolfeggioAttunementHz;
  readonly recentTurnSummaries: readonly string[];
  readonly totalTurns: number;
}

export interface VoiceTurnRequest {
  readonly audioData: Uint8Array;
  readonly conversationId?: string;
  readonly persona?: VoicePersona;
  readonly solfeggioHz?: SolfeggioAttunementHz;
  readonly language?: LanguageCode;
  readonly sampleRate?: number;
  readonly allowInterruption?: boolean;
}

export interface VoiceTurnResult {
  readonly turnId: string;
  readonly conversationId: string;
  readonly turnIndex: number;
  readonly transcribedText: string;
  readonly detectedLanguage: LanguageCode;
  readonly reasoningText: string;
  readonly outputAudio: VoiceSynthesisResult;
  readonly latencyMs: number;
  readonly interrupted?: boolean;
  readonly turnChecksum: string;
  readonly timestamp: number;
}

export interface VoiceSessionState {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly persona: VoicePersona;
  readonly solfeggioHz: SolfeggioAttunementHz;
  readonly turnCount: number;
  readonly turns: readonly VoiceTurnResult[];
  readonly context: VoiceConversationalContext;
  readonly totalDurationMs: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

// ─── PLUGGABLE VOICE PROVIDER CONTRACT ─────────────────────────────────────

export interface IVoiceIntelligenceProvider {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  transcribe(audioData: Uint8Array, options?: VoiceTranscriptionOptions): Promise<Readonly<VoiceTranscriptionResult>>;
  synthesize(text: string, options?: VoiceSynthesisOptions): Promise<Readonly<VoiceSynthesisResult>>;
}

export interface IUniversalVoiceEngine {
  transcribe(audioData: Uint8Array, options?: VoiceTranscriptionOptions): Promise<VoiceTranscriptionResult>;
  synthesize(text: string, options?: VoiceSynthesisOptions): Promise<VoiceSynthesisResult>;
  processVoiceTurn(request: VoiceTurnRequest): Promise<VoiceTurnResult>;
  interruptActiveTurn(sessionId: string): VoiceTurnInterruptionEvent;
  createSession(persona?: VoicePersona, solfeggioHz?: SolfeggioAttunementHz, language?: LanguageCode): VoiceSessionState;
  getSession(sessionId: string): VoiceSessionState | undefined;
}
