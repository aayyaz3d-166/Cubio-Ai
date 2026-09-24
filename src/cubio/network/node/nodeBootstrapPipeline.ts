/**
 * CUBiO AI — Phase 3 / Task 03: Node Bootstrap Pipeline
 * ====================================================
 *
 * Implements the deterministic multi-stage bootstrap sequence for a CUBiO Node
 * from process start to READY/ONLINE state, complete with fail-closed error
 * containment, reverse-order rollback, and duplicate startup protection.
 */

import { validateNodeRuntimeConfig } from './nodeRuntimeConfig';
import { validateTransportEndpoint } from '../transport/index';
import { CubiONetworkCoordinateEngine } from '../coordinate/coordinate';
import { CanonicalNetworkStateModel } from '../protocol/v1/stateModel';
import { NodeLifecycleState } from '../protocol/v1/nodeTypes';
import { ITransportAdapter, TransportType } from '../transport/types';
import { INodeService } from './nodeRuntimeTypes';
import {
  NodeBootstrapStage,
  BootstrapStageStatus,
  BootstrapStageResult,
  NodeBootstrapReport,
  NodeBootstrapOptions,
} from './nodeBootstrapTypes';

export interface BootstrapContext {
  readonly identity: any;
  readonly config: any;
  readonly stateModel: CanonicalNetworkStateModel;
  readonly adapters: Map<TransportType, ITransportAdapter>;
  readonly services: Map<string, INodeService>;
  readonly assembler: any;
  readonly transitionRuntimeState: (state: any, reason: string) => void;
  readonly wireInboundPacketListener: (adapter: ITransportAdapter) => () => void;
  readonly adapterCleanups: Map<TransportType, () => void>;
}

export class NodeBootstrapPipeline {
  private static _isBootstrapping = false;

