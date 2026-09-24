/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F51: Master Voice Intelligence Engine
 *
 * Coordinates the full 6-stage voice processing lifecycle:
 * Microphone -> STT -> Universal Intelligence -> LLM / Engines -> TTS -> Voice Output
 *
 * Full support for:
 * - Voice Chat
 * - Multilingual Speech
 * - Interruption Handling (Barge-in)
 * - Conversational Context Memory
 */

import { deterministicHash } from '../../../state/determinism';
import { LanguageCode } from '../universalTypes';
import {
  IUniversalVoiceEngine,
  IVoiceIntelligenceProvider,
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
import { SovereignVoiceProvider } from './adapters/sovereignVoiceProvider';
import { VoiceInterruptionController } from './pipeline/voiceInterruptionController';
import { VoiceContextManager } from './pipeline/voiceContextManager';
import { CubiOUniversalIntelligenceOrchestrator } from '../intelligenceOrchestrator';
import { CubiOProviderRegistry } from '../providerRegistry';

export class CubiOVoiceIntelligenceEngine implements IUniversalVoiceEngine {
  private providers: Map<string, IVoiceIntelligenceProvider> = new Map();
  private activeProviderId: string;
  private sovereignFallback: SovereignVoiceProvider;
  private interruptionController = new VoiceInterruptionController();
  private contextManager = new VoiceContextManager();
  private sessions: Map<string, VoiceSessionState> = new Map();

  constructor(
    private readonly orchestrator?: CubiOUniversalIntelligenceOrchestrator,
    providerRegistry?: CubiOProviderRegistry
  ) {
    this.sovereignFallback = new SovereignVoiceProvider();
    this.registerProvider(this.sovereignFallback);
    this.activeProviderId = this.sovereignFallback.providerId;

    if (providerRegistry) {
      providerRegistry.registerProvider(this.sovereignFallback as any);
    }
  }

  public registerProvider(provider: IVoiceIntelligenceProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  public getActiveProvider(): IVoiceIntelligenceProvider {
    return this.providers.get(this.activeProviderId) || this.sovereignFallback;
  }

  public listProviders(): readonly IVoiceIntelligenceProvider[] {
    return Array.from(this.providers.values());
  }

  public createSession(
    persona: VoicePersona = 'CUBIO_SOVEREIGN',
    solfeggioHz: SolfeggioAttunementHz = 528,
    language: LanguageCode = 'en'
  ): VoiceSessionState {
    const sessionId = `VSESS_${deterministicHash(`SESSION:${Date.now()}:${persona}`).slice(2, 10)}`;
    const conversationId = `VCONV_${sessionId}`;

    const context = this.contextManager.getOrCreateContext(conversationId, persona, solfeggioHz, language);

    const session: VoiceSessionState = Object.freeze({
      sessionId,
      conversationId,
      persona,
      solfeggioHz,
      turnCount: 0,
      turns: Object.freeze([]),
      context,
      totalDurationMs: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): VoiceSessionState | undefined {
    return this.sessions.get(sessionId);
  }

  public interruptActiveTurn(sessionId: string): VoiceTurnInterruptionEvent {
    return this.interruptionController.interruptSession(sessionId);
  }

  public async transcribe(
    audioData: Uint8Array,
    options?: VoiceTranscriptionOptions
  ): Promise<Readonly<VoiceTranscriptionResult>> {
    const provider = this.getActiveProvider().getStatus() === 'AVAILABLE' ? this.getActiveProvider() : this.sovereignFallback;
    return provider.transcribe(audioData, options);
  }

  public async synthesize(
    text: string,
    options?: VoiceSynthesisOptions
  ): Promise<Readonly<VoiceSynthesisResult>> {
    const provider = this.getActiveProvider().getStatus() === 'AVAILABLE' ? this.getActiveProvider() : this.sovereignFallback;
    return provider.synthesize(text, options);
  }

  /**
   * Executes the full 6-stage Voice Turn lifecycle:
   * Microphone -> STT -> Universal Intelligence -> LLM / Engines -> TTS -> Voice Output
   */
  public async processVoiceTurn(
    request: VoiceTurnRequest
  ): Promise<Readonly<VoiceTurnResult>> {
    const startTime = Date.now();
    const conversationId = request.conversationId || `VOICE_CONV_${Date.now()}`;
    const persona = request.persona || 'CUBIO_SOVEREIGN';
    const solfeggioHz = request.solfeggioHz || 528;

    const context = this.contextManager.getOrCreateContext(conversationId, persona, solfeggioHz, request.language || 'en');

    // 1 & 2: Microphone Audio In -> Speech-to-Text (STT)
    const sttResult = await this.transcribe(request.audioData, {
      language: request.language || context.preferredLanguage,
      sampleRate: request.sampleRate,
    });

    const userPrompt = sttResult.text || 'Hello CubiO';
    const detectedLanguage = sttResult.language || 'en';

    // 3 & 4: Universal Intelligence -> LLM / Engines Reasoning
    let reasoningText = `[CubiO Voice Resonance]: Processing "${userPrompt}" in ${detectedLanguage} across 528Hz Solfeggio matrix.`;
    if (this.orchestrator) {
      const orchRes = await this.orchestrator.orchestrateUniversal({
        requestId: `VOICE_REQ_${Date.now()}`,
        prompt: userPrompt,
        language: detectedLanguage,
        conversationId,
      });
      reasoningText = orchRes.textOutput;
    }

    // 5 & 6: Text-to-Speech (TTS) -> Voice Audio Output
    const outputAudio = await this.synthesize(reasoningText, {
      persona,
      solfeggioHz,
      language: detectedLanguage,
      sampleRate: request.sampleRate,
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const turnChecksum = deterministicHash(
      `VTURN:${userPrompt}:${detectedLanguage}:${reasoningText.length}:${outputAudio.synthesisChecksum}`
    );
    const turnId = `VTURN_${turnChecksum.slice(2, 12)}`;

    const turnResult: VoiceTurnResult = Object.freeze({
      turnId,
      conversationId,
      turnIndex: context.totalTurns + 1,
      transcribedText: userPrompt,
      detectedLanguage,
      reasoningText,
      outputAudio,
      latencyMs,
      interrupted: false,
      turnChecksum,
      timestamp: Date.now(),
    });

    // Update conversational context memory
    this.contextManager.updateContextWithTurn(conversationId, turnResult);

    return turnResult;
  }
}
