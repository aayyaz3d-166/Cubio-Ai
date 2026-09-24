/**
 * CUBiO AI — Phase 3 / Task 02: Node Process Controller
 * ====================================================
 *
 * Programmatic controller for spawning, managing, communicating with,
 * and gracefully terminating real operating system CUBiO Node processes.
 */

import * as path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import {
  NodeProcessSpawnOptions,
  ManagedNodeProcess,
  NodeStartupBanner,
  NodeIpcResponse,
} from './nodeProcessTypes';

export class NodeProcessController {
  /**
   * Spawns an independent operating system process running `nodeProcess.ts`.
   * Blocks until the child process reaches the RUNNING state and emits its
   * structured startup banner, or until timeout.
   */
  public static async spawnNode(options: NodeProcessSpawnOptions = {}): Promise<ManagedNodeProcess> {
    const cwd = process.cwd();
    const tsxCli = path.resolve(cwd, 'node_modules/tsx/dist/cli.mjs');
    const scriptPath = path.resolve(cwd, 'src/cubio/network/node/nodeProcess.ts');

    const cliArgs: string[] = [tsxCli, scriptPath];

    if (options.nodeId) cliArgs.push('--nodeId', options.nodeId);
    if (options.nodeName) cliArgs.push('--nodeName', options.nodeName);
    if (options.ownerCubId) cliArgs.push('--ownerCubId', options.ownerCubId);
    if (options.role) cliArgs.push('--role', options.role);
    if (options.coordinateUri) cliArgs.push('--coord', options.coordinateUri);
    if (options.transport) cliArgs.push('--transport', options.transport);
    if (options.host) cliArgs.push('--host', options.host);
    if (options.port !== undefined) cliArgs.push('--port', String(options.port));
    if (options.mtu !== undefined) cliArgs.push('--mtu', String(options.mtu));
    if (options.pidFile) cliArgs.push('--pidFile', options.pidFile);
    if (options.statusFile) cliArgs.push('--statusFile', options.statusFile);

    const child = spawn(process.execPath, cliArgs, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
    });

    if (!child.pid) {
      throw new Error('Failed to spawn OS child process: No PID assigned.');
    }

    let stdoutAcc = '';
    let stderrAcc = '';
    const pendingIpcResolvers = new Map<string, (resp: NodeIpcResponse) => void>();

    // Process output streams
    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutAcc += text;

