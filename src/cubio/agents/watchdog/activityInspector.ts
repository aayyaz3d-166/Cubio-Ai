/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent) v2 Supervisor
 * src/cubio/agents/watchdog/activityInspector.ts
 *
 * Inspects process liveness, process-tree child PIDs, CPU & RAM metrics,
 * log file growth & mtime changes, progress tokens, and runtime stages.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ProcessActivitySample, WatchedTask, ProcessMetrics } from './types';

export class ActivityInspector {
  private readonly rootDir: string;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
  }

  /**
   * Checks if a process is alive given its PID.
   */
  public isProcessAlive(pid: number): boolean {
    if (!pid || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (err: any) {
      return err.code === 'EPERM';
    }
  }

  /**
   * Discovers child process tree for a given PID.
   */
  public discoverChildPids(parentPid: number): readonly number[] {
    if (!parentPid || parentPid <= 0) return Object.freeze([]);
    const children: number[] = [];

    try {
      if (process.platform === 'win32') {
        // Use wmic or PowerShell to find child processes if needed
        const out = execSync(
          `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"ParentProcessId = ${parentPid}\\" | Select-Object -ExpandProperty ProcessId"`,
          { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }
        ).toString('utf8');

        const lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        for (const line of lines) {
          const cpid = parseInt(line, 10);
          if (!isNaN(cpid) && cpid > 0 && cpid !== parentPid) {
            children.push(cpid);
          }
        }
      } else {
        // POSIX pgrep -P <parentPid>
        const out = execSync(`pgrep -P ${parentPid}`, {
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 2000,
        }).toString('utf8');

        const lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        for (const line of lines) {
          const cpid = parseInt(line, 10);
          if (!isNaN(cpid) && cpid > 0) {
            children.push(cpid);
          }
        }
      }
    } catch {
      // Graceful fallback to empty child array
    }

    return Object.freeze(children);
  }

  /**
   * Samples process CPU and Memory metrics.
   */
  public sampleProcessMetrics(pid: number): ProcessMetrics {
    if (!pid || pid <= 0) {
      return Object.freeze({ cpuPercent: 0, memoryWorkingSetBytes: 0 });
    }

    try {
      if (process.platform === 'win32') {
        const out = execSync(
          `powershell -NoProfile -Command "Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object -Property CPU, WorkingSet64 | ConvertTo-Json"`,
          { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }
        ).toString('utf8').trim();

        if (out) {
          const data = JSON.parse(out);
          return Object.freeze({
            cpuPercent: Number(data.CPU || 0),
            memoryWorkingSetBytes: Number(data.WorkingSet64 || 0),
          });
        }
      } else {
        // POSIX ps -p <pid> -o %cpu,rss
        const out = execSync(`ps -p ${pid} -o %cpu,rss --no-headers`, {
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 2000,
        }).toString('utf8').trim();

        const parts = out.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          return Object.freeze({
            cpuPercent: parseFloat(parts[0]) || 0,
            memoryWorkingSetBytes: (parseInt(parts[1], 10) || 0) * 1024,
          });
        }
      }
    } catch {
      // Graceful fallback
    }

    return Object.freeze({ cpuPercent: 0, memoryWorkingSetBytes: 0 });
  }

  /**
   * Samples activity of a watched task from log files, process-tree, and memory metadata.
   */
  public sampleTaskActivity(
    task: WatchedTask,
    currentTimeMs: number = Date.now(),
    injectedMetrics?: Partial<ProcessActivitySample>
  ): ProcessActivitySample {
    let logByteSize = 0;
    let logLastModifiedMs = 0;
    let lastOutputSnippet: string | undefined;

    if (injectedMetrics?.logByteSize !== undefined) {
      logByteSize = injectedMetrics.logByteSize;
    } else if (task.logPath) {
      const fullLogPath = path.isAbsolute(task.logPath)
        ? task.logPath
        : path.join(this.rootDir, task.logPath);

      if (fs.existsSync(fullLogPath)) {
        try {
          const stat = fs.statSync(fullLogPath);
          logByteSize = stat.size;
          logLastModifiedMs = stat.mtimeMs;

          if (logByteSize > 0) {
            const fd = fs.openSync(fullLogPath, 'r');
            const readLength = Math.min(512, logByteSize);
            const buffer = Buffer.alloc(readLength);
            fs.readSync(fd, buffer, 0, readLength, Math.max(0, logByteSize - readLength));
            fs.closeSync(fd);
            lastOutputSnippet = buffer.toString('utf8').trim();
          }
        } catch {
          // Ignore read errors gracefully
        }
      }
    }

    const isRunning =
      injectedMetrics?.isRunning !== undefined
        ? injectedMetrics.isRunning
        : this.isProcessAlive(task.pid);

    const activeChildPids =
      injectedMetrics?.activeChildPids ??
      task.childPids ??
      (isRunning && this.isProcessAlive(task.pid) ? this.discoverChildPids(task.pid) : []);

    const metrics =
      injectedMetrics?.metrics ??
      (isRunning && this.isProcessAlive(task.pid)
        ? this.sampleProcessMetrics(task.pid)
        : { cpuPercent: 0, memoryWorkingSetBytes: 0 });

    return Object.freeze({
      timestamp: currentTimeMs,
      pid: task.pid,
      isRunning,
      logByteSize,
      logLastModifiedMs: injectedMetrics?.logLastModifiedMs ?? logLastModifiedMs,
      lastHeartbeatMs: injectedMetrics?.lastHeartbeatMs ?? (task.metadata?.lastHeartbeatMs as number | undefined),
      activeChildPids: Object.freeze([...activeChildPids]),
      lastOutputSnippet: injectedMetrics?.lastOutputSnippet ?? lastOutputSnippet,
      progressStep: injectedMetrics?.progressStep ?? task.progressStep ?? (task.metadata?.progressStep as number | undefined),
      currentStage: injectedMetrics?.currentStage ?? task.runtimeStage ?? (task.metadata?.currentStage as string | undefined),
      metrics,
    });
  }
}
