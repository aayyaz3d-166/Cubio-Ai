/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/taskReporter.ts
 *
 * Mandatory Task Completion Report Generator.
 * Whenever any task completes in CUBiO, this engine ingests final evidence/results
 * and formats, cryptographically anchors, and writes a Task Completion Report
 * to the approved project reporting directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TheMGTaskCompletionReport } from './types';

export class TheMGTaskReporter {
  private readonly reportsDir: string;

  constructor(customRootDir?: string) {
    const root = customRootDir || process.cwd();
    this.reportsDir = path.join(root, 'reports');
  }

  /**
   * Generates, hashes, and stores a structured Task Completion Report.
   */
  public generateTaskCompletionReport(params: {
    taskId: string;
    objective: string;
    workPerformed: readonly string[];
    resultStatus: 'PASS' | 'PARTIAL_PASS' | 'FAIL' | 'BLOCKED';
    testsAndGatesExecuted: readonly {
      readonly name: string;
      readonly status: 'PASS' | 'FAIL' | 'BLOCKED';
    }[];
    importantChanges: readonly {
      readonly path: string;
      readonly changeType: 'MODIFIED' | 'CREATED' | 'DELETED';
      readonly summary: string;
    }[];
    failuresAndGaps: readonly string[];
    rxEvidenceReference: {
      readonly lifecycleId: string;
      readonly masterProvenanceHash: string;
    };
    nextAction: string;
  }): TheMGTaskCompletionReport {
    const timestamp = Date.now();
    const reportId = `TCR-${params.taskId}-${timestamp.toString(36).toUpperCase()}`;

    // Compute deterministic report hash
    const hashPayload = JSON.stringify({
      taskId: params.taskId,
      objective: params.objective,
      resultStatus: params.resultStatus,
      testsCount: params.testsAndGatesExecuted.length,
      changesCount: params.importantChanges.length,
      rxEvidence: params.rxEvidenceReference,
      nextAction: params.nextAction,
    });

    const reportHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const report: TheMGTaskCompletionReport = Object.freeze({
      reportId,
      taskId: params.taskId,
      objective: params.objective,
      workPerformed: Object.freeze([...params.workPerformed]),
      resultStatus: params.resultStatus,
      testsAndGatesExecuted: Object.freeze([...params.testsAndGatesExecuted]),
      importantChanges: Object.freeze([...params.importantChanges]),
      failuresAndGaps: Object.freeze([...params.failuresAndGaps]),
      rxEvidenceReference: Object.freeze({ ...params.rxEvidenceReference }),
      nextAction: params.nextAction,
      timestamp,
      reportHash,
    });

    // Write report to disk in reports directory if directory exists or can be created safely
    try {
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }
      const outPath = path.join(this.reportsDir, `${params.taskId}_COMPLETION_REPORT.json`);
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    } catch {
      // Ephemeral fallback in read-only environments
    }

    return report;
  }

  /**
   * Formats a Task Completion Report into concise markdown.
   */
  public static formatMarkdown(report: TheMGTaskCompletionReport): string {
    const lines: string[] = [];

    lines.push(`## Task Completion Report: ${report.taskId}`);
    lines.push(`**Objective**: ${report.objective}`);
    lines.push(`**Status**: ${report.resultStatus}`);
    lines.push(`**Report Hash**: \`${report.reportHash}\``);
    lines.push(`**RX Provenance**: \`${report.rxEvidenceReference.lifecycleId}\` (\`${report.rxEvidenceReference.masterProvenanceHash.slice(0, 16)}...\`)`);
    lines.push('');
    lines.push('### Work Performed');
    for (const w of report.workPerformed) {
      lines.push(`- ${w}`);
    }
    lines.push('');
    lines.push('### Tests & Gates');
    for (const t of report.testsAndGatesExecuted) {
      lines.push(`- [${t.status}] ${t.name}`);
    }
    lines.push('');
    lines.push('### Important Changes');
    for (const c of report.importantChanges) {
      lines.push(`- \`${c.path}\` (${c.changeType}): ${c.summary}`);
    }
    if (report.failuresAndGaps.length > 0) {
      lines.push('');
      lines.push('### Failures & Gaps');
      for (const f of report.failuresAndGaps) {
        lines.push(`- ⚠️ ${f}`);
      }
    }
    lines.push('');
    lines.push(`**Next Action**: ${report.nextAction}`);

    return lines.join('\n');
  }
}
