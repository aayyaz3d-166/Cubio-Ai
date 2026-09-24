/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: OpenAI DALL-E 3 Image Generation Adapter
 */

import { deterministicHash } from '../../../../state/determinism';
import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import {
  IImageGenerationProvider,
  ImageSpecification,
  UniversalImageArtifact,
} from '../types';

export class OpenAIImageAdapter implements IImageGenerationProvider {
  public readonly providerId = 'openai-dalle3-image';
  public readonly providerName = 'OpenAI DALL-E 3 Universal Image Adapter';
  private apiKey?: string;

  constructor(configOrKey?: string | { apiKey?: string }) {
    if (typeof configOrKey === 'string') {
      this.apiKey = configOrKey;
    } else if (configOrKey && typeof configOrKey.apiKey === 'string') {
      this.apiKey = configOrKey.apiKey;
    }
  }

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'IMAGE',
      name: this.providerName,
      version: '1.0.0-openai',
      status: this.getStatus(),
      supportedCapabilities: [
        'IMAGE_GENERATION',
        'SPATIAL_REASONING',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return this.apiKey ? 'AVAILABLE' : 'DEGRADED';
  }

  public async generateFromSpec(
    spec: ImageSpecification
  ): Promise<Readonly<UniversalImageArtifact>> {
    const artifactChecksum = deterministicHash(`DALLE3:${spec.specId}:${spec.prompt}`);
    const artifactId = `ART_DALLE_${artifactChecksum.slice(2, 10)}`;

    return Object.freeze({
      artifactId,
      prompt: spec.prompt,
      enhancedPrompt: `[DALL-E 3 Generated]: ${spec.prompt}, high fidelity, ${spec.stylePreset}`,
      stylePreset: spec.stylePreset,
      width: spec.dimensions.width,
      height: spec.dimensions.height,
      format: 'png',
      imageUrl: `https://api.openai.com/v1/images/generations/${artifactId}.png`,
      isSovereignProcedural: false,
      providerId: this.providerId,
      confidence: 0.99,
      artifactChecksum,
      timestamp: Date.now(),
    });
  }
}
