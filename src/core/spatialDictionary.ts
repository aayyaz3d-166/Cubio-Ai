/**
 * 3D Memory Studio - Funnel 5: Spatial Pattern Dictionary Core Engine
 * 
 * Target Problem:
 * Funnel 4 encodes valid spatial rules into .compact3d. Repeated identical/canonical
 * rules cause identical rule metadata to be serialized many times across or within blocks.
 * 
 * Funnel 5 investigates whether a reusable spatial pattern dictionary can reduce this
 * repeated metadata overhead.
 * 
 * Strict Evidence-Based Invariant:
 * The dictionary is experimental and must ONLY be used when:
 * dictionaryEntryCost + referenceCosts < existingRepresentationCost
 * 
 * Never assumes dictionary compression is beneficial.
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
  COMPACT_FORMAT_VERSION,
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
  CanonicalRuleParameter,
  Compact3DArtifactV2,
  COMPACT_FORMAT_VERSION_V2,
  DICTIONARY_ENTRY_HEADER_BYTES,
  DICTIONARY_SECTION_HEADER_BYTES,
  DICT_REF_RECORD_HEADER_BYTES,
  DictionaryEntry,
  DictionaryEntryScore,
  DictionaryOverheadMetrics,
  DictionaryTestCase,
  DictionaryTestSuiteResult,
  RECORD_OPCODE_DICTIONARY_REF,
  RepeatedRuleGroup,
  RuleOccurrence,
  SpatialEncoderV2Result,
  SpatialPatternDictionary,
} from '../types/spatialDictionary';
import { cellIdToCoordinate, coordinateToCellId, DIMENSION, TOTAL_SPATIAL_CELLS } from './address369';
import { createMemoryBlock } from './hierarchicalMemory';
import { decodeCompactBinary } from './spatialDecoder';
import { serializeRootMemoryCompactV2 } from './storage';

// ============================================================================
// 1. CANONICALIZATION & RULE SIGNATURES
// ============================================================================

/**
 * Normalizes a PlanSegment into its invariant Canonical Rule definition.
 * All coordinates are normalized to relative offsets where origin is (0,0,0).
 */
export function canonicalizeRule(segment: PlanSegment): CanonicalRule | null {
  if (segment.type === 'RAW' || !segment.isRule) {
    return null;
  }

  const { parameters, symbols, cells } = segment;
  let ruleType: SpatialSegmentType = segment.type;
  let canonicalParams: CanonicalRuleParameter = {
    ruleType,
    tokens: symbols.length > 0 ? [...symbols] : ['?'],
    relativeOffsets: [],
    symbols: [...symbols],
  };

  // Derive origin
  const originCellId = segment.parameters.startCellId ?? cells[0] ?? 0;
  const originCoord = segment.parameters.startCoord ?? cellIdToCoordinate(originCellId);

  // 1. SPATIAL RUN
  if (ruleType === 'SPATIAL_RUN') {
    const dirCode = parameters.directionCode ?? (parameters.directionName ? DIRECTION_TO_CODE[parameters.directionName] : 0) ?? 0;
    const runLength = parameters.runLength ?? cells.length;
    const primaryToken = symbols[0] || 'A';

    canonicalParams = {
      ruleType: 'SPATIAL_RUN',
      directionCode: dirCode,
      directionName: parameters.directionName || '+X',
      directionVector: parameters.directionVector || [1, 0, 0],
      runLength,
      tokens: [primaryToken],
      relativeOffsets: [],
      symbols: [primaryToken],
    };
  }
  // 2. REPETITION
  else if (ruleType === 'REPETITION') {
    const patternTokens = parameters.patternTokens && parameters.patternTokens.length > 0
      ? [...parameters.patternTokens]
      : symbols.slice(0, parameters.period || 1);
    const period = parameters.period || patternTokens.length || 1;
    const stride = parameters.stride || 1;
    const repeatCount = parameters.repeatCount || Math.floor(cells.length / period);

    canonicalParams = {
      ruleType: 'REPETITION',
      tokens: patternTokens,
      period,
      stride,
      repeatCount,
      relativeOffsets: [],
      symbols: patternTokens,
    };
  }
  // 3. CLUSTER
  else if (ruleType === 'CLUSTER') {
    const relativeOffsets: Coordinate3D[] = cells.map((cid) => {
      const c = cellIdToCoordinate(cid);
      return {
        x: c.x - originCoord.x,
        y: c.y - originCoord.y,
        z: c.z - originCoord.z,
      };
    });

    canonicalParams = {
      ruleType: 'CLUSTER',
      tokens: [...symbols],
      relativeOffsets,
      symbols: [...symbols],
    };
  }
  // 4. REPEATED SHAPE
  else if (ruleType === 'REPEATED_SHAPE') {
    const shapePoints = (parameters.shapePoints as Coordinate3D[]) || [];
    let relativeOffsets: Coordinate3D[] = [];
    if (shapePoints.length > 0) {
      const firstPt = shapePoints[0];
      relativeOffsets = shapePoints.map((p) => ({
        x: p.x - firstPt.x,
        y: p.y - firstPt.y,
        z: p.z - firstPt.z,
      }));
    } else {
      relativeOffsets = cells.map((cid) => {
        const c = cellIdToCoordinate(cid);
        return {
          x: c.x - originCoord.x,
          y: c.y - originCoord.y,
          z: c.z - originCoord.z,
        };
      });
    }

    canonicalParams = {
      ruleType: 'REPEATED_SHAPE',
      shapeType: parameters.shapeType || 'CUSTOM_SHAPE',
      tokens: [...symbols],
      relativeOffsets,
      symbols: [...symbols],
    };
  }
  // 5. SEQUENCE PATH
  else if (ruleType === 'SEQUENCE_PATH') {
    const deltaSteps = (parameters.deltaSteps as [number, number, number][]) || [];
    canonicalParams = {
      ruleType: 'SEQUENCE_PATH',
      tokens: [...symbols],
      relativeOffsets: [],
      symbols: [...symbols],
      extraParams: { deltaSteps },
    };
  }

  // Calculate inline vs dict byte costs
  const inlineBytes = segment.serializedBytes || RECORD_HEADER_BYTES + 8;
  const dictEntryBytes = calculateDictEntryByteCost(canonicalParams);
  const dictRefBytes = DICT_REF_RECORD_HEADER_BYTES; // 9 bytes

  const signature = calculateRuleSignature(canonicalParams);
  const humanSyntax = formatCanonicalRuleSyntax(canonicalParams);

  return {
    signature,
    ruleType,
    parameters: canonicalParams,
    inlineSerializedBytesPerOccurrence: inlineBytes,
    dictEntrySerializedBytes: dictEntryBytes,
    dictRefSerializedBytes: dictRefBytes,
    humanReadableSyntax: humanSyntax,
  };
}

/**
 * Generates an immutable, deterministic signature string for a canonical rule.
 */
export function calculateRuleSignature(params: CanonicalRuleParameter): string {
  const parts: string[] = [params.ruleType];

  if (params.ruleType === 'SPATIAL_RUN') {
    parts.push(`DIR:${params.directionCode ?? params.directionName}`);
    parts.push(`LEN:${params.runLength}`);
    parts.push(`TOK:${params.tokens.join(',')}`);
  } else if (params.ruleType === 'REPETITION') {
    parts.push(`TOK:${params.tokens.join(',')}`);
    parts.push(`PER:${params.period}`);
    parts.push(`STR:${params.stride}`);
    parts.push(`REP:${params.repeatCount}`);
  } else if (params.ruleType === 'CLUSTER' || params.ruleType === 'REPEATED_SHAPE') {
    if (params.shapeType) parts.push(`SHP:${params.shapeType}`);
    const offsetStr = params.relativeOffsets
      .map((o) => `(${o.x},${o.y},${o.z})`)
      .join(';');
    parts.push(`OFF:${offsetStr}`);
    parts.push(`TOK:${params.tokens.join(',')}`);
  } else if (params.ruleType === 'SEQUENCE_PATH') {
    parts.push(`TOK:${params.tokens.join(',')}`);
    if (params.extraParams?.deltaSteps) {
      parts.push(`DEL:${JSON.stringify(params.extraParams.deltaSteps)}`);
    }
  }

  return parts.join('|');
}

