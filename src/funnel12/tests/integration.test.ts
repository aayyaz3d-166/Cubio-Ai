/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-13
 * Funnel 11 Integration & Pipeline Handshake
 */

import { selectCompositeEntries } from '../../funnel11/core/selector';
import { CanonicalComposite } from '../../funnel9/types/canonical';
import {
  CompositeCandidateFamily,
  CompositeCandidateOccurrence,
} from '../../funnel10/types/candidate';
import { decodeCompact3DV4 } from '../core/decoder';
import { encodeHierarchyCompact3DV4 } from '../core/encoder';
import { validateFunnel11SelectionConsistency } from '../core/validator';
import { F12DictionaryEntry } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testFunnel11Integration(): Funnel12TestResult {
  // Build Candidate Family with profitable 4 occurrences of 3-child composite
  const childDictIds = [101, 102, 103];
  const relativeOffsets: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
  const occurrencesOrigins = [
    { x: 0, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
    { x: 0, y: 3, z: 0 },
    { x: 3, y: 3, z: 0 },
  ];

  const canonical: CanonicalComposite = {
    hierarchyLevel: 3,
    signature: 'COMPOSITE{D101@[0,0,0]|D102@[1,0,0]|D103@[0,1,0]}',
    fingerprint: 'INT12345',
    childCount: 3,
    transform: 'TRANSLATION',
    children: childDictIds.map((dictId, idx) => ({
      dictId,
      offset: {
        dx: relativeOffsets[idx][0],
        dy: relativeOffsets[idx][1],
        dz: relativeOffsets[idx][2],
      },
      order: idx,
      transform: 'TRANSLATION',
      hierarchyLevel: 2,
    })),
    relativeBoundingBox: {
      minDx: 0,
      maxDx: 2,
      minDy: 0,
      maxDy: 2,
      minDz: 0,
      maxDz: 2,
      spanX: 3,
      spanY: 3,
      spanZ: 3,
    },
  };

  const occurrences: CompositeCandidateOccurrence[] = occurrencesOrigins.map((orig, occIdx) => {
    const occChildren = childDictIds.map((dictId, cIdx) => {
      const off = relativeOffsets[cIdx];
      const startCellId = (orig.z + off[2]) * 49 + (orig.y + off[1]) * 7 + (orig.x + off[0]);
      const coveredCells = [startCellId, (startCellId + 1) % 343];
      return {
        dictId,
        occurrenceId: `DICT-OCC-${occIdx}-${cIdx}`,
        order: cIdx,
        originCoord: { x: orig.x + off[0], y: orig.y + off[1], z: orig.z + off[2] },
        relativeOffset: { dx: off[0], dy: off[1], dz: off[2] },
        coveredCells,
        sequenceIndices: coveredCells.map((_, i) => occIdx * 10 + i),
        symbols: ['A', 'B'],
        transform: 'TRANSLATION' as const,
      };
    });

    const allCoveredCells = occChildren.flatMap((c) => [...c.coveredCells]);
    const allSeqIndices = occChildren.flatMap((c) => [...c.sequenceIndices]);

    return {
      occurrenceId: `COMP-OCC-${occIdx}`,
      blockId: 0,
      originCoord: { x: orig.x, y: orig.y, z: orig.z },
      originCellId: orig.z * 49 + orig.y * 7 + orig.x,
      children: occChildren,
      childCount: 3,
      coveredCells: allCoveredCells,
      sequenceIndices: allSeqIndices,
      transform: 'TRANSLATION' as const,
      canonical,
      signature: 'COMPOSITE{D101@[0,0,0]|D102@[1,0,0]|D103@[0,1,0]}',
      fingerprint: 'INT12345',
    };
  });

  const family: CompositeCandidateFamily = {
    signature: 'COMPOSITE{D101@[0,0,0]|D102@[1,0,0]|D103@[0,1,0]}',
    fingerprint: 'INT12345',
    canonical,
    occurrences,
    occurrenceCount: occurrences.length,
    blockIds: [0],
    totalCoveredCells: occurrences.reduce((sum, o) => sum + o.coveredCells.length, 0),
  };

  // Define dictionary entries for Level 2 children (2 cells each)
  const dictEntries: F12DictionaryEntry[] = childDictIds.map((dictId) => ({
    dictId,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 0, dy: 0, dz: 1 }],
    symbol: 'X',
    flags: 0,
  }));

  // Run Funnel 11 Selector
  const selection = selectCompositeEntries([family]);

  // Run Funnel 12 Encoder
  const artifact = encodeHierarchyCompact3DV4({
    memory: [],
    selectionResult: selection,
    dictionary: dictEntries,
  });

  // Validate Handshake Consistency
  const validation = validateFunnel11SelectionConsistency(selection, artifact);

  // Decode artifact independently
  const decodeResult = decodeCompact3DV4(artifact.binaryBuffer);

  const passed = (
    selection.selectedEntries.length === 1 &&
    validation.isValid &&
    decodeResult.success &&
    decodeResult.counts.compositeDefs === 1 &&
    decodeResult.counts.compositeRefs === 4
  );

  return {
    testId: 'TC-F12-13',
    name: 'Funnel 11 Integration',
    passed,
    details: passed
      ? `Funnel 11 selection passed cleanly into compact3d-v4 encoding and independent decoding (Selected: 1 composite, 4 occurrences).`
      : `Funnel 11 integration failed: validation.isValid=${validation.isValid}, decodeResult.success=${decodeResult.success}`,
    artifactBytes: artifact.byteLength,
  };
}
