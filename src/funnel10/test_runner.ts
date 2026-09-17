/**
 * 3D Memory Studio - Funnel 10 Test Suite Runner
 * 
 * Runs all 10 Funnel 10 verification test cases and returns structured results.
 */

import {
  testCanonicalGrouping,
  testCandidateVerification,
  testCrossBlockRejection,
  testDeterministicDiscovery,
  testHighEntropy,
  testRepeatedPrimitiveGroup,
  testSequenceOrder,
  testSimilarNonIdentical,
  testSingleOccurrence,
  testTranslatedRepeat,
} from './tests';

export interface Funnel10TestResult {
  testId: string;
  name: string;
  passed: boolean;
  details: string;
}

export interface Funnel10SuiteReport {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  allPassed: boolean;
  results: Funnel10TestResult[];
}

export function runFunnel10TestSuite(): Funnel10SuiteReport {
  const tests: { id: string; name: string; fn: () => { passed: boolean; details: string } }[] = [
    {
      id: 'TC-F10-01',
      name: 'Repeated Primitive Group Discovery',
      fn: testRepeatedPrimitiveGroup,
    },
    {
      id: 'TC-F10-02',
      name: 'Translated Repeat Canonical Identity',
      fn: testTranslatedRepeat,
    },
    {
      id: 'TC-F10-03',
      name: 'Similar but Non-Identical Composition Separation',
      fn: testSimilarNonIdentical,
    },
    {
      id: 'TC-F10-04',
      name: 'Single Occurrence Discovery without Premature Rejection',
      fn: testSingleOccurrence,
    },
    {
      id: 'TC-F10-05',
      name: 'Cross-Block Candidate Rejection',
      fn: testCrossBlockRejection,
    },
    {
      id: 'TC-F10-06',
      name: 'Sequence Order Preservation',
      fn: testSequenceOrder,
    },
    {
      id: 'TC-F10-07',
      name: 'Canonical Grouping Across 3D Coordinates',
      fn: testCanonicalGrouping,
    },
    {
      id: 'TC-F10-08',
      name: 'High Entropy Resistance',
      fn: testHighEntropy,
    },
    {
      id: 'TC-F10-09',
      name: '100% Deterministic Execution',
      fn: testDeterministicDiscovery,
    },
    {
      id: 'TC-F10-10',
      name: 'Independent Candidate Verifier Engine',
      fn: testCandidateVerification,
    },
  ];

  const results: Funnel10TestResult[] = [];
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
    suiteName: 'Funnel 10: Composite Discovery Test Suite',
    totalTests: tests.length,
    passedTests: passedCount,
    failedTests: tests.length - passedCount,
    allPassed: passedCount === tests.length,
    results,
  };
}
