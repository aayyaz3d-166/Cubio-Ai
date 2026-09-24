/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F104: Evolutionary Learning & Memory Engine
 *
 * Ingests project lifecycles, solution patterns, failure post-mortems,
 * and user-approved knowledge grants into an immutable Merkle memory space.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  EvolutionaryMemoryRecord,
  FailurePostmortemIngestRequest,
  IEvolutionaryMemoryEngine,
  MemoryConsolidationReport,
  EvolutionaryMemoryQueryFilter,
  SolutionPatternIngestRequest,
  UserApprovedKnowledgeIngestRequest,
} from './types';
import { EvolutionaryMemoryStore } from './memoryStore';

export class CubiOEvolutionaryLearningEngine implements IEvolutionaryMemoryEngine {
  private store = new EvolutionaryMemoryStore();

  public async recordEpisodicRun(
    projectId: string,
    domain: string,
    task: string,
    outcome: unknown,
    success: boolean
  ): Promise<EvolutionaryMemoryRecord> {
    const memoryId = `EPISODE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    const record: EvolutionaryMemoryRecord = {
      memoryId,
      entryType: 'EPISODIC_EXPERIENCE',
      title: `Episodic Run: ${task.slice(0, 40)}`,
      domain,
      keywords: Object.freeze(task.toLowerCase().split(/\s+/).filter((w) => w.length > 3)),
      payload: Object.freeze({ projectId, task, outcome }),
      resonanceScore: success ? 0.8 : 0.4,
      accessCount: 1,
      successRate: success ? 1.0 : 0.0,
      sourceProjectId: projectId,
      verifiedByOperator: false,
      createdAt: now,
      lastAccessedAt: now,
      recordChecksum: deterministicHash(`${memoryId}:${projectId}:${domain}:${success}`),
    };

    this.store.saveRecord(record);
    return record;
  }

  public async ingestSolutionPattern(request: SolutionPatternIngestRequest): Promise<EvolutionaryMemoryRecord> {
    const memoryId = `PATTERN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    const record: EvolutionaryMemoryRecord = {
      memoryId,
      entryType: 'SOLUTION_PATTERN',
      title: request.title,
      domain: request.domain,
      keywords: Object.freeze([...request.keywords, 'solution', 'pattern', request.domain.toLowerCase()]),
      payload: Object.freeze({
        solutionCodeOrOutput: request.solutionCodeOrOutput,
        confidenceScore: request.confidenceScore,
      }),
      resonanceScore: 0.95,
      accessCount: 1,
      successRate: 1.0,
      sourceProjectId: request.sourceProjectId,
      verifiedByOperator: true,
      createdAt: now,
      lastAccessedAt: now,
      recordChecksum: deterministicHash(`${memoryId}:${request.domain}:${request.title}`),
    };

    this.store.saveRecord(record);
    return record;
  }

  public async ingestFailurePostmortem(request: FailurePostmortemIngestRequest): Promise<EvolutionaryMemoryRecord> {
    const memoryId = `POSTMORTEM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    const record: EvolutionaryMemoryRecord = {
      memoryId,
      entryType: 'FAILURE_POSTMORTEM',
      title: `Postmortem: ${request.title}`,
      domain: request.domain,
      keywords: Object.freeze([...request.keywords, 'postmortem', 'error', 'remediation', 'fix']),
      payload: Object.freeze({
        errorSignature: request.errorSignature,
        rootCause: request.rootCause,
        remediationPatch: request.remediationPatch,
      }),
      resonanceScore: 0.9,
      accessCount: 1,
      successRate: 1.0,
      sourceProjectId: request.sourceProjectId,
      verifiedByOperator: true,
      createdAt: now,
      lastAccessedAt: now,
      recordChecksum: deterministicHash(`${memoryId}:${request.errorSignature}:${request.rootCause}`),
    };

    this.store.saveRecord(record);
    return record;
  }

  public async ingestUserApprovedKnowledge(
    request: UserApprovedKnowledgeIngestRequest
  ): Promise<EvolutionaryMemoryRecord> {
    const memoryId = `GRANT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    const record: EvolutionaryMemoryRecord = {
      memoryId,
      entryType: 'USER_APPROVED_KNOWLEDGE',
      title: request.title,
      domain: request.domain,
      keywords: Object.freeze([...request.keywords, 'user_approved', 'governance', 'policy']),
      payload: Object.freeze({
        ruleOrFact: request.ruleOrFact,
        operatorIdentity: request.operatorIdentity,
        governanceScope: request.governanceScope,
      }),
      resonanceScore: 1.0,
      accessCount: 1,
      successRate: 1.0,
      verifiedByOperator: true,
      createdAt: now,
      lastAccessedAt: now,
      recordChecksum: deterministicHash(`${memoryId}:${request.operatorIdentity}:${request.ruleOrFact}`),
    };

    this.store.saveRecord(record);
    return record;
  }

