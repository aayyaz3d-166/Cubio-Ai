export interface GoalSpec { readonly goalId: string; readonly rawGoalText: string; readonly parsedIntent: string; readonly domain: string; readonly complexityScore: number; }
export interface RequirementSet { readonly reqSetId: string; readonly goalId: string; readonly explicitRequirements: readonly string[]; readonly implicitRequirements: readonly string[]; readonly constraints: readonly string[]; }
export interface TaskDecomposition { readonly decompositionId: string; readonly goalId: string; readonly orderedSubTasks: readonly SubTask[]; readonly totalEstimatedMinutes: number; }
export interface SubTask { readonly subTaskId: string; readonly name: string; readonly dependencies: readonly string[]; readonly estimatedMinutes: number; readonly status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'; }
export interface ResourcePlan { readonly planId: string; readonly requiredTools: readonly string[]; readonly requiredDataSources: readonly string[]; readonly estimatedComputeUnits: number; }
export interface ToolSelection { readonly selectionId: string; readonly selectedTools: readonly string[]; readonly optimalityScore: number; }
export interface EnvironmentAction { readonly actionId: string; readonly actionType: 'FILE_WRITE' | 'API_CALL' | 'CAD_GENERATE' | 'RENDER' | 'VALIDATE'; readonly targetPath: string; readonly result: string; }
export interface OrchestrationReport { readonly orchestrationId: string; readonly subTasksCompleted: number; readonly subTasksTotal: number; readonly parallelBatchesUsed: number; readonly totalElapsedMs: number; }
export interface ProgressSnapshot { readonly snapshotId: string; readonly completionPercent: number; readonly stallDetected: boolean; readonly estimatedRemainingMs: number; }
export interface ErrorRecoveryAction { readonly recoveryId: string; readonly failedSubTaskId: string; readonly strategy: 'RETRY' | 'FALLBACK' | 'ESCALATE'; readonly recoverySuccessful: boolean; }
export interface QualityAssuranceReport { readonly qaId: string; readonly requirementsSatisfied: number; readonly requirementsTotal: number; readonly qualityScorePercent: number; }
export interface OutputPackage { readonly packageId: string; readonly deliverables: readonly string[]; readonly totalFileSizeBytes: number; readonly packageChecksum: string; }
export interface UserFeedbackIntegration { readonly feedbackId: string; readonly correctionApplied: string; readonly planRevised: boolean; }
export interface MultiAgentDelegation { readonly delegationId: string; readonly delegatedSubTasks: number; readonly specializedAgentsUsed: readonly string[]; readonly coordinationOverheadMs: number; }
export interface ContextWindowState { readonly contextId: string; readonly tokensUsed: number; readonly tokensAvailable: number; readonly compressionApplied: boolean; }
export interface ConstraintResolution { readonly resolutionId: string; readonly conflictsResolved: number; readonly satisfactionScore: number; }
export interface PrioritySchedule { readonly scheduleId: string; readonly orderedTaskIds: readonly string[]; readonly criticalPathLengthMs: number; }
export interface RollbackResult { readonly rollbackId: string; readonly rolledBackSubTasks: number; readonly stateRestoredSuccessfully: boolean; }
export interface WorkflowValidation { readonly validationId: string; readonly endToEndValid: boolean; readonly pipelineStagesVerified: number; readonly deliverableIntegrityPercent: number; }
export interface AgentBenchmarkSummary { readonly benchmarkId: string; readonly totalWorkflowsEvaluated: number; readonly successRate: number; readonly avgCompletionMs: number; }
export interface IndependentAgentAudit { readonly auditId: string; readonly capabilityVerifiedPercent: number; readonly auditorSeal: string; }
export interface AdaptivePlanRevision { readonly revisionId: string; readonly originalPlanId: string; readonly revisedStepsCount: number; readonly improvementDelta: number; }
export interface DomainAdaptation { readonly adaptationId: string; readonly sourceDomain: string; readonly targetDomain: string; readonly transferSuccessRate: number; }
export interface AgentLongHorizonPlan { readonly planId: string; readonly sessionsPlanned: number; readonly milestones: readonly string[]; readonly totalEstimatedHours: number; }
export interface AutonomyBoundary { readonly boundaryId: string; readonly authorizedActions: readonly string[]; readonly prohibitedActions: readonly string[]; readonly boundaryEnforced: boolean; }
export interface Layer13RealityCertification { readonly certificateId: string; readonly certifiedLayer: 'LAYER_13_GENERAL_AGENT'; readonly layerFunnelsCertified: readonly string[]; readonly totalWorkflowsCompleted: number; readonly endToEndSuccessRate: number; readonly compositeLayer13CiiScore: number; readonly certificationStatus: 'CERTIFIED_SUPREME_GENERAL_AGENT'; readonly cryptographicMasterSeal: string; readonly timestamp: number; }
