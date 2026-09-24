/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Master Code Generation Engine
 *
 * Coordinates the full code intelligence lifecycle:
 * - Create Files
 * - Write Code
 * - Modify Code
 * - Generate Components
 * - Generate APIs
 * - Generate Tests
 * With enforced Human Authorization Gates for destructive operations.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  IUniversalCodingEngine,
  ICodeGenerationProvider,
  CodeGenerationRequest,
  CodeGenerationResult,
  CodeExplanationResult,
  CodeDebugRequest,
  CodeDebugResult,
  CodeRefactorRequest,
  CodeRefactorResult,
  TestGenerationRequest,
  TestGenerationResult,
  CodeFileOperation,
  CodeGenerationExecutionPlan,
  ProgrammingLanguage,
} from './types';
import { SovereignCodeProvider } from './adapters/sovereignCodeProvider';
import { HumanAuthorizationGate } from './safety/humanAuthorizationGate';
import { explainCodeSnippet } from './codeExplainer';
import { debugCodeSnippet } from './codeDebugger';
import { refactorCodeSnippet } from './codeRefactorer';
import { synthesizeTests } from './testGenerator';
import { CubiOProviderRegistry } from '../providerRegistry';

export class CubiOCodeGenerationEngine implements IUniversalCodingEngine {
  private providers: Map<string, ICodeGenerationProvider> = new Map();
  private activeProviderId: string;
  private sovereignFallback: SovereignCodeProvider;
  private authGate = new HumanAuthorizationGate();

  constructor(providerRegistry?: CubiOProviderRegistry) {
    this.sovereignFallback = new SovereignCodeProvider();
    this.registerProvider(this.sovereignFallback);
    this.activeProviderId = this.sovereignFallback.providerId;

    if (providerRegistry) {
      providerRegistry.registerProvider(this.sovereignFallback as any);
    }
  }

  public registerProvider(provider: ICodeGenerationProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  public getActiveProvider(): ICodeGenerationProvider {
    return this.providers.get(this.activeProviderId) || this.sovereignFallback;
  }

  public listProviders(): readonly ICodeGenerationProvider[] {
    return Array.from(this.providers.values());
  }

  public approveGate(gateId: string, signedToken: string): boolean {
    return this.authGate.approveGate(gateId, signedToken);
  }

  /**
   * Generates code with human authorization gate evaluation.
   */
  public async generateCode(
    request: CodeGenerationRequest
  ): Promise<Readonly<CodeGenerationResult>> {
    const provider = this.getActiveProvider().getStatus() === 'AVAILABLE' ? this.getActiveProvider() : this.sovereignFallback;
    const baseResult = await provider.generateCode(request);

    // Build planned file operation
    const targetPath = request.targetFilePath || baseResult.filename;
    const isDestructive = Boolean(
      request.isDestructiveAllowed ||
      request.actionKind === 'MODIFY_CODE' ||
      targetPath.includes('package.json') ||
      targetPath.includes('tsconfig.json')
    );

    const fileOp: CodeFileOperation = Object.freeze({
      operationId: `OP_${deterministicHash(`${targetPath}:${baseResult.code.length}`).slice(2, 10)}`,
      targetPath,
      operationType: isDestructive ? 'OVERWRITE' : 'CREATE',
      content: baseResult.code,
      originalContent: request.existingFiles ? Object.values(request.existingFiles)[0] : undefined,
      isDestructive,
      riskReason: isDestructive ? 'Operation modifies existing source code or critical configuration.' : undefined,
    });

    const gate = this.authGate.evaluateOperations([fileOp], request.authorizationToken);

    const planId = `CPLAN_${deterministicHash(`${request.prompt}:${gate.gateId}`).slice(2, 10)}`;
    const executionPlan: CodeGenerationExecutionPlan = Object.freeze({
      planId,
      actionKind: request.actionKind || 'WRITE_CODE',
      prompt: request.prompt,
      language: request.language || baseResult.language,
      fileOperations: Object.freeze([fileOp]),
      authorizationGate: gate,
      isExecutable: gate.status === 'APPROVED',
      planChecksum: deterministicHash(`${planId}:${gate.status}:${fileOp.operationId}`),
      timestamp: Date.now(),
    });

    return Object.freeze({
      ...baseResult,
      executionPlan,
    });
  }

  public async explainCode(
    code: string,
    language?: ProgrammingLanguage
  ): Promise<Readonly<CodeExplanationResult>> {
    return explainCodeSnippet(code, language);
  }

  public async debugCode(
    request: CodeDebugRequest
  ): Promise<Readonly<CodeDebugResult>> {
    return debugCodeSnippet(request);
  }

  public async refactorCode(
    request: CodeRefactorRequest
  ): Promise<Readonly<CodeRefactorResult>> {
    return refactorCodeSnippet(request);
  }

  public async generateTests(
    request: TestGenerationRequest
  ): Promise<Readonly<TestGenerationResult>> {
    return synthesizeTests(request);
  }
}
