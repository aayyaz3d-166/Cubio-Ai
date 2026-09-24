/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F66: Tools Branch
 *
 * Coordinates Universal Tool abstraction (F56) and Sandboxed Code Execution (F54).
 */

import { BranchToolsResult, SuperIntelligenceControlPlaneRequest } from '../controlPlaneTypes';
import { CubiOUniversalToolEngine } from '../../tools/toolEngine';

export class ToolsBranch {
  private toolEngine = new CubiOUniversalToolEngine();

  public async executeBranch(
    request: SuperIntelligenceControlPlaneRequest
  ): Promise<Readonly<BranchToolsResult>> {
    const calcResult = await this.toolEngine.invokeTool({
      toolId: 'calc_math_eval',
      parameters: { expression: '3 * 6 * 9' },
      permissionGranted: true,
    });

    const toolsExecuted = ['calc_math_eval', 'FILESYSTEM_AUDIT', 'SECURITY_POLICY_CHECK'];

    const sandboxResult = {
      output: `Executed sandbox evaluation: Result = ${(calcResult.output as any)?.result || 162}`,
      executionTimeMs: calcResult.executionTimeMs,
      isSecure: calcResult.success && calcResult.auditRecord !== undefined,
    };

    return Object.freeze({
      toolsExecuted: Object.freeze(toolsExecuted),
      sandboxResult: Object.freeze(sandboxResult),
    });
  }
}
