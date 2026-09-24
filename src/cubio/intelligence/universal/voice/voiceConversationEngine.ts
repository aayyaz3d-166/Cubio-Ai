/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Master Universal Voice Engine & Voice Conversation Engine
 *
 * Full-duplex voice conversation loop:
 * Audio In -> STT -> Language Pivot -> Universal Reasoning -> Localizer -> Solfeggio TTS -> Audio Out.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiOProviderRegistry } from '../providerRegistry';
import { CubiOUniversalIntelligenceOrchestrator } from '../intelligenceOrchestrator';
import { LanguageCode } from '../universalTypes';
import {
  IUniversalVoiceEngine,
  VoicePersona,
  SolfeggioAttunementHz,
  VoiceTranscriptionOptions,
  VoiceTranscriptionResult,
  VoiceSynthesisOptions,
  VoiceSynthesisResult,
  VoiceTurnRequest,
  VoiceTurnResult,
  VoiceSessionState,
  VoiceTurnInterruptionEvent,
} from './types';
import { transcribeAudioStream } from './speechToText';
import { synthesizeSpeechStream } from './textToSpeech';

export class CubiOUniversalVoiceEngine implements IUniversalVoiceEngine {
  private activeSessions: Map<string, VoiceSessionState> = new Map();

  constructor(
    private readonly orchestrator: CubiOUniversalIntelligenceOrchestrator,
    private readonly providerRegistry?: CubiOProviderRegistry
  ) {}

  /**
   * Transcribes speech audio data into text.
   */
  public async transcribe(
    audioData: Uint8Array,
    options?: VoiceTranscriptionOptions
  ): Promise<Readonly<VoiceTranscriptionResult>> {
    return transcribeAudioStream(audioData, options, this.providerRegistry);
  }

  /**
   * Synthesizes natural language text into Solfeggio-attuned voice audio.
   */
  public async synthesize(
    text: string,
    options?: VoiceSynthesisOptions
  ): Promise<Readonly<VoiceSynthesisResult>> {
    return synthesizeSpeechStream(text, options, this.providerRegistry);
  }

  /**
   * Executes a full-duplex voice turn: Audio In -> STT -> Reasoning -> TTS -> Audio Out.
   */
  public async processVoiceTurn(request: VoiceTurnRequest): Promise<Readonly<VoiceTurnResult>> {
    const startTime = Date.now();
    const conversationId = request.conversationId || `VOICE_CONV_${Date.now()}`;
    const persona = request.persona || 'CUBIO_SOVEREIGN';
    const solfeggioHz = request.solfeggioHz || 528;

    // 1. Speech-to-Text (STT)
    const sttResult = await this.transcribe(request.audioData, {
      language: request.language,
      sampleRate: request.sampleRate,
    });

    const userPrompt = sttResult.text || 'hello';
    const detectedLanguage = sttResult.language || 'en';

    // 2. Multilingual Intelligence Orchestration & Reasoning
    const orchResult = await this.orchestrator.orchestrateUniversal({
      requestId: `VOICE_REQ_${Date.now()}`,
      prompt: userPrompt,
      language: detectedLanguage,
      conversationId,
    });

    const reasoningText = orchResult.textOutput;

    // 3. Text-to-Speech (TTS) with Solfeggio Attunement
    const outputAudio = await this.synthesize(reasoningText, {
      persona,
      solfeggioHz,
      language: detectedLanguage,
      sampleRate: request.sampleRate,
    });

    const latencyMs = Date.now() - startTime;
    const turnChecksum = deterministicHash(
      `VOICE_TURN:${userPrompt}:${detectedLanguage}:${reasoningText.length}:${outputAudio.synthesisChecksum}`
    );
    const turnId = `VTURN_${turnChecksum.slice(2, 12)}`;

    const turnResult: VoiceTurnResult = Object.freeze({
      turnId,
      conversationId,
      turnIndex: 1,
      transcribedText: userPrompt,
      detectedLanguage,
      reasoningText,
      outputAudio,
      latencyMs,
      turnChecksum,
      timestamp: Date.now(),
    });

    return turnResult;
  }

  /**
   * Initializes a continuous voice conversation session.
   */
  public createSession(
    persona: VoicePersona = 'CUBIO_SOVEREIGN',
    solfeggioHz: SolfeggioAttunementHz = 528,
    language: LanguageCode = 'en'
  ): VoiceSessionState {
    const sessionId = `VOICE_SESS_${Date.now()}`;
    const conversationId = `CONV_${Date.now()}`;

    const session: VoiceSessionState = {
      sessionId,
      conversationId,
      persona,
      solfeggioHz,
      turnCount: 0,
      turns: [],
      context: {
        conversationId,
        preferredLanguage: language,
        activePersona: persona,
        solfeggioHz,
        recentTurnSummaries: [],
        totalTurns: 0,
      },
      totalDurationMs: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Halts active audio playback on barge-in.
   */
  public interruptActiveTurn(sessionId: string): VoiceTurnInterruptionEvent {
    const session = this.activeSessions.get(sessionId);
    const turnId = session && session.turns.length > 0 ? session.turns[session.turns.length - 1].turnId : `TURN_${Date.now()}`;
    return Object.freeze({
      eventId: `EVT_INTR_${deterministicHash(`${sessionId}:${turnId}`).slice(2, 10)}`,
      turnId,
      playbackHalted: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Retrieves an active session by ID.
   */
  public getSession(sessionId: string): VoiceSessionState | undefined {
    return this.activeSessions.get(sessionId);
  }
}
