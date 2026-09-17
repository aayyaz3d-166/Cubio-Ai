/**
 * 3D Memory Studio — Funnel 71
 * Persistent Studio Data Engine Types
 */

import { DataClassification } from '../funnel47/types';
import { SimulationDimension } from '../funnel52/types';

export type StudioRecordType = 'STATES' | 'RELATIONSHIPS' | 'CLUSTERS' | 'DIMENSIONS';

export type StudioRecordStatus = 'ACTIVE' | 'ARCHIVED' | 'RESTRICTED' | 'DRAFT';

export interface StudioRecord {
  readonly id: string;
  readonly type: StudioRecordType;
  readonly classification: DataClassification;
  readonly dimension: SimulationDimension;
  readonly position?: readonly [number, number, number];
  readonly relationships?: readonly string[];
  readonly clusterId?: string;
  readonly source?: string;
  readonly status: StudioRecordStatus;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface DataQueryCriteria {
  readonly type?: StudioRecordType;
  readonly classification?: DataClassification;
  readonly dimension?: SimulationDimension;
  readonly clusterId?: string;
  readonly status?: StudioRecordStatus;
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: keyof StudioRecord;
  readonly sortDirection?: 'ASC' | 'DESC';
}

export type PersistenceEventType =
  | 'record.created'
  | 'record.updated'
  | 'record.deleted'
  | 'record.loaded'
  | 'record.rejected'
  | 'record.blocked';

export interface PersistenceEvent {
  readonly type: PersistenceEventType;
  readonly recordId?: string;
  readonly record?: StudioRecord;
  readonly reason?: string;
  readonly timestamp: number;
}

export interface DataExportBundle {
  readonly schemaVersion: number;
  readonly exportedAt: number;
  readonly recordCount: number;
  readonly records: readonly StudioRecord[];
}

export interface DataValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly errorCode?: string;
}

export interface F71TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F71SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F71TestResult[];
}
