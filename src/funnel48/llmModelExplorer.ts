/**
 * 3D Memory Studio — Funnel 48
 * LLM Model Explorer Architecture, Fixtures & Determinism Benchmark
 */

import { LLMModelRecord, LLMModelViewModel, LLMExplorerViewModel } from './types';
import { adaptLLMRecordList } from './adapters';
import { createLLMExplorerViewModel } from './viewModels';

/**
 * Returns standard deterministic LLM model fixture dataset
 */
export function getStandardLLMModelFixture(): readonly LLMModelRecord[] {
  return Object.freeze([
    // 1. Authorized Open Research LLM -> GREEN
    {
      modelId: 'LLM_OPEN_EMBEDDING_7B',
      modelName: 'Open Research Embedding 7B',
      provider: 'Wikipedia / Wikimedia Foundation',
      sourceDomain: 'wikipedia.org',
      sourceUrl: 'https://wikipedia.org/wiki/Word_embedding',
      modelCategory: 'AI_MODEL',
      parameterCount: '7B',
      licenseType: 'CC-BY-4.0',
      explicitlyAuthorized: true,
      rawValue: { architecture: 'Transformer', vocabSize: 32000, contextWindow: 8192 },
      originalChecksum: 'CHK_LLM_AUTH_7B_a1b2c3',
    },
    // 2. Authorized W3C Ontology Reasoning LLM -> GREEN
    {
      modelId: 'LLM_W3C_ONTOLOGY_PARSER_8B',
      modelName: 'W3C Ontology LDP Reasoner 8B',
      provider: 'W3C Semantic Web Interest Group',
      sourceDomain: 'w3.org',
      sourceUrl: 'https://w3.org/ns/ldp#models',
      modelCategory: 'AI_MODEL',
      parameterCount: '8B',
      licenseType: 'W3C Software Notice and License',
      explicitlyAuthorized: true,
      rawValue: { rdfCompliant: true, sparqlSupported: true, maxTriples: 50000 },
      originalChecksum: 'CHK_LLM_W3C_8B_d4e5f6',
    },
    // 3. Authorized IETF RFC Protocol Parser LLM -> GREEN
    {
      modelId: 'LLM_IETF_PROTOCOL_CODER_3B',
      modelName: 'IETF RFC Protocol Codec 3B',
      provider: 'IETF Tools Foundation',
      sourceDomain: 'ietf.org',
      sourceUrl: 'https://ietf.org/rfc/ai_models',
      modelCategory: 'AI_MODEL',
      parameterCount: '3B',
      licenseType: 'IETF Trust Legal Provisions',
      explicitlyAuthorized: true,
      rawValue: { protocols: ['HTTP/2', 'HTTP/3', 'QUIC', 'TLS 1.3'] },
      originalChecksum: 'CHK_LLM_IETF_3B_789abc',
    },
    // 4. Unauthorized Proprietary LLM Weights -> RED
    {
      modelId: 'LLM_PROPRIETARY_UNAUTH_70B',
      modelName: 'Proprietary Secret Frontier 70B',
      provider: 'Closed MegaCorp AI',
      sourceDomain: 'wikipedia.org', // Even on safe domain, unauthorized triggers RED
      sourceUrl: 'https://wikipedia.org/wiki/ClosedAI_70B',
      modelCategory: 'AI_MODEL',
      parameterCount: '70B',
      licenseType: 'Commercial Proprietary Confidential',
      explicitlyAuthorized: false, // Unauthorized
      rawValue: { encryptedWeightsUrl: 'https://closedai.com/weights.bin' },
      originalChecksum: 'CHK_LLM_UNAUTH_70B_998877',
    },
    // 5. Darkweb Exfiltrated LLM Checkpoint -> RED
    {
      modelId: 'LLM_DARKWEB_EXFIL_LLM_120B',
      modelName: 'Exfiltrated Darkweb Model 120B',
      provider: 'Darknet Dump Host',
      sourceDomain: 'darkweb.onion',
      sourceUrl: 'http://darkweb.onion/dumps/llm_120b',
      modelCategory: 'AI_MODEL',
      parameterCount: '120B',
      licenseType: 'None / Stolen Asset',
      explicitlyAuthorized: false,
      rawValue: { leakStatus: 'CONFIRMED_DATA_BREACH' },
      originalChecksum: 'CHK_LLM_DARKWEB_120B_001122',
    },
    // 6. Security-Restricted Malware Code-Gen LLM -> RED
    {
      modelId: 'LLM_MALWARE_EXPLOIT_GEN_13B',
      modelName: 'Offensive Exploit Synthesizer 13B',
      provider: 'Threat Group 404',
      sourceDomain: 'standards.ieee.org',
      sourceUrl: 'https://standards.ieee.org/threat_intel',
      modelCategory: 'MALWARE_PAYLOAD', // Security-sensitive category triggers RED
      parameterCount: '13B',
      licenseType: 'Malicious Tooling',
      explicitlyAuthorized: true, // Even if marked permitted, category triggers priority RULE-RED-SECURITY-001
      rawValue: { payload: '0xDEADBEEF_EXPLOIT' },
      originalChecksum: 'CHK_LLM_MALWARE_13B_334455',
    },
  ]);
}

