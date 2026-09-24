/**
 * CUBiO AI — Task 188: Native Semantic Relationship Learning
 * src/cubio/model/native_semantic_relationship_learning/ruleEngine.ts
 *
 * Deterministic Semantic Rule Engine:
 * Defines mathematical rules for relationship deduction:
 * - IS_A Transitivity
 * - PART_OF Transitivity
 * - DEPENDS_ON Chaining
 * - CAUSES Attenuating Chain
 * - Inheritance (IS_A + DEPENDS_ON -> DEPENDS_ON)
 * - Associative Co-occurrence (RELATED_TO)
 */

import {
  SemanticRelationType,
} from './types';
import {
  KnowledgeEpistemicStatus,
} from '../native_knowledge_architecture/types';
import { GraphEdgeRef } from '../native_knowledge_graph_expansion/types';

export interface RuleMatchResult {
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType: SemanticRelationType;
  readonly confidence: number;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly ruleId: string;
  readonly isDirected: boolean;
}

export interface InferenceRule {
  readonly ruleId: string;
  readonly description: string;
  evaluate(edge1: GraphEdgeRef, edge2: GraphEdgeRef): RuleMatchResult | null;
}

/**
 * 1. IS_A Transitivity Rule:
 * IS_A(A, B) ^ IS_A(B, C) -> IS_A(A, C)
 */
export const RuleTransitivityIsA: InferenceRule = Object.freeze({
  ruleId: 'RULE_TRANSITIVITY_IS_A',
  description: 'Transitive subsumption: If A is a B and B is a C, then A is a C.',
  evaluate(e1: GraphEdgeRef, e2: GraphEdgeRef): RuleMatchResult | null {
    if (e1.relationType !== 'IS_A' || e2.relationType !== 'IS_A') return null;
    if (e1.targetId !== e2.sourceId) return null;
    if (e1.sourceId === e2.targetId) return null; // Prevent self-loop

    const confidence = Math.round(e1.weight * e2.weight * 0.95 * 1000) / 1000;
    return {
      sourceId: e1.sourceId,
      targetId: e2.targetId,
      relationType: 'IS_A',
      confidence,
      epistemicStatus: 'DERIVED',
      ruleId: 'RULE_TRANSITIVITY_IS_A',
      isDirected: true,
    };
  },
});

/**
 * 2. PART_OF Transitivity Rule:
 * PART_OF(A, B) ^ PART_OF(B, C) -> PART_OF(A, C)
 */
export const RuleTransitivityPartOf: InferenceRule = Object.freeze({
  ruleId: 'RULE_TRANSITIVITY_PART_OF',
  description: 'Mereological transitivity: If A is part of B and B is part of C, then A is part of C.',
  evaluate(e1: GraphEdgeRef, e2: GraphEdgeRef): RuleMatchResult | null {
    if (e1.relationType !== 'PART_OF' || e2.relationType !== 'PART_OF') return null;
    if (e1.targetId !== e2.sourceId) return null;
    if (e1.sourceId === e2.targetId) return null;

    const confidence = Math.round(e1.weight * e2.weight * 0.90 * 1000) / 1000;
    return {
      sourceId: e1.sourceId,
      targetId: e2.targetId,
      relationType: 'PART_OF',
      confidence,
      epistemicStatus: 'DERIVED',
      ruleId: 'RULE_TRANSITIVITY_PART_OF',
      isDirected: true,
    };
  },
});

/**
 * 3. DEPENDS_ON Chaining Rule:
 * DEPENDS_ON(A, B) ^ DEPENDS_ON(B, C) -> DEPENDS_ON(A, C)
 */
export const RuleDependencyChain: InferenceRule = Object.freeze({
  ruleId: 'RULE_DEPENDENCY_CHAIN',
  description: 'Dependency transitivity: If A depends on B and B depends on C, then A depends on C.',
  evaluate(e1: GraphEdgeRef, e2: GraphEdgeRef): RuleMatchResult | null {
    if (e1.relationType !== 'DEPENDS_ON' || e2.relationType !== 'DEPENDS_ON') return null;
    if (e1.targetId !== e2.sourceId) return null;
    if (e1.sourceId === e2.targetId) return null;

    const confidence = Math.round(e1.weight * e2.weight * 0.85 * 1000) / 1000;
    return {
      sourceId: e1.sourceId,
      targetId: e2.targetId,
      relationType: 'DEPENDS_ON',
      confidence,
      epistemicStatus: 'DERIVED',
      ruleId: 'RULE_DEPENDENCY_CHAIN',
      isDirected: true,
    };
  },
});

