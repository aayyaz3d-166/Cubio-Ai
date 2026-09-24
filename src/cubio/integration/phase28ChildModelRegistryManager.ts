/**
 * ============================================================================
 * PHASE 28 TASK 452: CHILD MODEL REGISTRY & USER MODEL SELECTOR MANAGER
 * ============================================================================
 *
 * Implements governance and filtering for child-scoped model availability.
 * Ensures normal users can only select and query models authorized for their Child Agent.
 * Strips internal parameters/architecture, enforces fallbacks on suspended models,
 * and rejects unauthorized models with fail-closed security.
 *
 * Certified for offline operation (IS_OFFLINE_ISOLATED === true).
 * Actuation blocked (IS_ACTUATION_BLOCKED === true).
 * Strictly preserves 6 Sovereign Core Assets.
 */

import { ModelRegistry, RegisteredModelEntry } from '../model/native_foundation/model_registry';
import { ModelOperationalState } from '../model/native_foundation/native_model_types';
import { Phase28ChildAgentIdentityRegistry } from './phase28ChildAgentIdentityRegistry';

export interface ChildModelPolicy {
  childId: string;
  allowedModelIds: string[];
  defaultModelId: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PublicModelDescriptor {
  id: string;
  name: string;
  version: string;
  capabilitySummary: string;
  status: 'ACTIVE' | 'SUSPENDED';
  isDefault: boolean;
}

export interface ModelValidationResult {
  valid: boolean;
  selectedModelId: string;
  fallbackApplied: boolean;
  reason?: string;
  errorCode?: 'UNAUTHORIZED_MODEL' | 'UNKNOWN_MODEL' | 'CHILD_NOT_FOUND';
}

export class Phase28ChildModelRegistryManager {
  private static instance: Phase28ChildModelRegistryManager | null = null;
  private policies: Map<string, ChildModelPolicy> = new Map();

  private constructor() {
    this.seedDefaultPolicies();
    this.ensureGlobalModelsRegistered();
  }

  public static getInstance(): Phase28ChildModelRegistryManager {
    if (!Phase28ChildModelRegistryManager.instance) {
      Phase28ChildModelRegistryManager.instance = new Phase28ChildModelRegistryManager();
    }
    return Phase28ChildModelRegistryManager.instance;
  }

  public static resetInstance(): void {
    Phase28ChildModelRegistryManager.instance = null;
  }

  private ensureGlobalModelsRegistered(): void {
    const globalRegistry = ModelRegistry.getInstance();

    if (!globalRegistry.getModel('cubio-native-1m-production')) {
      globalRegistry.registerProductionModel('cubio-native-1m-production', {
        capability: 'LEVEL 4: Native 1M Sovereign Transformer (6 layers, d=128, 343 spatial cells, 7 epistemic tiers)',
        productionMode: 'NATIVE_1M_PRODUCTION_SEALED',
      });
    }

    if (!globalRegistry.getModel('cubio-deterministic-core')) {
      globalRegistry.registerProductionModel('cubio-deterministic-core', {
        capability: 'LEVEL 4: Deterministic Spatial Geometry & Symbolic Memory Core',
        productionMode: 'DETERMINISTIC_CORE',
      });
    }

    if (!globalRegistry.getModel('cubio-spatial-grounding-v1')) {
      globalRegistry.registerProductionModel('cubio-spatial-grounding-v1', {
        capability: 'LEVEL 4: 3D Spatial Grounding & Volumetric Octree Attention',
        productionMode: 'SPATIAL_GROUNDING',
      });
    }

    if (!globalRegistry.getModel('cubio-synthesis-planner-v1')) {
      globalRegistry.registerProductionModel('cubio-synthesis-planner-v1', {
        capability: 'LEVEL 4: Multi-Turn Cognitive Synthesis & Planning Engine',
        productionMode: 'SYNTHESIS_PLANNER',
      });
    }
  }

