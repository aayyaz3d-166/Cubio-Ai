/**
 * 3D Memory Studio — Funnel 58
 * Relationship Resolver & GREEN Security Gate
 *
 * Validates node existence, normalizes strength, and enforces F47 GREEN authority.
 */

import { GraphRelationship, GraphRelationshipType, GraphDirection, GraphNode } from '../types';
import { DimensionalInformationState } from '../../funnel49/types';
import { SimulatedStateNode } from '../../funnel52/types';

export function normalizeStrength(strength: number | undefined): number {
  if (strength === undefined || isNaN(strength)) return 0.5;
  return Math.max(0.0, Math.min(1.0, Number(strength.toFixed(3))));
}

export function resolveRelationship(
  sourceState: DimensionalInformationState | SimulatedStateNode | GraphNode,
  targetState: DimensionalInformationState | SimulatedStateNode | GraphNode,
  type: GraphRelationshipType = 'SEMANTIC',
  rawStrength = 0.5,
  direction: GraphDirection = 'UNDIRECTED'
): GraphRelationship | null {
  // 1. Source & Target must exist
  if (!sourceState || !targetState) return null;

  // 2. F47 Security Enforcement: Both states must be GREEN
  const srcClass = 'classification' in sourceState ? sourceState.classification : 'RED';
  const tgtClass = 'classification' in targetState ? targetState.classification : 'RED';

  if (srcClass !== 'GREEN' || tgtClass !== 'GREEN') {
    return null; // Strictly blocked
  }

  // 3. Self-loops check
  const srcId = 'stateId' in sourceState ? sourceState.stateId : '';
  const tgtId = 'stateId' in targetState ? targetState.stateId : '';
  if (!srcId || !tgtId || srcId === tgtId) return null;

  // 4. Coordinates extraction
  let srcPos: [number, number, number] = [0, 0, 0];
  let tgtPos: [number, number, number] = [0, 0, 0];

  if ('position' in sourceState && Array.isArray(sourceState.position)) {
    srcPos = [sourceState.position[0], sourceState.position[1], sourceState.position[2]];
  } else if ('x' in sourceState) {
    srcPos = [sourceState.x, sourceState.y, sourceState.z];
  }

  if ('position' in targetState && Array.isArray(targetState.position)) {
    tgtPos = [targetState.position[0], targetState.position[1], targetState.position[2]];
  } else if ('x' in targetState) {
    tgtPos = [targetState.x, targetState.y, targetState.z];
  }

  const relId = `REL_${srcId}_${tgtId}_${type}`;
  const strength = normalizeStrength(rawStrength);

  return {
    relationshipId: relId,
    sourceStateId: srcId,
    targetStateId: tgtId,
    relationshipType: type,
    strength,
    direction,
    visible: true,
    selected: false,
    highlighted: false,
    classification: 'GREEN',
    sourcePos: [srcPos[0], srcPos[1], srcPos[2]],
    targetPos: [tgtPos[0], tgtPos[1], tgtPos[2]],
  };
}
