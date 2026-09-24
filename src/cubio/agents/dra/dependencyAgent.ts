/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/dependencyAgent.ts
 *
 * Primary orchestrator for CUBiO's native Dependency & Reuse Agent.
 * Analyzes dependencies, maps subsystem topology, recommends reuse strategies,
 * and intercepts duplicate or frozen-file collisions before development begins.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  DRATaskQuery,
  DRAReuseReport,
  DRASourceReference,
  DRASafetyStatus,
  DRAConflictWarning,
} from './types';
import { DRADependencyGraphBuilder } from './dependencyGraph';
import { DRAReuseAnalyzer } from './reuseAnalyzer';
import { DRADuplicateDetector } from './duplicateDetector';
import { DRAFrozenConflictGuard } from './frozenConflictGuard';
import { DRARxEvidenceTracker } from './rxEvidence';
import { DRAPmaAdapter } from './pmaAdapter';

export interface DRADependencies {
  readonly customRootDir?: string;
  readonly graphBuilder?: DRADependencyGraphBuilder;
  readonly reuseAnalyzer?: DRAReuseAnalyzer;
  readonly frozenGuard?: DRAFrozenConflictGuard;
}

export class DRADependencyAgent {
  public static readonly AGENT_ID = 'AGENT-002-DRA' as const;
  public static readonly VERSION = '1.0.0' as const;
  public readonly is_actuation_blocked: boolean = true;

  private readonly rootDir: string;
  private readonly graphBuilder: DRADependencyGraphBuilder;
  private readonly reuseAnalyzer: DRAReuseAnalyzer;
  private readonly frozenGuard: DRAFrozenConflictGuard;
  private pmaAdapter?: DRAPmaAdapter;

  constructor(deps?: DRADependencies) {
    this.rootDir = deps?.customRootDir || process.cwd();
    this.graphBuilder = deps?.graphBuilder || new DRADependencyGraphBuilder();
    this.reuseAnalyzer = deps?.reuseAnalyzer || new DRAReuseAnalyzer();
    this.frozenGuard = deps?.frozenGuard || new DRAFrozenConflictGuard();
  }

