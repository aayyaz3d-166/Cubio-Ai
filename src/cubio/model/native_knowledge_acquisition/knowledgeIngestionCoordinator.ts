/**
 * CUBiO AI — Task 185: Native Knowledge Acquisition & Ingestion Pipeline
 * src/cubio/model/native_knowledge_acquisition/knowledgeIngestionCoordinator.ts
 *
 * Master Ingestion Coordinator Facade:
 * Orchestrates raw document acquisition -> candidate extraction -> validation ->
 * authoritative VDB registration with full provenance tracking and cryptographic receipts.
 */

import * as crypto from 'crypto';
import {
  TASK_185_ID,
  IS_ACTUATION_BLOCKED,
  RawKnowledgeDocument,
  ExtractionConfig,
  IngestionBatchReceipt,
  IngestionActuationBlockedError,
} from './types';
import { CandidateExtractor } from './candidateExtractor';
import { CandidateValidator } from './candidateValidator';
import { BoundedIngestionStream } from './boundedIngestionStream';
import { KnowledgeArchitectureCoordinator } from '../native_knowledge_architecture/knowledgeArchitectureCoordinator';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { OutputGuard } from '../../inference/safety/outputGuard';

export class KnowledgeIngestionCoordinator {
  private readonly knowledgeCoord: KnowledgeArchitectureCoordinator;
  private readonly stream: BoundedIngestionStream;

  constructor(knowledgeCoord?: KnowledgeArchitectureCoordinator) {
    KnowledgeGovernor.assertActuationBlocked();
    this.knowledgeCoord = knowledgeCoord ?? new KnowledgeArchitectureCoordinator();
    this.stream = new BoundedIngestionStream();
  }

  public getKnowledgeCoordinator(): KnowledgeArchitectureCoordinator {
    return this.knowledgeCoord;
  }

  public getStream(): BoundedIngestionStream {
    return this.stream;
  }

