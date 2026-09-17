/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Controlled Sharing & Portable-State Layer — Type Definitions
 *
 * Formal contracts for Space Export, Import, Duplication/Cloning, Share Packages,
 * Read-Only Mode, Provenance, and Checksum Manifold.
 */

import { WorkspaceReality } from '../p61/types';
import { ModelScene3D } from '../p65/types';
import { AdvancedGeometryScene } from '../p66/types';
import { ParametricFeatureGraph } from '../p67/types';
import {
  PersonalSpace,
  ObserverConfigRecord,
  DimensionStateRecord,
  ViewStateRecord,
  SavedStateRecord,
  ExperimentRecord,
  SpaceMetadata,
} from '../p68/types';

export type ProvenanceOperation = 'CREATE' | 'DUPLICATE' | 'IMPORT' | 'CLONE';
export type ExportClassification = 'RESEARCH_EXPORT_READY' | 'RESEARCH_EXPORT_BLOCKED';

export interface ChecksumManifold {
  readonly realityChecksum: string;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly observerChecksum: string;
  readonly viewChecksum: string;
  readonly spaceChecksum: string;
  readonly exportChecksum: string;
}

export interface ProvenanceRecord {
  readonly provenanceId: string;
  readonly sourceSpaceId: string;
  readonly sourceChecksum: string;
  readonly sourceSchema: string;
  readonly sourceExportId: string | null;
  readonly sourceLineage: string | null;
  readonly operation: ProvenanceOperation;
  readonly timestamp: number;
}

export interface ExportManifest {
  readonly exportId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly schemaVersion: '6.9.0';
  readonly sourceChecksum: string;
  readonly exportChecksum: string;
  readonly classification: ExportClassification;
  readonly provenance: ProvenanceRecord;
  readonly objectCount: number;
  readonly observerCount: number;
  readonly savedStateCount: number;
  readonly exportedAt: number;
}

export interface ResearchExportPackage {
  readonly manifest: ExportManifest;
  readonly space: PersonalSpace;
  readonly checksumManifold: ChecksumManifold;
  readonly exportedSavedStates: readonly SavedStateRecord[];
  readonly exportedExperiments: readonly ExperimentRecord[];
}

export interface SharePackage {
  readonly sharePackageId: string;
  readonly exportId: string;
  readonly sourceSpaceId: string;
  readonly name: string;
  readonly schemaVersion: '6.9.0';
  readonly checksum: string;
  readonly isReadOnly: true;
  readonly payload: ResearchExportPackage;
  readonly createdAt: number;
}

export interface ImportValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'PACKAGE_VALID'
    | 'INVALID_SCHEMA'
    | 'MALFORMED_REALITY'
    | 'INVALID_OBSERVERS'
    | 'INVALID_GEOMETRY'
    | 'NON_FINITE_COORDINATES'
    | 'CHECKSUM_MISMATCH'
    | 'CORRUPTED_PAYLOAD'
    | 'CROSS_SPACE_VIOLATION';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface ImportResult {
  readonly success: boolean;
  readonly importedSpace: PersonalSpace | null;
  readonly provenance: ProvenanceRecord | null;
  readonly validationReport: ImportValidationReport;
}

export interface ReadonlyWorkspaceConfig {
  readonly space: PersonalSpace;
  readonly allowCameraNavigation: true;
  readonly allowInspection: true;
  readonly blockMutations: true;
}
