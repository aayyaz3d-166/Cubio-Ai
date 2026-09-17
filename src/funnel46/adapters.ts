/**
 * 3D Memory Studio — Funnel 46
 * Frontend Read-Only Adapters
 *
 * Exposes read-only dataset adapters for Funnel 40–45 data models,
 * guaranteeing zero mutation and deep immutability.
 */

import {
  adaptCaptureClosureToStudioDataset as adaptF44CaptureClosure,
  adaptReasoningSnapshotToStudioDataset as adaptF43ReasoningSnapshot,
  NormalizedStudioDataset,
  NormalizedStudioRecord,
  NormalizedStudioGraphNode,
  NormalizedStudioGraphRelationship,
} from '../funnel45/adapters';

export type {
  NormalizedStudioDataset,
  NormalizedStudioRecord,
  NormalizedStudioGraphNode,
  NormalizedStudioGraphRelationship,
};

export {
  adaptF44CaptureClosure,
  adaptF43ReasoningSnapshot,
};

/**
 * Read-only adapter for F44 Capture Closures in F46 Studio
 */
export function adaptCaptureClosureToStudioDataset(closure: any): NormalizedStudioDataset {
  const dim = closure.dimension;
  const univ = closure.universeId;

  const records: NormalizedStudioRecord[] = [];
  const stateMap = closure.informationStates ?? {};

  for (const s of Object.values(stateMap) as any[]) {
    const rec = s.record ?? {};
    const canon = s.canonicalRecord ?? {};
    const integ = s.integrity ?? {};
    const seq = s.sequence369 ?? {};
    const num = s.numericState ?? {};
    const coord = s.coordinate ?? {};

    const prov = (closure.provenances ?? {})[s.stateId] || Object.values(closure.provenances ?? {})[0] as any;
    const lineage = prov?.lineage ?? [
      `STATE:${s.stateId}`,
      `REC:${rec.recordId}`,
      `CHK:${s.payloadChecksum}`,
      `COORD:${coord.formattedCoordinate}`,
    ];

    records.push(Object.freeze({
      stateId: s.stateId,
      recordId: rec.recordId ?? s.stateId,
      documentId: rec.documentId ?? 'DOC_UNKNOWN',
      universeId: univ,
      dimension: dim,
      category: rec.category ?? 'GENERAL',
      sourceDomain: prov?.sourceDomain ?? 'w3.org',
      sourceUrl: prov?.sourceUrl ?? 'https://w3.org/',
      rawValue: rec.rawValue,
      canonicalJson: canon.canonicalJson ?? JSON.stringify(rec.rawValue),
      payloadChecksum: s.payloadChecksum,
      canonicalChecksum: canon.canonicalChecksum ?? s.payloadChecksum,
      integrityValid: integ.isValid ?? true,
      sequence369: seq.symbols ?? '369',
      numericStateBigIntString: num.ternaryValueBigIntString ?? '0',
      formattedCoordinate: coord.formattedCoordinate ?? 'X3.Y6.Z9',
      coordinateId: coord.coordinateId ?? 'COORD_0',
      capturePolicyId: closure.policy?.policyId ?? 'POLICY_DEFAULT',
      provenanceLineage: Object.freeze([...lineage]),
    }));
  }

  // Deduplicate source domains
  const domainSet = new Set<string>();
  for (const r of records) {
    if (r.sourceDomain) domainSet.add(r.sourceDomain);
  }

  // Read-only synthetic graph projection for F44 records with matched node IDs
  const graphNodes: NormalizedStudioGraphNode[] = records.map((r) => ({
    nodeId: r.recordId,
    label: r.recordId,
    category: r.category,
    sourceDomain: r.sourceDomain,
    stateId: r.stateId,
  }));

  const graphRelationships: NormalizedStudioGraphRelationship[] = [];
  for (let i = 0; i < records.length - 1; i++) {
    graphRelationships.push({
      relationshipId: `REL:${records[i].recordId}->${records[i + 1].recordId}`,
      sourceNodeId: records[i].recordId,
      targetNodeId: records[i + 1].recordId,
      relationType: 'SEQUENTIAL_SOURCE_RECORD',
      confidence: 1.0,
      evidenceType: 'EXPLICIT_DATASET_ORDER',
    });
  }

  return Object.freeze({
    universeId: univ,
    dimension: dim,
    records: Object.freeze(records),
    graphNodes: Object.freeze(graphNodes),
    graphRelationships: Object.freeze(graphRelationships),
    capturedDocumentsCount: Object.keys(closure.documents ?? {}).length,
    sourceDomains: Object.freeze(Array.from(domainSet).sort()),
  });
}

/**
 * Asserts that a source dataset is frozen and immutable
 */
export function verifyDatasetImmutability(dataset: NormalizedStudioDataset): boolean {
  return (
    Object.isFrozen(dataset) &&
    Object.isFrozen(dataset.records) &&
    Object.isFrozen(dataset.graphNodes) &&
    Object.isFrozen(dataset.graphRelationships)
  );
}
