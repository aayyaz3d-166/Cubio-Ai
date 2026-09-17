/**
 * 3D Memory Studio — Funnel 49
 * Unified Dimensional Information Universe Model & Benchmarks
 */

import {
  DimensionalInformationState,
  InformationUniverseIndex,
} from './types';
import {
  normalizeToDimensionalState,
  normalizeLLMToDimensionalState,
} from './adapters';
import { buildInformationUniverseIndex } from './indexer';
import { searchDimensionalUniverse } from './search';
import { getHeterogeneousClassificationFixture } from '../funnel47/model';
import { getStandardLLMModelFixture } from '../funnel48/llmModelExplorer';

/**
 * Generates the standard unified InformationUniverseIndex containing
 * standards, protocols, ontologies, security records, and LLM models.
 */
export function getStandardInformationUniverseFixture(): InformationUniverseIndex {
  const f47Records = getHeterogeneousClassificationFixture();
  const f48LLMs = getStandardLLMModelFixture();

  const states: DimensionalInformationState[] = [];

  // 1. Add standard research & security records
  for (const r of f47Records) {
    states.push(normalizeToDimensionalState(r));
  }

  // 2. Add LLM models as first-class dimensional states
  for (const llm of f48LLMs) {
    states.push(normalizeLLMToDimensionalState(llm));
  }

  return buildInformationUniverseIndex(states, 'UNIVERSE_RESEARCH_STUDIO_49');
}

/**
 * Generates an expanded scale benchmark index with e.g. 4,096 states
 */
export function getScaleBenchmarkUniverseIndex(
  count = 4096,
  universeId = 'UNIV_SCALE_BENCHMARK_4096'
): InformationUniverseIndex {
  const states: DimensionalInformationState[] = [];
  const domains = ['w3.org', 'ietf.org', 'schema.org', 'wikipedia.org', 'darkweb.onion'];
  const categories = ['STANDARDS', 'PROTOCOLS', 'ONTOLOGY', 'AI_MODEL', 'PII_RESTRICTED'];

  for (let i = 0; i < count; i++) {
    const isGreen = i % 2 === 0;
    const dom = domains[i % domains.length];
    const cat = categories[i % categories.length];
    const isDark = dom.includes('darkweb') || cat.includes('RESTRICTED');

    const raw = {
      recordId: `REC_BENCH_${i}`,
      sourceDomain: dom,
      sourceUrl: `https://${dom}/resource/${i}`,
      category: cat,
      rawValue: { id: i, name: `Entity_${i}` },
      payloadChecksum: `CHK_SCALE_${i.toString(16).padStart(6, '0')}`,
      metadata: cat === 'AI_MODEL' ? { modelName: `Model_${i}`, provider: dom, explicitlyPermitted: isGreen && !isDark } : undefined,
    };

    states.push(normalizeToDimensionalState(raw, `Entity Benchmark ${i}`));
  }

  return buildInformationUniverseIndex(states, universeId);
}

/**
 * Serializes an InformationUniverseIndex to JSON
 */
export function serializeUniverseIndex(index: InformationUniverseIndex): string {
  return JSON.stringify(
    {
      version: 'F49_UNIVERSE_INDEX_V1',
      universeId: index.universeId,
      totalStates: index.totalStates,
      greenCount: index.greenStatesCount,
      redCount: index.redStatesCount,
      llmCount: index.llmModelsCount,
      states: index.states,
    },
    null,
    2
  );
}

/**
 * Deserializes an InformationUniverseIndex from JSON
 */
export function deserializeUniverseIndex(json: string): InformationUniverseIndex {
  const parsed = JSON.parse(json);
  if (parsed.version !== 'F49_UNIVERSE_INDEX_V1') {
    throw new Error(`Invalid universe index version: ${parsed.version}`);
  }
  return buildInformationUniverseIndex(parsed.states, parsed.universeId);
}

/**
 * Evaluates F49 search, classification, and dimensional determinism across 250 trials
 */
export function evaluateUnifiedUniverseDeterminism(trials = 250): {
  trials: number;
  allIdentical: boolean;
  variance: number;
  redBypasses: number;
  unexpectedCollisions: number;
} {
  const index = getStandardInformationUniverseFixture();
  let firstSearchHash = '';
  let redBypasses = 0;
  let unexpectedCollisions = 0;

  for (let t = 0; t < trials; t++) {
    const res1 = searchDimensionalUniverse(index, 'Container');
    const res2 = searchDimensionalUniverse(index, 'Open Research Embedding 7B');
    const res3 = searchDimensionalUniverse(index, 'darkweb');
    const res4 = searchDimensionalUniverse(index, 'shahrukh khan'); // Nonexistent query -> 0

    if (res4.totalFound !== 0) {
      unexpectedCollisions++;
    }

    // Verify RED safety: RED search results must never have processingAllowed === true
    for (const r of [...res1.results, ...res2.results, ...res3.results]) {
      if (r.classification === 'RED' && r.processingAllowed) {
        redBypasses++;
      }
    }

    // Hash search outcomes
    let hash = 0x811c9dc5;
    const combined = `${res1.totalFound}:${res2.totalFound}:${res3.totalFound}:${res4.totalFound}:${res1.results[0]?.stateId}`;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const currentHash = (hash >>> 0).toString(16);

    if (t === 0) {
      firstSearchHash = currentHash;
    } else if (currentHash !== firstSearchHash) {
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
