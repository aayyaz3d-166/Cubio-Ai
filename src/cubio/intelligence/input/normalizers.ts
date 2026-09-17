/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F2: Multi-Modal Modality Normalizers
 *
 * Implements deterministic normalizers for 7 modalities:
 * Text, Numeric, Image, Audio, 3D Geometry, Sensor Telemetry, and Structured Data.
 */

import { deterministicHash } from '../../state/determinism';
import { Math369 } from '../../engine_369/math369';
import { CubiODimension } from '../../types';
import { RawInputEnvelope, CubiOStandardInput } from './types';

export class TextNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const rawStr = typeof raw.data === 'string' ? raw.data : JSON.stringify(raw.data);
    const normalizedText = rawStr.normalize('NFC').trim();
    const rawByteLength = Buffer.from ? Buffer.from(normalizedText, 'utf8').length : normalizedText.length;

    // Generate deterministic 3-value spatial tensor vector based on text harmonics
    const digitalRoot = Math369.computeDigitalRoot(rawByteLength);
    const tensorVector: number[] = [
      digitalRoot,
      (digitalRoot * 2) % 9 || 9,
      (digitalRoot * 3) % 9 || 9,
    ];

    // Compute basic character Shannon entropy
    const charCounts: Record<string, number> = {};
    for (const ch of normalizedText) {
      charCounts[ch] = (charCounts[ch] || 0) + 1;
    }
    let entropy = 0;
    const len = normalizedText.length || 1;
    for (const count of Object.values(charCounts)) {
      const p = count / len;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    const targetDimension: CubiODimension = raw.targetDimension || 'D3';
    const contentHash = deterministicHash(`TEXT:${normalizedText}:${rawByteLength}`);
    const standardInputId = `INP_TXT_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'TEXT',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector: Object.freeze(tensorVector),
      spatialDimension: targetDimension,
      structuredPayload: Object.freeze({
        charCount: normalizedText.length,
        wordCount: normalizedText.split(/\s+/).filter(Boolean).length,
        language: raw.metadata?.language || 'auto',
      }),
      rawByteLength,
      entropy: parseFloat(entropy.toFixed(4)),
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}

export class NumericNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const rawNums: number[] = Array.isArray(raw.data)
      ? raw.data.map(Number).filter(Number.isFinite)
      : [Number(raw.data) || 0];

    const len = rawNums.length || 1;
    const min = rawNums.length > 0 ? Math.min(...rawNums) : 0;
    const max = rawNums.length > 0 ? Math.max(...rawNums) : 0;
    const sum = rawNums.reduce((a, b) => a + b, 0);
    const mean = sum / len;

    const variance =
      rawNums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / len;

    // Normalization to range [0..1]
    const range = max - min || 1;
    const normalizedVector = rawNums.slice(0, 7).map((n) => parseFloat(((n - min) / range).toFixed(4)));

    while (normalizedVector.length < 3) {
      normalizedVector.push(0);
    }

    const normalizedText = `[Numeric Vector N=${rawNums.length} | Range=[${min}, ${max}] | Mean=${mean.toFixed(2)}]`;
    const contentHash = deterministicHash(`NUMERIC:${rawNums.join(',')}`);
    const standardInputId = `INP_NUM_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'NUMERIC',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector: Object.freeze(normalizedVector),
      spatialDimension: raw.targetDimension || 'D2',
      structuredPayload: Object.freeze({
        count: rawNums.length,
        min,
        max,
        mean: parseFloat(mean.toFixed(4)),
        variance: parseFloat(variance.toFixed(4)),
      }),
      rawByteLength: rawNums.length * 8,
      entropy: parseFloat((variance / (range || 1)).toFixed(4)),
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}

export class ImageNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const width = raw.metadata?.width || (typeof raw.data?.width === 'number' ? raw.data.width : 512);
    const height = raw.metadata?.height || (typeof raw.data?.height === 'number' ? raw.data.height : 512);
    const aspectRatio = parseFloat((width / (height || 1)).toFixed(3));
    const mimeType = raw.metadata?.mimeType || 'image/png';

    const normalizedText = `[Holographic Image ${width}x${height} (${mimeType}) | Aspect Ratio: ${aspectRatio}]`;
    const tensorVector = Object.freeze([
      parseFloat((width / 1024).toFixed(3)),
      parseFloat((height / 1024).toFixed(3)),
      parseFloat((aspectRatio / 2).toFixed(3)),
    ]);

    const contentHash = deterministicHash(`IMAGE:${width}x${height}:${aspectRatio}:${mimeType}`);
    const standardInputId = `INP_IMG_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'IMAGE',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector,
      spatialDimension: raw.targetDimension || 'D3',
      structuredPayload: Object.freeze({
        width,
        height,
        aspectRatio,
        mimeType,
        colorSpace: raw.metadata?.colorSpace || 'sRGB',
      }),
      rawByteLength: width * height * 4,
      entropy: 0.85,
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}

export class AudioNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const sampleRate = raw.metadata?.sampleRate || 48000;
    const durationMs = raw.metadata?.durationMs || 2000;
    const frequencyHz = raw.metadata?.frequencyHz || 369.0;
    const channels = raw.metadata?.channels || 2;

    const normalizedText = `[Audio Stream @ ${frequencyHz} Hz | ${sampleRate} Hz / ${channels}ch | ${durationMs} ms]`;
    const tensorVector = Object.freeze([
      parseFloat((frequencyHz / 1000).toFixed(3)),
      parseFloat((durationMs / 10000).toFixed(3)),
      parseFloat((sampleRate / 96000).toFixed(3)),
    ]);

    const contentHash = deterministicHash(`AUDIO:${frequencyHz}:${sampleRate}:${durationMs}`);
    const standardInputId = `INP_AUD_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'AUDIO',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector,
      spatialDimension: raw.targetDimension || 'D5',
      structuredPayload: Object.freeze({
        frequencyHz,
        sampleRate,
        durationMs,
        channels,
        waveformType: raw.metadata?.waveformType || 'SOLFEGGIO_369',
      }),
      rawByteLength: Math.floor((sampleRate * channels * (durationMs / 1000) * 2)),
      entropy: 0.963,
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}

