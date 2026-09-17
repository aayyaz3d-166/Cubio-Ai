/**
 * 3D Memory Studio - Funnel 10: Composite Discovery Pipeline Engine
 * 
 * Implements the deterministic discovery pipeline to find repeated Level 3 composite
 * compositions from Level 2 dictionary occurrences.
 * 
 * Pipeline Phases:
 * 1. Read Level 2 dictionary occurrences and validate inputs.
 * 2. Partition occurrences strictly by memory block (Single-Block constraint).
 * 3. Identify candidate compositions of dictionary patterns (windows of size k >= 2 or explicit groupings).
 * 4. Perform Funnel 9 canonicalization to remove global origins and obtain invariant signatures.
 * 5. Group candidates into canonical families using collision-safe verification.
 * 6. Run independent verification over all candidates.
 * 7. Produce a fully deterministic DiscoveryResult.
 */

import { canonicalizeComposite } from '../../funnel9/core/canonicalizer';
import { RawCompositeInput } from '../../funnel9/types/canonical';
import {
  CandidateRejectionReason,
  CompositeCandidateFamily,
  CompositeCandidateOccurrence,
  CompositeChildOccurrence,
  DictionaryOccurrence,
  FUNNEL10_TRANSFORM,
  RejectedCandidate,
} from '../types/candidate';
import { DiscoveryOptions, DiscoveryResult } from '../types/discovery';
import { groupCandidatesIntoFamilies } from './grouping';
import { validateChildOccurrences, verifyCandidateOccurrence } from './verifier';

/**
 * Creates a unique deterministic occurrence ID for a candidate composite
 */
function generateCandidateOccurrenceId(
  blockId: number,
  originCellId: number,
  childDictIds: readonly number[],
  seqStart: number
): string {
  return `CAND_B${blockId}_C${originCellId}_D[${childDictIds.join('-')}]_S${seqStart}`;
}

/**
 * Executes the complete candidate discovery pipeline.
 */
