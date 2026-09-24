/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Master Image Generation Engine
 *
 * Coordinates the full 6-stage image generation architecture:
 * Prompt -> LLM Planning -> Image Specification -> Image Provider -> Generated Asset -> Project Intelligence
 */

import { deterministicHash } from '../../../state/determinism';
import {
  IImageGenerationProvider,
  ImageGenerationOptions,
  ImagePipelineResult,
} from './types';
import { SovereignImageProvider } from './adapters/sovereignImageProvider';
import { ImageGenerationPlanner } from './pipeline/imagePlanner';
import { ProjectAssetBridge } from './pipeline/projectAssetBridge';
import { CubiOProviderRegistry } from '../providerRegistry';

export class CubiOImageGenerationEngine {
  private providers: Map<string, IImageGenerationProvider> = new Map();
  private activeProviderId: string;
  private sovereignFallback: SovereignImageProvider;
  private planner = new ImageGenerationPlanner();
  private projectBridge = new ProjectAssetBridge();

  constructor(providerRegistry?: CubiOProviderRegistry) {
    this.sovereignFallback = new SovereignImageProvider();
    this.registerProvider(this.sovereignFallback);
    this.activeProviderId = this.sovereignFallback.providerId;

    if (providerRegistry) {
      providerRegistry.registerProvider(this.sovereignFallback as any);
    }
  }

  public registerProvider(provider: IImageGenerationProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  public getActiveProvider(): IImageGenerationProvider {
    return this.providers.get(this.activeProviderId) || this.sovereignFallback;
  }

  public listProviders(): readonly IImageGenerationProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Executes the full 6-stage Image Generation Architecture:
   * Prompt -> LLM Planning -> Image Specification -> Image Provider -> Generated Asset -> Project Intelligence
   */
  public async generateImagePipeline(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<Readonly<ImagePipelineResult>> {
    const startTime = Date.now();

    // 1 & 2 & 3: Prompt Ingestion & LLM Planning -> Image Specification
    const specification = this.planner.planImageSpecification(prompt, options);

    // 4: Provider Selection & Asset Generation
    const provider =
      options.preferredProviderId && this.providers.has(options.preferredProviderId)
        ? this.providers.get(options.preferredProviderId)!
        : this.getActiveProvider().getStatus() === 'AVAILABLE'
        ? this.getActiveProvider()
        : this.sovereignFallback;

    const generatedAsset = await provider.generateFromSpec(specification);

    // 5 & 6: Generated Asset -> Project Intelligence Registration
    const projectAssetRecord = this.projectBridge.registerAssetInProject(
      generatedAsset,
      options.projectId || 'DEFAULT_CUBIO_PROJECT'
    );

    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const pipelineChecksum = deterministicHash(
      `IMG_PIPE:${specification.specId}:${generatedAsset.artifactId}:${executionTimeMs}`
    );
    const pipelineId = `PIPE_IMG_${pipelineChecksum.slice(2, 12)}`;

    return Object.freeze({
      pipelineId,
      specification,
      generatedAsset,
      projectAssetRecord,
      executionTimeMs,
      success: true,
      pipelineChecksum,
      timestamp: Date.now(),
    });
  }
}
