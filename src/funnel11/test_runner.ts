/**
 * 3D Memory Studio - Funnel 11 Test Suite Runner
 * 
 * Runs all 10 Funnel 11 verification test cases and returns structured results.
 */

import {
  testCoverageConflictResolution,
  testCrossBlockRejection,
  testDefinitionMetadataCost,
  testDeterministicExecution,
  testFunnel10Integration,
  testHighEntropy,
  testNoActualSavingsRejection,
  testReferenceMetadataCost,
  testRepeatedProfitableComposite,
  testSingleOccurrence,
} from './tests';

export interface Funnel11TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
}

export interface Funnel11SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly results: readonly Funnel11TestResult[];
}

export function runFunnel11TestSuite(): Funnel11SuiteReport {
  const tests: { id: string; name: string; fn: () => { passed: boolean; details: string } }[] = [
    {
      id: 'TC-F11-01',
      name: 'Repeated Profitable Composite Byte Proof',
      fn: testRepeatedProfitableComposite,
    },
    {
      id: 'TC-F11-02',
      name: 'Single Occurrence Math-Driven Evaluation',
      fn: testSingleOccurrence,
    },
    {
      id: 'TC-F11-03',
      name: 'Definition Metadata Exact Binary Cost',
      fn: testDefinitionMetadataCost,
    },
    {
      id: 'TC-F11-04',
      name: 'Reference Metadata Exact Binary Cost',
      fn: testReferenceMetadataCost,
    },
    {
      id: 'TC-F11-05',
      name: 'Rejection When Total Cost >= Expanded Child Cost',
      fn: testNoActualSavingsRejection,
    },
    {
      id: 'TC-F11-06',
      name: '100% Deterministic Execution (100 Iterations)',
      fn: testDeterministicExecution,
    },
    {
      id: 'TC-F11-07',
      name: 'High Entropy Resistance (Zero Artificial Savings)',
      fn: testHighEntropy,
    },
    {
      id: 'TC-F11-08',
      name: 'Cross-Block Candidate Strict Rejection',
      fn: testCrossBlockRejection,
    },
    {
      id: 'TC-F11-09',
      name: 'Deterministic Overlap Conflict Resolution',
      fn: testCoverageConflictResolution,
    },
    {
      id: 'TC-F11-10',
      name: 'End-to-End Integration with Funnel 10 Discovery',
      fn: testFunnel10Integration,
    },
  ];

  const results: Funnel11TestResult[] = [];
  let passedCount = 0;

  for (const t of tests) {
    try {
      const res = t.fn();
      if (res.passed) passedCount++;
      results.push({
        testId: t.id,
        name: t.name,
        passed: res.passed,
        details: res.details,
      });
    } catch (err) {
      results.push({
        testId: t.id,
        name: t.name,
        passed: false,
        details: `Exception thrown: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return {
    suiteName: 'Funnel 11: Composite Profitability & Selection Test Suite',
    totalTests: tests.length,
    passedTests: passedCount,
    failedTests: tests.length - passedCount,
    allPassed: passedCount === tests.length,
    results,
  };
}
