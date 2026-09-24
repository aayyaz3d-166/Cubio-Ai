/**
 * CUBiO AI — Phase 3 / Task 02: Persistent Node Process Types
 * ==========================================================
 *
 * Formal contracts, CLI argument structures, IPC commands, and process management
 * interfaces for the persistent operating system CUBiO Node process.
 */

import { ChildProcess } from 'node:child_process';
import { NodeRole, NodeCapability, CanonicalNodeIdentity } from '../protocol/v1/nodeArchitecture';
import { TransportType, TransportEndpoint } from '../transport/types';
import { NodeRuntimeLifecycleState, NodeRuntimeTelemetry } from './nodeRuntimeTypes';

/**
 * Command-line arguments accepted by the standalone node process.
 */
export interface NodeProcessCliArgs {
  readonly nodeId?: string;
  readonly nodeName?: string;
  readonly ownerCubId?: string;
  readonly role?: NodeRole;
  readonly coordinateUri?: string;
  readonly capabilities?: readonly NodeCapability[];
  readonly transport?: TransportType;
  readonly host?: string;
  readonly port?: number;
  readonly mtu?: number;
  readonly pidFile?: string;
  readonly statusFile?: string;
  readonly configFile?: string;
  readonly heartbeatIntervalMs?: number;
}

/**
 * Structured startup banner emitted to stdout when node reaches RUNNING state.
 */
export interface NodeStartupBanner {
  readonly event: 'CUBIO_NODE_ONLINE';
  readonly pid: number;
  readonly ppid: number;
  readonly nodeId: string;
  readonly nodeName: string;
  readonly ownerCubId: string;
  readonly role: NodeRole;
  readonly coordinateUri: string;
  readonly state: NodeRuntimeLifecycleState;
  readonly primaryTransport: TransportType;
  readonly endpoint: TransportEndpoint;
  readonly timestamp: number;
  readonly platform: string;
  readonly nodeVersion: string;
}

/**
 * Line-delimited IPC command received over stdin or IPC socket.
 */
export interface NodeIpcCommand {
  readonly command: 'STATUS' | 'HEALTH' | 'PING' | 'STOP' | 'RESTART' | 'CRASH_SIMULATION';
  readonly correlationId?: string;
  readonly payload?: any;
}

/**
 * Response emitted to stdout or IPC stream for a corresponding command.
 */
export interface NodeIpcResponse {
  readonly event: 'CUBIO_NODE_IPC_RESPONSE';
  readonly command: string;
  readonly correlationId?: string;
  readonly success: boolean;
  readonly pid: number;
  readonly state: NodeRuntimeLifecycleState;
  readonly data?: any;
  readonly error?: string;
  readonly timestamp: number;
}

/**
 * Options for spawning a managed OS node process.
 */
export interface NodeProcessSpawnOptions {
  readonly nodeId?: string;
  readonly nodeName?: string;
  readonly ownerCubId?: string;
  readonly role?: NodeRole;
  readonly coordinateUri?: string;
  readonly transport?: TransportType;
  readonly host?: string;
  readonly port?: number;
  readonly mtu?: number;
  readonly pidFile?: string;
  readonly statusFile?: string;
  readonly env?: Record<string, string>;
  readonly startupTimeoutMs?: number;
}

/**
 * Interface contract for a controller managing a real OS node process.
 */
export interface ManagedNodeProcess {
  readonly pid: number;
  readonly wrapperPid?: number;
  readonly process: ChildProcess;
  readonly startupBanner: NodeStartupBanner;
  readonly isAlive: boolean;

  /** Sends a line-delimited command via stdin */
  sendCommand(command: NodeIpcCommand['command'], payload?: any, timeoutMs?: number): Promise<NodeIpcResponse>;

  /** Sends OS signal (e.g. SIGTERM, SIGINT, SIGKILL) */
  sendSignal(signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL'): void;

  /** Awaits process exit with return code and signal */
  waitForExit(timeoutMs?: number): Promise<{ code: number | null; signal: string | null }>;

  /** Requests graceful shutdown via command, falling back to SIGTERM/SIGKILL */
  stop(graceful?: boolean, timeoutMs?: number): Promise<void>;

  /** Reads accumulated stdout and stderr */
  getStdout(): string;
  getStderr(): string;
}
