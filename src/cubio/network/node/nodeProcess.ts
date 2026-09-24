/**
 * CUBiO AI — Phase 3 / Task 02: Standalone Persistent Node Process
 * ================================================================
 *
 * Independently executable OS process entry point for a persistent CUBiO Node.
 * Manages process lifecycle, OS signal traps, IPC command processing,
 * runtime monitoring, and deterministic graceful shutdown.
 *
 * Usage:
 *   npx tsx src/cubio/network/node/nodeProcess.ts [options]
 *
 * Options:
 *   --nodeId <id>             Unique node ID (e.g. NODE-00001)
 *   --nodeName <name>         Human-readable node name
 *   --ownerCubId <cubId>      Owner identity (e.g. CUB-00000001)
 *   --role <role>             Node role: CORE | EDGE | RELAY | GATEWAY | STORAGE | COMPUTE
 *   --coord <uri>             Coordinate URI: CUBIO://NETWORK/<dim>/<zone>/<node>/<service>
 *   --transport <type>        Primary transport: TCP | UDP | WEBSOCKET | IPC | MEMORY
 *   --host <host>             Host address (default: 127.0.0.1)
 *   --port <port>             Port number (default: 0 = dynamic/ephemeral)
 *   --pidFile <path>          Path to write process ID file
 *   --statusFile <path>       Path to periodically update runtime status JSON
 *   --configFile <path>       Path to JSON configuration file
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { createNodeIdentity, NodeRole } from '../protocol/v1/nodeArchitecture';
import { TransportType, TransportEndpoint } from '../transport/types';
import { CubiONodeRuntime } from './nodeRuntime';
import { createDefaultNodeRuntimeConfig, validateNodeRuntimeConfig } from './nodeRuntimeConfig';
import { NodeRuntimeConfig } from './nodeRuntimeTypes';
import {
  NodeProcessCliArgs,
  NodeStartupBanner,
  NodeIpcCommand,
  NodeIpcResponse,
} from './nodeProcessTypes';

// ─── Command Line Argument Parsing ──────────────────────────────────────────

function parseCliArgs(argv: string[]): NodeProcessCliArgs {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = 'true';
      }
    }
  }

  return {
    nodeId: args.nodeId,
    nodeName: args.nodeName,
    ownerCubId: args.ownerCubId,
    role: args.role as NodeRole | undefined,
    coordinateUri: args.coord || args.coordinateUri,
    transport: (args.transport ? args.transport.toUpperCase() : undefined) as TransportType | undefined,
    host: args.host,
    port: args.port ? parseInt(args.port, 10) : undefined,
    pidFile: args.pidFile,
    statusFile: args.statusFile,
    configFile: args.configFile || args.config,
    heartbeatIntervalMs: args.heartbeat ? parseInt(args.heartbeat, 10) : undefined,
  };
}

// ─── Main Execution Runner ──────────────────────────────────────────────────

async function runNodeProcess() {
  const cliArgs = parseCliArgs(process.argv.slice(2));

  // Load configuration if specified via file
  let fileConfig: Partial<NodeRuntimeConfig> | null = null;
  if (cliArgs.configFile) {
    const configPath = path.resolve(process.cwd(), cliArgs.configFile);
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (err: any) {
        console.error(`[FATAL] Failed to parse config file '${configPath}': ${err.message}`);
        process.exit(1);
      }
    } else {
      console.error(`[FATAL] Config file not found: '${configPath}'`);
      process.exit(1);
    }
  }

  // Determine Identity
  const timestamp = Date.now();
  const rawId = cliArgs.nodeId || `NODE-${process.pid}-${timestamp.toString(36).toUpperCase()}`;
  const rawName = cliArgs.nodeName || `CubiONode-${process.pid}`;
  const rawOwner = cliArgs.ownerCubId || 'CUB-00000001';
  const rawRole: NodeRole = cliArgs.role || 'EDGE';
  const rawCoord = cliArgs.coordinateUri || `CUBIO://NETWORK/0/01/${String(process.pid % 100000).padStart(5, '0')}/CORE`;

  const identity = createNodeIdentity({
    nodeId: rawId,
    nodeName: rawName,
    ownerCubId: rawOwner,
    role: rawRole,
    coordinateUri: rawCoord,
  });

  // Determine Transports
  const primaryTransport: TransportType = cliArgs.transport || 'TCP';
  const bindHost = cliArgs.host || '127.0.0.1';
  const bindPort = cliArgs.port !== undefined ? cliArgs.port : 0;

  const endpoint: TransportEndpoint = {
    transportType: primaryTransport,
    host: bindHost,
    port: bindPort,
    coordinateUri: identity.coordinateUri,
  };

  const runtimeConfig = createDefaultNodeRuntimeConfig(identity, [
    {
      transportType: primaryTransport,
      endpoint,
      enabled: true,
    },
  ]);

  const valResult = validateNodeRuntimeConfig(runtimeConfig);
  if (!valResult.valid) {
    console.error(`[FATAL] Invalid node runtime configuration:\n` + valResult.errors.map(e => `  - ${e.message}`).join('\n'));
    process.exit(1);
  }

  // Instantiate Persistent Runtime
  const runtime = new CubiONodeRuntime(runtimeConfig);

  // Write PID File if requested
  if (cliArgs.pidFile) {
    try {
      const pidPath = path.resolve(process.cwd(), cliArgs.pidFile);
      fs.mkdirSync(path.dirname(pidPath), { recursive: true });
      fs.writeFileSync(pidPath, String(process.pid), 'utf8');
    } catch (err: any) {
      console.warn(`[WARN] Failed to write PID file '${cliArgs.pidFile}': ${err.message}`);
    }
  }

  // Update Status File helper
  const updateStatusFile = () => {
    if (!cliArgs.statusFile) return;
    try {
      const statusPath = path.resolve(process.cwd(), cliArgs.statusFile);
      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      const statusPayload = {
        pid: process.pid,
        nodeId: identity.nodeId,
        coordinateUri: identity.coordinateUri,
        state: runtime.state,
        telemetry: runtime.telemetry,
        timestamp: Date.now(),
      };
      fs.writeFileSync(statusPath, JSON.stringify(statusPayload, null, 2), 'utf8');
    } catch {}
  };

  // State change tracking
  runtime.onStateChange((prev, next, reason) => {
    console.log(`[CUBIO_NODE_STATE] PID=${process.pid} transition: '${prev}' -> '${next}' (Reason: ${reason})`);
    updateStatusFile();
  });

  // Shutdown Coordination
  let isShuttingDown = false;
  const executeShutdown = async (reason: string, exitCode = 0): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[CUBIO_NODE_SHUTTING_DOWN] PID=${process.pid} Reason: ${reason}`);

    try {
      await runtime.stop(true);
    } catch (err: any) {
      console.error(`[WARN] Error stopping runtime during shutdown: ${err.message}`);
    }

    // Cleanup PID file
    if (cliArgs.pidFile) {
      try {
        const pidPath = path.resolve(process.cwd(), cliArgs.pidFile);
        if (fs.existsSync(pidPath)) {
          fs.unlinkSync(pidPath);
        }
      } catch {}
    }

    updateStatusFile();

    console.log(`[CUBIO_NODE_OFFLINE] PID=${process.pid} Clean exit with code ${exitCode}`);
    process.exit(exitCode);
  };

  // Signal Handlers
  process.on('SIGINT', () => {
    executeShutdown('OS_SIGNAL_SIGINT', 0);
  });

  process.on('SIGTERM', () => {
    executeShutdown('OS_SIGNAL_SIGTERM', 0);
  });

  process.on('SIGHUP', () => {
    executeShutdown('OS_SIGNAL_SIGHUP', 0);
  });

  // Abnormal Termination Handlers
  process.on('uncaughtException', (err: Error) => {
    console.error(`[CUBIO_NODE_UNCAUGHT_EXCEPTION] PID=${process.pid} Error: ${err.message}\n${err.stack}`);
    executeShutdown('UNCAUGHT_EXCEPTION: ' + err.message, 1);
  });

  process.on('unhandledRejection', (reason: any) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(`[CUBIO_NODE_UNHANDLED_REJECTION] PID=${process.pid} Reason: ${msg}`);
    executeShutdown('UNHANDLED_REJECTION: ' + msg, 1);
  });

  // ─── Stdin Line IPC Command Handler ───────────────────────────────────────
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('CMD:')) return;

    const firstSpace = trimmed.indexOf(' ');
    const cmdName = (firstSpace === -1 ? trimmed.slice(4) : trimmed.slice(4, firstSpace)).toUpperCase();
    const payloadStr = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();

    let cmdPayload: any = null;
    let correlationId: string | undefined;

    if (payloadStr) {
      try {
        const parsed = JSON.parse(payloadStr);
        cmdPayload = parsed.payload ?? parsed;
        correlationId = parsed.correlationId;
      } catch {
        cmdPayload = payloadStr;
      }
    }

    const respond = (success: boolean, data?: any, error?: string) => {
      const resp: NodeIpcResponse = {
        event: 'CUBIO_NODE_IPC_RESPONSE',
        command: cmdName,
        correlationId,
        success,
        pid: process.pid,
        state: runtime.state,
        data,
        error,
        timestamp: Date.now(),
      };
      console.log(`[CUBIO_NODE_IPC] ${JSON.stringify(resp)}`);
    };

    switch (cmdName) {
      case 'PING':
        respond(true, { message: 'PONG', uptimeMs: runtime.telemetry.uptimeMs });
        break;

      case 'STATUS':
        respond(true, {
          identity: runtime.identity,
          state: runtime.state,
          telemetry: runtime.telemetry,
          services: runtime.getServices().map(s => ({
            serviceId: s.serviceId,
            serviceType: s.serviceType,
            coordinateUri: s.coordinateUri,
          })),
        });
        break;

      case 'HEALTH':
        respond(true, {
          healthStatus: runtime.telemetry.healthStatus,
          errorsCount: runtime.telemetry.errorsCount,
          activeTransports: runtime.telemetry.activeTransportsCount,
          activeConnections: runtime.telemetry.activeConnectionsCount,
        });
        break;

      case 'STOP':
        respond(true, { message: 'Shutdown initiated' });
        await executeShutdown('IPC_COMMAND_STOP', 0);
        break;

      case 'RESTART':
        try {
          await runtime.restart();
          respond(true, { message: 'Restart completed', state: runtime.state });
        } catch (err: any) {
          respond(false, undefined, `Restart failed: ${err.message}`);
        }
        break;

      case 'CRASH_SIMULATION':
        respond(true, { message: 'Triggering fatal exception for simulation test' });
        setTimeout(() => {
          throw new Error('SIMULATED_PROCESS_FATAL_CRASH');
        }, 10);
        break;

      default:
        respond(false, undefined, `Unknown IPC command: '${cmdName}'`);
        break;
    }
  });

  // ─── Start Node Runtime ───────────────────────────────────────────────────
  try {
    await runtime.start();

    // Determine actual bound local endpoint from active transport adapter
    const adapter = runtime.getAdapter(primaryTransport);
    const resolvedEndpoint = adapter?.localEndpoint ?? endpoint;

    const startupBanner: NodeStartupBanner = {
      event: 'CUBIO_NODE_ONLINE',
      pid: process.pid,
      ppid: process.ppid,
      nodeId: identity.nodeId,
      nodeName: identity.nodeName,
      ownerCubId: identity.ownerCubId,
      role: identity.role,
      coordinateUri: identity.coordinateUri,
      state: runtime.state,
      primaryTransport,
      endpoint: resolvedEndpoint,
      timestamp: Date.now(),
      platform: process.platform,
      nodeVersion: process.version,
    };

    // Emit structured JSON startup banner
    console.log(`[CUBIO_NODE_ONLINE] ${JSON.stringify(startupBanner)}`);
    updateStatusFile();
  } catch (err: any) {
    console.error(`[FATAL] Node runtime startup failed: ${err.message}`);
    await executeShutdown('STARTUP_FAILED: ' + err.message, 1);
  }
}

// Execute process entrypoint
runNodeProcess().catch((err) => {
  console.error('[FATAL] Uncaught error in runNodeProcess:', err);
  process.exit(1);
});