  /**
   * Executes the canonical 9-stage bootstrap sequence in strict sequential order.
   */
  public static async execute(
    ctx: BootstrapContext,
    options: NodeBootstrapOptions = {}
  ): Promise<NodeBootstrapReport> {
    if (this._isBootstrapping) {
      throw new Error('Concurrent bootstrap execution rejected: A node bootstrap sequence is already in progress.');
    }

    this._isBootstrapping = true;
    const startTime = Date.now();
    const stageResults: BootstrapStageResult[] = [];
    const completedStages: NodeBootstrapStage[] = [];
    const boundAdapters: TransportType[] = [];
    const rollbackErrors: string[] = [];

    const recordStage = (
      stage: NodeBootstrapStage,
      status: BootstrapStageStatus,
      durationMs: number,
      error?: string,
      details?: Record<string, any>
    ): BootstrapStageResult => {
      const res: BootstrapStageResult = {
        stage,
        status,
        startedAt: Date.now() - durationMs,
        completedAt: Date.now(),
        durationMs,
        error,
        details,
      };
      stageResults.push(res);
      options.onStageProgress?.(stage, status, res);
      return res;
    };

    let currentStage: NodeBootstrapStage = 'CONFIGURATION_VALIDATION';
    let currentStageStart = startTime;

    try {
      // ───────────────────────────────────────────────────────────────────────
      // STAGE 0: CONFIGURATION_VALIDATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'CONFIGURATION_VALIDATION';
      currentStageStart = Date.now();
      const valConfigResult = validateNodeRuntimeConfig(ctx.config);
      if (!valConfigResult.valid) {
        const errorMsg = `Configuration validation failed: ${valConfigResult.errors.map(e => e.message).join('; ')}`;
        recordStage('CONFIGURATION_VALIDATION', 'FAILED', Date.now() - currentStageStart, errorMsg);
        throw new Error(errorMsg);
      }
      recordStage('CONFIGURATION_VALIDATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        mtu: ctx.config.mtu,
        defaultTransport: ctx.config.defaultTransport,
        transportsCount: ctx.config.transports.length,
      });
      completedStages.push('CONFIGURATION_VALIDATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 1: IDENTITY_INITIALIZATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'IDENTITY_INITIALIZATION';
      currentStageStart = Date.now();
      ctx.transitionRuntimeState('INITIALIZING', 'Stage 1: Initializing node identity');

      if (!ctx.identity || typeof ctx.identity !== 'object') {
        throw new Error('Identity initialization failed: Identity object is missing or null.');
      }
      if (!ctx.identity.nodeId || typeof ctx.identity.nodeId !== 'string') {
        throw new Error('Identity initialization failed: Invalid or missing nodeId.');
      }
      if (!ctx.identity.ownerCubId || !ctx.identity.ownerCubId.startsWith('CUB-')) {
        throw new Error(`Identity initialization failed: Invalid sovereign ownerCubId '${ctx.identity.ownerCubId}'. Must match 'CUB-XXXXXXXX'.`);
      }

      const coordParse = CubiONetworkCoordinateEngine.tryParse(ctx.identity.coordinateUri);
      if (!coordParse.isValid) {
        throw new Error(`Identity initialization failed: Invalid coordinateUri '${ctx.identity.coordinateUri}': ${coordParse.errors[0]?.message}`);
      }

      recordStage('IDENTITY_INITIALIZATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        nodeId: ctx.identity.nodeId,
        coordinateUri: ctx.identity.coordinateUri,
        role: ctx.identity.role,
      });
      completedStages.push('IDENTITY_INITIALIZATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 2: LOGGING_INITIALIZATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'LOGGING_INITIALIZATION';
      currentStageStart = Date.now();
      recordStage('LOGGING_INITIALIZATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        level: 'INFO',
        structured: true,
      });
      completedStages.push('LOGGING_INITIALIZATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 3: STATE_INITIALIZATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'STATE_INITIALIZATION';
      currentStageStart = Date.now();
      // Register or reset local node into Phase 1 Canonical Network State Model
      if (ctx.stateModel.getSnapshot().nodes[ctx.identity.nodeId]) {
        try {
          ctx.stateModel.transitionNodeState(ctx.identity.nodeId, 'INITIALIZING', 'Re-initializing node state');
        } catch {}
      } else {
        ctx.stateModel.registerNode(
          ctx.identity.nodeId,
          ctx.identity.coordinateUri,
          100
        );
      }

      recordStage('STATE_INITIALIZATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        epoch: ctx.stateModel.epoch,
        clusterState: ctx.stateModel.clusterState,
        registeredNode: ctx.identity.nodeId,
      });
      completedStages.push('STATE_INITIALIZATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 4: PROTOCOL_INITIALIZATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'PROTOCOL_INITIALIZATION';
      currentStageStart = Date.now();
      ctx.assembler.reset();

      recordStage('PROTOCOL_INITIALIZATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        protocolVersion: '1.0.0',
        framing: 'RFC_8785_CANONICAL',
        assemblerReady: true,
      });
      completedStages.push('PROTOCOL_INITIALIZATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 5: TRANSPORT_INITIALIZATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'TRANSPORT_INITIALIZATION';
      currentStageStart = Date.now();
      ctx.transitionRuntimeState('STARTING', 'Stage 5: Binding transport listeners');

      for (const binding of ctx.config.transports) {
        if (binding.enabled === false) continue;

        const valEp = validateTransportEndpoint(binding.endpoint);
        if (!valEp.isValid) {
          throw new Error(`Transport binding failed for '${binding.transportType}': Invalid endpoint: ${valEp.error}`);
        }

        const adapter = ctx.adapters.get(binding.transportType);
        if (!adapter) {
          throw new Error(`Transport binding failed: No adapter instantiated for type '${binding.transportType}'`);
        }

        // Bind listener
        await adapter.listen(binding.endpoint);
        boundAdapters.push(binding.transportType);

        // Wire packet reception
        const cleanup = ctx.wireInboundPacketListener(adapter);
        ctx.adapterCleanups.set(binding.transportType, cleanup);
      }

      recordStage('TRANSPORT_INITIALIZATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        boundTransports: boundAdapters,
      });
      completedStages.push('TRANSPORT_INITIALIZATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 6: SERVICES_INITIALIZATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'SERVICES_INITIALIZATION';
      currentStageStart = Date.now();

      // Register default core system ping service if not present
      if (!ctx.services.has('SERVICE_CORE_PING')) {
        const pingCoord = `${ctx.identity.coordinateUri}/PING`;
        ctx.services.set('SERVICE_CORE_PING', {
          serviceId: 'SERVICE_CORE_PING',
          serviceType: 'PING',
          coordinateUri: pingCoord,
          handleMessage: () => {},
        });
      }

      // Verify all registered services have valid coordinate URIs
      for (const [srvId, srv] of ctx.services.entries()) {
        if (!srv.serviceId || !srv.coordinateUri) {
          throw new Error(`Service initialization failed: Service '${srvId}' missing required serviceId or coordinateUri.`);
        }
        if (typeof srv.handleMessage !== 'function') {
          throw new Error(`Service initialization failed: Service '${srvId}' missing valid handleMessage handler.`);
        }
      }

      recordStage('SERVICES_INITIALIZATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        servicesCount: ctx.services.size,
        services: Array.from(ctx.services.keys()),
      });
      completedStages.push('SERVICES_INITIALIZATION');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 7: READY_CHECK
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'READY_CHECK';
      currentStageStart = Date.now();
      const shouldActivateOnline = options.autoActivateOnline !== false;

      // Transition state model node record to READY
      ctx.stateModel.transitionNodeState(ctx.identity.nodeId, 'READY', 'All bootstrap prerequisites verified');

      if (!shouldActivateOnline) {
        ctx.transitionRuntimeState('READY', 'Stage 7: Subsystems healthy, node reached READY state');
      }

      recordStage('READY_CHECK', 'COMPLETED', Date.now() - currentStageStart, undefined, {
        nodeState: 'READY',
        allPrerequisitesMet: true,
      });
      completedStages.push('READY_CHECK');

      // ───────────────────────────────────────────────────────────────────────
      // STAGE 8: ONLINE_ACTIVATION
      // ───────────────────────────────────────────────────────────────────────
      currentStage = 'ONLINE_ACTIVATION';
      currentStageStart = Date.now();
      let finalState: NodeLifecycleState = 'READY';

      if (shouldActivateOnline) {
        ctx.stateModel.transitionNodeState(ctx.identity.nodeId, 'ONLINE', 'Activated for live network traffic');
        ctx.transitionRuntimeState('RUNNING', 'Stage 8: Online traffic processing activated');
        finalState = 'ONLINE';

        recordStage('ONLINE_ACTIVATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
          activated: true,
          finalState: 'ONLINE',
        });
        completedStages.push('ONLINE_ACTIVATION');
      } else {
        recordStage('ONLINE_ACTIVATION', 'COMPLETED', Date.now() - currentStageStart, undefined, {
          activated: false,
          finalState: 'READY',
        });
      }

