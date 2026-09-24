/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/mgAgent.ts
 *
 * Central sovereign orchestrator for AGENT-005 TheMG.
 * Collects and synthesizes verified evidence, pinpoints gaps, proposes
 * compliant solutions, and builds deterministic execution plans.
 */

import * as crypto from 'crypto';
import {
  TheMGPlanningScope,
  TheMGPlanReport,
  TheMGSafetyStatus,
  TheMGTaskCompletionReport,
} from './types';
import { TheMGEvidenceSynthesizer } from './evidenceSynthesizer';
import { TheMGGapIdentifier } from './gapIdentifier';
import { TheMGSolutionGenerator } from './solutionGenerator';
import { TheMGPlanBuilder } from './planBuilder';
import { TheMGTaskReporter } from './taskReporter';
import { TheMGRxEvidenceTracker } from './rxEvidence';
import { IS_ACTUATION_BLOCKED } from '../../intelligence/core/coreEngineContract';

export class TheMGAgent {
  public static readonly AGENT_ID = 'AGENT-005-TheMG';
  public static readonly VERSION = '1.0.0';

  private readonly rootDir: string;
  private readonly synthesizer: TheMGEvidenceSynthesizer;
  private readonly gapIdentifier: TheMGGapIdentifier;
  private readonly solutionGenerator: TheMGSolutionGenerator;
  private readonly planBuilder: TheMGPlanBuilder;
  private readonly taskReporter: TheMGTaskReporter;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
    this.synthesizer = new TheMGEvidenceSynthesizer();
    this.gapIdentifier = new TheMGGapIdentifier();
    this.solutionGenerator = new TheMGSolutionGenerator(this.rootDir);
    this.planBuilder = new TheMGPlanBuilder();
    this.taskReporter = new TheMGTaskReporter(this.rootDir);
  }

  /**
   * Primary entry point: Constructs an evidence-backed execution plan.
   */
  public async planSolution(scope: TheMGPlanningScope): Promise<TheMGPlanReport> {
    const startTimeMs = performance.now();

    // 1. Fail-closed scope validation
    if (!scope || typeof scope !== 'object' || !scope.taskId || !scope.objective) {
      throw new Error('[THEMG_SCOPE_INVALID] Task ID and objective are mandatory for planning.');
    }

    // 2. Sovereign Actuation Lockout Assertion
    this.assertActuationLockout();

    const rxTracker = new TheMGRxEvidenceTracker(scope.taskId);

    // RX0: Intake
    rxTracker.recordRx0Intake(scope);

    // RX1: Evidence Synthesis
    const { facts, failures, hypotheses } = this.synthesizer.synthesizeEvidence(scope);
    rxTracker.recordRx1EvidenceSynthesis(facts.length, failures.length);

    // RX2: Gap & Problem Identification
    const { unresolvedQuestions } = this.gapIdentifier.identifyGaps(scope, facts, failures);
    rxTracker.recordRx2GapAnalysis(unresolvedQuestions.length);

    // RX3: Solution Generation
    const proposedSolutions = this.solutionGenerator.generateSolutions(scope, facts, failures);
    rxTracker.recordRx3SolutionGeneration(proposedSolutions.length);

    // Select primary solution (lowest risk, highest compliance)
    const selectedSolution = proposedSolutions[0];

    // RX4: Execution Plan Construction
    const executionPlan = this.planBuilder.buildExecutionPlan(scope, selectedSolution);
    rxTracker.recordRx4PlanConstruction(executionPlan.steps.length);

    // RX5: Sealing & Master Planning Hash
    const reportId = `PLAN-REP-${scope.taskId}-${Date.now().toString(36).toUpperCase()}`;

    const hashPayload = JSON.stringify({
      agentId: TheMGAgent.AGENT_ID,
      taskId: scope.taskId,
      objective: scope.objective,
      factCount: facts.length,
      failureCount: failures.length,
      solutionId: selectedSolution.solutionId,
      planHash: executionPlan.planHash,
    });

    const masterPlanningHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
    const executionTimeMs = Number((performance.now() - startTimeMs).toFixed(2));

    const report: TheMGPlanReport = Object.freeze({
      agentId: TheMGAgent.AGENT_ID,
      version: TheMGAgent.VERSION,
      reportId,
      taskId: scope.taskId,
      objective: scope.objective,
      facts,
      failures,
      hypotheses,
      proposedSolutions,
      unresolvedQuestions,
      executionPlan,
      masterPlanningHash,
      executionTimeMs,
      rxLifecycleId: rxTracker.getLifecycleId(),
      isActuationBlocked: true,
    });

    rxTracker.sealLifecycle(report);
    return report;
  }

  /**
   * Generates a mandatory Task Completion Report directly.
   */
  public generateTaskCompletionReport(params: Parameters<TheMGTaskReporter['generateTaskCompletionReport']>[0]): TheMGTaskCompletionReport {
    this.assertActuationLockout();
    return this.taskReporter.generateTaskCompletionReport(params);
  }

  /**
   * Returns current safety posture.
   */
  public getSafetyStatus(): TheMGSafetyStatus {
    return Object.freeze({
      isActuationBlocked: IS_ACTUATION_BLOCKED === true,
      isOfflineOnly: true,
      externalAiDetected: false,
    });
  }

  private assertActuationLockout(): void {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error(
        '[THEMG_SAFETY_BREACH] Actuation lockout invariant violated: IS_ACTUATION_BLOCKED must be true.'
      );
    }
  }
}
