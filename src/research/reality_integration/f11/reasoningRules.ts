/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Reasoning Rules
 *
 * Explicit deterministic inference rules for transitivity, symmetry, inversion,
 * and spatial composition.
 *
 * Invariant: All derived relations obtain evidence state DERIVED_FROM_RELATIONSHIP_CHAIN,
 * and are NEVER promoted to OBSERVED.
 */

import { InferenceRule, WorldRelationType } from './types';

export const SPATIAL_REASONING_RULES: readonly InferenceRule[] = Object.freeze([
  // ─── Transitivity Rules ───
  {
    ruleId: 'RULE_TRANS_ABOVE',
    ruleName: 'Transitivity of ABOVE',
    premiseRelations: Object.freeze<WorldRelationType[]>(['ABOVE', 'ABOVE']),
    conclusionRelation: 'ABOVE',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is ABOVE B and B is ABOVE C, then A is ABOVE C.',
  },
  {
    ruleId: 'RULE_TRANS_BELOW',
    ruleName: 'Transitivity of BELOW',
    premiseRelations: Object.freeze<WorldRelationType[]>(['BELOW', 'BELOW']),
    conclusionRelation: 'BELOW',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is BELOW B and B is BELOW C, then A is BELOW C.',
  },
  {
    ruleId: 'RULE_TRANS_LEFT',
    ruleName: 'Transitivity of LEFT_OF',
    premiseRelations: Object.freeze<WorldRelationType[]>(['LEFT_OF', 'LEFT_OF']),
    conclusionRelation: 'LEFT_OF',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is LEFT_OF B and B is LEFT_OF C, then A is LEFT_OF C.',
  },
  {
    ruleId: 'RULE_TRANS_RIGHT',
    ruleName: 'Transitivity of RIGHT_OF',
    premiseRelations: Object.freeze<WorldRelationType[]>(['RIGHT_OF', 'RIGHT_OF']),
    conclusionRelation: 'RIGHT_OF',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is RIGHT_OF B and B is RIGHT_OF C, then A is RIGHT_OF C.',
  },
  {
    ruleId: 'RULE_TRANS_FRONT',
    ruleName: 'Transitivity of FRONT_OF',
    premiseRelations: Object.freeze<WorldRelationType[]>(['FRONT_OF', 'FRONT_OF']),
    conclusionRelation: 'FRONT_OF',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is FRONT_OF B and B is FRONT_OF C, then A is FRONT_OF C.',
  },
  {
    ruleId: 'RULE_TRANS_BEHIND',
    ruleName: 'Transitivity of BEHIND',
    premiseRelations: Object.freeze<WorldRelationType[]>(['BEHIND', 'BEHIND']),
    conclusionRelation: 'BEHIND',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is BEHIND B and B is BEHIND C, then A is BEHIND C.',
  },
  {
    ruleId: 'RULE_TRANS_INSIDE',
    ruleName: 'Transitivity of INSIDE',
    premiseRelations: Object.freeze<WorldRelationType[]>(['INSIDE', 'INSIDE']),
    conclusionRelation: 'INSIDE',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is INSIDE B and B is INSIDE C, then A is INSIDE C.',
  },
  {
    ruleId: 'RULE_TRANS_CONTAINS',
    ruleName: 'Transitivity of CONTAINS',
    premiseRelations: Object.freeze<WorldRelationType[]>(['CONTAINS', 'CONTAINS']),
    conclusionRelation: 'CONTAINS',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A CONTAINS B and B CONTAINS C, then A CONTAINS C.',
  },
  {
    ruleId: 'RULE_TRANS_CONNECTED',
    ruleName: 'Transitivity of CONNECTED_TO',
    premiseRelations: Object.freeze<WorldRelationType[]>(['CONNECTED_TO', 'CONNECTED_TO']),
    conclusionRelation: 'CONNECTED_TO',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: true,
    description: 'If A is CONNECTED_TO B and B is CONNECTED_TO C, then A is CONNECTED_TO C.',
  },

  // ─── Inversion Rules ───
  {
    ruleId: 'RULE_INV_ABOVE_BELOW',
    ruleName: 'Inversion of ABOVE to BELOW',
    premiseRelations: Object.freeze<WorldRelationType[]>(['ABOVE']),
    conclusionRelation: 'BELOW',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: false,
    description: 'If A is ABOVE B, then B is BELOW A.',
  },
  {
    ruleId: 'RULE_INV_LEFT_RIGHT',
    ruleName: 'Inversion of LEFT_OF to RIGHT_OF',
    premiseRelations: Object.freeze<WorldRelationType[]>(['LEFT_OF']),
    conclusionRelation: 'RIGHT_OF',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: false,
    description: 'If A is LEFT_OF B, then B is RIGHT_OF A.',
  },
  {
    ruleId: 'RULE_INV_FRONT_BEHIND',
    ruleName: 'Inversion of FRONT_OF to BEHIND',
    premiseRelations: Object.freeze<WorldRelationType[]>(['FRONT_OF']),
    conclusionRelation: 'BEHIND',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: false,
    description: 'If A is FRONT_OF B, then B is BEHIND A.',
  },
  {
    ruleId: 'RULE_INV_CONTAINS_INSIDE',
    ruleName: 'Inversion of CONTAINS to INSIDE',
    premiseRelations: Object.freeze<WorldRelationType[]>(['CONTAINS']),
    conclusionRelation: 'INSIDE',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: false,
    description: 'If A CONTAINS B, then B is INSIDE A.',
  },

  // ─── Symmetry Rules ───
  {
    ruleId: 'RULE_SYM_NEAR',
    ruleName: 'Symmetry of NEAR',
    premiseRelations: Object.freeze<WorldRelationType[]>(['NEAR']),
    conclusionRelation: 'NEAR',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: false,
    description: 'If A is NEAR B, then B is NEAR A.',
  },
  {
    ruleId: 'RULE_SYM_CONNECTED',
    ruleName: 'Symmetry of CONNECTED_TO',
    premiseRelations: Object.freeze<WorldRelationType[]>(['CONNECTED_TO']),
    conclusionRelation: 'CONNECTED_TO',
    evidenceType: 'DERIVED_FROM_RELATIONSHIP_CHAIN',
    isTransitive: false,
    description: 'If A is CONNECTED_TO B, then B is CONNECTED_TO A.',
  },
]);

/**
 * Validates whether transitivity is mathematically valid for the given relationship type.
 * e.g. NEAR and DISJOINT are NOT transitive.
 */
export function isRelationTransitive(relationType: WorldRelationType): boolean {
  const transitiveTypes: WorldRelationType[] = [
    'ABOVE',
    'BELOW',
    'LEFT_OF',
    'RIGHT_OF',
    'FRONT_OF',
    'BEHIND',
    'INSIDE',
    'CONTAINS',
    'CONNECTED_TO',
  ];
  return transitiveTypes.includes(relationType);
}
