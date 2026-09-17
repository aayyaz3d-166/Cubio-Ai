/**
 * 3D Memory Studio — Funnel 71
 * Persistence Manager
 *
 * Coordinates initialization, data operations, import/export, and persistence events.
 */

import { StudioDataRepository } from '../data/studioDataRepository';
import { StudioDataStore } from '../data/studioDataStore';
import { DataExportManager } from '../import/dataExportManager';
import { DataImportManager } from '../import/dataImportManager';
import { DataMigrationManager } from '../schema/dataMigrationManager';
import { StudioRecord, PersistenceEvent, PersistenceEventType } from '../types';

export type PersistenceEventListener = (event: PersistenceEvent) => void;

export class PersistenceManager {
  public readonly repository: StudioDataRepository;
  public readonly exportManager: DataExportManager;
  public readonly importManager: DataImportManager;
  public readonly migrationManager: DataMigrationManager;

  private readonly listeners: Set<PersistenceEventListener> = new Set();
  private lastSyncTimestamp = Date.now();

  constructor(store?: StudioDataStore) {
    this.repository = new StudioDataRepository(store);
    this.exportManager = new DataExportManager();
    this.importManager = new DataImportManager();
    this.migrationManager = new DataMigrationManager();
  }

  public async initialize(): Promise<void> {
    await this.repository.initialize();
    this.lastSyncTimestamp = Date.now();
    this.emit({
      type: 'record.loaded',
      timestamp: this.lastSyncTimestamp,
    });
  }

  public subscribe(listener: PersistenceEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: PersistenceEvent): void {
    this.lastSyncTimestamp = event.timestamp;
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public async saveRecord(record: StudioRecord): Promise<StudioRecord> {
    const saved = await this.repository.saveRecord(record);
    this.emit({
      type: 'record.created',
      recordId: saved.id,
      record: saved,
      timestamp: Date.now(),
    });
    return saved;
  }

  public async updateRecord(id: string, updates: Partial<StudioRecord>): Promise<StudioRecord> {
    const updated = await this.repository.updateRecord(id, updates);
    this.emit({
      type: 'record.updated',
      recordId: updated.id,
      record: updated,
      timestamp: Date.now(),
    });
    return updated;
  }

  public async deleteRecord(id: string): Promise<boolean> {
    const success = await this.repository.deleteRecord(id);
    if (success) {
      this.emit({
        type: 'record.deleted',
        recordId: id,
        timestamp: Date.now(),
      });
    }
    return success;
  }

  public async exportData(): Promise<string> {
    const records = await this.repository.getRecords();
    return this.exportManager.exportJSON(records);
  }

  public async importData(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    const res = this.importManager.validateAndParseImport(jsonString);
    if (!res.success) {
      this.emit({
        type: 'record.rejected',
        reason: res.error,
        timestamp: Date.now(),
      });
      return { success: false, count: 0, error: res.error };
    }

    for (const r of res.records) {
      await this.repository.saveRecord(r);
    }

    this.emit({
      type: 'record.loaded',
      timestamp: Date.now(),
    });

    return { success: true, count: res.records.length };
  }

  public getLastSyncTimestamp(): number {
    return this.lastSyncTimestamp;
  }

  public async getRecordCount(): Promise<number> {
    return this.repository.count();
  }
}
