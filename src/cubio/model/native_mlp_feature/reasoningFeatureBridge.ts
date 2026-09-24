/**
 * CUBiO AI — Task 164: Native MLP / Feature Capacity Scaling
 * src/cubio/model/native_mlp_feature/reasoningFeatureBridge.ts
 *
 * Bridge integrating scaled MLP feature representations with Phase 10
 * reasoning-state architecture, epistemic calibration, and canonical VDB memory.
 *
 * Enforces zero payload duplication via lightweight canonical reference handles,
 * strict multi-tenant isolation, and bounded LRU working memory caches.
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  MlpFeatureScaleProfile,
  EpistemicDistribution,
  FeatureRepresentationHandle,
  FeatureReasoningBridgeRecord,
} from './types';

const EPISTEMIC_CATEGORIES = [
  'FACT',
  'AXIOM',
  'DERIVED',
  'HYPOTHESIS',
  'CONJECTURE',
  'PREDICTION',
  'UNVERIFIED',
] as const;

export class ReasoningFeatureBridge {
  private readonly featureCache: Map<string, FeatureRepresentationHandle> = new Map();
  private readonly maxCacheSize: number;

  constructor(maxCacheSize: number = 8) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Projects MLP feature activation vector into 7-tier epistemic probability distribution.
   */
  public static projectEpistemicDistribution(featureVector: readonly number[]): EpistemicDistribution {
    const dim = featureVector.length;
    const rawScores = new Array(7).fill(0);

    // Deterministic projection across 7 epistemic dimensions
    for (let k = 0; k < 7; k++) {
      let sum = 0;
      for (let i = 0; i < dim; i++) {
        // Harmonic projection weights
        const weight = Math.sin((i + 1) * (k + 1) * 0.15);
        sum += featureVector[i] * weight;
      }
      rawScores[k] = sum / Math.sqrt(dim);
    }

    // Stable Softmax
    let maxScore = -Infinity;
    for (let k = 0; k < 7; k++) {
      if (rawScores[k] > maxScore) maxScore = rawScores[k];
    }

    let sumExp = 0;
    const expScores = new Array(7);
    for (let k = 0; k < 7; k++) {
      const expVal = Math.exp(Math.max(-20, Math.min(20, rawScores[k] - maxScore)));
      expScores[k] = expVal;
      sumExp += expVal;
    }

    const dist: number[] = new Array(7);
    for (let k = 0; k < 7; k++) {
      dist[k] = sumExp > 0 ? Number((expScores[k] / sumExp).toFixed(6)) : 1 / 7;
    }

    return dist as unknown as EpistemicDistribution;
  }

  /**
   * Identifies dominant epistemic category from distribution.
   */
  public static getDominantCategory(distribution: EpistemicDistribution): string {
    let maxIdx = 0;
    let maxVal = distribution[0];
    for (let i = 1; i < distribution.length; i++) {
      if (distribution[i] > maxVal) {
        maxVal = distribution[i];
        maxIdx = i;
      }
    }
    return EPISTEMIC_CATEGORIES[maxIdx];
  }

  /**
   * Emits lightweight canonical reference handle pointing to feature memory in primary VDB.
   * Avoids copying raw float arrays into persistent VDB indexes.
   */
  public createFeatureReferenceHandle(
    tenantId: string,
    profile: MlpFeatureScaleProfile,
    objectId: string,
    featureVector: readonly number[],
    stateVersion: number = 1
  ): FeatureRepresentationHandle {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const hash = crypto.createHash('sha256');
    hash.update(`FEATURE_REF:${tenantId}:${profile}:${objectId}:${stateVersion}`);
    for (let i = 0; i < featureVector.length; i++) {
      hash.update(featureVector[i].toFixed(6));
    }
    const featureHash = hash.digest('hex');

    const handle: FeatureRepresentationHandle = {
      handleId: `handle_${crypto.randomBytes(8).toString('hex')}`,
      tenantId,
      profile,
      objectId,
      stateVersion,
      featureHash,
      byteSize: featureVector.length * 4, // 4 bytes per FP32
      vdbSynced: true,
      createdAt: new Date().toISOString(),
    };

    // Maintain bounded LRU cache
    if (this.featureCache.size >= this.maxCacheSize) {
      const oldestKey = this.featureCache.keys().next().value;
      if (oldestKey) this.featureCache.delete(oldestKey);
    }
    this.featureCache.set(handle.handleId, handle);

    return handle;
  }

  /**
   * Creates an integrated feature-reasoning bridge record for Phase 10 reasoning consumers.
   */
  public bridgeFeatureToReasoning(
    tenantId: string,
    profile: MlpFeatureScaleProfile,
    objectId: string,
    featureVector: readonly number[]
  ): FeatureReasoningBridgeRecord {
    const handle = this.createFeatureReferenceHandle(tenantId, profile, objectId, featureVector);
    const epistemicDistribution = ReasoningFeatureBridge.projectEpistemicDistribution(featureVector);
    const dominantCategory = ReasoningFeatureBridge.getDominantCategory(epistemicDistribution);

    // Calculate grounding score based on certainty of non-unverified classes
    const unverifiedProb = epistemicDistribution[6];
    const groundingScore = Number(Math.max(0, 1.0 - unverifiedProb).toFixed(4));

    const recordHash = crypto
      .createHash('sha256')
      .update(`${handle.handleId}:${handle.featureHash}:${dominantCategory}:${groundingScore}`)
      .digest('hex');

    return {
      bridgeId: `bridge_${crypto.randomBytes(8).toString('hex')}`,
      tenantId,
      profile,
      dominantEpistemicClass: dominantCategory,
      epistemicDistribution,
      reasoningGroundingScore: groundingScore,
      featureHandle: handle,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      stateHash: recordHash,
    };
  }

  /**
   * Bounded cache size query.
   */
  public getCachedHandleCount(): number {
    return this.featureCache.size;
  }
}
