/**
 * 3D Memory Studio — Funnel 47
 * Data Classification Model, Fixtures, Serialization & Determinism Suite
 */

import {
  RawInputRecord,
  ClassifiedRecord,
  ProcessingBatch,
  ClassificationDatasetSummary,
} from './types';
import {
  classifyRecord,
  classifyRecordSet,
  summarizeClassifications,
} from './classifier';
import {
  guardDownstreamBatch,
  guard369Encoding,
  guardDimensionalProjection,
} from './guards';

/**
 * Returns a deterministic heterogeneous test dataset fixture containing
 * allowlisted research, restricted security, AI model variations, and unknown records.
 */
export function getHeterogeneousClassificationFixture(): readonly RawInputRecord[] {
  return Object.freeze([
    // 1. Allowlisted W3C Standard -> GREEN
    {
      recordId: 'REC_W3C_LDP_CONTAINER',
      documentId: 'DOC_W3C_01',
      sourceDomain: 'w3.org',
      sourceUrl: 'https://w3.org/ns/ldp#Container',
      category: 'STANDARDS',
      rawValue: { term: 'Container', type: 'Class', status: 'W3C Recommendation' },
      payloadChecksum: 'CHK_W3C_98f12a3b',
    },
    // 2. Allowlisted IETF Protocol -> GREEN
    {
      recordId: 'REC_IETF_HTTP2_FRAMING',
      documentId: 'DOC_IETF_01',
      sourceDomain: 'ietf.org',
      sourceUrl: 'https://ietf.org/rfc/rfc7540.txt',
      category: 'PROTOCOLS',
      rawValue: { protocol: 'HTTP/2', frameType: 'HEADERS', streamId: 1 },
      payloadChecksum: 'CHK_IETF_47a89b1c',
    },
    // 3. Allowlisted Schema.org Ontology -> GREEN
    {
      recordId: 'REC_SCHEMA_ORG_CREATIVE_WORK',
      documentId: 'DOC_SCHEMA_01',
      sourceDomain: 'schema.org',
      sourceUrl: 'https://schema.org/CreativeWork',
      category: 'ONTOLOGY',
      rawValue: { name: 'CreativeWork', author: 'Schema.org Community' },
      payloadChecksum: 'CHK_SCHEMA_22d45e6f',
    },
    // 4. Restricted PII Category -> RED
    {
      recordId: 'REC_RESTRICTED_PII_DATA',
      documentId: 'DOC_RESTRICTED_01',
      sourceDomain: 'w3.org', // Even on safe domain, PII category triggers RED
      sourceUrl: 'https://w3.org/internal/test_pii',
      category: 'PII_RESTRICTED',
      rawValue: { userEmail: 'subject@domain.com', ssn: '000-00-0000' },
      payloadChecksum: 'CHK_PII_11a22b33',
    },
    // 5. Restricted Security Category -> RED
    {
      recordId: 'REC_RESTRICTED_CREDENTIALS',
      documentId: 'DOC_RESTRICTED_02',
      sourceDomain: 'standards.ieee.org',
      sourceUrl: 'https://standards.ieee.org/sec',
      category: 'PROPRIETARY_CREDENTIALS',
      rawValue: { secretKey: 'SUPER_SECRET_TOKEN_DO_NOT_PROCESS' },
      payloadChecksum: 'CHK_CRED_99c88d77',
    },
    // 6. Restricted Darkweb Domain -> RED
    {
      recordId: 'REC_DARKWEB_LEAK_RECORD',
      documentId: 'DOC_DARKWEB_01',
      sourceDomain: 'darkweb.onion',
      sourceUrl: 'http://darkweb.onion/dump',
      category: 'STANDARDS',
      rawValue: { leakId: 'UNAUTHORIZED_EXFILTRATION' },
      payloadChecksum: 'CHK_DARK_66b55a44',
    },
    // 7. AI_MODEL with explicit research authorization -> GREEN
    {
      recordId: 'REC_AI_MODEL_AUTHORIZED_EMBEDDINGS',
      documentId: 'DOC_AI_01',
      sourceDomain: 'wikipedia.org',
      sourceUrl: 'https://wikipedia.org/wiki/Word_embedding',
      category: 'AI_MODEL',
      rawValue: { modelName: 'OpenResearchEmbeddingV1', parameters: '7B', license: 'CC-BY-4.0' },
      payloadChecksum: 'CHK_AI_AUTH_77e66d55',
      metadata: { explicitlyPermitted: true },
    },
    // 8. AI_MODEL without explicit authorization -> RED
    {
      recordId: 'REC_AI_MODEL_UNAUTHORIZED_WEIGHTS',
      documentId: 'DOC_AI_02',
      sourceDomain: 'wikipedia.org',
      sourceUrl: 'https://wikipedia.org/wiki/Proprietary_Weights',
      category: 'AI_MODEL',
      rawValue: { weightsUrl: 'https://proprietary.ai/weights.bin' },
      payloadChecksum: 'CHK_AI_UNAUTH_33c22a11',
      metadata: { explicitlyPermitted: false },
    },
    // 9. Unknown Domain & Unregistered Category -> RED (UNKNOWN Fallback)
    {
      recordId: 'REC_UNKNOWN_ARBITRARY_RAW',
      documentId: 'DOC_UNKNOWN_01',
      sourceDomain: 'random-unverified-blog.io',
      sourceUrl: 'https://random-unverified-blog.io/post/1',
      category: 'MISCELLANEOUS_UNCLASSIFIED',
      rawValue: { text: 'Unknown unstructured content' },
      payloadChecksum: 'CHK_UNK_00f99e88',
    },
  ]);
}