      // Scan for IPC responses
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (line.includes('[CUBIO_NODE_IPC]')) {
          const jsonStart = line.indexOf('{');
          if (jsonStart !== -1) {
            try {
              const resp: NodeIpcResponse = JSON.parse(line.slice(jsonStart));
              if (resp.correlationId && pendingIpcResolvers.has(resp.correlationId)) {
                const resolve = pendingIpcResolvers.get(resp.correlationId)!;
                pendingIpcResolvers.delete(resp.correlationId);
                resolve(resp);
              } else {
                // Resolve first matching command
                for (const [key, resolver] of pendingIpcResolvers.entries()) {
                  if (key.startsWith(resp.command + ':')) {
                    pendingIpcResolvers.delete(key);
                    resolver(resp);
                    break;
                  }
                }
              }
            } catch {}
          }
        }
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrAcc += chunk.toString();
    });

    // Await structured startup banner
    const timeoutMs = options.startupTimeoutMs ?? 10000;
    const banner = await new Promise<NodeStartupBanner>((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;

      const checkBanner = () => {
        const marker = '[CUBIO_NODE_ONLINE]';
        const idx = stdoutAcc.indexOf(marker);
        if (idx !== -1) {
          const jsonStart = stdoutAcc.indexOf('{', idx);
          if (jsonStart !== -1) {
            const lineEnd = stdoutAcc.indexOf('\n', jsonStart);
            const jsonStr = lineEnd === -1 ? stdoutAcc.slice(jsonStart) : stdoutAcc.slice(jsonStart, lineEnd);
            try {
              const parsed = JSON.parse(jsonStr.trim());
              if (timer) clearTimeout(timer);
              child.removeListener('exit', onExit);
              resolve(parsed);
              return true;
            } catch {}
          }
        }
        return false;
      };

      const onData = () => {
        checkBanner();
      };

      const onExit = (code: number | null, signal: string | null) => {
        if (timer) clearTimeout(timer);
        child.stdout.removeListener('data', onData);
        reject(
          new Error(
            `Child node process (PID ${child.pid}) exited prematurely before startup banner. ` +
            `Code: ${code}, Signal: ${signal}. Stderr: ${stderrAcc.slice(-500)}`
          )
        );
      };

      child.stdout.on('data', onData);
      child.once('exit', onExit);

      timer = setTimeout(() => {
        child.stdout.removeListener('data', onData);
        child.removeListener('exit', onExit);
        reject(
          new Error(
            `Timed out after ${timeoutMs}ms waiting for CUBiO node startup banner. ` +
            `PID: ${child.pid}. Output: ${stdoutAcc.slice(-500)}`
          )
        );
      }, timeoutMs);

      // Immediate check in case banner was already emitted
      checkBanner();
    });

    const nodePid = banner.pid ?? child.pid;

    // Construct Managed Node Process instance
    const managedProcess: ManagedNodeProcess = {
      pid: nodePid,
      wrapperPid: child.pid,
      process: child,
      startupBanner: Object.freeze(banner),

      get isAlive(): boolean {
        if (child.killed || child.exitCode !== null) return false;
        try {
          // Sending signal 0 checks for OS process table existence without killing
          return process.kill(nodePid, 0);
        } catch {
          return false;
        }
      },

      sendCommand(command, payload, cmdTimeoutMs = 5000): Promise<NodeIpcResponse> {
        return new Promise<NodeIpcResponse>((resolve, reject) => {
          if (!managedProcess.isAlive) {
            return reject(new Error(`Cannot send command: Process PID ${nodePid} is not alive.`));
          }

          const correlationId = `IPC_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const key = correlationId;

          const timer = setTimeout(() => {
            pendingIpcResolvers.delete(key);
            reject(new Error(`IPC command '${command}' timed out after ${cmdTimeoutMs}ms (PID: ${nodePid})`));
          }, cmdTimeoutMs);

          pendingIpcResolvers.set(key, (resp) => {
            clearTimeout(timer);
            resolve(resp);
          });

          const line = `CMD:${command} ${JSON.stringify({ correlationId, payload })}\n`;
          child.stdin.write(line, (err) => {
            if (err) {
              clearTimeout(timer);
              pendingIpcResolvers.delete(key);
              reject(err);
            }
          });
        });
      },

      sendSignal(signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL'): void {
        try {
          process.kill(nodePid, signal);
        } catch {}
        try {
          child.kill(signal);
        } catch {}
      },

      waitForExit(exitTimeoutMs = 10000): Promise<{ code: number | null; signal: string | null }> {
        return new Promise((resolve, reject) => {
          if (child.exitCode !== null) {
            return resolve({ code: child.exitCode, signal: child.signalCode });
          }

          let timer: NodeJS.Timeout | null = null;
          const onExit = (code: number | null, signal: string | null) => {
            if (timer) clearTimeout(timer);
            resolve({ code, signal });
          };

          child.once('exit', onExit);

          timer = setTimeout(() => {
            child.removeListener('exit', onExit);
            reject(new Error(`Timed out waiting for PID ${child.pid} to exit after ${exitTimeoutMs}ms`));
          }, exitTimeoutMs);
        });
      },

      async stop(graceful = true, stopTimeoutMs = 5000): Promise<void> {
        if (!managedProcess.isAlive) return;

        if (graceful) {
          try {
            await managedProcess.sendCommand('STOP', undefined, stopTimeoutMs);
            await managedProcess.waitForExit(stopTimeoutMs);
            return;
          } catch {
            // Fall back to OS signal if command failed or timed out
          }
        }

        // Try SIGTERM first
        try {
          managedProcess.sendSignal('SIGTERM');
          await managedProcess.waitForExit(2000);
          return;
        } catch {}

        // Hard kill if still alive
        if (managedProcess.isAlive) {
          try {
            managedProcess.sendSignal('SIGKILL');
            await managedProcess.waitForExit(1000);
          } catch {}
        }
      },

      getStdout(): string {
        return stdoutAcc;
      },

      getStderr(): string {
        return stderrAcc;
      },
    };

    return managedProcess;
  }
}
