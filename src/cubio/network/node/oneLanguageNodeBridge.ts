/**
 * CUBiO AI — Phase 3 / Task 04: One Language Node Bridge
 * ========================================================
 *
 * Implements the sandboxed bridge integrating the sovereign CUBiO One Language
 * foundation (OneLexer, GrammarRouter, UnifiedAST, IRLowering, UnifiedVM)
 * with the CubiONodeRuntime without duplicating or modifying language internals.
 */

import { OneLexer } from 'file:///F:/ONE%20language/src/one/oneLexer.ts';
import { GrammarRouter, GrammarKind } from 'file:///F:/ONE%20language/src/one/router/GrammarRouter.ts';
import { SemanticAnalyzer } from 'file:///F:/ONE%20language/src/one/semantics/SemanticAnalyzer.ts';
import { TypeChecker } from 'file:///F:/ONE%20language/src/one/types/TypeChecker.ts';
import { IRLowering } from 'file:///F:/ONE%20language/src/one/ir/IRLowering.ts';
import { UnifiedVM } from 'file:///F:/ONE%20language/src/one/vm/UnifiedVM.ts';
import { ONE_BUILTIN_FUNCTIONS } from 'file:///F:/ONE%20language/src/one/stdlib/OneStdLib.ts';
import { DeclarativeSpatialNodeWrapper } from 'file:///F:/ONE%20language/src/one/ast/UnifiedAST.ts';

import { INodeRuntime } from './nodeRuntimeTypes';
import { createMessage } from '../protocol/v1/messageEngine';
import {
  OneLanguageExecutionOptions,
  OneLanguageExecutionResult,
  OneLanguageNodeAction,
  OneLanguageNodeActionType,
  DeclarativeTopologySummary,
  INodeOneLanguageBridge,
} from './oneLanguageRuntimeTypes';
import {
  parseNodeDeclaration,
  validateNodeDeclaration,
  compileNodeDeclaration,
} from './oneLanguageNodeDeclaration';
import {
  type CubiONodeDeclarationAST,
  type NodeDeclarationValidationResult,
  type NodeDeclarationCompilationResult,
} from './oneLanguageNodeDeclarationTypes';
import { NodeConfigurationManager } from './nodeConfigurationManager';
import {
  type SystemEnvironmentConfig,
  type OneLanguageNodeConfig,
  type NodeConfigurationResolutionResult,
} from './nodeConfigurationTypes';

/** Default timeout if not specified */
const DEFAULT_TIMEOUT_MS = 5_000;

/** Active bridge execution context tracking for re-entrant builtin routing */
let currentActiveBridge: NodeOneLanguageBridge | undefined = undefined;

/**
 * Register Node-level builtins into ONE_BUILTIN_FUNCTIONS once.
 */
let builtinsRegistered = false;

