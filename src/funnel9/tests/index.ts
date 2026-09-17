/**
 * Funnel 9 Test Suite Aggregator
 */

import { testChildIdentity } from './childIdentity.test';
import { testHashCollisionSafety } from './collision.test';
import { testDeterminism } from './determinism.test';
import { testDifferenceReporting } from './difference.test';
import { testEqualityAndRoundtrip } from './equality.test';
import { testOffsets } from './offsets.test';
import { testOrdering } from './ordering.test';
import { testOriginInvariance } from './origin.test';
import { testSignatureAndEdgeCases } from './signature.test';
import { testTransform } from './transform.test';

export interface Funnel9TestResult {
  readonly id: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
}

export function runFunnel9Tests(): readonly Funnel9TestResult[] {
  const tests: { id: string; name: string; fn: () => { passed: boolean; details: string } }[] = [
    {
      id: 'TC-F9-01-ORIGIN-INVARIANCE',
      name: 'Same Pattern Different Origin (Origin Invariance)',
      fn: testOriginInvariance,
    },
    {
      id: 'TC-F9-02-OFFSETS-NEGATIVE-OFFSETS',
      name: 'Relative Offsets & Negative Offset Normalization',
      fn: testOffsets,
    },
    {
      id: 'TC-F9-03-CHILD-IDENTITY',
      name: 'Child Dictionary ID Identity Verification',
      fn: testChildIdentity,
    },
    {
      id: 'TC-F9-04-CHILD-ORDERING',
      name: 'Logical Child Ordering Invariant Verification',
      fn: testOrdering,
    },
    {
      id: 'TC-F9-05-TRANSFORM-RESTRICTION',
      name: 'Translation Support & Unsupported Transform Rejection',
      fn: testTransform,
    },
    {
      id: 'TC-F9-06-EQUALITY-AND-ROUNDTRIP',
      name: 'Strict Canonical Equality & Serialization Roundtrip',
      fn: testEqualityAndRoundtrip,
    },
    {
      id: 'TC-F9-07-DIFFERENCE-REPORTING',
      name: 'Diagnostic Difference Detection (Count/Dict/Offset)',
      fn: testDifferenceReporting,
    },
    {
      id: 'TC-F9-08-HASH-COLLISION-SAFETY',
      name: 'Hash Collision Protection & Two-Stage Resolution',
      fn: testHashCollisionSafety,
    },
    {
      id: 'TC-F9-09-DETERMINISM',
      name: 'Deterministic Byte-for-Byte Output Verification (100x)',
      fn: testDeterminism,
    },
    {
      id: 'TC-F9-10-SIGNATURE-AND-EDGE-CASES',
      name: 'Signature Format, Single-Child, & Empty Composite Handling',
      fn: testSignatureAndEdgeCases,
    },
  ];

  return tests.map((t) => {
    const result = t.fn();
    return {
      id: t.id,
      name: t.name,
      passed: result.passed,
      details: result.details,
    };
  });
}
