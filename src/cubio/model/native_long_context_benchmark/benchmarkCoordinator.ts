/**
 * CUBiO AI — Task 182: Long-Context Benchmark & Stability
 * src/cubio/model/native_long_context_benchmark/benchmarkCoordinator.ts
 *
 * Master Facade for Long-Context Benchmark & Stability:
 * Coordinates the full empirical evaluation suite across:
 * - 7 context profiles (1K, 4K, 16K, 32K, 128K, 256K, 1M)
 * - Cold vs warm cache speedups
 * - End-to-end Phase 12 pipeline integration (Tasks 173–180)
 * - Adversarial stress, corruption, contradiction, tenant isolation, and exhaustion
 * - Triplicate bitwise determinism (A = B = C, Delta = 0)
 * - Permanent hardware actuation lockout
 *
 * STRICT INVARIANTS:
 * 1. Zero external ML libraries; pure native TypeScript and node:crypto.
 * 2. Primary VDB remains the sole canonical memory authority.
 * 3. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import * as crypto from 'crypto';
import {
  CompleteBenchmarkSuiteReport,
  ContextProfile,
  IS_ACTUATION_BLOCKED,
  ProfileBenchmarkResult,
} from './types.js';
import { ProfileBenchmarkRunner } from './profileBenchmarkRunner.js';
import { IntegratedPipelineEvaluator } from './integratedPipelineEvaluator.js';
import { AdversarialStressRunner } from './adversarialStressRunner.js';

export class BenchmarkCoordinator {
  private readonly profileRunner: ProfileBenchmarkRunner;
  private readonly integratedEvaluator: IntegratedPipelineEvaluator;
  private readonly adversarialRunner: AdversarialStressRunner;

  constructor(
    profileRunner?: ProfileBenchmarkRunner,
    integratedEvaluator?: IntegratedPipelineEvaluator,
    adversarialRunner?: AdversarialStressRunner
  ) {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Hardware Actuation Lockout Violation: BenchmarkCoordinator requires actuation lockout.');
    }
    this.profileRunner = profileRunner ?? new ProfileBenchmarkRunner();
    this.integratedEvaluator = integratedEvaluator ?? new IntegratedPipelineEvaluator();
    this.adversarialRunner = adversarialRunner ?? new AdversarialStressRunner();
  }

  public getProfileRunner(): ProfileBenchmarkRunner {
    return this.profileRunner;
  }

  public getIntegratedEvaluator(): IntegratedPipelineEvaluator {
    return this.integratedEvaluator;
  }

  public getAdversarialRunner(): AdversarialStressRunner {
    return this.adversarialRunner;
  }

  /**
   * Run the complete benchmark and stability suite.
   */
  public runCompleteBenchmark(tenantId: string = 'tenant_benchmark_alpha'): CompleteBenchmarkSuiteReport {
    // 1. Evaluate all 7 profiles
    const profileResults = this.profileRunner.evaluateAllProfiles(tenantId);

    // 2. Evaluate cold vs warm performance
    const coldWarmComparison = this.profileRunner.evaluateColdVsWarm('32K', tenantId);

    // 3. Evaluate integrated E2E Phase 12 pipeline
    const integratedE2EResult = this.integratedEvaluator.evaluate(tenantId);

    // 4. Run adversarial stress probes
    const adversarialReport = this.adversarialRunner.runAllProbes();

    // 5. Verify triplicate bitwise determinism (A = B = C)
    const runA = new IntegratedPipelineEvaluator().evaluate(tenantId);
    const runB = new IntegratedPipelineEvaluator().evaluate(tenantId);
    const runC = new IntegratedPipelineEvaluator().evaluate(tenantId);

    const triplicateDeterminismVerified =
      runA.e2eDigest === runB.e2eDigest &&
      runB.e2eDigest === runC.e2eDigest &&
      runA.chunksGenerated === runB.chunksGenerated &&
      runB.chunksGenerated === runC.chunksGenerated;

    // 6. Compute composite SHA-256 benchmark digest
    const benchmarkPayload = JSON.stringify({
      profileDigests: profileResults.map((p) => `${p.profile}:${p.passed}:${p.latencyMs}`),
      coldWarmSpeedup: coldWarmComparison.speedupMultiplier,
      e2eDigest: integratedE2EResult.e2eDigest,
      adversarialPassed: adversarialReport.allPassed,
      triplicateDeterminismVerified,
    });

    const benchmarkDigest = crypto.createHash('sha256').update(benchmarkPayload).digest('hex');
    const timestamp = new Date().toISOString();

    return Object.freeze({
      profileResults,
      coldWarmComparison,
      integratedE2EResult,
      adversarialReport,
      triplicateDeterminismVerified,
      benchmarkDigest,
      timestamp,
    });
  }

  /**
   * Evaluate a single profile on demand.
   */
  public evaluateSingleProfile(profile: ContextProfile, tenantId?: string): ProfileBenchmarkResult {
    return this.profileRunner.evaluateProfile(profile, tenantId);
  }
}
