/**
 * CUBiO AI — Task 175: Context Compression & Summarization
 * src/cubio/model/native_compression/compressionCoordinator.ts
 *
 * Master Facade for Context Compression & Summarization:
 * Orchestrates native compression modes, anti-fabrication verification,
 * reference-preserving VDB integration, and multi-tenant isolation.
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  CompressionMode,
  SourceReference,
  CompressedRepresentation,
  CompressionConfig,
  CompressionTenantViolationError,
} from './types.js';
import { NativeCompressor } from './nativeCompressor.js';
import { AntiFabricationVerifier } from './antiFabricationVerifier.js';
import { CompressionGovernor } from './compressionGovernor.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';

export class CompressionCoordinator {
  private readonly memoryCoord: ModelMemoryCoordinator;
  // tenantId -> summaryId -> CompressedRepresentation
  private readonly summariesByTenant = new Map<string, Map<string, CompressedRepresentation>>();

  constructor(memoryCoord?: ModelMemoryCoordinator) {
    CompressionGovernor.assertActuationLockout();
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  private getTenantMap(tenantId: string): Map<string, CompressedRepresentation> {
    if (!this.summariesByTenant.has(tenantId)) {
      this.summariesByTenant.set(tenantId, new Map());
    }
    return this.summariesByTenant.get(tenantId)!;
  }

  /**
   * Compresses a raw text context stream or collection of source chunks,
   * enforces anti-fabrication verification, and links with Primary VDB.
   */
  public compressContext(params: {
    tenantId: string;
    sourceText: string;
    sourceReferences: readonly SourceReference[];
    sourceDocId?: string;
    config?: Partial<CompressionConfig>;
    spatialCellId?: number;
    epistemicStatus?: string;
    persistInVDB?: boolean;
  }): CompressedRepresentation {
    CompressionGovernor.assertActuationLockout(params.sourceText);

    if (params.config?.targetRatio !== undefined) {
      CompressionGovernor.assertValidRatio(params.config.targetRatio);
    }

    // 1. Generate native compressed representation
    const compressed = NativeCompressor.compress(params);

    // 2. Register in multi-tenant in-memory registry
    const tenantMap = this.getTenantMap(params.tenantId);
    tenantMap.set(compressed.summaryId, compressed);

    // 3. Persist summary in Primary VDB if requested (WITHOUT replacing canonical facts)
    if (params.persistInVDB !== false) {
      const summaryObjectId = `summary_${compressed.summaryId}`;
      const existing = this.memoryCoord.getRecord(summaryObjectId, params.tenantId);
      const expectedVersion = existing ? existing.reference.stateVersion : 0;
      this.memoryCoord.persistRecord(
        {
          objectId: summaryObjectId,
          tenantId: params.tenantId,
          expectedVersion,
          newContent: compressed.summaryText,
          newSpatialCellId: params.spatialCellId,
          newEpistemicStatus: 'DERIVED',
          promoteToCanonical: false, // Summaries are DERIVED, not promoted to overwrite axioms
        },
        'context_compression_summary'
      );
    }

    return compressed;
  }

  /**
   * Retrieves a compressed representation by summaryId.
   */
  public getSummary(summaryId: string, callerTenantId: string): CompressedRepresentation | null {
    for (const [ownerTenant, tenantMap] of this.summariesByTenant.entries()) {
      if (tenantMap.has(summaryId)) {
        if (ownerTenant !== callerTenantId) {
          throw new CompressionTenantViolationError(callerTenantId, ownerTenant);
        }
        return tenantMap.get(summaryId)!;
      }
    }
    return null;
  }

  /**
   * Retrieves all summaries stored for a tenant.
   */
  public getSummariesForTenant(callerTenantId: string): readonly CompressedRepresentation[] {
    const tenantMap = this.getTenantMap(callerTenantId);
    return Array.from(tenantMap.values());
  }

  /**
   * Resolves underlying full uncompressed content from Primary VDB for a source reference.
   */
  public resolveSourceRecord(
    reference: SourceReference,
    callerTenantId: string
  ): { objectId: string; content: string; checksum: string } {
    const record = this.memoryCoord.getRecord(reference.objectId, callerTenantId);
    if (!record) {
      throw new Error(`Underlying source record "${reference.objectId}" not found in Primary VDB.`);
    }

    // Check integrity
    const computed = crypto.createHash('sha256').update(record.content).digest('hex');
    if (computed !== reference.checksum) {
      throw new Error(`Checksum mismatch on source record "${reference.objectId}". Content modified.`);
    }

    return {
      objectId: record.reference.objectId,
      content: record.content,
      checksum: computed,
    };
  }

  /**
   * Clears in-memory summaries (for testing).
   */
  public clear(callerTenantId?: string): void {
    if (callerTenantId) {
      this.summariesByTenant.delete(callerTenantId);
    } else {
      this.summariesByTenant.clear();
    }
  }
}