/**
 * Generates synthetic benchmark LLM models for scale testing (e.g. 4,096 models)
 */
export function getScaleBenchmarkLLMFixture(count = 4096): readonly LLMModelRecord[] {
  const models: LLMModelRecord[] = [];
  const providers = ['OpenResearchFoundation', 'StandardOntologyGroup', 'RestrictedCorp', 'DarknetDrop'];
  const domains = ['wikipedia.org', 'w3.org', 'ietf.org', 'darkweb.onion'];

  for (let i = 0; i < count; i++) {
    const isAuth = i % 2 === 0;
    const prov = providers[i % providers.length];
    const dom = domains[i % domains.length];
    const isDark = dom.includes('darkweb');

    models.push(
      Object.freeze({
        modelId: `LLM_BENCHMARK_${i}`,
        modelName: `Benchmark Model ${i}`,
        provider: prov,
        sourceDomain: dom,
        sourceUrl: `https://${dom}/models/${i}`,
        modelCategory: isDark ? 'DARKWEB_LEAK' : 'AI_MODEL',
        parameterCount: `${(i % 70) + 1}B`,
        licenseType: isAuth ? 'Apache-2.0' : 'Proprietary',
        explicitlyAuthorized: isAuth && !isDark,
        rawValue: { id: i, active: true },
        originalChecksum: `CHK_LLM_BENCH_${i.toString(16).padStart(6, '0')}`,
      })
    );
  }

  return Object.freeze(models);
}

/**
 * Serializes an LLM Explorer session to JSON
 */
export function serializeLLMExplorerSession(
  models: readonly LLMModelViewModel[],
  explorerView: LLMExplorerViewModel
): string {
  return JSON.stringify(
    {
      version: 'F48_LLM_EXPLORER_V1',
      summary: explorerView.summary,
      activeFilter: explorerView.activeFilter,
      totalMatching: explorerView.totalMatchingModels,
      visibleCount: explorerView.visibleModels.length,
      models,
    },
    null,
    2
  );
}

/**
 * Deserializes an LLM Explorer session from JSON
 */
export function deserializeLLMExplorerSession(json: string): {
  version: string;
  summary: LLMExplorerViewModel['summary'];
  models: readonly LLMModelViewModel[];
} {
  const parsed = JSON.parse(json);
  if (parsed.version !== 'F48_LLM_EXPLORER_V1') {
    throw new Error(`Invalid session version: ${parsed.version}`);
  }
  return {
    version: parsed.version,
    summary: parsed.summary,
    models: parsed.models,
  };
}

/**
 * Evaluates F48 determinism across 250 cycles
 */
export function evaluateLLMExplorerDeterminism(trials = 250): {
  trials: number;
  allIdentical: boolean;
  variance: number;
  redBypasses: number;
  unexpectedCollisions: number;
} {
  const fixture = getStandardLLMModelFixture();
  let firstChecksum = '';
  let redBypasses = 0;
  let unexpectedCollisions = 0;

  for (let t = 0; t < trials; t++) {
    const viewModels = adaptLLMRecordList(fixture, 3, 0);
    const explorer = createLLMExplorerViewModel(viewModels, 'ALL_LLMS', 0, 20);

    // Compute checksum over view models
    let hash = 0x811c9dc5;
    const modelIds = new Set<string>();

    for (const m of viewModels) {
      if (modelIds.has(m.modelId)) {
        unexpectedCollisions++;
      }
      modelIds.add(m.modelId);

      // Verify RED safety: RED records must NEVER have processingAllowed === true
      if (m.classification === 'RED' && (m.processingAllowed || m.processingAllowed369 || m.dimensionalProcessingAllowed)) {
        redBypasses++;
      }

      const s = `${m.modelId}:${m.classification}:${m.originalChecksum}:${m.isRestricted}`;
      for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
    }

    const currentChecksum = (hash >>> 0).toString(16);

    if (t === 0) {
      firstChecksum = currentChecksum;
    } else if (currentChecksum !== firstChecksum) {
      return {
        trials,
        allIdentical: false,
        variance: 1.0,
        redBypasses: 999,
        unexpectedCollisions: 999,
      };
    }
  }

  return {
    trials,
    allIdentical: true,
    variance: 0.0,
    redBypasses,
    unexpectedCollisions,
  };
}
