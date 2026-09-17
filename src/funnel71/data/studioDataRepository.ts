/**
 * 3D Memory Studio — Funnel 71
 * Studio Data Repository
 *
 * Primary data access abstraction between Studio UI components/adapters and persistent storage.
 */

import { StudioDataStore } from './studioDataStore';
import { MemoryStore } from '../persistence/memoryPersistence';
import { StudioRecord, StudioRecordType, DataQueryCriteria } from '../types';
import { DataClassification } from '../../funnel47/types';
import { SimulationDimension } from '../../funnel52/types';

export class StudioDataRepository {
  public readonly store: StudioDataStore;

  constructor(store?: StudioDataStore) {
    this.store = store ?? new MemoryStore();
  }

  public async initialize(): Promise<void> {
    await this.store.initialize();
  }

  public async getRecord(id: string): Promise<StudioRecord | undefined> {
    return this.store.get(id);
  }

  public async getRecords(criteria: DataQueryCriteria = {}): Promise<readonly StudioRecord[]> {
    return this.store.query(criteria);
  }

  public async saveRecord(record: StudioRecord): Promise<StudioRecord> {
    return this.store.create(record);
  }

  public async updateRecord(id: string, updates: Partial<StudioRecord>): Promise<StudioRecord> {
    return this.store.update(id, updates);
  }

  public async deleteRecord(id: string): Promise<boolean> {
    return this.store.remove(id);
  }

  public async findByType(type: StudioRecordType): Promise<readonly StudioRecord[]> {
    return this.store.query({ type });
  }

  public async findByDimension(dimension: SimulationDimension): Promise<readonly StudioRecord[]> {
    return this.store.query({ dimension });
  }

  public async findByClassification(classification: DataClassification): Promise<readonly StudioRecord[]> {
    return this.store.query({ classification });
  }

  public async findByCluster(clusterId: string): Promise<readonly StudioRecord[]> {
    return this.store.query({ clusterId });
  }

  public async count(): Promise<number> {
    const all = await this.store.getAll();
    return all.length;
  }

  public async clear(): Promise<void> {
    await this.store.clear();
  }
}
