/**
 * CUBiO AI — Phase 10: API v1 Models Metadata Handler
 * src/cubio/api/v1/modelsHandler.ts
 *
 * GET /api/v1/models
 *
 * Returns safe public metadata regarding the active CUBiO intelligence model.
 * Invariant: Never exposes internal file paths, model weights, training datasets,
 * or raw checkpoint binaries.
 */

import { Request, Response } from 'express';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../../intelligence/chat/chatEngineContract';
import { Native1MProductionService } from '../../inference/native1mProductionService';
import { ModelRegistry } from '../../model/native_foundation/model_registry';

export interface RegisteredModelSummary {
  readonly id: string;
  readonly modelId: string;
  readonly name: string;
  readonly version: string;
  readonly parameters: number;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly maxSequenceLength: number;
  readonly vocabSize: number;
  readonly spatialCells: number;
  readonly epistemicClasses: number;
  readonly stateHash: string;
  readonly status: string;
  readonly active: boolean;
  readonly capability: string;
  readonly productionMode: string;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
}

export interface ModelMetadataResponse {
  readonly model: string;
  readonly version: string;
  readonly parameters: number;
  readonly layerCount: number;
  readonly capability: string;
  readonly productionMode: string;
  readonly neuralPrimary: string;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
  readonly timestamp: string;
  readonly count: number;
  readonly activeModelId: string | null;
  readonly models: RegisteredModelSummary[];
}

import { Phase28ChildModelRegistryManager, PublicModelDescriptor } from '../../integration/phase28ChildModelRegistryManager';

export interface ChildModelsResponse {
  readonly childId: string;
  readonly models: PublicModelDescriptor[];
  readonly defaultModelId: string;
  readonly timestamp: string;
}

export function modelsHandler(req: Request, res: Response): void {
  const childId = req.query.childId as string | undefined;

  // If a childId is provided, return only public descriptors authorized for that child
  if (childId) {
    const childModelManager = Phase28ChildModelRegistryManager.getInstance();
    const childModels = childModelManager.getModelsForChild(childId);
    const policy = childModelManager.getChildPolicy(childId);
    res.status(200).json({
      childId,
      models: childModels,
      defaultModelId: policy?.defaultModelId || 'cubio-native-1m-production',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const native1mService = Native1MProductionService.getInstance();
  const is1MReady = native1mService.isReady();
  const registry = ModelRegistry.getInstance();

  let models: RegisteredModelSummary[] = [];

  if (is1MReady) {
    const registered = registry.getAllModels();
    if (registered.length > 0) {
      models = registered.map((reg) => ({
        id: reg.modelId,
        modelId: reg.modelId,
        name: reg.modelId === 'cubio-native-1m-production' ? 'CUBiO Native 1M Production' : reg.modelId,
        version: '16.0.0-sealed',
        parameters: reg.parameters ?? 971520,
        layerCount: reg.layerCount ?? 6,
        hiddenDimension: reg.hiddenDimension ?? 128,
        attentionHeads: 4,
        maxSequenceLength: 256,
        vocabSize: 4096,
        spatialCells: 343,
        epistemicClasses: 7,
        stateHash: reg.stateHash || '0942c34c1ad6d725063072e37f6d7a5e91537d6e894988f551605bb3691e7c37',
        status: 'READY',
        active: true,
        capability: reg.capability || 'LEVEL 4: Native 1M Sovereign Transformer (6 layers, d=128, 343 spatial cells, 7 epistemic tiers)',
        productionMode: reg.productionMode || 'NATIVE_1M_PRODUCTION_SEALED',
        isActuationBlocked: IS_ACTUATION_BLOCKED,
        isOfflineIsolated: OFFLINE_ISOLATED,
      }));
    } else {
      // Direct registration fallback from Native1MProductionService metadata
      const meta = native1mService.getModelMetadata();
      const fallbackEntry: RegisteredModelSummary = {
        id: 'cubio-native-1m-production',
        modelId: 'cubio-native-1m-production',
        name: 'CUBiO Native 1M Production',
        version: meta.version || '16.0.0-sealed',
        parameters: meta.parameters || 971520,
        layerCount: meta.layerCount || 6,
        hiddenDimension: meta.hiddenDimension || 128,
        attentionHeads: meta.attentionHeads || 4,
        maxSequenceLength: meta.maxSequenceLength || 256,
        vocabSize: meta.vocabSize || 4096,
        spatialCells: meta.spatialCells || 343,
        epistemicClasses: meta.epistemicClasses || 7,
        stateHash: meta.stateHash || '0942c34c1ad6d725063072e37f6d7a5e91537d6e894988f551605bb3691e7c37',
        status: 'READY',
        active: true,
        capability: 'LEVEL 4: Native 1M Sovereign Transformer (6 layers, d=128, 343 spatial cells, 7 epistemic tiers)',
        productionMode: 'NATIVE_1M_PRODUCTION_SEALED',
        isActuationBlocked: IS_ACTUATION_BLOCKED,
        isOfflineIsolated: OFFLINE_ISOLATED,
      };
      registry.registerProductionModel('cubio-native-1m-production', {
        parameters: fallbackEntry.parameters,
        layerCount: fallbackEntry.layerCount,
        hiddenDimension: fallbackEntry.hiddenDimension,
        stateHash: fallbackEntry.stateHash,
        capability: fallbackEntry.capability,
        productionMode: fallbackEntry.productionMode,
      });
      models = [fallbackEntry];
    }
  }

  const primaryModel = models[0];

  const metadata: ModelMetadataResponse = is1MReady
    ? {
        model: primaryModel?.id ?? 'cubio-native-1m-production',
        version: primaryModel?.version ?? '16.0.0-sealed',
        parameters: primaryModel?.parameters ?? 971520,
        layerCount: primaryModel?.layerCount ?? 6,
        capability: primaryModel?.capability ?? 'LEVEL 4: Native 1M Sovereign Transformer (6 layers, d=128, 343 spatial cells, 7 epistemic tiers)',
        productionMode: primaryModel?.productionMode ?? 'NATIVE_1M_PRODUCTION_SEALED',
        neuralPrimary: 'AUTHORIZED_NATIVE_EDGE',
        isActuationBlocked: IS_ACTUATION_BLOCKED,
        isOfflineIsolated: OFFLINE_ISOLATED,
        timestamp: new Date().toISOString(),
        count: models.length,
        activeModelId: primaryModel?.id ?? 'cubio-native-1m-production',
        models,
      }
    : {
        model: 'NONE',
        version: '1.0.0',
        parameters: 0,
        layerCount: 0,
        capability: 'LEVEL 4: Spatial + Memory-Conditioned Deterministic Core (Model Clean / Reset)',
        productionMode: 'DETERMINISTIC_ONLY',
        neuralPrimary: 'NOT AUTHORIZED',
        isActuationBlocked: IS_ACTUATION_BLOCKED,
        isOfflineIsolated: OFFLINE_ISOLATED,
        timestamp: new Date().toISOString(),
        count: 0,
        activeModelId: null,
        models: [],
      };

  res.status(200).json(metadata);
}
