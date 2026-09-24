/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/knowledgeArchitectureCoordinator.ts
 *
 * Master Coordinator Facade for Native Knowledge Architecture.
 * Bridges persistent VDB knowledge with 343/369 spatial addressing,
 * state machine transitions, graph traversals, and .3dmemory streaming export.
 */

import * as crypto from 'crypto';
import {
  TASK_184_ID,
  IS_ACTUATION_BLOCKED,
  KnowledgeEntity,
  Concept,
  Relationship,
  Evidence,
  Provenance,
  KnowledgeFact,
  KnowledgeReferenceDescriptor,
  KnowledgeEpistemicStatus,
} from './types';
import { KnowledgeGovernor } from './knowledgeGovernor';
import { KnowledgeHasher } from './knowledgeHasher';
import { KnowledgeSpatialBridge } from './knowledgeSpatialBridge';
import { KnowledgeVdbStore } from './knowledgeVdbStore';
import { KnowledgeStateMachine } from './knowledgeStateMachine';
import { OutputGuard } from '../../inference/safety/outputGuard';

export interface KnowledgeSnapshot {
  readonly format: '.3dmemory';
  readonly tenantId: string;
  readonly entityCount: number;
  readonly factCount: number;
  readonly conceptCount: number;
  readonly relationshipCount: number;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
  readonly isPrimaryAuthority: false; // Explicit: .3dmemory is transport only
}

export class KnowledgeArchitectureCoordinator {
  private readonly store: KnowledgeVdbStore;
  private readonly stateMachine: KnowledgeStateMachine;

  constructor(store?: KnowledgeVdbStore) {
    KnowledgeGovernor.assertActuationBlocked();
    this.store = store ?? new KnowledgeVdbStore();
    this.stateMachine = new KnowledgeStateMachine(this.store);
  }

  public getStore(): KnowledgeVdbStore {
    return this.store;
  }

  public getStateMachine(): KnowledgeStateMachine {
    return this.stateMachine;
  }