/**
 * Serializes a classification session to JSON
 */
export function serializeClassificationSession(
  records: readonly ClassifiedRecord[],
  batch: ProcessingBatch
): string {
  return JSON.stringify(
    {
      version: 'F47_CLASSIFICATION_V1',
      summary: summarizeClassifications(records),
      batch,
      records,
    },
    null,
    2
  );
}

/**
 * Deserializes and verifies an encoded classification session
 */
export function deserializeClassificationSession(
  json: string
): {
  summary: ClassificationDatasetSummary;
  batch: ProcessingBatch;
  records: readonly ClassifiedRecord[];
} {
  const parsed = JSON.parse(json);
  if (parsed.version !== 'F47_CLASSIFICATION_V1') {
    throw new Error(`Invalid session version: ${parsed.version}`);
  }
  return {
    summary: parsed.summary,
    batch: parsed.batch,
    records: parsed.records,
  };
}

/**
 * Evaluates determinism across 250 cycles and multiple dimensions
 */
export function evaluateClassificationDeterminism(
  trials = 250,
  dimensions = [1, 2, 3, 4, 6, 8, 12, 16]
): {
  trials: number;
  allIdentical: boolean;
  variance: number;
  redBypasses: number;
  unknownGreenTransitions: number;
  redDimensionalStatesGenerated: number;
  red369EncodingsGenerated: number;
} {
  const fixture = getHeterogeneousClassificationFixture();
  let firstBatchChecksum = '';
  let redBypasses = 0;
  let unknownGreenTransitions = 0;
  let redDimensionalStatesGenerated = 0;
  let red369EncodingsGenerated = 0;

  for (let t = 0; t < trials; t++) {
    const classified = classifyRecordSet(fixture, undefined, 0);
    const batch = guardDownstreamBatch(classified, 0);

    if (t === 0) {
      firstBatchChecksum = batch.batchChecksum;
    } else if (batch.batchChecksum !== firstBatchChecksum) {
      // Variance detected
      return {
        trials,
        allIdentical: false,
        variance: 1.0,
        redBypasses: 999,
        unknownGreenTransitions: 999,
        redDimensionalStatesGenerated: 999,
        red369EncodingsGenerated: 999,
      };
    }

    // Audit for RED bypasses
    for (const g of batch.greenRecords) {
      if (g.classification === 'RED' || !g.processingAllowed) {
        redBypasses++;
      }
      if (g.status === 'UNKNOWN') {
        unknownGreenTransitions++;
      }
    }

    // Audit guard behavior for all records
    for (const rec of classified) {
      const enc = guard369Encoding(rec, 0);
      if (rec.classification === 'RED' && enc.success) {
        red369EncodingsGenerated++;
      }

      for (const dim of dimensions) {
        const proj = guardDimensionalProjection(rec, dim, 0);
        if (rec.classification === 'RED' && proj.success) {
          redDimensionalStatesGenerated++;
        }
      }
    }
  }

  return {
    trials,
    allIdentical: true,
    variance: 0.0,
    redBypasses,
    unknownGreenTransitions,
    redDimensionalStatesGenerated,
    red369EncodingsGenerated,
  };
}
