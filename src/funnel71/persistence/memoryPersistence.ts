/**
 * 3D Memory Studio — Funnel 71
 * Memory Persistence Store
 *
 * In-memory deterministic implementation of StudioDataStore.
 */

import { StudioDataStore } from '../data/studioDataStore';
import { StudioRecord, DataQueryCriteria } from '../types';
import { StudioDataValidator } from '../data/studioDataValidator';
import { StudioDataSerializer } from '../data/studioDataSerializer';
import { StudioDataHydrator } from '../data/studioDataHydrator';
import { DataQueryManager } from '../query/dataQueryManager';
import { MAX_LOADED_RECORDS } from '../schema/studioSchema';

export class MemoryStore implements StudioDataStore {
  private readonly records: Map<string, StudioRecord> = new Map();
  private readonly validator: StudioDataValidator;
  private readonly serializer: StudioDataSerializer;
  private readonly hydrator: StudioDataHydrator;
  private readonly queryManager: DataQueryManager;
  private isInitialized = false;

  constructor(options?: {
    validator?: StudioDataValidator;
    serializer?: StudioDataSerializer;
    hydrator?: StudioDataHydrator;
    queryManager?: DataQueryManager;
  }) {
    this.validator = options?.validator ?? new StudioDataValidator();
    this.serializer = options?.serializer ?? new StudioDataSerializer();
    this.hydrator = options?.hydrator ?? new StudioDataHydrator(this.validator);
    this.queryManager = options?.queryManager ?? new DataQueryManager();
  }

  public async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  public async get(id: string): Promise<StudioRecord | undefined> {
    return this.records.get(id);
  }

  public async getAll(): Promise<readonly StudioRecord[]> {
    return Array.from(this.records.values());
  }

  public async query(criteria: DataQueryCriteria): Promise<readonly StudioRecord[]> {
    const all = Array.from(this.records.values());
    return this.queryManager.executeQuery(all, criteria);
  }

  public async create(record: StudioRecord): Promise<StudioRecord> {
    const val = this.validator.validateRecord(record);
    if (!val.isValid) {
      throw new Error(`Record validation failed: ${val.reason} (${val.errorCode})`);
    }

    if (this.records.has(record.id)) {
      throw new Error(`Duplicate record ID: "${record.id}" already exists in store.`);
    }

    if (this.records.size >= MAX_LOADED_RECORDS) {
      throw new Error(`Store limit reached: maximum ${MAX_LOADED_RECORDS} records.`);
    }

    this.records.set(record.id, record);
    return record;
  }

  public async update(id: string, updates: Partial<StudioRecord>): Promise<StudioRecord> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new Error(`Record with ID "${id}" not found.`);
    }

    const updated: StudioRecord = {
      ...existing,
      ...updates,
      id: existing.id, // ID is immutable
      updatedAt: Date.now(),
    };

    const val = this.validator.validateRecord(updated);
    if (!val.isValid) {
      throw new Error(`Updated record validation failed: ${val.reason}`);
    }

    this.records.set(id, updated);
    return updated;
  }

  public async remove(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  public async clear(): Promise<void> {
    this.records.clear();
  }

  public async hydrate(data: unknown): Promise<number> {
    const res = this.hydrator.hydrate(data);
    for (const r of res.records) {
      if (this.records.size < MAX_LOADED_RECORDS) {
        this.records.set(r.id, r);
      }
    }
    return res.validCount;
  }

  public async serialize(): Promise<string> {
    const list = Array.from(this.records.values());
    return this.serializer.serializeRecords(list);
  }

  public dispose(): void {
    this.records.clear();
    this.isInitialized = false;
  }

  public get size(): number {
    return this.records.size;
  }

  public get initialized(): boolean {
    return this.isInitialized;
  }
}
