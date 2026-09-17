/**
 * Test TC-F11-01: Repeated Profitable Composite
 * 
 * Verifies that a composite with sufficient repetitions produces actual net byte savings
 * when serialized to binary buffers, and is accepted into the final selection.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { scoreCandidateFamily } from '../core/scorer';
import { selectCompositeEntries } from '../core/selector';
import { serializeCompositeDefinition, serializeCompositeReference } from '../core/serializer';

export function testRepeatedProfitableComposite(): { passed: boolean; details: string } {
  // 3 children, 6 occurrences
  // Definition cost: 9 + 3*8 = 33 bytes
  // Reference cost: 6 * 12 = 72 bytes
  // Total composite cost: 33 + 72 = 105 bytes
  // Expanded cost: 6 * (3 * 9) = 162 bytes
  // Net savings: 162 - 105 = 57 bytes (35.18% reduction)
  const family = createBenchmarkCandidateFamily(
    'COMPOSITE{D1@[0,0,0]|D2@[1,0,0]|D3@[0,1,0]}',
    [1, 2, 3],
    [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
    ]
  );

  const score = scoreCandidateFamily(family);

  if (!score.isProfitable || score.status !== 'ACCEPTED') {
    return {
      passed: false,
      details: `Expected candidate to be accepted, got status: ${score.status} (${score.diagnosticMessage})`,
    };
  }

  if (score.cost.actualSavings !== 57) {
    return {
      passed: false,
      details: `Expected actual savings of 57 bytes, got ${score.cost.actualSavings} bytes`,
    };
  }

  // Verify binary buffer generation
  const defBuffer = serializeCompositeDefinition(family.canonical, 1);
  if (defBuffer.length !== 33) {
    return {
      passed: false,
      details: `Expected serialized definition length of 33 bytes, got ${defBuffer.length}`,
    };
  }

  const refBuffer = serializeCompositeReference(family.occurrences[0], 1);
  if (refBuffer.length !== 12) {
    return {
      passed: false,
      details: `Expected serialized reference length of 12 bytes, got ${refBuffer.length}`,
    };
  }

  // Verify selection pipeline accepts it
  const selection = selectCompositeEntries([family]);
  if (selection.selectedEntries.length !== 1) {
    return {
      passed: false,
      details: `Expected 1 selected entry, got ${selection.selectedEntries.length}`,
    };
  }

  if (selection.aggregateMetrics.netSavingsBytes !== 57) {
    return {
      passed: false,
      details: `Expected aggregate net savings of 57 bytes, got ${selection.aggregateMetrics.netSavingsBytes}`,
    };
  }

  return {
    passed: true,
    details: `Successfully verified repeated profitable composite with 57B net savings (${score.cost.reductionPercent}% reduction, ${score.cost.compressionRatio}x ratio).`,
  };
}