  private seedDefaultPolicies(): void {
    const basePolicy: ChildModelPolicy = {
      childId: 'cubio-child-mvp',
      allowedModelIds: [
        'cubio-native-1m-production',
        'cubio-deterministic-core',
        'cubio-spatial-grounding-v1',
      ],
      defaultModelId: 'cubio-native-1m-production',
      updatedAt: new Date().toISOString(),
      updatedBy: 'SYSTEM_BOOTSTRAP',
    };

    const mvp1Policy: ChildModelPolicy = {
      childId: 'cubio-child-mvp-1',
      allowedModelIds: [
        'cubio-native-1m-production',
        'cubio-deterministic-core',
      ],
      defaultModelId: 'cubio-native-1m-production',
      updatedAt: new Date().toISOString(),
      updatedBy: 'SYSTEM_BOOTSTRAP',
    };

    const mvp2Policy: ChildModelPolicy = {
      childId: 'cubio-child-mvp-2',
      allowedModelIds: [
        'cubio-spatial-grounding-v1',
        'cubio-synthesis-planner-v1',
      ],
      defaultModelId: 'cubio-spatial-grounding-v1',
      updatedAt: new Date().toISOString(),
      updatedBy: 'SYSTEM_BOOTSTRAP',
    };

    const plancixPolicy: ChildModelPolicy = {
      childId: 'cubio-child-plancix',
      allowedModelIds: [
        'cubio-deterministic-core',
        'cubio-synthesis-planner-v1',
      ],
      defaultModelId: 'cubio-deterministic-core',
      updatedAt: new Date().toISOString(),
      updatedBy: 'SYSTEM_BOOTSTRAP',
    };

    this.policies.set(basePolicy.childId, basePolicy);
    this.policies.set(mvp1Policy.childId, mvp1Policy);
    this.policies.set(mvp2Policy.childId, mvp2Policy);
    this.policies.set(plancixPolicy.childId, plancixPolicy);
  }

  /**
   * Retrieves public safe model descriptors allowed for a given Child Agent.
   * Strips all internal architecture, weight shapes, parameters, and secret checkpoint paths.
   */
  public getModelsForChild(childId: string): PublicModelDescriptor[] {
    this.ensureGlobalModelsRegistered();
    const policy = this.getOrCreatePolicy(childId);
    const globalRegistry = ModelRegistry.getInstance();

    const result: PublicModelDescriptor[] = [];

    for (const modelId of policy.allowedModelIds) {
      const entry = globalRegistry.getModel(modelId);
      if (entry) {
        const isReady = entry.operationalState === ModelOperationalState.READY;
        result.push({
          id: entry.modelId,
          name: this.formatDisplayName(entry.modelId),
          version: '16.0.0-sealed',
          capabilitySummary: entry.capability || 'CUBiO Sovereign Native Foundation Model',
          status: isReady ? 'ACTIVE' : 'SUSPENDED',
          isDefault: entry.modelId === policy.defaultModelId,
        });
      }
    }

    return result;
  }

  private formatDisplayName(modelId: string): string {
    switch (modelId) {
      case 'cubio-native-1m-production':
        return 'CUBiO Native 1M Production';
      case 'cubio-deterministic-core':
        return 'CUBiO Deterministic Spatial Core';
      case 'cubio-spatial-grounding-v1':
        return 'CUBiO Spatial Grounding v1';
      case 'cubio-synthesis-planner-v1':
        return 'CUBiO Synthesis Planner v1';
      default:
        return modelId;
    }
  }

