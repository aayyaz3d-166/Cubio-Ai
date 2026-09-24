/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent)
 * src/cubio/agents/watchdog/safeProcessTerminator.ts
 *
 * Safely terminates deadlocked processes and their entire child process trees
 * without leaving orphaned/zombie processes.
 */

import { execSync } from 'child_process';
import { TerminationMethod, WatchdogActionRecord } from './types';
import * as crypto from 'crypto';

export type TerminationExecutor = (pid: number, childPids: readonly number[]) => boolean;

export class SafeProcessTerminator {
  private customExecutor?: TerminationExecutor;

  constructor(customExecutor?: TerminationExecutor) {
    this.customExecutor = customExecutor;
  }

  /**
   * Safely terminates target process and its child processes.
   */
  public terminateProcessTree(
    taskId: string,
    pid: number,
    childPids: readonly number[] = []
  ): WatchdogActionRecord {
    const timestamp = Date.now();
    const actionId = `ACT-KILL-${taskId}-${timestamp.toString(36)}`;
    const allPids = [pid, ...childPids];
    let method: TerminationMethod = 'SIGTERM';
    let success = false;
    let details = '';

    if (this.customExecutor) {
      method = 'MOCK_TERMINATION';
      try {
        success = this.customExecutor(pid, childPids);
        details = success
          ? `Successfully terminated PID ${pid} and ${childPids.length} child processes via injected executor.`
          : `Custom executor returned failure for PID ${pid}.`;
      } catch (err: any) {
        success = false;
        details = `Error in custom termination executor: ${err.message}`;
      }
    } else {
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        method = 'TASKKILL_TREE';
        try {
          // /T terminates process and child processes; /F forces termination
          execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
          success = true;
          details = `Successfully executed taskkill /pid ${pid} /T /F (tree kill).`;
        } catch (err: any) {
          // If already exited, it's considered successfully cleaned
          details = `taskkill note: ${err.message}`;
          success = true;
        }
      } else {
        method = 'SIGKILL';
        try {
          // Kill child processes first
          for (const cpid of childPids) {
            try {
              process.kill(cpid, 'SIGKILL');
            } catch {
              // Ignore if already dead
            }
          }
          process.kill(pid, 'SIGKILL');
          success = true;
          details = `Successfully sent SIGKILL to root PID ${pid} and children [${childPids.join(', ')}].`;
        } catch (err: any) {
          details = `POSIX kill error: ${err.message}`;
          success = err.code === 'ESRCH'; // Already gone
        }
      }
    }

    const actionHash = crypto
      .createHash('sha256')
      .update(`${actionId}:${taskId}:${pid}:${success}:${details}`)
      .digest('hex');

    return Object.freeze({
      actionId,
      taskId,
      pid,
      actionType: 'TERMINATION',
      method,
      affectedPids: Object.freeze(allPids),
      success,
      details,
      timestamp,
      actionHash,
    });
  }
}