  /**
   * Primary ingestion pipeline:
   * Ingests a raw document, extracts candidates, validates them, and registers
   * valid knowledge into the authoritative primary VDB with complete provenance.
   */
  public ingestDocument(
    doc: RawKnowledgeDocument,
    config?: ExtractionConfig
  ): IngestionBatchReceipt {
    const startTime = Date.now();

    // 1. Actuation Lockout & Checksum validation
    KnowledgeGovernor.assertActuationBlocked(doc.content);
    const computedDocHash = crypto.createHash('sha256').update(doc.content, 'utf8').digest('hex');
    if (doc.checksum !== computedDocHash) {
      throw new Error(`[KnowledgeIngestionCoordinator] Raw document checksum mismatch: expected ${doc.checksum}, computed ${computedDocHash}`);
    }

    // 2. Extract Candidates
    const extracted = CandidateExtractor.extractCandidates(doc, config);

    let entitiesRegistered = 0;
    let factsRegistered = 0;
    let conceptsRegistered = 0;
    let evidencesRegistered = 0;

    const registeredEvidenceIds: string[] = [];

    // 3. Register Evidences first so facts can cite them
    for (const eviCandidate of extracted.evidences) {
      const verdict = CandidateValidator.validateEvidence(eviCandidate, doc);
      if (verdict.isValid) {
        const recorded = this.knowledgeCoord.recordEvidence({
          evidenceId: eviCandidate.candidateId,
          sourceType: eviCandidate.sourceType,
          content: eviCandidate.content,
          confidence: verdict.adjustedConfidence,
          tenantId: doc.tenantId,
          epistemicStatus: verdict.assignedEpistemicStatus,
          spatialCellId: eviCandidate.spatialCellId,
          lineage: [doc.documentId],
        });
        registeredEvidenceIds.push(recorded.evidenceId);
        evidencesRegistered++;
      }
    }

    // 4. Register Concepts
    for (const conCandidate of extracted.concepts) {
      const verdict = CandidateValidator.validateConcept(conCandidate, doc, config?.minConfidenceThreshold);
      if (verdict.isValid) {
        this.knowledgeCoord.registerConcept({
          conceptId: conCandidate.candidateId,
          label: conCandidate.label,
          domain: conCandidate.domain,
          definition: conCandidate.definition,
          address369: conCandidate.address369,
          tenantId: doc.tenantId,
          epistemicStatus: verdict.assignedEpistemicStatus,
        });
        conceptsRegistered++;
      }
    }

    // 5. Register Entities
    for (const entCandidate of extracted.entities) {
      const verdict = CandidateValidator.validateEntity(entCandidate, doc, config?.minConfidenceThreshold);
      if (verdict.isValid) {
        this.knowledgeCoord.registerEntity({
          entityId: entCandidate.candidateId,
          name: entCandidate.name,
          category: entCandidate.category,
          address369: entCandidate.address369,
          tenantId: doc.tenantId,
          epistemicStatus: verdict.assignedEpistemicStatus,
          properties: entCandidate.properties ? { ...entCandidate.properties } : undefined,
        });
        entitiesRegistered++;
      }
    }

    // 6. Register Facts with Provenance
    for (const factCandidate of extracted.facts) {
      const verdict = CandidateValidator.validateFact(factCandidate, doc, config?.minConfidenceThreshold);
      if (verdict.isValid) {
        // Build provenance record for the extracted fact
        const provenance = this.knowledgeCoord.recordProvenance({
          provenanceId: `prov_${factCandidate.candidateId}`,
          targetId: factCandidate.candidateId,
          rootSourceIds: [doc.documentId],
          derivationSteps: [
            {
              stepIndex: 1,
              rule: 'DETERMINISTIC_EXTRACTION_INGESTION',
              inputIds: [doc.documentId],
              outputChecksum: computedDocHash,
            },
          ],
          tenantId: doc.tenantId,
        });

        this.knowledgeCoord.assertFact({
          factId: factCandidate.candidateId,
          subjectId: factCandidate.subject,
          predicate: factCandidate.predicate,
          objectId: factCandidate.object,
          address369: factCandidate.address369,
          tenantId: doc.tenantId,
          confidence: verdict.adjustedConfidence,
          epistemicStatus: verdict.assignedEpistemicStatus,
          evidenceIds: registeredEvidenceIds,
          provenanceId: provenance.provenanceId,
        });
        factsRegistered++;
      }
    }

    // 7. Generate Sealed Receipt
    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const batchId = `batch_${doc.documentId}`;
    const batchPayload = JSON.stringify({
      docId: doc.documentId,
      tenantId: doc.tenantId,
      sourceChecksum: doc.checksum,
      entitiesRegistered,
      factsRegistered,
      conceptsRegistered,
      evidencesRegistered,
    });
    const batchHash = crypto.createHash('sha256').update(batchPayload).digest('hex');

    return Object.freeze({
      batchId,
      tenantId: doc.tenantId,
      documentId: doc.documentId,
      sourceChecksum: doc.checksum,
      entitiesRegistered,
      factsRegistered,
      conceptsRegistered,
      evidencesRegistered,
      batchHash,
      timestamp: Date.now(),
      executionTimeMs,
    });
  }

  /**
   * Ingests a streaming batch from the bounded stream.
   */
  public ingestStreamBatch(
    tenantId: string,
    batchSize: number = 10,
    config?: ExtractionConfig
  ): readonly IngestionBatchReceipt[] {
    const batch = this.stream.pullBatch(batchSize);
    const receipts: IngestionBatchReceipt[] = [];

    for (const doc of batch) {
      if (doc.tenantId !== tenantId) {
        throw new Error(`[KnowledgeIngestionCoordinator] Tenant mismatch in stream: ${doc.tenantId} !== ${tenantId}`);
      }
      receipts.push(this.ingestDocument(doc, config));
    }

    return Object.freeze(receipts);
  }

  /**
   * Emits an analytical advisory statement screened by OutputGuard.
   */
  public emitAdvisory(text: string): { isSafe: boolean; advisory: string } {
    const verdict = OutputGuard.validateOutput(text);
    if (!verdict.isSafe) {
      return {
        isSafe: false,
        advisory: verdict.sanitizedText,
      };
    }
    return {
      isSafe: true,
      advisory: `ADVISORY: ${verdict.sanitizedText}`,
    };
  }
}
