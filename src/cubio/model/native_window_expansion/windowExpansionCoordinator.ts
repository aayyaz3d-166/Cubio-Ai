/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/windowExpansionCoordinator.ts
 *
 * Master Coordinator for Progressive Native Context Window Expansion:
 * - Coordinates Paged Window Tiling, Deterministic Truncation, and Active Extraction.
 * - Integrates Phase 11 Native Model (`ScaledTransformerCore`) and Phase 10 Reasoning.
 * - Enforces OutputGuard safety boundaries and permanent actuation lockouts.
 * - Exports streaming .3dmemory snapshots and runs multi-profile latency profiling.
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  WindowExpansionProfileId,
  WindowExecutionResult,
  WindowProfileBenchmarkMetrics,
} from './types.js';
import { getWindowProfile } from './windowProfiles.js';
import { PagedWindowEngine } from './pagedWindowEngine.js';
import { DeterministicTruncator } from './deterministicTruncator.js';
import { ModelReasoningBridge, WindowModelReasoningOutput } from './modelReasoningBridge.js';
import { WindowProfiler } from './windowProfiler.js';
import { WindowExpansionGovernor } from './windowExpansionGovernor.js';
import { ScaledTransformerCore } from '../native_transformer/scaledTransformerCore.js';
import { MultiScaleTrainer, MultiScaleProfileId } from '../native_multiscale_training/index.js';

export class WindowExpansionCoordinator {
  private readonly model: ScaledTransformerCore;
  private readonly profiler: WindowProfiler;
  private activeProfile: WindowExpansionProfileId;

  constructor(options?: {
    model?: ScaledTransformerCore;
    initialProfile?: WindowExpansionProfileId;
  }) {
    WindowExpansionGovernor.assertActuationLockout();

    this.activeProfile = options?.initialProfile ?? WindowExpansionProfileId.WIN_1K;

    if (options?.model) {
      this.model = options.model;
    } else {
      const trainer = new MultiScaleTrainer();
      this.model = trainer.createModelForScale(MultiScaleProfileId.NATIVE_219K, 369172001);
    }

    this.profiler = new WindowProfiler(this.model);
  }

  public getModel(): ScaledTransformerCore {
    return this.model;
  }

  public getActiveProfile(): WindowExpansionProfileId {
    return this.activeProfile;
  }

  public setActiveProfile(profileId: WindowExpansionProfileId): void {
    this.activeProfile = profileId;
  }

  /**
   * Processes an arbitrary sequence of tokens through the paged window engine.
   */
  public processWindow(params: {
    tokens: readonly number[];
    profileId?: WindowExpansionProfileId;
    pinnedTokensCount?: number;
  }): WindowExecutionResult {
    const profileId = params.profileId ?? this.activeProfile;
    WindowExpansionGovernor.assertActuationLockout();

    return PagedWindowEngine.executeWindow({
      tokens: params.tokens,
      profileId,
      pinnedTokensCount: params.pinnedTokensCount,
    });
  }

  /**
   * End-to-end cognitive loop: Context Window -> Transformer Forward -> Multi-Step Reasoning -> OutputGuard.
   */
  public processAndReason(params: {
    tokens: readonly number[];
    profileId?: WindowExpansionProfileId;
    tenantId: string;
    reasoningGoal: string;
    spatialCellId?: number;
    pinnedTokensCount?: number;
  }): {
    windowResult: WindowExecutionResult;
    reasoningOutput: WindowModelReasoningOutput;
  } {
    WindowExpansionGovernor.assertActuationLockout(params.reasoningGoal);

    const profileId = params.profileId ?? this.activeProfile;

    // 1. Paged Window Execution
    const windowResult = this.processWindow({
      tokens: params.tokens,
      profileId,
      pinnedTokensCount: params.pinnedTokensCount,
    });

    // 2. Model Forward + Reasoning Bridge
    const reasoningOutput = ModelReasoningBridge.executeIntegratedReasoning({
      model: this.model,
      windowResult,
      tenantId: params.tenantId,
      goalDescription: params.reasoningGoal,
      spatialCellId: params.spatialCellId,
    });

    return {
      windowResult,
      reasoningOutput,
    };
  }

  /**
   * Profiles performance across all 7 profiles.
   */
  public runFullProfileSuite(): readonly WindowProfileBenchmarkMetrics[] {
    return this.profiler.profileAllProfiles();
  }

  /**
   * Exports window snapshot in streaming .3dmemory format.
   */
  public exportSnapshot(tenantId: string, windowResult: WindowExecutionResult): {
    format: '.3dmemory';
    snapshotId: string;
    tenantId: string;
    profileId: WindowExpansionProfileId;
    windowHash: string;
    activeTokenCount: number;
    isActuationBlocked: boolean;
    checksum: string;
  } {
    const hasher = crypto.createHash('sha256');
    hasher.update(`3DMEM_WIN:${tenantId}:${windowResult.profileId}:${windowResult.windowHash}:${windowResult.activeTokenCount}`);
    const checksum = hasher.digest('hex');

    return Object.freeze({
      format: '.3dmemory',
      snapshotId: `snap_win_${Date.now()}`,
      tenantId,
      profileId: windowResult.profileId,
      windowHash: windowResult.windowHash,
      activeTokenCount: windowResult.activeTokenCount,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      checksum,
    });
  }
}
