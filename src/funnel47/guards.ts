/**
 * 3D Memory Studio — Funnel 47
 * Security & Processing Boundary Guards
 *
 * Enforces computational isolation: strictly prevents RED records
 * from entering 369 encoding, numeric state derivation, dimensional projection,
 * or knowledge graph integration.
 */

import {
  ClassifiedRecord,
  ClassificationAuditEntry,
  ProcessingBatch,
  GuardEvaluationResult,
  Guarded369Encoding,
  GuardedDimensionalProjection,
} from './types';

/**
 * Derives a deterministic audit ID
 */
function deriveAuditId(recordId: string, operation: string, outcome: string): string {
  const raw = `${recordId}:${operation}:${outcome}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `AUDIT47:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Creates a verified GREEN-only processing batch, rejecting all RED records
 */
export function guardDownstreamBatch(
  records: readonly ClassifiedRecord[],
  timestamp: number = 0
): ProcessingBatch {
  const greenRecords: ClassifiedRecord[] = [];
  const rejectedAuditEntries: ClassificationAuditEntry[] = [];

  for (const rec of records) {
    if (rec.classification === 'GREEN' && rec.processingAllowed) {
      greenRecords.push(rec);
    } else {
      rejectedAuditEntries.push(
        Object.freeze({
          auditId: deriveAuditId(rec.recordIdentity, 'DOWNSTREAM_BATCH_INGEST', 'BLOCKED'),
          timestamp,
          recordId: rec.recordIdentity,
          operationAttempted: 'DOWNSTREAM_BATCH_INGEST',
          classification: rec.classification,
          outcome: 'BLOCKED',
          reason: rec.classificationReason || 'RECORD_IS_RED_RESTRICTED',
          checksum: rec.originalChecksum,
        })
      );
    }
  }

  // Calculate batch checksum over green records
  let batchHash = 0x811c9dc5;
  for (const g of greenRecords) {
    const s = `${g.recordIdentity}:${g.originalChecksum}`;
    for (let i = 0; i < s.length; i++) {
      batchHash ^= s.charCodeAt(i);
      batchHash = Math.imul(batchHash, 0x01000193);
    }
  }
  const batchChecksum = `BATCH47_CHK_${(batchHash >>> 0).toString(16).padStart(8, '0')}`;
  const batchId = `BATCH47:${greenRecords.length}G_${rejectedAuditEntries.length}R_${batchChecksum}`;

  return Object.freeze({
    batchId,
    timestamp,
    totalSubmitted: records.length,
    greenCount: greenRecords.length,
    redCount: rejectedAuditEntries.length,
    greenRecords: Object.freeze(greenRecords),
    rejectedAuditEntries: Object.freeze(rejectedAuditEntries),
    batchChecksum,
  });
}

/**
 * Enforces 369 encoding boundary: strictly GREEN-only
 */
export function guard369Encoding(
  record: ClassifiedRecord,
  timestamp: number = 0
): GuardEvaluationResult<Guarded369Encoding> {
  const operation = '369_ENCODING';

  if (record.classification !== 'GREEN' || !record.processingAllowed) {
    const auditEntry: ClassificationAuditEntry = Object.freeze({
      auditId: deriveAuditId(record.recordIdentity, operation, 'BLOCKED'),
      timestamp,
      recordId: record.recordIdentity,
      operationAttempted: operation,
      classification: record.classification,
      outcome: 'BLOCKED',
      reason: `PROCESSING_RESTRICTED: ${record.classification} data cannot undergo 369 encoding (${record.classificationReason})`,
      checksum: record.originalChecksum,
    });

    return Object.freeze({
      success: false,
      classification: record.classification,
      recordId: record.recordIdentity,
      blockedReason: auditEntry.reason,
      auditEntry,
    });
  }

  // GREEN record permitted: compute deterministic 369 sequence
  const json = JSON.stringify(record.rawRecord.rawValue);
  const bytes = new TextEncoder().encode(json);
  const symbols: string[] = [];

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const b0 = (b >> 4) % 3;
    const b1 = (b >> 2) % 3;
    const b2 = b % 3;
    const symMap = ['3', '6', '9'];
    symbols.push(symMap[b0], symMap[b1], symMap[b2]);
  }
  const seq = symbols.join('');

  // Derive BigInt ternary value
  let bigVal = 0n;
  for (let i = 0; i < symbols.length; i++) {
    const digit = symbols[i] === '3' ? 0n : symbols[i] === '6' ? 1n : 2n;
    bigVal = bigVal * 3n + digit;
  }

  const auditEntry: ClassificationAuditEntry = Object.freeze({
    auditId: deriveAuditId(record.recordIdentity, operation, 'PERMITTED'),
    timestamp,
    recordId: record.recordIdentity,
    operationAttempted: operation,
    classification: 'GREEN',
    outcome: 'PERMITTED',
    reason: 'PROCESSING_PERMITTED_GREEN_RECORD',
    checksum: record.originalChecksum,
  });

  return Object.freeze({
    success: true,
    classification: 'GREEN',
    recordId: record.recordIdentity,
    payload: Object.freeze({
      sequence369: seq,
      symbolCount: symbols.length,
      numericStateBigIntString: bigVal.toString(),
    }),
    auditEntry,
  });
}

/**
 * Enforces dimensional projection boundary: strictly GREEN-only
 */
export function guardDimensionalProjection(
  record: ClassifiedRecord,
  dimension: number = 3,
  timestamp: number = 0
): GuardEvaluationResult<GuardedDimensionalProjection> {
  const operation = `DIMENSIONAL_PROJECTION_Z${dimension}`;

  if (record.classification !== 'GREEN' || !record.processingAllowed) {
    const auditEntry: ClassificationAuditEntry = Object.freeze({
      auditId: deriveAuditId(record.recordIdentity, operation, 'BLOCKED'),
      timestamp,
      recordId: record.recordIdentity,
      operationAttempted: operation,
      classification: record.classification,
      outcome: 'BLOCKED',
      reason: `PROCESSING_RESTRICTED: ${record.classification} data cannot generate dimensional states (${record.classificationReason})`,
      checksum: record.originalChecksum,
    });

    return Object.freeze({
      success: false,
      classification: record.classification,
      recordId: record.recordIdentity,
      blockedReason: auditEntry.reason,
      auditEntry,
    });
  }

  // GREEN record permitted: derive deterministic spatial coordinates in Z^d
  const coords: number[] = [];
  const checksum = record.originalChecksum;
  for (let d = 0; d < dimension; d++) {
    const charCode = checksum.charCodeAt(d % checksum.length) || 48;
    const val = (charCode % 7) + 1; // Coordinate in {1..7}
    coords.push(val);
  }

  const formattedCoordinate = coords.map((v, i) => `D${i + 1}:${v}`).join('.');

  const auditEntry: ClassificationAuditEntry = Object.freeze({
    auditId: deriveAuditId(record.recordIdentity, operation, 'PERMITTED'),
    timestamp,
    recordId: record.recordIdentity,
    operationAttempted: operation,
    classification: 'GREEN',
    outcome: 'PERMITTED',
    reason: 'PROCESSING_PERMITTED_GREEN_RECORD',
    checksum: record.originalChecksum,
  });

  return Object.freeze({
    success: true,
    classification: 'GREEN',
    recordId: record.recordIdentity,
    payload: Object.freeze({
      dimension,
      formattedCoordinate,
      coordinateValues: Object.freeze(coords),
      checksumInvariant: record.originalChecksum,
    }),
    auditEntry,
  });
}
