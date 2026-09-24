/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Hermetic Mock Code Provider
 */

import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import {
  ICodeGenerationProvider,
  CodeGenerationRequest,
  CodeGenerationResult,
} from '../types';

export class MockCodeProvider implements ICodeGenerationProvider {
  public readonly providerId = 'cubio-mock-code-provider';
  public readonly providerName = 'Hermetic Mock Code Provider';

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'CODE_EXECUTION',
      name: this.providerName,
      version: '1.0.0-mock',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'CODE_GENERATION',
        'CODE_ANALYSIS',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  public async generateCode(
    request: CodeGenerationRequest
  ): Promise<Readonly<CodeGenerationResult>> {
    return Object.freeze({
      code: `// Mock Code: ${request.prompt}`,
      language: request.language || 'typescript',
      filename: request.targetFilePath || 'mockModule.ts',
      explanation: `Mock code generated for "${request.prompt}"`,
      imports: Object.freeze([]),
      exports: Object.freeze([]),
      lineCount: 1,
      complexityEstimate: 'O(1)',
      providerId: this.providerId,
      codeChecksum: 'MOCK_CODE_CHECKSUM',
    });
  }
}