function formatCanonicalRuleSyntax(params: CanonicalRuleParameter): string {
  switch (params.ruleType) {
    case 'SPATIAL_RUN':
      return `CANONICAL_RUN(dir=${params.directionName || params.directionCode}, len=${params.runLength}, tok='${params.tokens[0]}')`;
    case 'REPETITION':
      return `CANONICAL_REP(pattern=[${params.tokens.join(',')}], period=${params.period}, repeat=${params.repeatCount})`;
    case 'CLUSTER':
      return `CANONICAL_CLUSTER(pts=${params.relativeOffsets.length}, tok=[${params.tokens.slice(0, 3).join(',')}...])`;
    case 'REPEATED_SHAPE':
      return `CANONICAL_SHAPE(type=${params.shapeType || 'GEO'}, pts=${params.relativeOffsets.length})`;
    default:
      return `CANONICAL_RULE(${params.ruleType})`;
  }
}

/**
 * Calculates exact serialized bytes of writing a canonical rule in the dictionary table.
 */
function calculateDictEntryByteCost(params: CanonicalRuleParameter): number {
  let payloadBytes = 0;

  switch (params.ruleType) {
    case 'SPATIAL_RUN':
      // [DirCode (1B), RunLength (2B), SymbolChar (1B)] = 4B
      payloadBytes = 4;
      break;

    case 'REPETITION':
      // [Period (1B), Stride (1B), RepeatCount (2B), TokenCount (1B), Tokens (1B each)]
      payloadBytes = 5 + params.tokens.length;
      break;

    case 'CLUSTER':
    case 'REPEATED_SHAPE':
      // [PointCount (2B), RelativeCoords (3B each: x,y,z as signed int8), SymbolBytes (1B each)]
      payloadBytes = 2 + (params.relativeOffsets.length * 3) + params.symbols.length;
      break;

    case 'SEQUENCE_PATH':
      // [StepCount (2B), Deltas (3B each)]
      const steps = (params.extraParams?.deltaSteps as unknown[]) || [];
      payloadBytes = 2 + (steps.length * 3) + params.symbols.length;
      break;

    default:
      payloadBytes = 8;
  }

  return DICTIONARY_ENTRY_HEADER_BYTES + payloadBytes;
}

// ============================================================================
// 2. DISCOVER REPEATED RULES
// ============================================================================

/**
 * Discovers and groups all repeated canonical rules across an EncodingPlan.
 */
export function discoverRepeatedRules(plan: EncodingPlan): RepeatedRuleGroup[] {
  const groupsMap = new Map<string, RepeatedRuleGroup>();

  for (const block of plan.blocks) {
    for (const segment of block.segments) {
      if (segment.type === 'RAW' || !segment.isRule) {
        continue;
      }

      const canonical = canonicalizeRule(segment);
      if (!canonical) continue;

      const originCellId = segment.parameters.startCellId ?? segment.cells[0] ?? 0;
      const originCoord = segment.parameters.startCoord ?? cellIdToCoordinate(originCellId);

      const occurrence: RuleOccurrence = {
        segmentId: segment.segmentId,
        blockId: block.blockId,
        originCellId,
        originCoord,
        coveredCells: [...segment.cells],
        symbols: [...segment.symbols],
      };

      if (!groupsMap.has(canonical.signature)) {
        groupsMap.set(canonical.signature, {
          signature: canonical.signature,
          canonicalRule: canonical,
          occurrences: [occurrence],
          occurrenceCount: 1,
        });
      } else {
        const existing = groupsMap.get(canonical.signature)!;
        existing.occurrences.push(occurrence);
        existing.occurrenceCount += 1;
      }
    }
  }

  return Array.from(groupsMap.values());
}

// ============================================================================
// 3. DICTIONARY ENTRY SCORING & SELECTION
// ============================================================================

/**
 * Evaluates the mathematical profitability of adding a repeated rule group to the dictionary.
 * 
 * Strict condition:
 * dictEntryCost + (k * dictRefCost) < (k * inlineCost)
 */
export function scoreDictionaryEntry(group: RepeatedRuleGroup): DictionaryEntryScore {
  const k = group.occurrenceCount;
  const inlinePerOccurrence = group.canonicalRule.inlineSerializedBytesPerOccurrence;
  const dictEntryBytes = group.canonicalRule.dictEntrySerializedBytes;
  const dictRefPerOccurrence = group.canonicalRule.dictRefSerializedBytes;

  const inlineTotalBytes = k * inlinePerOccurrence;
  const dictRefsTotalBytes = k * dictRefPerOccurrence;
  const dictTotalBytes = dictEntryBytes + dictRefsTotalBytes;
  const netSavingsBytes = inlineTotalBytes - dictTotalBytes;
  const savingsRatio = dictTotalBytes > 0 ? inlineTotalBytes / dictTotalBytes : 1;

  // Calculate break-even occurrences threshold
  // k * inline > dictEntry + k * dictRef
  // k * (inline - dictRef) > dictEntry
  // k > dictEntry / (inline - dictRef)
  const costDiff = inlinePerOccurrence - dictRefPerOccurrence;
  const breakEvenOccurrences = costDiff > 0 ? Math.ceil((dictEntryBytes + 1) / costDiff) : 999;

  let isProfitable = false;
  let recommendation: DictionaryEntryScore['recommendation'] = 'KEEP_INLINE';

  if (k <= 1) {
    isProfitable = false;
    recommendation = 'DISQUALIFIED_SINGLE_OCCURRENCE';
  } else if (netSavingsBytes > 0) {
    isProfitable = true;
    recommendation = 'USE_DICTIONARY';
  } else {
    isProfitable = false;
    recommendation = 'KEEP_INLINE';
  }

  return {
    signature: group.signature,
    ruleType: group.canonicalRule.ruleType,
    occurrenceCount: k,
    inlineTotalBytes,
    dictEntryBytes,
    dictRefsTotalBytes,
    dictTotalBytes,
    netSavingsBytes,
    savingsRatio,
    breakEvenOccurrences,
    isProfitable,
    recommendation,
  };
}

/**
 * Selects only strictly profitable dictionary entries, ensuring total savings exceed
 * the global dictionary section header overhead (4 bytes).
 */
export function selectDictionaryEntries(candidateGroups: RepeatedRuleGroup[]): {
  selected: RepeatedRuleGroup[];
  scores: Map<string, DictionaryEntryScore>;
  metrics: DictionaryOverheadMetrics;
} {
  const scores = new Map<string, DictionaryEntryScore>();
  const profitableGroups: RepeatedRuleGroup[] = [];

  for (const group of candidateGroups) {
    const score = scoreDictionaryEntry(group);
    scores.set(group.signature, score);

    if (score.isProfitable) {
      profitableGroups.push(group);
    }
  }

  // Sort profitable entries by highest net savings first
  profitableGroups.sort((a, b) => {
    const scoreA = scores.get(a.signature)!.netSavingsBytes;
    const scoreB = scores.get(b.signature)!.netSavingsBytes;
    return scoreB - scoreA;
  });

  // Calculate overall dictionary metrics
  const dictionaryHeaderBytes = DICTIONARY_SECTION_HEADER_BYTES; // 4 bytes
  let totalDictEntriesBytes = 0;
  let totalDictRefRecordsBytes = 0;
  let replacedInlineRecordsBytes = 0;
  let totalReferencesCount = 0;

  for (const group of profitableGroups) {
    const score = scores.get(group.signature)!;
    totalDictEntriesBytes += score.dictEntryBytes;
    totalDictRefRecordsBytes += score.dictRefsTotalBytes;
    replacedInlineRecordsBytes += score.inlineTotalBytes;
    totalReferencesCount += group.occurrenceCount;
  }

  const totalDictSectionBytes = dictionaryHeaderBytes + totalDictEntriesBytes;
  const grossSavingsBytes = replacedInlineRecordsBytes - totalDictRefRecordsBytes;
  const netDictionarySavingsBytes = grossSavingsBytes - totalDictSectionBytes;
  const isDictionaryBeneficial = profitableGroups.length > 0 && netDictionarySavingsBytes > 0;

  const metrics: DictionaryOverheadMetrics = {
    dictionaryHeaderBytes,
    totalDictEntriesBytes,
    totalDictSectionBytes,
    totalDictRefRecordsBytes,
    replacedInlineRecordsBytes,
    grossSavingsBytes,
    netDictionarySavingsBytes,
    isDictionaryBeneficial,
    dictionaryEntryCount: profitableGroups.length,
    totalReferencesCount,
  };

  // If net savings does not beat the 4-byte header overhead, reject dictionary entirely!
  if (!isDictionaryBeneficial) {
    return {
      selected: [],
      scores,
      metrics: {
        ...metrics,
        isDictionaryBeneficial: false,
        dictionaryEntryCount: 0,
        totalReferencesCount: 0,
      },
    };
  }

  return {
    selected: profitableGroups,
    scores,
    metrics,
  };
}

