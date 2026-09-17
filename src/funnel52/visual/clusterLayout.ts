/**
 * 3D Memory Studio — Funnel 52
 * Cluster Layout & Category Mapping
 */

import { SimulationClusterType, SimulatedCluster } from '../types';
import { DimensionalInformationState } from '../../funnel49/types';

export const CLUSTER_DEFINITIONS: Readonly<Record<SimulationClusterType, { label: string; colorHex: string; center: readonly [number, number, number] }>> = Object.freeze({
  STANDARDS: { label: 'Web & Data Standards', colorHex: '#10b981', center: [-180, -90, -40] },
  PROTOCOLS: { label: 'Network Protocols', colorHex: '#06b6d4', center: [-120, 110, 50] },
  ONTOLOGY: { label: 'Ontology & Semantics', colorHex: '#8b5cf6', center: [140, -110, -60] },
  AI_LLM: { label: 'AI & LLM Model Space', colorHex: '#38bdf8', center: [180, 80, 40] },
  TAXONOMY: { label: 'Taxonomy & Entities', colorHex: '#f59e0b', center: [0, -160, 60] },
  INFORMATION_THEORY: { label: 'Information Theory', colorHex: '#ec4899', center: [-60, 160, -50] },
  SECURITY: { label: 'Security & Classification', colorHex: '#f43f5e', center: [0, 180, 80] },
});

export function resolveClusterType(category: string, domain: string, classification: string): SimulationClusterType {
  if (classification === 'RED' || domain.includes('darkweb') || category.includes('MALWARE')) {
    return 'SECURITY';
  }
  const cat = category.toUpperCase();
  if (cat.includes('AI') || cat.includes('LLM') || cat.includes('MODEL')) return 'AI_LLM';
  if (cat.includes('STANDARD') || cat.includes('W3C') || cat.includes('SPEC')) return 'STANDARDS';
  if (cat.includes('PROTOCOL') || cat.includes('RFC') || cat.includes('HTTP')) return 'PROTOCOLS';
  if (cat.includes('ONTOLOGY') || cat.includes('SCHEMA') || cat.includes('RDF')) return 'ONTOLOGY';
  if (cat.includes('THEORY') || cat.includes('SHANNON') || cat.includes('ENTROPY')) return 'INFORMATION_THEORY';
  return 'TAXONOMY';
}

export function buildClusters(states: readonly DimensionalInformationState[]): readonly SimulatedCluster[] {
  const memberMap = new Map<SimulationClusterType, string[]>();

  for (const key of Object.keys(CLUSTER_DEFINITIONS) as SimulationClusterType[]) {
    memberMap.set(key, []);
  }

  for (const s of states) {
    const cType = resolveClusterType(s.category, s.sourceDomain, s.classification);
    memberMap.get(cType)!.push(s.stateId);
  }

  const clusters: SimulatedCluster[] = [];
  for (const [cType, members] of memberMap.entries()) {
    const def = CLUSTER_DEFINITIONS[cType];
    clusters.push(
      Object.freeze({
        clusterId: cType,
        label: def.label,
        colorHex: def.colorHex,
        centerX: def.center[0],
        centerY: def.center[1],
        centerZ: def.center[2],
        radius: Math.max(60, Math.min(120, 50 + members.length * 15)),
        memberStateIds: Object.freeze(members),
      })
    );
  }

  return Object.freeze(clusters);
}
