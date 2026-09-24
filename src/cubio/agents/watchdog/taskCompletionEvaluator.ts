/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent) v2.1
 * src/cubio/agents/watchdog/taskCompletionEvaluator.ts
 *
 * Sovereign task completion evaluator for AGENT-006 BTWA.
 * Evaluates completion status across:
 * - Process exit code (0 vs non-zero vs alive wrapper)
 * - Expected output/report artifacts existence, size, and patterns
 * - Completion markers in log snippets / stdout
 * - Closed stdout/stderr streams
 * - Child process tree status
 * - Never relies on runtime timeout alone.
 * - Prevents falsely marking PASS if expected evidence is missing.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  WatchedTask,
  ProcessActivitySample,
  TaskCompletionCriteria,
  TaskEvidencePackage,
  TaskCompletionClassification,
  ExpectedTaskArtifact,
} from './types';

export class TaskCompletionEvaluator {
  private readonly rootDir: string;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
  }

  /**
   * Evaluates task completion evidence against criteria and runtime state.
   */
  public evaluateCompletion(
    task: WatchedTask,
    sample: ProcessActivitySample,
    options?: {
      simulatedExitCode?: number;
      criteria?: TaskCompletionCriteria;
      stdoutStderrClosed?: boolean;
      nowMs?: number;
    }
  ): TaskEvidencePackage {
    const nowMs = options?.nowMs ?? Date.now();
    const durationMs = Math.max(0, nowMs - task.startTimeMs);
    const criteria = options?.criteria ?? task.completionCriteria;
    const requiredExitCode = criteria?.requiredExitCode ?? 0;
    const exitCode = options?.simulatedExitCode ?? (sample.isRunning ? null : 0);

    const artifactsFound: string[] = [];
    const missingArtifacts: string[] = [];
    const completionMarkersFound: string[] = [];

    // 1. Artifact Verification
    const expectedArtifacts = criteria?.expectedArtifacts || [];
    const allExpected: ExpectedTaskArtifact[] = [];

    for (const art of expectedArtifacts) {
      if (typeof art === 'string') {
        allExpected.push({ path: art });
      } else {
        allExpected.push(art);
      }
    }

    if (criteria?.expectedReportPath) {
      allExpected.push({ path: criteria.expectedReportPath });
    }

    for (const expected of allExpected) {
      const fullPath = path.isAbsolute(expected.path)
        ? expected.path
        : path.join(this.rootDir, expected.path);

      if (fs.existsSync(fullPath)) {
        let matches = true;
        try {
          const stat = fs.statSync(fullPath);
          if (expected.minSizeBytes !== undefined && stat.size < expected.minSizeBytes) {
            matches = false;
          }
          if (matches && expected.requiredPattern !== undefined) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (typeof expected.requiredPattern === 'string') {
              if (!content.includes(expected.requiredPattern)) matches = false;
            } else {
              if (!expected.requiredPattern.test(content)) matches = false;
            }
          }
        } catch {
          matches = false;
        }

        if (matches) {
          artifactsFound.push(expected.path);
        } else {
          missingArtifacts.push(expected.path);
        }
      } else {
        missingArtifacts.push(expected.path);
      }
    }

    // 2. Completion Markers in output snippet
    const snippet = sample.lastOutputSnippet || '';
    if (criteria?.completionMarkers) {
      for (const marker of criteria.completionMarkers) {
        if (snippet.includes(marker)) {
          completionMarkersFound.push(marker);
        }
      }
    }

    // 3. Pipe closure status
    const stdoutStderrClosed = options?.stdoutStderrClosed ?? (!sample.isRunning);

    // 4. Child processes status
    const childProcessesCleaned: number[] = [];
    if (!sample.isRunning) {
      // Any child pids recorded that are no longer active
      for (const cpid of task.childPids) {
        if (!sample.activeChildPids.includes(cpid)) {
          childProcessesCleaned.push(cpid);
        }
      }
    }

    // 5. Classification Logic
    let classification: TaskCompletionClassification = 'SUCCESS';
    let verificationPassed = true;

    // Case A: Process still running
    if (sample.isRunning) {
      // Check if evidence exists (e.g. artifacts found or markers found) while wrapper is still running
      const hasAllArtifacts = allExpected.length > 0 && missingArtifacts.length === 0;
      const hasAllMarkers =
        criteria?.completionMarkers &&
        criteria.completionMarkers.length > 0 &&
        completionMarkersFound.length === criteria.completionMarkers.length;

      if (hasAllArtifacts || hasAllMarkers) {
        classification = 'WRAPPER_STILL_ACTIVE';
        verificationPassed = true;
      } else {
        classification = 'INCOMPLETE';
        verificationPassed = false;
      }
    } else {
      // Process has exited
      if (exitCode !== null && exitCode !== requiredExitCode) {
        classification = 'NON_ZERO_EXIT';
        verificationPassed = false;
      } else if (missingArtifacts.length > 0) {
        classification = 'MISSING_EVIDENCE';
        verificationPassed = false;
      } else if (
        criteria?.completionMarkers &&
        criteria.completionMarkers.length > 0 &&
        completionMarkersFound.length < criteria.completionMarkers.length
      ) {
        classification = 'MISSING_EVIDENCE';
        verificationPassed = false;
      } else {
        classification = 'SUCCESS';
        verificationPassed = true;
      }
    }

    // 6. Cryptographic Evidence Hash
    const evidencePayload = JSON.stringify({
      taskId: task.taskId,
      exitCode,
      durationMs,
      classification,
      verificationPassed,
      artifactsFound,
      missingArtifacts,
      completionMarkersFound,
      stdoutStderrClosed,
    });

    const evidenceHash = crypto.createHash('sha256').update(evidencePayload).digest('hex');

    return Object.freeze({
      exitCode,
      durationMs,
      finalLogSnippet: snippet,
      artifactsFound: Object.freeze([...artifactsFound]),
      missingArtifacts: Object.freeze([...missingArtifacts]),
      stdoutStderrClosed,
      childProcessesCleaned: Object.freeze([...childProcessesCleaned]),
      completionMarkersFound: Object.freeze([...completionMarkersFound]),
      verificationPassed,
      classification,
      evidenceHash,
    });
  }
}