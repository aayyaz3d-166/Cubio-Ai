/**
 * 3D Memory Studio — Funnel 67
 * Actual Database & Information UI Engine Types
 */

import { DataClassification } from '../funnel47/types';
import { SimulationDimension } from '../funnel52/types';

export type CollectionType = 'STATES' | 'RELATIONSHIPS' | 'CLUSTERS' | 'DIMENSIONS';

export type DatabaseFilterType =
  | 'ALL'
  | 'STATE'
  | 'RELATIONSHIP'
  | 'CLUSTER'
  | 'DIMENSION'
  | 'GREEN'
  | 'ACTIVE'
  | 'Z3'
  | 'Z4'
  | 'Z8'
  | 'Z12'
  | 'Z16';

export type DatabaseSortField = 'ID' | 'TYPE' | 'DIMENSION' | 'STATUS';
export type SortDirection = 'ASC' | 'DESC';

export interface DatabaseRecord {
  readonly id: string;
  readonly type: string;
  readonly classification: DataClassification;
  readonly dimension: SimulationDimension;
  readonly status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  readonly source?: string;
  readonly coordinates?: readonly [number, number, number];
  readonly clusterId?: string;
  readonly relationshipCount?: number;
  readonly label?: string;
}

export interface CollectionSummary {
  readonly type: CollectionType;
  readonly label: string;
  readonly count: number;
}

export interface DatabaseViewSnapshot {
  readonly selectedCollection: CollectionType;
  readonly filter: DatabaseFilterType;
  readonly sortField: DatabaseSortField;
  readonly sortDirection: SortDirection;
  readonly visibleRecords: readonly DatabaseRecord[];
  readonly totalMatchingCount: number;
  readonly selectedRecordId: string | null;
  readonly timestamp: number;
}

export interface InformationObjectSnapshot {
  readonly id: string;
  readonly type: string;
  readonly classification: DataClassification;
  readonly dimension: SimulationDimension;
  readonly dimensionModeLabel: string;
  readonly position: readonly [number, number, number];
  readonly relationships: readonly { readonly id: string; readonly type: string; readonly targetId: string }[];
  readonly clusterId?: string;
  readonly source?: string;
  readonly status: string;
  readonly timestamp: number;
}

export interface F67TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F67SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F67TestResult[];
}
