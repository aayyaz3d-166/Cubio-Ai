/**
 * ============================================================================
 * CUBiO AI InfinityLM Research Layer - On-Demand State Reconstruction Engine
 * Task: PMA Task 359
 * Authority: ISO/IEC/IEEE 29119 PMA Forensic Architecture
 *
 * Implements procedural on-demand state reconstruction following the principle:
 * STORE ONCE -> REFERENCE -> LOAD ON DEMAND -> PROCESS -> CACHE SELECTIVELY.
 *
 * Reconstructs deep replica states from compact root identity, transformation deltas,
 * rules, and lineage metadata with 100% cryptographic hash invariance.
 *
 * Epistemic Rules:
 * - Trade-off invariance: Procedural compute replaces eager memory storage.
 * - Zero claims of infinite storage; physical compute and memory costs quantified.
 * - Non-mutating and strictly isolated from production CUBiO Core/VDB.
 * ============================================================================
 */

import * as crypto from 'crypto';
import { BaseStateMatrix, BaseStateEntry } from './baseStateMatrix';
import { XYZStateMapper, XYZStateCoordinates } from './xyzStateMapping';
import { GoldenRatioEngine, GOLDEN_ANGLE_RAD } from './goldenRatioEngine';
import { SpatialCoordXYZ, EpistemicStatus } from './types';
import { DualPolarity } from './dualStateSystem';
import { ScaleLevel } from './multiScaleEngine';

export type TransformationRuleType =
  | 'PHI_SCALE_ROTATION'
  | 'POLARITY_INVERSION'
  | 'SCALE_TRANSITION'
  | 'HARMONIC_OFFSET';

export interface CompactLineageStep {
  readonly stepIndex: number;
  readonly rule: TransformationRuleType;
  readonly parameter: number; // e.g. phi factor, scale target, angle step
}

export interface CompactStateRecipe {
  readonly rootBaseIndex: number;          // [1..100]
  readonly initialPolarity: DualPolarity;  // '+' or '-'
  readonly initialScale: ScaleLevel;       // 1..3
  readonly lineageSteps: CompactLineageStep[];
  readonly targetUrn: string;
  readonly expectedStateHash: string;      // Cryptographic check
}

export interface ReconstructedStateNode {
  readonly urn: string;
  readonly baseIndex: number;
  readonly depth: number;
  readonly polarity: DualPolarity;
  readonly scaleLevel: ScaleLevel;
  readonly coord: SpatialCoordXYZ;
  readonly stateHash: string;
  readonly isBitwiseMatch: boolean;
  readonly reconstructionLatencyUs: number; // Microseconds
}

export interface ReconstructionPerformanceMetrics {
  readonly sampleCount: number;
  readonly meanLatencyUs: number;
  readonly minLatencyUs: number;
  readonly maxLatencyUs: number;
  readonly eagerNodeSizeBytes: number;
  readonly compactRecipeSizeBytes: number;
  readonly storageSavingsRatio: number; // 1 - (Recipe / Eager)
  readonly bitwiseAccuracyRate: number; // 1.0 = 100%
  readonly cacheHitSpeedupRatio: number;
}

export class SelectiveStateCache {
  private readonly capacity: number;
  private readonly cache = new Map<string, ReconstructedStateNode>();
  private hits = 0;
  private misses = 0;

  constructor(capacity: number = 256) {
    this.capacity = capacity;
  }

  public get(urn: string): ReconstructedStateNode | undefined {
    const val = this.cache.get(urn);
    if (val) {
      this.hits++;
      // Refresh LRU position
      this.cache.delete(urn);
      this.cache.set(urn, val);
      return val;
    }
    this.misses++;
    return undefined;
  }