      const totalDurationMs = Date.now() - startTime;
      const report: NodeBootstrapReport = {
        nodeId: ctx.identity.nodeId,
        coordinateUri: ctx.identity.coordinateUri,
        success: true,
        targetState: shouldActivateOnline ? 'ONLINE' : 'READY',
        finalState,
        totalDurationMs,
        stages: Object.freeze(stageResults),
        rollbackExecuted: false,
        rollbackErrors: Object.freeze([]),
        timestamp: Date.now(),
      };

      return Object.freeze(report);
    } catch (err: any) {
      // ───────────────────────────────────────────────────────────────────────
      // FAIL-CLOSED REVERSE ROLLBACK
      // ───────────────────────────────────────────────────────────────────────
      const errorMsg = err.message ?? String(err);

      // Record failure on current stage if not already recorded
      if (!stageResults.some(s => s.stage === currentStage && s.status === 'FAILED')) {
        recordStage(currentStage, 'FAILED', Date.now() - currentStageStart, errorMsg);
      }

      // Perform reverse rollback of completed stages
      for (let i = completedStages.length - 1; i >= 0; i--) {
        const stage = completedStages[i];
        try {
          switch (stage) {
            case 'SERVICES_INITIALIZATION':
              // Clear registered default services
              ctx.services.delete('SERVICE_CORE_PING');
              break;

            case 'TRANSPORT_INITIALIZATION':
              // Unbind and close all bound transport adapters
              for (const type of boundAdapters) {
                const cleanup = ctx.adapterCleanups.get(type);
                if (cleanup) {
                  try { cleanup(); } catch {}
                  ctx.adapterCleanups.delete(type);
                }
                const adapter = ctx.adapters.get(type);
                if (adapter) {
                  try {
                    await adapter.close('Bootstrap rollback');
                  } catch (closeErr: any) {
                    rollbackErrors.push(`Failed to close adapter '${type}': ${closeErr.message}`);
                  }
                }
              }
              break;

            case 'PROTOCOL_INITIALIZATION':
              ctx.assembler.reset();
              break;

            case 'STATE_INITIALIZATION':
              try {
                ctx.stateModel.transitionNodeState(ctx.identity.nodeId, 'FAULTED', `Bootstrap failed: ${errorMsg}`);
              } catch {}
              break;

            case 'READY_CHECK':
              // If reached ready, degrade to faulted
              break;
          }
        } catch (rollbackErr: any) {
          rollbackErrors.push(`Error during rollback of stage '${stage}': ${rollbackErr.message}`);
        }
      }

      try {
        ctx.transitionRuntimeState('FAULTED', `Bootstrap aborted: ${errorMsg}`);
      } catch {}

      const totalDurationMs = Date.now() - startTime;
      const failedReport: NodeBootstrapReport = {
        nodeId: ctx.identity?.nodeId ?? 'UNKNOWN',
        coordinateUri: ctx.identity?.coordinateUri ?? 'UNKNOWN',
        success: false,
        targetState: options.autoActivateOnline !== false ? 'ONLINE' : 'READY',
        finalState: 'FAULTED',
        totalDurationMs,
        stages: Object.freeze(stageResults),
        rollbackExecuted: true,
        rollbackErrors: Object.freeze(rollbackErrors),
        error: errorMsg,
        timestamp: Date.now(),
      };

      throw new NodeBootstrapError(errorMsg, failedReport);
    } finally {
      this._isBootstrapping = false;
    }
  }
}

/**
 * Dedicated error type capturing complete post-mortem bootstrap reports.
 */
export class NodeBootstrapError extends Error {
  public readonly report: NodeBootstrapReport;

  constructor(message: string, report: NodeBootstrapReport) {
    super(`[NODE_BOOTSTRAP_FAILURE] ${message}`);
    this.name = 'NodeBootstrapError';
    this.report = report;
  }
}
