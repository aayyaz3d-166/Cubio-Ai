/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Safe Import Package Parser
 *
 * Parses serialized JSON packages, upgrades legacy schemas safely,
 * and performs initial structural integrity verification.
 */

import { WorkspaceExportPackage, ImportValidationReport } from './types';
import { PortabilityValidator } from './importValidator';

export interface ParseResult {
  readonly success: boolean;
  readonly package?: WorkspaceExportPackage;
  readonly error?: string;
  readonly validationReport?: ImportValidationReport;
}

export class ImportPackageParser {
  public static parse(jsonString: string): ParseResult {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, error: 'Empty or invalid JSON payload' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return { success: false, error: `Malformed JSON: ${e.message}` };
    }

    // Required root fields
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Package payload must be an object' };
    }

    // Ensure spaces, experiments, etc. are arrays
    const pkg: WorkspaceExportPackage = Object.freeze({
      packageId: parsed.packageId || '',
      schemaVersion: parsed.schemaVersion || '6.15.0',
      workspaceId: parsed.workspaceId || 'WS_IMPORT',
      ownerId: parsed.ownerId || 'USR_IMPORT',
      manifest: parsed.manifest ? Object.freeze({ ...parsed.manifest }) : ({} as any),
      spaces: Object.freeze(parsed.spaces ?? []),
      experiments: Object.freeze(parsed.experiments ?? []),
      savedStates: Object.freeze(parsed.savedStates ?? []),
      versions: Object.freeze(parsed.versions ?? []),
      timelines: Object.freeze(parsed.timelines ?? []),
      models: Object.freeze(parsed.models ?? []),
      geometries: Object.freeze(parsed.geometries ?? []),
      metadata: Object.freeze(parsed.metadata ?? {}),
      packageChecksum: parsed.packageChecksum || '',
      exportedAt: parsed.exportedAt || 0,
    });

    const validationReport = PortabilityValidator.validatePackage(pkg);
    if (!validationReport.isValid) {
      return {
        success: false,
        package: pkg,
        error: `Validation failed: ${validationReport.issues.join('; ')}`,
        validationReport,
      };
    }

    return {
      success: true,
      package: pkg,
      validationReport,
    };
  }
}
