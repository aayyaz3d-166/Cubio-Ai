/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * checkpoint_manager.ts
 *
 * Dedicated Checkpoint Manager for Native Models.
 * Strictly enforces structural and domain separation:
 * MODEL_CHECKPOINT (weights, architecture, manifest, lineage)
 * vs
 * COGNITIVE_MEMORY_CHECKPOINT (.3dmemory spatial state, knowledge records)
 *
 * Weights are NEVER placed into the persistent cognitive memory store.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  NativeModelCheckpoint,
  NativeModelConfig,
  CUBIO_NATIVE_MODEL_ID,
} from './native_model_types';
import { CubiONativeModel } from './native_model_architecture';
import { ExternalModelGuard } from './external_model_guard';

export class CheckpointManager {
  /**
   * Creates a sealed NativeModelCheckpoint container from a trained model instance
   */
  public static createCheckpoint(
    model: CubiONativeModel,
    trainingRunId: string,
    lineageParentStateHash: string | null,
    evaluationScore = 1.0
  ): NativeModelCheckpoint {
    ExternalModelGuard.assertNativeOnly(model.modelId);

    const weights = model.getWeights();
    const inventory = model.getParameterInventory();
    const modelStateHash = model.computeWeightsHash();

    // Compute Merkle root across weight tensors
    const merkleHash = createHash('sha256');
    for (const t of inventory.tensors) {
      merkleHash.update(`${t.tensorName}:${t.parameterCount}`);
    }
    const weightsMerkleRoot = merkleHash.digest('hex');

    const checkpointId = `CHK_NATIVE_${Date.now()}_${modelStateHash.slice(0, 8)}`;

    return Object.freeze({
      checkpointId,
      modelId: model.modelId || CUBIO_NATIVE_MODEL_ID,
      containerType: 'CUBIO_NATIVE_MODEL_CHECKPOINT_V1',
      architectureVersion: '1.0.0',
      vocabularyVersion: '1.0.0',
      trainingRunId,
      lineageParentStateHash,
      modelStateHash,
      weightsMerkleRoot,
      parameterInventory: inventory,
      weights: {
        tokenEmbedding: weights.tokenEmbedding as any,
        positionalEmbedding: weights.positionalEmbedding as any,
        spatialEmbedding: weights.spatialEmbedding as any,
        layers: weights.layers as any,
        epistemicHead: weights.epistemicHead as any,
        lmHead: weights.lmHead as any,
      },
      evaluationScore,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Saves a checkpoint to disk inside a dedicated checkpoints directory
   */
  public static saveCheckpoint(checkpoint: NativeModelCheckpoint, targetDir: string): string {
    // Ensure we do NOT write to a .3dmemory cognitive memory path
    if (targetDir.endsWith('.3dmemory') || targetDir.includes('.3dmemory')) {
      throw new Error('[DOMAIN_CONFLATION_ERROR] Cannot save native model weights into a .3dmemory cognitive memory container!');
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filename = `${checkpoint.checkpointId}.cubiomodel`;
    const targetPath = path.join(targetDir, filename);

    if (targetPath.endsWith('.3dmemory')) {
      throw new Error('[DOMAIN_CONFLATION_ERROR] Cannot save native model weights into a .3dmemory cognitive memory container!');
    }

    fs.writeFileSync(targetPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
    return targetPath;
  }

  /**
   * Loads a checkpoint from disk
   */
  public static loadCheckpoint(filePath: string): NativeModelCheckpoint {
    if (filePath.endsWith('.3dmemory')) {
      throw new Error('[DOMAIN_CONFLATION_ERROR] Cannot load model checkpoint from a .3dmemory cognitive store!');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed: NativeModelCheckpoint = JSON.parse(content);

    if (parsed.containerType !== 'CUBIO_NATIVE_MODEL_CHECKPOINT_V1') {
      throw new Error(`Invalid container type in ${filePath}: ${parsed.containerType}`);
    }

    return parsed;
  }
}
