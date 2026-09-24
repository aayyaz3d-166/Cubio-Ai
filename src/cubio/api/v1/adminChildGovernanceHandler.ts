/**
 * CUBiO AI — Phase 28 Task 450: Admin Child Governance Handler
 * src/cubio/api/v1/adminChildGovernanceHandler.ts
 *
 * Backend administrative governance endpoints for CUBiO Web Studio Admin Panel:
 * - GET  /api/v1/admin/children            (List registered child agents & safe status)
 * - POST /api/v1/admin/children/lifecycle  (Activate, disable, update, retire child agents)
 * - GET  /api/v1/admin/permissions         (Role-Capability entitlement matrix & quotas)
 * - POST /api/v1/admin/models/availability (Model availability & operational state management)
 *
 * Invariants:
 * 1. Strictly restricted to 'admin' role via requireAuth() and requireRole('admin').
 * 2. Never exposes private Mother Core internal implementation (weights, schemas, tables, etc.).
 * 3. 100% fail-closed on invalid transitions or unauthorized requests.
 * 4. All admin mutations are recorded to the tamper-evident audit log.
 */

import { Request, Response } from 'express';
import {
  Phase28MvpChildLifecycleManager,
  CERTIFIED_CORE_LIFECYCLE_ADMIN,
  ChildInstallRequest,
  ChildUpdatePatch,
} from '../../integration/phase28MvpChildLifecycleManager';
import {
  Phase28ChildInstallationManager,
  ChildInstallDefinition,
} from '../../integration/phase28ChildInstallationManager';
import {
  Phase28ChildAgentIdentityRegistry,
  ChildAgentRecord,
  ChildLifecycleState,
} from '../../integration/phase28ChildAgentIdentityRegistry';
import {
  ROLE_CAPABILITY_MATRIX,
  CERTIFIED_CHILD_WIRE_SECRET,
} from '../../integration/phase28SecureCoreWire';
import { ChildAgentRole, CoreCapabilityType } from '../../integration/phase28CoreChildIntelligenceBridge';
import { ModelRegistry, RegisteredModelEntry } from '../../model/native_foundation/model_registry';
import { ModelOperationalState } from '../../model/native_foundation/native_model_types';
import { Native1MProductionService } from '../../inference/native1mProductionService';
import { IS_ACTUATION_BLOCKED, OFFLINE_ISOLATED } from '../../intelligence/chat/chatEngineContract';
import { writeAuditEntry } from '../security/auditLogger';

// ============================================================================
// SAFE PUBLIC METADATA FORMATTERS (PREVENT MOTHER CORE LEAKAGE)
// ============================================================================

export interface SafeAdminChildAgentRecord {
  readonly childId: string;
  readonly agentName: string;
  readonly semanticVersion: string;
  readonly role: ChildAgentRole;
  readonly description: string;
  readonly lifecycleState: ChildLifecycleState;
  readonly identityHash: string;
  readonly capabilityProfile: {
    readonly maxRequestTokens: number;
    readonly maxTurnHistory: number;
    readonly allowedCapabilities: readonly CoreCapabilityType[];
    readonly offlineIsolatedOnly: boolean;
    readonly isActuationBlocked: boolean;
  };
  readonly connectionState: {
    readonly isConnected: boolean;
    readonly activeWireVersion: string;
    readonly lastHeartbeatTimestamp: string;
    readonly totalRequestsDispatched: number;
  };
  readonly registeredAt: string;
  readonly updatedAt: string;
}

function toSafeChildRecord(record: ChildAgentRecord): SafeAdminChildAgentRecord {
  return {
    childId: record.childId,
    agentName: record.agentName,
    semanticVersion: record.semanticVersion,
    role: record.role,
    description: record.description,
    lifecycleState: record.lifecycleState,
    identityHash: record.identityHash,
    capabilityProfile: {
      maxRequestTokens: record.capabilityProfile.maxRequestTokens,
      maxTurnHistory: record.capabilityProfile.maxTurnHistory,
      allowedCapabilities: record.capabilityProfile.allowedCapabilities,
      offlineIsolatedOnly: record.capabilityProfile.offlineIsolatedOnly,
      isActuationBlocked: record.capabilityProfile.isActuationBlocked,
    },
    connectionState: {
      isConnected: record.connectionState.isConnected,
      activeWireVersion: record.connectionState.activeWireVersion,
      lastHeartbeatTimestamp: record.connectionState.lastHeartbeatTimestamp,
      totalRequestsDispatched: record.connectionState.totalRequestsDispatched,
    },
    registeredAt: record.registeredAt,
    updatedAt: record.updatedAt,
  };
}

