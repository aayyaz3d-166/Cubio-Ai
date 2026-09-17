/**
 * 3D Memory Studio — Funnel 72
 * Database Boot Adapter (F67 & F71 SQLite Disk Persistence Integration)
 */

import { DatabaseRegistry } from '../../funnel67/database/databaseRegistry';
import { DatabaseRecord } from '../../funnel67/types';
import { SQLiteDataStore } from '../../funnel71/persistence/sqlitePersistence';
import { StudioRecord } from '../../funnel71/types';

export class DatabaseBootAdapter {
  private readonly store: SQLiteDataStore;
  private isActivated = false;

  constructor(store?: SQLiteDataStore) {
    this.store = store ?? new SQLiteDataStore();
  }

  public async activate(database?: DatabaseRegistry): Promise<{ success: boolean; error?: string }> {
    try {
      await this.store.initialize();

      if (database) {
        // 1. Check if SQLite disk store has existing persisted records
        const existingStored = await this.store.getAll();

        if (existingStored.length > 0) {
          // Rehydrate DatabaseRegistry from SQLite disk records
          for (const r of existingStored) {
            const dbRec: DatabaseRecord = {
              id: r.id,
              type: r.type,
              classification: r.classification,
              dimension: r.dimension,
              status: r.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
              source: r.source,
              coordinates: r.position,
              clusterId: r.clusterId,
            };
            database.addRecord(dbRec);
          }
        } else {
          // 2. Initial cold seed: persist registry default permitted records to disk
          const defaultRecords = database.getAll();
          for (const r of defaultRecords) {
            const studioRec: StudioRecord = {
              id: r.id,
              type: (r.type.startsWith('STATE') ? 'STATES' :
                     r.type.startsWith('REL') ? 'RELATIONSHIPS' :
                     r.type.startsWith('CLUSTER') ? 'CLUSTERS' : 'DIMENSIONS'),
              classification: r.classification,
              dimension: r.dimension,
              position: r.coordinates,
              clusterId: r.clusterId,
              source: r.source,
              status: r.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            try {
              await this.store.create(studioRec);
            } catch {
              // Ignore duplicate keys on seed
            }
          }
        }
      }

      this.isActivated = true;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'SQLite Database Boot failed' };
    }
  }

  public getStore(): SQLiteDataStore {
    return this.store;
  }

  public async persistRecord(record: DatabaseRecord): Promise<boolean> {
    const studioRec: StudioRecord = {
      id: record.id,
      type: (record.type.startsWith('STATE') ? 'STATES' :
             record.type.startsWith('REL') ? 'RELATIONSHIPS' :
             record.type.startsWith('CLUSTER') ? 'CLUSTERS' : 'DIMENSIONS'),
      classification: record.classification,
      dimension: record.dimension,
      position: record.coordinates,
      clusterId: record.clusterId,
      source: record.source,
      status: record.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const existing = await this.store.get(studioRec.id);
      if (existing) {
        await this.store.update(studioRec.id, studioRec);
      } else {
        await this.store.create(studioRec);
      }
      return true;
    } catch {
      return false;
    }
  }

  public isReady(): boolean {
    return this.isActivated;
  }
}
