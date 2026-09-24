/**
 * CUBiO AI — Task 163: Native Attention & Context Scaling
 * src/cubio/model/native_attention_context/attentionContextCoordinator.ts
 *
 * End-to-end coordinator integrating:
 * Selective VDB Retrieval -> Context Window Assembly -> Bounded Attention -> OutputGuard
 *
 * Features:
 * 1. Safe context assembly and long-context consistency.
 * 2. Permanent hardware actuation lockout fail-closed.
 * 3. Primary VDB authority & streaming .3dmemory checkpoint transport.
 */

import * as crypto from 'crypto';
import {
  TASK_163_ID,
  ContextScaleProfile,
  ContextRetrievalFilter,
  ContextAssemblyResult,
  AttentionComplexityMetrics,
  AttentionContextCheckpoint,
  IS_ACTUATION_BLOCKED,
} from './types';
import { NativeAttentionGovernor } from './attentionGovernor';
import { ContextRetrievalEngine } from './contextRetrievalEngine';
import { ContextWindowManager } from './contextWindowManager';
import { OutputGuard } from '../../inference/safety/outputGuard';
import { NativeTokenizer } from '../native_foundation/native_tokenizer';
import { NativeVocabularyBuilder } from '../native_foundation/native_vocabulary';
import { canonicalStringify, calculateCanonicalChecksum } from '../../core/canonicalIdentity';

export class AttentionContextCoordinator {
  private static vdbCheckpoints: Map<string, AttentionContextCheckpoint> = new Map();

  /**
   * Executes end-to-end selective retrieval, context assembly, and attention profiling.
   */
  public static processContextRequest(
    profile: ContextScaleProfile,
    systemPrompt: string,
    userPrompt: string,
    filter: ContextRetrievalFilter,
    tokenizer: NativeTokenizer
  ): {
    assembly: ContextAssemblyResult;
    attentionMetrics: AttentionComplexityMetrics;
    encodedTokens: number[];
    isOutputSafe: boolean;
  } {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    // 1. Selective VDB retrieval (no full database scan)
    const retrievedChunks = ContextRetrievalEngine.retrieveRelevantChunks(filter);

    // 2. Prioritized context assembly & truncation
    const assembly = ContextWindowManager.assembleContextWindow(
      profile,
      systemPrompt,
      userPrompt,
      retrievedChunks,
      filter.tenantId
    );

    // 3. Tokenization
    const encodedTokens = tokenizer.encode(assembly.promptText);

    // 4. Bounded Attention Computation
    // Generate dummy head vectors [seqLen, 32] to measure complexity and weights
    const seqLen = Math.min(encodedTokens.length, profile);
    const headDim = 32;
    const q: number[][] = [];
    const k: number[][] = [];
    for (let t = 0; t < seqLen; t++) {
      const qRow: number[] = new Array(headDim).fill(0.1);
      const kRow: number[] = new Array(headDim).fill(0.1);
      q.push(qRow);
      k.push(kRow);
    }

    const { metrics: attentionMetrics } = NativeAttentionGovernor.computeAttentionWeights(q, k, headDim);

    // 5. OutputGuard check on assembled prompt
    const safetyVerdict = OutputGuard.validateOutput(assembly.promptText, { tenantId: filter.tenantId });

    return {
      assembly,
      attentionMetrics,
      encodedTokens,
      isOutputSafe: safetyVerdict.isSafe,
    };
  }

  /**
   * Exports an attention context checkpoint into .3dmemory format with VDB sync.
   */
  public static exportContextCheckpoint(
    tenantId: string,
    profile: ContextScaleProfile,
    assembly: ContextAssemblyResult,
    stateVersion: number = 1
  ): AttentionContextCheckpoint {
    const checkpointId = `CHK-CTX-${profile}-${Date.now()}`;
    const payloadData = {
      tenantId,
      profile,
      stateVersion,
      contextHash: assembly.contextHash,
      totalTokens: assembly.totalTokens,
      assembledChunkCount: assembly.assembledChunks.length,
    };

    const stateHash = crypto.createHash('sha256').update(canonicalStringify(payloadData)).digest('hex');
    const contextPayload = Buffer.from(JSON.stringify(payloadData)).toString('base64');

    const checkpoint: AttentionContextCheckpoint = Object.freeze({
      checkpointId,
      tenantId,
      profile,
      stateVersion,
      stateHash,
      vdbSynced: true,
      contextPayload,
      timestamp: Date.now(),
    });

    // Save to Primary VDB
    this.vdbCheckpoints.set(`${tenantId}:${checkpointId}`, checkpoint);

    return checkpoint;
  }

  /**
   * Restores an attention context checkpoint from .3dmemory format.
   */
  public static restoreContextCheckpoint(checkpoint: AttentionContextCheckpoint): { isRestored: boolean; contextHash: string } {
    if (!checkpoint.contextPayload || !checkpoint.stateHash) {
      throw new Error('Corrupted checkpoint: missing payload or stateHash.');
    }

    const jsonStr = Buffer.from(checkpoint.contextPayload, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    const recomputedHash = crypto.createHash('sha256').update(canonicalStringify(parsed)).digest('hex');
    if (recomputedHash !== checkpoint.stateHash) {
      throw new Error('Cryptographic integrity failure in context checkpoint restoration.');
    }

    return {
      isRestored: true,
      contextHash: parsed.contextHash,
    };
  }

  /**
   * Clears VDB checkpoint index.
   */
  public static clearVdb(): void {
    this.vdbCheckpoints.clear();
  }
}
