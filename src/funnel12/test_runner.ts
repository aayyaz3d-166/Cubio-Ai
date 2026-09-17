/**
 * 3D Memory Studio - Funnel 12: Comprehensive Test Suite Runner
 * 
 * Runs all 15 test cases verifying:
 * - TC-F12-01: Basic hierarchical encoding
 * - TC-F12-02: Independent decoding
 * - TC-F12-03: Exact roundtrip
 * - TC-F12-04: Sequence preservation
 * - TC-F12-05: Block preservation
 * - TC-F12-06: Composite translation reconstruction
 * - TC-F12-07: Composite + primitive + RAW mixture
 * - TC-F12-08: Coverage exactness
 * - TC-F12-09: Checksum verification
 * - TC-F12-10: Corrupted artifact rejection
 * - TC-F12-11: 100x deterministic encoding
 * - TC-F12-12: Input-order independence
 * - TC-F12-13: Funnel 11 integration
 * - TC-F12-14: High-entropy dataset
 * - TC-F12-15: Large repeated geometry
 */

import { testBlockPreservation } from './tests/block.test';
import { testChecksumVerification } from './tests/checksum.test';
import { testCorruptedArtifactRejection } from './tests/corruption.test';
import { testCoverageExactness } from './tests/coverage.test';
import { testIndependentDecoding } from './tests/decoding.test';
import { testDeterministicEncoding100x } from './tests/deterministic.test';
import { testBasicHierarchicalEncoding } from './tests/encoding.test';
import { testHighEntropyDataset } from './tests/entropy.test';
import { testLargeRepeatedGeometry } from './tests/geometry.test';
import { testFunnel11Integration } from './tests/integration.test';
import { testCompositePrimitiveRawMixture } from './tests/mixture.test';
import { testInputOrderIndependence } from './tests/ordering.test';
import { testExactRoundtrip } from './tests/roundtrip.test';
import { testSequencePreservation } from './tests/sequence.test';
import { testCompositeTranslationReconstruction } from './tests/translation.test';
import { Funnel12SuiteReport, Funnel12TestResult } from './types/report';

export function runAllFunnel12Tests(): Funnel12SuiteReport {
  const startTime = performance.now();
  const results: Funnel12TestResult[] = [];

  const testFunctions: (() => Funnel12TestResult)[] = [
    testBasicHierarchicalEncoding,
    testIndependentDecoding,
    testExactRoundtrip,
    testSequencePreservation,
    testBlockPreservation,
    testCompositeTranslationReconstruction,
    testCompositePrimitiveRawMixture,
    testCoverageExactness,
    testChecksumVerification,
    testCorruptedArtifactRejection,
    testDeterministicEncoding100x,
    testInputOrderIndependence,
    testFunnel11Integration,
    testHighEntropyDataset,
    testLargeRepeatedGeometry,
  ];

  for (const testFn of testFunctions) {
    const t0 = performance.now();
    try {
      const res = testFn();
      results.push({
        ...res,
        durationMs: performance.now() - t0,
      });
    } catch (err: any) {
      results.push({
        testId: 'TC-F12-ERR',
        name: testFn.name,
        passed: false,
        details: `Exception thrown during execution: ${err?.message || String(err)}`,
        durationMs: performance.now() - t0,
      });
    }
  }

  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.length - passedTests;
  const allPassed = failedTests === 0;
  const totalDurationMs = performance.now() - startTime;

  return {
    suiteName: 'Funnel 12 — Hierarchical Compact Encoding & Independent Decoder',
    totalTests: results.length,
    passedTests,
    failedTests,
    allPassed,
    totalDurationMs,
    results,
  };
}
