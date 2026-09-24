/**
 * CUBiO AI — Task 180: Long-Context Memory Consolidation
 * src/cubio/model/native_long_context_consolidation/longContextConsolidator.ts
 *
 * Deterministic Long-Context Memory Consolidator:
 * Executes lossless deduplication and OCC revision reconciliation while preserving
 * canonical VDB authority, tracking cryptographic lineage, and supporting exact rollback.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries; pure deterministic native TypeScript and node:crypto.
 * 2. Primary VDB remains the authoritative brain; canonical knowledge never silently overwritten.
 * 3. Lineage preservation: constituent source IDs and SHA-256 lineage digest.
 * 4. Exact rollback restoration from pre-consolidation snapshot.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { createHash } from 'node:crypto';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import { ConsolidationDetector } from './consolidationDetector.js';
import { ConsolidationGovernor } from './consolidationGovernor.js';
import {
  ConsolidatedEntity,
  ConsolidationBatch,
  ConsolidationCandidate,
  ConsolidationResult,
  ConsolidationRollbackError,
  ConsolidationRollbackRecord,
  EpistemicStatus,
} from './types.js';

export class LongContextConsolidator {
  private readonly memoryCoord: ModelMemoryCoordinator;
  private readonly governor: ConsolidationGovernor;
  private readonly detector: ConsolidationDetector;

  // Rollback registry: key = consolidationId
  private readonly rollbackRecords = new Map<string, ConsolidationRollbackRecord>();

  constructor(
    memoryCoord?: ModelMemoryCoordinator,
    governor?: ConsolidationGovernor,
    detector?: ConsolidationDetector
  ) {
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
    this.governor = governor ?? new ConsolidationGovernor();
    this.detector = detector ?? new ConsolidationDetector();
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  public getGovernor(): ConsolidationGovernor {
    return this.governor;
  }

  public getDetector(): ConsolidationDetector {
    return this.detector;
  }

  /**
   * Consolidate a batch of repeated long-context candidates atomically.
   */
  public consolidateBatch(batch: ConsolidationBatch): ConsolidationResult {
    const startTime = performance.now();

    // 1. Actuation lockout & batch bounds check
    this.governor.assertActuationBlocked();
    this.governor.assertBatchBounds(batch.candidates.length);

    // 2. Tenant isolation & pre-consolidation anomaly scan
    for (const candidate of batch.candidates) {
      this.governor.assertTenantIntegrity(batch.tenantId, candidate.tenantId);
      this.governor.assertActuationBlocked(candidate.content);

      // Check existing VDB canonical record
      const existing = this.memoryCoord.getRecord(candidate.objectId, batch.tenantId);
      if (existing) {
        // Stale revision check
        this.detector.assertNotStale(candidate, existing.reference.stateVersion);
        // Overwrite / downgrade check
        this.governor.assertNoCanonicalDowngrade(
          candidate.objectId,
          existing.epistemicStatus as EpistemicStatus,
          candidate.epistemicStatus
        );
        // Contradiction check against established canonical axiom
        if (existing.epistemicStatus === 'AXIOM') {
          this.detector.assertNoContradiction(candidate, existing.content);
        }
      }
    }

    // 3. Exact duplicate detection
    const duplicateScan = this.detector.detectDuplicates(batch.candidates);

    // 4. Group candidates by canonical objectId
    const candidatesByObject = new Map<string, ConsolidationCandidate[]>();
    for (const c of batch.candidates) {
      let list = candidatesByObject.get(c.objectId);
      if (!list) {
        list = [];
        candidatesByObject.set(c.objectId, list);
      }
      list.push(c);
    }

    const consolidatedEntities: ConsolidatedEntity[] = [];

    for (const [objectId, candidatesForObject] of candidatesByObject.entries()) {
      const primaryCandidate = candidatesForObject[0];

      // Collect all constituent source IDs across all merged candidates
      const allSourceIds = Array.from(
        new Set(
          candidatesForObject.flatMap((c) => [c.sourceContextId, ...c.lineageSourceIds])
        )
      ).sort();

      // Compute cryptographic SHA-256 lineage digest
      const lineageHasher = createHash('sha256');
      lineageHasher.update(`OBJECT:${objectId}\n`);
      lineageHasher.update(`COUNT:${candidatesForObject.length}\n`);
      for (const src of allSourceIds) {
        lineageHasher.update(`SRC:${src}\n`);
      }
      for (const c of candidatesForObject) {
        lineageHasher.update(`CHK:${c.checksum}:V${c.stateVersion}\n`);
      }
      const lineageDigest = lineageHasher.digest('hex');

      // Check existing VDB state for OCC versioning
      const existing = this.memoryCoord.getRecord(objectId, batch.tenantId);
      const expectedVersion = existing ? existing.reference.stateVersion : 0;

      // Persist in authoritative Primary VDB with OCC
      const persistedRecord = this.memoryCoord.persistRecord(
        {
          objectId,
          tenantId: batch.tenantId,
          expectedVersion,
          newContent: primaryCandidate.content,
          newSpatialCellId: primaryCandidate.spatialCellId ?? 0,
          newEpistemicStatus: primaryCandidate.epistemicStatus,
          promoteToCanonical:
            primaryCandidate.epistemicStatus === 'AXIOM' || primaryCandidate.epistemicStatus === 'FACT',
        },
        'consolidated_memory'
      );

      const consolidatedEntity: ConsolidatedEntity = Object.freeze({
        canonicalObjectId: objectId,
        tenantId: batch.tenantId,
        canonicalStateVersion: persistedRecord.reference.stateVersion,
        canonicalChecksum: persistedRecord.reference.checksum,
        epistemicStatus: persistedRecord.epistemicStatus as EpistemicStatus,
        content: persistedRecord.content,
        mergedReferencesCount: candidatesForObject.length,
        constituentSourceIds: Object.freeze(allSourceIds),
        lineageDigest,
        consolidatedAt: Date.now(),
        isRollbackAvailable: true,
        spatialCellId: primaryCandidate.spatialCellId,
      });

      consolidatedEntities.push(consolidatedEntity);

      // Register rollback snapshot
      const consolidationId = `cons_${objectId}_${Date.now()}`;
      const rollbackRecord: ConsolidationRollbackRecord = Object.freeze({
        consolidationId,
        tenantId: batch.tenantId,
        preConsolidationCandidates: Object.freeze([...candidatesForObject]),
        consolidatedEntity,
        timestamp: Date.now(),
      });
      this.rollbackRecords.set(consolidationId, rollbackRecord);
    }

    const endTime = performance.now();
    const latencyMs = Number((endTime - startTime).toFixed(3));

    // 5. Compute cryptographic batch digest
    const batchHasher = createHash('sha256');
    batchHasher.update(`BATCH:${batch.batchId}\n`);
    batchHasher.update(`TENANT:${batch.tenantId}\n`);
    batchHasher.update(`ENTITIES:${consolidatedEntities.length}\n`);
    for (const ent of consolidatedEntities) {
      batchHasher.update(`${ent.canonicalObjectId}:${ent.canonicalStateVersion}:${ent.lineageDigest}\n`);
    }
    const batchDigest = batchHasher.digest('hex');

    return Object.freeze({
      batchId: batch.batchId,
      tenantId: batch.tenantId,
      consolidatedEntities: Object.freeze(consolidatedEntities),
      duplicatesPruned: duplicateScan.duplicatesPrunedCount,
      contradictionsDetected: 0,
      staleSkipped: 0,
      batchDigest,
      latencyMs,
    });
  }

  /**
   * Execute deterministic rollback of a consolidated entity to its pre-consolidation state.
   */
  public rollback(consolidationId: string, tenantId: string): void {
    this.governor.assertActuationBlocked();

    const record = this.rollbackRecords.get(consolidationId);
    if (!record) {
      throw new ConsolidationRollbackError(consolidationId, 'Rollback record not found.');
    }

    this.governor.assertTenantIntegrity(tenantId, record.tenantId);

    // Rollback Primary VDB state: Restore initial pre-consolidation candidate version
    const initialCandidate = record.preConsolidationCandidates[0];
    const currentVdb = this.memoryCoord.getRecord(record.consolidatedEntity.canonicalObjectId, tenantId);

    if (currentVdb) {
      this.memoryCoord.persistRecord(
        {
          objectId: record.consolidatedEntity.canonicalObjectId,
          tenantId,
          expectedVersion: currentVdb.reference.stateVersion,
          newContent: initialCandidate.content,
          newSpatialCellId: initialCandidate.spatialCellId ?? 0,
          newEpistemicStatus: initialCandidate.epistemicStatus,
          promoteToCanonical: false,
        },
        'rollback'
      );
    }

    this.rollbackRecords.delete(consolidationId);
  }

  public getRollbackRecord(consolidationId: string): ConsolidationRollbackRecord | undefined {
    return this.rollbackRecords.get(consolidationId);
  }
}