export function discoverCandidates(
  occurrences: readonly DictionaryOccurrence[],
  options: DiscoveryOptions = {}
): DiscoveryResult {
  const minK = options.minPatternLength !== undefined ? Math.max(2, options.minPatternLength) : 2;
  const maxK = options.maxPatternLength !== undefined ? Math.min(8, options.maxPatternLength) : 4;
  const maxSpatialSpan = options.maxSpatialSpan !== undefined ? options.maxSpatialSpan : 64;
  const maxSequenceSpan = options.maxSequenceSpan !== undefined ? options.maxSequenceSpan : 1000;

  const discoveredCandidates: CompositeCandidateOccurrence[] = [];
  const rejectedCandidates: RejectedCandidate[] = [];
  const rejectionCounts: Record<CandidateRejectionReason, number> = {
    CROSS_BLOCK_COMPOSITE: 0,
    INVALID_CHILD: 0,
    INVALID_TRANSLATION: 0,
    EMPTY_CANDIDATE: 0,
    CANONICALIZATION_FAILED: 0,
    SEQUENCE_METADATA_MISSING: 0,
    INVALID_DICTIONARY_REFERENCE: 0,
    UNSUPPORTED_TRANSFORM: 0,
  };

  function addRejection(
    candidateId: string,
    reason: CandidateRejectionReason,
    message: string,
    blockId?: number,
    childDictIds?: readonly number[],
    rawChildrenCount?: number
  ) {
    rejectionCounts[reason] = (rejectionCounts[reason] || 0) + 1;
    rejectedCandidates.push(
      Object.freeze({
        candidateId,
        reason,
        message,
        blockId,
        childDictIds,
        rawChildrenCount,
      })
    );
  }

  // 1. Process explicit groupings if supplied in options
  if (options.explicitGroupings && options.explicitGroupings.length > 0) {
    const occMap = new Map<string, DictionaryOccurrence>();
    for (const occ of occurrences) {
      occMap.set(occ.occurrenceId, occ);
    }

    for (let gIdx = 0; gIdx < options.explicitGroupings.length; gIdx++) {
      const groupIds = options.explicitGroupings[gIdx];
      const childOccs: DictionaryOccurrence[] = [];
      let missingId = false;

      for (const id of groupIds) {
        const found = occMap.get(id);
        if (found) {
          childOccs.push(found);
        } else {
          missingId = true;
          addRejection(
            `EXPLICIT_GRP_${gIdx}`,
            'INVALID_CHILD',
            `Explicit grouping referenced non-existent occurrence '${id}'.`,
            undefined,
            undefined,
            groupIds.length
          );
          break;
        }
      }

      if (missingId) continue;

      processCandidateGroup(childOccs, `EXPLICIT_GRP_${gIdx}`);
    }
  } else {
    // 2. Automatic Discovery: Group by memory block
    const blockMap = new Map<number, DictionaryOccurrence[]>();
    for (const occ of occurrences) {
      const bList = blockMap.get(occ.blockId) || [];
      bList.push(occ);
      blockMap.set(occ.blockId, bList);
    }

    // Sort blocks deterministically
    const sortedBlockIds = Array.from(blockMap.keys()).sort((a, b) => a - b);

    for (const bId of sortedBlockIds) {
      const blockOccs = blockMap.get(bId)!;

      // Sort occurrences within the block by sequence order
      blockOccs.sort((a, b) => {
        const minSeqA = a.sequenceIndices && a.sequenceIndices.length > 0 ? a.sequenceIndices[0] : 0;
        const minSeqB = b.sequenceIndices && b.sequenceIndices.length > 0 ? b.sequenceIndices[0] : 0;
        if (minSeqA !== minSeqB) return minSeqA - minSeqB;
        if (a.originCellId !== b.originCellId) return a.originCellId - b.originCellId;
        return a.occurrenceId.localeCompare(b.occurrenceId);
      });

      // Discover n-grams of sizes from minK to maxK
      for (let k = minK; k <= maxK; k++) {
        if (blockOccs.length < k) continue;

        for (let i = 0; i <= blockOccs.length - k; i++) {
          const windowOccs = blockOccs.slice(i, i + k);

          // Verify spatial and sequence span bounds
          const firstOcc = windowOccs[0];
          const lastOcc = windowOccs[windowOccs.length - 1];

          const seqSpan =
            (lastOcc.sequenceIndices[lastOcc.sequenceIndices.length - 1] || 0) -
            (firstOcc.sequenceIndices[0] || 0);

          if (seqSpan > maxSequenceSpan) {
            continue;
          }

          let exceedsSpatial = false;
          for (let j = 1; j < windowOccs.length; j++) {
            const dx = Math.abs(windowOccs[j].originCoord.x - firstOcc.originCoord.x);
            const dy = Math.abs(windowOccs[j].originCoord.y - firstOcc.originCoord.y);
            const dz = Math.abs(windowOccs[j].originCoord.z - firstOcc.originCoord.z);
            if (dx > maxSpatialSpan || dy > maxSpatialSpan || dz > maxSpatialSpan) {
              exceedsSpatial = true;
              break;
            }
          }

          if (exceedsSpatial) {
            continue;
          }

          const candId = `AUTO_B${bId}_I${i}_K${k}`;
          processCandidateGroup(windowOccs, candId);
        }
      }
    }
  }

  function processCandidateGroup(children: readonly DictionaryOccurrence[], tempId: string): void {
    // A. Validation
    const validation = validateChildOccurrences(children);
    if (!validation.isValid) {
      addRejection(
        tempId,
        validation.reason || 'INVALID_CHILD',
        validation.message || 'Validation failed',
        children[0]?.blockId,
        children.map((c) => c.dictId),
        children.length
      );
      return;
    }

    const firstChild = children[0];
    const blockId = firstChild.blockId;
    const originCellId = firstChild.originCellId;
    const originCoord = firstChild.originCoord;

    // B. Build Funnel 9 RawCompositeInput
    const rawChildren = children.map((c, idx) => ({
      dictId: c.dictId,
      position: c.originCoord,
      order: idx,
      transform: FUNNEL10_TRANSFORM,
      transformMetadata: c.transformMetadata,
    }));

    const rawInput: RawCompositeInput = {
      origin: originCoord,
      children: rawChildren,
      transform: FUNNEL10_TRANSFORM,
    };

    // C. Canonicalize via Funnel 9
    const canonResult = canonicalizeComposite(rawInput);
    if (!canonResult.success || !canonResult.canonical) {
      addRejection(
        tempId,
        'CANONICALIZATION_FAILED',
        `Funnel 9 Canonicalization failed: ${canonResult.error}`,
        blockId,
        children.map((c) => c.dictId),
        children.length
      );
      return;
    }

    const canonical = canonResult.canonical;

    // D. Build Child Occurrences with exact relative offsets
    const childOccurrences: CompositeChildOccurrence[] = [];
    const allCoveredCells: number[] = [];
    const allSequenceIndices: number[] = [];

    for (let idx = 0; idx < children.length; idx++) {
      const c = children[idx];
      const relDx = c.originCoord.x - originCoord.x;
      const relDy = c.originCoord.y - originCoord.y;
      const relDz = c.originCoord.z - originCoord.z;

      childOccurrences.push(
        Object.freeze({
          dictId: c.dictId,
          occurrenceId: c.occurrenceId,
          order: idx,
          originCoord: c.originCoord,
          relativeOffset: Object.freeze({ dx: relDx, dy: relDy, dz: relDz }),
          coveredCells: Object.freeze([...c.coveredCells]),
          sequenceIndices: Object.freeze([...c.sequenceIndices]),
          symbols: c.symbols ? Object.freeze([...c.symbols]) : undefined,
          transform: FUNNEL10_TRANSFORM,
          transformMetadata: c.transformMetadata,
        })
      );

      for (const cellId of c.coveredCells) {
        allCoveredCells.push(cellId);
      }
      for (const seqIdx of c.sequenceIndices) {
        allSequenceIndices.push(seqIdx);
      }
    }

    const seqStart = allSequenceIndices.length > 0 ? allSequenceIndices[0] : 0;
    const finalOccurrenceId = generateCandidateOccurrenceId(
      blockId,
      originCellId,
      children.map((c) => c.dictId),
      seqStart
    );

    const candidateOccurrence: CompositeCandidateOccurrence = Object.freeze({
      occurrenceId: finalOccurrenceId,
      blockId,
      originCoord,
      originCellId,
      children: Object.freeze(childOccurrences),
      childCount: childOccurrences.length,
      coveredCells: Object.freeze(allCoveredCells),
      sequenceIndices: Object.freeze(allSequenceIndices),
      transform: FUNNEL10_TRANSFORM,
      canonical,
      signature: canonical.signature,
      fingerprint: canonical.fingerprint,
    });

    // E. Verify candidate independently
    const verification = verifyCandidateOccurrence(candidateOccurrence);
    if (!verification.isValid) {
      addRejection(
        finalOccurrenceId,
        verification.rejectionReason || 'INVALID_CHILD',
        `Verification failed: ${verification.issues.join('; ')}`,
        blockId,
        children.map((c) => c.dictId),
        children.length
      );
      return;
    }

    discoveredCandidates.push(candidateOccurrence);
  }

  // 3. Group discovered candidates into canonical families
  const candidateFamilies = groupCandidatesIntoFamilies(discoveredCandidates);

  return Object.freeze({
    discoveredCandidates: Object.freeze(discoveredCandidates),
    candidateFamilies: Object.freeze(candidateFamilies),
    rejectedCandidates: Object.freeze(rejectedCandidates),
    rejectionReasons: Object.freeze(rejectionCounts),
    totalInputOccurrences: occurrences.length,
    totalCandidates: discoveredCandidates.length,
    totalFamilies: candidateFamilies.length,
    totalRejected: rejectedCandidates.length,
    statusMessage: `Discovery completed: Found ${discoveredCandidates.length} candidate occurrences across ${candidateFamilies.length} canonical families (${rejectedCandidates.length} rejected).`,
  });
}
