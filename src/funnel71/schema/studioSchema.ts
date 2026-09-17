/**
 * 3D Memory Studio — Funnel 71
 * Studio Schema Definitions & Hard Limits
 */

import { StudioRecordType, StudioRecordStatus } from '../types';
import { DataClassification } from '../../funnel47/types';
import { SimulationDimension } from '../../funnel52/types';

export const MAX_LOADED_RECORDS = 10000;
export const MAX_UI_RECORDS = 50;
export const MAX_RELATIONSHIPS_PER_RECORD = 100;
export const MAX_METADATA_KEYS = 50;
export const MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const VALID_RECORD_TYPES: ReadonlySet<StudioRecordType> = new Set([
  'STATES',
  'RELATIONSHIPS',
  'CLUSTERS',
  'DIMENSIONS',
]);

export const VALID_CLASSIFICATIONS: ReadonlySet<DataClassification> = new Set([
  'GREEN',
  'RED',
]);

export const VALID_RECORD_STATUSES: ReadonlySet<StudioRecordStatus> = new Set([
  'ACTIVE',
  'ARCHIVED',
  'RESTRICTED',
  'DRAFT',
]);

export const VALID_DIMENSIONS: ReadonlySet<SimulationDimension> = new Set([
  1, 2, 3, 4, 8, 12, 16,
]);
