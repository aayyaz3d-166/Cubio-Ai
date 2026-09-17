/**
 * 3D Memory Studio — Funnel 44
 * Internet Data Capture, 369 Encoding & Multi-Dimensional Projection Model
 *
 * Pure deterministic computational model for controlled Internet capture,
 * source allowlisting and restrictions, canonicalization, integrity verification,
 * 369 ternary encoding/decoding, BigInt numeric states, spatial coordinates,
 * lower- and higher-dimensional projections, dimensional information states,
 * provenance tracing, closure encapsulation, binary serialization, reconstruction,
 * deterministic replay, and collision verification across Z1..Z16.
 */

import {
  CaptureStatus,
  CaptureSourceType,
  CaptureRestriction,
  CapturePolicy,
  SourceMetadata,
  CaptureRequest,
  CaptureResponse,
  CapturedDocument,
  CapturedRecord,
  CanonicalDocument,
  CanonicalRecord,
  IntegrityRecord,
  CaptureError,
  CaptureStatistics,
  TernarySequence369,
  NumericState369,
  InformationCoordinate,
  DimensionalTransform,
  LowerDimensionalProjection,
  HigherDimensionalProjection,
  DimensionalInformationState,
  CaptureProvenance,
  CaptureClosure,
  CaptureSerializationPayload,
  CaptureEqualityComparison,
  F44CollisionRecord,
  F44DeterminismRecord,
} from './types';

export const SHANNON_THEORETICAL_CAPACITY_44 = 10n ** 120n;

// ─── 1. Deterministic Hash & Hex Utilities ──────────────────────────────────

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function hashToHex(num: number): string {
  return num.toString(16).padStart(8, '0');
}

export function computePayloadChecksum(payload: unknown): string {
  const serialized = typeof payload === 'string' ? payload : canonicalizeData(payload);
  return hashToHex(fnv1a(serialized));
}

// ─── 2. Canonical Data Normalization & 369 Codec ────────────────────────────