function ensureNodeBuiltinsRegistered(): void {
  if (builtinsRegistered) return;
  builtinsRegistered = true;

  // 1. Node State & Identity Getters
  ONE_BUILTIN_FUNCTIONS['node_get_id'] = (): string => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    currentActiveBridge.recordAction('QUERY_STATE', { field: 'nodeId' }, true);
    return currentActiveBridge.runtime.identity.nodeId;
  };

  ONE_BUILTIN_FUNCTIONS['node_get_state'] = (): string => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    currentActiveBridge.recordAction('QUERY_STATE', { field: 'state' }, true);
    return currentActiveBridge.runtime.state;
  };

  ONE_BUILTIN_FUNCTIONS['node_get_coordinate'] = (): string => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    currentActiveBridge.recordAction('QUERY_STATE', { field: 'coordinateUri' }, true);
    return currentActiveBridge.runtime.identity.coordinateUri;
  };

  ONE_BUILTIN_FUNCTIONS['node_get_role'] = (): string => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    currentActiveBridge.recordAction('QUERY_STATE', { field: 'role' }, true);
    return currentActiveBridge.runtime.identity.role;
  };

  // 2. Telemetry & Health Getters
  ONE_BUILTIN_FUNCTIONS['node_get_uptime'] = (): number => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    currentActiveBridge.recordAction('QUERY_TELEMETRY', { field: 'uptimeMs' }, true);
    return currentActiveBridge.runtime.telemetry.uptimeMs;
  };

  ONE_BUILTIN_FUNCTIONS['node_get_health'] = (): number => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    const nodeRec = currentActiveBridge.runtime.stateModel.getNode(currentActiveBridge.runtime.identity.nodeId);
    const score = nodeRec?.healthScore ?? 100;
    currentActiveBridge.recordAction('QUERY_TELEMETRY', { field: 'healthScore', value: score }, true);
    return score;
  };

  ONE_BUILTIN_FUNCTIONS['node_get_health_status'] = (): string => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    const status = currentActiveBridge.runtime.telemetry.healthStatus;
    currentActiveBridge.recordAction('QUERY_TELEMETRY', { field: 'healthStatus', value: status }, true);
    return status;
  };

  ONE_BUILTIN_FUNCTIONS['node_get_metric'] = (metricName: string): any => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    const tele = currentActiveBridge.runtime.telemetry as Record<string, any>;
    const val = tele[metricName];
    currentActiveBridge.recordAction('QUERY_TELEMETRY', { field: metricName, value: val }, true);
    return val !== undefined ? val : null;
  };

  // 3. Network Outbound Action: Send Message
  ONE_BUILTIN_FUNCTIONS['node_send_message'] = (
    targetCoordinate: string,
    messageType: string,
    payloadRaw: any
  ): boolean => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    return currentActiveBridge.handleNodeSendMessage(targetCoordinate, messageType, payloadRaw);
  };

  // 4. Service Registration Action
  ONE_BUILTIN_FUNCTIONS['node_register_service'] = (
    serviceId: string,
    serviceType: string,
    coordinateUri?: string
  ): boolean => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    return currentActiveBridge.handleNodeRegisterService(serviceId, serviceType, coordinateUri);
  };

  // 5. Service Query Action
  ONE_BUILTIN_FUNCTIONS['node_query_service'] = (serviceId: string): boolean => {
    if (!currentActiveBridge) throw new Error('[SECURITY] No active node runtime context');
    const services = currentActiveBridge.runtime.getServices();
    return services.some((s) => s.serviceId === serviceId);
  };
}

/**
 * Sandboxed One Language Node Bridge.
 */
export class NodeOneLanguageBridge implements INodeOneLanguageBridge {
  public readonly runtime: INodeRuntime;
  private _isActuationLocked: boolean = false;
  private _actionHistory: OneLanguageNodeAction[] = [];
  private _activeOptions?: OneLanguageExecutionOptions;

  constructor(runtime: INodeRuntime) {
    this.runtime = runtime;
    ensureNodeBuiltinsRegistered();
  }

  public get isActuationLocked(): boolean {
    return this._isActuationLocked;
  }

  public get actionHistory(): readonly OneLanguageNodeAction[] {
    return Object.freeze([...this._actionHistory]);
  }

  /**
   * Internal recorder for discrete node actions executed by scripts.
   */
  public recordAction(
    type: OneLanguageNodeActionType,
    details: Record<string, unknown>,
    success: boolean,
    error?: string
  ): void {
    const action: OneLanguageNodeAction = {
      type,
      timestamp: Date.now(),
      details: Object.freeze({ ...details }),
      success,
      error,
    };
    this._actionHistory.push(action);
  }

