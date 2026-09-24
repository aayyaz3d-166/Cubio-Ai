/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent) v2.1
 * src/cubio/agents/watchdog/taskLedger.ts
 *
 * Persistent BTWA Task Ledger.
 * Stores and exposes final task completion records with cryptographic integrity:
 * - task ID
 * - final state
 * - exit code
 * - runtime
 * - evidence
 * - cleanup result
 * - next-task readiness
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TaskLedgerRecord } from './types';

export class PersistentTaskLedger {
  private readonly rootDir: string;
  private readonly ledgerFilePath: string;
  private readonly memoryRecords = new Map<string, TaskLedgerRecord>();

  constructor(customRootDir?: string, customLedgerFileName: string = 'reports/btwa_task_ledger.json') {
    this.rootDir = customRootDir || process.cwd();
    this.ledgerFilePath = path.isAbsolute(customLedgerFileName)
      ? customLedgerFileName
      : path.join(this.rootDir, customLedgerFileName);
    this.loadFromDisk();
  }

  /**
   * Records or idempotently updates a task finalization in the ledger.
   */
  public recordTaskCompletion(record: Omit<TaskLedgerRecord, 'recordHash'>): TaskLedgerRecord {
    // Check for existing record (idempotency check)
    const existing = this.memoryRecords.get(record.taskId);
    if (existing) {
      // If already finalized identically, return existing without corrupting
      if (existing.finalState === record.finalState && existing.exitCode === record.exitCode) {
        return existing;
      }
    }

    const payload = JSON.stringify({
      taskId: record.taskId,
      command: record.command,
      pid: record.pid,
      initialState: record.initialState,
      finalState: record.finalState,
      exitCode: record.exitCode,
      runtimeMs: record.runtimeMs,
      startTimeMs: record.startTimeMs,
      endTimeMs: record.endTimeMs,
      healthRating: record.healthRating,
      evidenceHash: record.evidence.evidenceHash,
      wrapperCleanupSuccess: record.wrapperCleanupSuccess,
      nextTaskReadiness: record.nextTaskReadiness,
      ledgerTimestamp: record.ledgerTimestamp,
    });

    const recordHash = crypto.createHash('sha256').update(payload).digest('hex');

    const sealedRecord: TaskLedgerRecord = Object.freeze({
      ...record,
      recordHash,
    });

    this.memoryRecords.set(record.taskId, sealedRecord);
    this.persistToDisk();
    return sealedRecord;
  }

  /**
   * Retrieves a ledger record for a task.
   */
  public getRecord(taskId: string): TaskLedgerRecord | undefined {
    return this.memoryRecords.get(taskId);
  }

  /**
   * Returns all recorded task records.
   */
  public getAllRecords(): readonly TaskLedgerRecord[] {
    return Object.freeze(Array.from(this.memoryRecords.values()));
  }

  /**
   * Clears in-memory ledger records (primarily for clean test isolation).
   */
  public clearMemory(): void {
    this.memoryRecords.clear();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.ledgerFilePath)) {
        const raw = fs.readFileSync(this.ledgerFilePath, 'utf8');
        const list: TaskLedgerRecord[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.taskId) {
              this.memoryRecords.set(item.taskId, Object.freeze(item));
            }
          }
        }
      }
    } catch {
      // Graceful fallback to fresh in-memory ledger
    }
  }

  private persistToDisk(): void {
    try {
      const dir = path.dirname(this.ledgerFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify(Array.from(this.memoryRecords.values()), null, 2);
      fs.writeFileSync(this.ledgerFilePath, data, 'utf8');
    } catch {
      // Ignore disk write errors if readonly filesystem
    }
  }
}