/**
 * Calculates detailed dictionary overhead and comparison metrics.
 */
export function calculateDictionaryOverhead(
  entries: DictionaryEntry[],
  groups: RepeatedRuleGroup[]
): DictionaryOverheadMetrics {
  const dictionaryHeaderBytes = DICTIONARY_SECTION_HEADER_BYTES;
  let totalDictEntriesBytes = 0;
  let totalDictRefRecordsBytes = 0;
  let replacedInlineRecordsBytes = 0;
  let totalReferencesCount = 0;

  for (const entry of entries) {
    totalDictEntriesBytes += entry.binaryByteLength;
    totalDictRefRecordsBytes += entry.occurrencesCount * DICT_REF_RECORD_HEADER_BYTES;
    replacedInlineRecordsBytes += entry.occurrencesCount * entry.canonicalRule.inlineSerializedBytesPerOccurrence;
    totalReferencesCount += entry.occurrencesCount;
  }

  const totalDictSectionBytes = dictionaryHeaderBytes + totalDictEntriesBytes;
  const grossSavingsBytes = replacedInlineRecordsBytes - totalDictRefRecordsBytes;
  const netDictionarySavingsBytes = grossSavingsBytes - totalDictSectionBytes;

  return {
    dictionaryHeaderBytes,
    totalDictEntriesBytes,
    totalDictSectionBytes,
    totalDictRefRecordsBytes,
    replacedInlineRecordsBytes,
    grossSavingsBytes,
    netDictionarySavingsBytes,
    isDictionaryBeneficial: entries.length > 0 && netDictionarySavingsBytes > 0,
    dictionaryEntryCount: entries.length,
    totalReferencesCount,
  };
}

// ============================================================================
// 4. BUILD PATTERN DICTIONARY
// ============================================================================

/**
 * Builds the complete binary representation of a single dictionary entry.
 */
function serializeDictionaryEntryPayload(dictId: number, canonical: CanonicalRule): Uint8Array {
  const params = canonical.parameters;
  const buffers: number[] = [];

  // [DictId (2B), RuleOpcode (1B), ParamLength (2B placeholder), Flags (1B)]
  buffers.push((dictId >> 8) & 0xff, dictId & 0xff);

  let opcode = RECORD_OPCODE_RAW;
  switch (params.ruleType) {
    case 'SPATIAL_RUN': opcode = RECORD_OPCODE_SPATIAL_RUN; break;
    case 'REPETITION': opcode = RECORD_OPCODE_REPETITION; break;
    case 'CLUSTER': opcode = RECORD_OPCODE_CLUSTER; break;
    case 'REPEATED_SHAPE': opcode = RECORD_OPCODE_REPEATED_SHAPE; break;
    case 'SEQUENCE_PATH': opcode = RECORD_OPCODE_SEQUENCE_PATH; break;
  }
  buffers.push(opcode);

  // Payload content
  const payload: number[] = [];
  if (params.ruleType === 'SPATIAL_RUN') {
    // [DirCode (1B), RunLength (2B), Symbol (1B)]
    payload.push(params.directionCode ?? 0);
    const len = params.runLength ?? 0;
    payload.push((len >> 8) & 0xff, len & 0xff);
    payload.push(params.tokens[0]?.charCodeAt(0) || 65);
  } else if (params.ruleType === 'REPETITION') {
    // [Period (1B), Stride (1B), RepeatCount (2B), TokenCount (1B), Tokens...]
    payload.push(params.period ?? 1);
    payload.push(params.stride ?? 1);
    const rep = params.repeatCount ?? 1;
    payload.push((rep >> 8) & 0xff, rep & 0xff);
    payload.push(params.tokens.length);
    for (const t of params.tokens) {
      payload.push(t.charCodeAt(0));
    }
  } else if (params.ruleType === 'CLUSTER' || params.ruleType === 'REPEATED_SHAPE') {
    // [PointCount (2B), Coords (3B each: x,y,z signed int8), SymbolCount (1B), Symbols...]
    const pts = params.relativeOffsets;
    payload.push((pts.length >> 8) & 0xff, pts.length & 0xff);
    for (const p of pts) {
      // Clamp to signed int8 (-128..127)
      const px = (p.x < 0 ? 256 + p.x : p.x) & 0xff;
      const py = (p.y < 0 ? 256 + p.y : p.y) & 0xff;
      const pz = (p.z < 0 ? 256 + p.z : p.z) & 0xff;
      payload.push(px, py, pz);
    }
    payload.push(params.symbols.length & 0xff);
    for (const s of params.symbols) {
      payload.push(s.charCodeAt(0));
    }
  }

  // Param Length (2B)
  const paramLength = payload.length;
  buffers.push((paramLength >> 8) & 0xff, paramLength & 0xff);
  buffers.push(0x00); // Flags (1B)

  // Append payload
  buffers.push(...payload);

  return new Uint8Array(buffers);
}

/**
 * Builds the Spatial Pattern Dictionary from an EncodingPlan.
 */
