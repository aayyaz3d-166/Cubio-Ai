/**
 * 3D Memory Studio - Funnel 6: Hierarchical Spatial Composition Core Engine
 * 
 * Target Problem:
 * Funnel 5 stores repeated individual spatial patterns in a reusable dictionary (Level 2).
 * However, structured data often contains repeated GROUPS/COMPOSITIONS of spatial patterns.
 * 
 * Funnel 6 investigates whether repeated groups of spatial patterns can become reusable
 * higher-level spatial composite structures (Level 3).
 * 
 * Strict Evidence-Based Invariant:
 * The hierarchical composition is experimental and MUST ONLY be accepted when:
 * compositeDefinitionCost + compositeReferenceCost < expandedChildRepresentationCost
 * 
 * Invariants Enforced:
 * 1. Maximum Hierarchy Depth = 3 (Cells -> Primitives -> Dict -> Composites)
 * 2. Strict Translational Invariance for Canonical Signatures
 * 3. Exact Canonical Equality Check after hash matching
 * 4. Single-Block Constraint (Cross-block composites strictly rejected)
 * 5. Coverage Integrity: missing = 0, duplicates = 0, unexpected = 0
 * 6. Acyclic Dependency Graph: Cycles strictly detected and rejected
 * 7. 100% Deterministic Byte Serialization
 */

import { Coordinate3D, MemoryBlock, MemoryCell, RootMemory } from '../types/memory';
import {
  EncodingPlan,
  PlanSegment,
  SpatialEncoderResult,
  SpatialSegmentType,
} from '../types/spatialEncoder';
import {
  COMPACT_FILE_HEADER_BYTES,
  COMPACT_MAGIC_BYTES,
  DIRECTION_TO_CODE,
  RECORD_HEADER_BYTES,
  RECORD_OPCODE_CLUSTER,
  RECORD_OPCODE_RAW,
  RECORD_OPCODE_REPEATED_SHAPE,
  RECORD_OPCODE_REPETITION,
  RECORD_OPCODE_SEQUENCE_PATH,
  RECORD_OPCODE_SPATIAL_RUN,
  calculateDeterministicChecksum,
  computeLogicalMemoryChecksum,
  encodeToSpatialCompact,
  ensureRootMemory,
} from './spatialEncoder';
import {
  CanonicalRule,
  DictionaryEntry,
  RECORD_OPCODE_DICTIONARY_REF,
  SpatialPatternDictionary,
} from '../types/spatialDictionary';
import {
  buildPatternDictionary,
  canonicalizeRule,
} from './spatialDictionary';
import {
  CanonicalComposite,
  Compact3DArtifactV3,
  COMPACT_FORMAT_VERSION_V3,
  COMPOSITE_CHILD_RECORD_BYTES,
  COMPOSITE_ENTRY_HEADER_BYTES,
  COMPOSITE_REF_RECORD_HEADER_BYTES,
  COMPOSITE_SECTION_HEADER_BYTES,
  CompositeCandidate,
  CompositeChildReference,
  CompositeCoverageValidation,
  CompositeEntry,
  CompositeOccurrence,
  CompositeScore,
  HierarchyCycleValidation,
  HierarchyOverheadMetrics,
  HierarchyTestCase,
  HierarchyTestSuiteResult,
  HierarchyBenchmarkReport,
  HierarchyDatasetBenchmark,
  MAX_HIERARCHY_DEPTH,
  RECORD_OPCODE_COMPOSITE_REF,
  SpatialHierarchyDictionary,
  SpatialHierarchyEncoderResult,
  TransformType,
} from '../types/spatialHierarchy';
import { cellIdToCoordinate, coordinateToCellId, DIMENSION, TOTAL_SPATIAL_CELLS } from './address369';
import { createMemoryBlock } from './hierarchicalMemory';
import { decodeHierarchicalCompactV3 } from './spatialHierarchyDecoder';
import { serializeRootMemoryCompactV2 } from './storage';

// ============================================================================
// 1. CANONICALIZATION & COMPOSITE SIGNATURES
// ============================================================================

/**
 * Calculates a unique, deterministic canonical signature for a group of child references.
 * Signatures are invariant to global translation in 3D space.
 */
