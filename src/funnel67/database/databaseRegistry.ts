/**
 * 3D Memory Studio — Funnel 67
 * Permitted Database Registry (F47 Security Enforced)
 */

import { DatabaseRecord, CollectionType } from '../types';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';

export class DatabaseRegistry {
  private readonly records: Map<string, DatabaseRecord> = new Map();

  constructor() {
    this.seedDefaultPermittedRecords();
  }

  public addRecord(record: DatabaseRecord): boolean {
    if (!isPermittedInWorkspace(record.classification)) {
      return false; // RED records strictly blocked
    }
    this.records.set(record.id, record);
    return true;
  }

  public getRecord(id: string): DatabaseRecord | undefined {
    return this.records.get(id);
  }

  public getAll(): readonly DatabaseRecord[] {
    return Array.from(this.records.values());
  }

  public getByCollection(collection: CollectionType): readonly DatabaseRecord[] {
    const all = this.getAll();
    switch (collection) {
      case 'STATES':
        return all.filter((r) => r.type.startsWith('STATE') || r.type === 'MEMORY_CELL');
      case 'RELATIONSHIPS':
        return all.filter((r) => r.type.startsWith('REL_') || r.type === 'RELATIONSHIP');
      case 'CLUSTERS':
        return all.filter((r) => r.type.startsWith('CLUSTER') || r.type === 'SPATIAL_CLUSTER');
      case 'DIMENSIONS':
        return all.filter((r) => r.type.startsWith('DIM_') || r.type === 'PROJECTION');
      default:
        return all;
    }
  }

  private seedDefaultPermittedRecords(): void {
    // Seed 42 permitted research states
    for (let i = 1; i <= 42; i++) {
      const numStr = String(i).padStart(3, '0');
      this.records.set(`STATE_${numStr}`, {
        id: `STATE_${numStr}`,
        type: i % 3 === 0 ? 'STATE_SEMANTIC' : i % 3 === 1 ? 'STATE_DOMAIN' : 'STATE_CATEGORY',
        classification: 'GREEN',
        dimension: 3,
        status: 'ACTIVE',
        source: 'RESEARCH_SIMULATION_F52',
        coordinates: [((i * 17) % 200) - 100, ((i * 23) % 150) - 75, ((i * 29) % 200) - 100],
        clusterId: `CLUSTER_0${(i % 8) + 1}`,
        relationshipCount: (i % 5) + 1,
        label: `Research State ${numStr}`,
      });
    }

    // Seed 87 permitted relationships
    for (let i = 1; i <= 87; i++) {
      const numStr = String(i).padStart(3, '0');
      this.records.set(`REL_${numStr}`, {
        id: `REL_${numStr}`,
        type: 'RELATIONSHIP',
        classification: 'GREEN',
        dimension: 3,
        status: 'ACTIVE',
        source: 'TOPOLOGY_GRAPH_F58',
        relationshipCount: 2,
        label: `Relationship Edge ${numStr}`,
      });
    }

    // Seed 8 permitted clusters
    for (let i = 1; i <= 8; i++) {
      const numStr = String(i).padStart(2, '0');
      this.records.set(`CLUSTER_${numStr}`, {
        id: `CLUSTER_${numStr}`,
        type: 'SPATIAL_CLUSTER',
        classification: 'GREEN',
        dimension: 3,
        status: 'ACTIVE',
        source: 'SPATIAL_CLUSTER_F59',
        clusterId: `CLUSTER_${numStr}`,
        label: `Spatial Cluster ${numStr}`,
      });
    }

    // Seed 7 standard dimensions
    const dims: Array<[number, string]> = [
      [1, 'DIM_01_SCALAR'],
      [2, 'DIM_02_PLANAR'],
      [3, 'DIM_03_SPATIAL'],
      [4, 'DIM_04_PROJECTED_4D'],
      [8, 'DIM_08_PROJECTED_RADIAL'],
      [12, 'DIM_12_PROJECTED_LAYER'],
      [16, 'DIM_16_PROJECTED_ORTHO'],
    ];

    for (const [dim, name] of dims) {
      this.records.set(name, {
        id: name,
        type: 'PROJECTION',
        classification: 'GREEN',
        dimension: dim as any,
        status: 'ACTIVE',
        source: 'DIMENSION_ENGINE_F60',
        label: `Dimension Level Z${dim}`,
      });
    }
  }

  public clear(): void {
    this.records.clear();
  }
}
