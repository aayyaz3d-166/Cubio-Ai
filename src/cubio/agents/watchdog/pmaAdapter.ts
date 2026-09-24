/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent)
 * src/cubio/agents/watchdog/pmaAdapter.ts
 *
 * Sovereign PMA compatibility adapter for BTWA.
 * Connects background task monitoring to PMA task lifecycle and ProjectChangeWatcher.
 */

import { WatchedTask, WatchdogAuditReport } from './types';
import { WatchdogAuditLogger } from './auditLogger';

export class WatchdogPmaAdapter {
  /**
   * Translates a PMA task ID and process info into a WatchedTask structure.
   */
  public static registerPmaTask(params: {
    taskId: string;
    command: string;
    pid: number;
    logPath?: string;
    childPids?: readonly number[];
  }): WatchedTask {
    const now = Date.now();
    return Object.freeze({
      taskId: params.taskId,
      command: params.command,
      pid: params.pid,
      logPath: params.logPath,
      startTimeMs: now,
      lastMeaningfulProgressMs: now,
      currentLivenessState: 'ACTIVE_PROGRESSING',
      childPids: Object.freeze(params.childPids ? [...params.childPids] : []),
      samples: Object.freeze([]),
    });
  }

  /**
   * Formats a watchdog audit report into Markdown for PMA integration.
   */
  public static formatPmaReport(report: WatchdogAuditReport): string {
    return WatchdogAuditLogger.formatMarkdown(report);
  }
}