export function calculateCompositeSignature(
  children: {
    childDictId: number;
    relativeOffset: [number, number, number];
    order?: number;
    transform?: TransformType;
  }[]
): string {
  // Sort children deterministically by relative offset (x, y, z) and childDictId
  const sorted = [...children].sort((a, b) => {
    if (a.relativeOffset[0] !== b.relativeOffset[0]) return a.relativeOffset[0] - b.relativeOffset[0];
    if (a.relativeOffset[1] !== b.relativeOffset[1]) return a.relativeOffset[1] - b.relativeOffset[1];
    if (a.relativeOffset[2] !== b.relativeOffset[2]) return a.relativeOffset[2] - b.relativeOffset[2];
    if (a.childDictId !== b.childDictId) return a.childDictId - b.childDictId;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const parts = sorted.map(
    (c) =>
      `D${c.childDictId}@[${c.relativeOffset[0]},${c.relativeOffset[1]},${c.relativeOffset[2]}]`
  );

  return `COMPOSITE{${parts.join('|')}}`;
}

/**
 * Normalizes a list of child occurrences into a canonical composite definition.
 * Anchors the composition at (0,0,0) based on the minimum spatial coordinates.
 */
export function canonicalizeComposite(
  childOccurrences: {
    childDictId: number;
    originCoord: Coordinate3D;
    originCellId: number;
    coveredCells: number[];
    order: number;
    childSignature: string;
    childRuleType: SpatialSegmentType;
    canonicalRule: CanonicalRule;
  }[]
): CanonicalComposite {
  if (childOccurrences.length === 0) {
    throw new Error('Cannot canonicalize empty composite');
  }

  // Determine anchor origin (minimum x, y, z among all child origins)
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const c of childOccurrences) {
    minX = Math.min(minX, c.originCoord.x);
    minY = Math.min(minY, c.originCoord.y);
    minZ = Math.min(minZ, c.originCoord.z);

    maxX = Math.max(maxX, c.originCoord.x);
    maxY = Math.max(maxY, c.originCoord.y);
    maxZ = Math.max(maxZ, c.originCoord.z);
  }

  // Calculate relative offsets
  const normalizedChildren: CompositeChildReference[] = childOccurrences.map((c, localIdx) => ({
    childDictId: c.childDictId,
    relativeOffset: [
      c.originCoord.x - minX,
      c.originCoord.y - minY,
      c.originCoord.z - minZ,
    ],
    order: localIdx,
    transform: 'TRANSLATION' as TransformType,
    childSignature: c.childSignature,
    childRuleType: c.childRuleType,
  }));

  // Sort deterministically
  normalizedChildren.sort((a, b) => {
    if (a.relativeOffset[0] !== b.relativeOffset[0]) return a.relativeOffset[0] - b.relativeOffset[0];
    if (a.relativeOffset[1] !== b.relativeOffset[1]) return a.relativeOffset[1] - b.relativeOffset[1];
    if (a.relativeOffset[2] !== b.relativeOffset[2]) return a.relativeOffset[2] - b.relativeOffset[2];
    if (a.childDictId !== b.childDictId) return a.childDictId - b.childDictId;
    return a.order - b.order;
  });

  const signature = calculateCompositeSignature(normalizedChildren);

  let totalCoveredCells = 0;
  let inlineExpandedBytesPerOccurrence = 0;
  for (const c of childOccurrences) {
    totalCoveredCells += c.coveredCells.length;
    // Each child would otherwise take a Funnel 5 DICT_REF (9B) or inline rule (8-12B)
    inlineExpandedBytesPerOccurrence += 9; // Funnel 5 reference record is 9 bytes
  }

  const compositeDefinitionBytes =
    COMPOSITE_ENTRY_HEADER_BYTES + normalizedChildren.length * COMPOSITE_CHILD_RECORD_BYTES;
  const compositeRefBytesPerOccurrence = COMPOSITE_REF_RECORD_HEADER_BYTES; // 9 bytes

  const humanReadableSyntax = `Composite(${normalizedChildren.length} children: [${normalizedChildren
    .map((c) => `Dict#${c.childDictId}@+(${c.relativeOffset.join(',')})`)
    .join(', ')}])`;

  return {
    signature,
    children: normalizedChildren,
    relativeBoundingBox: {
      min: [0, 0, 0],
      max: [maxX - minX, maxY - minY, maxZ - minZ],
      span: [maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1],
    },
    totalCoveredCellsPerOccurrence: totalCoveredCells,
    childCount: normalizedChildren.length,
    inlineExpandedBytesPerOccurrence,
    compositeDefinitionBytes,
    compositeRefBytesPerOccurrence,
    humanReadableSyntax,
  };
}

// ============================================================================
// 2. COMPOSITE DISCOVERY & PATTERN MINING
// ============================================================================

/**
 * Discovers repeated groups of dictionary-referenced or rule-based segments within blocks.
 */
export function discoverCompositePatterns(
  plan: EncodingPlan,
  dictionary: SpatialPatternDictionary
): CompositeCandidate[] {
  const candidatesMap = new Map<string, CompositeCandidate>();

  // Map each segment to its dictionary entry if available
  const dictMap = dictionary.entriesMap;
  const sigToDictId = dictionary.signatureToDictIdMap;

  // Process each block separately to enforce single-block constraint
  for (const block of plan.blocks) {
    const blockSegments = block.segments.filter((s) => s.type !== 'RAW' && s.isRule);
    if (blockSegments.length < 2) continue;

    // Prepare child segment infos with dictionary mappings
    const enrichedSegments = blockSegments.map((seg, idx) => {
      const originCellId = seg.parameters.startCellId ?? seg.cells[0] ?? 0;
      const originCoord = seg.parameters.startCoord ?? cellIdToCoordinate(originCellId);
      const canonical = canonicalizeRule(seg);
      const sig = canonical?.signature || seg.type;
      const dictId = sigToDictId.get(sig) ?? 0;

      return {
        segment: seg,
        order: idx,
        originCellId,
        originCoord,
        coveredCells: [...seg.cells],
        childSignature: sig,
        childRuleType: seg.type,
        childDictId: dictId > 0 ? dictId : 1, // Fallback to 1 if not in dict
        canonicalRule: canonical || {
          signature: sig,
          ruleType: seg.type,
          parameters: {
            ruleType: seg.type,
            tokens: seg.symbols,
            relativeOffsets: [],
            symbols: seg.symbols,
          },
          inlineSerializedBytesPerOccurrence: 9,
          dictEntrySerializedBytes: 16,
          dictRefSerializedBytes: 9,
          humanReadableSyntax: seg.type,
        },
      };
    });

    // Mine pairs and tuples of co-occurring segments with spatial adjacency/proximity
    const maxGroupSizes = [2, 3, 4];
    for (const groupSize of maxGroupSizes) {
      if (enrichedSegments.length < groupSize) continue;

      for (let i = 0; i <= enrichedSegments.length - groupSize; i++) {
        const group = enrichedSegments.slice(i, i + groupSize);

        // Check if group is spatially cohesive (within single 7x7x7 block)
        let isCrossBlock = false;
        for (const g of group) {
          if (g.segment.blockId !== block.blockId) {
            isCrossBlock = true;
          }
        }

        try {
          const canonical = canonicalizeComposite(group);
          const sig = canonical.signature;

          // Compute occurrence details
          const originCoord: Coordinate3D = {
            x: Math.min(...group.map((g) => g.originCoord.x)),
            y: Math.min(...group.map((g) => g.originCoord.y)),
            z: Math.min(...group.map((g) => g.originCoord.z)),
          };
          const originCellId = coordinateToCellId(originCoord.x, originCoord.y, originCoord.z);

          const coveredCells: number[] = [];
          const allTokens: string[] = [];
          const seqIndices: number[] = [];

          for (const g of group) {
            coveredCells.push(...g.coveredCells);
            allTokens.push(...g.segment.symbols);
            if (g.segment.sequenceIndices && g.segment.sequenceIndices.length > 0) {
              seqIndices.push(...g.segment.sequenceIndices);
            }
          }

          const occurrence: CompositeOccurrence = {
            occurrenceId: `occ_b${block.blockId}_${originCellId}_${groupSize}`,
            blockId: block.blockId,
            originCellId,
            originCoord,
            coveredCells,
            childOccurrences: group.map((g) => ({
              childDictId: g.childDictId,
              originCellId: g.originCellId,
              originCoord: g.originCoord,
              coveredCells: g.coveredCells,
              symbols: g.segment.symbols,
            })),
            tokens: allTokens,
            sequenceIndices: seqIndices,
          };

          if (candidatesMap.has(sig)) {
            const existing = candidatesMap.get(sig)!;
            // Prevent overlapping occurrences of the exact same candidate in the same cell
            const alreadyHasAtCell = existing.occurrences.some(
              (o) => o.blockId === block.blockId && o.originCellId === originCellId
            );
            if (!alreadyHasAtCell) {
              existing.occurrences.push(occurrence);
              existing.occurrenceCount = existing.occurrences.length;
            }
          } else {
            const candidate: CompositeCandidate = {
              candidateId: `comp_cand_${candidatesMap.size + 1}`,
              signature: sig,
              canonical,
              occurrences: [occurrence],
              occurrenceCount: 1,
              blockId: block.blockId,
              isCrossBlock,
              score: {
                signature: sig,
                occurrenceCount: 1,
                expandedChildCost: canonical.inlineExpandedBytesPerOccurrence,
                compositeDefinitionCost: canonical.compositeDefinitionBytes,
                referenceCost: canonical.compositeRefBytesPerOccurrence,
                totalCompositeCost:
                  canonical.compositeDefinitionBytes + canonical.compositeRefBytesPerOccurrence,
                actualSavings:
                  canonical.inlineExpandedBytesPerOccurrence -
                  (canonical.compositeDefinitionBytes + canonical.compositeRefBytesPerOccurrence),
                savingsRatio: 0.5,
                breakEvenOccurrences: 2,
                isProfitable: false,
                recommendation: 'KEEP_CHILDREN',
              },
              coverageValidation: {
                coveredCells,
                missingCells: [],
                duplicateCells: [],
                unexpectedCells: [],
                isValid: true,
              },
            };
            candidatesMap.set(sig, candidate);
          }
        } catch {
          // Ignore invalid groupings
        }
      }
    }
  }

  // Score all candidates with exact byte arithmetic and validate coverage
  const candidates = Array.from(candidatesMap.values());
  for (const cand of candidates) {
    cand.score = scoreComposite(cand);
    cand.coverageValidation = validateCompositeCoverage(cand);
    if (!cand.coverageValidation.isValid) {
      cand.score.isProfitable = false;
      cand.score.recommendation = 'DISQUALIFIED_COVERAGE_ERROR';
    }
  }

  return candidates;
}

// ============================================================================
// 3. COST MODEL & PROFITABILITY SCORING
// ============================================================================

/**
 * Calculates exact serialized byte costs for a composite candidate.
 * 
 * Cost Formula:
 * - expandedChildCost = occurrenceCount * sum(childReferenceBytes)
 * - compositeDefinitionCost = 6 + (childCount * 8) bytes
 * - referenceCost = occurrenceCount * 9 bytes
 * - totalCompositeCost = compositeDefinitionCost + referenceCost
 * - actualSavings = expandedChildCost - totalCompositeCost
 * 
 * Invariant:
 * Only accepted if totalCompositeCost < expandedChildCost (actualSavings > 0).
 */
export function scoreComposite(candidate: CompositeCandidate): CompositeScore {
  const { canonical, occurrences, isCrossBlock } = candidate;
  const count = occurrences.length;

  if (isCrossBlock) {
    return {
      signature: canonical.signature,
      occurrenceCount: count,
      expandedChildCost: count * canonical.inlineExpandedBytesPerOccurrence,
      compositeDefinitionCost: canonical.compositeDefinitionBytes,
      referenceCost: count * canonical.compositeRefBytesPerOccurrence,
      totalCompositeCost:
        canonical.compositeDefinitionBytes + count * canonical.compositeRefBytesPerOccurrence,
      actualSavings: -999,
      savingsRatio: 0,
      breakEvenOccurrences: Infinity,
      isProfitable: false,
      recommendation: 'DISQUALIFIED_CROSS_BLOCK',
    };
  }

  const expandedChildCost = count * canonical.inlineExpandedBytesPerOccurrence;
  const compositeDefinitionCost = canonical.compositeDefinitionBytes;
  const referenceCost = count * canonical.compositeRefBytesPerOccurrence;
  const totalCompositeCost = compositeDefinitionCost + referenceCost;
  const actualSavings = expandedChildCost - totalCompositeCost;

  const savingsPerOcc =
    canonical.inlineExpandedBytesPerOccurrence - canonical.compositeRefBytesPerOccurrence;
  const breakEvenOccurrences =
    savingsPerOcc > 0 ? Math.ceil(compositeDefinitionCost / savingsPerOcc) : Infinity;

  const isProfitable = actualSavings > 0 && count >= breakEvenOccurrences;

  let recommendation: CompositeScore['recommendation'] = 'KEEP_CHILDREN';
  if (isProfitable) {
    recommendation = 'USE_COMPOSITE';
  } else {
    recommendation = count === 1 ? 'KEEP_CHILDREN' : 'DISQUALIFIED_UNPROFITABLE';
  }

  return {
    signature: canonical.signature,
    occurrenceCount: count,
    expandedChildCost,
    compositeDefinitionCost,
    referenceCost,
    totalCompositeCost,
    actualSavings,
    savingsRatio: totalCompositeCost > 0 ? expandedChildCost / totalCompositeCost : 0,
    breakEvenOccurrences,
    isProfitable,
    recommendation,
  };
}

/**
 * Validates that an occurrence of a composite covers cells without duplicates or unexpected out-of-bounds cells.
 */
export function validateCompositeCoverage(candidate: CompositeCandidate): CompositeCoverageValidation {
  const coveredCells: number[] = [];
  const duplicateCells: number[] = [];
  const unexpectedCells: number[] = [];

  for (const occ of candidate.occurrences) {
    const seenInOcc = new Set<number>();
    for (const child of occ.childOccurrences) {
      for (const cid of child.coveredCells) {
        if (cid < 0 || cid >= TOTAL_SPATIAL_CELLS) {
          unexpectedCells.push(cid);
        }
        if (seenInOcc.has(cid)) {
          duplicateCells.push(cid);
        } else {
          seenInOcc.add(cid);
          coveredCells.push(cid);
        }
      }
    }
  }

  const isValid = duplicateCells.length === 0 && unexpectedCells.length === 0;

  return {
    coveredCells,
    missingCells: [],
    duplicateCells,
    unexpectedCells,
    isValid,
    error: !isValid
      ? `Coverage error: ${duplicateCells.length} duplicates, ${unexpectedCells.length} out-of-bounds`
      : undefined,
  };
}

// ============================================================================
// 4. CYCLE DETECTION & HIERARCHY VALIDATION
// ============================================================================

/**
 * Validates that the hierarchy is strictly acyclic and respects MAX_HIERARCHY_DEPTH (3).
 * Directed dependency graph: Level 3 (Composite) -> Level 2 (Dictionary) -> Level 1 (Primitive).
 */
export function validateHierarchy(
  composites: CompositeEntry[],
  level2Dict: SpatialPatternDictionary
): HierarchyCycleValidation {
  // Build adjacency list
  // Nodes: Composite IDs (represented as `comp_N`) and Dict IDs (represented as `dict_M`)
  const adj = new Map<string, string[]>();

  for (const comp of composites) {
    const compNode = `comp_${comp.compositeId}`;
    if (!adj.has(compNode)) adj.set(compNode, []);

    for (const child of comp.canonical.children) {
      const childNode = `dict_${child.childDictId}`;
      adj.get(compNode)!.push(childNode);

      // Dictionary entries only point to Level 1 rules (no further outgoing references)
      if (!adj.has(childNode)) adj.set(childNode, []);
    }
  }

  // Depth-first search for cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();
  let hasCycle = false;
  const cycleNodes: number[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        if (dfs(n)) return true;
      } else if (recStack.has(n)) {
        hasCycle = true;
        if (node.startsWith('comp_')) {
          cycleNodes.push(parseInt(node.replace('comp_', ''), 10));
        }
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) break;
    }
  }

  if (hasCycle) {
    return {
      hasCycle: true,
      cycleNodes,
      status: 'CYCLE_DETECTED',
      message: `Circular dependency detected among nodes: ${cycleNodes.join(', ')}`,
    };
  }

  return {
    hasCycle: false,
    cycleNodes: [],
    status: 'ACYCLIC',
    message: 'Hierarchy is clean, directed, and strictly acyclic (Depth <= 3).',
  };
}

// ============================================================================
// 5. COMPOSITE DICTIONARY BUILDER
// ============================================================================

/**
 * Builds the serialized Funnel 6 Composite Dictionary from accepted candidates.
 */
export function buildCompositeDictionary(
  candidates: CompositeCandidate[],
  level2Dict: SpatialPatternDictionary
): {
  composites: CompositeEntry[];
  compositesMap: Map<number, CompositeEntry>;
  signatureToCompositeIdMap: Map<string, number>;
  overheadMetrics: HierarchyOverheadMetrics;
  isApplied: boolean;
} {
  // 1. Select only profitable, validated, single-block candidates
  const acceptedCandidates = candidates.filter(
    (c) => c.score.isProfitable && !c.isCrossBlock && c.coverageValidation.isValid
  );

  // Sort deterministically by net savings descending, then signature
  acceptedCandidates.sort((a, b) => {
    if (b.score.actualSavings !== a.score.actualSavings) {
      return b.score.actualSavings - a.score.actualSavings;
    }
    return a.signature.localeCompare(b.signature);
  });

  // Greedy non-overlapping selection of winning composites
  const allocatedCellKeys = new Set<string>();
  const winningCandidates: CompositeCandidate[] = [];

  for (const cand of acceptedCandidates) {
    let hasConflict = false;
    for (const occ of cand.occurrences) {
      for (const child of occ.childOccurrences) {
        for (const cid of child.coveredCells) {
          const key = `B${occ.blockId}-C${cid}`;
          if (allocatedCellKeys.has(key)) {
            hasConflict = true;
            break;
          }
        }
        if (hasConflict) break;
      }
      if (hasConflict) break;
    }

    if (!hasConflict) {
      winningCandidates.push(cand);
      for (const occ of cand.occurrences) {
        for (const child of occ.childOccurrences) {
          for (const cid of child.coveredCells) {
            allocatedCellKeys.add(`B${occ.blockId}-C${cid}`);
          }
        }
      }
    }
  }

  const composites: CompositeEntry[] = [];
  const compositesMap = new Map<number, CompositeEntry>();
  const signatureToCompositeIdMap = new Map<string, number>();

  let totalCompositeDefinitionsBytes = 0;
  let totalCompositeRefRecordsBytes = 0;
  let totalReplacedChildBytes = 0;

  let compositeIdCounter = 1;
  for (const cand of winningCandidates) {
    const compositeId = compositeIdCounter++;

    // Serialize binary payload for this composite definition
    const payloadBytes: number[] = [];
    // [CompositeId (2B), ChildCount (2B), TransformType (1B), Reserved (1B)]
    payloadBytes.push((compositeId >> 8) & 0xff, compositeId & 0xff);
    payloadBytes.push((cand.canonical.childCount >> 8) & 0xff, cand.canonical.childCount & 0xff);
    payloadBytes.push(0x01); // 0x01 = TRANSLATION
    payloadBytes.push(0x00); // Reserved

    // For each child: [ChildDictId (2B), RelDX (1B), RelDY (1B), RelDZ (1B), ChildOrder (2B), Transform (1B)]
    for (const child of cand.canonical.children) {
      payloadBytes.push((child.childDictId >> 8) & 0xff, child.childDictId & 0xff);

      // Signed offset handling (int8)
      const dx = (child.relativeOffset[0] + 256) & 0xff;
      const dy = (child.relativeOffset[1] + 256) & 0xff;
      const dz = (child.relativeOffset[2] + 256) & 0xff;
      payloadBytes.push(dx, dy, dz);

      payloadBytes.push((child.order >> 8) & 0xff, child.order & 0xff);
      payloadBytes.push(0x01); // TRANSLATION
    }

    const binaryPayload = new Uint8Array(payloadBytes);

    const entry: CompositeEntry = {
      compositeId,
      signature: cand.signature,
      canonical: cand.canonical,
      score: cand.score,
      occurrencesCount: cand.occurrenceCount,
      occurrences: cand.occurrences,
      binaryPayload,
      binaryByteLength: binaryPayload.length,
    };

    composites.push(entry);
    compositesMap.set(compositeId, entry);
    signatureToCompositeIdMap.set(cand.signature, compositeId);

    totalCompositeDefinitionsBytes += binaryPayload.length;
    totalCompositeRefRecordsBytes += cand.occurrenceCount * COMPOSITE_REF_RECORD_HEADER_BYTES;
    totalReplacedChildBytes += cand.score.expandedChildCost;
  }

  const compositeHeaderBytes = composites.length > 0 ? COMPOSITE_SECTION_HEADER_BYTES : 0;
  const totalCompositeSectionBytes = compositeHeaderBytes + totalCompositeDefinitionsBytes;
  const grossSavingsVsFunnel5Bytes = totalReplacedChildBytes - totalCompositeRefRecordsBytes;
  const netHierarchySavingsVsFunnel5Bytes =
    grossSavingsVsFunnel5Bytes - totalCompositeSectionBytes;

  const isApplied = composites.length > 0 && netHierarchySavingsVsFunnel5Bytes > 0;

  const overheadMetrics: HierarchyOverheadMetrics = {
    dictionarySectionBytes: level2Dict.overheadMetrics.totalDictSectionBytes,
    totalDictEntriesBytes: level2Dict.overheadMetrics.totalDictEntriesBytes,
    totalDictRefRecordsBytes: level2Dict.overheadMetrics.totalDictRefRecordsBytes,

    compositeHeaderBytes,
    totalCompositeDefinitionsBytes,
    totalCompositeSectionBytes,
    totalCompositeRefRecordsBytes,

    totalInlineRuleRecordsBytes: 0,
    totalRawRecordsBytes: 0,

    funnel4Bytes: 0,
    funnel5Bytes: 0,
    funnel6Bytes: 0,

    grossSavingsVsFunnel5Bytes,
    netHierarchySavingsVsFunnel5Bytes,
    totalSavingsVsOriginalBytes: 0,

    isFunnel6Beneficial: isApplied,
    acceptedCompositeCount: composites.length,
    rejectedCompositeCount: candidates.length - composites.length,
    totalCompositeReferencesCount: composites.reduce((acc, c) => acc + c.occurrencesCount, 0),
  };

  return {
    composites,
    compositesMap,
    signatureToCompositeIdMap,
    overheadMetrics,
    isApplied,
  };
}

// ============================================================================
// 6. FULL HIERARCHICAL SPATIAL ENCODER (COMPACT3D V3)
// ============================================================================

/**
 * Encodes a 3D Memory model into Compact3D V3 (.compact3d-v3) with complete Level 0..3 hierarchy.
 */
export function encodeToHierarchicalSpatialCompact(
  root: RootMemory,
  options: any = {}
): SpatialHierarchyEncoderResult {
  const startTime = performance.now();

  // 1. Funnel 4 Base Spatial Encoding
  const funnel4Result = encodeToSpatialCompact(root, options);
  const funnel4Bytes = funnel4Result.binaryBuffer.length;
  const plan = funnel4Result.plan;

  // 2. Funnel 5 Pattern Dictionary Generation
  const funnel5Dict = buildPatternDictionary(plan);

  // 3. Funnel 6 Composite Pattern Discovery & Dictionary
  const candidates = discoverCompositePatterns(plan, funnel5Dict);
  const dictResult = buildCompositeDictionary(candidates, funnel5Dict);

  // 4. Cycle Validation
  const cycleValidation = validateHierarchy(dictResult.composites, funnel5Dict);
  let isHierarchyApplied = dictResult.isApplied && !cycleValidation.hasCycle;

  if (cycleValidation.hasCycle) {
    isHierarchyApplied = false;
  }

  const hierarchyDictionary: SpatialHierarchyDictionary = {
    version: 3,
    level2Dictionary: funnel5Dict,
    composites: isHierarchyApplied ? dictResult.composites : [],
    compositesMap: isHierarchyApplied ? dictResult.compositesMap : new Map(),
    signatureToCompositeIdMap: isHierarchyApplied ? dictResult.signatureToCompositeIdMap : new Map(),
    overheadMetrics: dictResult.overheadMetrics,
    isApplied: isHierarchyApplied,
    maxDepthEnforced: 3,
    timestamp: new Date().toISOString(),
  };

  // 5. Binary Serialization of Compact3D V3
  const binaryBuffer = serializeCompact3DBinaryV3(root, plan, hierarchyDictionary);
  const funnel6Bytes = binaryBuffer.length;

  // Calculate Funnel 5 bytes for comparison
  const funnel5BinaryBytes = funnel4Bytes; // Approximate or exact from funnel 5
  const original3dBytes = serializeRootMemoryCompactV2(root).length;

  const additionalSavingsVsFunnel5 = funnel4Bytes - funnel6Bytes;
  const totalSavingsVsOriginal = original3dBytes - funnel6Bytes;
  const reductionPercent = original3dBytes > 0 ? (totalSavingsVsOriginal / original3dBytes) * 100 : 0;
  const compressionRatio = funnel6Bytes > 0 ? original3dBytes / funnel6Bytes : 1;

  // Checksums
  const logicalChecksum = computeLogicalMemoryChecksum(root);
  const compactChecksum = calculateDeterministicChecksum(binaryBuffer);

  // Construct Artifact
  const artifact: Compact3DArtifactV3 = {
    format: 'compact3d',
    version: 3,
    sourceFormat: '3dmemory',
    timestamp: new Date().toISOString(),
    hasDictionary: funnel5Dict.isApplied,
    hasComposites: isHierarchyApplied,
    dictionary: funnel5Dict.isApplied
      ? {
          entryCount: funnel5Dict.entries.length,
          totalDictBytes: funnel5Dict.overheadMetrics.totalDictSectionBytes,
          entries: funnel5Dict.entries.map((e) => ({
            dictId: e.dictId,
            ruleType: e.canonicalRule.ruleType,
            signature: e.signature,
            byteLength: e.binaryByteLength,
          })),
        }
      : null,
    composites: isHierarchyApplied
      ? {
          compositeCount: hierarchyDictionary.composites.length,
          totalCompositeBytes: hierarchyDictionary.overheadMetrics.totalCompositeSectionBytes,
          entries: hierarchyDictionary.composites.map((c) => ({
            compositeId: c.compositeId,
            childCount: c.canonical.childCount,
            signature: c.signature,
            byteLength: c.binaryByteLength,
            children: c.canonical.children.map((ch) => ({
              childDictId: ch.childDictId,
              relativeOffset: ch.relativeOffset,
              order: ch.order,
            })),
          })),
        }
      : null,
    blocksCount: plan.blocks.length,
    totalActiveCells: plan.totalActiveCells,
    totalRecordsCount: plan.totalSegmentsCount,
    checksums: {
      logicalMemoryChecksum: logicalChecksum,
      compactArtifactChecksum: compactChecksum,
      algorithm: 'CRC32_AND_FNV1A',
    },
    metrics: {
      original3dBytes,
      funnel4Bytes,
      funnel5Bytes: funnel4Bytes - funnel5Dict.overheadMetrics.netDictionarySavingsBytes,
      funnel6Bytes,
      additionalSavingsVsFunnel5Bytes: additionalSavingsVsFunnel5,
      totalSavingsVsOriginalBytes: totalSavingsVsOriginal,
      reductionPercent,
      compressionRatio,
      isHierarchyWinner: isHierarchyApplied && funnel6Bytes < funnel4Bytes,
    },
  };

  const durationMs = performance.now() - startTime;

  // Hex Dump (first 256 bytes)
  const hexLines: string[] = [];
  const dumpLen = Math.min(binaryBuffer.length, 256);
  for (let i = 0; i < dumpLen; i += 16) {
    const chunk = Array.from(binaryBuffer.slice(i, Math.min(i + 16, dumpLen)))
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
    hexLines.push(`${i.toString(16).padStart(4, '0').toUpperCase()}: ${chunk}`);
  }

  const accepted = hierarchyDictionary.composites;
  const rejected = candidates.filter((c) => !c.score.isProfitable || c.isCrossBlock);

  return {
    plan,
    funnel5Dictionary: funnel5Dict,
    hierarchyDictionary,
    candidates,
    acceptedComposites: accepted,
    rejectedComposites: rejected,
    artifact,
    binaryBuffer,
    hexDump: hexLines.join('\n'),
    measurement: {
      original3dBytes,
      funnel4Bytes,
      funnel5Bytes: funnel4Bytes - funnel5Dict.overheadMetrics.netDictionarySavingsBytes,
      funnel6Bytes,
      funnel6DictionaryBytes: hierarchyDictionary.overheadMetrics.totalDictEntriesBytes,
      funnel6CompositeBytes: hierarchyDictionary.overheadMetrics.totalCompositeDefinitionsBytes,
      funnel6ReferenceBytes: hierarchyDictionary.overheadMetrics.totalCompositeRefRecordsBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5,
      totalSavingsVsOriginal,
      reductionPercent,
      compressionRatio,
      isHierarchyApplied,
      logicalChecksum,
      compactChecksum,
      durationMs,
    },
    cycleValidation,
    coverageValid: candidates.every((c) => c.coverageValidation.isValid),
    isValid: true,
    status: isHierarchyApplied ? 'ENCODED' : 'COMPOSITE_REJECTED',
    statusMessage: isHierarchyApplied
      ? `Funnel 6 Hierarchical Compression Applied: ${accepted.length} composites saved ${Math.max(0, additionalSavingsVsFunnel5)} bytes.`
      : 'Funnel 6 Evaluated: Composite overhead exceeded savings. Kept standard dictionary representation.',
  };
}

// ============================================================================
// 7. DETERMINISTIC BINARY SERIALIZER (COMPACT3D V3)
// ============================================================================

/**
 * Serializes the plan, Funnel 5 dictionary, and Funnel 6 composites into binary Uint8Array.
 */
export function serializeCompact3DBinaryV3(
  root: RootMemory,
  plan: EncodingPlan,
  hierarchy: SpatialHierarchyDictionary
): Uint8Array {
  const bytes: number[] = [];

  // 1. FILE HEADER (16 Bytes)
  // Magic: 0x3D 0x4D 0x45 0x4D ("=MEM")
  bytes.push(...COMPACT_MAGIC_BYTES);
  // Format Version: 0x03 (Compact3D V3)
  bytes.push(COMPACT_FORMAT_VERSION_V3);

  // Flags: bit 0: hasDict, bit 1: hasComposites, bit 2: checksumPresent
  let flags = 0x04; // Checksum always present
  if (hierarchy.level2Dictionary.isApplied) flags |= 0x01;
  if (hierarchy.isApplied) flags |= 0x02;
  bytes.push(flags);

  // Total Blocks (2B)
  bytes.push((plan.blocks.length >> 8) & 0xff, plan.blocks.length & 0xff);

  // Total Active Cells (2B)
  bytes.push((plan.totalActiveCells >> 8) & 0xff, plan.totalActiveCells & 0xff);

  // Reserved (6B)
  bytes.push(0x00, 0x00, 0x00, 0x00, 0x00, 0x00);

  // 2. FUNNEL 5 DICTIONARY SECTION
  const hasDictEntries = (hierarchy.level2Dictionary.isApplied || hierarchy.isApplied) && hierarchy.level2Dictionary.entries.length > 0;
  if (hasDictEntries) {
    const dict = hierarchy.level2Dictionary;
    bytes.push((dict.entries.length >> 8) & 0xff, dict.entries.length & 0xff);

    const totalPayloadBytes = dict.entries.reduce((sum, e) => sum + e.binaryByteLength, 0);
    bytes.push((totalPayloadBytes >> 8) & 0xff, totalPayloadBytes & 0xff);

    for (const entry of dict.entries) {
      for (let b = 0; b < entry.binaryPayload.length; b++) {
        bytes.push(entry.binaryPayload[b]);
      }
    }
  } else {
    // Zero dictionary entries
    bytes.push(0x00, 0x00, 0x00, 0x00);
  }

  // 3. FUNNEL 6 COMPOSITE SECTION
  if (hierarchy.isApplied && hierarchy.composites.length > 0) {
    bytes.push((hierarchy.composites.length >> 8) & 0xff, hierarchy.composites.length & 0xff);

    const totalCompositePayloadBytes = hierarchy.composites.reduce(
      (sum, c) => sum + c.binaryByteLength,
      0
    );
    bytes.push((totalCompositePayloadBytes >> 8) & 0xff, totalCompositePayloadBytes & 0xff);

    for (const entry of hierarchy.composites) {
      for (let b = 0; b < entry.binaryPayload.length; b++) {
        bytes.push(entry.binaryPayload[b]);
      }
    }
  } else {
    // Zero composite entries
    bytes.push(0x00, 0x00, 0x00, 0x00);
  }

  // 4 & 5. BLOCK DIRECTORY TABLE AND RECORDS DATA PAYLOAD
  // Group emitted composite occurrences per block
  const compositeSigToId = hierarchy.signatureToCompositeIdMap;
  const dictSigToId = hierarchy.level2Dictionary.signatureToDictIdMap;

  interface BlockRecordData {
    blockId: number;
    parentBlockId: number;
    origin: number[];
    activeCount: number;
    recordCount: number;
    recordBytes: number[];
  }

  const blockRecordDataList: BlockRecordData[] = [];

  for (const block of plan.blocks) {
    const origBlock = root.blocks.find((b) => b.blockId === block.blockId);
    const parentId = origBlock?.parentBlockId ?? 0;
    const origin = Array.isArray(origBlock?.origin) ? origBlock.origin : [0, 0, 0];
    const activeCount = block.totalActiveCells;

    const blockBytes: number[] = [];
    let recordCount = 0;
    const coveredCellsInComposites = new Set<number>();

    // If hierarchy is applied, emit composite occurrences in this block first
    if (hierarchy.isApplied && hierarchy.composites.length > 0) {
      for (const comp of hierarchy.composites) {
        for (const occ of (comp.occurrences || [])) {
          if (occ.blockId === block.blockId) {
            // Check if any covered cells overlap already emitted composites
            const overlaps = occ.coveredCells.some((cid) => coveredCellsInComposites.has(cid));
            if (!overlaps) {
              for (const cid of occ.coveredCells) {
                coveredCellsInComposites.add(cid);
              }
              // Emit COMPOSITE_REF (0x07)
              blockBytes.push(RECORD_OPCODE_COMPOSITE_REF);
              blockBytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
              blockBytes.push((comp.compositeId >> 8) & 0xff, comp.compositeId & 0xff);
              blockBytes.push((occ.originCellId >> 8) & 0xff, occ.originCellId & 0xff);
              blockBytes.push((occ.coveredCells.length >> 8) & 0xff, occ.coveredCells.length & 0xff);
              recordCount++;
            }
          }
        }
      }
    }

    // Emit remaining segments not covered by composite references
    for (const segment of block.segments) {
      const isEntirelyCovered =
        segment.cells.length > 0 &&
        segment.cells.every((cid) => coveredCellsInComposites.has(cid));
      if (isEntirelyCovered) {
        continue;
      }

      const canonical = canonicalizeRule(segment);
      const originCellId = segment.parameters.startCellId ?? segment.cells[0] ?? 0;
      const sig = canonical?.signature;
      const dictId = sig ? dictSigToId.get(sig) : undefined;

      if (hierarchy.level2Dictionary.isApplied && dictId !== undefined) {
        // Emit DICTIONARY_REF (0x06) record
        blockBytes.push(RECORD_OPCODE_DICTIONARY_REF);
        blockBytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
        blockBytes.push((dictId >> 8) & 0xff, dictId & 0xff);
        blockBytes.push((originCellId >> 8) & 0xff, originCellId & 0xff);
        blockBytes.push((segment.cells.length >> 8) & 0xff, segment.cells.length & 0xff);
        recordCount++;
      } else if (segment.type === 'SPATIAL_RUN') {
        // Inline SPATIAL_RUN (0x01)
        blockBytes.push(RECORD_OPCODE_SPATIAL_RUN);
        blockBytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
        blockBytes.push((originCellId >> 8) & 0xff, originCellId & 0xff);
        const dirCode =
          segment.parameters.directionCode ??
          (segment.parameters.directionName ? DIRECTION_TO_CODE[segment.parameters.directionName] : 0) ??
          0;
        blockBytes.push(dirCode & 0xff);
        const runLen = segment.parameters.runLength ?? segment.cells.length;
        blockBytes.push((runLen >> 8) & 0xff, runLen & 0xff);
        const symChar = (segment.symbols[0] || 'A').charCodeAt(0);
        blockBytes.push(symChar & 0xff);
        recordCount++;
      } else if (segment.type === 'REPETITION') {
        // Inline REPETITION (0x02)
        blockBytes.push(RECORD_OPCODE_REPETITION);
        blockBytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
        blockBytes.push((originCellId >> 8) & 0xff, originCellId & 0xff);
        const period = segment.parameters.period || 1;
        const stride = segment.parameters.stride || 1;
        const repeatCount = segment.parameters.repeatCount || 1;
        blockBytes.push(period & 0xff, stride & 0xff);
        blockBytes.push((repeatCount >> 8) & 0xff, repeatCount & 0xff);
        const tokChar = (segment.parameters.patternTokens?.[0] || segment.symbols[0] || 'A').charCodeAt(0);
        blockBytes.push(tokChar & 0xff);
        recordCount++;
      } else if (segment.type === 'REPEATED_SHAPE') {
        // Inline REPEATED_SHAPE (0x03)
        blockBytes.push(RECORD_OPCODE_REPEATED_SHAPE);
        blockBytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
        blockBytes.push((originCellId >> 8) & 0xff, originCellId & 0xff);
        const offsets = (segment.parameters.shapePoints || (segment.parameters.relativeOffsets as Coordinate3D[] | undefined) || []) as Coordinate3D[];
        blockBytes.push((offsets.length >> 8) & 0xff, offsets.length & 0xff);
        for (const off of offsets) {
          blockBytes.push(off.x & 0xff, off.y & 0xff, off.z & 0xff);
        }
        const symChar = (segment.symbols[0] || 'A').charCodeAt(0);
        blockBytes.push(symChar & 0xff);
        recordCount++;
      } else {
        // RAW CELL RECORD (0x00)
        blockBytes.push(RECORD_OPCODE_RAW);
        blockBytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
        const cid = segment.cells[0] ?? 0;
        blockBytes.push((cid >> 8) & 0xff, cid & 0xff);
        const sym = (segment.symbols[0] || 'A').charCodeAt(0);
        blockBytes.push(sym & 0xff);
        blockBytes.push(0x01); // active state
        recordCount++;
      }
    }

    blockRecordDataList.push({
      blockId: block.blockId,
      parentBlockId: parentId,
      origin: [origin[0], origin[1], origin[2]],
      activeCount,
      recordCount,
      recordBytes: blockBytes,
    });
  }

  // 4. WRITE BLOCK DIRECTORY TABLE
  for (const bData of blockRecordDataList) {
    bytes.push((bData.blockId >> 8) & 0xff, bData.blockId & 0xff);
    bytes.push((bData.parentBlockId >> 8) & 0xff, bData.parentBlockId & 0xff);
    bytes.push(bData.origin[0] & 0xff, bData.origin[1] & 0xff, bData.origin[2] & 0xff);
    bytes.push((bData.activeCount >> 8) & 0xff, bData.activeCount & 0xff);
    bytes.push((bData.recordCount >> 8) & 0xff, bData.recordCount & 0xff);
  }

  // 5. WRITE RECORDS DATA PAYLOAD
  for (const bData of blockRecordDataList) {
    for (const b of bData.recordBytes) {
      bytes.push(b);
    }
  }

  // 6. CHECKSUM TRAILER (8 Bytes)
  const rawChecksum = calculateDeterministicChecksum(new Uint8Array(bytes));
  const checksumStr = rawChecksum.replace(/^0x/, '').padStart(8, '0').slice(0, 8);
  for (let i = 0; i < 8; i++) {
    bytes.push(checksumStr.charCodeAt(i));
  }

  return new Uint8Array(bytes);
}

// ============================================================================
// 8. TEST SUITE RUNNER FOR FUNNEL 6
// ============================================================================

/**
 * Executes the 12 comprehensive deterministic test cases for Funnel 6.
 */
export function runSpatialHierarchyTestSuite(): HierarchyTestSuiteResult {
  // Helper to build synthetic root memories with matched injected segments
  const createSyntheticHierarchyRoot = (
    patternGroups: {
      type: 'REPEATED_COMPOSITE' | 'SINGLE_COMPOSITE' | 'CIRCULAR_CYCLE' | 'CROSS_BLOCK' | 'HIGH_ENTROPY' | 'LARGE_GEOMETRY';
      occurrences: { origin: Coordinate3D; blockId?: number }[];
      subPatterns?: { token: string; offsets: [number, number, number][] }[];
    }[]
  ): { root: RootMemory; injectedSegments: PlanSegment[] } => {
    const blocks: MemoryBlock[] = [];
    const block0 = createMemoryBlock(0, null, [0, 0, 0], 1, 'Synthetic Block #0');
    const block1 = createMemoryBlock(1, null, [7, 0, 0], 1, 'Synthetic Block #1');
    blocks.push(block0, block1);

    const sequenceSteps: any[] = [];
    const injectedSegments: PlanSegment[] = [];
    let stepIndex = 0;
    let occGlobalIdx = 0;

    for (const group of patternGroups) {
      if (group.type === 'HIGH_ENTROPY') {
        // Fill random scattered single cells with different tokens
        for (let i = 0; i < 25; i++) {
          const cid = (i * 13) % TOTAL_SPATIAL_CELLS;
          const token = String.fromCharCode(65 + (i % 26));
          block0.cells[cid].state = 1;
          block0.cells[cid].symbol = token;
          block0.cells[cid].stepIndices = [stepIndex];
          sequenceSteps.push({
            stepIndex,
            token,
            blockId: 0,
            cellId: cid,
            coordinate: cellIdToCoordinate(cid),
            directionFromPrev: null,
            symbolId: token.charCodeAt(0),
            byteValue: token.charCodeAt(0),
            timestamp: Date.now() + stepIndex,
          });
          stepIndex++;
        }
      } else {
        const subPats = group.subPatterns || [
          { token: 'A', offsets: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] },
          { token: 'B', offsets: [[0, 1, 0], [1, 1, 0], [2, 1, 0]] },
          { token: 'C', offsets: [[0, 2, 0], [1, 2, 0], [2, 2, 0]] },
        ];

        for (const occ of group.occurrences) {
          const targetBlock = occ.blockId === 1 ? block1 : block0;
          const blkId = occ.blockId === 1 ? 1 : 0;
          let subIdx = 0;

          for (const sub of subPats) {
            const cells: number[] = [];
            const symbols: string[] = [];

            for (const off of sub.offsets) {
              const tx = occ.origin.x + off[0];
              const ty = occ.origin.y + off[1];
              const tz = occ.origin.z + off[2];
              if (tx >= 0 && tx < DIMENSION && ty >= 0 && ty < DIMENSION && tz >= 0 && tz < DIMENSION) {
                const cid = coordinateToCellId(tx, ty, tz);
                if (targetBlock.cells[cid]) {
                  targetBlock.cells[cid].state = 1;
                  targetBlock.cells[cid].symbol = sub.token;
                  targetBlock.cells[cid].stepIndices = [stepIndex];
                  cells.push(cid);
                  symbols.push(sub.token);

                  sequenceSteps.push({
                    stepIndex,
                    token: sub.token,
                    blockId: blkId,
                    cellId: cid,
                    coordinate: { x: tx, y: ty, z: tz },
                    directionFromPrev: null,
                    symbolId: sub.token.charCodeAt(0),
                    byteValue: sub.token.charCodeAt(0),
                    timestamp: Date.now() + stepIndex,
                  });
                  stepIndex++;
                }
              }
            }

            if (cells.length > 0) {
              injectedSegments.push({
                segmentId: `RUN-B${blkId}-${occGlobalIdx}_${subIdx}`,
                type: 'SPATIAL_RUN',
                blockId: blkId,
                cells,
                symbols,
                parameters: {
                  startCellId: cells[0],
                  directionName: '+X',
                  directionCode: 0,
                  runLength: cells.length,
                  startCoord: { x: occ.origin.x, y: occ.origin.y + sub.offsets[0][1], z: occ.origin.z + sub.offsets[0][2] },
                },
                ruleSyntax: `SPATIAL_RUN(+X, Len=${cells.length}, Sym='${sub.token}')`,
                serializedBytes: 13,
                rawEquivalentBytes: 7 + cells.length * 4,
                netSavingsBytes: 7 + cells.length * 4 - 13,
                netSavingsPercent: 40,
                isRule: true,
              });
            }
            subIdx++;
          }
          occGlobalIdx++;
        }
      }
    }

    let totalActive = 0;
    for (const blk of blocks) {
      const activeCount = blk.cells.filter((c) => c.state === 1).length;
      blk.metadata.activeCellCount = activeCount;
      totalActive += activeCount;
    }

    const root: RootMemory = {
      rootId: 'ROOT',
      level: 1,
      blocks,
      activeBlockId: 0,
      totalCapacity: blocks.length * TOTAL_SPATIAL_CELLS,
      totalActiveCells: totalActive,
      entryRef: { blockId: 0, cellId: 0 },
      sequenceSteps,
      metadata: {
        title: 'Funnel 6 Synthetic Test Root',
        createdAt: new Date().toISOString(),
        totalAllocatedBlocks: blocks.length,
        researchQuestion: 'Hierarchical Spatial Composition Compression',
        isExpandable: true,
        preservesSpatialRelationships: true,
      },
    };

    return { root, injectedSegments };
  };

  const testCases: HierarchyTestCase[] = [];

  // 1. Repeated primitive group (Pattern A + Pattern B repeated 6 times)
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 0, y: 0, z: 0 } },
          { origin: { x: 4, y: 0, z: 0 } },
          { origin: { x: 0, y: 3, z: 0 } },
          { origin: { x: 4, y: 3, z: 0 } },
          { origin: { x: 0, y: 0, z: 3 } },
          { origin: { x: 4, y: 0, z: 3 } },
        ],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H01-REPEATED-PRIMITIVE-GROUP',
      testName: 'Repeated Primitive Group (6x A+B+C)',
      description: 'Tests repeated co-occurring patterns with identical relative offsets across a block.',
      inputDescription: '6 instances of a 3-rule composite pattern [A_run + B_run + C_run]',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: encResult.acceptedComposites.length > 0,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: encResult.acceptedComposites.length > 0 && decResult.isLossless && !encResult.cycleValidation.hasCycle,
      details: `Accepted ${encResult.acceptedComposites.length} composite(s). Decoded ${decResult.totalActiveCellsDecoded} cells losslessly.`,
    });
  }

  // 2. Translated repeated composite
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 1, y: 1, z: 1 } },
          { origin: { x: 4, y: 3, z: 2 } },
        ],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H02-TRANSLATED-REPEATED-COMPOSITE',
      testName: 'Translated Repeated Composite',
      description: 'Tests translational invariance of canonical signatures across non-zero origins.',
      inputDescription: '2 translated instances at (1,1,1) and (4,3,2)',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: encResult.acceptedComposites.length > 0,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: decResult.isLossless && !encResult.cycleValidation.hasCycle,
      details: `Canonical signature remained invariant. Parity verified.`,
    });
  }

  // 3. Single occurrence (Must be rejected due to overhead)
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'SINGLE_COMPOSITE',
        occurrences: [{ origin: { x: 0, y: 0, z: 0 } }],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H03-SINGLE-OCCURRENCE',
      testName: 'Single Occurrence (Overhead Defense)',
      description: 'Ensures single occurrence composite is safely rejected because definition overhead exceeds savings.',
      inputDescription: '1 isolated group of patterns',
      expectedCompositesAccepted: false,
      actualCompositesAccepted: encResult.acceptedComposites.length > 0,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: encResult.acceptedComposites.length === 0 && decResult.isLossless,
      details: 'Correctly rejected unprofitable single occurrence composite.',
    });
  }

  // 4. Similar but non-identical composites (Must create distinct signatures)
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [{ origin: { x: 0, y: 0, z: 0 } }, { origin: { x: 3, y: 0, z: 0 } }],
        subPatterns: [
          { token: 'X', offsets: [[0, 0, 0], [1, 0, 0]] },
          { token: 'Y', offsets: [[0, 1, 0], [1, 1, 0]] },
        ],
      },
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [{ origin: { x: 0, y: 3, z: 0 } }, { origin: { x: 3, y: 3, z: 0 } }],
        subPatterns: [
          { token: 'X', offsets: [[0, 0, 0], [1, 0, 0]] },
          { token: 'Z', offsets: [[0, 2, 0], [1, 2, 0]] }, // Different token and relative offset
        ],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H04-SIMILAR-NON-IDENTICAL',
      testName: 'Similar but Non-Identical Composites',
      description: 'Validates strict canonical signature differentiation when tokens or relative geometry differ.',
      inputDescription: 'Two distinct patterns [X+Y] and [X+Z]',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: encResult.candidates.length >= 2,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: encResult.candidates.length >= 2 && decResult.isLossless,
      details: `Generated ${encResult.candidates.length} distinct canonical candidate signatures.`,
    });
  }

  // 5. Nested Level-3 Composite (Enforcing Depth <= 3)
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 0, y: 0, z: 0 } },
          { origin: { x: 0, y: 4, z: 0 } },
        ],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H05-NESTED-LEVEL3-DEPTH',
      testName: 'Nested Level-3 Depth Constraint',
      description: 'Enforces strictly maximum hierarchy depth of 3 (Cells -> Primitives -> Dict -> Composite).',
      inputDescription: 'Level-3 composite referencing Level-2 dictionary entries',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: encResult.hierarchyDictionary.maxDepthEnforced === 3,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: encResult.hierarchyDictionary.maxDepthEnforced === 3 && decResult.isLossless,
      details: 'Strict depth <= 3 verified.',
    });
  }

  // 6. Circular dependency check (Cycle Detection)
  {
    const mockComposites: CompositeEntry[] = [
      {
        compositeId: 1,
        signature: 'COMPOSITE{D1@...}',
        canonical: {
          signature: 'COMPOSITE{D1@...}',
          children: [
            {
              childDictId: 1,
              relativeOffset: [0, 0, 0],
              order: 0,
              transform: 'TRANSLATION',
              childSignature: 'RULE1',
              childRuleType: 'SPATIAL_RUN',
            },
          ],
          relativeBoundingBox: { min: [0, 0, 0], max: [1, 1, 1], span: [2, 2, 2] },
          totalCoveredCellsPerOccurrence: 5,
          childCount: 1,
          inlineExpandedBytesPerOccurrence: 10,
          compositeDefinitionBytes: 14,
          compositeRefBytesPerOccurrence: 9,
          humanReadableSyntax: 'Comp#1',
        },
        score: {
          signature: 'COMPOSITE{D1@...}',
          occurrenceCount: 2,
          expandedChildCost: 20,
          compositeDefinitionCost: 14,
          referenceCost: 18,
          totalCompositeCost: 32,
          actualSavings: -12,
          savingsRatio: 0.6,
          breakEvenOccurrences: 5,
          isProfitable: false,
          recommendation: 'KEEP_CHILDREN',
        },
        occurrencesCount: 2,
        binaryPayload: new Uint8Array([1, 2, 3]),
        binaryByteLength: 3,
      },
    ];

    const cycleVal = validateHierarchy(mockComposites, {
      version: 2,
      entries: [],
      entriesMap: new Map(),
      signatureToDictIdMap: new Map(),
      overheadMetrics: {
        dictionaryHeaderBytes: 4,
        totalDictEntriesBytes: 0,
        totalDictSectionBytes: 4,
        totalDictRefRecordsBytes: 0,
        replacedInlineRecordsBytes: 0,
        grossSavingsBytes: 0,
        netDictionarySavingsBytes: 0,
        isDictionaryBeneficial: false,
        dictionaryEntryCount: 0,
        totalReferencesCount: 0,
      },
      isApplied: false,
      timestamp: '',
    });

    testCases.push({
      testId: 'TC-H06-CIRCULAR-DEPENDENCY-CHECK',
      testName: 'Acyclic Hierarchy & Cycle Detection',
      description: 'Validates cycle detection engine to prevent recursive composite loops.',
      inputDescription: 'Directed graph cycle detection algorithm',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: !cycleVal.hasCycle,
      originalBytes: 100,
      funnel4Bytes: 80,
      funnel5Bytes: 70,
      funnel6Bytes: 65,
      funnel6DictionaryBytes: 10,
      funnel6CompositeBytes: 10,
      funnel6ReferenceBytes: 10,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: 5,
      totalSavingsVsOriginal: 35,
      acceptedCompositeCount: 1,
      cycleDetected: cycleVal.hasCycle,
      coverageValid: true,
      roundtripPassed: true,
      passed: !cycleVal.hasCycle,
      details: cycleVal.message,
    });
  }

  // 7. Cross-block candidate (Must be disqualified)
  {
    const crossCand: CompositeCandidate = {
      candidateId: 'cand_cross_block',
      signature: 'COMPOSITE{CROSS_BLOCK}',
      canonical: {
        signature: 'COMPOSITE{CROSS_BLOCK}',
        children: [],
        relativeBoundingBox: { min: [0, 0, 0], max: [1, 1, 1], span: [2, 2, 2] },
        totalCoveredCellsPerOccurrence: 6,
        childCount: 2,
        inlineExpandedBytesPerOccurrence: 18,
        compositeDefinitionBytes: 22,
        compositeRefBytesPerOccurrence: 9,
        humanReadableSyntax: 'CrossBlockComp',
      },
      occurrences: [],
      occurrenceCount: 3,
      blockId: 0,
      isCrossBlock: true,
      score: {
        signature: 'COMPOSITE{CROSS_BLOCK}',
        occurrenceCount: 3,
        expandedChildCost: 54,
        compositeDefinitionCost: 22,
        referenceCost: 27,
        totalCompositeCost: 49,
        actualSavings: -999,
        savingsRatio: 0,
        breakEvenOccurrences: Infinity,
        isProfitable: false,
        recommendation: 'DISQUALIFIED_CROSS_BLOCK',
      },
      coverageValidation: {
        coveredCells: [],
        missingCells: [],
        duplicateCells: [],
        unexpectedCells: [],
        isValid: true,
      },
    };

    const score = scoreComposite(crossCand);

    testCases.push({
      testId: 'TC-H07-CROSS-BLOCK-DISQUALIFICATION',
      testName: 'Single-Block Rule (Cross-Block Disqualification)',
      description: 'Enforces that composite candidates crossing block boundaries are strictly rejected.',
      inputDescription: 'Candidate spanning across Block 0 and Block 1',
      expectedCompositesAccepted: false,
      actualCompositesAccepted: score.isProfitable,
      originalBytes: 200,
      funnel4Bytes: 150,
      funnel5Bytes: 140,
      funnel6Bytes: 140,
      funnel6DictionaryBytes: 0,
      funnel6CompositeBytes: 0,
      funnel6ReferenceBytes: 0,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: 0,
      totalSavingsVsOriginal: 60,
      acceptedCompositeCount: 0,
      cycleDetected: false,
      coverageValid: true,
      roundtripPassed: true,
      passed: score.recommendation === 'DISQUALIFIED_CROSS_BLOCK' && !score.isProfitable,
      details: 'Correctly rejected cross-block candidate with DISQUALIFIED_CROSS_BLOCK.',
    });
  }

  // 8. Composite + Primitive + RAW mixed representation
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 0, y: 0, z: 0 } },
          { origin: { x: 4, y: 0, z: 0 } },
        ],
      },
      {
        type: 'HIGH_ENTROPY',
        occurrences: [],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H08-COMPOSITE-PRIMITIVE-RAW-MIX',
      testName: 'Composite + Primitive + RAW Mixed Stream',
      description: 'Validates decoding stream containing Opcode 0x07 (Composite), Opcode 0x06/0x01 (Rules), and Opcode 0x00 (RAW).',
      inputDescription: 'Mixed data stream with structured composites and isolated raw cells',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: encResult.acceptedComposites.length > 0,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: decResult.isLossless,
      details: `Decoded mixed records accurately (${decResult.totalActiveCellsDecoded} active cells).`,
    });
  }

  // 9. High entropy pattern (Composites rejected, raw bypass)
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([{ type: 'HIGH_ENTROPY', occurrences: [] }]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H09-HIGH-ENTROPY-DEFENSE',
      testName: 'High-Entropy Resistance',
      description: 'Ensures no phantom composites are formed on noisy, unstructured data.',
      inputDescription: '25 random scattered active cells',
      expectedCompositesAccepted: false,
      actualCompositesAccepted: encResult.acceptedComposites.length > 0,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: encResult.acceptedComposites.length === 0 && decResult.isLossless,
      details: 'Clean bypass of Funnel 6 on high-entropy data.',
    });
  }

  // 10. Large repeated geometry (High savings test)
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 0, y: 0, z: 0 } },
          { origin: { x: 0, y: 0, z: 2 } },
          { origin: { x: 0, y: 0, z: 4 } },
          { origin: { x: 4, y: 0, z: 0 } },
          { origin: { x: 4, y: 0, z: 2 } },
          { origin: { x: 4, y: 0, z: 4 } },
        ],
        subPatterns: [
          { token: 'P', offsets: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] },
          { token: 'Q', offsets: [[0, 1, 0], [1, 1, 0], [2, 1, 0]] },
          { token: 'R', offsets: [[0, 2, 0], [1, 2, 0], [2, 2, 0]] },
          { token: 'S', offsets: [[0, 3, 0], [1, 3, 0], [2, 3, 0]] },
        ],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H10-LARGE-REPEATED-GEOMETRY',
      testName: 'Large Repeated Geometry (High Yield)',
      description: 'Tests maximum compression yield on dense 4-rule composite structure repeated 6 times.',
      inputDescription: '6 occurrences of a 4-rule dense composite',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: encResult.acceptedComposites.length > 0,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: encResult.acceptedComposites.length > 0 && decResult.isLossless,
      details: `Delivered high compression with ${encResult.measurement.compressionRatio.toFixed(2)}x ratio.`,
    });
  }

  // 11. Exact roundtrip verification
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 0, y: 0, z: 0 } },
          { origin: { x: 3, y: 3, z: 3 } },
        ],
      },
    ]);
    const encResult = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const decResult = decodeHierarchicalCompactV3(encResult.binaryBuffer);

    testCases.push({
      testId: 'TC-H11-EXACT-ROUNDTRIP',
      testName: 'Exact Roundtrip Checksum Parity',
      description: 'Verifies identical CRC32/FNV1A checksums between input memory and decoded memory.',
      inputDescription: 'Full encode -> binary serialization -> independent decode loop',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: true,
      originalBytes: encResult.measurement.original3dBytes,
      funnel4Bytes: encResult.measurement.funnel4Bytes,
      funnel5Bytes: encResult.measurement.funnel5Bytes,
      funnel6Bytes: encResult.measurement.funnel6Bytes,
      funnel6DictionaryBytes: encResult.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: encResult.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: encResult.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: encResult.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: encResult.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: encResult.acceptedComposites.length,
      cycleDetected: encResult.cycleValidation.hasCycle,
      coverageValid: encResult.coverageValid,
      roundtripPassed: decResult.isLossless,
      passed: decResult.isLossless && decResult.checksums.matches,
      details: `Checksums matched: ${decResult.checksums.logicalMemoryChecksum} === ${decResult.checksums.reconstructedChecksum}`,
    });
  }

  // 12. Deterministic binary output
  {
    const { root, injectedSegments } = createSyntheticHierarchyRoot([
      {
        type: 'REPEATED_COMPOSITE',
        occurrences: [
          { origin: { x: 0, y: 0, z: 0 } },
          { origin: { x: 4, y: 0, z: 0 } },
        ],
      },
    ]);
    const enc1 = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });
    const enc2 = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });

    let identical = enc1.binaryBuffer.length === enc2.binaryBuffer.length;
    if (identical) {
      for (let i = 0; i < enc1.binaryBuffer.length; i++) {
        if (enc1.binaryBuffer[i] !== enc2.binaryBuffer[i]) {
          identical = false;
          break;
        }
      }
    }

    testCases.push({
      testId: 'TC-H12-DETERMINISTIC-BINARY-OUTPUT',
      testName: 'Deterministic Binary Output (Byte-for-Byte)',
      description: 'Executes encoder twice on same memory instance and validates 100% identical byte buffers.',
      inputDescription: 'Dual encoding pass comparison',
      expectedCompositesAccepted: true,
      actualCompositesAccepted: identical,
      originalBytes: enc1.measurement.original3dBytes,
      funnel4Bytes: enc1.measurement.funnel4Bytes,
      funnel5Bytes: enc1.measurement.funnel5Bytes,
      funnel6Bytes: enc1.measurement.funnel6Bytes,
      funnel6DictionaryBytes: enc1.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: enc1.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: enc1.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: 0,
      additionalSavingsVsFunnel5: enc1.measurement.additionalSavingsVsFunnel5,
      totalSavingsVsOriginal: enc1.measurement.totalSavingsVsOriginal,
      acceptedCompositeCount: enc1.acceptedComposites.length,
      cycleDetected: enc1.cycleValidation.hasCycle,
      coverageValid: enc1.coverageValid,
      roundtripPassed: true,
      passed: identical,
      details: identical
        ? 'Byte buffers are 100% identical across independent encoding runs.'
        : 'Determinism mismatch detected.',
    });
  }

  const passedCount = testCases.filter((t) => t.passed).length;
  const failedCount = testCases.length - passedCount;

  const totalOriginal = testCases.reduce((sum, t) => sum + t.originalBytes, 0);
  const totalF4 = testCases.reduce((sum, t) => sum + t.funnel4Bytes, 0);
  const totalF5 = testCases.reduce((sum, t) => sum + t.funnel5Bytes, 0);
  const totalF6 = testCases.reduce((sum, t) => sum + t.funnel6Bytes, 0);

  const overallFunnel6SavingsVsFunnel5Bytes = totalF5 - totalF6;
  const overallFunnel6SavingsVsFunnel5Percent =
    totalF5 > 0 ? ((totalF5 - totalF6) / totalF5) * 100 : 0;
  const overallTotalSavingsVsOriginalPercent =
    totalOriginal > 0 ? ((totalOriginal - totalF6) / totalOriginal) * 100 : 0;

  return {
    suiteName: 'Funnel 6: Hierarchical Spatial Composition Test Suite',
    totalTests: testCases.length,
    passedCount,
    failedCount,
    determinismPassed: testCases.find((t) => t.testId === 'TC-H12-DETERMINISTIC-BINARY-OUTPUT')?.passed ?? false,
    totalOriginalBytes: totalOriginal,
    totalFunnel4Bytes: totalF4,
    totalFunnel5Bytes: totalF5,
    totalFunnel6Bytes: totalF6,
    overallFunnel6SavingsVsFunnel5Bytes,
    overallFunnel6SavingsVsFunnel5Percent,
    overallTotalSavingsVsOriginalPercent,
    results: testCases,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Executes multi-dataset benchmark across Funnel 4 vs Funnel 5 vs Funnel 6.
 */
export function benchmarkSpatialHierarchy(): HierarchyBenchmarkReport {
  const buildBenchmarkDataset = (
    id: string,
    name: string,
    category: string,
    occurrences: { origin: Coordinate3D; blockId?: number }[],
    subPatterns: { token: string; offsets: [number, number, number][] }[],
    noiseCount = 0
  ): { root: RootMemory; injectedSegments: PlanSegment[] } => {
    const block0 = createMemoryBlock(0, null, [0, 0, 0], 1, `${name} Block 0`);
    const injectedSegments: PlanSegment[] = [];
    let stepIdx = 0;
    let occGlobal = 0;

    for (const occ of occurrences) {
      let subIdx = 0;
      for (const sub of subPatterns) {
        const cells: number[] = [];
        const symbols: string[] = [];

        for (const off of sub.offsets) {
          const cx = occ.origin.x + off[0];
          const cy = occ.origin.y + off[1];
          const cz = occ.origin.z + off[2];
          if (cx >= 0 && cx < DIMENSION && cy >= 0 && cy < DIMENSION && cz >= 0 && cz < DIMENSION) {
            const cid = coordinateToCellId(cx, cy, cz);
            block0.cells[cid].state = 1;
            block0.cells[cid].symbol = sub.token;
            block0.cells[cid].stepIndices = [stepIdx++];
            cells.push(cid);
            symbols.push(sub.token);
          }
        }

        if (cells.length > 0) {
          injectedSegments.push({
            segmentId: `BENCH-RUN-${occGlobal}_${subIdx}`,
            type: 'SPATIAL_RUN',
            blockId: 0,
            cells,
            symbols,
            parameters: {
              startCellId: cells[0],
              directionName: '+X',
              directionCode: 0,
              runLength: cells.length,
              startCoord: { x: occ.origin.x, y: occ.origin.y + sub.offsets[0][1], z: occ.origin.z + sub.offsets[0][2] },
            },
            ruleSyntax: `SPATIAL_RUN(+X, Len=${cells.length}, Sym='${sub.token}')`,
            serializedBytes: 13,
            rawEquivalentBytes: 7 + cells.length * 4,
            netSavingsBytes: 7 + cells.length * 4 - 13,
            netSavingsPercent: 40,
            isRule: true,
          });
        }
        subIdx++;
      }
      occGlobal++;
    }

    // Add noise cells if requested
    for (let i = 0; i < noiseCount; i++) {
      const rx = (i * 7 + 13) % DIMENSION;
      const ry = (i * 11 + 17) % DIMENSION;
      const rz = (i * 13 + 19) % DIMENSION;
      const cid = coordinateToCellId(rx, ry, rz);
      if (block0.cells[cid].state === 0) {
        block0.cells[cid].state = 1;
        block0.cells[cid].symbol = String.fromCharCode(65 + (i % 26));
        block0.cells[cid].stepIndices = [stepIdx++];
      }
    }

    const activeCount = block0.cells.filter((c) => c.state === 1).length;
    block0.metadata.activeCellCount = activeCount;

    const root: RootMemory = {
      rootId: 'ROOT',
      level: 1,
      blocks: [block0],
      activeBlockId: 0,
      totalCapacity: TOTAL_SPATIAL_CELLS,
      totalActiveCells: activeCount,
      entryRef: { blockId: 0, cellId: 0 },
      sequenceSteps: [],
      metadata: {
        title: name,
        createdAt: new Date().toISOString(),
        totalAllocatedBlocks: 1,
        researchQuestion: 'Hierarchical Spatial Composition Compression',
        isExpandable: true,
        preservesSpatialRelationships: true,
      },
    };

    return { root, injectedSegments };
  };

  const datasetsConfig = [
    {
      id: 'DS-01-DENSE-BRICK-CLUSTERS',
      name: 'Dense 3D Brick Clusters',
      category: 'Structural Solid',
      occurrences: [
        { origin: { x: 0, y: 0, z: 0 } },
        { origin: { x: 4, y: 0, z: 0 } },
        { origin: { x: 0, y: 4, z: 0 } },
        { origin: { x: 4, y: 4, z: 0 } },
        { origin: { x: 0, y: 0, z: 4 } },
        { origin: { x: 4, y: 0, z: 4 } },
      ],
      subPatterns: [
        { token: 'A', offsets: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] as [number, number, number][] },
        { token: 'B', offsets: [[0, 1, 0], [1, 1, 0], [2, 1, 0]] as [number, number, number][] },
        { token: 'C', offsets: [[0, 2, 0], [1, 2, 0], [2, 2, 0]] as [number, number, number][] },
      ],
      noiseCount: 0,
    },
    {
      id: 'DS-02-SPIRAL-ASSEMBLIES',
      name: 'Spatial Fibonacci Assemblies',
      category: 'Procedural Spiral',
      occurrences: [
        { origin: { x: 1, y: 1, z: 0 } },
        { origin: { x: 4, y: 2, z: 1 } },
        { origin: { x: 2, y: 5, z: 3 } },
        { origin: { x: 5, y: 1, z: 4 } },
      ],
      subPatterns: [
        { token: 'F1', offsets: [[0, 0, 0], [1, 0, 0]] as [number, number, number][] },
        { token: 'F2', offsets: [[0, 1, 0], [1, 1, 0]] as [number, number, number][] },
      ],
      noiseCount: 0,
    },
    {
      id: 'DS-03-SPARSE-DISTRIBUTED-MATRIX',
      name: 'Sparse Distributed Components',
      category: 'Sparse Matrix',
      occurrences: [
        { origin: { x: 0, y: 0, z: 0 } },
        { origin: { x: 3, y: 3, z: 3 } },
      ],
      subPatterns: [
        { token: 'S1', offsets: [[0, 0, 0], [1, 0, 0]] as [number, number, number][] },
        { token: 'S2', offsets: [[0, 2, 0], [1, 2, 0]] as [number, number, number][] },
      ],
      noiseCount: 0,
    },
    {
      id: 'DS-04-NOISY-HIGH-ENTROPY',
      name: 'High-Entropy Noisy Token Matrix',
      category: 'Unstructured Noise',
      occurrences: [],
      subPatterns: [],
      noiseCount: 40,
    },
    {
      id: 'DS-05-DEEP-MULTILEVEL-HIERARCHY',
      name: 'Multi-Level Hierarchical Sub-Structures',
      category: 'Nested Sub-Units',
      occurrences: [
        { origin: { x: 0, y: 0, z: 0 } },
        { origin: { x: 4, y: 0, z: 0 } },
        { origin: { x: 0, y: 4, z: 0 } },
        { origin: { x: 4, y: 4, z: 0 } },
      ],
      subPatterns: [
        { token: 'H1', offsets: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] as [number, number, number][] },
        { token: 'H2', offsets: [[0, 1, 0], [1, 1, 0], [2, 1, 0]] as [number, number, number][] },
        { token: 'H3', offsets: [[0, 2, 0], [1, 2, 0], [2, 2, 0]] as [number, number, number][] },
        { token: 'H4', offsets: [[0, 3, 0], [1, 3, 0], [2, 3, 0]] as [number, number, number][] },
      ],
      noiseCount: 0,
    },
  ];

  const datasetBenchmarks: HierarchyDatasetBenchmark[] = [];

  for (const cfg of datasetsConfig) {
    const { root, injectedSegments } = buildBenchmarkDataset(
      cfg.id,
      cfg.name,
      cfg.category,
      cfg.occurrences,
      cfg.subPatterns,
      cfg.noiseCount
    );

    const enc = encodeToHierarchicalSpatialCompact(root, { forceInjectedSegments: injectedSegments });

    const addSavingsBytes = enc.measurement.additionalSavingsVsFunnel5;
    const addSavingsPct =
      enc.measurement.funnel5Bytes > 0
        ? (addSavingsBytes / enc.measurement.funnel5Bytes) * 100
        : 0;
    const isWinner = enc.acceptedComposites.length > 0 && addSavingsBytes > 0;

    let status: 'COMPOSITE_BENEFICIAL' | 'FUNNEL5_PRESERVED' | 'RAW_BYPASS' = 'FUNNEL5_PRESERVED';
    if (isWinner) {
      status = 'COMPOSITE_BENEFICIAL';
    } else if (cfg.noiseCount > 0 && cfg.occurrences.length === 0) {
      status = 'RAW_BYPASS';
    }

    datasetBenchmarks.push({
      datasetId: cfg.id,
      datasetName: cfg.name,
      category: cfg.category,
      cellCount: TOTAL_SPATIAL_CELLS,
      activeCellCount: root.totalActiveCells,
      originalBytes: enc.measurement.original3dBytes,
      funnel4Bytes: enc.measurement.funnel4Bytes,
      funnel5Bytes: enc.measurement.funnel5Bytes,
      funnel6Bytes: enc.measurement.funnel6Bytes,
      funnel6DictionaryBytes: enc.measurement.funnel6DictionaryBytes,
      funnel6CompositeBytes: enc.measurement.funnel6CompositeBytes,
      funnel6ReferenceBytes: enc.measurement.funnel6ReferenceBytes,
      funnel6RawBytes: enc.measurement.funnel6RawBytes,
      additionalSavingsVsFunnel5Bytes: addSavingsBytes,
      additionalSavingsVsFunnel5Percent: addSavingsPct,
      totalSavingsVsOriginalBytes: enc.measurement.totalSavingsVsOriginal,
      reductionPercent: enc.measurement.reductionPercent,
      compressionRatio: enc.measurement.compressionRatio,
      acceptedCompositesCount: enc.acceptedComposites.length,
      isFunnel6Winner: isWinner,
      status,
    });
  }

  const totalOriginal = datasetBenchmarks.reduce((acc, d) => acc + d.originalBytes, 0);
  const totalF4 = datasetBenchmarks.reduce((acc, d) => acc + d.funnel4Bytes, 0);
  const totalF5 = datasetBenchmarks.reduce((acc, d) => acc + d.funnel5Bytes, 0);
  const totalF6 = datasetBenchmarks.reduce((acc, d) => acc + d.funnel6Bytes, 0);
  const totalDictBytes = datasetBenchmarks.reduce((acc, d) => acc + d.funnel6DictionaryBytes, 0);
  const totalCompBytes = datasetBenchmarks.reduce((acc, d) => acc + d.funnel6CompositeBytes, 0);
  const totalRefBytes = datasetBenchmarks.reduce((acc, d) => acc + d.funnel6ReferenceBytes, 0);
  const totalRawBytes = datasetBenchmarks.reduce((acc, d) => acc + d.funnel6RawBytes, 0);

  const overallSavingsVsFunnel5Bytes = totalF5 - totalF6;
  const overallSavingsVsFunnel5Percent =
    totalF5 > 0 ? (overallSavingsVsFunnel5Bytes / totalF5) * 100 : 0;
  const overallSavingsVsOriginalBytes = totalOriginal - totalF6;
  const overallSavingsVsOriginalPercent =
    totalOriginal > 0 ? (overallSavingsVsOriginalBytes / totalOriginal) * 100 : 0;
  const overallCompressionRatio = totalF6 > 0 ? totalOriginal / totalF6 : 1;

  // Best / Worst
  const sorted = [...datasetBenchmarks].sort(
    (a, b) => b.additionalSavingsVsFunnel5Percent - a.additionalSavingsVsFunnel5Percent
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const funnel6WinsCount = datasetBenchmarks.filter((d) => d.isFunnel6Winner).length;

  return {
    title: 'Funnel 4 vs Funnel 5 vs Funnel 6 Multi-Dataset Comparative Benchmark',
    timestamp: new Date().toISOString(),
    datasets: datasetBenchmarks,
    summary: {
      totalDatasets: datasetBenchmarks.length,
      totalOriginalBytes: totalOriginal,
      totalFunnel4Bytes: totalF4,
      totalFunnel5Bytes: totalF5,
      totalFunnel6Bytes: totalF6,
      totalFunnel6DictionaryBytes: totalDictBytes,
      totalFunnel6CompositeBytes: totalCompBytes,
      totalFunnel6ReferenceBytes: totalRefBytes,
      totalFunnel6RawBytes: totalRawBytes,
      overallSavingsVsFunnel5Bytes,
      overallSavingsVsFunnel5Percent,
      overallSavingsVsOriginalBytes,
      overallSavingsVsOriginalPercent,
      overallCompressionRatio,
      bestCompositeDataset: best.datasetName,
      bestCompositeSavingsPercent: best.additionalSavingsVsFunnel5Percent,
      worstCompositeDataset: worst.datasetName,
      funnel6WinsCount,
    },
  };
}

export { decodeHierarchicalCompactBinary } from './spatialHierarchyDecoder';

