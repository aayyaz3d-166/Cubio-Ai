/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F48: Universal Modality Encoders
 *
 * Deterministic feature encoders for Text, Image, Audio, Video, 3D Geometry, and Structured Data.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  TextInputPayload,
  ImageInputPayload,
  AudioInputPayload,
  VideoInputPayload,
  GeometryInputPayload,
  ModalityFeatureTensor,
} from './types';
import { encodeVideoPayload } from './videoProcessor';

/**
 * Encodes text inputs into a normalized 8D semantic feature tensor.
 */
export function encodeText(payload: TextInputPayload): Readonly<ModalityFeatureTensor> {
  const text = payload.text || '';
  const length = text.length;
  const tokenCount = payload.tokens?.length || (text.trim() ? text.trim().split(/\s+/).length : 0);
  const hashVal = parseInt(deterministicHash(`TXT_TENSOR:${text}`).slice(2, 8), 16);

  const tensor = [
    Number((Math.min(1.0, length / 500)).toFixed(4)),
    Number((Math.min(1.0, tokenCount / 100)).toFixed(4)),
    Number((((hashVal % 1000) / 1000)).toFixed(4)),
    Number(((((hashVal >> 4) % 1000) / 1000)).toFixed(4)),
    Number(((((hashVal >> 8) % 1000) / 1000)).toFixed(4)),
    payload.sentiment ?? 0.0,
    Number((payload.language === 'en' ? 1.0 : 0.8).toFixed(4)),
    0.95,
  ];

  const checksum = deterministicHash(`TXT:${text}:${JSON.stringify(tensor)}`);
  const rawSummary = `Text stream: ${tokenCount} tokens (${length} chars), language: ${payload.language || 'auto'}`;

  return Object.freeze({
    modality: 'TEXT' as const,
    tensor: Object.freeze(tensor),
    rawSummary,
    energy: Number((Math.min(1.0, 0.5 + length / 1000)).toFixed(4)),
    confidence: 0.99,
    checksum,
  });
}

/**
 * Encodes image inputs into an 8D visual-spatial feature tensor.
 */
export function encodeImage(payload: ImageInputPayload): Readonly<ModalityFeatureTensor> {
  const width = payload.width || 512;
  const height = payload.height || 512;
  const aspectRatio = Number((width / height).toFixed(4));
  const detectedCount = payload.detectedObjects?.length || 1;
  const bounds = payload.spatialBounds || [0, 0, width, height];

  const hashVal = parseInt(deterministicHash(`IMG_TENSOR:${width}:${height}:${payload.imageUrl || ''}`).slice(2, 8), 16);

  const tensor = [
    Number((width / 4096).toFixed(4)),
    Number((height / 4096).toFixed(4)),
    aspectRatio,
    Number((Math.min(1.0, detectedCount / 10)).toFixed(4)),
    Number((bounds[0] / width).toFixed(4)),
    Number((bounds[1] / height).toFixed(4)),
    Number((((hashVal % 1000) / 1000)).toFixed(4)),
    0.92,
  ];

  const checksum = deterministicHash(`IMG:${width}x${height}:${JSON.stringify(tensor)}`);
  const rawSummary = `Image stream: ${width}x${height} (${aspectRatio} aspect), ${detectedCount} detected visual bounds`;

  return Object.freeze({
    modality: 'IMAGE' as const,
    tensor: Object.freeze(tensor),
    rawSummary,
    energy: 0.88,
    confidence: 0.95,
    checksum,
  });
}

/**
 * Encodes acoustic audio inputs into an 8D harmonic resonance feature tensor.
 */