  /**
   * Handles outbound message dispatch invoked from One Language script.
   */
  public handleNodeSendMessage(
    targetCoordinate: string,
    messageType: string,
    payloadRaw: any
  ): boolean {
    if (this._isActuationLocked || this._activeOptions?.actuationLock) {
      const err = 'Actuation lockout enforced: Network send operation rejected';
      this.recordAction('SEND_MESSAGE', { targetCoordinate, messageType }, false, err);
      throw new Error(`[ERR_ACTUATION_LOCKED] ${err}`);
    }

    if (this._activeOptions?.sandboxAllowNetworkSend === false) {
      const err = 'Sandbox violation: Network transmission disallowed by options';
      this.recordAction('SEND_MESSAGE', { targetCoordinate, messageType }, false, err);
      throw new Error(`[ERR_SANDBOX_VIOLATION] ${err}`);
    }

    if (this.runtime.state !== 'RUNNING') {
      const err = `Node runtime not in RUNNING state (current: ${this.runtime.state})`;
      this.recordAction('SEND_MESSAGE', { targetCoordinate, messageType }, false, err);
      throw new Error(`[ERR_NODE_NOT_RUNNING] ${err}`);
    }

    let payload: Record<string, unknown> = {};
    if (typeof payloadRaw === 'string') {
      try {
        payload = JSON.parse(payloadRaw);
      } catch {
        payload = { text: payloadRaw };
      }
    } else if (payloadRaw && typeof payloadRaw === 'object') {
      payload = payloadRaw;
    }

    try {
      const msg = createMessage({
        type: (messageType as any) || 'DIRECT',
        communicationMode: 'USER_USER',
        source: {
          cubId: this.runtime.identity.ownerCubId,
          coordinateUri: this.runtime.identity.coordinateUri,
          entityType: 'HUMAN_OPERATOR',
        },
        destination: {
          coordinateUri: targetCoordinate,
        },
        body: payload,
      });

      // Synchronously initiate send through node runtime
      this.runtime.sendMessage(msg).catch(() => {
        // Asynchronous transmission errors are tracked by runtime telemetry
      });

      this.recordAction(
        'SEND_MESSAGE',
        { targetCoordinate, messageType, payloadLength: JSON.stringify(payload).length },
        true
      );
      return true;
    } catch (sendErr: any) {
      this.recordAction('SEND_MESSAGE', { targetCoordinate, messageType }, false, sendErr.message);
      throw sendErr;
    }
  }

  /**
   * Handles service registration invoked from One Language script.
   */
  public handleNodeRegisterService(
    serviceId: string,
    serviceType: string,
    coordinateUri?: string
  ): boolean {
    if (this._isActuationLocked || this._activeOptions?.actuationLock) {
      const err = 'Actuation lockout enforced: Service registration rejected';
      this.recordAction('REGISTER_SERVICE', { serviceId, serviceType }, false, err);
      throw new Error(`[ERR_ACTUATION_LOCKED] ${err}`);
    }

    if (this._activeOptions?.sandboxAllowServiceRegistration === false) {
      const err = 'Sandbox violation: Service registration disallowed by options';
      this.recordAction('REGISTER_SERVICE', { serviceId, serviceType }, false, err);
      throw new Error(`[ERR_SANDBOX_VIOLATION] ${err}`);
    }

    const coord = coordinateUri || `${this.runtime.identity.coordinateUri}/${serviceType}`;

    try {
      this.runtime.registerService({
        serviceId,
        serviceType,
        coordinateUri: coord,
        handleMessage: () => {},
      });

      this.recordAction('REGISTER_SERVICE', { serviceId, serviceType, coordinateUri: coord }, true);
      return true;
    } catch (regErr: any) {
      this.recordAction('REGISTER_SERVICE', { serviceId, serviceType }, false, regErr.message);
      throw regErr;
    }
  }

