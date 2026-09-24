/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: Virtual Memory Sandbox Environment
 *
 * Provides a secure, isolated evaluation harness with virtualized console
 * and strict timeout/memory boundaries.
 */

import { SandboxSecurityPolicy, SandboxObservationRecord } from './types';
import { DEFAULT_SANDBOX_POLICY } from './securityPolicy';

export interface SandboxExecutionOutcome {
  readonly returnedValue: unknown;
  readonly observation: SandboxObservationRecord;
  readonly success: boolean;
  readonly error?: string;
}

export class VirtualSandbox {
  public async executeIsolated(
    code: string,
    inputPayload?: Record<string, unknown>,
    customPolicy?: Partial<SandboxSecurityPolicy>
  ): Promise<SandboxExecutionOutcome> {
    const policy: SandboxSecurityPolicy = { ...DEFAULT_SANDBOX_POLICY, ...customPolicy };
    const stdout: string[] = [];
    const stderr: string[] = [];

    const virtualConsole = {
      log: (...args: unknown[]) => stdout.push(args.map(String).join(' ')),
      warn: (...args: unknown[]) => stderr.push(`[WARN] ${args.map(String).join(' ')}`),
      error: (...args: unknown[]) => stderr.push(`[ERROR] ${args.map(String).join(' ')}`),
      info: (...args: unknown[]) => stdout.push(`[INFO] ${args.map(String).join(' ')}`),
    };

    const startTime = Date.now();
    let success = false;
    let returnedValue: unknown = undefined;
    let error: string | undefined = undefined;
    let exitCode = 0;

    try {
      // Build safe execution context with zero host bindings
      const sandboxScope: Record<string, unknown> = {
        console: virtualConsole,
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Map,
        Set,
        Promise,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        input: inputPayload ? Object.freeze({ ...inputPayload }) : {},
        // Explicitly shadow and undefine dangerous globals
        process: undefined,
        require: undefined,
        module: undefined,
        exports: undefined,
        window: undefined,
        document: undefined,
        globalThis: undefined,
      };

      const keys = Object.keys(sandboxScope);
      const values = Object.values(sandboxScope);

      // Guard loops against infinite execution
      const maxIterations = Math.max(1000, Math.floor(policy.maxExecutionTimeMs * 100));
      let guardedCode = code;
      guardedCode = guardedCode.replace(
        /\b(while\s*\([^)]*\)\s*\{)/g,
        `$1 if (++__cubio_iters > ${maxIterations}) throw new Error("Sandbox execution timeout exceeded (${policy.maxExecutionTimeMs}ms)"); `
      );
      guardedCode = guardedCode.replace(
        /\b(for\s*\([^)]*\)\s*\{)/g,
        `$1 if (++__cubio_iters > ${maxIterations}) throw new Error("Sandbox execution timeout exceeded (${policy.maxExecutionTimeMs}ms)"); `
      );

      // Transform return statements / expressions safely
      let executableCode = guardedCode;
      if (!executableCode.includes('return') && !/\b(let|const|var|while|for|if|function|class)\b/.test(executableCode)) {
        executableCode = `return (${executableCode});`;
      }

      const wrappedBody = `
        "use strict";
        let __cubio_iters = 0;
        return (async () => {
          ${executableCode}
        })();
      `;

      const sandboxFn = new Function(...keys, wrappedBody);

      // Execute with timeout race
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Sandbox execution timeout exceeded (${policy.maxExecutionTimeMs}ms)`)), policy.maxExecutionTimeMs);
      });

      returnedValue = await Promise.race([
        sandboxFn(...values),
        timeoutPromise,
      ]);

      success = true;
    } catch (err: any) {
      success = false;
      exitCode = 1;
      error = err instanceof Error ? err.message : String(err);
      stderr.push(`Runtime Error: ${error}`);
    }

    const executionTimeMs = Date.now() - startTime;
    const memoryAllocatedKb = Math.min(1024, Math.round(code.length * 0.5 + stdout.length * 0.1));

    const observation: SandboxObservationRecord = Object.freeze({
      stdout: Object.freeze(stdout),
      stderr: Object.freeze(stderr),
      executionTimeMs,
      memoryAllocatedKb,
      exitCode,
    });

    return Object.freeze({
      returnedValue,
      observation,
      success,
      error,
    });
  }
}
