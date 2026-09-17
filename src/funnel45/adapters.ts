/**
 * 3D Memory Studio — Funnel 45
 * Read-Only Adapters for Funnels 40–44
 *
 * Provides strictly read-only, non-mutating adapters that inspect source data structures
 * and project them into normalized, immutable records for studio visualization.
 */

export interface NormalizedStudioRecord<V = any> {
  readonly stateId: string;
  readonly recordId: string;
  readonly documentId: string;
  readonly universeId: string;
  readonly dimension: number;
  readonly category: string;
  readonly sourceDomain: string;
  readonly sourceUrl: string;
  readonly rawValue: V;
  readonly canonicalJson: string;
  readonly payloadChecksum: string;
  readonly canonicalChecksum: string;
  readonly integrityValid: boolean;
  readonly sequence369: string;
  readonly numericStateBigIntString: string;
  readonly formattedCoordinate: string;
  readonly coordinateId: string;
  readonly capturePolicyId: string;
  readonly provenanceLineage: readonly string[];
}

export interface NormalizedStudioGraphNode {
  readonly nodeId: string;
  readonly label: string;
  readonly category: string;
  readonly sourceDomain: string;
  readonly stateId?: string;
}

export interface NormalizedStudioGraphRelationship {
  readonly relationshipId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationType: string;
  readonly confidence: number;
  readonly evidenceType: string;
}

export interface NormalizedStudioDataset {
  readonly universeId: string;
  readonly dimension: number;
  readonly records: readonly NormalizedStudioRecord[];
  readonly graphNodes: readonly NormalizedStudioGraphNode[];
  readonly graphRelationships: readonly NormalizedStudioGraphRelationship[];
  readonly capturedDocumentsCount: number;
  readonly sourceDomains: readonly string[];
}

/**
 * Read-only adapter for F44 Capture Closures
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

  // Read-only synthetic graph projection for F44 records
  const graphNodes: NormalizedStudioGraphNode[] = records.map((r) => ({
    nodeId: `NODE:${r.recordId}`,
    label: r.recordId,
    category: r.category,
    sourceDomain: r.sourceDomain,
    stateId: r.stateId,
  }));

  const graphRelationships: NormalizedStudioGraphRelationship[] = [];
  for (let i = 0; i < records.length - 1; i++) {
    graphRelationships.push({
      relationshipId: `REL:${records[i].recordId}->${records[i + 1].recordId}`,
      sourceNodeId: `NODE:${records[i].recordId}`,
      targetNodeId: `NODE:${records[i + 1].recordId}`,
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
 * Read-only adapter for F43 Reasoning Snapshots
 */
export function adaptReasoningSnapshotToStudioDataset(snapshot: any, universeId = 'UNIV_REASONING_43'): NormalizedStudioDataset {
  const dim = snapshot.dimension;
  const entities = Object.values(snapshot.entities ?? {}) as any[];
  const assertions = Object.values(snapshot.assertions ?? {}) as any[];

  const records: NormalizedStudioRecord[] = entities.map((e, idx) => {
    return Object.freeze({
      stateId: `STATE:${e.entityId}`,
      recordId: e.entityId,
      documentId: e.sourceRecordId ?? 'DOC_REASONING',
      universeId,
      dimension: dim,
      category: e.category ?? 'KNOWLEDGE',
      sourceDomain: e.sourceDomain ?? 'schema.org',
      sourceUrl: `https://${e.sourceDomain ?? 'schema.org'}/`,
      rawValue: e.properties,
      canonicalJson: JSON.stringify(e.properties),
      payloadChecksum: e.payloadChecksum ?? '00000000',
      canonicalChecksum: e.payloadChecksum ?? '00000000',
      integrityValid: true,
      sequence369: e.sequence369 ?? '369',
      numericStateBigIntString: e.numericStateBigIntString ?? '0',
      formattedCoordinate: e.formattedCoordinate ?? 'X3.Y6.Z9',
      coordinateId: `COORD:${e.entityId}`,
      capturePolicyId: 'POLICY_REASONING_V1',
      provenanceLineage: Object.freeze([`ENTITY:${e.entityId}`, `CANON:${e.canonicalName}`]),
    });
  });

  const graphNodes: NormalizedStudioGraphNode[] = entities.map((e) => ({
    nodeId: e.entityId,
    label: e.canonicalName ?? e.rawName,
    category: e.category ?? 'KNOWLEDGE',
    sourceDomain: e.sourceDomain ?? 'schema.org',
    stateId: `STATE:${e.entityId}`,
  }));

  const graphRelationships: NormalizedStudioGraphRelationship[] = assertions.map((a) => ({
    relationshipId: a.assertionId,
    sourceNodeId: a.subjectEntityId,
    targetNodeId: a.objectEntityId,
    relationType: a.predicateRelation,
    confidence: a.confidence ?? 1.0,
    evidenceType: a.evidence?.evidenceType ?? 'EXPLICIT_REFERENCE',
  }));

  const domainSet = new Set<string>();
  for (const r of records) if (r.sourceDomain) domainSet.add(r.sourceDomain);

  return Object.freeze({
    universeId,
    dimension: dim,
    records: Object.freeze(records),
    graphNodes: Object.freeze(graphNodes),
    graphRelationships: Object.freeze(graphRelationships),
    capturedDocumentsCount: Object.keys(snapshot.concepts ?? {}).length,
    sourceDomains: Object.freeze(Array.from(domainSet).sort()),
  });
}
