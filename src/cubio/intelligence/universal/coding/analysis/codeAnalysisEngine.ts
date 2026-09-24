/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Master Code Analysis & Debugging Engine
 *
 * Coordinates all 7 code analysis and debugging capabilities:
 * 1. Repository Analysis
 * 2. Error Diagnosis
 * 3. Dependency Analysis
 * 4. Test Analysis
 * 5. Architecture Review
 * 6. Bug Fixing
 * 7. Regression Verification
 */

import {
  RepositoryAnalysisReport,
  ErrorDiagnosisReport,
  DependencyAnalysisReport,
  TestAnalysisReport,
  ArchitectureReviewReport,
  BugFixReport,
  RegressionVerificationReport,
} from './types';
import { RepositoryAnalyzer } from './repositoryAnalyzer';
import { ErrorDiagnoser } from './errorDiagnoser';
import { DependencyAnalyzer } from './dependencyAnalyzer';
import { TestAnalyzer } from './testAnalyzer';
import { ArchitectureReviewer } from './architectureReviewer';
import { BugFixer } from './bugFixer';
import { RegressionVerifier } from './regressionVerifier';

export class CubiOCodeAnalysisEngine {
  private repoAnalyzer = new RepositoryAnalyzer();
  private errorDiagnoser = new ErrorDiagnoser();
  private depAnalyzer = new DependencyAnalyzer();
  private testAnalyzer = new TestAnalyzer();
  private archReviewer = new ArchitectureReviewer();
  private bugFixer = new BugFixer();
  private regVerifier = new RegressionVerifier();

  public analyzeRepository(files: Readonly<Record<string, string>>): RepositoryAnalysisReport {
    return this.repoAnalyzer.analyzeRepository(files);
  }

  public diagnoseError(errorTrace: string, codeSnippet?: string): ErrorDiagnosisReport {
    return this.errorDiagnoser.diagnoseError(errorTrace, codeSnippet);
  }

  public analyzeDependencies(files: Readonly<Record<string, string>>): DependencyAnalysisReport {
    return this.depAnalyzer.analyzeDependencies(files);
  }

  public analyzeTests(testCode: string, sourceCode?: string): TestAnalysisReport {
    return this.testAnalyzer.analyzeTests(testCode, sourceCode);
  }

  public reviewArchitecture(files: Readonly<Record<string, string>>): ArchitectureReviewReport {
    return this.archReviewer.reviewArchitecture(files);
  }

  public fixBug(code: string, issueDescription: string): BugFixReport {
    return this.bugFixer.fixBug(code, issueDescription);
  }

  public verifyRegression(
    originalCode: string,
    patchedCode: string,
    testCasesCount?: number
  ): RegressionVerificationReport {
    return this.regVerifier.verifyRegression(originalCode, patchedCode, testCasesCount);
  }
}
