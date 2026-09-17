/**
 * CUBiO AI — Phase 2: Storage Adapter Implementation
 *
 * Implements IStorageAdapter wrapping Funnel 71 SQLiteDataStore.
 * Ensures application code never hardcodes machine-specific paths.
 */

import * as path from 'path';
import { IStorageAdapter } from './contracts';
import { SQLiteDataStore } from '../../funnel71/persistence/sqlitePersistence';
import { StudioRecord } from '../../funnel71/types';

export class SQLiteStorageAdapter implements IStorageAdapter {
  public readonly adapterName = 'SQLiteStorageAdapter';
  private store: SQLiteDataStore;
  private _isInitialized = false;

  constructor(options?: { dbPath?: string }) {
    // Physical paths belong strictly inside storage adapters, never in application logic
    const resolvedPath = options?.dbPath || process.env.CUBIO_DB_PATH || path.resolve(process.cwd(), 'data', 'cubio_studio.db');
    this.store = new SQLiteDataStore({ dbPath: resolvedPath });
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;
    await this.store.initialize();
    this._isInitialized = true;
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  public async get<T>(domain: string, id: string): Promise<T | undefined> {
    await this.initialize();
    const compositeId = `${domain}:${id}`;
    // First try domain-prefixed ID, then raw ID for backwards compatibility
    let rec = await this.store.get(compositeId);
    if (!rec) {
      rec = await this.store.get(id);
    }
    if (!rec) return undefined;
    if (rec.metadata && (rec.metadata as any).payload) {
      return (rec.metadata as any).payload as T;
    }
    return rec as unknown as T;
  }

  public async getAll<T>(domain: string): Promise<readonly T[]> {
    await this.initialize();
    const all = await this.store.getAll();
    const filtered = all.filter((r) => r.id.startsWith(`${domain}:`) || r.type === domain.toUpperCase());
    return filtered.map((r) => {
      if (r.metadata && (r.metadata as any).payload) {
        return (r.metadata as any).payload as T;
      }
      return r as unknown as T;
    });
  }

  public async save<T extends { id: string }>(domain: string, record: T): Promise<T> {
    await this.initialize();
    const compositeId = record.id.startsWith(`${domain}:`) ? record.id : `${domain}:${record.id}`;
    const now = Date.now();

    const studioRec: StudioRecord = {
      id: compositeId,
      type: (domain.toUpperCase().startsWith('STATE') ? 'STATES' :
             domain.toUpperCase().startsWith('REL') ? 'RELATIONSHIPS' :
             domain.toUpperCase().startsWith('CLUSTER') ? 'CLUSTERS' : 'DIMENSIONS') as any,
      classification: 'GREEN',
      dimension: 3,
      status: 'ACTIVE',
      source: `VIRTUAL_DATA_SERVICE_${domain.toUpperCase()}`,
      metadata: { payload: record },
      createdAt: now,
      updatedAt: now,
    };

    const existing = await this.store.get(compositeId);
    if (existing) {
      await this.store.update(compositeId, studioRec);
    } else {
      await this.store.create(studioRec);
    }

    return record;
  }

  public async delete(domain: string, id: string): Promise<boolean> {
    await this.initialize();
    const compositeId = id.startsWith(`${domain}:`) ? id : `${domain}:${id}`;
    return this.store.remove(compositeId);
  }

  public async close(): Promise<void> {
    this.store.dispose();
    this._isInitialized = false;
  }
}
