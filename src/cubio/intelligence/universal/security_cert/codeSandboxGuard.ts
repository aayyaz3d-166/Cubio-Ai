/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F77: Code Sandbox Guard
 *
 * Enforces execution isolation inside ephemeral code sandboxes.
 */

export class CodeSandboxGuard {
  private forbiddenSyscalls = ['child_process', 'fs.unlinkSync', 'process.exit', 'cluster'];

  public validateCodeSandbox(sourceCode: string): {
    isIsolated: boolean;
    blockedSyscalls: readonly string[];
  } {
    const blockedSyscalls: string[] = [];

    for (const syscall of this.forbiddenSyscalls) {
      if (sourceCode.includes(syscall)) {
        blockedSyscalls.push(`BLOCKED_SYSCALL: ${syscall}`);
      }
    }

    return {
      isIsolated: blockedSyscalls.length === 0,
      blockedSyscalls: Object.freeze(blockedSyscalls),
    };
  }
}
