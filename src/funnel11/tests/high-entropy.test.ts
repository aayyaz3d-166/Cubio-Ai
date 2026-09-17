/**
 * Test TC-F11-07: High Entropy & Incompressible Data
 * 
 * Verifies that high-entropy or noisy data produces zero profitable composite candidates,
 * preventing artificial or false positive compression claims.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { selectCompositeEntries } from '../core/selector';

export function testHighEntropy(): { passed: boolean; details: string } {
  // Generate 8 unique candidate families with only 1 occurrence each (simulating random noise)
  const noisyFamilies = Array.from({ length: 8 }, (_, i) => {
    const dictId1 = 500 + i * 2;
    const dictId2 = 501 + i * 2;
    return createBenchmarkCandidateFamily(
      `COMPOSITE{D${dictId1}@[0,0,0]|D${dictId2}@[${(i % 3) + 1},${(i % 2) + 1},0]}`,
      [dictId1, dictId2],
      [[0, 0, 0], [(i % 3) + 1, (i % 2) + 1, 0]],
      [{ x: (i * 2) % 6, y: (i * 2) % 6, z: (i % 3) }] // exactly 1 occurrence per unique pattern
    );
  });

  const result = selectCompositeEntries(noisyFamilies);

  // Must reject 100% of the noisy single-occurrence candidates
  if (result.selectedEntries.length !== 0) {
    return {
      passed: false,
      details: `Expected 0 profitable composites from high entropy noise, got ${result.selectedEntries.length} accepted`,
    };
  }

  if (result.rejectedEntries.length !== 8) {
    return {
      passed: false,
      details: `Expected 8 rejected entries, got ${result.rejectedEntries.length}`,
    };
  }

  if (result.aggregateMetrics.netSavingsBytes !== 0) {
    return {
      passed: false,
      details: `Expected 0 bytes net savings, got ${result.aggregateMetrics.netSavingsBytes} bytes`,
    };
  }

  return {
    passed: true,
    details: 'Successfully verified that high-entropy noise generates 0 profitable candidates and 0 false savings.',
  };
}
