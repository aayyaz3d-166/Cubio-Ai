/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F2: Master CubiO Input Engine
 *
 * Master multi-modal ingestion gateway converting raw Text, Numeric, Image,
 * Audio, 3D Geometry, Sensor Telemetry, and Structured API/DB records into
 * standard CubiOStandardInput representations.
 *
 * Plugs directly into F1 Core Foundation as an IIntelligenceEngine.
 */

import { deterministicHash } from '../../state/determinism';
import {
  IIntelligenceEngine,
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineHealthReport,
} from '../core/types';
import {
  RawInputEnvelope,
  CubiOStandardInput,
  InputNormalizationResult,
  InputModality,
  InputStreamBufferStatus,
} from './types';
import {
  TextNormalizer,
  NumericNormalizer,
  ImageNormalizer,
  AudioNormalizer,
  Geometry3DNormalizer,
  SensorTelemetryNormalizer,
  StructuredDataNormalizer,
} from './normalizers';

export class CubiOInputEngine implements IIntelligenceEngine {
  public readonly engineId = 'ENGINE_INPUT_NORMALIZER';
  public readonly version = '1.0.0';
  public readonly priority = 'PRIMARY' as const;
  public readonly capabilities = ['PERCEPTION'] as const;
  public readonly metadata = Object.freeze({
    name: 'CubiO Multi-Modal Input Normalization Engine',
    description: 'Ingests, decodes, and standardizes multi-modal inputs for 369 and spatial processing.',
  });

  private totalExecutions = 0;
  private failedExecutions = 0;
  private startTime = Date.now();
  private streamBuffers: Map<string, InputStreamBufferStatus> = new Map();

  public async initialize(_core: any): Promise<void> {}

  /**
   * Normalizes a raw multi-modal input into a canonical CubiOStandardInput.
   */
  public normalize(rawInput: RawInputEnvelope): InputNormalizationResult {
    const startTime = Date.now();
    const errors: string[] = [];

    let standardInput: CubiOStandardInput;

    try {
      switch (rawInput.modality) {
        case 'TEXT':
          standardInput = TextNormalizer.normalize(rawInput);
          break;
        case 'NUMERIC':
          standardInput = NumericNormalizer.normalize(rawInput);
          break;
        case 'IMAGE':
          standardInput = ImageNormalizer.normalize(rawInput);
          break;
        case 'AUDIO':
          standardInput = AudioNormalizer.normalize(rawInput);
          break;
        case 'GEOMETRY_3D':
          standardInput = Geometry3DNormalizer.normalize(rawInput);
          break;
        case 'SENSOR_TELEMETRY':
          standardInput = SensorTelemetryNormalizer.normalize(rawInput);
          break;
        case 'STRUCTURED_DATA':
          standardInput = StructuredDataNormalizer.normalize(rawInput);
          break;
        default:
          throw new Error(`Unsupported input modality: ${rawInput.modality}`);
      }

      this.totalExecutions++;
    } catch (err: any) {
      this.failedExecutions++;
      errors.push(err?.message || 'Normalization failed.');
      // Create fallback safe text representation
      standardInput = TextNormalizer.normalize({
        ...rawInput,
        modality: 'TEXT',
        data: String(rawInput.data || ''),
      });
    }

    const duration = Math.max(1, Date.now() - startTime);

    return Object.freeze({
      isSuccess: errors.length === 0,
      standardInput,
      validationErrors: Object.freeze(errors),
      processingTimeMs: duration,
    });
  }

  /**
   * Ingests a streaming chunk and updates the active stream buffer status.
   */
  public ingestStream(
    streamId: string,
    chunk: any,
    modality: InputModality = 'TEXT'
  ): CubiOStandardInput {
    const rawEnvelope: RawInputEnvelope = {
      inputId: `STRM_INP_${Date.now()}`,
      modality,
      sourceType: 'STREAM',
      data: chunk,
      metadata: { streamId },
    };

    const normResult = this.normalize(rawEnvelope);
    const standardInput = normResult.standardInput;

    const prevBuffer = this.streamBuffers.get(streamId);
    const updatedStatus: InputStreamBufferStatus = Object.freeze({
      streamId,
      modality,
      totalIngestedChunks: (prevBuffer?.totalIngestedChunks || 0) + 1,
      totalBytes: (prevBuffer?.totalBytes || 0) + standardInput.rawByteLength,
      lastChunkTimestamp: Date.now(),
      isActive: true,
    });

    this.streamBuffers.set(streamId, updatedStatus);
    return standardInput;
  }

  /**
   * Returns active stream buffer states.
   */
  public getStreamBuffers(): readonly InputStreamBufferStatus[] {
    return Object.freeze([...this.streamBuffers.values()]);
  }

  /**
   * F1 Core Foundation pluggable IIntelligenceEngine execution method.
   */
  public async execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult> {
    const startTime = Date.now();
    this.totalExecutions++;

    // Ingest prompt through normalizer
    const rawInput: RawInputEnvelope = {
      modality: (envelope.options?.inputModality as InputModality) || 'TEXT',
      sourceType: 'DIRECT_USER',
      data: envelope.prompt,
      targetDimension: envelope.activeDimension,
      sovereignCubId: envelope.sovereignCubId,
      timestamp: envelope.timestamp,
    };

    const normResult = this.normalize(rawInput);
    const duration = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `${normResult.standardInput.contentHash}:${normResult.standardInput.modality}:${duration}`
    );

    return Object.freeze({
      resultId: `RES_${checksum.slice(2, 14)}`,
      engineId: this.engineId,
      textOutput: `[Input Normalizer @ ${normResult.standardInput.spatialDimension}]: Ingested ${normResult.standardInput.modality} input (${normResult.standardInput.rawByteLength} bytes, CID: ${normResult.standardInput.standardInputId}).`,
      reasoningSteps: Object.freeze([
        {
          stepIndex: 1,
          claim: 'Input Modality Ingestion',
          evidence: `Received ${normResult.standardInput.modality} payload from ${normResult.standardInput.sourceType}.`,
          dimension: normResult.standardInput.spatialDimension,
          confidence: 0.999,
          resonanceScore: 100,
        },
        {
          stepIndex: 2,
          claim: 'Standardized Tensor Normalization',
          evidence: `Derived tensor vector [${normResult.standardInput.tensorVector.join(', ')}].`,
          dimension: normResult.standardInput.spatialDimension,
          confidence: 0.995,
          resonanceScore: 99.5,
        },
      ]),
      artifacts: Object.freeze([normResult.standardInput]),
      confidence: normResult.isSuccess ? 0.999 : 0.85,
      resonanceScore: envelope.harmonic?.resonanceScore || 99.8,
      executionTimeMs: duration,
      checksum,
      timestamp: Date.now(),
    });
  }

  public async getHealth(): Promise<EngineHealthReport> {
    return Object.freeze({
      status: 'READY',
      uptimeMs: Date.now() - this.startTime,
      totalExecutions: this.totalExecutions,
      failedExecutions: this.failedExecutions,
      avgLatencyMs: 1,
    });
  }

  public async dispose(): Promise<void> {
    this.streamBuffers.clear();
  }
}