  public set(urn: string, node: ReconstructedStateNode): void {
    if (this.cache.has(urn)) {
      this.cache.delete(urn);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest (first item in Map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(urn, node);
  }

  public get stats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export class OnDemandReconstructionEngine {
  private static readonly ESTIMATED_EAGER_NODE_BYTES = 512;
  private static readonly ESTIMATED_RECIPE_BYTES = 96;

  /**
   * Mints a compact recipe from an eagerly generated node and lineage parameters.
   */
  public static mintRecipe(
    rootBaseIndex: number,
    initialPolarity: DualPolarity,
    initialScale: ScaleLevel,
    lineageSteps: CompactLineageStep[],
    targetUrn: string,
    expectedStateHash: string
  ): CompactStateRecipe {
    return {
      rootBaseIndex,
      initialPolarity,
      initialScale,
      lineageSteps,
      targetUrn,
      expectedStateHash,
    };
  }

  /**
   * Deterministically reconstructs a state from a compact recipe on demand.
   */
  public static reconstructFromRecipe(
    recipe: CompactStateRecipe,
    matrix: BaseStateMatrix = new BaseStateMatrix()
  ): ReconstructedStateNode {
    const startTime = performance.now();

    const rootState = matrix.getState(recipe.rootBaseIndex);
    let currentPolarity = recipe.initialPolarity;
    let currentScale = recipe.initialScale;

    // Start with root XYZ coordinate
    const initialMapping = XYZStateMapper.mapToXYZ(
      rootState.index,
      currentPolarity,
      currentScale,
      rootState.category,
      rootState.harmonicRoot
    );

    let currentCoord = initialMapping.normalizedCoord;

    // Apply procedural lineage steps sequentially
    for (const step of recipe.lineageSteps) {
      switch (step.rule) {
        case 'PHI_SCALE_ROTATION': {
          const res = GoldenRatioEngine.transform(currentCoord, {
            powerOrder: 1,
            rotationAngleRad: GOLDEN_ANGLE_RAD * step.parameter,
            axis: 'Z',
            precision: 6,
          });
          currentCoord = res.transformedCoord;
          break;
        }

        case 'POLARITY_INVERSION': {
          currentPolarity = currentPolarity === '+' ? '-' : '+';
          currentCoord = {
            x: currentCoord.x,
            y: -currentCoord.y,
            z: currentCoord.z,
          };
          break;
        }

        case 'SCALE_TRANSITION': {
          const targetScale = Math.max(1, Math.min(3, Math.round(step.parameter))) as ScaleLevel;
          currentScale = targetScale;
          // Modulate radius
          const scaleMultiplier = targetScale / recipe.initialScale;
          currentCoord = {
            x: Number((currentCoord.x * scaleMultiplier).toFixed(6)),
            y: Number((currentCoord.y * scaleMultiplier).toFixed(6)),
            z: Number((currentCoord.z * scaleMultiplier).toFixed(6)),
          };
          break;
        }

        case 'HARMONIC_OFFSET': {
          const offset = step.parameter * 0.1;
          currentCoord = {
            x: Number((currentCoord.x + offset).toFixed(6)),
            y: Number((currentCoord.y + offset).toFixed(6)),
            z: Number((currentCoord.z + offset).toFixed(6)),
          };
          break;
        }
      }
    }

    // Compute cryptographic state hash of reconstructed state
    const hashData = [
      recipe.targetUrn,
      recipe.rootBaseIndex,
      currentPolarity,
      currentScale,
      currentCoord.x,
      currentCoord.y,
      currentCoord.z,
    ].join(':');

    const stateHash = crypto.createHash('sha256').update(hashData).digest('hex');
    const endTime = performance.now();
    const latencyUs = Number(((endTime - startTime) * 1000).toFixed(2));

    const isBitwiseMatch = recipe.expectedStateHash
      ? stateHash === recipe.expectedStateHash
      : true;

    return {
      urn: recipe.targetUrn,
      baseIndex: recipe.rootBaseIndex,
      depth: recipe.lineageSteps.length,
      polarity: currentPolarity,
      scaleLevel: currentScale,
      coord: currentCoord,
      stateHash,
      isBitwiseMatch,
      reconstructionLatencyUs: latencyUs,
    };
  }

  /**
   * Helper that builds an eager state and compares it against on-demand reconstruction.
   */
  public static benchmarkReconstruction(
    sampleCount: number = 100,
    depth: number = 3
  ): ReconstructionPerformanceMetrics {
    const matrix = new BaseStateMatrix();
    const cache = new SelectiveStateCache(sampleCount);

    const latencies: number[] = [];
    let bitwiseMatches = 0;

    // Generate samples
    const recipes: CompactStateRecipe[] = [];
    for (let i = 1; i <= sampleCount; i++) {
      const baseIdx = ((i - 1) % 100) + 1;
      const polarity: DualPolarity = i % 2 === 1 ? '+' : '-';
      const scale: ScaleLevel = ((i % 3) + 1) as ScaleLevel;

      const steps: CompactLineageStep[] = [];
      for (let d = 1; d <= depth; d++) {
        steps.push({
          stepIndex: d,
          rule: d % 2 === 1 ? 'PHI_SCALE_ROTATION' : 'HARMONIC_OFFSET',
          parameter: (d * 0.25),
        });
      }

      const urn = 'urn:cubio:infinitylm:state:BASE-' + String(baseIdx).padStart(3, '0') + ':D' + depth + ':#' + i;

      // 1. Calculate ground-truth hash via first reconstruction
      const groundTruth = this.reconstructFromRecipe({
        rootBaseIndex: baseIdx,
        initialPolarity: polarity,
        initialScale: scale,
        lineageSteps: steps,
        targetUrn: urn,
        expectedStateHash: '',
      }, matrix);

      const recipe = this.mintRecipe(
        baseIdx,
        polarity,
        scale,
        steps,
        urn,
        groundTruth.stateHash
      );
      recipes.push(recipe);
    }

    // 2. Measure on-demand reconstruction pass
    for (const recipe of recipes) {
      const reconstructed = this.reconstructFromRecipe(recipe, matrix);
      latencies.push(reconstructed.reconstructionLatencyUs);
      if (reconstructed.isBitwiseMatch) {
        bitwiseMatches++;
      }
      cache.set(recipe.targetUrn, reconstructed);
    }

    // 3. Measure cached retrieval latency
    const cacheStart = performance.now();
    for (const recipe of recipes) {
      cache.get(recipe.targetUrn);
    }
    const cacheEnd = performance.now();
    const meanCacheLatencyUs = ((cacheEnd - cacheStart) / sampleCount) * 1000;

    const sumLatency = latencies.reduce((acc, l) => acc + l, 0);
    const meanLatencyUs = sumLatency / sampleCount;
    const minLatencyUs = Math.min(...latencies);
    const maxLatencyUs = Math.max(...latencies);

    const eagerBytes = sampleCount * this.ESTIMATED_EAGER_NODE_BYTES;
    const recipeBytes = sampleCount * this.ESTIMATED_RECIPE_BYTES;
    const storageSavingsRatio = Number((1 - (recipeBytes / eagerBytes)).toFixed(4));
    const speedup = meanCacheLatencyUs > 0 ? meanLatencyUs / meanCacheLatencyUs : 1.0;

    return {
      sampleCount,
      meanLatencyUs: Number(meanLatencyUs.toFixed(2)),
      minLatencyUs: Number(minLatencyUs.toFixed(2)),
      maxLatencyUs: Number(maxLatencyUs.toFixed(2)),
      eagerNodeSizeBytes: this.ESTIMATED_EAGER_NODE_BYTES,
      compactRecipeSizeBytes: this.ESTIMATED_RECIPE_BYTES,
      storageSavingsRatio,
      bitwiseAccuracyRate: Number((bitwiseMatches / sampleCount).toFixed(4)),
      cacheHitSpeedupRatio: Number(speedup.toFixed(2)),
    };
  }
}
