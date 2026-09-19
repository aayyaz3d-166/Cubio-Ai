/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F18: CubiO Coding & Debugging Intelligence Engine (Types & Contracts)
 *
 * Provides type contracts for generalized, deterministic code explanation,
 * generation, debugging, syntax validation, and programming problem-solving.
 */

export type ProgrammingLanguage =
  | 'PYTHON'
  | 'JAVASCRIPT'
  | 'TYPESCRIPT'
  | 'SQL'
  | 'BASH'
  | 'HTML'
  | 'CSS'
  | 'UNKNOWN';

export type CodingTaskType =
  | 'EXPLANATION'
  | 'GENERATION'
  | 'DEBUGGING'
  | 'SYNTAX_ANALYSIS'
  | 'GENERAL_TASK';

export type CodeErrorCategory =
  | 'SYNTAX_ERROR'
  | 'LOGICAL_ERROR'
  | 'TYPE_ERROR'
  | 'ASYNC_ERROR'
  | 'RUNTIME_EXCEPTION'
  | 'LINT_ISSUE';

export interface CodeDiagnosis {
  readonly hasError: boolean;
  readonly category?: CodeErrorCategory;
  readonly language: ProgrammingLanguage;
  readonly symptom: string;
  readonly rootCause: string;
  readonly lineNumber?: number;
  readonly problematicSnippet?: string;
  readonly correctedCode: string;
  readonly fixExplanation: string;
  readonly preventionTip?: string;
}

export interface CodeAnalysis {
  readonly language: ProgrammingLanguage;
  readonly constructs: readonly string[];
  readonly functions: readonly string[];
  readonly variables: readonly string[];
  readonly imports: readonly string[];
  readonly estimatedTimeComplexity?: string;
  readonly estimatedSpaceComplexity?: string;
  readonly purpose: string;
  readonly stepByStepExplanation: readonly string[];
}

export interface GeneratedCodeResult {
  readonly language: ProgrammingLanguage;
  readonly taskName: string;
  readonly code: string;
  readonly explanation: string;
  readonly usageExample?: string;
  readonly keyPoints: readonly string[];
}

export interface CodingTaskRequest {
  readonly prompt: string;
  readonly codeSnippet?: string;
  readonly targetLanguage?: ProgrammingLanguage;
  readonly taskType?: CodingTaskType;
  readonly isUrdu?: boolean;
}

export interface CodingTaskResult {
  readonly taskId: string;
  readonly taskType: CodingTaskType;
  readonly language: ProgrammingLanguage;
  readonly codeOutput?: string;
  readonly structuredAnswer: string;
  readonly diagnosis?: CodeDiagnosis;
  readonly analysis?: CodeAnalysis;
  readonly generatedCode?: GeneratedCodeResult;
  readonly confidence: number;
  readonly timestamp: number;
}
