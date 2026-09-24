/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/types.ts
 *
 * Authoritative contracts and type definitions for evidence synthesis,
 * gap identification, candidate solution generation, execution planning,
 * and mandatory Task Completion Reports.
 */

export type TheMGEvidenceClassification =
  | 'VERIFIED_FACT'
  | 'OBSERVED_FAILURE'
  | 'HYPOTHESIS'
  | 'PROPOSED_SOLUTION'
  | 'UNRESOLVED_QUESTION';

export interface TheMGEvidenceItem {
  readonly id: string;
  readonly classification: TheMGEvidenceClassification;
  readonly source: string;
  readonly summary: string;
  readonly confidence: number; // 0.0 to 1.0
  readonly contentHash: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface TheMGFact {
  readonly factId: string;
  readonly statement: string;
  readonly verifiedSource: string;
  readonly contentHash: string;
  readonly timestamp: number;
}

export interface TheMGObservedFailure {
  readonly failureId: string;
  readonly symptom: string;
  readonly rootCauseHypothesis?: string;
  readonly testOrGateReference: string;
  readonly severity: 'BLOCKER' | 'MAJOR' | 'MINOR';
  readonly rawErrorSnippet?: string;
}

export interface TheMGHypothesis {
  readonly hypothesisId: string;
  readonly premise: string;
  readonly testablePrediction: string;
  readonly falsificationCriteria: string;
  readonly associatedFailures: readonly string[];
}

export interface TheMGProposedSolution {
  readonly solutionId: string;
  readonly title: string;
  readonly description: string;
  readonly targetFailures: readonly string[];
  readonly capabilitiesToReuse: readonly string[];
  readonly filesToModify: readonly string[];
  readonly newFilesRequired: readonly string[];
  readonly estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly architecturalCompliance: boolean;
  readonly rationale: string;
}

export interface TheMGUnresolvedQuestion {
  readonly questionId: string;
  readonly question: string;
  readonly impact: string;
  readonly recommendedInvestigationStep: string;
}

export interface TheMGExecutionStep {
  readonly stepNumber: number;
  readonly name: string;
  readonly description: string;
  readonly targetFiles: readonly string[];
  readonly verificationGate: string;
  readonly rollbackPlan: string;
  readonly expectedOutcome: string;
}

export interface TheMGExecutionPlan {
  readonly planId: string;
  readonly objective: string;
  readonly selectedSolutionId: string;
  readonly steps: readonly TheMGExecutionStep[];
  readonly mandatoryGates: readonly string[];
  readonly estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly planHash: string;
}

export interface TheMGPlanningScope {
  readonly taskId: string;
  readonly objective: string;
  readonly evidenceItems?: readonly TheMGEvidenceItem[];
  readonly rawTestReports?: readonly string[];
  readonly rawFailures?: readonly string[];
  readonly priorTasks?: readonly string[];
  readonly allowedFiles?: readonly string[];
  readonly protectedFiles?: readonly string[];
}

export interface TheMGPlanReport {
  readonly agentId: 'AGENT-005-TheMG';
  readonly version: '1.0.0';
  readonly reportId: string;
  readonly taskId: string;
  readonly objective: string;
  readonly facts: readonly TheMGFact[];
  readonly failures: readonly TheMGObservedFailure[];
  readonly hypotheses: readonly TheMGHypothesis[];
  readonly proposedSolutions: readonly TheMGProposedSolution[];
  readonly unresolvedQuestions: readonly TheMGUnresolvedQuestion[];
  readonly executionPlan: TheMGExecutionPlan;
  readonly masterPlanningHash: string;
  readonly executionTimeMs: number;
  readonly rxLifecycleId: string;
  readonly isActuationBlocked: true;
}

export interface TheMGTaskCompletionReport {
  readonly reportId: string;
  readonly taskId: string;
  readonly objective: string;
  readonly workPerformed: readonly string[];
  readonly resultStatus: 'PASS' | 'PARTIAL_PASS' | 'FAIL' | 'BLOCKED';
  readonly testsAndGatesExecuted: readonly {
    readonly name: string;
    readonly status: 'PASS' | 'FAIL' | 'BLOCKED';
  }[];
  readonly importantChanges: readonly {
    readonly path: string;
    readonly changeType: 'MODIFIED' | 'CREATED' | 'DELETED';
    readonly summary: string;
  }[];
  readonly failuresAndGaps: readonly string[];
  readonly rxEvidenceReference: {
    readonly lifecycleId: string;
    readonly masterProvenanceHash: string;
  };
  readonly nextAction: string;
  readonly timestamp: number;
  readonly reportHash: string;
}

export interface TheMGSafetyStatus {
  readonly isActuationBlocked: boolean;
  readonly isOfflineOnly: boolean;
  readonly externalAiDetected: boolean;
}
