/**
 * 3D Memory Studio — Funnel 58
 * Graph Filtering Engine
 */

import { GraphRelationship, GraphFilterCriteria, GraphRelationshipType, GraphStrengthFilter } from '../types';

export const ALL_RELATIONSHIP_TYPES: readonly GraphRelationshipType[] = [
  'SEMANTIC',
  'DOMAIN',
  'CATEGORY',
  'SOURCE',
  'SEQUENCE',
  'COORDINATE',
];

export function createDefaultFilterCriteria(): GraphFilterCriteria {
  return {
    allowedTypes: new Set(ALL_RELATIONSHIP_TYPES),
    strengthFilter: 'ALL',
    minStrength: 0.0,
    showDirectedOnly: false,
    showSelectedNeighborhoodOnly: false,
  };
}

export function matchesFilterCriteria(
  rel: GraphRelationship,
  criteria: GraphFilterCriteria
): boolean {
  // 1. Type filter
  if (!criteria.allowedTypes.has(rel.relationshipType)) {
    return false;
  }

  // 2. Strength filter
  switch (criteria.strengthFilter) {
    case 'STRONG':
      if (rel.strength < 0.7) return false;
      break;
    case 'MEDIUM':
      if (rel.strength < 0.4) return false;
      break;
    case 'WEAK':
      if (rel.strength >= 0.4) return false;
      break;
    case 'ALL':
    default:
      if (rel.strength < criteria.minStrength) return false;
      break;
  }

  // 3. Direction filter
  if (criteria.showDirectedOnly && rel.direction !== 'DIRECTED') {
    return false;
  }

  return true;
}

export function applyFiltersToRegistry(
  relationships: readonly GraphRelationship[],
  criteria: GraphFilterCriteria
): { visibleCount: number; hiddenCount: number } {
  let visibleCount = 0;
  let hiddenCount = 0;

  for (const rel of relationships) {
    const isMatch = matchesFilterCriteria(rel, criteria);
    rel.visible = isMatch;
    if (isMatch) visibleCount++;
    else hiddenCount++;
  }

  return { visibleCount, hiddenCount };
}
