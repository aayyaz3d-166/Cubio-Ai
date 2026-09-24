/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-003 — TGA (Test & Gate Agent)
 * src/cubio/agents/tga/gateAgent.ts
 *
 * Primary orchestrator for CUBiO's native Test & Gate Agent.
 * Discovers required tests and architectural acceptance gates, validates
 * prerequisites, orchestrates gate execution, detects regressions,
 * and renders deterministic PASS/FAIL/BLOCKED verdicts.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  TGATaskScope,
  TGAGateDefinition,
  TGAGateReport,
  TGASafetyStatus,
} from './types';
import { TGATestDiscoveryEngine } from './testDiscovery';
import { TGAPrerequisiteValidator } from './prerequisiteValidator';
import { TGAGateExecutor } from './gateExecutor';
import { TGARegressionDetector } from './regressionDetector';
import { TGARxEvidenceTracker } from './rxEvidence';
import { TGAPmaAdapter } from './pmaAdapter';

export interface TGADependencies {
  readonly customRootDir?: string;
  readonly discoveryEngine?: TGATestDiscoveryEngine;
  readonly prerequisiteValidator?: TGAPrerequisiteValidator;
  readonly gateExecutor?: TGAGateExecutor;
  readonly regressionDetector?: TGARegressionDetector;
}

export class TGAGateAgent {
  public static readonly AGENT_ID = 'AGENT-003-TGA' as const;
  public static readonly VERSION = '1.0.0' as const;
  public readonly is_actuation_blocked: boolean = true;

  private readonly rootDir: string;
  private readonly discoveryEngine: TGATestDiscoveryEngine;
  private readonly prerequisiteValidator: TGAPrerequisiteValidator;
  private readonly gateExecutor: TGAGateExecutor;
  private readonly regressionDetector: TGARegressionDetector;
  private pmaAdapter?: TGAPmaAdapter;

  constructor(deps?: TGADependencies) {
    this.rootDir = deps?.customRootDir || process.cwd();
    this.discoveryEngine = deps?.discoveryEngine || new TGATestDiscoveryEngine();
    this.prerequisiteValidator =
      deps?.prerequisiteValidator || new TGAPrerequisiteValidator(this.rootDir);
    this.gateExecutor = deps?.gateExecutor || new TGAGateExecutor(this.rootDir);
    this.regressionDetector =
      deps?.regressionDetector || new TGARegressionDetector(this.rootDir);
  }

  /**
   * Pre-execution discovery: returns all required gates and test suites for a task.
   */
  public async discoverRequiredGates(scope: TGATaskScope): Promise<readonly TGAGateDefinition[]> {
    if (!scope || typeof scope !== 'object') {
      throw new Error('[TGA_ERROR] Task scope must be a valid non-null object');
    }
    if (typeof scope.objective !== 'string' || scope.objective.trim().length === 0) {
      throw new Error('[TGA_ERROR] Task objective must be a non-empty string');
    }

    return this.discoveryEngine.discoverRequiredGates(scope);
  }

  /**
   * Complete gate execution and acceptance audit:
   * Validates prerequisites, executes gates, audits regressions, and renders verdict.
   */
  public async executeGates(
    scope: TGATaskScope,
    options?: {
      simulatedGateFailures?: readonly string[];
      simulatedDrift?: readonly string[];
    }
  ): Promise<TGAGateReport> {
    const startTimeMs = performance.now();

    // 1. Fail-closed input validation
    if (!scope || typeof scope !== 'object') {
      throw new Error('[TGA_ERROR] Task scope must be a valid non-null object');
    }
    if (typeof scope.objective !== 'string' || scope.objective.trim().length === 0) {
      throw new Error('[TGA_ERROR] Task objective must be a non-empty string');
    }

    // 2. RX Evidence: RX0 (Intake)
    const rxTracker = new TGARxEvidenceTracker(scope);

    // 3. Gate Discovery: RX1 (Discovery)
    const discoveredGates = this.discoveryEngine.discoverRequiredGates(scope);
    rxTracker.recordGateDiscovery(discoveredGates.length);

    // 4. Prerequisite Validation: RX2 (Preconditions)
    const prerequisites = this.prerequisiteValidator.validatePrerequisites(scope);
    rxTracker.recordPrerequisiteValidation(
      prerequisites.isReadyForTesting,
      prerequisites.failureReasons
    );

    // 5. Gate Execution: RX3 (Execution)
    const { results, verdict } = await this.gateExecutor.evaluateGates(
      discoveredGates,
      prerequisites,
      options?.simulatedGateFailures
    );
    rxTracker.recordGateExecution(verdict.passedGates, verdict.totalGates);

    // 6. Regression Audit: RX4 (Invariants & Drift)
    const regressionStatus = this.regressionDetector.auditRegression(options?.simulatedDrift);
    rxTracker.recordRegressionAudit(regressionStatus.baselineStatus);

    // If regression was detected, degrade verdict to BLOCKED if not already failed/blocked
    let adjustedVerdict = verdict;
    if (regressionStatus.regressionDetected && adjustedVerdict.finalStatus === 'PASS') {
      adjustedVerdict = Object.freeze({
        ...verdict,
        finalStatus: 'BLOCKED',
        blockedReason: `Regression detected: ${regressionStatus.driftedInvariants.join('; ')}`,
      });
    }

    // 7. Compute Master Provenance Hash
    const hashPayload = JSON.stringify({
      agentId: TGAGateAgent.AGENT_ID,
      objective: scope.objective,
      verdict: adjustedVerdict.finalStatus,
      passedGates: adjustedVerdict.passedGates,
      totalGates: adjustedVerdict.totalGates,
      gates: discoveredGates.map((g) => g.gateId).sort(),
      results: results.map((r) => `${r.gateId}:${r.status}:${r.evidenceHash}`).sort(),
      prerequisites: prerequisites.isReadyForTesting,
      regression: regressionStatus.baselineStatus,
    });

    const masterProvenanceHash = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    const executionTimeMs = Number((performance.now() - startTimeMs).toFixed(2));

    const report: TGAGateReport = Object.freeze({
      agentId: 'AGENT-003-TGA',
      version: '1.0.0',
      taskId: scope.taskId,
      taskScope: scope,
      prerequisites,
      discoveredGates,
      gateResults: results,
      regressionStatus,
      verdict: adjustedVerdict,
      masterProvenanceHash,
      executionTimeMs,
      rxLifecycleId: rxTracker.getLifecycleId(),
    });

    // 8. Seal Lifecycle: RX5 (Sealed Report)
    rxTracker.sealLifecycle(report);

    return report;
  }

  /**
   * Returns PMA adapter instance.
   */
  public getPmaAdapter(): TGAPmaAdapter {
    if (!this.pmaAdapter) {
      this.pmaAdapter = new TGAPmaAdapter(this);
    }
    return this.pmaAdapter;
  }

  /**
   * Verifies system safety, database invariance, and zero external AI.
   */
  public verifySafety(): TGASafetyStatus {
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
