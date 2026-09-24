/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Code Generation Types & Contracts
 *
 * Core contracts for Code Generation (Create Files, Write Code, Modify Code,
 * Generate Components, Generate APIs, Generate Tests), Pluggable Code Providers,
 * and Human Authorization Gate for destructive safety.
 */

import { ProviderInfo, ProviderStatus } from '../universalTypes';

export type ProgrammingLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'glsl'
  | 'sql'
  | 'cpp'
  | 'html'
  | 'css'
  | string;

export type CodingTaskType =
  | 'GENERATION'
  | 'EXPLANATION'
  | 'DEBUGGING'
  | 'REFACTORING'
  | 'TEST_GENERATION'
  | 'PROJECT_CODING';

export type CodeActionKind =
  | 'CREATE_FILE'
  | 'WRITE_CODE'
  | 'MODIFY_CODE'
  | 'GENERATE_COMPONENT'
  | 'GENERATE_API'
  | 'GENERATE_TESTS';

export type FileOperationType = 'CREATE' | 'MODIFY' | 'DELETE' | 'OVERWRITE';

export type HumanAuthorizationLevel =
  | 'SAFE_AUTO'
  | 'REQUIRES_HUMAN_APPROVAL'
  | 'BLOCKED';

export type HumanAuthorizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RefactoringStrategy =
  | 'MODERNIZE_TYPESCRIPT'
  | 'OPTIMIZE_PERFORMANCE'
  | 'EXTRACT_MODULAR_FUNCTIONS'
  | 'HARDEN_TYPE_SAFETY'
  | 'MAKE_DETERMINISTIC';

export interface CodeFileOperation {
  readonly operationId: string;
  readonly targetPath: string;
  readonly operationType: FileOperationType;
  readonly content: string;
  readonly originalContent?: string;
  readonly isDestructive: boolean;
  readonly riskReason?: string;
}

export interface HumanAuthorizationGateRecord {
  readonly gateId: string;
  readonly level: HumanAuthorizationLevel;
  readonly status: HumanAuthorizationStatus;
  readonly destructiveOperationsCount: number;
  readonly safetyRiskAssessment: string;
  readonly authorizationToken?: string;
  readonly evaluatedAt: number;
  readonly resolvedAt?: number;
}

export interface CodeGenerationExecutionPlan {
  readonly planId: string;
  readonly actionKind: CodeActionKind;
  readonly prompt: string;
  readonly language: ProgrammingLanguage;
  readonly fileOperations: readonly CodeFileOperation[];
  readonly authorizationGate: HumanAuthorizationGateRecord;
  readonly isExecutable: boolean;
  readonly planChecksum: string;
  readonly timestamp: number;
}

export interface CodeGenerationRequest {
  readonly prompt: string;
  readonly language?: ProgrammingLanguage;
  readonly framework?: string;
  readonly includeTests?: boolean;
  readonly targetDimension?: string;
  readonly projectId?: string;
  readonly existingFiles?: Readonly<Record<string, string>>;
  readonly actionKind?: CodeActionKind;
  readonly targetFilePath?: string;
  readonly isDestructiveAllowed?: boolean;
  readonly authorizationToken?: string;
}

export interface CodeGenerationResult {
  readonly code: string;
  readonly language: ProgrammingLanguage;
  readonly filename: string;
  readonly explanation: string;
  readonly tests?: string;
  readonly imports: readonly string[];
  readonly exports: readonly string[];
  readonly lineCount: number;
  readonly complexityEstimate: string;
  readonly providerId: string;
  readonly executionPlan?: CodeGenerationExecutionPlan;
  readonly codeChecksum: string;
}

export interface CodeExplanationSection {
  readonly title: string;
  readonly content: string;
  readonly targetLines?: readonly [number, number];
}

export interface CodeExplanationResult {
  readonly summary: string;
  readonly sections: readonly CodeExplanationSection[];
  readonly timeComplexity: string;
  readonly spaceComplexity: string;
  readonly architecturalPattern: string;
  readonly potentialEdgeCases: readonly string[];
  readonly explanationChecksum: string;
}

export interface CodeDebugRequest {
  readonly code: string;
  readonly errorTrace: string;
  readonly language?: ProgrammingLanguage;
  readonly expectedBehavior?: string;
}

export interface CodeDebugResult {
  readonly originalCode: string;
  readonly patchedCode: string;
  readonly rootCause: string;
  readonly fixExplanation: string;
  readonly linesModified: readonly number[];
  readonly preventiveAdvice: readonly string[];
  readonly patchChecksum: string;
}

export interface CodeRefactorRequest {
  readonly code: string;
  readonly strategy: RefactoringStrategy;
  readonly language?: ProgrammingLanguage;
}

export interface CodeRefactorResult {
  readonly originalCode: string;
  readonly refactoredCode: string;
  readonly strategyApplied: RefactoringStrategy;
  readonly changesMade: readonly string[];
  readonly improvements: readonly string[];
  readonly refactorChecksum: string;
}

export interface TestGenerationRequest {
  readonly code: string;
  readonly testFramework?: 'vitest' | 'jest' | 'pytest' | 'mocha';
  readonly language?: ProgrammingLanguage;
  readonly includeInvariants?: boolean;
}

export interface TestGenerationResult {
  readonly testCode: string;
  readonly framework: string;
  readonly testCasesCount: number;
  readonly coveredFunctions: readonly string[];
  readonly includesDeterminismTest: boolean;
  readonly testChecksum: string;
}

export interface ProjectCodingContext {
  readonly projectId: string;
  readonly activeGoals: readonly string[];
  readonly fileMap: Readonly<Record<string, string>>;
  readonly codingStandards: readonly string[];
}

// ─── PLUGGABLE CODE PROVIDER CONTRACT ──────────────────────────────────────

export interface ICodeGenerationProvider {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  generateCode(request: CodeGenerationRequest): Promise<Readonly<CodeGenerationResult>>;
}

export interface IUniversalCodingEngine {
  generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult>;
  explainCode(code: string, language?: ProgrammingLanguage): Promise<CodeExplanationResult>;
  debugCode(request: CodeDebugRequest): Promise<CodeDebugResult>;
  refactorCode(request: CodeRefactorRequest): Promise<CodeRefactorResult>;
  generateTests(request: TestGenerationRequest): Promise<TestGenerationResult>;
  approveGate(gateId: string, signedToken: string): boolean;
}
