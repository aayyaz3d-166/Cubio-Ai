/**
 * CUBiO AI — PMA Task 395: Read-Only VDB Adapter
 * 
 * Implements the approved read-only adapter defined in Task 394.
 * Enables controlled Phase 25 access to canonical VDB data without mutating sovereign assets.
 * Enforces readOnly SQLite connection, query validation, and fail-closed traps.
 */

import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import { Phase26IntegrationArchitectureSpec } from './phase26IntegrationSpec';
import { PackedStateAddressFields } from './compactStateAddressing';

export interface CanonicalVdbRecord {
  id: string;
  type: string;
  classification: string;
  dimension: number;
  cluster_id?: string;
  status: string;
  source: string;
  record_json?: string;
}

export class Phase26VdbReadOnlyAdapter {
  private dbPath: string;

  constructor(dbPath = "data/cubio_studio.db") {
    this.dbPath = path.resolve(dbPath);
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`FAIL_CLOSED_VIOLATION: Canonical VDB file not found at ${this.dbPath}`);
    }
  }

  /** Opens a strictly read-only DatabaseSync handle */
  private openReadOnlyConnection(): DatabaseSync {
    return new DatabaseSync(this.dbPath, { readOnly: true });
  }

  /** Validates query safety before execution */
  private assertQueryPermitted(sql: string): void {
    const check = Phase26IntegrationArchitectureSpec.validateQuerySafety(sql);
    if (!check.isPermitted) {
      throw new Error(`FAIL_CLOSED_VIOLATION: ${check.violationReason}`);
    }
  }

  /** Retrieves total count of records in canonical VDB */
  public getTotalRecordCount(): number {
    const sql = "SELECT count(*) as total FROM studio_records";
    this.assertQueryPermitted(sql);

    const db = this.openReadOnlyConnection();
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get() as { total: number };
      return row ? Number(row.total) : 0;
    } finally {
      db.close();
    }
  }

  /** Retrieves record by primary key id */
  public getRecordById(id: string): CanonicalVdbRecord | null {
    const sql = "SELECT id, type, classification, dimension, cluster_id, status, source, record_json FROM studio_records WHERE id = ?";
    this.assertQueryPermitted(sql);

    const db = this.openReadOnlyConnection();
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(id) as CanonicalVdbRecord | undefined;
      return row || null;
    } finally {
      db.close();
    }
  }

  /** Retrieves a bounded batch of records (max 100) */
  public getRecords(limit = 100): CanonicalVdbRecord[] {
    const boundedLimit = Math.min(limit, Phase26IntegrationArchitectureSpec.BRIDGE_CONTRACT.maxQueryBatchSize);
    const sql = "SELECT id, type, classification, dimension, status, source, record_json FROM studio_records LIMIT ?";
    this.assertQueryPermitted(sql);

    const db = this.openReadOnlyConnection();
    try {
      const stmt = db.prepare(sql);
      return stmt.all(boundedLimit) as CanonicalVdbRecord[];
    } finally {
      db.close();
    }
  }

  /** Translates canonical cellId into a procedural PackedStateAddressFields recipe */
  public mapCellIdToPackedAddress(cellId: number): PackedStateAddressFields {
    if (!Phase26IntegrationArchitectureSpec.validateCellBounds(cellId)) {
      throw new Error(`FAIL_CLOSED_VIOLATION: cell_id ${cellId} out of bounds [0..342]`);
    }

    return {
      rootBaseIndex: (cellId % 100) + 1,
      polarity: cellId % 2 === 0 ? 0 : 1,
      scaleLevel: ((cellId % 3) + 1) as 1 | 2 | 3,
      level: 1,
      relationCode: 0,
      operatorCode: 0,
      partnerBaseIndex: 0,
      quantizedParameter: cellId % 256,
      checksumTag: (cellId * 17) % 256,
    };
  }

  /** Explicit fail-closed trap against attempted raw SQL mutations */
  public executeUnsafeRawQuery(sql: string): never {
    this.assertQueryPermitted(sql);
    throw new Error("FAIL_CLOSED_VIOLATION: Raw query execution disabled on read-only adapter");
  }
}