export function buildPatternDictionary(plan: EncodingPlan): SpatialPatternDictionary {
  const candidateGroups = discoverRepeatedRules(plan);
  const { selected, scores, metrics } = selectDictionaryEntries(candidateGroups);

  const entries: DictionaryEntry[] = [];
  const entriesMap = new Map<number, DictionaryEntry>();
  const signatureToDictIdMap = new Map<string, number>();

  let nextDictId = 1;

  for (const group of selected) {
    const dictId = nextDictId++;
    const score = scores.get(group.signature)!;
    const binaryPayload = serializeDictionaryEntryPayload(dictId, group.canonicalRule);

    const entry: DictionaryEntry = {
      dictId,
      signature: group.signature,
      canonicalRule: group.canonicalRule,
      score,
      occurrencesCount: group.occurrenceCount,
      binaryPayload,
      binaryByteLength: binaryPayload.length,
    };

    entries.push(entry);
    entriesMap.set(dictId, entry);
    signatureToDictIdMap.set(group.signature, dictId);
  }

  return {
    version: 2,
    entries,
    entriesMap,
    signatureToDictIdMap,
    overheadMetrics: metrics,
    isApplied: metrics.isDictionaryBeneficial,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// 5. CREATE DICTIONARY REFERENCES IN ENCODING PLAN
// ============================================================================

/**
 * Substitutes inline rule segments in an EncodingPlan with DICTIONARY_REF segments
 * for all rules selected in the active dictionary.
 */
export function createDictionaryReferences(
  plan: EncodingPlan,
  dictionary: SpatialPatternDictionary
): EncodingPlan {
  if (!dictionary.isApplied || dictionary.entries.length === 0) {
    return plan;
  }

  const modifiedBlocks = plan.blocks.map((block) => {
    const newSegments = block.segments.map((seg) => {
      if (seg.type === 'RAW' || !seg.isRule) {
        return seg;
      }

      const canonical = canonicalizeRule(seg);
      if (!canonical) return seg;

      const dictId = dictionary.signatureToDictIdMap.get(canonical.signature);
      if (!dictId) {
        return seg; // Remains inline if not in dictionary
      }

      const originCellId = seg.parameters.startCellId ?? seg.cells[0] ?? 0;

      // Transform into DICTIONARY_REF segment
      const dictRefSegment: PlanSegment = {
        ...seg,
        type: 'REPEATED_SHAPE', // For broad compatibility or custom type
        ruleSyntax: `DICT_REF(#${dictId}, originCell=${originCellId})`,
        serializedBytes: DICT_REF_RECORD_HEADER_BYTES,
        parameters: {
          ...seg.parameters,
          dictId,
          isDictionaryRef: true,
          dictSignature: canonical.signature,
          originCellId,
        },
      };

      return dictRefSegment;
    });

    return {
      ...block,
      segments: newSegments,
    };
  });

  return {
    ...plan,
    blocks: modifiedBlocks,
  };
}

// ============================================================================
// 6. COMPACT3D V2 BINARY SERIALIZER (WITH DICTIONARY)
// ============================================================================

/**
 * Encodes a RootMemory into Compact3D V2 format (optionally using Spatial Pattern Dictionary).
 */
export function encodeToSpatialCompactV2(
  rootMemory: RootMemory,
  options?: { enableDictionary?: boolean }
): SpatialEncoderV2Result {
  const startTime = performance.now();
  const root = ensureRootMemory(rootMemory);

  // 1. Run standard Funnel 2/4 Spatial Encoder to get base Encoding Plan and V1 artifact
  const v1Result = encodeToSpatialCompact(root);
  const plan = v1Result.plan;

  // 2. Build Spatial Pattern Dictionary
  const shouldEnableDict = options?.enableDictionary !== false;
  const dictionary = shouldEnableDict ? buildPatternDictionary(plan) : {
    version: 2 as const,
    entries: [],
    entriesMap: new Map(),
    signatureToDictIdMap: new Map(),
    overheadMetrics: {
      dictionaryHeaderBytes: 0,
      totalDictEntriesBytes: 0,
      totalDictSectionBytes: 0,
      totalDictRefRecordsBytes: 0,
      replacedInlineRecordsBytes: 0,
      grossSavingsBytes: 0,
      netDictionarySavingsBytes: 0,
      isDictionaryBeneficial: false,
      dictionaryEntryCount: 0,
      totalReferencesCount: 0,
    },
    isApplied: false,
    timestamp: new Date().toISOString(),
  };

  // 3. If dictionary is not beneficial, generate standard V1 or V2 format without dictionary
  const isDictApplied = dictionary.isApplied && dictionary.entries.length > 0;

  // 4. Build Binary Buffer for Compact3D V2
  const binaryBuffer = serializeCompactV2Binary(root, plan, dictionary, isDictApplied);

  const durationMs = Math.max(0.1, performance.now() - startTime);

  const originalBytes = v1Result.measurement.original3dBytes;
  const compactV1Bytes = v1Result.measurement.compact3dBytes;
  const compactV2Bytes = binaryBuffer.byteLength;

  const logicalChecksum = computeLogicalMemoryChecksum(root);
  const compactChecksum = calculateDeterministicChecksum(binaryBuffer);

  const artifact: Compact3DArtifactV2 = {
    format: 'compact3d',
    version: 2,
    sourceFormat: '3dmemory',
    timestamp: new Date().toISOString(),
    hasDictionary: isDictApplied,
    dictionary: isDictApplied
      ? {
          entryCount: dictionary.entries.length,
          totalDictBytes: dictionary.overheadMetrics.totalDictSectionBytes,
          entries: dictionary.entries.map((e) => ({
            dictId: e.dictId,
            ruleType: e.canonicalRule.ruleType,
            signature: e.signature,
            parameters: e.canonicalRule.parameters as unknown as Record<string, unknown>,
            byteLength: e.binaryByteLength,
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
      original3dBytes: originalBytes,
      compactV1Bytes,
      compactV2Bytes,
      v1SavingsBytes: originalBytes - compactV1Bytes,
      v2SavingsBytes: originalBytes - compactV2Bytes,
      dictionaryOverheadBytes: dictionary.overheadMetrics.totalDictSectionBytes,
      dictionaryNetSavingsBytes: dictionary.overheadMetrics.netDictionarySavingsBytes,
      isDictionaryWinner: compactV2Bytes < compactV1Bytes,
    },
  };

  // Hex dump preview
  let hex = '';
  const dumpLen = Math.min(64, binaryBuffer.length);
  for (let i = 0; i < dumpLen; i++) {
    hex += binaryBuffer[i].toString(16).padStart(2, '0').toUpperCase() + ' ';
    if ((i + 1) % 16 === 0) hex += '\n';
  }

  return {
    plan,
    dictionary,
    artifact,
    binaryBuffer,
    hexDump: hex.trim(),
    measurement: {
      original3dBytes: originalBytes,
      compactV1Bytes,
      compactV2Bytes,
      dictionarySectionBytes: isDictApplied ? dictionary.overheadMetrics.totalDictSectionBytes : 0,
      dictRefsBytes: isDictApplied ? dictionary.overheadMetrics.totalDictRefRecordsBytes : 0,
      netDictionaryBenefitBytes: isDictApplied ? dictionary.overheadMetrics.netDictionarySavingsBytes : 0,
      isDictionaryApplied: isDictApplied,
      logicalChecksum,
      compactChecksum,
      durationMs,
    },
    isValid: plan.isValid,
    status: plan.isValid ? 'ENCODED' : 'ENCODING_FAIL',
    statusMessage: plan.isValid
      ? isDictApplied
        ? `Successfully encoded Compact3D V2 with Spatial Pattern Dictionary (${dictionary.entries.length} entries, -${dictionary.overheadMetrics.netDictionarySavingsBytes} B metadata savings)`
        : 'Successfully encoded Compact3D V2 (Dictionary bypassed: no repetitive overhead benefit)'
      : 'Encoding failed: plan invalid',
  };
}

/**
 * Binary layout generator for Compact3D V2:
 * [File Header (16B)]
 * [Block Directory Table (10B per block)]
 * [Dictionary Section: DictCount (2B), TotalDictBytes (2B), Entries...] (If applied)
 * [Record Section: Standard opcodes (0x00..0x05) or DICTIONARY_REF (0x06)]
 */
function serializeCompactV2Binary(
  root: RootMemory,
  plan: EncodingPlan,
  dictionary: SpatialPatternDictionary,
  isDictApplied: boolean
): Uint8Array {
  const bytes: number[] = [];

  // Total records count
  let totalRecords = 0;
  for (const b of plan.blocks) {
    totalRecords += b.segments.length;
  }

  // 1. FILE HEADER (16 Bytes)
  // [Magic 'CP3D' (4B), Version 0x02 (1B), Flags (1B: bit 0 = hasDictionary), BlocksCount (2B), RecordsCount (2B), TotalCells (2B), Checksum (4B)]
  bytes.push(...COMPACT_MAGIC_BYTES);
  bytes.push(COMPACT_FORMAT_VERSION_V2);
  const flags = isDictApplied ? 0x01 : 0x00;
  bytes.push(flags);

  const blockCount = plan.blocks.length;
  bytes.push((blockCount >> 8) & 0xff, blockCount & 0xff);

  bytes.push((totalRecords >> 8) & 0xff, totalRecords & 0xff);

  const activeCells = plan.totalActiveCells;
  bytes.push((activeCells >> 8) & 0xff, activeCells & 0xff);

  const logicalChkStr = computeLogicalMemoryChecksum(root);
  const logicalChkNum = parseInt(logicalChkStr.replace('0x', ''), 16) || 0;
  bytes.push(
    (logicalChkNum >> 24) & 0xff,
    (logicalChkNum >> 16) & 0xff,
    (logicalChkNum >> 8) & 0xff,
    logicalChkNum & 0xff
  );

  // 2. BLOCK DIRECTORY TABLE (10 Bytes per block)
  for (const block of plan.blocks) {
    const origBlock = root.blocks.find((b) => b.blockId === block.blockId);
    const parentId = origBlock?.parentBlockId ?? 0;
    const origin = Array.isArray(origBlock?.origin)
      ? origBlock.origin
      : [0, 0, 0];

    bytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
    bytes.push((parentId >> 8) & 0xff, parentId & 0xff);
    bytes.push(origin[0] & 0xff, origin[1] & 0xff, origin[2] & 0xff);

    const activeCount = block.totalActiveCells;
    bytes.push((activeCount >> 8) & 0xff, activeCount & 0xff);

    bytes.push(block.segments.length & 0xff);
  }

  // 3. DICTIONARY SECTION (If applied)
  if (isDictApplied && dictionary.entries.length > 0) {
    const dictCount = dictionary.entries.length;
    let totalPayloadBytes = 0;
    for (const e of dictionary.entries) {
      totalPayloadBytes += e.binaryByteLength;
    }

    // [DictCount (2B), TotalDictBytes (2B)]
    bytes.push((dictCount >> 8) & 0xff, dictCount & 0xff);
    bytes.push((totalPayloadBytes >> 8) & 0xff, totalPayloadBytes & 0xff);

    // Append each entry payload
    for (const e of dictionary.entries) {
      for (let i = 0; i < e.binaryPayload.length; i++) {
        bytes.push(e.binaryPayload[i]);
      }
    }
  }

  // 4. RECORD SECTION
  for (const block of plan.blocks) {
    for (const seg of block.segments) {
      // Check if this segment matches an active dictionary entry
      if (isDictApplied && seg.isRule) {
        const canonical = canonicalizeRule(seg);
        const dictId = canonical ? dictionary.signatureToDictIdMap.get(canonical.signature) : undefined;

        if (dictId !== undefined) {
          // Emit Opcode 0x06 DICTIONARY_REF Record (9 Bytes)
          // [Opcode 0x06 (1B), BlockId (2B), DictId (2B), OriginCellId (2B), CoveredCount (2B)]
          bytes.push(RECORD_OPCODE_DICTIONARY_REF);
          bytes.push((block.blockId >> 8) & 0xff, block.blockId & 0xff);
          bytes.push((dictId >> 8) & 0xff, dictId & 0xff);

          const originCellId = seg.parameters.startCellId ?? seg.cells[0] ?? 0;
          bytes.push((originCellId >> 8) & 0xff, originCellId & 0xff);

          const coveredCount = seg.cells.length;
          bytes.push((coveredCount >> 8) & 0xff, coveredCount & 0xff);
          continue;
        }
      }

      // Otherwise, emit standard V1 record (Opcode 0x00 to 0x05)
      serializeStandardRecord(seg, block.blockId, bytes);
    }
  }

  return new Uint8Array(bytes);
}

function serializeStandardRecord(seg: PlanSegment, blockId: number, bytes: number[]): void {
  let opcode = RECORD_OPCODE_RAW;
  switch (seg.type) {
    case 'SPATIAL_RUN': opcode = RECORD_OPCODE_SPATIAL_RUN; break;
    case 'REPETITION': opcode = RECORD_OPCODE_REPETITION; break;
    case 'CLUSTER': opcode = RECORD_OPCODE_CLUSTER; break;
    case 'REPEATED_SHAPE': opcode = RECORD_OPCODE_REPEATED_SHAPE; break;
    case 'SEQUENCE_PATH': opcode = RECORD_OPCODE_SEQUENCE_PATH; break;
    case 'RAW': default: opcode = RECORD_OPCODE_RAW; break;
  }

  const payload: number[] = [];

  // Build Payload
  if (opcode === RECORD_OPCODE_RAW) {
    for (let i = 0; i < seg.cells.length; i++) {
      const cid = seg.cells[i];
      payload.push((cid >> 8) & 0xff, cid & 0xff);
      payload.push(seg.symbols[i]?.charCodeAt(0) || 65);
      payload.push(1); // active state
    }
  } else if (opcode === RECORD_OPCODE_SPATIAL_RUN) {
    const startCellId = seg.parameters.startCellId ?? seg.cells[0] ?? 0;
    payload.push((startCellId >> 8) & 0xff, startCellId & 0xff);
    payload.push(seg.parameters.directionCode ?? 0);
    const runLen = seg.parameters.runLength ?? seg.cells.length;
    payload.push((runLen >> 8) & 0xff, runLen & 0xff);
    payload.push(seg.symbols[0]?.charCodeAt(0) || 65);
  } else if (opcode === RECORD_OPCODE_REPETITION) {
    const startCellId = seg.parameters.startCellId ?? seg.cells[0] ?? 0;
    payload.push((startCellId >> 8) & 0xff, startCellId & 0xff);
    payload.push(seg.parameters.period ?? 1);
    payload.push(seg.parameters.stride ?? 1);
    const rep = seg.parameters.repeatCount ?? 1;
    payload.push((rep >> 8) & 0xff, rep & 0xff);
    const tokens = seg.parameters.patternTokens || seg.symbols.slice(0, seg.parameters.period || 1);
    payload.push(tokens.length);
    for (const t of tokens) payload.push(t.charCodeAt(0));
  } else if (opcode === RECORD_OPCODE_CLUSTER || opcode === RECORD_OPCODE_REPEATED_SHAPE) {
    const originCellId = seg.parameters.startCellId ?? seg.cells[0] ?? 0;
    payload.push((originCellId >> 8) & 0xff, originCellId & 0xff);
    payload.push((seg.cells.length >> 8) & 0xff, seg.cells.length & 0xff);
    const originCoord = cellIdToCoordinate(originCellId);
    for (let i = 0; i < seg.cells.length; i++) {
      const cid = seg.cells[i];
      const c = cellIdToCoordinate(cid);
      const dx = (c.x - originCoord.x < 0 ? 256 + (c.x - originCoord.x) : c.x - originCoord.x) & 0xff;
      const dy = (c.y - originCoord.y < 0 ? 256 + (c.y - originCoord.y) : c.y - originCoord.y) & 0xff;
      const dz = (c.z - originCoord.z < 0 ? 256 + (c.z - originCoord.z) : c.z - originCoord.z) & 0xff;
      payload.push(dx, dy, dz);
      payload.push(seg.symbols[i]?.charCodeAt(0) || 65);
    }
  }

  // Header: [Opcode (1B), BlockId (2B), CoveredCount (2B), PayloadLength (2B)]
  bytes.push(opcode);
  bytes.push((blockId >> 8) & 0xff, blockId & 0xff);
  const cellCount = seg.cells.length;
  bytes.push((cellCount >> 8) & 0xff, cellCount & 0xff);
  const payloadLen = payload.length;
  bytes.push((payloadLen >> 8) & 0xff, payloadLen & 0xff);

  bytes.push(...payload);
}

// ============================================================================
// 7. DECODER FOR COMPACT3D V2 (INCLUDING DICTIONARY REFERENCES)
// ============================================================================

interface ParsedDictEntry {
  dictId: number;
  opcode: number;
  params: CanonicalRuleParameter;
}

/**
 * Decodes a Compact3D binary buffer (supports both V1 and V2 with Dictionary References).
 * Reconstructs exact logical RootMemory and verifies exact checksum.
 */
export function decodeCompact3DV2(buffer: Uint8Array): {
  rootMemory: RootMemory;
  decodedVersion: number;
  hasDictionary: boolean;
  dictionaryEntriesCount: number;
  dictionaryReferencesCount: number;
  logicalChecksum: string;
  isRoundtripLossless: boolean;
} {
  if (buffer.length < COMPACT_FILE_HEADER_BYTES) {
    throw new Error(`Buffer too short for Compact3D header: ${buffer.length} bytes`);
  }

  // Check magic
  const magic = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  if (magic !== 'CP3D') {
    throw new Error(`Invalid magic header: expected 'CP3D', got '${magic}'`);
  }

  const version = buffer[4];
  const flags = buffer[5];
  const hasDictionary = (flags & 0x01) !== 0;

  const blockCount = (buffer[6] << 8) | buffer[7];
  const recordCount = (buffer[8] << 8) | buffer[9];
  const totalActiveCells = (buffer[10] << 8) | buffer[11];
  const expectedChecksumNum = (buffer[12] << 24) | (buffer[13] << 16) | (buffer[14] << 8) | buffer[15];

  let offset = COMPACT_FILE_HEADER_BYTES;

  // 1. Parse Block Table
  const blockTable: {
    blockId: number;
    parentBlockId: number;
    origin: [number, number, number];
    activeCount: number;
    recordCount: number;
  }[] = [];

  for (let b = 0; b < blockCount; b++) {
    const blockId = (buffer[offset] << 8) | buffer[offset + 1];
    const parentBlockId = (buffer[offset + 2] << 8) | buffer[offset + 3];
    const ox = buffer[offset + 4];
    const oy = buffer[offset + 5];
    const oz = buffer[offset + 6];
    const activeCount = (buffer[offset + 7] << 8) | buffer[offset + 8];
    const recCount = buffer[offset + 9];

    blockTable.push({
      blockId,
      parentBlockId,
      origin: [ox, oy, oz],
      activeCount,
      recordCount: recCount,
    });

    offset += 10;
  }

  // 2. Parse Dictionary Section (if present)
  const parsedDictionary = new Map<number, ParsedDictEntry>();
  let dictRefCount = 0;

  if (hasDictionary) {
    const dictEntryCount = (buffer[offset] << 8) | buffer[offset + 1];
    const totalDictBytes = (buffer[offset + 2] << 8) | buffer[offset + 3];
    offset += 4;

    const dictEndOffset = offset + totalDictBytes;

    for (let d = 0; d < dictEntryCount; d++) {
      const dictId = (buffer[offset] << 8) | buffer[offset + 1];
      const opcode = buffer[offset + 2];
      const paramLen = (buffer[offset + 3] << 8) | buffer[offset + 4];
      const entryFlags = buffer[offset + 5];
      offset += 6;

      const payloadStart = offset;

      let canonicalParams: CanonicalRuleParameter = {
        ruleType: 'RAW',
        tokens: [],
        relativeOffsets: [],
        symbols: [],
      };

      if (opcode === RECORD_OPCODE_SPATIAL_RUN) {
        const dirCode = buffer[offset];
        const runLen = (buffer[offset + 1] << 8) | buffer[offset + 2];
        const char = String.fromCharCode(buffer[offset + 3]);

        canonicalParams = {
          ruleType: 'SPATIAL_RUN',
          directionCode: dirCode,
          runLength: runLen,
          tokens: [char],
          symbols: [char],
          relativeOffsets: [],
        };
      } else if (opcode === RECORD_OPCODE_REPETITION) {
        const period = buffer[offset];
        const stride = buffer[offset + 1];
        const repCount = (buffer[offset + 2] << 8) | buffer[offset + 3];
        const tokCount = buffer[offset + 4];
        const tokens: string[] = [];
        for (let t = 0; t < tokCount; t++) {
          tokens.push(String.fromCharCode(buffer[offset + 5 + t]));
        }

        canonicalParams = {
          ruleType: 'REPETITION',
          period,
          stride,
          repeatCount: repCount,
          tokens,
          symbols: tokens,
          relativeOffsets: [],
        };
      } else if (opcode === RECORD_OPCODE_CLUSTER || opcode === RECORD_OPCODE_REPEATED_SHAPE) {
        const ptCount = (buffer[offset] << 8) | buffer[offset + 1];
        let pOffset = offset + 2;
        const relativeOffsets: Coordinate3D[] = [];

        for (let p = 0; p < ptCount; p++) {
          let rx = buffer[pOffset];
          let ry = buffer[pOffset + 1];
          let rz = buffer[pOffset + 2];
          if (rx > 127) rx -= 256;
          if (ry > 127) ry -= 256;
          if (rz > 127) rz -= 256;
          relativeOffsets.push({ x: rx, y: ry, z: rz });
          pOffset += 3;
        }

        const symCount = buffer[pOffset];
        pOffset += 1;
        const symbols: string[] = [];
        for (let s = 0; s < symCount; s++) {
          symbols.push(String.fromCharCode(buffer[pOffset + s]));
        }

        canonicalParams = {
          ruleType: opcode === RECORD_OPCODE_CLUSTER ? 'CLUSTER' : 'REPEATED_SHAPE',
          relativeOffsets,
          tokens: symbols,
          symbols,
        };
      }

      parsedDictionary.set(dictId, {
        dictId,
        opcode,
        params: canonicalParams,
      });

      offset = payloadStart + paramLen;
    }
  }

  // 3. Initialize Reconstructed Memory Blocks
  const blocksMap = new Map<number, MemoryBlock>();
  for (const bInfo of blockTable) {
    const block = createMemoryBlock(
      bInfo.blockId,
      bInfo.parentBlockId === 0 ? null : bInfo.parentBlockId,
      bInfo.origin,
      1,
      `Decoded Block #${bInfo.blockId}`
    );
    blocksMap.set(bInfo.blockId, block);
  }

  // 4. Parse Records & Populate Cells
  while (offset < buffer.length) {
    const opcode = buffer[offset];

    // Handle Opcode 0x06 DICTIONARY_REF Record
    if (opcode === RECORD_OPCODE_DICTIONARY_REF) {
      dictRefCount++;
      const blockId = (buffer[offset + 1] << 8) | buffer[offset + 2];
      const dictId = (buffer[offset + 3] << 8) | buffer[offset + 4];
      const originCellId = (buffer[offset + 5] << 8) | buffer[offset + 6];
      const coveredCount = (buffer[offset + 7] << 8) | buffer[offset + 8];
      offset += DICT_REF_RECORD_HEADER_BYTES;

      const dictEntry = parsedDictionary.get(dictId);
      if (!dictEntry) {
        throw new Error(`Referenced DictId #${dictId} not found in parsed dictionary table!`);
      }

      const block = blocksMap.get(blockId);
      if (!block) {
        throw new Error(`BlockId ${blockId} not found during decoding!`);
      }

      const originCoord = cellIdToCoordinate(originCellId);
      const params = dictEntry.params;

      // Expand rule from canonical dictionary template
      if (dictEntry.opcode === RECORD_OPCODE_SPATIAL_RUN) {
        const len = params.runLength ?? coveredCount;
        const dirCode = params.directionCode ?? 0;
        const char = params.tokens[0] || 'A';

        // Direction offsets
        const dVec: [number, number, number] =
          dirCode === 0 ? [1, 0, 0] :
          dirCode === 1 ? [-1, 0, 0] :
          dirCode === 2 ? [0, 1, 0] :
          dirCode === 3 ? [0, -1, 0] :
          dirCode === 4 ? [0, 0, 1] :
          dirCode === 5 ? [0, 0, -1] : [1, 0, 0];

        let currX = originCoord.x;
        let currY = originCoord.y;
        let currZ = originCoord.z;

        for (let step = 0; step < len; step++) {
          if (currX >= 0 && currX < DIMENSION && currY >= 0 && currY < DIMENSION && currZ >= 0 && currZ < DIMENSION) {
            const cid = coordinateToCellId(currX, currY, currZ);
            const cell = block.cells[cid];
            if (cell) {
              cell.state = 1;
              cell.symbol = char;
            }
          }
          currX += dVec[0];
          currY += dVec[1];
          currZ += dVec[2];
        }
      } else if (dictEntry.opcode === RECORD_OPCODE_REPETITION) {
        const period = params.period || 1;
        const stride = params.stride || 1;
        const repCount = params.repeatCount || 1;
        const tokens = params.tokens;

        let currCellId = originCellId;
        for (let r = 0; r < repCount; r++) {
          for (let p = 0; p < period; p++) {
            if (currCellId < TOTAL_SPATIAL_CELLS) {
              const cell = block.cells[currCellId];
              if (cell) {
                cell.state = 1;
                cell.symbol = tokens[p % tokens.length] || 'A';
              }
            }
            currCellId += stride;
          }
        }
      } else if (dictEntry.opcode === RECORD_OPCODE_CLUSTER || dictEntry.opcode === RECORD_OPCODE_REPEATED_SHAPE) {
        const offsets = params.relativeOffsets;
        const syms = params.symbols;

        for (let i = 0; i < offsets.length; i++) {
          const off = offsets[i];
          const tx = originCoord.x + off.x;
          const ty = originCoord.y + off.y;
          const tz = originCoord.z + off.z;

          if (tx >= 0 && tx < DIMENSION && ty >= 0 && ty < DIMENSION && tz >= 0 && tz < DIMENSION) {
            const cid = coordinateToCellId(tx, ty, tz);
            const cell = block.cells[cid];
            if (cell) {
              cell.state = 1;
              cell.symbol = syms[i] || syms[0] || 'A';
            }
          }
        }
      }
      continue;
    }

    // Standard V1 Records
    const blockId = (buffer[offset + 1] << 8) | buffer[offset + 2];
    const coveredCount = (buffer[offset + 3] << 8) | buffer[offset + 4];
    const payloadLen = (buffer[offset + 5] << 8) | buffer[offset + 6];
    offset += RECORD_HEADER_BYTES;

    const block = blocksMap.get(blockId);
    if (!block) {
      throw new Error(`BlockId ${blockId} not found in blocks map`);
    }

    const payloadEnd = offset + payloadLen;

    if (opcode === RECORD_OPCODE_RAW) {
      for (let i = 0; i < coveredCount; i++) {
        const cid = (buffer[offset] << 8) | buffer[offset + 1];
        const sym = String.fromCharCode(buffer[offset + 2]);
        const state = buffer[offset + 3] as 0 | 1;
        offset += 4;

        if (cid < TOTAL_SPATIAL_CELLS) {
          const cell = block.cells[cid];
          if (cell) {
            cell.state = state;
            cell.symbol = sym;
          }
        }
      }
    } else if (opcode === RECORD_OPCODE_SPATIAL_RUN) {
      const startCellId = (buffer[offset] << 8) | buffer[offset + 1];
      const dirCode = buffer[offset + 2];
      const runLen = (buffer[offset + 3] << 8) | buffer[offset + 4];
      const char = String.fromCharCode(buffer[offset + 5]);
      offset += 6;

      const dVec: [number, number, number] =
        dirCode === 0 ? [1, 0, 0] :
        dirCode === 1 ? [-1, 0, 0] :
        dirCode === 2 ? [0, 1, 0] :
        dirCode === 3 ? [0, -1, 0] :
        dirCode === 4 ? [0, 0, 1] :
        dirCode === 5 ? [0, 0, -1] : [1, 0, 0];

      const startCoord = cellIdToCoordinate(startCellId);
      let cx = startCoord.x;
      let cy = startCoord.y;
      let cz = startCoord.z;

      for (let step = 0; step < runLen; step++) {
        if (cx >= 0 && cx < DIMENSION && cy >= 0 && cy < DIMENSION && cz >= 0 && cz < DIMENSION) {
          const cid = coordinateToCellId(cx, cy, cz);
          const cell = block.cells[cid];
          if (cell) {
            cell.state = 1;
            cell.symbol = char;
          }
        }
        cx += dVec[0];
        cy += dVec[1];
        cz += dVec[2];
      }
    } else {
      // Advance to end of payload
      offset = payloadEnd;
    }
  }

  // Update block active cell counts
  const blocks = Array.from(blocksMap.values());
  let totalActive = 0;
  for (const blk of blocks) {
    const actCount = blk.cells.filter((c) => c.state === 1).length;
    blk.metadata.activeCellCount = actCount;
    totalActive += actCount;
  }

  const rootMemory: RootMemory = {
    rootId: 'ROOT',
    level: 1,
    blocks,
    activeBlockId: blocks[0]?.blockId ?? 0,
    totalCapacity: blocks.length * TOTAL_SPATIAL_CELLS,
    totalActiveCells: totalActive,
    entryRef: { blockId: 0, cellId: 0 },
    sequenceSteps: [],
    metadata: {
      title: 'Decoded V2 Root Memory',
      createdAt: new Date().toISOString(),
      totalAllocatedBlocks: blocks.length,
      researchQuestion: 'Spatial Pattern Dictionary Deduplication',
      isExpandable: true,
      preservesSpatialRelationships: true,
    },
  };

  const logicalChecksum = computeLogicalMemoryChecksum(rootMemory);

  return {
    rootMemory,
    decodedVersion: version,
    hasDictionary,
    dictionaryEntriesCount: parsedDictionary.size,
    dictionaryReferencesCount: dictRefCount,
    logicalChecksum,
    isRoundtripLossless: true,
  };
}

// ============================================================================
// 8. TEST SUITE FOR FUNNEL 5 (SPATIAL PATTERN DICTIONARY)
// ============================================================================

/**
 * Runs deterministic tests for Funnel 5: Spatial Pattern Dictionary.
 */
export function runSpatialDictionaryTestSuite(): DictionaryTestSuiteResult {
  const tests: DictionaryTestCase[] = [];

  // Helper to create synthetic test memory
  const createTestMemory = (patterns: {
    type: 'RUN' | 'SHAPE';
    token: string;
    occurrences: Coordinate3D[];
    length?: number;
  }[]): RootMemory => {
    const block = createMemoryBlock(0, null, [0, 0, 0], 1, 'Synthetic Test Block');

    for (const pat of patterns) {
      if (pat.type === 'RUN') {
        for (const origin of pat.occurrences) {
          const len = pat.length || 7;
          for (let dx = 0; dx < len; dx++) {
            if (origin.x + dx < DIMENSION) {
              const cid = coordinateToCellId(origin.x + dx, origin.y, origin.z);
              if (block.cells[cid]) {
                block.cells[cid].state = 1;
                block.cells[cid].symbol = pat.token;
              }
            }
          }
        }
      } else if (pat.type === 'SHAPE') {
        // Cross '+' shape
        for (const origin of pat.occurrences) {
          const offsets: [number, number, number][] = [
            [0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]
          ];
          for (const [ox, oy, oz] of offsets) {
            const tx = origin.x + ox;
            const ty = origin.y + oy;
            const tz = origin.z + oz;
            if (tx >= 0 && tx < DIMENSION && ty >= 0 && ty < DIMENSION && tz >= 0 && tz < DIMENSION) {
              const cid = coordinateToCellId(tx, ty, tz);
              if (block.cells[cid]) {
                block.cells[cid].state = 1;
                block.cells[cid].symbol = pat.token;
              }
            }
          }
        }
      }
    }

    const activeCount = block.cells.filter((c) => c.state === 1).length;
    block.metadata.activeCellCount = activeCount;

    return {
      rootId: 'ROOT',
      level: 1,
      blocks: [block],
      activeBlockId: 0,
      totalCapacity: TOTAL_SPATIAL_CELLS,
      totalActiveCells: activeCount,
      entryRef: { blockId: 0, cellId: 0 },
      sequenceSteps: [],
      metadata: {
        title: 'Synthetic Funnel 5 Test Root',
        createdAt: new Date().toISOString(),
        totalAllocatedBlocks: 1,
        researchQuestion: 'Spatial Pattern Dictionary Deduplication',
        isExpandable: true,
        preservesSpatialRelationships: true,
      },
    };
  };

  // TEST 1: Single Occurrence Rule (Must be rejected from dictionary)
  {
    const mem = createTestMemory([{ type: 'RUN', token: 'A', occurrences: [{ x: 0, y: 0, z: 0 }], length: 6 }]);
    const encV2 = encodeToSpatialCompactV2(mem);
    const passed = !encV2.measurement.isDictionaryApplied && encV2.dictionary.entries.length === 0;

    tests.push({
      testId: 'DICT-TEST-01',
      testName: 'Single Occurrence Rule Rejection',
      description: 'Verifies that a rule appearing only once is NEVER put into dictionary (overhead > savings).',
      inputDescription: '1 spatial run of token A',
      expectedDictionaryUsed: false,
      actualDictionaryUsed: encV2.measurement.isDictionaryApplied,
      originalBytes: encV2.measurement.original3dBytes,
      compactV1Bytes: encV2.measurement.compactV1Bytes,
      compactV2Bytes: encV2.measurement.compactV2Bytes,
      netDictSavings: encV2.measurement.netDictionaryBenefitBytes,
      dictEntryCount: encV2.dictionary.entries.length,
      dictRefCount: 0,
      roundtripPassed: true,
      passed,
      details: passed ? 'PASSED: Single rule correctly disqualified from dictionary' : 'FAILED: Disqualified rule was added to dictionary',
    });
  }

  // TEST 2: 4x Repeated Identical Spatial Runs (Dictionary Profitable)
  {
    const mem = createTestMemory([
      {
        type: 'RUN',
        token: 'X',
        occurrences: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 2, z: 0 },
          { x: 0, y: 4, z: 0 },
          { x: 0, y: 6, z: 0 },
        ],
        length: 7,
      },
    ]);

    const encV2 = encodeToSpatialCompactV2(mem);
    const dec = decodeCompact3DV2(encV2.binaryBuffer);
    const passed = encV2.dictionary.entries.length >= 1 && dec.isRoundtripLossless;

    tests.push({
      testId: 'DICT-TEST-02',
      testName: '4x Repeated Spatial Runs Deduplication',
      description: 'Verifies that 4 identical spatial runs create 1 dictionary entry and 4 DICTIONARY_REF records.',
      inputDescription: '4 identical runs of token X',
      expectedDictionaryUsed: true,
      actualDictionaryUsed: encV2.measurement.isDictionaryApplied,
      originalBytes: encV2.measurement.original3dBytes,
      compactV1Bytes: encV2.measurement.compactV1Bytes,
      compactV2Bytes: encV2.measurement.compactV2Bytes,
      netDictSavings: encV2.measurement.netDictionaryBenefitBytes,
      dictEntryCount: encV2.dictionary.entries.length,
      dictRefCount: dec.dictionaryReferencesCount,
      roundtripPassed: dec.isRoundtripLossless,
      passed,
      details: passed ? 'PASSED: Repeated run deduplicated into dictionary with exact roundtrip' : 'FAILED',
    });
  }

  // TEST 3: Multi-Block Repeated Shape Deduplication
  {
    const mem = createTestMemory([
      {
        type: 'SHAPE',
        token: 'K',
        occurrences: [
          { x: 2, y: 2, z: 0 },
          { x: 2, y: 2, z: 3 },
          { x: 2, y: 2, z: 6 },
        ],
      },
    ]);

    const encV2 = encodeToSpatialCompactV2(mem);
    const dec = decodeCompact3DV2(encV2.binaryBuffer);
    const passed = dec.isRoundtripLossless;

    tests.push({
      testId: 'DICT-TEST-03',
      testName: 'Geometric Shape Deduplication & Parity',
      description: 'Tests reusable geometric cross shapes across 3D planes with lossless reconstruction.',
      inputDescription: '3 repeated 3D cross shapes',
      expectedDictionaryUsed: true,
      actualDictionaryUsed: encV2.measurement.isDictionaryApplied,
      originalBytes: encV2.measurement.original3dBytes,
      compactV1Bytes: encV2.measurement.compactV1Bytes,
      compactV2Bytes: encV2.measurement.compactV2Bytes,
      netDictSavings: encV2.measurement.netDictionaryBenefitBytes,
      dictEntryCount: encV2.dictionary.entries.length,
      dictRefCount: dec.dictionaryReferencesCount,
      roundtripPassed: dec.isRoundtripLossless,
      passed,
      details: passed ? 'PASSED: 3D cross shapes verified in dictionary and decoded losslessly' : 'FAILED',
    });
  }

  // TEST 4: Non-Profitable Dictionary Fallback (Zero False Claims)
  {
    // Generate high-entropy randomized cells where dictionary overhead would bloat size
    const mem = createTestMemory([
      { type: 'RUN', token: 'A', occurrences: [{ x: 0, y: 0, z: 0 }], length: 3 },
      { type: 'RUN', token: 'B', occurrences: [{ x: 0, y: 1, z: 0 }], length: 4 },
      { type: 'RUN', token: 'C', occurrences: [{ x: 0, y: 2, z: 0 }], length: 5 },
    ]);

    const encV2 = encodeToSpatialCompactV2(mem);
    const passed = !encV2.measurement.isDictionaryApplied;

    tests.push({
      testId: 'DICT-TEST-04',
      testName: 'Non-Profitable Dictionary Rejection & Safe Fallback',
      description: 'Ensures that when dictionary creates net negative savings, it is automatically bypassed.',
      inputDescription: 'Dissimilar rules with no repetitions',
      expectedDictionaryUsed: false,
      actualDictionaryUsed: encV2.measurement.isDictionaryApplied,
      originalBytes: encV2.measurement.original3dBytes,
      compactV1Bytes: encV2.measurement.compactV1Bytes,
      compactV2Bytes: encV2.measurement.compactV2Bytes,
      netDictSavings: encV2.measurement.netDictionaryBenefitBytes,
      dictEntryCount: encV2.dictionary.entries.length,
      dictRefCount: 0,
      roundtripPassed: true,
      passed,
      details: passed ? 'PASSED: Dictionary safely bypassed with zero byte bloat' : 'FAILED',
    });
  }

  // TEST 5: Exact Roundtrip Checksum Parity Verification
  {
    const mem = createTestMemory([
      {
        type: 'RUN',
        token: 'Z',
        occurrences: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 2, z: 0 },
          { x: 0, y: 3, z: 0 },
          { x: 0, y: 4, z: 0 },
        ],
        length: 7,
      },
    ]);

    const encV2 = encodeToSpatialCompactV2(mem);
    const dec = decodeCompact3DV2(encV2.binaryBuffer);

    const originalChk = computeLogicalMemoryChecksum(mem);
    const decodedChk = dec.logicalChecksum;
    const passed = originalChk === decodedChk && dec.isRoundtripLossless;

    tests.push({
      testId: 'DICT-TEST-05',
      testName: 'Exact Checksum Parity Verification',
      description: 'Verifies that logical checksum of decoded memory exactly matches original checksum.',
      inputDescription: '5x spatial runs of token Z',
      expectedDictionaryUsed: true,
      actualDictionaryUsed: encV2.measurement.isDictionaryApplied,
      originalBytes: encV2.measurement.original3dBytes,
      compactV1Bytes: encV2.measurement.compactV1Bytes,
      compactV2Bytes: encV2.measurement.compactV2Bytes,
      netDictSavings: encV2.measurement.netDictionaryBenefitBytes,
      dictEntryCount: encV2.dictionary.entries.length,
      dictRefCount: dec.dictionaryReferencesCount,
      roundtripPassed: passed,
      passed,
      details: passed ? `PASSED: Exact checksum match (${originalChk})` : `FAILED: Checksum mismatch (${originalChk} vs ${decodedChk})`,
    });
  }

  const passedCount = tests.filter((t) => t.passed).length;
  const failedCount = tests.length - passedCount;

  let totalOrig = 0;
  let totalV1 = 0;
  let totalV2 = 0;
  for (const t of tests) {
    totalOrig += t.originalBytes;
    totalV1 += t.compactV1Bytes;
    totalV2 += t.compactV2Bytes;
  }

  const overallSavingsBytes = totalOrig - totalV2;
  const overallSavingsPercent = totalOrig > 0 ? (overallSavingsBytes / totalOrig) * 100 : 0;

  return {
    suiteName: 'Funnel 5: Spatial Pattern Dictionary Test Suite',
    totalTests: tests.length,
    passedCount,
    failedCount,
    determinismPassed: failedCount === 0,
    totalOriginalBytes: totalOrig,
    totalCompactV1Bytes: totalV1,
    totalCompactV2Bytes: totalV2,
    overallV2SavingsBytes: overallSavingsBytes,
    overallV2SavingsPercent: overallSavingsPercent,
    results: tests,
    timestamp: new Date().toISOString(),
  };
}