export class Geometry3DNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const vertices: number[][] = Array.isArray(raw.data?.vertices)
      ? raw.data.vertices
      : [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
    const faceCount = raw.data?.faces?.length || (vertices.length > 2 ? vertices.length - 2 : 1);

    // Compute bounding box and centroid
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let sumX = 0, sumY = 0, sumZ = 0;

    for (const v of vertices) {
      const x = v[0] || 0, y = v[1] || 0, z = v[2] || 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      sumX += x; sumY += y; sumZ += z;
    }

    const vLen = vertices.length || 1;
    const centroid = [
      parseFloat((sumX / vLen).toFixed(3)),
      parseFloat((sumY / vLen).toFixed(3)),
      parseFloat((sumZ / vLen).toFixed(3)),
    ];

    const normalizedText = `[3D Geometry Mesh | ${vertices.length} vertices, ${faceCount} faces | Centroid: (${centroid.join(',')})]`;
    const tensorVector = Object.freeze(centroid);

    const contentHash = deterministicHash(`GEO3D:${vertices.length}:${faceCount}:${centroid.join(',')}`);
    const standardInputId = `INP_GEO_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'GEOMETRY_3D',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector,
      spatialDimension: raw.targetDimension || 'D3',
      structuredPayload: Object.freeze({
        vertexCount: vertices.length,
        faceCount,
        boundingBox: { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
        centroid,
      }),
      rawByteLength: vertices.length * 12 + faceCount * 12,
      entropy: 0.5,
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}

export class SensorTelemetryNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const sensorId = raw.metadata?.sensorId || 'SENSOR_DEFAULT_01';
    const readingValue = typeof raw.data === 'number' ? raw.data : Number(raw.data?.value) || 0;
    const unit = raw.metadata?.unit || 'raw';
    const coordinates = raw.metadata?.coordinates || [0, 0, 0];

    const normalizedText = `[Sensor Telemetry ID: ${sensorId} | Reading: ${readingValue} ${unit} @ [${coordinates.join(',')}]]`;
    const tensorVector = Object.freeze([
      parseFloat((coordinates[0] || 0).toFixed(3)),
      parseFloat((coordinates[1] || 0).toFixed(3)),
      parseFloat((readingValue / 100).toFixed(3)),
    ]);

    const contentHash = deterministicHash(`SENSOR:${sensorId}:${readingValue}:${coordinates.join(',')}`);
    const standardInputId = `INP_SNS_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'SENSOR_TELEMETRY',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector,
      spatialDimension: raw.targetDimension || 'D3',
      structuredPayload: Object.freeze({
        sensorId,
        readingValue,
        unit,
        coordinates,
        deviceStatus: raw.metadata?.deviceStatus || 'ONLINE',
      }),
      rawByteLength: 64,
      entropy: 0.1,
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}

export class StructuredDataNormalizer {
  public static normalize(raw: RawInputEnvelope): CubiOStandardInput {
    const obj = typeof raw.data === 'object' && raw.data !== null ? raw.data : { rawData: raw.data };
    const sortedKeys = Object.keys(obj).sort();
    const sortedRecord: Record<string, any> = {};
    for (const k of sortedKeys) {
      sortedRecord[k] = obj[k];
    }

    const canonicalJson = JSON.stringify(sortedRecord);
    const rawByteLength = canonicalJson.length;
    const normalizedText = `[Structured API/DB Record | Keys: ${sortedKeys.join(', ')}]`;

    const digitalRoot = Math369.computeDigitalRoot(sortedKeys.length);
    const tensorVector = Object.freeze([
      digitalRoot,
      (digitalRoot * 3) % 9 || 9,
      (digitalRoot * 6) % 9 || 9,
    ]);

    const contentHash = deterministicHash(`STRUCT:${canonicalJson}`);
    const standardInputId = `INP_STR_${contentHash.slice(2, 14)}`;

    return Object.freeze({
      standardInputId,
      modality: 'STRUCTURED_DATA',
      sourceType: raw.sourceType,
      normalizedText,
      tensorVector,
      spatialDimension: raw.targetDimension || 'D2',
      structuredPayload: Object.freeze(sortedRecord),
      rawByteLength,
      entropy: 0.4,
      contentHash,
      sovereignCubId: raw.sovereignCubId,
      timestamp: raw.timestamp || Date.now(),
    });
  }
}
