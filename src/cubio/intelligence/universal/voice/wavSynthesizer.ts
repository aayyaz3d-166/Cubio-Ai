/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Sovereign 16-Bit PCM WAV Audio Synthesizer
 *
 * Generates standard compliant RIFF/WAVE audio byte arrays with
 * Solfeggio acoustic carrier frequency attunement and ADSR envelopes.
 */

import { deterministicHash } from '../../../state/determinism';
import { SolfeggioAttunementHz, VoicePersona, VoiceSynthesisResult } from './types';

/**
 * Creates standard 44-byte RIFF/WAVE header for 16-bit mono PCM.
 */
export function createWavHeader(dataByteLength: number, sampleRate: number = 24000): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // RIFF Chunk Descriptor
  header[0] = 0x52; // 'R'
  header[1] = 0x49; // 'I'
  header[2] = 0x46; // 'F'
  header[3] = 0x46; // 'F'
  view.setUint32(4, 36 + dataByteLength, true); // ChunkSize
  header[8] = 0x57; // 'W'
  header[9] = 0x41; // 'A'
  header[10] = 0x56; // 'V'
  header[11] = 0x45; // 'E'

  // "fmt " sub-chunk
  header[12] = 0x66; // 'f'
  header[13] = 0x6d; // 'm'
  header[14] = 0x74; // 't'
  header[15] = 0x20; // ' '
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);  // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * 1 * 2)
  view.setUint16(32, 2, true);  // BlockAlign (1 * 16/8 = 2)
  view.setUint16(34, 16, true); // BitsPerSample (16-bit)

  // "data" sub-chunk
  header[36] = 0x64; // 'd'
  header[37] = 0x61; // 'a'
  header[38] = 0x74; // 't'
  header[39] = 0x61; // 'a'
  view.setUint32(40, dataByteLength, true); // Subchunk2Size

  return header;
}

/**
 * Synthesizes a valid 16-bit PCM WAV audio waveform attuned to a Solfeggio frequency.
 */
export function synthesizeSolfeggioWAV(
  text: string,
  solfeggioHz: SolfeggioAttunementHz = 528,
  persona: VoicePersona = 'CUBIO_SOVEREIGN',
  sampleRate: number = 24000
): Readonly<VoiceSynthesisResult> {
  const textLen = Math.max(1, text.length);
  // Compute duration proportional to speech length (~60ms per char, min 600ms, max 8000ms)
  const durationMs = Math.min(8000, Math.max(600, Math.round(textLen * 60)));
  const totalSamples = Math.round((durationMs / 1000) * sampleRate);
  const dataByteLength = totalSamples * 2; // 16-bit = 2 bytes per sample

  const wavBuffer = new Uint8Array(44 + dataByteLength);
  const header = createWavHeader(dataByteLength, sampleRate);
  wavBuffer.set(header, 0);

  const view = new DataView(wavBuffer.buffer);

  // Determine base pitch based on persona
  let pitchOffset = 0;
  if (persona === 'HARMONIC_ORACLE') pitchOffset = 120;
  else if (persona === 'SPATIAL_NAVIGATOR') pitchOffset = -40;
  else if (persona === 'NEO_SAGE') pitchOffset = -80;

  const f0 = solfeggioHz + pitchOffset;
  const fHarmonic = solfeggioHz * 1.5;

  // Synthesize audio waveform samples
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const progress = i / totalSamples;

    // ADSR Envelope
    let envelope = 1.0;
    if (progress < 0.08) {
      envelope = progress / 0.08; // Attack
    } else if (progress < 0.20) {
      envelope = 1.0 - (progress - 0.08) * 0.15; // Decay
    } else if (progress > 0.85) {
      envelope = Math.max(0, 1.0 - (progress - 0.85) / 0.15); // Release
    }

    // Text phoneme modulation: index into char codes
    const charIdx = Math.floor(progress * textLen);
    const charCode = text.charCodeAt(charIdx) || 65;
    const formantMod = 1.0 + ((charCode % 16) - 8) * 0.04;

    // Multi-frequency Solfeggio acoustic carrier synthesis
    const s1 = Math.sin(2 * Math.PI * (f0 * formantMod) * t);
    const s2 = 0.35 * Math.sin(2 * Math.PI * fHarmonic * t);
    const s3 = 0.15 * Math.sin(2 * Math.PI * (f0 * 2) * t);

    const sampleFloat = (s1 + s2 + s3) * envelope * 0.75;
    // Quantize to 16-bit signed integer [-32768, 32767]
    const sampleInt16 = Math.max(-32768, Math.min(32767, Math.round(sampleFloat * 32767)));

    view.setInt16(44 + i * 2, sampleInt16, true);
  }

  const checksum = deterministicHash(`WAV:${solfeggioHz}:${persona}:${durationMs}:${dataByteLength}`);

  return Object.freeze({
    audioData: wavBuffer,
    format: 'wav' as const,
    sampleRate,
    durationMs,
    solfeggioHz,
    persona,
    providerId: 'CUBIO_SOVEREIGN_SOLFEGGIO_SYNTHESIZER',
    synthesisChecksum: checksum,
  });
}
