/**
 * 3D Memory Studio — Funnel 47
 * Deterministic Data Classifier
 *
 * Classifies raw/captured input records into GREEN or RED categories
 * with strict fallback defaulting to RED / BLOCKED.
 */

import {
  ClassifiedRecord,
  ClassificationRule,
  ClassificationStatus,
  DataClassification,
  RawInputRecord,
  ClassificationDatasetSummary,
} from './types';
import { DEFAULT_CLASSIFICATION_RULES } from './policy';

/**
 * Generates a deterministic hash / id for the classification decision
 */
function deriveDeterministicClassificationId(
  recordId: string,
  ruleId: string,
  classification: DataClassification,
  checksum: string
): string {
  const combined = `${recordId}:${ruleId}:${classification}:${checksum}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `CLASS47:${classification}:${hex}`;
}

/**
 * Classifies a single raw record using deterministic prioritized rules
 */
export function classifyRecord(
  record: RawInputRecord,
  rules: readonly ClassificationRule[] = DEFAULT_CLASSIFICATION_RULES,
  timestamp: number = 0
): ClassifiedRecord {
  // Sort rules descending by priority
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  let matchedRule: ClassificationRule | undefined;
  for (const rule of sortedRules) {
    try {
      if (rule.condition(record)) {
        matchedRule = rule;
        break;
      }
    } catch {
      // Condition error defaults down the priority list
    }
  }

  // If somehow no rule matches, use strict fallback
  const finalRule = matchedRule ?? sortedRules[sortedRules.length - 1];
  const classification = finalRule.classification;
  const isUnknown = finalRule.ruleId.includes('UNKNOWN') || finalRule.ruleId.includes('DEFAULT');
  const status: ClassificationStatus = classification === 'GREEN'
    ? 'CLASSIFIED'
    : isUnknown
    ? 'UNKNOWN'
    : 'RESTRICTED';

  // Hard safety invariant: UNKNOWN must never be processingAllowed
  const processingAllowed = classification === 'GREEN' && status === 'CLASSIFIED';

  const classificationId = deriveDeterministicClassificationId(
    record.recordId,
    finalRule.ruleId,
    classification,
    record.payloadChecksum
  );

  return Object.freeze({
    classificationId,
    recordIdentity: record.recordId,
    sourceIdentity: record.sourceDomain,
    category: record.category,
    classification,
    status,
    classificationReason: finalRule.reason,
    classificationRuleId: finalRule.ruleId,
    classificationTimestamp: timestamp,
    originalChecksum: record.payloadChecksum,
    processingAllowed,
    rawRecord: Object.freeze({ ...record }),
  });
}

/**
 * Classifies an array of raw records deterministically
 */
export function classifyRecordSet(
  records: readonly RawInputRecord[],
  rules: readonly ClassificationRule[] = DEFAULT_CLASSIFICATION_RULES,
  timestamp: number = 0
): readonly ClassifiedRecord[] {
  return Object.freeze(records.map((r) => classifyRecord(r, rules, timestamp)));
}

/**
 * Produces statistical summary of classification results
 */
export function summarizeClassifications(
  records: readonly ClassifiedRecord[]
): ClassificationDatasetSummary {
  let green = 0;
  let red = 0;
  let unknown = 0;

  for (const r of records) {
    if (r.classification === 'GREEN') {
      green++;
    } else {
      red++;
      if (r.status === 'UNKNOWN') {
        unknown++;
      }
    }
  }

  const total = records.length;
  return Object.freeze({
    totalRecords: total,
    greenCount: green,
    redCount: red,
    unknownBlockedCount: unknown,
    greenPercentage: total > 0 ? (green / total) * 100 : 0,
    redPercentage: total > 0 ? (red / total) * 100 : 0,
  });
}

/**
 * Filters classified records by classification type
 */
export function filterByClassification(
  records: readonly ClassifiedRecord[],
  filter: 'ALL' | 'GREEN' | 'RED'
): readonly ClassifiedRecord[] {
  if (filter === 'ALL') return records;
  return Object.freeze(records.filter((r) => r.classification === filter));
}
