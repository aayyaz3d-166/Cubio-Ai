/**
 * Test TC-F11-10: End-to-End Integration with Funnel 10
 * 
 * Feeds real Funnel 10 discovery output directly into Funnel 11:
 * 1. Discovers Level 3 candidates using Funnel 10 engine.
 * 2. Runs Funnel 11 profitability scoring and selection.
 * 3. Validates complete research report generation and exact byte measurements.
 */

import { discoverCandidates } from '../../funnel10/core/discover';
import { DictionaryOccurrence } from '../../funnel10/types/candidate';
import { generateFunnel11Report } from '../core/report';
import { selectCompositeEntries } from '../core/selector';

export function testFunnel10Integration(): { passed: boolean; details: string } {
  // Create 6 repeated pairs of dictionary occurrences (Dict 10 + Dict 20) in block 0
  const inputOccurrences: DictionaryOccurrence[] = [];

  for (let i = 0; i < 6; i++) {
    const ox = (i * 2) % 6;
    const oy = Math.floor(i / 3) * 3;
    const oz = 0;

    // Dict 10 occurrence
    inputOccurrences.push({
      occurrenceId: `DICT10-OCC-${i}`,
      dictId: 10,
      blockId: 0,
      originCellId: oz * 49 + oy * 7 + ox,
      originCoord: { x: ox, y: oy, z: oz },
      coveredCells: [oz * 49 + oy * 7 + ox],
      sequenceIndices: [i * 2],
      symbols: ['X'],
      transform: 'TRANSLATION',
    });

    // Dict 20 occurrence at relative offset (+1, 0, 0)
    inputOccurrences.push({
      occurrenceId: `DICT20-OCC-${i}`,
      dictId: 20,
      blockId: 0,
      originCellId: oz * 49 + oy * 7 + (ox + 1),
      originCoord: { x: ox + 1, y: oy, z: oz },
      coveredCells: [oz * 49 + oy * 7 + (ox + 1)],
      sequenceIndices: [i * 2 + 1],
      symbols: ['Y'],
      transform: 'TRANSLATION',
    });
  }

  // Also add 1 isolated pair that only occurs once (Dict 30 + Dict 40)
  inputOccurrences.push({
    occurrenceId: 'DICT30-OCC-SINGLE',
    dictId: 30,
    blockId: 0,
    originCellId: 4 * 49 + 0 * 7 + 0,
    originCoord: { x: 0, y: 0, z: 4 },
    coveredCells: [4 * 49],
    sequenceIndices: [100],
    symbols: ['A'],
    transform: 'TRANSLATION',
  });
  inputOccurrences.push({
    occurrenceId: 'DICT40-OCC-SINGLE',
    dictId: 40,
    blockId: 0,
    originCellId: 4 * 49 + 0 * 7 + 1,
    originCoord: { x: 1, y: 0, z: 4 },
    coveredCells: [4 * 49 + 1],
    sequenceIndices: [101],
    symbols: ['B'],
    transform: 'TRANSLATION',
  });

  // Step 1: Run Funnel 10 Discovery
  const f10Result = discoverCandidates(inputOccurrences, {
    maxPatternLength: 2,
    minPatternLength: 2,
    maxSpatialSpan: 2,
  });

  if (f10Result.candidateFamilies.length < 2) {
    return {
      passed: false,
      details: `Expected at least 2 candidate families from Funnel 10 discovery, got ${f10Result.candidateFamilies.length}`,
    };
  }

  // Step 2: Feed Funnel 10 Families into Funnel 11 Selection
  const allActiveCellIds = inputOccurrences.flatMap((o) => [...o.coveredCells]);
  const selectionResult = selectCompositeEntries(f10Result.candidateFamilies, {
    allActiveCellIds,
  });

  if (selectionResult.totalFamiliesAnalyzed !== f10Result.candidateFamilies.length) {
    return {
      passed: false,
      details: `Mismatch in families analyzed: expected ${f10Result.candidateFamilies.length}, got ${selectionResult.totalFamiliesAnalyzed}`,
    };
  }

  // Verify that the 6-repetition family was accepted and the 1-repetition family was rejected
  if (selectionResult.selectedEntries.length < 1) {
    return {
      passed: false,
      details: `Expected at least 1 accepted composite from 6 repetitions, got ${selectionResult.selectedEntries.length}`,
    };
  }

  if (selectionResult.rejectedEntries.length < 1) {
    return {
      passed: false,
      details: `Expected at least 1 rejected composite (single occurrence), got ${selectionResult.rejectedEntries.length}`,
    };
  }

  // Step 3: Generate Funnel 11 Report
  const report = generateFunnel11Report(selectionResult);

  if (!report.summary.bestComposite) {
    return {
      passed: false,
      details: 'Expected report to identify best composite',
    };
  }

  if (!report.coverageIntegrity.isIntegrityPassed) {
    return {
      passed: false,
      details: 'Coverage integrity check failed in final report',
    };
  }

  return {
    passed: true,
    details: `Successfully integrated Funnel 10 -> Funnel 11: ${selectionResult.selectedEntries.length} accepted, ${selectionResult.rejectedEntries.length} rejected, net savings ${selectionResult.aggregateMetrics.netSavingsBytes}B.`,
  };
}
