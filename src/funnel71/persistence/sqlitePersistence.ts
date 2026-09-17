/**
 * 3D Memory Studio — Funnel 71
 * SQLite Disk Persistence Store
 *
 * Production-grade disk-backed persistence implementing StudioDataStore
 * using Node.js built-in node:sqlite (DatabaseSync) with zero external dependencies.
 */

const getBuiltin = (name: string): any => {
  try {
    const p = (globalThis as any).process;
    if (typeof p !== 'undefined' && typeof p.getBuiltinModule === 'function') {
      return p.getBuiltinModule(name);
    }
  } catch {}
  return null;
};

const fs: any = getBuiltin('fs');
const path: any = getBuiltin('path');
const sqliteModule: any = getBuiltin('node:sqlite');
const DatabaseSync: any = sqliteModule?.DatabaseSync ?? null;

import { StudioDataStore } from '../data/studioDataStore';
import { StudioRecord, DataQueryCriteria } from '../types';
import { StudioDataValidator } from '../data/studioDataValidator';
import { StudioDataSerializer } from '../data/studioDataSerializer';
import { StudioDataHydrator } from '../data/studioDataHydrator';
import { DataQueryManager } from '../query/dataQueryManager';

export class SQLiteDataStore implements StudioDataStore {
  private db: any = null;
  private readonly dbPath: string;
  private readonly validator: StudioDataValidator;
  private readonly serializer: StudioDataSerializer;
  private readonly hydrator: StudioDataHydrator;
  private readonly queryManager: DataQueryManager;
  private isInitialized = false;

  constructor(options?: {
    dbPath?: string;
    validator?: StudioDataValidator;
    serializer?: StudioDataSerializer;
    hydrator?: StudioDataHydrator;
    queryManager?: DataQueryManager;
  }) {
    const defaultDbPath = path ? path.resolve(process.cwd(), 'data', 'cubio_studio.db') : 'data/cubio_studio.db';
    this.dbPath = options?.dbPath ?? defaultDbPath;
    this.validator = options?.validator ?? new StudioDataValidator();
    this.serializer = options?.serializer ?? new StudioDataSerializer();
    this.hydrator = options?.hydrator ?? new StudioDataHydrator(this.validator);
    this.queryManager = options?.queryManager ?? new DataQueryManager();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(this.dbPath);

    this.db.exec('CREATE TABLE IF NOT EXISTS studio_schema_version (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);');
    this.db.exec('CREATE TABLE IF NOT EXISTS studio_records (id TEXT PRIMARY KEY, type TEXT NOT NULL, classification TEXT NOT NULL, dimension INTEGER NOT NULL, cluster_id TEXT, status TEXT NOT NULL, source TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, record_json TEXT NOT NULL);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_type ON studio_records(type);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_dim ON studio_records(dimension);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_class ON studio_records(classification);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_cluster ON studio_records(cluster_id);');

    const verCheck = this.db.prepare('SELECT version FROM studio_schema_version WHERE version = 1').get();
    if (!verCheck) {
      this.db.prepare('INSERT INTO studio_schema_version (version, applied_at) VALUES (1, ?)').run(Date.now());
    }

    this.isInitialized = true;
  }

  private ensureDb(): any {
    if (!this.db || !this.isInitialized) {
      this.initializeSync();
    }
    return this.db!;
  }

  private initializeSync(): void {
    if (!DatabaseSync || !fs || !path) {
      throw new Error('SQLiteDataStore requires Node.js runtime with node:sqlite.');
    }
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('CREATE TABLE IF NOT EXISTS studio_schema_version (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);');
    this.db.exec('CREATE TABLE IF NOT EXISTS studio_records (id TEXT PRIMARY KEY, type TEXT NOT NULL, classification TEXT NOT NULL, dimension INTEGER NOT NULL, cluster_id TEXT, status TEXT NOT NULL, source TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, record_json TEXT NOT NULL);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_type ON studio_records(type);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_dim ON studio_records(dimension);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_class ON studio_records(classification);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_records_cluster ON studio_records(cluster_id);');
    this.isInitialized = true;
  }

