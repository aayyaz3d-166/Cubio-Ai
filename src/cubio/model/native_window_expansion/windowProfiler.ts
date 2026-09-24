/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/windowProfiler.ts
 *
 * Empirical Benchmark & Profiling Harness for Native Context Windows:
 * Measures forward latency, heap memory footprint, and token throughput
 * across all 7 approved context window profiles (1K -> 1M).
 */

import {
  WindowExpansionProfileId,
  WindowProfileBenchmarkMetrics,
} from './types.js';
import { getWindowProfile } from './windowProfiles.js';
import { PagedWindowEngine } from './pagedWindowEngine.js';
import { ScaledTransformerCore } from '../native_transformer/scaledTransformerCore.js';
import { MultiScaleTrainer, MultiScaleProfileId } from '../native_multiscale_training/index.js';

export class WindowProfiler {
  private readonly model: ScaledTransformerCore;

  constructor(model?: ScaledTransformerCore) {
    if (model) {
      this.model = model;
    } else {
      const trainer = new MultiScaleTrainer();
      this.model = trainer.createModelForScale(MultiScaleProfileId.NATIVE_219K, 369172000);
    }
  }

  /**
   * Profiles a single window profile.
   */
  public profileProfile(
    profileId: WindowExpansionProfileId,
    testTokenCount?: number
  ): WindowProfileBenchmarkMetrics {
    const spec = getWindowProfile(profileId);
    const count = testTokenCount ?? Math.min(spec.maxWindowTokens, 16_384);

    // Generate deterministic test tokens
    const tokens = new Array(count);
    for (let i = 0; i < count; i++) {
      tokens[i] = (i * 7 + 13) % 470;
    }

    // Force GC if available or record initial heap
    const startHeap = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    // Execute window tiling and active token extraction
    const windowResult = PagedWindowEngine.executeWindow({
      tokens,
      profileId,
      pinnedTokensCount: 32,
    });

    // Execute forward inference across active window tokens
    const forwardOut = this.model.forward(windowResult.activeTokens);

    const endTime = performance.now();
    const forwardLatencyMs = Math.max(0.1, Number((endTime - startTime).toFixed(2)));

    const endHeap = process.memoryUsage().heapUsed;
    const peakHeapRamMb = Number((endHeap / (1024 * 1024)).toFixed(2));

    const throughputTokensPerSec = Math.round(
      (windowResult.activeTokenCount / (forwardLatencyMs / 1000))
    );

    const isEdgeCompliant = peakHeapRamMb <= spec.maxWorkingRamBytes / (1024 * 1024) + 60;

    return Object.freeze({
      profileId,
      maxTokens: spec.maxWindowTokens,
      inputTokensTested: count,
      activeTokensProcessed: windowResult.activeTokenCount,
      forwardLatencyMs,
      peakHeapRamMb,
      throughputTokensPerSec,
      isEdgeCompliant,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Profiles all 7 profiles sequentially.
   */
  public profileAllProfiles(): readonly WindowProfileBenchmarkMetrics[] {
    const profiles = [
      WindowExpansionProfileId.WIN_1K,
      WindowExpansionProfileId.WIN_4K,
      WindowExpansionProfileId.WIN_16K,
      WindowExpansionProfileId.WIN_32K,
      WindowExpansionProfileId.WIN_128K,
      WindowExpansionProfileId.WIN_256K,
      WindowExpansionProfileId.WIN_1M,
    ];

    // For larger profiles, test with representative token sequences
    const testCounts: Record<WindowExpansionProfileId, number> = {
      [WindowExpansionProfileId.WIN_1K]: 1_024,
      [WindowExpansionProfileId.WIN_4K]: 4_096,
      [WindowExpansionProfileId.WIN_16K]: 8_192,
      [WindowExpansionProfileId.WIN_32K]: 16_384,
      [WindowExpansionProfileId.WIN_128K]: 32_768,
      [WindowExpansionProfileId.WIN_256K]: 65_536,
      [WindowExpansionProfileId.WIN_1M]: 131_072,
    };

    return profiles.map(p => this.profileProfile(p, testCounts[p]));
  }
}
