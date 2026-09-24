/**
 * CUBiO AI — Phase 3 / Task 04: One Language Runtime Types
 * =========================================================
 *
 * Defines the contract, sandbox boundaries, execution options, and result models
 * for integrating the CUBiO One Language compiler/VM with CubiONodeRuntime.
 */

import { GrammarKind } from 'file:///F:/ONE%20language/src/one/router/GrammarRouter.ts';
import { UnifiedProgramNode } from 'file:///F:/ONE%20language/src/one/ast/UnifiedAST.ts';

/**
 * Sandboxed execution options for One Language execution on a CUBiO Node.
 */
export interface OneLanguageExecutionOptions {
  /** Maximum wall-clock execution time in milliseconds (default: 5000ms) */
  readonly timeoutMs?: number;
  /** Maximum VM instruction count before aborting (default: 100,000; DoS guard) */
  readonly maxInstructions?: number;
  /** Force actuation lockout, disallowing physical state mutation or network dispatch */
  readonly actuationLock?: boolean;
  /** Allow One Language program to dispatch network messages via node.sendMessage (default: true) */
  readonly sandboxAllowNetworkSend?: boolean;
  /** Allow One Language program to register services via node.registerService (default: true) */
  readonly sandboxAllowServiceRegistration?: boolean;
}

/**
 * Categories of node-level operations triggered by a One Language script.
 */
export type OneLanguageNodeActionType =
  | 'QUERY_STATE'
  | 'QUERY_TELEMETRY'
  | 'SEND_MESSAGE'
  | 'REGISTER_SERVICE'
  | 'APPLY_DECLARATIVE_TOPOLOGY';

/**
 * Audit record of a discrete action performed on the node runtime by a One Language program.
 */
export interface OneLanguageNodeAction {
  readonly type: OneLanguageNodeActionType;
  readonly timestamp: number;
  readonly details: Readonly<Record<string, unknown>>;
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Summary of declarative topology parsed from declarative One Language AST.
 */
export interface DeclarativeTopologySummary {
  readonly rssMaxLimitMB?: number;
  readonly assertRssLimitMB?: number;
  readonly actuationLock?: boolean;
  readonly spatialNodesCount: number;
  readonly funnelsCount: number;
  readonly nodeIdentifiers: readonly string[];
  readonly funnelIdentifiers: readonly string[];
}

/**
 * Structured error details when One Language execution fails closed.
 */
export interface OneLanguageExecutionError {
  readonly code: string;
  readonly message: string;
  readonly stage: 'LEXICAL' | 'SYNTACTIC' | 'SEMANTIC' | 'TYPE' | 'IR' | 'VM' | 'SECURITY';
  readonly pc?: number;
}

/**
 * Telemetry and timing metrics for a One Language execution.
 */
export interface OneLanguageExecutionMetrics {
  readonly lexTimeMs: number;
  readonly parseTimeMs: number;
  readonly executionTimeMs: number;
  readonly totalTimeMs: number;
  readonly instructionsExecuted: number;
}

/**
 * Authoritative result of a One Language script execution against a CUBiO Node Runtime.
 */
export interface OneLanguageExecutionResult {
  readonly success: boolean;
  readonly grammarKind: GrammarKind;
  readonly output: readonly string[];
  readonly globals: Readonly<Record<string, unknown>>;
  readonly nodeActions: readonly OneLanguageNodeAction[];
  readonly ast?: UnifiedProgramNode;
  readonly declarativeSummary?: DeclarativeTopologySummary;
  readonly error?: OneLanguageExecutionError;
  readonly metrics: OneLanguageExecutionMetrics;
}

/**
 * Interface for the Sandboxed One Language Node Bridge.
 */
export interface INodeOneLanguageBridge {
  /** Execute One Language source against the bound node runtime */
  execute(source: string, options?: OneLanguageExecutionOptions): Promise<OneLanguageExecutionResult>;
  /** Check if the bridge is currently under permanent actuation lock */
  readonly isActuationLocked: boolean;
  /** Complete audit history of node actions performed by One Language scripts */
  readonly actionHistory: readonly OneLanguageNodeAction[];

  /** Parse a canonical One Language node declaration */
  parseNodeDeclaration(source: string): import('./oneLanguageNodeDeclarationTypes').CubiONodeDeclarationAST;
  /** Validate a parsed node declaration AST */
  validateNodeDeclaration(ast: import('./oneLanguageNodeDeclarationTypes').CubiONodeDeclarationAST): import('./oneLanguageNodeDeclarationTypes').NodeDeclarationValidationResult;
  /** Compile a One Language node declaration into runtime configuration */
  compileNodeDeclaration(source: string): import('./oneLanguageNodeDeclarationTypes').NodeDeclarationCompilationResult;
  /** Resolve multi-tier node configuration with system precedence and conflict detection */
  resolveNodeConfiguration(input: {
    systemConfig?: import('./nodeConfigurationTypes').SystemEnvironmentConfig;
    scriptConfig?: import('./nodeConfigurationTypes').OneLanguageNodeConfig | string;
  }): import('./nodeConfigurationTypes').NodeConfigurationResolutionResult;
}
