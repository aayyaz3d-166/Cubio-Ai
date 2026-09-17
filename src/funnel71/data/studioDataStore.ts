/**
 * 3D Memory Studio — Funnel 71
 * Studio Data Store Interface
 */

import { StudioRecord, DataQueryCriteria } from '../types';

export interface StudioDataStore {
  initialize(): Promise<void>;
  get(id: string): Promise<StudioRecord | undefined>;
  getAll(): Promise<readonly StudioRecord[]>;
  query(criteria: DataQueryCriteria): Promise<readonly StudioRecord[]>;
  create(record: StudioRecord): Promise<StudioRecord>;
  update(id: string, updates: Partial<StudioRecord>): Promise<StudioRecord>;
  remove(id: string): Promise<boolean>;
  clear(): Promise<void>;
  hydrate(data: unknown): Promise<number>;
  serialize(): Promise<string>;
  dispose(): void;
}
