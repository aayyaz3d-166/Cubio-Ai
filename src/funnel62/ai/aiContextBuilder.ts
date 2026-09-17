/**
 * 3D Memory Studio — Funnel 62
 * Bounded AI Context Builder
 *
 * Assembles strictly permitted, bounded context from the active selected state.
 * Blocks 100% of RED classification data.
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { ClusterRegistry } from '../../funnel59/cluster/clusterRegistry';
import { AIContextPayload } from './llmTypes';

export function buildAIContextFromSelectedState(
  state: DimensionalInformationState | undefined,
  graphRegistry?: GraphRegistry,
  clusterRegistry?: ClusterRegistry,
  activeDimension = 3
): AIContextPayload | null {
  if (!state) return null;

  // F47 Security Enforcement: RED records must NEVER reach AI context
  if (state.classification === 'RED' || !state.processingAllowed) {
    return null;
  }

  // Connected relationships (bounded to 10 max)
  const connectedRelationships: Array<{
    relationshipId: string;
    type: string;
    targetStateId: string;
    strength: number;
  }> = [];

  if (graphRegistry) {
    const rels = graphRegistry.getBySource(state.stateId);
    for (let i = 0; i < Math.min(10, rels.length); i++) {
      const r = rels[i];
      if (r.classification === 'GREEN') {
        connectedRelationships.push({
          relationshipId: r.relationshipId,
          type: r.relationshipType,
          targetStateId: r.targetStateId,
          strength: r.strength,
        });
      }
    }
  }

  // Cluster info
  let clusterInfo: AIContextPayload['clusterInfo'] = undefined;
  if (clusterRegistry) {
    const clusters = clusterRegistry.getByState(state.stateId);
    if (clusters.length > 0) {
      const c = clusters[0];
      if (c && c.classification === 'GREEN') {
        clusterInfo = {
          clusterId: c.clusterId,
          clusterType: c.clusterType,
          memberCount: c.memberStateIds.length,
        };
      }
    }
  }

  const coords =
    state.coordinatesByDimension?.[activeDimension]?.coordinateValues ?? [0, 0, 0];

  return {
    selectedStateId: state.stateId,
    entityName: state.entityName || state.recordId,
    category: state.category,
    classification: state.classification,
    dimension: activeDimension,
    coordinates: [...coords],
    connectedRelationships,
    clusterInfo,
    sourceMetadata: {
      domain: state.sourceDomain || 'unknown',
      url: state.sourceUrl || '',
    },
    timestamp: Date.now(),
  };
}