  public async get(id: string): Promise<StudioRecord | undefined> {
    const db = this.ensureDb();
    const row = db.prepare('SELECT record_json FROM studio_records WHERE id = ?').get(id) as { record_json?: string } | undefined;
    if (!row || !row.record_json) return undefined;
    return JSON.parse(row.record_json) as StudioRecord;
  }

  public async getAll(): Promise<readonly StudioRecord[]> {
    const db = this.ensureDb();
    const rows = db.prepare('SELECT record_json FROM studio_records ORDER BY created_at ASC').all() as Array<{ record_json: string }>;
    return rows.map(r => JSON.parse(r.record_json) as StudioRecord);
  }

  public async query(criteria: DataQueryCriteria): Promise<readonly StudioRecord[]> {
    const all = await this.getAll();
    return this.queryManager.executeQuery(all, criteria);
  }

  public async create(record: StudioRecord): Promise<StudioRecord> {
    const val = this.validator.validateRecord(record);
    if (!val.isValid) {
      throw new Error(`Record validation failed: ${val.reason} (${val.errorCode})`);
    }

    const db = this.ensureDb();
    const existing = db.prepare('SELECT id FROM studio_records WHERE id = ?').get(record.id);
    if (existing) {
      throw new Error(`Duplicate record ID: "${record.id}" already exists in store.`);
    }

    const recordJson = JSON.stringify(record);
    db.prepare('INSERT INTO studio_records (id, type, classification, dimension, cluster_id, status, source, created_at, updated_at, record_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      record.id,
      record.type,
      record.classification,
      record.dimension,
      record.clusterId ?? null,
      record.status,
      record.source ?? null,
      record.createdAt,
      record.updatedAt,
      recordJson
    );

    return record;
  }

  public async update(id: string, updates: Partial<StudioRecord>): Promise<StudioRecord> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Record not found: "${id}" does not exist in store.`);
    }

    const merged: StudioRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: Date.now(),
    };

    const val = this.validator.validateRecord(merged);
    if (!val.isValid) {
      throw new Error(`Record validation failed: ${val.reason} (${val.errorCode})`);
    }

    const db = this.ensureDb();
    const recordJson = JSON.stringify(merged);
    db.prepare('UPDATE studio_records SET type = ?, classification = ?, dimension = ?, cluster_id = ?, status = ?, source = ?, updated_at = ?, record_json = ? WHERE id = ?').run(
      merged.type,
      merged.classification,
      merged.dimension,
      merged.clusterId ?? null,
      merged.status,
      merged.source ?? null,
      merged.updatedAt,
      recordJson,
      id
    );

    return merged;
  }

  public async remove(id: string): Promise<boolean> {
    const db = this.ensureDb();
    const res = db.prepare('DELETE FROM studio_records WHERE id = ?').run(id);
    return res.changes > 0;
  }

  public async clear(): Promise<void> {
    const db = this.ensureDb();
    db.exec('DELETE FROM studio_records');
  }

  public async hydrate(data: unknown): Promise<number> {
    const result = this.hydrator.hydrate(data);
    const records = result.records;
    const db = this.ensureDb();
    let count = 0;
    for (const r of records) {
      const existing = db.prepare('SELECT id FROM studio_records WHERE id = ?').get(r.id);
      if (existing) {
        await this.update(r.id, r);
      } else {
        await this.create(r);
      }
      count++;
    }
    return count;
  }

  public async serialize(): Promise<string> {
    const all = await this.getAll();
    return this.serializer.serializeRecords(all);
  }

  public dispose(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {}
      this.db = null;
      this.isInitialized = false;
    }
  }

  public close(): void {
    this.dispose();
  }
}