/**
 * 4. CAUSES Attenuating Chain Rule:
 * CAUSES(A, B) ^ CAUSES(B, C) -> CAUSES(A, C)
 * Causal attenuation decay is higher (0.75 multiplier), status is THEORY.
 */
export const RuleCausalChain: InferenceRule = Object.freeze({
  ruleId: 'RULE_CAUSAL_CHAIN',
  description: 'Causal propagation: If A causes B and B causes C, then A causally influences C with attenuation.',
  evaluate(e1: GraphEdgeRef, e2: GraphEdgeRef): RuleMatchResult | null {
    if (e1.relationType !== 'CAUSES' || e2.relationType !== 'CAUSES') return null;
    if (e1.targetId !== e2.sourceId) return null;
    if (e1.sourceId === e2.targetId) return null;

    const confidence = Math.round(e1.weight * e2.weight * 0.75 * 1000) / 1000;
    return {
      sourceId: e1.sourceId,
      targetId: e2.targetId,
      relationType: 'CAUSES',
      confidence,
      epistemicStatus: 'THEORY',
      ruleId: 'RULE_CAUSAL_CHAIN',
      isDirected: true,
    };
  },
});

/**
 * 5. Inheritance of Dependency Rule:
 * IS_A(A, B) ^ DEPENDS_ON(B, C) -> DEPENDS_ON(A, C)
 */
export const RuleInheritDependency: InferenceRule = Object.freeze({
  ruleId: 'RULE_INHERIT_DEPENDENCY',
  description: 'Taxonomic dependency inheritance: If A is a B and B depends on C, then A depends on C.',
  evaluate(e1: GraphEdgeRef, e2: GraphEdgeRef): RuleMatchResult | null {
    if (e1.relationType !== 'IS_A' || e2.relationType !== 'DEPENDS_ON') return null;
    if (e1.targetId !== e2.sourceId) return null;
    if (e1.sourceId === e2.targetId) return null;

    const confidence = Math.round(e1.weight * e2.weight * 0.88 * 1000) / 1000;
    return {
      sourceId: e1.sourceId,
      targetId: e2.targetId,
      relationType: 'DEPENDS_ON',
      confidence,
      epistemicStatus: 'DERIVED',
      ruleId: 'RULE_INHERIT_DEPENDENCY',
      isDirected: true,
    };
  },
});

/**
 * 6. Associative Co-occurrence Rule (RELATED_TO):
 * Both A and B connect to common target M (where A != B):
 * REL(A, M) ^ REL(B, M) -> RELATED_TO(A, B)
 */
export const RuleAssociativeCoOccurrence: InferenceRule = Object.freeze({
  ruleId: 'RULE_ASSOCIATIVE_CO_OCCURRENCE',
  description: 'Associative link: If A and B share a common semantic target M, A and B are related.',
  evaluate(e1: GraphEdgeRef, e2: GraphEdgeRef): RuleMatchResult | null {
    // Both connect to same target
    if (e1.targetId !== e2.targetId) return null;
    if (e1.sourceId === e2.sourceId) return null; // Same source

    // Disallow transitive pairs from matching this rule to avoid duplicate/redundant derivations
    if (e1.relationType === 'IS_A' && e2.relationType === 'IS_A') return null;

    const minW = Math.min(e1.weight, e2.weight);
    const confidence = Math.round(minW * 0.55 * 1000) / 1000;

    return {
      sourceId: e1.sourceId,
      targetId: e2.sourceId,
      relationType: 'RELATED_TO',
      confidence,
      epistemicStatus: 'HYPOTHESIS',
      ruleId: 'RULE_ASSOCIATIVE_CO_OCCURRENCE',
      isDirected: false,
    };
  },
});

/**
 * Default rule registry.
 */
export const DEFAULT_INFERENCE_RULES: readonly InferenceRule[] = Object.freeze([
  RuleTransitivityIsA,
  RuleTransitivityPartOf,
  RuleDependencyChain,
  RuleCausalChain,
  RuleInheritDependency,
  RuleAssociativeCoOccurrence,
]);
