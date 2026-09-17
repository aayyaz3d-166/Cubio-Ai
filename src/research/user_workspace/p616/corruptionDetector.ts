/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Corruption Detection Engine
 *
 * Scans packages and recovery points for numerical, geometric, topological,
 * structural, lineage, reference, or cryptographic checksum corruptions.
 */

import {
  BackupPackage,
  CorruptionReport,
  CorruptionType,
  RecoveryAccessContext,
} from './types';
import { deterministicHash } from './determinism';

const SUPPORTED_SCHEMAS = new Set([
  '6.1.0',
  '6.2.0',
  '6.3.0',
  '6.4.0',
  '6.5.0',
  '6.6.0',
  '6.7.0',
  '6.8.0',
  '6.9.0',
  '6.10.0',
  '6.11.0',
  '6.12.0',
  '6.13.0',
  '6.14.0',
  '6.15.0',
  '6.16.0',
]);

export class CorruptionDetector {
  public static detectCorruptions(
    pkg: BackupPackage,
    accessContext?: RecoveryAccessContext
  ): CorruptionReport {
    const corruptions: { type: CorruptionType; entityId?: string; message: string }[] = [];

    // 1. Schema check
    if (!pkg.schemaVersion || !SUPPORTED_SCHEMAS.has(pkg.schemaVersion)) {
      corruptions.push({
        type: 'SCHEMA_MISMATCH',
        message: `Unsupported or invalid schema version: ${pkg.schemaVersion}`,
      });
    }

    // 2. Duplicate entity detection
    const seenIds = new Set<string>();
    const checkDuplicate = (id: string, typeName: string) => {
      if (seenIds.has(id)) {
        corruptions.push({
          type: 'DUPLICATE_ENTITY',
          entityId: id,
          message: `Duplicate entity ID detected: ${id} (${typeName})`,
        });
      }
      seenIds.add(id);
    };

    pkg.spaces?.forEach((s) => checkDuplicate(s.spaceId, 'Space'));
    pkg.experiments?.forEach((e) => checkDuplicate(e.experimentId, 'Experiment'));
    pkg.savedStates?.forEach((st) => checkDuplicate(st.stateId, 'SavedState'));
    pkg.versions?.forEach((v) => checkDuplicate(v.versionId, 'Version'));
    pkg.models?.forEach((m) => checkDuplicate(m.modelId, 'Model'));
    pkg.geometries?.forEach((g) => checkDuplicate(g.geometryId, 'Geometry'));

    // 3. Geometry & Finite Numerical Checks
    pkg.geometries?.forEach((g) => {
      if (!g.coordinates || g.coordinates.length !== 3) {
        corruptions.push({
          type: 'INVALID_COORDINATE',
          entityId: g.geometryId,
          message: `Geometry ${g.geometryId} has invalid coordinate dimension (expected 3)`,
        });
      } else {
        const [x, y, z] = g.coordinates;
        if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
          corruptions.push({
            type: 'NAN_COORDINATE',
            entityId: g.geometryId,
            message: `Geometry ${g.geometryId} contains NaN coordinate: [${x}, ${y}, ${z}]`,
          });
        }
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          corruptions.push({
            type: 'INFINITY_COORDINATE',
            entityId: g.geometryId,
            message: `Geometry ${g.geometryId} contains non-finite/Infinity coordinate`,
          });
        }
      }

      if (!g.geometryChecksum || g.geometryChecksum.length < 4) {
        corruptions.push({
          type: 'INVALID_GEOMETRY',
          entityId: g.geometryId,
          message: `Geometry ${g.geometryId} has missing or corrupted checksum`,
        });
      }

      if (!g.lineageId || g.lineageId.length < 4) {
        corruptions.push({
          type: 'BROKEN_LINEAGE',
          entityId: g.geometryId,
          message: `Geometry ${g.geometryId} has broken or missing lineageId`,
        });
      }
    });

    // 4. Space Reference Integrity
    const spaceIds = new Set(pkg.spaces?.map((s) => s.spaceId) ?? []);
    pkg.experiments?.forEach((e) => {
      if (!spaceIds.has(e.spaceId)) {
        corruptions.push({
          type: 'BROKEN_REFERENCE',
          entityId: e.experimentId,
          message: `Experiment ${e.experimentId} references non-existent space ${e.spaceId}`,
        });
      }
    });

    // 5. Checksum Integrity
    if (pkg.manifest && (!pkg.manifest.manifestChecksum || pkg.manifest.manifestChecksum.length < 4)) {
      corruptions.push({
        type: 'CHECKSUM_MISMATCH',
        message: 'Manifest checksum is corrupted or missing',
      });
    }

    // 6. Access Authorization
    if (accessContext && accessContext.userRole === 'NO_ACCESS') {
      corruptions.push({
        type: 'UNAUTHORIZED_ACCESS',
        message: 'Context has NO_ACCESS permissions',
      });
    }

    const isCorrupted = corruptions.length > 0;
    const raw = JSON.stringify([pkg.backupId, isCorrupted, corruptions]);
    const reportChecksum = deterministicHash(raw);

    return Object.freeze({
      isCorrupted,
      corruptions: Object.freeze(corruptions),
      reportChecksum,
    });
  }
}