  /**
   * Registers a canonical KnowledgeEntity with automatic 343/369 resolution.
   */
  public registerEntity(params: {
    entityId: string;
    name: string;
    category: string;
    address369: number;
    tenantId: string;
    epistemicStatus?: KnowledgeEpistemicStatus;
    properties?: Record<string, unknown>;
  }): KnowledgeEntity {
    return this.store.saveEntity(
      {
        entityId: params.entityId,
        name: params.name,
        category: params.category,
        address369: params.address369,
        tenantId: params.tenantId,
        epistemicStatus: params.epistemicStatus ?? 'FACT',
        properties: params.properties,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      0
    );
  }

  /**
   * Registers a semantic Concept.
   */
  public registerConcept(params: {
    conceptId: string;
    label: string;
    domain: string;
    definition: string;
    address369: number;
    tenantId: string;
    epistemicStatus?: KnowledgeEpistemicStatus;
    attributes?: Record<string, unknown>;
  }): Concept {
    return this.store.saveConcept(
      {
        conceptId: params.conceptId,
        label: params.label,
        domain: params.domain,
        definition: params.definition,
        address369: params.address369,
        tenantId: params.tenantId,
        epistemicStatus: params.epistemicStatus ?? 'FACT',
        attributes: params.attributes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      0
    );
  }

  /**
   * Ingests verified Evidence record.
   */
  public recordEvidence(params: {
    evidenceId: string;
    sourceType: Evidence['sourceType'];
    content: string;
    confidence: number;
    tenantId: string;
    epistemicStatus: KnowledgeEpistemicStatus;
    spatialCellId?: number;
    lineage?: readonly string[];
  }): Evidence {
    const rawCheck = KnowledgeHasher.computeEvidenceChecksum({
      evidenceId: params.evidenceId,
      sourceType: params.sourceType,
      content: params.content,
      confidence: params.confidence,
      epistemicStatus: params.epistemicStatus,
      tenantId: params.tenantId,
      spatialCellId: params.spatialCellId,
      lineage: params.lineage ?? [],
      timestamp: Date.now(),
    });

    const evidence: Evidence = {
      evidenceId: params.evidenceId,
      sourceType: params.sourceType,
      content: params.content,
      sourceChecksum: rawCheck,
      confidence: params.confidence,
      epistemicStatus: params.epistemicStatus,
      tenantId: params.tenantId,
      spatialCellId: params.spatialCellId,
      lineage: Object.freeze(params.lineage ?? []),
      timestamp: Date.now(),
    };

    return this.store.saveEvidence(evidence);
  }

  /**
   * Records formal Provenance for a derivation chain.
   */
  public recordProvenance(params: {
    provenanceId: string;
    targetId: string;
    rootSourceIds: readonly string[];
    derivationSteps: readonly { stepIndex: number; rule: string; inputIds: readonly string[]; outputChecksum: string }[];
    tenantId: string;
  }): Provenance {
    const compositeHash = KnowledgeHasher.computeProvenanceCompositeHash(
      params.targetId,
      params.rootSourceIds,
      params.derivationSteps,
      params.tenantId
    );

    const provenance: Provenance = {
      provenanceId: params.provenanceId,
      targetId: params.targetId,
      rootSourceIds: Object.freeze([...params.rootSourceIds]),
      derivationSteps: Object.freeze([...params.derivationSteps]),
      compositeHash,
      tenantId: params.tenantId,
      timestamp: Date.now(),
    };

    return this.store.saveProvenance(provenance);
  }

  /**
   * Asserts a grounded KnowledgeFact with confidence and evidence links.
   */
  public assertFact(params: {
    factId: string;
    subjectId: string;
    predicate: string;
    objectId: string;
    address369: number;
    tenantId: string;
    confidence?: number;
    epistemicStatus?: KnowledgeEpistemicStatus;
    evidenceIds?: readonly string[];
    provenanceId?: string;
  }): KnowledgeFact {
    return this.store.saveFact(
      {
        factId: params.factId,
        subjectId: params.subjectId,
        predicate: params.predicate,
        objectId: params.objectId,
        epistemicStatus: params.epistemicStatus ?? 'FACT',
        confidence: params.confidence ?? 0.85,
        address369: params.address369,
        tenantId: params.tenantId,
        evidenceIds: params.evidenceIds ?? [],
        provenanceId: params.provenanceId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      0
    );
  }

  /**
   * Links two entities or concepts via a semantic Relationship.
   */
  public linkEntities(params: {
    relationshipId: string;
    sourceId: string;
    targetId: string;
    relationType: Relationship['relationType'];
    tenantId: string;
    weight?: number;
    bidirectional?: boolean;
    epistemicStatus?: KnowledgeEpistemicStatus;
    evidenceIds?: readonly string[];
  }): Relationship {
    return this.store.saveRelationship(
      {
        relationshipId: params.relationshipId,
        sourceId: params.sourceId,
        targetId: params.targetId,
        relationType: params.relationType,
        weight: params.weight ?? 1.0,
        bidirectional: params.bidirectional ?? false,
        tenantId: params.tenantId,
        epistemicStatus: params.epistemicStatus ?? 'FACT',
        evidenceIds: params.evidenceIds ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      0
    );
  }

  /**
   * Performs multi-hop graph traversal to find connected knowledge nodes.
   */
  public traverseGraph(
    startNodeId: string,
    callerTenantId: string,
    maxHops: number = 3
  ): {
    nodes: readonly string[];
    relationships: readonly Relationship[];
  } {
    const visitedNodes = new Set<string>([startNodeId]);
    const collectedRelIds = new Set<string>();
    const collectedRels: Relationship[] = [];
    let currentLevel = new Set<string>([startNodeId]);

    for (let hop = 0; hop < maxHops; hop++) {
      if (currentLevel.size === 0) break;
      const nextLevel = new Set<string>();

      for (const nodeId of currentLevel) {
        const adjacent = this.store.getAdjacentRelationships(nodeId, callerTenantId);
        for (const rel of adjacent) {
          if (!collectedRelIds.has(rel.relationshipId)) {
            collectedRelIds.add(rel.relationshipId);
            collectedRels.push(rel);
          }
          const neighbor = rel.sourceId === nodeId ? rel.targetId : rel.sourceId;
          if (!visitedNodes.has(neighbor)) {
            visitedNodes.add(neighbor);
            nextLevel.add(neighbor);
          }
        }
      }
      currentLevel = nextLevel;
    }

    return {
      nodes: Object.freeze(Array.from(visitedNodes)),
      relationships: Object.freeze(collectedRels),
    };
  }

  /**
   * Exports an immutable streaming .3dmemory checkpoint snapshot.
   * Explicitly marked as transport format only, secondary to primary VDB.
   */
  public exportSnapshot(tenantId: string, timestamp?: number): KnowledgeSnapshot {
    const stats = this.store.getStats(tenantId);
    const ts = timestamp ?? 1000;
    const payload = JSON.stringify({
      tenantId,
      stats,
      format: '.3dmemory',
      timestamp: ts,
    });
    const snapshotChecksum = crypto.createHash('sha256').update(payload).digest('hex');

    return Object.freeze({
      format: '.3dmemory',
      tenantId,
      entityCount: stats.entityCount,
      factCount: stats.factCount,
      conceptCount: stats.conceptCount,
      relationshipCount: stats.relationshipCount,
      snapshotChecksum,
      timestamp: ts,
      isPrimaryAuthority: false,
    });
  }

  /**
   * Emits an advisory analytical statement screened by OutputGuard.
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
