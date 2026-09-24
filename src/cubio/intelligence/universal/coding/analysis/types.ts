/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Code Analysis & Debugging Types & Contracts
 *
 * Covers 7 specialized capabilities:
 * 1. Repository Analysis
 * 2. Error Diagnosis
 * 3. Dependency Analysis
 * 4. Test Analysis
 * 5. Architecture Review
 * 6. Bug Fixing
 * 7. Regression Verification
 */

export type CodeAnalysisCapability =
  | 'REPOSITORY_ANALYSIS'
  | 'ERROR_DIAGNOSIS'
  | 'DEPENDENCY_ANALYSIS'
  | 'TEST_ANALYSIS'
  | 'ARCHITECTURE_REVIEW'
  | 'BUG_FIXING'
  | 'REGRESSION_VERIFICATION';

export interface FileMetrics {
  readonly filePath: string;
  readonly lineCount: number;
  readonly exportCount: number;
  readonly importCount: number;
  readonly complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface RepositoryAnalysisReport {
  readonly reportId: string;
  readonly totalFiles: number;
  readonly totalLinesOfCode: number;
  readonly fileBreakdown: readonly FileMetrics[];
  readonly codeHealthScore: number; // 0.0 to 100.0
  readonly complexityHotspots: readonly string[];
  readonly dominantLanguage: string;
  readonly analysisChecksum: string;
}

export interface ErrorDiagnosisReport {
  readonly diagnosisId: string;
  readonly errorType: 'TYPESCRIPT' | 'SYNTAX' | 'RUNTIME' | 'LOGIC';
  readonly rootCause: string;
  readonly offendingFile?: string;
  readonly offendingLineNumber?: number;
  readonly fixStrategy: string;
  readonly suggestedPatch: string;
  readonly confidence: number;
  readonly diagnosisChecksum: string;
}

export interface DependencyNode {
  readonly moduleName: string;
  readonly importedBy: readonly string[];
  readonly dependencies: readonly string[];
  readonly isExternal: boolean;
}

export interface DependencyAnalysisReport {
  readonly reportId: string;
  readonly totalModules: number;
  readonly dependencyDAG: Readonly<Record<string, readonly string[]>>;
  readonly circularDependencies: readonly (readonly [string, string])[];
  readonly isolatedOrphanModules: readonly string[];
  readonly externalDependenciesCount: number;
  readonly analysisChecksum: string;
}

export interface TestAnalysisReport {
  readonly reportId: string;
  readonly totalTestCases: number;
  readonly assertionsCount: number;
  readonly coveredSymbols: readonly string[];
  readonly containsDeterminismInvariant: boolean;
  readonly estimatedCoveragePercent: number;
  readonly testQualityScore: number; // 0.0 to 100.0
  readonly analysisChecksum: string;
}

export interface ArchitectureReviewReport {
  readonly reportId: string;
  readonly compliancePassed: boolean;
  readonly certifiedLayerIsolationMaintained: boolean; // F1–F45 isolation check
  readonly couplingScore: number; // 0.0 (loosely coupled) to 1.0 (tightly coupled)
  readonly cohesionScore: number; // 0.0 to 1.0
  readonly detectedAntiPatterns: readonly string[];
  readonly recommendations: readonly string[];
  readonly reviewChecksum: string;
}

export interface BugFixReport {
  readonly fixId: string;
  readonly originalCode: string;
  readonly fixedCode: string;
  readonly rootCauseSummary: string;
  readonly diffSummary: string;
  readonly linesModified: readonly number[];
  readonly fixChecksum: string;
}

export interface RegressionVerificationReport {
  readonly verificationId: string;
  readonly passed: boolean;
  readonly regressionsDetected: boolean;
  readonly testsExecutedCount: number;
  readonly determinismPreserved: boolean; // sigma^2 = 0
  readonly executionVariance: number;
  readonly verificationChecksum: string;
}
