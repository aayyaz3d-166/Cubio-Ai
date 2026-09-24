/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3 (F49): Master Vision Intelligence Engine
 *
 * Coordinates the full 5-stage vision processing lifecycle:
 * Image -> Vision Provider -> Visual Understanding -> CubiO State -> Reasoning
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiODimension } from '../../../types';
import {
  IVisionIntelligenceProvider,
  VisionAnalysisOptions,
  VisionPipelineResult,
} from './types';
import { SovereignVisionProvider } from './adapters/sovereignVisionProvider';
import { VisionStateBridge } from './stateBridge/visionStateBridge';
import { CubiOAdvancedReasoningEngine } from '../reasoning/advancedReasoningEngine';
import { CubiOProviderRegistry } from '../providerRegistry';

export interface VisionPipelineOptions extends VisionAnalysisOptions {
  readonly executeReasoning?: boolean;
  readonly reasoningQuestion?: string;
  readonly targetDimension?: CubiODimension;
}

export class CubiOVisionIntelligenceEngine {
  private providers: Map<string, IVisionIntelligenceProvider> = new Map();
  private activeProviderId: string;
  private sovereignFallback: SovereignVisionProvider;
  private stateBridge = new VisionStateBridge();
  private reasoningEngine = new CubiOAdvancedReasoningEngine();

  constructor(providerRegistry?: CubiOProviderRegistry) {
    this.sovereignFallback = new SovereignVisionProvider();
    this.registerProvider(this.sovereignFallback);
    this.activeProviderId = this.sovereignFallback.providerId;

    if (providerRegistry) {
      providerRegistry.registerProvider(this.sovereignFallback as any);
    }
  }

  public registerProvider(provider: IVisionIntelligenceProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  public getActiveProvider(): IVisionIntelligenceProvider {
    return this.providers.get(this.activeProviderId) || this.sovereignFallback;
  }

  public listProviders(): readonly IVisionIntelligenceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Executes the full 5-stage Vision Pipeline:
   * Image -> Vision Provider -> Visual Understanding -> CubiO State -> Reasoning
   */
  public async processImagePipeline(
    imageData: Uint8Array,
    options: VisionPipelineOptions = {}
  ): Promise<Readonly<VisionPipelineResult>> {
    const startTime = Date.now();
    const provider = this.getActiveProvider().getStatus() === 'AVAILABLE' ? this.getActiveProvider() : this.sovereignFallback;

    // 1 & 2: Provider Execution & Visual Understanding
    const visualUnderstanding = await provider.analyzeVisual(imageData, options);

    // 3: Transform to authoritative CubiOState
    const targetDimension = options.targetDimension || 'D3';
    const cubioState = this.stateBridge.transformToCubiOState(visualUnderstanding, targetDimension);

    // 4: Downstream Advanced Reasoning (if requested or for CAD / diagram analysis)
    let reasoningReport;
    if (options.executeReasoning !== false) {
      const question =
        options.reasoningQuestion ||
        `Analyze spatial invariants, geometry, and architecture for visual input "${visualUnderstanding.naturalDescription}" in dimension ${targetDimension}`;

      reasoningReport = await this.reasoningEngine.reasonQuestion({
        question,
        domainHint: visualUnderstanding.inputType === 'CAD_3D_SCREENSHOT' ? 'MATHEMATICAL' : 'TECHNICAL',
        targetDimension,
      });
    }

    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const pipelineChecksum = deterministicHash(
      `VIS_PIPE:${visualUnderstanding.analysisId}:${cubioState.id}:${executionTimeMs}`
    );
    const pipelineId = `PIPE_VIS_${pipelineChecksum.slice(2, 12)}`;

    return Object.freeze({
      pipelineId,
      inputType: visualUnderstanding.inputType,
      visualUnderstanding,
      cubioState,
      reasoningReport,
      executionTimeMs,
      success: true,
      pipelineChecksum,
      timestamp: Date.now(),
    });
  }
}