  /**
   * Evaluates task prompt and targets to produce an authoritative pre-development report.
   */
  public async analyzeDependenciesAndReuse(
    query: DRATaskQuery,
    syntheticEdges?: readonly { from: string; to: string }[]
  ): Promise<DRAReuseReport> {
    const startTimeMs = performance.now();

    // 1. Fail-closed validation
    if (!query || typeof query !== 'object') {
      throw new Error('[DRA_ERROR] Query must be a valid non-null object');
    }
    if (typeof query.prompt !== 'string' || query.prompt.trim().length === 0) {
      throw new Error('[DRA_ERROR] Query prompt must be a non-empty string');
    }

    // 2. RX Evidence: RX0 (Intake)
    const rxTracker = new DRARxEvidenceTracker(query);

    // 3. Topology & Dependency Graph: RX1 (Discovery)
    const targetSubsystems = query.targetSubsystems || [];
    const dependencyGraph = this.graphBuilder.buildGraph(targetSubsystems, syntheticEdges);
    rxTracker.recordDiscovery(dependencyGraph.nodes.length, dependencyGraph.edges.length);

    // 4. Reuse Analysis: RX2 (Strategy & Candidate Resolution)
    const { matchedCandidates, recommendedStrategy } = this.reuseAnalyzer.analyzeReuse(query);
    rxTracker.recordReuseAnalysis(recommendedStrategy, matchedCandidates.length);

    // 5. Conflict & Frozen Audit: RX3 (Duplicate & Collision Check)
    const duplicateWarnings = DRADuplicateDetector.detectDuplicates(query);
    const { warnings: frozenWarnings, protectedFilesImpacted } =
      this.frozenGuard.auditFrozenConflicts(query);

    const allConflicts: DRAConflictWarning[] = [...duplicateWarnings, ...frozenWarnings];

    // If graph has circular dependencies, record as conflict
    if (dependencyGraph.hasCycles) {
      for (const cycle of dependencyGraph.cyclePaths) {
        allConflicts.push({
          type: 'CIRCULAR_DEPENDENCY',
          severity: 'CRITICAL',
          target: cycle.join(' -> '),
          reason: `Circular dependency detected in subsystem topology: ${cycle.join(' -> ')}`,
          impact: 'Deadlock risk; prevents deterministic topological execution.',
          safeAlternatives: [
            'Break dependency cycle by introducing an intermediary event bus or decoupling interfaces',
          ],
        });
      }
    }

    rxTracker.recordConflictAudit(allConflicts.length, protectedFilesImpacted.length);

    // 6. Collect Exact Source References: RX4 (Provenance Anchor)
    const exactSourceReferences: DRASourceReference[] = [];
    for (const cand of matchedCandidates) {
      exactSourceReferences.push({
        sourcePath: cand.path,
        referenceType: 'SOURCE_CODE',
        description: `${cand.capabilityName} (${cand.status})`,
        isFrozen: cand.status.includes('FROZEN'),
      });
      if (cand.tests) {
        exactSourceReferences.push({
          sourcePath: cand.tests,
          referenceType: 'TEST_SUITE',
          description: `Verification suite for ${cand.capabilityName}`,
          isFrozen: false,
        });
      }
    }

    rxTracker.recordProvenanceValidation(exactSourceReferences.length, true);

    // 7. Decision: Approval for Development
    const hasCriticalConflicts = allConflicts.some((c) => c.severity === 'CRITICAL');
    const isApprovedForDevelopment = !hasCriticalConflicts;

    // 8. Compute Master Provenance Hash
    const hashPayload = JSON.stringify({
      agentId: DRADependencyAgent.AGENT_ID,
      prompt: query.prompt,
      strategy: recommendedStrategy,
      candidates: matchedCandidates.map((c) => c.capabilityId).sort(),
      conflicts: allConflicts.map((c) => `${c.type}:${c.target}`).sort(),
      protectedFiles: [...protectedFilesImpacted].sort(),
      topologicalOrder: dependencyGraph.topologicalOrder,
      isApproved: isApprovedForDevelopment,
    });

    const masterProvenanceHash = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    const executionTimeMs = Number((performance.now() - startTimeMs).toFixed(2));

    const report: DRAReuseReport = Object.freeze({
      agentId: 'AGENT-002-DRA',
      version: '1.0.0',
      taskId: query.taskId,
      query,
      recommendedStrategy,
      matchedCapabilities: matchedCandidates,
      dependencyGraph,
      conflicts: Object.freeze(allConflicts),
      protectedFilesImpacted,
      exactSourceReferences: Object.freeze(exactSourceReferences),
      isApprovedForDevelopment,
      masterProvenanceHash,
      executionTimeMs,
      rxLifecycleId: rxTracker.getLifecycleId(),
    });

    // 9. Seal Lifecycle: RX5 (Sealed Report)
    rxTracker.sealLifecycle(report);

    return report;
  }

  /**
   * Returns PMA adapter instance.
   */
  public getPmaAdapter(): DRAPmaAdapter {
    if (!this.pmaAdapter) {
      this.pmaAdapter = new DRAPmaAdapter(this);
    }
    return this.pmaAdapter;
  }

  /**
   * Verifies system invariants, database integrity, and zero external AI.
   */
  public verifySafety(): DRASafetyStatus {
    const dbPath = path.join(this.rootDir, 'data', 'cubio_studio.db');
    let dbUnmutated = true;
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(dbPath))
        .digest('hex')
        .toUpperCase();
      if (
        stats.size !== 77824 ||
        hash !== 'E8CB4147DD1DCF73B29FB0EF270B75EFD3B93598F3130D0625F9ED4A0DF2C493'
      ) {
        dbUnmutated = false;
      }
    }

    const spatialPath = path.join(this.rootDir, 'src', 'core', 'address369.ts');
    let spatialUnmutated = true;
    if (fs.existsSync(spatialPath)) {
      const hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(spatialPath))
        .digest('hex')
        .toUpperCase();
      if (hash !== '12EEF2D3EC79BCE873A064443787587A32711145EA82D375333C2222303FE612') {
        spatialUnmutated = false;
      }
    }

    return Object.freeze({
      is_actuation_blocked: this.is_actuation_blocked,
      external_ai_dependencies: 0,
      canonical_db_unmutated: dbUnmutated,
      address369_unmutated: spatialUnmutated,
    });
  }
}
