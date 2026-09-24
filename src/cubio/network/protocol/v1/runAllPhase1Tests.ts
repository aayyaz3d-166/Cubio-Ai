/**
 * CUBiO AI — Phase 1 Master Test Suite Runner
 * ===========================================
 *
 * Executes all 11 Phase 1 Foundation test suites in sequential order,
 * captures execution output, measures duration, aggregates test statistics,
 * and produces an evidence-based forensic audit report.
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/runAllPhase1Tests.ts
 */

import { execSync } from 'child_process';

interface SuiteDefinition {
  readonly taskId: string;
  readonly taskName: string;
  readonly file: string;
}

const SUITES: readonly SuiteDefinition[] = [
  {
    taskId: 'TASK 01',
    taskName: 'Protocol Specification & Envelopes',
    file: 'src/cubio/network/protocol/v1/protocolEngine.test.ts',
  },
  {
    taskId: 'TASK 02',
    taskName: 'Packet Model & Framing',
    file: 'src/cubio/network/protocol/v1/packetEngine.test.ts',
  },
  {
    taskId: 'TASK 03',
    taskName: 'Message Model & Semantic Dispatch',
    file: 'src/cubio/network/protocol/v1/messageEngine.test.ts',
  },
  {
    taskId: 'TASK 04',
    taskName: 'Canonical Node Architecture',
    file: 'src/cubio/network/protocol/v1/nodeArchitecture.test.ts',
  },
  {
    taskId: 'TASK 05',
    taskName: 'Network State Model & Reconciliation',
    file: 'src/cubio/network/protocol/v1/stateModel.test.ts',
  },
  {
    taskId: 'TASK 06',
    taskName: 'Protocol Versioning & Handshakes',
    file: 'src/cubio/network/protocol/v1/versionManager.test.ts',
  },
  {
    taskId: 'TASK 07',
    taskName: 'Canonical RFC 8785 Serialization',
    file: 'src/cubio/network/protocol/v1/canonicalSerializer.test.ts',
  },
  {
    taskId: 'TASK 08',
    taskName: 'Central Constants Registry',
    file: 'src/cubio/network/protocol/v1/constants.test.ts',
  },
  {
    taskId: 'TASK 09',
    taskName: 'Error & Response Model',
    file: 'src/cubio/network/protocol/v1/responseEngine.test.ts',
  },
  {
    taskId: 'TASK 10',
    taskName: 'Central Protocol Validation Layer',
    file: 'src/cubio/network/protocol/v1/protocolValidator.test.ts',
  },
  {
    taskId: 'TASK 11',
    taskName: 'Phase 1 Master Foundation Test Suite',
    file: 'src/cubio/network/protocol/v1/phase1Foundation.test.ts',
  },
];

interface SuiteResult {
  readonly suite: SuiteDefinition;
  readonly passed: number;
  readonly failed: number;
  readonly durationMs: number;
  readonly status: 'PASS' | 'FAIL';
  readonly errorOutput?: string;
}

function parseTestCounts(output: string): { passed: number; failed: number } {
  const m1 = output.match(/Results:\s*(\d+)\s*(?:PASSED|passed)[,\s]+(\d+)\s*(?:FAILED|failed)/i);
  if (m1) {
    return { passed: parseInt(m1[1], 10), failed: parseInt(m1[2], 10) };
  }

  const m2 = output.match(/(\d+)\s*(?:passed|PASSED)/);
  const m3 = output.match(/(\d+)\s*(?:failed|FAILED)/);
  if (m2 && m3) {
    return { passed: parseInt(m2[1], 10), failed: parseInt(m3[1], 10) };
  }

  const checkmarks = (output.match(/✓/g) || []).length;
  const crossmarks = (output.match(/✗/g) || []).length;
  return { passed: checkmarks, failed: crossmarks };
}

function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CUBiO AI — Phase 1 Master Test Suite Runner (Tasks 01-11)        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const results: SuiteResult[] = [];
  const startTime = Date.now();

  for (const suite of SUITES) {
    process.stdout.write('Executing [' + suite.taskId + '] ' + suite.taskName.padEnd(38) + ' ... ');
    const suiteStart = Date.now();

    try {
      const output = execSync('npx tsx ' + suite.file, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const durationMs = Date.now() - suiteStart;
      const { passed, failed } = parseTestCounts(output);

      if (failed === 0) {
        console.log('PASS (' + passed + ' tests, ' + durationMs + 'ms)');
        results.push({ suite, passed, failed, durationMs, status: 'PASS' });
      } else {
        console.log('FAIL (' + passed + ' passed, ' + failed + ' failed, ' + durationMs + 'ms)');
        results.push({ suite, passed, failed, durationMs, status: 'FAIL', errorOutput: output });
      }
    } catch (err: any) {
      const durationMs = Date.now() - suiteStart;
      const stdout = err.stdout?.toString() ?? '';
      const stderr = err.stderr?.toString() ?? '';
      const combined = stdout + '\n' + stderr;
      const { passed, failed } = parseTestCounts(combined);

      console.log('FAIL (' + passed + ' passed, ' + Math.max(1, failed) + ' failed, ' + durationMs + 'ms)');
      results.push({
        suite,
        passed,
        failed: Math.max(1, failed),
        durationMs,
        status: 'FAIL',
        errorOutput: combined,
      });
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);
  const allPassed = results.every(r => r.status === 'PASS');

  console.log('\n════════════════════════════════════════════════════════════════════════════');
  console.log('                            FORENSIC AUDIT TABLE                            ');
  console.log('════════════════════════════════════════════════════════════════════════════');
  console.log('TASK    SUITE NAME                               STATUS   PASSED  FAILED   TIME');
  console.log('──────  ──────────────────────────────────────── ───────  ──────  ──────  ─────');

  for (const r of results) {
    const taskId = r.suite.taskId.padEnd(6);
    const name = r.suite.taskName.slice(0, 40).padEnd(40);
    const status = r.status.padEnd(7);
    const passStr = String(r.passed).padStart(6);
    const failStr = String(r.failed).padStart(6);
    const timeStr = (r.durationMs + 'ms').padStart(6);
    console.log(taskId + '  ' + name + ' ' + status + '  ' + passStr + '  ' + failStr + '  ' + timeStr);
  }

  console.log('──────  ──────────────────────────────────────── ───────  ──────  ──────  ─────');
  console.log(
    'TOTAL   11 Phase 1 Protocol Test Suites          ' + (allPassed ? 'PASS' : 'FAIL') + '     ' +
    String(totalPassed).padStart(6) + '  ' + String(totalFailed).padStart(6) + '  ' + totalDurationMs + 'ms\n'
  );

  if (!allPassed) {
    console.error('ERROR: One or more Phase 1 test suites failed. Forensic inspection required.\n');
    for (const r of results) {
      if (r.status === 'FAIL') {
        console.error('─── Failure details for ' + r.suite.taskId + ' (' + r.suite.file + ') ───');
        console.error(r.errorOutput?.slice(0, 500));
        console.error('──────────────────────────────────────────────────────────────────\n');
      }
    }
    process.exit(1);
  } else {
    console.log('CERTIFICATION: All Phase 1 foundation suites PASSED with 0 regressions.\n');
    process.exit(0);
  }
}

main();