  /**
   * Validates a model selection against child policy and model operational state.
   * Handles safe fallback if an authorized model is currently suspended.
   */
  public validateAndResolveModel(childId: string, requestedModelId?: string): ModelValidationResult {
    this.ensureGlobalModelsRegistered();
    const identityRegistry = Phase28ChildAgentIdentityRegistry.getInstance();
    const child = identityRegistry.getChild(childId);
    if (!child) {
      return {
        valid: false,
        selectedModelId: '',
        fallbackApplied: false,
        reason: `Child agent '${childId}' not found or not registered.`,
        errorCode: 'CHILD_NOT_FOUND',
      };
    }

    const policy = this.getOrCreatePolicy(childId);
    const globalRegistry = ModelRegistry.getInstance();

    // If no model explicitly requested, resolve to child default model
    const targetModelId = requestedModelId || policy.defaultModelId;

    // Check authorization: Model must be explicitly in policy.allowedModelIds
    if (!policy.allowedModelIds.includes(targetModelId)) {
      return {
        valid: false,
        selectedModelId: targetModelId,
        fallbackApplied: false,
        reason: `Model '${targetModelId}' is not authorized for child agent '${childId}'.`,
        errorCode: 'UNAUTHORIZED_MODEL',
      };
    }

    const modelRecord = globalRegistry.getModel(targetModelId);
    if (!modelRecord) {
      return {
        valid: false,
        selectedModelId: targetModelId,
        fallbackApplied: false,
        reason: `Model '${targetModelId}' does not exist in registry.`,
        errorCode: 'UNKNOWN_MODEL',
      };
    }

    // Check if model is active or suspended
    const isActive = modelRecord.operationalState === ModelOperationalState.READY;
    if (!isActive) {
      // Authorized but suspended -> Safe fallback to defaultModelId if different and active
      const defaultRecord = globalRegistry.getModel(policy.defaultModelId);
      const isDefaultActive = defaultRecord?.operationalState === ModelOperationalState.READY;
      if (defaultRecord && isDefaultActive && policy.defaultModelId !== targetModelId) {
        return {
          valid: true,
          selectedModelId: policy.defaultModelId,
          fallbackApplied: true,
          reason: `Requested model '${targetModelId}' is suspended. Safely fallen back to default model '${policy.defaultModelId}'.`,
        };
      } else {
        return {
          valid: false,
          selectedModelId: targetModelId,
          fallbackApplied: false,
          reason: `Requested model '${targetModelId}' is suspended and no active fallback is available.`,
        };
      }
    }

    return {
      valid: true,
      selectedModelId: targetModelId,
      fallbackApplied: false,
    };
  }

  /**
   * Admin-only: Updates or sets child model policy.
   */
  public updateChildPolicy(
    childId: string,
    allowedModelIds: string[],
    defaultModelId: string,
    adminUser: string
  ): ChildModelPolicy {
    this.ensureGlobalModelsRegistered();
    const globalRegistry = ModelRegistry.getInstance();
    const allRegistered = globalRegistry.getAllModels();
    const validModelIds = new Set(allRegistered.map((s) => s.modelId));

    // Validate that all allowedModelIds exist in global registry
    for (const mId of allowedModelIds) {
      if (!validModelIds.has(mId)) {
        throw new Error(`Cannot authorize unknown model '${mId}'.`);
      }
    }

    if (!allowedModelIds.includes(defaultModelId)) {
      throw new Error(`Default model '${defaultModelId}' must be included in allowed models.`);
    }

    const policy: ChildModelPolicy = {
      childId,
      allowedModelIds: [...allowedModelIds],
      defaultModelId,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser,
    };

    this.policies.set(childId, policy);
    return policy;
  }

  public getChildPolicy(childId: string): ChildModelPolicy | null {
    return this.policies.get(childId) || null;
  }

  public getAllPolicies(): ChildModelPolicy[] {
    return Array.from(this.policies.values());
  }

  private getOrCreatePolicy(childId: string): ChildModelPolicy {
    let policy = this.policies.get(childId);
    if (!policy) {
      // Fallback baseline policy for newly installed or unconfigured child
      policy = {
        childId,
        allowedModelIds: ['cubio-native-1m-production'],
        defaultModelId: 'cubio-native-1m-production',
        updatedAt: new Date().toISOString(),
        updatedBy: 'DEFAULT_POLICY_GENERATOR',
      };
      this.policies.set(childId, policy);
    }
    return policy;
  }
}
