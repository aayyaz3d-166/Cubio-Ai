/**
 * CUBiO AI — Phase 3 / Task 05: One Language Node Declaration Engine
 * ===================================================================
 *
 * Unified compiler, parser, validator, and runtime factory for CUBiO Node
 * Declarations authored in sovereign One Language declarative syntax.
 */

import {
  type CubiONodeDeclarationAST,
  type NodeDeclarationValidationResult,
  type NodeDeclarationCompilationResult,
} from './oneLanguageNodeDeclarationTypes';
import { CubiONodeDeclarationParser, NodeDeclarationParseError } from './oneLanguageNodeDeclarationParser';
import { CubiONodeDeclarationValidator } from './oneLanguageNodeDeclarationValidator';
import { CubiONodeDeclarationMapper } from './oneLanguageNodeDeclarationMapper';
import { type NodeRuntimeConfig } from './nodeRuntimeTypes';

const parser = new CubiONodeDeclarationParser();
const validator = new CubiONodeDeclarationValidator();
const mapper = new CubiONodeDeclarationMapper();

/**
 * Parses raw One Language source text into an unvalidated CubiONodeDeclarationAST.
 */
export function parseNodeDeclaration(source: string): CubiONodeDeclarationAST {
  return parser.parse(source);
}

/**
 * Pre-flight validates a parsed CubiONodeDeclarationAST.
 */
export function validateNodeDeclaration(ast: CubiONodeDeclarationAST): NodeDeclarationValidationResult {
  return validator.validate(ast);
}

/**
 * Compiles a One Language node declaration from source text.
 * Performs lexical parsing, semantic validation, and deterministic mapping.
 * Never mutates runtime or binds sockets on invalid declarations.
 */
export function compileNodeDeclaration(source: string): NodeDeclarationCompilationResult {
  let ast: CubiONodeDeclarationAST;
  try {
    ast = parser.parse(source);
  } catch (err: any) {
    return {
      success: false,
      errors: [
        {
          code: err.code ?? 'SYNTAX_ERROR',
          message: err.message,
          severity: 'ERROR',
          location: { line: err.line ?? 1, column: err.column ?? 1 },
        },
      ],
      warnings: [],
    };
  }

  const validation = validator.validate(ast);
  if (!validation.valid) {
    return {
      success: false,
      ast,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  try {
    const { runtimeConfig, canonicalConfig, identity } = mapper.mapToRuntimeConfig(ast);
    return {
      success: true,
      ast,
      runtimeConfig,
      canonicalConfig,
      identity,
      errors: [],
      warnings: validation.warnings,
    };
  } catch (err: any) {
    return {
      success: false,
      ast,
      errors: [
        {
          code: 'MAPPING_ERROR',
          message: err.message,
          severity: 'ERROR',
        },
      ],
      warnings: validation.warnings,
    };
  }
}

/**
 * Compiles a One Language node declaration and returns the resulting NodeRuntimeConfig.
 * Throws if parsing, validation, or mapping fails.
 */
export function compileNodeConfigFromDeclaration(source: string): NodeRuntimeConfig {
  const result = compileNodeDeclaration(source);
  if (!result.success || !result.runtimeConfig) {
    const errorMessages = result.errors.map(e => `[${e.code}] ${e.message}`).join('; ');
    throw new Error(`Failed to compile node declaration: ${errorMessages}`);
  }

  return result.runtimeConfig;
}