export function encodeAudio(payload: AudioInputPayload): Readonly<ModalityFeatureTensor> {
  const freq = payload.frequencyHz || 528.0;
  const sampleRate = payload.sampleRate || 44100;
  const duration = payload.durationMs || 1000;
  const energy = payload.spectralEnergy ?? 0.85;

  const tensor = [
    Number((Math.min(1.0, freq / 1000)).toFixed(4)),
    Number((sampleRate / 96000).toFixed(4)),
    Number((Math.min(1.0, duration / 10000)).toFixed(4)),
    Number(energy.toFixed(4)),
    payload.solfeggioNote ? 0.963 : 0.528,
    Number((payload.channels === 2 ? 1.0 : 0.5).toFixed(4)),
    0.998, // 369 harmonic resonance factor
    0.91,
  ];

  const checksum = deterministicHash(`AUD:${freq}Hz:${duration}ms:${JSON.stringify(tensor)}`);
  const rawSummary = `Audio stream: ${freq}Hz (${payload.solfeggioNote || 'Solfeggio'}), ${duration}ms duration, ${sampleRate}Hz sample rate`;

  return Object.freeze({
    modality: 'AUDIO' as const,
    tensor: Object.freeze(tensor),
    rawSummary,
    energy: Number(energy.toFixed(4)),
    confidence: 0.94,
    checksum,
  });
}

/**
 * Encodes 3D geometry inputs into an 8D topological spatial feature tensor.
 */
export function encodeGeometry(payload: GeometryInputPayload): Readonly<ModalityFeatureTensor> {
  const vCount = payload.vertices.length;
  const fCount = payload.faces?.length || Math.max(1, Math.round(vCount * 1.5));
  const centroid = payload.centroid || [0, 0, 0];
  const euler = payload.eulerCharacteristic ?? (vCount - Math.round(vCount * 2.5) + fCount);

  const tensor = [
    Number((Math.min(1.0, vCount / 1000)).toFixed(4)),
    Number((Math.min(1.0, fCount / 1000)).toFixed(4)),
    centroid[0],
    centroid[1],
    centroid[2],
    Number((euler / 10).toFixed(4)),
    payload.manifoldType === 'COMPACT_3_MANIFOLD' ? 1.0 : 0.75,
    0.98,
  ];

  const checksum = deterministicHash(`GEO:${vCount}v:${fCount}f:${JSON.stringify(tensor)}`);
  const rawSummary = `Geometry 3D: ${vCount} vertices, ${fCount} faces, Euler characteristic chi = ${euler}, centroid [${centroid.join(', ')}]`;

  return Object.freeze({
    modality: 'GEOMETRY_3D' as const,
    tensor: Object.freeze(tensor),
    rawSummary,
    energy: 0.92,
    confidence: 0.98,
    checksum,
  });
}

/**
 * Encodes structured data into an 8D tensor.
 */
export function encodeStructured(data: Readonly<Record<string, unknown>>): Readonly<ModalityFeatureTensor> {
  const keyCount = Object.keys(data).length;
  const jsonStr = JSON.stringify(data);
  const hashVal = parseInt(deterministicHash(`STRUCT_TENSOR:${jsonStr}`).slice(2, 8), 16);

  const tensor = [
    Number((Math.min(1.0, keyCount / 50)).toFixed(4)),
    Number((Math.min(1.0, jsonStr.length / 2000)).toFixed(4)),
    Number((((hashVal % 1000) / 1000)).toFixed(4)),
    Number(((((hashVal >> 4) % 1000) / 1000)).toFixed(4)),
    Number(((((hashVal >> 8) % 1000) / 1000)).toFixed(4)),
    0.5,
    0.85,
    0.90,
  ];

  const checksum = deterministicHash(`STRUCT:${jsonStr}:${JSON.stringify(tensor)}`);
  const rawSummary = `Structured payload: ${keyCount} top-level fields (${jsonStr.length} bytes)`;

  return Object.freeze({
    modality: 'STRUCTURED' as const,
    tensor: Object.freeze(tensor),
    rawSummary,
    energy: 0.75,
    confidence: 0.92,
    checksum,
  });
}

/**
 * Encodes video payload using the video processor.
 */
export function encodeVideo(payload: VideoInputPayload): Readonly<ModalityFeatureTensor> {
  return encodeVideoPayload(payload);
}
