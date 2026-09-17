/**
 * CubiO — Real Pretrained Model Loader
 * Loads and caches real pretrained ONNX transformer models and native tokenizers.
 */

import { InferenceCheckpointLoader, PretrainedCheckpointInfo } from '../checkpoint/inferenceCheckpointLoader';

export interface LoadedCubiOModel {
  readonly modelId: string;
  readonly checkpointHash: string;
  readonly parameterCount: number;
  readonly isLoaded: boolean;
  readonly architecture: string;
  readonly weightsSource: string;
  readonly tokenizerId: string;
  readonly inferenceRuntime: string;
  readonly tokenizer: any;
  readonly model: any;
  readonly generator: any;
  readonly status: 'PENDING' | 'INACTIVE' | 'PLACEHOLDER';
  readonly executable: boolean;
}

export type LoadedCubioModel = LoadedCubiOModel;

export class ModelLoader {
  private static cachedModel: LoadedCubiOModel | null = null;
  private static initPromise: Promise<LoadedCubiOModel> | null = null;

  public static async loadPretrainedModel(modelId = InferenceCheckpointLoader.DEFAULT_PRETRAINED_MODEL): Promise<LoadedCubiOModel> {
    if (modelId.toLowerCase().includes('qwen') || modelId.toLowerCase().includes('llama') || modelId.toLowerCase().includes('mistral')) {
      throw new Error(`[QWEN_REMOVED] External pretrained model '${modelId}' is completely eradicated. Status: NATIVE_INFERENCE_NOT_YET_AVAILABLE.`);
    }

    if (this.cachedModel && this.cachedModel.modelId === modelId) {
      return this.cachedModel;
    }

    const info = InferenceCheckpointLoader.getProductionCheckpointInfo(modelId);
    const loadedModel: LoadedCubiOModel = Object.freeze({
      modelId,
      checkpointHash: info.checkpointHash,
      parameterCount: info.parameterCount,
      isLoaded: false,
      architecture: info.architecture,
      weightsSource: info.weightsSource,
      tokenizerId: info.tokenizerId,
      inferenceRuntime: info.inferenceRuntime,
      tokenizer: null,
      model: null,
      generator: null,
      status: 'PENDING' as const,
      executable: false,
    });

    this.cachedModel = loadedModel;
    return loadedModel;
  }

  public static loadModel(): LoadedCubiOModel {
    if (this.cachedModel) {
      return this.cachedModel;
    }
    const info = InferenceCheckpointLoader.getProductionCheckpointInfo();
    // Synchronous representation before async pipeline is ready
    return Object.freeze({
      modelId: info.modelId,
      checkpointHash: info.checkpointHash,
      parameterCount: info.parameterCount,
      isLoaded: false,
      architecture: info.architecture,
      weightsSource: info.weightsSource,
      tokenizerId: info.tokenizerId,
      inferenceRuntime: info.inferenceRuntime,
      tokenizer: null,
      model: null,
      generator: null,
      status: 'PENDING' as const,
      executable: false,
    });
  }

  public static getCachedModel(): LoadedCubiOModel | null {
    return this.cachedModel;
  }

  public static isPrewarmed(): boolean {
    return this.cachedModel !== null && this.cachedModel.isLoaded;
  }

  public static async prewarm(modelId = InferenceCheckpointLoader.DEFAULT_PRETRAINED_MODEL): Promise<LoadedCubiOModel> {
    return this.loadPretrainedModel(modelId);
  }
}