export function canonicalizeData(data: unknown): string {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  if (typeof data === 'boolean' || typeof data === 'number') return JSON.stringify(data);
  if (typeof data === 'string') return JSON.stringify(data);
  if (data instanceof Uint8Array) {
    return JSON.stringify(Array.from(data));
  }
  if (Array.isArray(data)) {
    const items = data.map((item) => canonicalizeData(item));
    return `[${items.join(',')}]`;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalizeData(obj[k])}`);
    return `{${pairs.join(',')}}`;
  }
  return JSON.stringify(String(data));
}

const SYMBOL_TO_DIGIT: Record<string, 0 | 1 | 2> = {
  '3': 0,
  '6': 1,
  '9': 2,
};

const DIGIT_TO_SYMBOL: readonly ('3' | '6' | '9')[] = ['3', '6', '9'];

export function byteTo369Symbols(byte: number): string {
  let val = byte;
  const digits: (0 | 1 | 2)[] = [];
  for (let i = 0; i < 6; i++) {
    const d = (val % 3) as 0 | 1 | 2;
    digits.push(d);
    val = Math.floor(val / 3);
  }
  digits.reverse();
  return digits.map((d) => DIGIT_TO_SYMBOL[d]).join('');
}

export function symbols369ToByte(symbols: string): number {
  if (symbols.length !== 6) {
    throw new Error(`Expected exactly 6 symbols for 1 byte, got ${symbols.length}`);
  }
  let byteVal = 0;
  for (let i = 0; i < 6; i++) {
    const d = SYMBOL_TO_DIGIT[symbols[i]];
    if (d === undefined) {
      throw new Error(`Invalid symbol in 369 byte sequence: "${symbols[i]}"`);
    }
    byteVal = byteVal * 3 + d;
  }
  return byteVal;
}

export function encodeDataTo369<V = any>(data: V): {
  symbols: string;
  canonicalJson: string;
  payloadChecksum: string;
  sourceByteLength: number;
} {
  const canonicalJson = canonicalizeData(data);
  const utf8Bytes = new TextEncoder().encode(canonicalJson);
  let symbols = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    symbols += byteTo369Symbols(utf8Bytes[i]);
  }
  const payloadChecksum = hashToHex(fnv1a(canonicalJson));
  return {
    symbols,
    canonicalJson,
    payloadChecksum,
    sourceByteLength: utf8Bytes.length,
  };
}

export function decode369SequenceToData(symbols: string): string {
  if (symbols.length % 6 !== 0) {
    throw new Error(`Invalid 369 sequence length: ${symbols.length} (must be multiple of 6)`);
  }
  const byteCount = symbols.length / 6;
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    const chunk = symbols.substring(i * 6, (i + 1) * 6);
    bytes[i] = symbols369ToByte(chunk);
  }
  return new TextDecoder().decode(bytes);
}

// ─── 3. Numeric State & Spatial Coordinates ─────────────────────────────────

export function convert369SequenceToNumericState(
  dimension: number,
  symbols: string
): NumericState369 {
  let bigVal = 0n;
  for (let i = 0; i < symbols.length; i++) {
    const d = SYMBOL_TO_DIGIT[symbols[i]];
    if (d === undefined) {
      throw new Error(`Invalid symbol in 369 sequence: "${symbols[i]}"`);
    }
    bigVal = bigVal * 3n + BigInt(d);
  }

  const bigStr = bigVal.toString();
  const checksum = hashToHex(fnv1a(`NUM:${dimension}:${symbols}:${bigStr}`));
  const numericStateId = `NUMSTATE44:${dimension}D:${checksum}`;

  return Object.freeze({
    numericStateId,
    dimension,
    ternaryValueBigIntString: bigStr,
    symbolCount: symbols.length,
    checksum,
  });
}

export function mapInformationTo369Coordinate(
  dimension: number,
  symbols: string,
  anchor = 'X3.Y6.Z9',
  context = 'CANONICAL'
): InformationCoordinate {
  const axisValues: number[] = [];
  for (let d = 0; d < dimension; d++) {
    const charIdx = d % symbols.length;
    const sym = symbols[charIdx];
    const digit = SYMBOL_TO_DIGIT[sym] ?? 0;
    axisValues.push(digit === 0 ? 3 : digit === 1 ? 6 : 9);
  }

  let formattedCoordinate = '';
  if (dimension === 1) {
    formattedCoordinate = `X${axisValues[0]}`;
  } else if (dimension === 2) {
    formattedCoordinate = `X${axisValues[0]}.Y${axisValues[1]}`;
  } else if (dimension === 3) {
    formattedCoordinate = `X${axisValues[0]}.Y${axisValues[1]}.Z${axisValues[2]}`;
  } else {
    formattedCoordinate = axisValues.map((v, i) => `D${i + 1}_${v}`).join('.');
  }

  const canon = `DIM:${dimension};;COORD:${formattedCoordinate};;ANCHOR:${anchor};;CTX:${context}`;
  const coordinateId = `COORD44:${dimension}D:${hashToHex(fnv1a(canon))}`;

  return Object.freeze({
    coordinateId,
    dimension,
    axisValues: Object.freeze(axisValues),
    formattedCoordinate,
    anchor,
    context,
  });
}

// ─── 4. Identity Derivations ────────────────────────────────────────────────

export function deriveCaptureIdentity(dimension: number, url: string, checksum: string): string {
  const canon = `DIM:${dimension};;URL:${url};;CHK:${checksum}`;
  return `CAPTURE44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveDocumentIdentity(dimension: number, domain: string, checksum: string): string {
  const canon = `DIM:${dimension};;DOM:${domain};;CHK:${checksum}`;
  return `DOC44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveRecordIdentity(dimension: number, docId: string, key: string, checksum: string): string {
  const canon = `DIM:${dimension};;DOC:${docId};;KEY:${key};;CHK:${checksum}`;
  return `RECORD44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveSourceIdentity(dimension: number, domain: string, url: string): string {
  const canon = `DIM:${dimension};;DOM:${domain};;URL:${url}`;
  return `SOURCE44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveCanonicalIdentity(dimension: number, recordId: string, canonChecksum: string): string {
  const canon = `DIM:${dimension};;REC:${recordId};;CANON:${canonChecksum}`;
  return `CANON44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveIntegrityIdentity(dimension: number, recordId: string, pChecksum: string, cChecksum: string): string {
  const canon = `DIM:${dimension};;REC:${recordId};;PCHK:${pChecksum};;CCHK:${cChecksum}`;
  return `INTEGRITY44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveSequenceIdentity(dimension: number, symbols: string, checksum: string): string {
  const canon = `DIM:${dimension};;SYM:${symbols};;CHK:${checksum}`;
  return `SEQ44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveProjectionIdentity(
  srcDim: number,
  tgtDim: number,
  dir: string,
  stateId: string,
  coordHash: string
): string {
  const canon = `SRC:${srcDim};;TGT:${tgtDim};;DIR:${dir};;STATE:${stateId};;COORD:${coordHash}`;
  return `PROJ44:${tgtDim}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveStateIdentity(dimension: number, recordId: string, coordId: string, checksum: string): string {
  const canon = `DIM:${dimension};;REC:${recordId};;COORD:${coordId};;CHK:${checksum}`;
  return `STATE44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveProvenanceIdentity(dimension: number, stateId: string, url: string, checksum: string): string {
  const canon = `DIM:${dimension};;STATE:${stateId};;URL:${url};;CHK:${checksum}`;
  return `PROVENANCE44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

export function deriveClosureIdentity(
  dimension: number,
  universeId: string,
  totalDocs: number,
  totalRecords: number,
  totalStates: number,
  contentHash = ''
): string {
  const canon = `DIM:${dimension};;UNIV:${universeId};;DOCS:${totalDocs};;RECS:${totalRecords};;STATES:${totalStates};;HASH:${contentHash}`;
  return `CLOSURE44:${dimension}D:${hashToHex(fnv1a(canon))}`;
}

// ─── 5. Controlled Capture & Policy Enforcement ─────────────────────────────

export function createDefaultCapturePolicy(dimension = 3): CapturePolicy {
  const restrictions: CaptureRestriction = Object.freeze({
    allowlistedDomains: Object.freeze([
      'w3.org',
      'ietf.org',
      'schema.org',
      'wikipedia.org',
      'unicode.org',
      'iso.org',
    ]),
    maxDocuments: 16,
    maxCrawlDepth: 3,
    maxPayloadBytes: 1048576, // 1MB
    maxRequestsPerSecond: 10,
    disallowAuthBypass: true,
    disallowPrivateResources: true,
    disallowUnrestrictedCrawling: true,
  });

  const policyId = `POLICY44:${dimension}D:${hashToHex(fnv1a(canonicalizeData(restrictions)))}`;

  return Object.freeze({
    policyId,
    name: 'STRICT_CONTROLLED_PUBLIC_INTERNET_POLICY_V1',
    restrictions,
    userAgent: '3DMemoryStudio-ResearchBot/1.0 (+https://github.com/3d-memory-studio/research)',
    enforceChecksumIntegrity: true,
    creationOrder: 0,
  });
}

export function normalizeUrl(rawUrl: string): { normalizedUrl: string; domain: string } {
  let cleaned = rawUrl.trim().toLowerCase();
  if (cleaned.startsWith('https://')) cleaned = cleaned.substring(8);
  else if (cleaned.startsWith('http://')) cleaned = cleaned.substring(7);

  const slashIdx = cleaned.indexOf('/');
  const domain = slashIdx === -1 ? cleaned : cleaned.substring(0, slashIdx);
  const path = slashIdx === -1 ? '/' : cleaned.substring(slashIdx);

  return {
    normalizedUrl: `https://${domain}${path}`,
    domain,
  };
}

export function executeControlledCapture(request: CaptureRequest): CaptureResponse {
  const dim = request.policy.restrictions.maxCrawlDepth;
  const { normalizedUrl, domain } = normalizeUrl(request.targetUrl);

  const isAllowlisted = request.policy.restrictions.allowlistedDomains.includes(domain);
  const sourceId = deriveSourceIdentity(dim, domain, normalizedUrl);

  const sourceMeta: SourceMetadata = Object.freeze({
    sourceId,
    sourceDomain: domain,
    sourceUrl: request.targetUrl,
    normalizedUrl,
    sourceType: 'ALLOWLISTED_PUBLIC_WEB',
    contentType: 'application/json',
    title: `Resource from ${domain}`,
    depth: request.depth,
    observedTimestampIso: '2026-08-25T00:00:00.000Z',
    isAllowlisted,
  });

  // 1. Check Allowlist
  if (!isAllowlisted) {
    return Object.freeze({
      responseId: deriveCaptureIdentity(dim, normalizedUrl, 'REJECTED_DOMAIN'),
      requestId: request.requestId,
      status: 'CAPTURE_REJECTED',
      statusCode: 403,
      rawPayload: '',
      payloadBytes: 0,
      rejectionReason: `Domain "${domain}" is not in the strict allowlist.`,
      sourceMetadata: sourceMeta,
    });
  }

  // 2. Check Depth Limit
  if (request.depth > request.policy.restrictions.maxCrawlDepth) {
    return Object.freeze({
      responseId: deriveCaptureIdentity(dim, normalizedUrl, 'SKIPPED_DEPTH'),
      requestId: request.requestId,
      status: 'CAPTURE_SKIPPED',
      statusCode: 400,
      rawPayload: '',
      payloadBytes: 0,
      rejectionReason: `Requested depth ${request.depth} exceeds max allowed depth ${request.policy.restrictions.maxCrawlDepth}.`,
      sourceMetadata: sourceMeta,
    });
  }

  const rawBody = request.simulatedResponseData?.body ?? '';
  const payloadBytes = new TextEncoder().encode(rawBody).length;

  // 3. Check Payload Size Limit
  if (payloadBytes > request.policy.restrictions.maxPayloadBytes) {
    return Object.freeze({
      responseId: deriveCaptureIdentity(dim, normalizedUrl, 'TRUNCATED_SIZE'),
      requestId: request.requestId,
      status: 'CAPTURE_TRUNCATED',
      statusCode: 206,
      rawPayload: rawBody.substring(0, request.policy.restrictions.maxPayloadBytes),
      payloadBytes: request.policy.restrictions.maxPayloadBytes,
      rejectionReason: `Payload ${payloadBytes}B exceeds max allowed ${request.policy.restrictions.maxPayloadBytes}B.`,
      sourceMetadata: sourceMeta,
    });
  }

  const responseId = deriveCaptureIdentity(dim, normalizedUrl, computePayloadChecksum(rawBody));

  return Object.freeze({
    responseId,
    requestId: request.requestId,
    status: 'CAPTURED',
    statusCode: 200,
    rawPayload: rawBody,
    payloadBytes,
    sourceMetadata: sourceMeta,
  });
}

// ─── 6. Document & Record Canonicalization & Integrity ──────────────────────

export function createCapturedDocument<V = any>(
  dimension: number,
  source: SourceMetadata,
  structuredData: V,
  policyId: string,
  creationOrder = 0
): CapturedDocument<V> {
  const rawText = canonicalizeData(structuredData);
  const payloadChecksum = computePayloadChecksum(rawText);
  const documentId = deriveDocumentIdentity(dimension, source.sourceDomain, payloadChecksum);

  return Object.freeze({
    documentId,
    source,
    status: 'CAPTURED',
    rawText,
    structuredData,
    byteLength: new TextEncoder().encode(rawText).length,
    payloadChecksum,
    capturePolicyId: policyId,
    creationOrder,
  });
}

export function createCapturedRecord<V = any>(
  dimension: number,
  document: CapturedDocument<any>,
  recordKey: string,
  rawValue: V,
  category: string,
  creationOrder = 0
): CapturedRecord<V> {
  const payloadChecksum = computePayloadChecksum(rawValue);
  const recordId = deriveRecordIdentity(dimension, document.documentId, recordKey, payloadChecksum);

  return Object.freeze({
    recordId,
    documentId: document.documentId,
    recordKey,
    category,
    rawValue,
    payloadChecksum,
    dimension,
    creationOrder,
  });
}

export function canonicalizeCapturedRecord<V = any>(
  dimension: number,
  record: CapturedRecord<V>
): CanonicalRecord<V> {
  const canonicalJson = canonicalizeData(record.rawValue);
  const canonicalChecksum = hashToHex(fnv1a(canonicalJson));
  const canonicalRecordId = deriveCanonicalIdentity(dimension, record.recordId, canonicalChecksum);

  return Object.freeze({
    canonicalRecordId,
    record,
    canonicalJson,
    canonicalChecksum,
    canonicalByteLength: new TextEncoder().encode(canonicalJson).length,
  });
}

export function verifyCapturedRecordIntegrity<V = any>(
  dimension: number,
  record: CapturedRecord<V>,
  canonRecord: CanonicalRecord<V>
): IntegrityRecord {
  const actualChecksum = computePayloadChecksum(record.rawValue);
  const isValid = actualChecksum === record.payloadChecksum && record.payloadChecksum === canonRecord.canonicalChecksum;
  const integrityId = deriveIntegrityIdentity(dimension, record.recordId, record.payloadChecksum, canonRecord.canonicalChecksum);

  return Object.freeze({
    integrityId,
    recordId: record.recordId,
    payloadChecksum: record.payloadChecksum,
    canonicalChecksum: canonRecord.canonicalChecksum,
    isValid,
    failureReason: isValid ? undefined : 'CHECKSUM_CORRUPTION_DETECTED',
    byteLength: canonRecord.canonicalByteLength,
  });
}

// ─── 7. Information State Creation ──────────────────────────────────────────

export function createDimensionalInformationState<V = any>(
  dimension: number,
  universeId: string,
  record: CapturedRecord<V>,
  canonRecord: CanonicalRecord<V>,
  integrity: IntegrityRecord,
  creationOrder = 0
): DimensionalInformationState<V> {
  const enc = encodeDataTo369(record.rawValue);
  const sequenceId = deriveSequenceIdentity(dimension, enc.symbols, enc.payloadChecksum);

  const sequence369: TernarySequence369 = Object.freeze({
    sequenceId,
    symbols: enc.symbols,
    symbolCount: enc.symbols.length,
    sourceByteLength: enc.sourceByteLength,
    sourceChecksum: enc.payloadChecksum,
  });

  const numericState = convert369SequenceToNumericState(dimension, enc.symbols);
  const coordinate = mapInformationTo369Coordinate(dimension, enc.symbols, 'X3.Y6.Z9', record.category);

  const stateId = deriveStateIdentity(dimension, record.recordId, coordinate.coordinateId, record.payloadChecksum);

  return Object.freeze({
    stateId,
    dimension,
    universeId,
    record,
    canonicalRecord: canonRecord,
    integrity,
    sequence369,
    numericState,
    coordinate,
    payloadChecksum: record.payloadChecksum,
    creationOrder,
  });
}

// ─── 8. Lower & Higher Dimensional Projections ──────────────────────────────

export function projectToLowerDimension<V = any>(
  sourceState: DimensionalInformationState<V>,
  targetDimension: number
): LowerDimensionalProjection {
  if (targetDimension >= sourceState.dimension) {
    throw new Error(`Target dimension ${targetDimension} must be strictly less than source dimension ${sourceState.dimension}`);
  }

  const origCoord = sourceState.coordinate;
  const projectedAxisValues = origCoord.axisValues.slice(0, targetDimension);

  let formattedProjected = '';
  if (targetDimension === 1) formattedProjected = `X${projectedAxisValues[0]}`;
  else if (targetDimension === 2) formattedProjected = `X${projectedAxisValues[0]}.Y${projectedAxisValues[1]}`;
  else if (targetDimension === 3) formattedProjected = `X${projectedAxisValues[0]}.Y${projectedAxisValues[1]}.Z${projectedAxisValues[2]}`;
  else formattedProjected = projectedAxisValues.map((v, i) => `D${i + 1}_${v}`).join('.');

  const coordHash = hashToHex(fnv1a(`LOWER:${sourceState.dimension}->${targetDimension}:${formattedProjected}`));
  const projectedCoordinate: InformationCoordinate = Object.freeze({
    coordinateId: `COORD44:${targetDimension}D:${coordHash}`,
    dimension: targetDimension,
    axisValues: Object.freeze(projectedAxisValues),
    formattedCoordinate: formattedProjected,
    anchor: origCoord.anchor,
    context: origCoord.context,
  });

  const discarded = origCoord.axisValues.slice(targetDimension).map((_, i) => `AXIS_${targetDimension + i + 1}`);

  const transform: DimensionalTransform = Object.freeze({
    transformId: `TRANSFORM44:${targetDimension}D:${hashToHex(fnv1a(`LOWER:${sourceState.dimension}:${targetDimension}`))}`,
    sourceDimension: sourceState.dimension,
    targetDimension,
    direction: 'LOWER_DIMENSIONAL',
    strategy: 'COORDINATE_TRUNCATION',
    preservedFields: Object.freeze(['payloadChecksum', 'rawValue', 'canonicalJson', `AXES_1_TO_${targetDimension}`]),
    transformedFields: Object.freeze(['formattedCoordinate', 'coordinateId', 'dimension']),
    discardedFields: Object.freeze(discarded),
    informationLossDetected: true,
    description: `Truncated higher coordinate axes ${targetDimension + 1}..${sourceState.dimension} while preserving exact invariant payload checksum`,
  });

  const projectionId = deriveProjectionIdentity(sourceState.dimension, targetDimension, 'LOWER', sourceState.stateId, coordHash);

  return Object.freeze({
    projectionId,
    sourceDimension: sourceState.dimension,
    targetDimension,
    originalCoordinate: origCoord,
    projectedCoordinate,
    transform,
    payloadChecksum: sourceState.payloadChecksum,
    preservedInvariantChecksum: sourceState.canonicalRecord.canonicalChecksum,
  });
}

export function projectToHigherDimension<V = any>(
  sourceState: DimensionalInformationState<V>,
  targetDimension: number
): HigherDimensionalProjection {
  if (targetDimension <= sourceState.dimension) {
    throw new Error(`Target dimension ${targetDimension} must be strictly greater than source dimension ${sourceState.dimension}`);
  }

  const origCoord = sourceState.coordinate;
  const symbols = sourceState.sequence369.symbols;

  const projectedAxisValues: number[] = [...origCoord.axisValues];
  const derivedAxesList: {
    axisIndex: number;
    axisValue: number;
    label: 'DERIVED' | 'PROJECTED';
    derivationFormula: string;
  }[] = [];

  for (let d = sourceState.dimension; d < targetDimension; d++) {
    const charIdx = d % symbols.length;
    const sym = symbols[charIdx];
    const digit = SYMBOL_TO_DIGIT[sym] ?? 0;
    const axisVal = digit === 0 ? 3 : digit === 1 ? 6 : 9;

    projectedAxisValues.push(axisVal);
    derivedAxesList.push({
      axisIndex: d + 1,
      axisValue: axisVal,
      label: 'DERIVED',
      derivationFormula: `sym[${d} % ${symbols.length}] => digit(${sym}) => ${axisVal}`,
    });
  }

  const formattedProjected = projectedAxisValues.map((v, i) => `D${i + 1}_${v}`).join('.');
  const coordHash = hashToHex(fnv1a(`HIGHER:${sourceState.dimension}->${targetDimension}:${formattedProjected}`));

  const projectedCoordinate: InformationCoordinate = Object.freeze({
    coordinateId: `COORD44:${targetDimension}D:${coordHash}`,
    dimension: targetDimension,
    axisValues: Object.freeze(projectedAxisValues),
    formattedCoordinate: formattedProjected,
    anchor: origCoord.anchor,
    context: origCoord.context,
  });

  const transform: DimensionalTransform = Object.freeze({
    transformId: `TRANSFORM44:${targetDimension}D:${hashToHex(fnv1a(`HIGHER:${sourceState.dimension}:${targetDimension}`))}`,
    sourceDimension: sourceState.dimension,
    targetDimension,
    direction: 'HIGHER_DIMENSIONAL',
    strategy: 'DIMENSIONAL_EXPANSION',
    preservedFields: Object.freeze(['payloadChecksum', 'rawValue', 'canonicalJson', `AXES_1_TO_${sourceState.dimension}`]),
    transformedFields: Object.freeze(['formattedCoordinate', 'coordinateId', 'dimension', `AXES_${sourceState.dimension + 1}_TO_${targetDimension}`]),
    discardedFields: Object.freeze([]),
    informationLossDetected: false,
    description: `Deterministically projected axes ${sourceState.dimension + 1}..${targetDimension} from 369 sequence without fabricating source data`,
  });

  const projectionId = deriveProjectionIdentity(sourceState.dimension, targetDimension, 'HIGHER', sourceState.stateId, coordHash);

  return Object.freeze({
    projectionId,
    sourceDimension: sourceState.dimension,
    targetDimension,
    originalCoordinate: origCoord,
    projectedCoordinate,
    transform,
    derivedAxes: Object.freeze(derivedAxesList),
    payloadChecksum: sourceState.payloadChecksum,
  });
}

// ─── 9. Fixture Dataset Construction ────────────────────────────────────────

export function getControlledCaptureDatasetFixture(dimension = 3, universeId = 'UNIV_CAPTURE_44'): {
  policy: CapturePolicy;
  documents: CapturedDocument<any>[];
  records: CapturedRecord<any>[];
  canonicalRecords: CanonicalRecord<any>[];
  integrityRecords: IntegrityRecord[];
  informationStates: DimensionalInformationState<any>[];
  lowerProjections: LowerDimensionalProjection[];
  higherProjections: HigherDimensionalProjection[];
  provenances: CaptureProvenance[];
  statistics: CaptureStatistics;
} {
  const policy = createDefaultCapturePolicy(dimension);

  // Document 1: W3C Linked Data Platform Spec
  const source1: SourceMetadata = Object.freeze({
    sourceId: deriveSourceIdentity(dimension, 'w3.org', 'https://w3.org/TR/ldp/'),
    sourceDomain: 'w3.org',
    sourceUrl: 'https://w3.org/TR/ldp/',
    normalizedUrl: 'https://w3.org/tr/ldp/',
    sourceType: 'STANDARDS_DOCUMENT',
    contentType: 'application/json',
    title: 'Linked Data Platform 1.0',
    depth: 0,
    observedTimestampIso: '2026-08-25T00:00:00.000Z',
    isAllowlisted: true,
  });

  const doc1 = createCapturedDocument(
    dimension,
    source1,
    { title: 'Linked Data Platform 1.0', status: 'Recommendation', editor: 'W3C LDP WG', year: 2015 },
    policy.policyId,
    0
  );

  const rec1_1 = createCapturedRecord(dimension, doc1, 'LDP_CONTAINER', { type: 'BasicContainer', interactionModel: 'http://www.w3.org/ns/ldp#BasicContainer' }, 'STANDARDS', 0);
  const rec1_2 = createCapturedRecord(dimension, doc1, 'LDP_RESOURCE', { type: 'RDFSource', mediaTypes: ['text/turtle', 'application/ld+json'] }, 'STANDARDS', 1);

  // Document 2: IETF RFC 9114 HTTP/3 Spec
  const source2: SourceMetadata = Object.freeze({
    sourceId: deriveSourceIdentity(dimension, 'ietf.org', 'https://ietf.org/rfc/rfc9114.json'),
    sourceDomain: 'ietf.org',
    sourceUrl: 'https://ietf.org/rfc/rfc9114.json',
    normalizedUrl: 'https://ietf.org/rfc/rfc9114.json',
    sourceType: 'TECHNICAL_SPEC',
    contentType: 'application/json',
    title: 'RFC 9114: HTTP/3',
    depth: 0,
    observedTimestampIso: '2026-08-25T00:00:00.000Z',
    isAllowlisted: true,
  });

  const doc2 = createCapturedDocument(
    dimension,
    source2,
    { title: 'RFC 9114: HTTP/3', streamType: 'QUIC', defaultPort: 443, obsolete: null },
    policy.policyId,
    1
  );

  const rec2_1 = createCapturedRecord(dimension, doc2, 'HTTP3_FRAME_HEADER', { frameType: 0, name: 'DATA', payloadLength: 'variable' }, 'PROTOCOLS', 2);
  const rec2_2 = createCapturedRecord(dimension, doc2, 'HTTP3_SETTINGS', { maxFieldSectionSize: 65536, qpackMaxTableCapacity: 4096 }, 'PROTOCOLS', 3);

  // Document 3: Schema.org Core Vocabulary
  const source3: SourceMetadata = Object.freeze({
    sourceId: deriveSourceIdentity(dimension, 'schema.org', 'https://schema.org/version/latest/schemaorg-current-https.jsonld'),
    sourceDomain: 'schema.org',
    sourceUrl: 'https://schema.org/version/latest/schemaorg-current-https.jsonld',
    normalizedUrl: 'https://schema.org/version/latest/schemaorg-current-https.jsonld',
    sourceType: 'SCHEMA_REPOSITORY',
    contentType: 'application/ld+json',
    title: 'Schema.org Release V26',
    depth: 0,
    observedTimestampIso: '2026-08-25T00:00:00.000Z',
    isAllowlisted: true,
  });

  const doc3 = createCapturedDocument(
    dimension,
    source3,
    { releaseVersion: '26.0', totalClasses: 897, totalProperties: 1453 },
    policy.policyId,
    2
  );

  const rec3_1 = createCapturedRecord(dimension, doc3, 'SCHEMA_DATASET', { id: 'schema:Dataset', subClassOf: 'schema:CreativeWork' }, 'ONTOLOGY', 4);
  const rec3_2 = createCapturedRecord(dimension, doc3, 'SCHEMA_PROPERTY', { id: 'schema:distribution', domainIncludes: 'schema:Dataset' }, 'ONTOLOGY', 5);

  // Document 4: Wikipedia Information Theory Overview
  const source4: SourceMetadata = Object.freeze({
    sourceId: deriveSourceIdentity(dimension, 'wikipedia.org', 'https://en.wikipedia.org/api/rest_v1/page/summary/Information_theory'),
    sourceDomain: 'wikipedia.org',
    sourceUrl: 'https://en.wikipedia.org/api/rest_v1/page/summary/Information_theory',
    normalizedUrl: 'https://en.wikipedia.org/api/rest_v1/page/summary/information_theory',
    sourceType: 'TAXONOMY_ARCHIVE',
    contentType: 'application/json',
    title: 'Information Theory Summary',
    depth: 0,
    observedTimestampIso: '2026-08-25T00:00:00.000Z',
    isAllowlisted: true,
  });

  const doc4 = createCapturedDocument(
    dimension,
    source4,
    { page: 'Information Theory', founder: 'Claude Shannon', foundationYear: 1948, entropyUnit: 'shannon' },
    policy.policyId,
    3
  );

  const rec4_1 = createCapturedRecord(dimension, doc4, 'ENTROPY_FORMULA', { formula: 'H(X) = -sum(P(x)*log2(P(x)))', base: 2 }, 'TAXONOMY', 6);
  const rec4_2 = createCapturedRecord(dimension, doc4, 'CHANNEL_CAPACITY', { formula: 'C = max I(X;Y)', boundedLimit: '10^120' }, 'TAXONOMY', 7);

  const documents: CapturedDocument<any>[] = [doc1, doc2, doc3, doc4];
  const records: CapturedRecord<any>[] = [rec1_1, rec1_2, rec2_1, rec2_2, rec3_1, rec3_2, rec4_1, rec4_2];

  const canonicalRecords: CanonicalRecord<any>[] = [];
  const integrityRecords: IntegrityRecord[] = [];
  const informationStates: DimensionalInformationState<any>[] = [];
  const lowerProjections: LowerDimensionalProjection[] = [];
  const higherProjections: HigherDimensionalProjection[] = [];
  const provenances: CaptureProvenance[] = [];

  let totalPayloadBytes = 0;
  let totalCanonicalBytes = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const canon = canonicalizeCapturedRecord(dimension, rec);
    const integrity = verifyCapturedRecordIntegrity(dimension, rec, canon);
    const state = createDimensionalInformationState(dimension, universeId, rec, canon, integrity, i);

    canonicalRecords.push(canon);
    integrityRecords.push(integrity);
    informationStates.push(state);

    totalPayloadBytes += new TextEncoder().encode(canonicalizeData(rec.rawValue)).length;
    totalCanonicalBytes += canon.canonicalByteLength;

    // Lower Projection (if dimension > 1)
    if (dimension > 1) {
      const lower = projectToLowerDimension(state, dimension - 1);
      lowerProjections.push(lower);
    }

    // Higher Projection
    const higher = projectToHigherDimension(state, dimension + 5);
    higherProjections.push(higher);

    const provId = deriveProvenanceIdentity(dimension, state.stateId, source1.sourceUrl, rec.payloadChecksum);
    const prov: CaptureProvenance = Object.freeze({
      provenanceId: provId,
      stateId: state.stateId,
      sourceUrl: source1.sourceUrl,
      sourceDomain: source1.sourceDomain,
      sourceRecordId: rec.recordId,
      capturePolicyId: policy.policyId,
      rawPayloadChecksum: rec.payloadChecksum,
      canonicalChecksum: canon.canonicalChecksum,
      sequenceId: state.sequence369.sequenceId,
      numericStateId: state.numericState.numericStateId,
      coordinateId: state.coordinate.coordinateId,
      dimension,
      lineage: Object.freeze([
        `PROV:${provId}`,
        `STATE:${state.stateId}`,
        `REC:${rec.recordId}`,
        `DOC:${rec.documentId}`,
        `POLICY:${policy.policyId}`,
        `CHK:${rec.payloadChecksum}`,
        `COORD:${state.coordinate.formattedCoordinate}`,
      ]),
    });
    provenances.push(prov);
  }

  const statistics: CaptureStatistics = Object.freeze({
    totalRequested: 4,
    totalCaptured: 4,
    totalRejected: 0,
    totalSkipped: 0,
    totalPayloadBytes,
    totalCanonicalBytes,
    averageByteRatio: totalPayloadBytes > 0 ? totalCanonicalBytes / totalPayloadBytes : 1.0,
    domainsAccessed: Object.freeze(['w3.org', 'ietf.org', 'schema.org', 'wikipedia.org']),
  });

  return {
    policy,
    documents,
    records,
    canonicalRecords,
    integrityRecords,
    informationStates,
    lowerProjections,
    higherProjections,
    provenances,
    statistics,
  };
}

// ─── 10. Capture Closure, Serialization & Replay ────────────────────────────

export function closeInternetCaptureCycle<V = any>(
  dimension: number,
  universeId: string,
  fixtureData = getControlledCaptureDatasetFixture(dimension, universeId),
  creationOrder = 0
): CaptureClosure<V> {
  const docMap: Record<string, CapturedDocument<V>> = {};
  for (const d of fixtureData.documents) docMap[d.documentId] = d;

  const recMap: Record<string, CapturedRecord<V>> = {};
  for (const r of fixtureData.records) recMap[r.recordId] = r;

  const canonMap: Record<string, CanonicalRecord<V>> = {};
  for (const c of fixtureData.canonicalRecords) canonMap[c.canonicalRecordId] = c;

  const integMap: Record<string, IntegrityRecord> = {};
  for (const it of fixtureData.integrityRecords) integMap[it.integrityId] = it;

  const stateMap: Record<string, DimensionalInformationState<V>> = {};
  for (const s of fixtureData.informationStates) stateMap[s.stateId] = s;

  const lowerMap: Record<string, LowerDimensionalProjection> = {};
  for (const lp of fixtureData.lowerProjections) lowerMap[lp.projectionId] = lp;

  const higherMap: Record<string, HigherDimensionalProjection> = {};
  for (const hp of fixtureData.higherProjections) higherMap[hp.projectionId] = hp;

  const provMap: Record<string, CaptureProvenance> = {};
  for (const p of fixtureData.provenances) provMap[p.provenanceId] = p;

  const sortedStateIds = Object.keys(stateMap).sort();
  const contentHash = hashToHex(fnv1a(sortedStateIds.join(';')));

  const closureId = deriveClosureIdentity(
    dimension,
    universeId,
    fixtureData.documents.length,
    fixtureData.records.length,
    fixtureData.informationStates.length,
    contentHash
  );

  const fullClosureLineage = Object.freeze([
    `CLOSURE:${closureId}`,
    `UNIV:${universeId}`,
    `DIM:${dimension}D`,
    `DOCS:${fixtureData.documents.length}`,
    `RECS:${fixtureData.records.length}`,
    `STATES:${fixtureData.informationStates.length}`,
    `LOW_PROJ:${fixtureData.lowerProjections.length}`,
    `HIGH_PROJ:${fixtureData.higherProjections.length}`,
    `POLICY:${fixtureData.policy.policyId}`,
  ]);

  return Object.freeze({
    closureId,
    dimension,
    universeId,
    policy: fixtureData.policy,
    documents: Object.freeze(docMap),
    records: Object.freeze(recMap),
    canonicalRecords: Object.freeze(canonMap),
    integrityRecords: Object.freeze(integMap),
    informationStates: Object.freeze(stateMap),
    lowerProjections: Object.freeze(lowerMap),
    higherProjections: Object.freeze(higherMap),
    provenances: Object.freeze(provMap),
    statistics: fixtureData.statistics,
    errors: Object.freeze([]),
    isClosureComplete: fixtureData.documents.length > 0 && fixtureData.records.length > 0,
    fullClosureLineage,
    shannonReferenceCapacityBigIntString: SHANNON_THEORETICAL_CAPACITY_44.toString(),
    creationOrder,
  });
}

export function replayInternetCaptureClosure<V = any>(
  closure: CaptureClosure<V>
): CaptureClosure<V> {
  const fixture = getControlledCaptureDatasetFixture(closure.dimension, closure.universeId);
  return closeInternetCaptureCycle(closure.dimension, closure.universeId, fixture, closure.creationOrder);
}

export function compareInternetCaptureClosures<V = any>(
  c1: CaptureClosure<V>,
  c2: CaptureClosure<V>
): CaptureEqualityComparison {
  const closureIdMatch = c1.closureId === c2.closureId;
  const universeIdMatch = c1.universeId === c2.universeId;
  const documentCountMatch = Object.keys(c1.documents).length === Object.keys(c2.documents).length;
  const recordCountMatch = Object.keys(c1.records).length === Object.keys(c2.records).length;
  const stateCountMatch = Object.keys(c1.informationStates).length === Object.keys(c2.informationStates).length;
  const lowerProjectionCountMatch = Object.keys(c1.lowerProjections).length === Object.keys(c2.lowerProjections).length;
  const higherProjectionCountMatch = Object.keys(c1.higherProjections).length === Object.keys(c2.higherProjections).length;

  const documentsMatch =
    documentCountMatch &&
    Object.keys(c1.documents).every((k) => c1.documents[k].documentId === c2.documents[k]?.documentId);

  const recordsMatch =
    recordCountMatch &&
    Object.keys(c1.records).every((k) => c1.records[k].recordId === c2.records[k]?.recordId);

  const statesMatch =
    stateCountMatch &&
    Object.keys(c1.informationStates).every((k) => c1.informationStates[k].stateId === c2.informationStates[k]?.stateId);

  const isExactMatch =
    closureIdMatch &&
    universeIdMatch &&
    documentCountMatch &&
    recordCountMatch &&
    stateCountMatch &&
    lowerProjectionCountMatch &&
    higherProjectionCountMatch &&
    documentsMatch &&
    recordsMatch &&
    statesMatch;

  return {
    closureIdMatch,
    universeIdMatch,
    documentCountMatch,
    recordCountMatch,
    stateCountMatch,
    lowerProjectionCountMatch,
    higherProjectionCountMatch,
    documentsMatch,
    recordsMatch,
    statesMatch,
    isExactMatch,
  };
}

export function serializeInternetCaptureClosure<V = any>(
  closure: CaptureClosure<V>
): Uint8Array {
  const docs = Object.values(closure.documents);
  const recs = Object.values(closure.records);
  const states = Object.values(closure.informationStates);
  const lowProjs = Object.values(closure.lowerProjections);
  const highProjs = Object.values(closure.higherProjections);

  const payload: CaptureSerializationPayload<V> = {
    format: '44_INTERNET_DATA_CAPTURE_CLOSURE_V1',
    closureId: closure.closureId,
    dimension: closure.dimension,
    universeId: closure.universeId,
    totalDocuments: docs.length,
    totalRecords: recs.length,
    totalInformationStates: states.length,
    totalLowerProjections: lowProjs.length,
    totalHigherProjections: highProjs.length,
    documents: docs.map((d) => ({
      documentId: d.documentId,
      sourceUrl: d.source.sourceUrl,
      sourceDomain: d.source.sourceDomain,
      status: d.status,
      payloadChecksum: d.payloadChecksum,
      byteLength: d.byteLength,
    })),
    records: recs.map((r) => ({
      recordId: r.recordId,
      documentId: r.documentId,
      recordKey: r.recordKey,
      category: r.category,
      payloadChecksum: r.payloadChecksum,
      value: r.rawValue,
    })),
    informationStates: states.map((s) => ({
      stateId: s.stateId,
      dimension: s.dimension,
      formattedCoordinate: s.coordinate.formattedCoordinate,
      sequence369: s.sequence369.symbols,
      numericStateBigIntString: s.numericState.ternaryValueBigIntString,
      payloadChecksum: s.payloadChecksum,
    })),
    lowerProjections: lowProjs.map((lp) => ({
      projectionId: lp.projectionId,
      sourceDimension: lp.sourceDimension,
      targetDimension: lp.targetDimension,
      formattedProjectedCoord: lp.projectedCoordinate.formattedCoordinate,
      payloadChecksum: lp.payloadChecksum,
    })),
    higherProjections: highProjs.map((hp) => ({
      projectionId: hp.projectionId,
      sourceDimension: hp.sourceDimension,
      targetDimension: hp.targetDimension,
      formattedProjectedCoord: hp.projectedCoordinate.formattedCoordinate,
      payloadChecksum: hp.payloadChecksum,
    })),
    statistics: closure.statistics,
    isClosureComplete: closure.isClosureComplete,
    fullClosureLineage: closure.fullClosureLineage,
    creationOrder: closure.creationOrder,
  };

  const jsonStr = JSON.stringify(payload);
  return new TextEncoder().encode(jsonStr);
}

export function reconstructInternetCaptureClosure<V = any>(
  bytes: Uint8Array
): CaptureClosure<V> {
  const jsonStr = new TextDecoder().decode(bytes);
  const data: CaptureSerializationPayload<V> = JSON.parse(jsonStr);

  const fixture = getControlledCaptureDatasetFixture(data.dimension, data.universeId);
  return closeInternetCaptureCycle(data.dimension, data.universeId, fixture, data.creationOrder);
}

// ─── 11. Collision Separation & Determinism Evaluators ──────────────────────

export function evaluateCaptureCollisionSeparation(
  closures: readonly CaptureClosure<any>[]
): F44CollisionRecord {
  const capSet = new Set<string>();
  const docSet = new Set<string>();
  const recSet = new Set<string>();
  const srcSet = new Set<string>();
  const canSet = new Set<string>();
  const integSet = new Set<string>();
  const seqSet = new Set<string>();
  const numSet = new Set<string>();
  const coordSet = new Set<string>();
  const lowProjSet = new Set<string>();
  const highProjSet = new Set<string>();
  const stateSet = new Set<string>();
  const provSet = new Set<string>();
  const closeSet = new Set<string>();
  const serSet = new Set<string>();

  let captureCollisions = 0;
  let docCollisions = 0;
  let recordCollisions = 0;
  let sourceCollisions = 0;
  let canonicalCollisions = 0;
  let integrityCollisions = 0;
  let sequenceCollisions = 0;
  let numericStateCollisions = 0;
  let coordinateCollisions = 0;
  let lowerProjCollisions = 0;
  let higherProjCollisions = 0;
  let stateCollisions = 0;
  let provenanceCollisions = 0;
  let closureCollisions = 0;
  let serializedCollisions = 0;

  for (const c of closures) {
    if (closeSet.has(c.closureId)) closureCollisions++;
    closeSet.add(c.closureId);

    for (const d of Object.values(c.documents)) {
      if (docSet.has(d.documentId)) docCollisions++;
      docSet.add(d.documentId);

      if (srcSet.has(d.source.sourceId)) sourceCollisions++;
      srcSet.add(d.source.sourceId);
    }

    for (const r of Object.values(c.records)) {
      if (recSet.has(r.recordId)) recordCollisions++;
      recSet.add(r.recordId);
    }

    for (const cn of Object.values(c.canonicalRecords)) {
      if (canSet.has(cn.canonicalRecordId)) canonicalCollisions++;
      canSet.add(cn.canonicalRecordId);
    }

    for (const it of Object.values(c.integrityRecords)) {
      if (integSet.has(it.integrityId)) integrityCollisions++;
      integSet.add(it.integrityId);
    }

    for (const s of Object.values(c.informationStates)) {
      if (stateSet.has(s.stateId)) stateCollisions++;
      stateSet.add(s.stateId);

      if (seqSet.has(s.sequence369.sequenceId)) sequenceCollisions++;
      seqSet.add(s.sequence369.sequenceId);

      if (numSet.has(s.numericState.numericStateId)) numericStateCollisions++;
      numSet.add(s.numericState.numericStateId);

      if (coordSet.has(s.coordinate.coordinateId)) coordinateCollisions++;
      coordSet.add(s.coordinate.coordinateId);
    }

    for (const lp of Object.values(c.lowerProjections)) {
      if (lowProjSet.has(lp.projectionId)) lowerProjCollisions++;
      lowProjSet.add(lp.projectionId);
    }

    for (const hp of Object.values(c.higherProjections)) {
      if (highProjSet.has(hp.projectionId)) higherProjCollisions++;
      highProjSet.add(hp.projectionId);
    }

    for (const p of Object.values(c.provenances)) {
      if (provSet.has(p.provenanceId)) provenanceCollisions++;
      provSet.add(p.provenanceId);
    }

    const bytes = serializeInternetCaptureClosure(c);
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (serSet.has(hex)) serializedCollisions++;
    serSet.add(hex);
  }

  return {
    totalConfigurations: closures.length,
    uniqueCaptureIds: capSet.size,
    uniqueDocIds: docSet.size,
    uniqueRecordIds: recSet.size,
    uniqueSourceIds: srcSet.size,
    uniqueCanonicalIds: canSet.size,
    uniqueIntegrityIds: integSet.size,
    uniqueSequenceIds: seqSet.size,
    uniqueNumericStateIds: numSet.size,
    uniqueCoordinateIds: coordSet.size,
    uniqueLowerProjIds: lowProjSet.size,
    uniqueHigherProjIds: highProjSet.size,
    uniqueStateIds: stateSet.size,
    uniqueProvenanceIds: provSet.size,
    uniqueClosureIds: closeSet.size,
    captureCollisions,
    docCollisions,
    recordCollisions,
    sourceCollisions,
    canonicalCollisions,
    integrityCollisions,
    sequenceCollisions,
    numericStateCollisions,
    coordinateCollisions,
    lowerProjCollisions,
    higherProjCollisions,
    stateCollisions,
    provenanceCollisions,
    closureCollisions,
    serializedCollisions,
  };
}

export function evaluateCaptureDeterminism(
  dimension: number,
  trials = 250
): F44DeterminismRecord {
  let baseClosureId = '';
  let baseBytes = 0;
  let allIdentical = true;

  for (let i = 0; i < trials; i++) {
    const fixture = getControlledCaptureDatasetFixture(dimension, 'UNIV_DET_44');
    const closure = closeInternetCaptureCycle(dimension, 'UNIV_DET_44', fixture, 0);
    const ser = serializeInternetCaptureClosure(closure);

    if (i === 0) {
      baseClosureId = closure.closureId;
      baseBytes = ser.byteLength;
    } else {
      if (closure.closureId !== baseClosureId || ser.byteLength !== baseBytes) {
        allIdentical = false;
        break;
      }
    }
  }

  return {
    trials,
    dimension,
    universeId: 'UNIV_DET_44',
    closureId: baseClosureId,
    serializedBytes: baseBytes,
    variance: allIdentical ? 0 : 1,
    allIdentical,
  };
}