  /**
   * Executes One Language source code in a sandboxed, fail-closed environment.
   */
  public async execute(
    source: string,
    options: OneLanguageExecutionOptions = {}
  ): Promise<OneLanguageExecutionResult> {
    const totalStart = performance.now();
    const actionsBefore = this._actionHistory.length;
    this._activeOptions = options;

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    // Timeout race wrapper
    const executionPromise = this._executeInternal(source, options, totalStart);

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[TIMEOUT] Execution exceeded timeout of ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
      this._activeOptions = undefined;
    }
  }

  private async _executeInternal(
    source: string,
    options: OneLanguageExecutionOptions,
    totalStart: number
  ): Promise<OneLanguageExecutionResult> {
    let lexTimeMs = 0;
    let parseTimeMs = 0;
    let executionTimeMs = 0;
    let instructionsExecuted = 0;
    const actionsBefore = this._actionHistory.length;

    // ── STAGE 1: Lexical Tokenization ──────────────────────────────────────────
    let tokens: any[];
    try {
      const lexStart = performance.now();
      const lexer = new OneLexer(source);
      tokens = lexer.tokenize();
      lexTimeMs = performance.now() - lexStart;
    } catch (lexErr: any) {
      return this.failClosedResult(
        GrammarKind.AMBIGUOUS,
        {
          code: 'ERR_LEXICAL',
          message: lexErr.message ?? 'Lexical tokenization failure',
          stage: 'LEXICAL',
        },
        lexTimeMs,
        0,
        0,
        totalStart,
        actionsBefore
      );
    }

    // ── STAGE 2: Grammar Routing & Parsing ────────────────────────────────────
    let ast: any;
    let decision: any;
    try {
      const parseStart = performance.now();
      const parsed = GrammarRouter.parse(tokens);
      ast = parsed.ast;
      decision = parsed.decision;
      parseTimeMs = performance.now() - parseStart;
    } catch (parseErr: any) {
      return this.failClosedResult(
        GrammarKind.AMBIGUOUS,
        {
          code: 'ERR_SYNTACTIC',
          message: parseErr.message ?? 'Syntactic parsing failure',
          stage: 'SYNTACTIC',
        },
        lexTimeMs,
        parseTimeMs,
        0,
        totalStart,
        actionsBefore
      );
    }

    // ── STAGE 3A: Declarative Program Evaluation ──────────────────────────────
    if (decision.grammar === GrammarKind.DECLARATIVE) {
      const execStart = performance.now();
      try {
        const meta = ast.declarativeMeta;

        // Apply actuation lock directive if present
        if (meta?.actuationLock === true || options.actuationLock === true) {
          this._isActuationLocked = true;
        }

        const spatialNodeIds: string[] = [];
        const funnelIds: string[] = [];

        for (const stmt of ast.body) {
          if (stmt.kind === 'DeclarativeSpatialNode') {
            const decl = stmt as DeclarativeSpatialNodeWrapper;
            if (decl.nodeType === 'Node') {
              const id = (decl.payload?.id as string) || (decl.payload?.name as string) || 'unknown';
              spatialNodeIds.push(id);
            } else if (decl.nodeType === 'Funnel') {
              const id = (decl.payload?.id as string) || (decl.payload?.name as string) || 'unknown';
              funnelIds.push(id);
            }
          }
        }

        const declarativeSummary: DeclarativeTopologySummary = {
          rssMaxLimitMB: meta?.rssMaxLimitMB,
          assertRssLimitMB: meta?.assertRssLimitMB,
          actuationLock: this._isActuationLocked,
          spatialNodesCount: spatialNodeIds.length,
          funnelsCount: funnelIds.length,
          nodeIdentifiers: Object.freeze(spatialNodeIds),
          funnelIdentifiers: Object.freeze(funnelIds),
        };

        this.recordAction(
          'APPLY_DECLARATIVE_TOPOLOGY',
          {
            rssMaxLimitMB: meta?.rssMaxLimitMB,
            spatialCount: spatialNodeIds.length,
            funnelCount: funnelIds.length,
            actuationLocked: this._isActuationLocked,
          },
          true
        );

        executionTimeMs = performance.now() - execStart;
        const totalTimeMs = performance.now() - totalStart;

        return Object.freeze({
          success: true,
          grammarKind: GrammarKind.DECLARATIVE,
          output: Object.freeze([
            `[DECLARATIVE_APPLIED] SpatialNodes=${spatialNodeIds.length}, Funnels=${funnelIds.length}, RSS_MAX=${meta?.rssMaxLimitMB ?? 'UNBOUNDED'}, ActuationLocked=${this._isActuationLocked}`,
          ]),
          globals: Object.freeze({}),
          nodeActions: Object.freeze(this._actionHistory.slice(actionsBefore)),
          ast,
          declarativeSummary: Object.freeze(declarativeSummary),
          metrics: Object.freeze({
            lexTimeMs,
            parseTimeMs,
            executionTimeMs,
            totalTimeMs,
            instructionsExecuted: 0,
          }),
        });
      } catch (decErr: any) {
        return this.failClosedResult(
          GrammarKind.DECLARATIVE,
          {
            code: 'ERR_DECLARATIVE_EVAL',
            message: decErr.message ?? 'Declarative topology evaluation failure',
            stage: 'VM',
          },
          lexTimeMs,
          parseTimeMs,
          performance.now() - execStart,
          totalStart,
          actionsBefore,
          ast
        );
      }
    }

    // ── STAGE 3B: Computational Program Evaluation ────────────────────────────
    // Semantic Analysis
    try {
      const semanticAnalyzer = new SemanticAnalyzer();
      const semResult = semanticAnalyzer.analyze(ast);
      if (semResult.diagnostics.length > 0) {
        return this.failClosedResult(
          GrammarKind.COMPUTATIONAL,
          {
            code: 'ERR_SEMANTIC',
            message: semResult.diagnostics.map((d: any) => d.message).join('; '),
            stage: 'SEMANTIC',
          },
          lexTimeMs,
          parseTimeMs,
          0,
          totalStart,
          actionsBefore,
          ast
        );
      }
    } catch (semErr: any) {
      return this.failClosedResult(
        GrammarKind.COMPUTATIONAL,
        {
          code: 'ERR_SEMANTIC',
          message: semErr.message ?? 'Semantic analysis exception',
          stage: 'SEMANTIC',
        },
        lexTimeMs,
        parseTimeMs,
        0,
        totalStart,
        actionsBefore,
        ast
      );
    }

    // Type Checking
    try {
      const typeChecker = new TypeChecker();
      const typeResult = typeChecker.check(ast);
      if (typeResult.diagnostics.length > 0) {
        return this.failClosedResult(
          GrammarKind.COMPUTATIONAL,
          {
            code: 'ERR_TYPE',
            message: typeResult.diagnostics.map((d: any) => d.message).join('; '),
            stage: 'TYPE',
          },
          lexTimeMs,
          parseTimeMs,
          0,
          totalStart,
          actionsBefore,
          ast
        );
      }
    } catch (typeErr: any) {
      return this.failClosedResult(
        GrammarKind.COMPUTATIONAL,
        {
          code: 'ERR_TYPE',
          message: typeErr.message ?? 'Type checking exception',
          stage: 'TYPE',
        },
        lexTimeMs,
        parseTimeMs,
        0,
        totalStart,
        actionsBefore,
        ast
      );
    }

    // IR Lowering
    let ir: any;
    try {
      const irLowering = new IRLowering();
      ir = irLowering.lower(ast);
    } catch (irErr: any) {
      return this.failClosedResult(
        GrammarKind.COMPUTATIONAL,
        {
          code: 'ERR_IR_LOWERING',
          message: irErr.message ?? 'IR Lowering exception',
          stage: 'IR',
        },
        lexTimeMs,
        parseTimeMs,
        0,
        totalStart,
        actionsBefore,
        ast
      );
    }

    // VM Execution in sandboxed environment
    const prevBridge = currentActiveBridge;
    currentActiveBridge = this;

    const execStart = performance.now();
    try {
      const vm = new UnifiedVM();
      const vmResult = vm.execute(ir);
      executionTimeMs = performance.now() - execStart;
      instructionsExecuted = vmResult.instructionsExecuted;

      if (!vmResult.success) {
        return this.failClosedResult(
          GrammarKind.COMPUTATIONAL,
          {
            code: vmResult.error?.code ?? 'ERR_VM_EXECUTION',
            message: vmResult.error?.message ?? 'Virtual machine execution aborted',
            stage: 'VM',
            pc: vmResult.error?.pc,
          },
          lexTimeMs,
          parseTimeMs,
          executionTimeMs,
          totalStart,
          actionsBefore,
          ast,
          vmResult.output
        );
      }

      const totalTimeMs = performance.now() - totalStart;
      return Object.freeze({
        success: true,
        grammarKind: GrammarKind.COMPUTATIONAL,
        output: Object.freeze([...vmResult.output]),
        globals: Object.freeze({ ...vmResult.globals }),
        nodeActions: Object.freeze(this._actionHistory.slice(actionsBefore)),
        ast,
        metrics: Object.freeze({
          lexTimeMs,
          parseTimeMs,
          executionTimeMs,
          totalTimeMs,
          instructionsExecuted,
        }),
      });
    } catch (vmErr: any) {
      executionTimeMs = performance.now() - execStart;
      return this.failClosedResult(
        GrammarKind.COMPUTATIONAL,
        {
          code: 'ERR_VM_UNCAUGHT',
          message: vmErr.message ?? 'Uncaught VM execution error',
          stage: 'VM',
        },
        lexTimeMs,
        parseTimeMs,
        executionTimeMs,
        totalStart,
        actionsBefore,
        ast
      );
    } finally {
      currentActiveBridge = prevBridge;
    }
  }

  private failClosedResult(
    grammarKind: GrammarKind,
    error: {
      code: string;
      message: string;
      stage: 'LEXICAL' | 'SYNTACTIC' | 'SEMANTIC' | 'TYPE' | 'IR' | 'VM' | 'SECURITY';
      pc?: number;
    },
    lexTimeMs: number,
    parseTimeMs: number,
    executionTimeMs: number,
    totalStart: number,
    actionsBefore: number,
    ast?: any,
    output: string[] = []
  ): OneLanguageExecutionResult {
    const totalTimeMs = performance.now() - totalStart;
    return Object.freeze({
      success: false,
      grammarKind,
      output: Object.freeze([...output]),
      globals: Object.freeze({}),
      nodeActions: Object.freeze(this._actionHistory.slice(actionsBefore)),
      ast,
      error: Object.freeze(error),
      metrics: Object.freeze({
        lexTimeMs,
        parseTimeMs,
        executionTimeMs,
        totalTimeMs,
        instructionsExecuted: 0,
      }),
    });
  }

  /**
   * Parses a One Language node declaration into an AST.
   */
  public parseNodeDeclaration(source: string): CubiONodeDeclarationAST {
    return parseNodeDeclaration(source);
  }

  /**
   * Pre-flight validates a parsed node declaration AST.
   */
  public validateNodeDeclaration(ast: CubiONodeDeclarationAST): NodeDeclarationValidationResult {
    return validateNodeDeclaration(ast);
  }

  /**
   * Compiles a One Language node declaration into runtime configuration.
   */
  public compileNodeDeclaration(source: string): NodeDeclarationCompilationResult {
    return compileNodeDeclaration(source);
  }

  /**
   * Resolves multi-tier node configuration with system precedence,
   * ceiling enforcement, and conflict detection.
   */
  public resolveNodeConfiguration(input: {
    systemConfig?: SystemEnvironmentConfig;
    scriptConfig?: OneLanguageNodeConfig | string;
  }): NodeConfigurationResolutionResult {
    const manager = new NodeConfigurationManager();
    return manager.resolve(input);
  }
}
