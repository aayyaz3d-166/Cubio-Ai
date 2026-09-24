/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Hermetic Mock Image Generation Provider
 */

import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import {
  IImageGenerationProvider,
  ImageSpecification,
  UniversalImageArtifact,
} from '../types';

export class MockImageProvider implements IImageGenerationProvider {
  public readonly providerId = 'cubio-mock-image-gen';
  public readonly providerName = 'Hermetic Mock Image Generation Provider';

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'IMAGE',
      name: this.providerName,
      version: '1.0.0-mock',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'IMAGE_GENERATION',
        'SPATIAL_REASONING',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  public async generateFromSpec(
    spec: ImageSpecification
  ): Promise<Readonly<UniversalImageArtifact>> {
    return Object.freeze({
      artifactId: 'ART_MOCK_IMG_001',
      prompt: spec.prompt,
      enhancedPrompt: `[Mock Prompt]: ${spec.prompt}`,
      stylePreset: spec.stylePreset,
      width: spec.dimensions.width,
      height: spec.dimensions.height,
      format: 'png',
      imageUrl: 'https://mock.cubio.local/mock-image.png',
      isSovereignProcedural: false,
      providerId: this.providerId,
      confidence: 1.0,
      artifactChecksum: 'MOCK_IMG_CHECKSUM',
      timestamp: Date.now(),
    });
  }
}
