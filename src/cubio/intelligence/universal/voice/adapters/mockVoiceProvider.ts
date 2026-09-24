/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F51: Hermetic Mock Voice Provider
 */

import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import {
  IVoiceIntelligenceProvider,
  VoiceTranscriptionOptions,
  VoiceTranscriptionResult,
  VoiceSynthesisOptions,
  VoiceSynthesisResult,
} from '../types';

export class MockVoiceProvider implements IVoiceIntelligenceProvider {
  public readonly providerId = 'cubio-mock-voice-provider';
  public readonly providerName = 'Hermetic Mock Voice Provider';

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'SPEECH',
      name: this.providerName,
      version: '1.0.0-mock',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'VOICE_INPUT',
        'VOICE_OUTPUT',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  public async transcribe(
    _audioData: Uint8Array,
    options?: VoiceTranscriptionOptions
  ): Promise<Readonly<VoiceTranscriptionResult>> {
    return Object.freeze({
      text: options?.prompt || 'Mock transcribed voice text',
      language: options?.language || 'en',
      confidence: 1.0,
      durationMs: 100,
      providerId: this.providerId,
      transcriptionChecksum: 'MOCK_STT_CHECKSUM',
    });
  }

  public async synthesize(
    text: string,
    options?: VoiceSynthesisOptions
  ): Promise<Readonly<VoiceSynthesisResult>> {
    return Object.freeze({
      audioData: new Uint8Array(44), // Mock 44-byte WAV header
      format: 'wav',
      sampleRate: 24000,
      durationMs: 100,
      solfeggioHz: options?.solfeggioHz || 528,
      persona: options?.persona || 'CUBIO_SOVEREIGN',
      providerId: this.providerId,
      synthesisChecksum: `MOCK_TTS_${text.length}`,
    });
  }
}
