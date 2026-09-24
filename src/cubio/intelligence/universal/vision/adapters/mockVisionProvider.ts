/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3 (F49): Hermetic Mock Vision Provider
 */

import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import {
  IVisionIntelligenceProvider,
  VisionAnalysisOptions,
  VisualUnderstandingReport,
  VisionInputType,
} from '../types';

export class MockVisionProvider implements IVisionIntelligenceProvider {
  public readonly providerId = 'cubio-mock-vision';
  public readonly providerName = 'Hermetic Mock Vision Testing Provider';

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'VISION',
      name: this.providerName,
      version: '1.0.0-mock',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'VISION',
        'SPATIAL_REASONING',
        'FILE_ANALYSIS',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  public async analyzeVisual(
    imageData: Uint8Array,
    options?: VisionAnalysisOptions
  ): Promise<Readonly<VisualUnderstandingReport>> {
    const inputType: VisionInputType = options?.inputTypeHint || 'GENERAL_IMAGE';

    return Object.freeze({
      analysisId: 'VIS_MOCK_001',
      inputType,
      naturalDescription: `Mock visual understanding for ${inputType}`,
      detectedEntities: Object.freeze([
        {
          entityId: 'MOCK_ENT_01',
          name: 'MockEntity',
          category: 'MOCK_CATEGORY',
          attributes: { mock: true },
          confidence: 1.0,
        },
      ]),
      dominantColors: Object.freeze(['#000000']),
      resolution: { width: 100, height: 100 },
      overallConfidence: 1.0,
      providerId: this.providerId,
      latencyMs: 1,
      imageChecksum: 'MOCK_CHECKSUM',
    });
  }
}
