/**
 * 3D Memory Studio — Funnel 49
 * Information Universe Dimensional Indexer
 *
 * Builds deterministic multi-index maps for high-performance,
 * zero-mutation dimensional search and state retrieval.
 */

import {
  DimensionalInformationState,
  InformationUniverseIndex,
} from './types';
import { DataClassification } from '../funnel47/types';

/**
 * Creates a unified InformationUniverseIndex from a list of DimensionalInformationStates
 */
export function buildInformationUniverseIndex(
  states: readonly DimensionalInformationState[],
  universeId = 'UNIV_DIMENSIONAL_49'
): InformationUniverseIndex {
  const stateById = new Map<string, DimensionalInformationState>();
  const statesByEntity = new Map<string, DimensionalInformationState[]>();
  const statesByCategory = new Map<string, DimensionalInformationState[]>();
  const statesByClassification = new Map<DataClassification, DimensionalInformationState[]>();
  const statesByDomain = new Map<string, DimensionalInformationState[]>();
  const statesBySemanticTerm = new Map<string, DimensionalInformationState[]>();

  statesByClassification.set('GREEN', []);
  statesByClassification.set('RED', []);

  let greenCount = 0;
  let redCount = 0;
  let llmCount = 0;

  for (const s of states) {
    // 1. Index by stateId and recordId
    stateById.set(s.stateId, s);
    stateById.set(s.recordId, s);

    // 2. Index by Entity
    const entityKey = s.entityId.toLowerCase();
    const existingEntities = statesByEntity.get(entityKey) || [];
    existingEntities.push(s);
    statesByEntity.set(entityKey, existingEntities);

    // 3. Index by Category
    const catKey = s.category.toUpperCase();
    const existingCat = statesByCategory.get(catKey) || [];
    existingCat.push(s);
    statesByCategory.set(catKey, existingCat);

    // 4. Index by Classification
    if (s.classification === 'GREEN') {
      greenCount++;
      statesByClassification.get('GREEN')!.push(s);
    } else {
      redCount++;
      statesByClassification.get('RED')!.push(s);
    }

    // 5. Index by Source Domain
    const domainKey = s.sourceDomain.toLowerCase();
    const existingDomain = statesByDomain.get(domainKey) || [];
    existingDomain.push(s);
    statesByDomain.set(domainKey, existingDomain);

    // 6. Index by Semantic Terms
    for (const term of s.semanticTerms) {
      const tKey = term.toLowerCase();
      const existingTerm = statesBySemanticTerm.get(tKey) || [];
      existingTerm.push(s);
      statesBySemanticTerm.set(tKey, existingTerm);
    }

    // 7. Track LLM Models count
    const isLlm =
      s.category === 'AI_MODEL' ||
      s.category === 'LLM_MODEL' ||
      s.modelMetadata !== undefined ||
      s.recordId.startsWith('LLM_');

    if (isLlm) {
      llmCount++;
    }
  }

  // Freeze inner arrays
  const frozenEntityMap = new Map<string, readonly DimensionalInformationState[]>();
  for (const [k, v] of statesByEntity.entries()) {
    frozenEntityMap.set(k, Object.freeze(v));
  }

  const frozenCatMap = new Map<string, readonly DimensionalInformationState[]>();
  for (const [k, v] of statesByCategory.entries()) {
    frozenCatMap.set(k, Object.freeze(v));
  }

  const frozenClassMap = new Map<DataClassification, readonly DimensionalInformationState[]>();
  for (const [k, v] of statesByClassification.entries()) {
    frozenClassMap.set(k, Object.freeze(v));
  }

  const frozenDomainMap = new Map<string, readonly DimensionalInformationState[]>();
  for (const [k, v] of statesByDomain.entries()) {
    frozenDomainMap.set(k, Object.freeze(v));
  }

  const frozenTermMap = new Map<string, readonly DimensionalInformationState[]>();
  for (const [k, v] of statesBySemanticTerm.entries()) {
    frozenTermMap.set(k, Object.freeze(v));
  }

  return Object.freeze({
    universeId,
    totalStates: states.length,
    greenStatesCount: greenCount,
    redStatesCount: redCount,
    llmModelsCount: llmCount,
    states: Object.freeze([...states]),
    stateById: Object.freeze(stateById),
    statesByEntity: Object.freeze(frozenEntityMap),
    statesByCategory: Object.freeze(frozenCatMap),
    statesByClassification: Object.freeze(frozenClassMap),
    statesByDomain: Object.freeze(frozenDomainMap),
    statesBySemanticTerm: Object.freeze(frozenTermMap),
  });
}
