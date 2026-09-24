/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F51: Master Universal Coding Engine
 *
 * Coordinates Code Generation, Explanation, Debugging, Refactoring,
 * Automated Test Generation, and Project-Aware Contextual Coding ($D_7$).
 */

import { CubiOProviderRegistry } from '../providerRegistry';
import { CubiOProjectIntelligence } from '../projectIntelligence';
import { ICodeExecutionProvider, ILLMProvider } from '../universalTypes';
import {
  IUniversalCodingEngine,
  CodeGenerationRequest,
  CodeGenerationResult,
  CodeExplanationResult,
  CodeDebugRequest,
  CodeDebugResult,
  CodeRefactorRequest,
  CodeRefactorResult,
  TestGenerationRequest,
  TestGenerationResult,
  ProgrammingLanguage,
} from './types';
import { synthesizeCode } from './codeGenerator';
import { explainCodeSnippet } from './codeExplainer';
import { debugCodeSnippet } from './codeDebugger';
import { refactorCodeSnippet } from './codeRefactorer';
import { synthesizeTests } from './testGenerator';
import { HumanAuthorizationGate } from './safety/humanAuthorizationGate';

export class CubiOUniversalCodingEngine implements IUniversalCodingEngine {
  private authGate = new HumanAuthorizationGate();

  constructor(
    private readonly providerRegistry?: CubiOProviderRegistry,
    private readonly projectIntelligence?: CubiOProjectIntelligence
  ) {}

  public approveGate(gateId: string, signedToken: string): boolean {
    return this.authGate.approveGate(gateId, signedToken);
  }

  /**
   * Generates code based on user prompt, language, and project context.
   */
  public async generateCode(request: CodeGenerationRequest): Promise<Readonly<CodeGenerationResult>> {
    // 1. Check Project-Aware Context ($D_7$)
    let projectContextQualifier = '';
    if (request.projectId && this.projectIntelligence) {
      const projectState = this.projectIntelligence.getProjectContext(request.projectId);
      if (projectState) {
        projectContextQualifier = `\n// [Project Context: ${projectState.goal} | Status: ${projectState.status}]`;
      }
    }

    // 2. Check External Code Execution Provider
    if (this.providerRegistry) {
      const codeProvider = this.providerRegistry.getProvider<ICodeExecutionProvider>('CODE_EXECUTION');
      if (codeProvider && codeProvider.getInfo().status === 'AVAILABLE') {
        const res = await codeProvider.generateCode(request.prompt, {
          language: request.language,
          framework: request.framework,
        });

        return Object.freeze({
          code: projectContextQualifier ? `${projectContextQualifier}\n${res.code}` : res.code,
          language: res.language as ProgrammingLanguage,
          filename: `generated_${Date.now()}.${res.language === 'python' ? 'py' : 'ts'}`,
          explanation: res.explanation,
          imports: Object.freeze([]),
          exports: Object.freeze([]),
          lineCount: res.code.split('\n').length,
          complexityEstimate: 'O(N)',
          providerId: res.providerId,
          codeChecksum: `EXT_${res.providerId}`,
        });
      }
    }

    // 3. Sovereign Built-in Code Synthesis
    const synthRes = synthesizeCode(request);
    if (projectContextQualifier) {
      const finalCode = `${projectContextQualifier.trim()}\n${synthRes.code}`;
      return Object.freeze({
        ...synthRes,
        code: finalCode,
        lineCount: finalCode.split('\n').length,
      });
    }
    return synthRes;
  }

  /**
   * Provides deep architectural breakdown and complexity analysis for code.
   */
  public async explainCode(
    code: string,
    language?: ProgrammingLanguage
  ): Promise<Readonly<CodeExplanationResult>> {
    return explainCodeSnippet(code, language);
  }

  /**
   * Diagnoses error traces and produces surgical code patches.
   */
  public async debugCode(request: CodeDebugRequest): Promise<Readonly<CodeDebugResult>> {
    return debugCodeSnippet(request);
  }

  /**
   * Refactors code according to target architectural strategy.
   */
  public async refactorCode(request: CodeRefactorRequest): Promise<Readonly<CodeRefactorResult>> {
    return refactorCodeSnippet(request);
  }

  /**
   * Generates comprehensive unit tests for a code module.
   */
  public async generateTests(request: TestGenerationRequest): Promise<Readonly<TestGenerationResult>> {
    return synthesizeTests(request);
  }
}
