/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Universal Text-to-Speech Synthesizer
 *
 * Converts natural language text into voice audio with Solfeggio acoustic attunement
 * and multi-provider orchestration.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiOProviderRegistry } from '../providerRegistry';
import { ISpeechProvider } from '../universalTypes';
import { VoiceSynthesisOptions, VoiceSynthesisResult } from './types';
import { synthesizeSolfeggioWAV } from './wavSynthesizer';

/**
 * Synthesizes natural language text into voice audio bytes.
 */
export async function synthesizeSpeechStream(
  text: string,
  options: VoiceSynthesisOptions = {},
  registry?: CubiOProviderRegistry
): Promise<Readonly<VoiceSynthesisResult>> {
  const solfeggioHz = options.solfeggioHz || 528;
  const persona = options.persona || 'CUBIO_SOVEREIGN';
  const sampleRate = options.sampleRate || 24000;

  // Check external speech provider
  if (registry) {
    const speechProvider = registry.getProvider<ISpeechProvider>('SPEECH');
    if (speechProvider && speechProvider.getInfo().status === 'AVAILABLE') {
      const res = await speechProvider.textToSpeech(text, {
        language: options.language,
        voice: persona,
        format: 'wav',
      });

      const audioData = res.audioData || synthesizeSolfeggioWAV(text, solfeggioHz, persona, sampleRate).audioData;
      const checksum = deterministicHash(`TTS_EXT:${res.providerId}:${text.length}:${solfeggioHz}`);

      return Object.freeze({
        audioData,
        format: 'wav' as const,
        sampleRate,
        durationMs: res.durationMs || 1500,
        solfeggioHz,
        persona,
        providerId: res.providerId,
        synthesisChecksum: checksum,
      });
    }
  }

  // Sovereign offline Solfeggio-attuned WAV synthesizer
  return synthesizeSolfeggioWAV(text, solfeggioHz, persona, sampleRate);
}