// ============================================================================
// ENDPOINT HANDLERS
// ============================================================================

/**
 * GET /api/v1/admin/children
 * Lists all registered Child Agents with safe administrative metadata.
 */
export function adminListChildrenHandler(req: Request, res: Response): void {
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';
  const registry = Phase28ChildAgentIdentityRegistry.getInstance();
  const children = registry.listAllChildren();

  const safeChildren = children.map(toSafeChildRecord);

  writeAuditEntry({
    ts: new Date().toISOString(),
    keyId: adminKeyId,
    role: 'admin',
    method: 'GET',
    path: '/api/v1/admin/children',
    status: 200,
    ms: 1,
    ip: req.ip || '127.0.0.1',
    contentLength: safeChildren.length,
  });

  res.status(200).json({
    success: true,
    count: safeChildren.length,
    children: safeChildren,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/v1/admin/children/lifecycle
 * Mutates child lifecycle: ACTIVATE, DISABLE, UPDATE, RETIRE, or INSTALL.
 */
export function adminChildLifecycleHandler(req: Request, res: Response): void {
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';
  const { action, childId, config, patch } = req.body || {};

  if (!action || typeof action !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      code: 'MISSING_ACTION',
      detail: "Field 'action' is required (ACTIVATE | DISABLE | UPDATE | RETIRE | INSTALL).",
    });
    return;
  }

  const manager = Phase28MvpChildLifecycleManager.getInstance();

  try {
    let resultRecord: ChildAgentRecord;

    switch (action.toUpperCase()) {
      case 'ACTIVATE': {
        if (!childId || typeof childId !== 'string') {
          res.status(400).json({ error: 'Bad Request', code: 'MISSING_CHILD_ID', detail: 'childId is required for ACTIVATE.' });
          return;
        }
        resultRecord = manager.activateChild(childId, CERTIFIED_CORE_LIFECYCLE_ADMIN);
        break;
      }

      case 'DISABLE': {
        if (!childId || typeof childId !== 'string') {
          res.status(400).json({ error: 'Bad Request', code: 'MISSING_CHILD_ID', detail: 'childId is required for DISABLE.' });
          return;
        }
        resultRecord = manager.disableChild(childId, CERTIFIED_CORE_LIFECYCLE_ADMIN);
        break;
      }

      case 'UPDATE': {
        if (!childId || typeof childId !== 'string') {
          res.status(400).json({ error: 'Bad Request', code: 'MISSING_CHILD_ID', detail: 'childId is required for UPDATE.' });
          return;
        }
        const updatePatch: ChildUpdatePatch = patch || {};
        resultRecord = manager.updateChild(childId, updatePatch, CERTIFIED_CORE_LIFECYCLE_ADMIN);
        break;
      }

      case 'RETIRE': {
        if (!childId || typeof childId !== 'string') {
          res.status(400).json({ error: 'Bad Request', code: 'MISSING_CHILD_ID', detail: 'childId is required for RETIRE.' });
          return;
        }
        resultRecord = manager.retireChild(childId, CERTIFIED_CORE_LIFECYCLE_ADMIN);
        break;
      }

      case 'INSTALL': {
        if (!config || typeof config !== 'object') {
          res.status(400).json({ error: 'Bad Request', code: 'MISSING_CONFIG', detail: 'config object is required for INSTALL.' });
          return;
        }
        const installReq: ChildInstallRequest = {
          childId: config.childId,
          agentName: config.agentName,
          semanticVersion: config.semanticVersion,
          role: config.role,
          description: config.description,
          customMaxTokens: config.customMaxTokens,
        };
        resultRecord = manager.installChild(installReq, CERTIFIED_CORE_LIFECYCLE_ADMIN);
        break;
      }

      default:
        res.status(400).json({
          error: 'Bad Request',
          code: 'UNSUPPORTED_ACTION',
          detail: `Unsupported lifecycle action '${action}'.`,
        });
        return;
    }

    writeAuditEntry({
      ts: new Date().toISOString(),
      keyId: adminKeyId,
      role: 'admin',
      method: 'POST',
      path: '/api/v1/admin/children/lifecycle',
      status: 200,
      ms: 2,
      ip: req.ip || '127.0.0.1',
      contentLength: 0,
    });

    res.status(200).json({
      success: true,
      action: action.toUpperCase(),
      child: toSafeChildRecord(resultRecord),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Lifecycle Mutation Rejected',
      code: 'LIFECYCLE_MUTATION_FAILED',
      detail: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/v1/admin/children/install
 * Installs and registers a new Child MVP version with rollback-safe validation.
 */
export function adminInstallChildHandler(req: Request, res: Response): void {
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';
  const def: ChildInstallDefinition = req.body || {};

  const installMgr = Phase28ChildInstallationManager.getInstance();
  const result = installMgr.installChild(def, CERTIFIED_CORE_LIFECYCLE_ADMIN);

  writeAuditEntry({
    ts: new Date().toISOString(),
    keyId: adminKeyId,
    role: 'admin',
    method: 'POST',
    path: '/api/v1/admin/children/install',
    status: result.success ? 200 : 400,
    ms: 3,
    ip: req.ip || '127.0.0.1',
    contentLength: 0,
  });

  if (!result.success) {
    res.status(400).json({
      error: 'Installation Rejected',
      code: 'CHILD_INSTALLATION_FAILED',
      detail: result.error,
      validationReport: result.validationReport,
      stage: result.stage,
      timestamp: result.timestamp,
    });
    return;
  }

  res.status(200).json({
    success: true,
    stage: result.stage,
    child: result.child ? toSafeChildRecord(result.child) : undefined,
    validationReport: result.validationReport,
    transactionId: result.transactionId,
    timestamp: result.timestamp,
  });
}

/**
 * GET /api/v1/admin/permissions
 * Retrieves the Role-Capability Entitlement Matrix and governance boundaries.
 */
export function adminPermissionsHandler(req: Request, res: Response): void {
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';

  writeAuditEntry({
    ts: new Date().toISOString(),
    keyId: adminKeyId,
    role: 'admin',
    method: 'GET',
    path: '/api/v1/admin/permissions',
    status: 200,
    ms: 1,
    ip: req.ip || '127.0.0.1',
    contentLength: 0,
  });

  res.status(200).json({
    success: true,
    roles: Object.keys(ROLE_CAPABILITY_MATRIX),
    matrix: ROLE_CAPABILITY_MATRIX,
    governancePolicies: {
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      isOfflineIsolated: OFFLINE_ISOLATED,
      maxTokenBudgetPerTurn: 4096,
      maxTurnRetention: 20,
      crossChildTamperingBlocked: true,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/v1/admin/models/availability
 * Configures or toggles availability and operational states of certified foundation models.
 */
export function adminModelAvailabilityHandler(req: Request, res: Response): void {
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';
  const { modelId, operationalState, isAvailable } = req.body || {};

  if (!modelId || typeof modelId !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      code: 'MISSING_MODEL_ID',
      detail: "Field 'modelId' is required.",
    });
    return;
  }

  const registry = ModelRegistry.getInstance();
  const existing = registry.getModel(modelId);

  if (!existing) {
    // If it's the primary native 1m production model, ensure it's registered first
    if (modelId === 'cubio-native-1m-production') {
      const native1mService = Native1MProductionService.getInstance();
      const meta = native1mService.getModelMetadata();
      registry.registerProductionModel('cubio-native-1m-production', {
        parameters: meta.parameters || 971520,
        layerCount: meta.layerCount || 6,
        hiddenDimension: meta.hiddenDimension || 128,
        stateHash: meta.stateHash,
        capability: 'LEVEL 4: Native 1M Sovereign Transformer (6 layers, d=128, 343 spatial cells, 7 epistemic tiers)',
        productionMode: 'NATIVE_1M_PRODUCTION_SEALED',
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        code: 'MODEL_NOT_FOUND',
        detail: `Model '${modelId}' is not found in registry.`,
      });
      return;
    }
  }

  try {
    const targetModel = registry.getModel(modelId)!;
    const targetState = operationalState || (isAvailable === false ? ModelOperationalState.SUSPENDED : ModelOperationalState.READY);

    // Update in registry
    (registry as any).entries.set(modelId, {
      ...targetModel,
      operationalState: targetState,
      metadata: {
        ...(targetModel.metadata || {}),
        adminAvailability: isAvailable !== false,
        updatedBy: adminKeyId,
        updatedAt: new Date().toISOString(),
      },
    });

    const updated = registry.getModel(modelId)!;

    writeAuditEntry({
      ts: new Date().toISOString(),
      keyId: adminKeyId,
      role: 'admin',
      method: 'POST',
      path: '/api/v1/admin/models/availability',
      status: 200,
      ms: 1,
      ip: req.ip || '127.0.0.1',
      contentLength: 0,
    });

    res.status(200).json({
      success: true,
      modelId: updated.modelId,
      operationalState: updated.operationalState,
      isCertified: updated.isCertified,
      evaluationScore: updated.evaluationScore,
      isAvailable: isAvailable !== false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Model Availability Update Failed',
      code: 'MODEL_UPDATE_FAILED',
      detail: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// ADMIN CHILD MODEL REGISTRY POLICY HANDLERS (TASK 452)
// ============================================================================

import { Phase28ChildModelRegistryManager } from '../../integration/phase28ChildModelRegistryManager';

/**
 * GET /api/v1/admin/children/models
 * Retrieves model availability policies for all children or a specific child (?childId=)
 */
export function adminChildModelsHandler(req: Request, res: Response): void {
  const childModelManager = Phase28ChildModelRegistryManager.getInstance();
  const childId = req.query.childId as string | undefined;

  if (childId) {
    const policy = childModelManager.getChildPolicy(childId);
    if (!policy) {
      res.status(404).json({
        error: 'Not Found',
        code: 'CHILD_POLICY_NOT_FOUND',
        detail: `No model policy found for child '${childId}'.`,
      });
      return;
    }
    const publicModels = childModelManager.getModelsForChild(childId);
    res.status(200).json({
      policy,
      models: publicModels,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const allPolicies = childModelManager.getAllPolicies();
  res.status(200).json({
    policies: allPolicies,
    count: allPolicies.length,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/v1/admin/children/models
 * Updates allowed models and default model for a specific Child Agent.
 */
export function adminUpdateChildModelsHandler(req: Request, res: Response): void {
  const adminKeyId = (req as any).keyId || (req as any).apiKey?.keyId || 'admin-root';
  const { childId, allowedModelIds, defaultModelId } = req.body || {};

  if (!childId || !Array.isArray(allowedModelIds) || !defaultModelId) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'INVALID_CHILD_MODEL_PAYLOAD',
      detail: 'childId, allowedModelIds (array), and defaultModelId are required.',
    });
    return;
  }

  try {
    const childModelManager = Phase28ChildModelRegistryManager.getInstance();
    const updatedPolicy = childModelManager.updateChildPolicy(
      childId,
      allowedModelIds,
      defaultModelId,
      adminKeyId
    );

    writeAuditEntry({
      ts: new Date().toISOString(),
      keyId: adminKeyId,
      role: 'admin',
      method: 'POST',
      path: '/api/v1/admin/children/models',
      status: 200,
      ms: 1,
      ip: req.ip || '127.0.0.1',
      contentLength: 0,
    });

    res.status(200).json({
      success: true,
      policy: updatedPolicy,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Child Model Policy Update Failed',
      code: 'CHILD_MODEL_UPDATE_FAILED',
      detail: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