  public async queryMemory(filter: EvolutionaryMemoryQueryFilter): Promise<readonly EvolutionaryMemoryRecord[]> {
    return this.store.query(filter);
  }

  public async consolidateAndDistillMemory(): Promise<MemoryConsolidationReport> {
    const reportId = `CONSOLIDATE_${Date.now()}`;
    const allRecords = this.store.getAllRecords();

    const solutionPatterns = allRecords.filter((r) => r.entryType === 'SOLUTION_PATTERN');

    // Distill top patterns into Consolidated Heuristics
    if (solutionPatterns.length > 0) {
      const topPattern = solutionPatterns[0];
      const heuristicId = `HEURISTIC_${Date.now()}`;
      const heuristicRecord: EvolutionaryMemoryRecord = {
        memoryId: heuristicId,
        entryType: 'CONSOLIDATED_HEURISTIC',
        title: `Distilled Heuristic: ${topPattern.title}`,
        domain: topPattern.domain,
        keywords: Object.freeze(['heuristic', 'distilled', ...topPattern.keywords]),
        payload: Object.freeze({
          derivedFromPatternId: topPattern.memoryId,
          corePrinciple: `Proven reliable solution in domain ${topPattern.domain}`,
        }),
        resonanceScore: 0.98,
        accessCount: 1,
        successRate: 1.0,
        verifiedByOperator: true,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        recordChecksum: deterministicHash(`${heuristicId}:${topPattern.memoryId}`),
      };
      this.store.saveRecord(heuristicRecord);
    }

    const updatedRecords = this.store.getAllRecords();
    const episodicCount = updatedRecords.filter((r) => r.entryType === 'EPISODIC_EXPERIENCE').length;
    const solutionPatternsCount = updatedRecords.filter((r) => r.entryType === 'SOLUTION_PATTERN').length;
    const failurePostmortemsCount = updatedRecords.filter((r) => r.entryType === 'FAILURE_POSTMORTEM').length;
    const userApprovedCount = updatedRecords.filter((r) => r.entryType === 'USER_APPROVED_KNOWLEDGE').length;
    const consolidatedHeuristicsCount = updatedRecords.filter(
      (r) => r.entryType === 'CONSOLIDATED_HEURISTIC'
    ).length;

    const avgResonance =
      updatedRecords.reduce((acc, r) => acc + r.resonanceScore, 0) / (updatedRecords.length || 1);

    const merkleRootHash = this.store.computeMerkleRootHash();

    return Object.freeze({
      reportId,
      totalRecordsInMemory: updatedRecords.length,
      episodicCount,
      solutionPatternsCount,
      failurePostmortemsCount,
      userApprovedCount,
      consolidatedHeuristicsCount,
      averageResonanceScore: parseFloat(avgResonance.toFixed(3)),
      merkleRootHash,
      timestamp: Date.now(),
    });
  }
}
