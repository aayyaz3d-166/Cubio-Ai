/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Serialization & Backward Compatibility
 *
 * Schema: 6.15.0
 * Compatibility: 6.1.0 -> 6.14.0
 */

import { WorkspaceExportPackage } from './types';
import { ImportPackageParser } from './importParser';
import { deterministicHash } from './determinism';

export class PortabilitySerializationEngine {
  public static serialize(pkg: WorkspaceExportPackage): string {
    return JSON.stringify(pkg, null, 2);
  }

  public static deserialize(jsonString: string): {
    package?: WorkspaceExportPackage;
    status: 'OK' | 'INVALID_SCHEMA_VERSION' | 'CORRUPTED_JSON';
    error?: string;
  } {
    const result = ImportPackageParser.parse(jsonString);
    if (!result.success || !result.package) {
      if (result.validationReport?.status === 'INVALID_SCHEMA') {
        return { status: 'INVALID_SCHEMA_VERSION', error: result.error };
      }
      return { status: 'CORRUPTED_JSON', error: result.error };
    }

    return { package: result.package, status: 'OK' };
  }
}
