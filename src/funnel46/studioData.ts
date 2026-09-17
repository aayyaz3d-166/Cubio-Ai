/**
 * 3D Memory Studio — Funnel 46
 * Deterministic Studio Data Loader & Fixtures
 *
 * Provides pre-loaded, deterministic research datasets derived directly
 * from the F44 capture closure and F45 adapters.
 */

import { getControlledCaptureDatasetFixture, closeInternetCaptureCycle } from '../funnel44/model';
import { adaptCaptureClosureToStudioDataset, NormalizedStudioDataset, NormalizedStudioRecord } from './adapters';
import { getStandardLLMModelFixture } from '../funnel48/llmModelExplorer';

/**
 * Loads the default research dataset derived from F44 capture closure and F48 LLMs
 */
export function getStandardResearchStudioDataset(dimension = 3, universeId = 'UNIV_RESEARCH_STUDIO_46'): NormalizedStudioDataset {
  const fixture = getControlledCaptureDatasetFixture(dimension, universeId);
  const closure = closeInternetCaptureCycle(dimension, universeId, fixture, 0);
  const baseDataset = adaptCaptureClosureToStudioDataset(closure);
  const llmModels = getStandardLLMModelFixture();

  const extraRecords: NormalizedStudioRecord[] = [];
  for (const llm of llmModels) {
    const isGreen = llm.explicitlyAuthorized && !llm.sourceDomain.includes('darkweb') && llm.modelCategory !== 'MALWARE_PAYLOAD';
    extraRecords.push(Object.freeze({
      stateId: `STATE_${dimension}D_${llm.modelId}`,
      recordId: llm.modelId,
      documentId: `DOC_${llm.modelId}`,
      universeId,
      dimension,
      category: llm.modelCategory,
      sourceDomain: llm.sourceDomain,
      sourceUrl: llm.sourceUrl || `https://${llm.sourceDomain}/models/${llm.modelId}`,
      rawValue: llm.rawValue,
      canonicalJson: JSON.stringify(llm.rawValue),
      payloadChecksum: llm.originalChecksum,
      canonicalChecksum: llm.originalChecksum,
      integrityValid: true,
      sequence369: isGreen ? '369369369369369369' : '369',
      numericStateBigIntString: isGreen ? '123456789' : '0',
      formattedCoordinate: isGreen ? 'X3.Y6.Z9' : 'X0.Y0.Z0',
      coordinateId: `COORD_${llm.modelId}`,
      capturePolicyId: 'POLICY_RESEARCH_LLM',
      provenanceLineage: Object.freeze([
        `PROV_SOURCE:${llm.provider}`,
        `PROV_CAPTURE:${llm.sourceDomain}`,
        `PROV_STATE:${llm.modelId}`,
      ]),
    }));
  }

  const allRecords = Object.freeze([...baseDataset.records, ...extraRecords]);
  const allNodes = allRecords.map((r) => ({
    nodeId: r.recordId,
    label: r.recordId,
    category: r.category,
    sourceDomain: r.sourceDomain,
    stateId: r.stateId,
  }));

  const allDomains = new Set<string>();
  for (const r of allRecords) {
    allDomains.add(r.sourceDomain);
  }

  return Object.freeze({
    ...baseDataset,
    records: allRecords,
    graphNodes: Object.freeze(allNodes),
    sourceDomains: Object.freeze(Array.from(allDomains).sort()),
  });
}

/**
 * Generates an expanded synthetic benchmark dataset for scale testing (e.g. 4,096 states)
 */
export function getScaleBenchmarkStudioDataset(
  dimension = 8,
  stateCount = 4096,
  universeId = 'UNIV_BENCHMARK_4096'
): NormalizedStudioDataset {
  const records: NormalizedStudioRecord[] = [];
  const domainList = ['w3.org', 'ietf.org', 'schema.org', 'wikipedia.org', 'unicode.org', 'iso.org'];
  const categoryList = ['STANDARDS', 'PROTOCOLS', 'ONTOLOGY', 'TAXONOMY', 'ENCODING', 'METRICS'];

  for (let i = 0; i < stateCount; i++) {
    const domain = domainList[i % domainList.length];
    const category = categoryList[i % categoryList.length];
    const rawVal = { id: i, name: `Record_${universeId}_${i}`, active: true, domain, category };
    const json = JSON.stringify(rawVal);
    const seq = i % 2 === 0
      ? `369369${universeId}${i}`.padEnd(24, '3')
      : `963963${universeId}${i}`.padEnd(24, '9');
    const num = `${universeId}${i}555555`;

    records.push(Object.freeze({
      stateId: `STATE_${dimension}D_${universeId}_${i}`,
      recordId: `REC_${universeId}_${i}`,
      documentId: `DOC_${universeId}_${Math.floor(i / 10)}`,
      universeId,
      dimension,
      category,
      sourceDomain: domain,
      sourceUrl: `https://${domain}/resource/${universeId}/${i}`,
      rawValue: rawVal,
      canonicalJson: json,
      payloadChecksum: `CHK_${universeId}_${i}`,
      canonicalChecksum: `CHK_${universeId}_${i}`,
      integrityValid: true,
      sequence369: seq,
      numericStateBigIntString: num,
      formattedCoordinate: `X3.Y6.Z9`,
      coordinateId: `COORD_${universeId}_${i}`,
      capturePolicyId: 'POLICY_BENCHMARK_STRICT',
      provenanceLineage: Object.freeze([
        `PROV_SOURCE:${domain}`,
        `PROV_CAPTURE:${domain}/resource/${universeId}/${i}`,
        `PROV_CANON:CHK_${universeId}_${i}`,
        `PROV_STATE:STATE_${dimension}D_${universeId}_${i}`,
      ]),
    }));
  }

  const nodes = records.slice(0, 30).map((r) => ({
    nodeId: `NODE:${r.recordId}`,
    label: r.recordId,
    category: r.category,
    sourceDomain: r.sourceDomain,
    stateId: r.stateId,
  }));

  const rels = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    rels.push({
      relationshipId: `REL:${nodes[i].nodeId}->${nodes[i + 1].nodeId}`,
      sourceNodeId: nodes[i].nodeId,
      targetNodeId: nodes[i + 1].nodeId,
      relationType: 'DEPENDS_ON',
      confidence: 1.0,
      evidenceType: 'EXPLICIT_REFERENCE',
    });
  }

  return Object.freeze({
    universeId,
    dimension,
    records: Object.freeze(records),
    graphNodes: Object.freeze(nodes),
    graphRelationships: Object.freeze(rels),
    capturedDocumentsCount: Math.max(1, Math.ceil(stateCount / 10)),
    sourceDomains: Object.freeze([...domainList].sort()),
  });
}
