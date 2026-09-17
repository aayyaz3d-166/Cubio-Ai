/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Provenance Engine
 *
 * Tracks provenance lineage and operations across spaces, clones, and imports.
 */

import { ProvenanceRecord, ProvenanceOperation } from './types';
import { generateDeterministicProvenanceId } from './determinism';

export class ProvenanceEngine {
  private static provCounter = 0;

  public static createRecord(
    sourceSpaceId: string,
    sourceChecksum: string,
    operation: ProvenanceOperation,
    sourceSchema = '6.9.0',
    sourceExportId: string | null = null,
    sourceLineage: string | null = null
  ): ProvenanceRecord {
    this.provCounter++;
    const provenanceId = generateDeterministicProvenanceId(sourceSpaceId, this.provCounter);

    return Object.freeze({
      provenanceId,
      sourceSpaceId,
      sourceChecksum,
      sourceSchema,
      sourceExportId,
      sourceLineage,
      operation,
      timestamp: 0,
    });
  }
}
