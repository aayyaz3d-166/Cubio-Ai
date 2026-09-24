/**
 * CubiO — Universal Spatial Operating Environment
 * Step 73: Reasoning Tool Registry
 *
 * Manages standard sandboxed tools for reasoning trajectories:
 * - spatial_calc: 3D coordinates, rotations, topology
 * - cas_query: Content-Addressed Storage CID lookups
 * - vcf_lookup: Vector Coherence Fabric multi-modal alignments
 * - math_eval: Symbolic math & numerical bounds
 * - state_verify: Invariant verification & reflection
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ToolDefinition } from '../types';

export class ToolRegistry {
  private static readonly TOOLS: Record<string, ToolDefinition> = {
    spatial_calc: {
      toolName: 'spatial_calc',
      description: 'Calculates 3D geometric transformations and vertex meshes',
      schema: { action: 'string', count: 'number' },
      isSandboxed: true,
      executionTimeoutMs: 250,
    },
    cas_query: {
      toolName: 'cas_query',
      description: 'Queries Content-Addressed Storage for weight and embedding shards',
      schema: { queryCID: 'string' },
      isSandboxed: true,
      executionTimeoutMs: 150,
    },
    vcf_lookup: {
      toolName: 'vcf_lookup',
      description: 'Looks up multi-modal alignment vectors from Vector Coherence Fabric',
      schema: { alignmentTier: 'string' },
      isSandboxed: true,
      executionTimeoutMs: 150,
    },
    math_eval: {
      toolName: 'math_eval',
      description: 'Evaluates symbolic expressions and verifies mathematical proofs',
      schema: { mode: 'string' },
      isSandboxed: true,
      executionTimeoutMs: 200,
    },
    state_verify: {
      toolName: 'state_verify',
      description: 'Verifies 369 harmonic resonance and state invariants',
      schema: { harmonicOrder: 'number' },
      isSandboxed: true,
      executionTimeoutMs: 100,
    },
  };

  /**
   * Retrieves all registered tool definitions.
   */
  public static getTools(): Record<string, ToolDefinition> {
    return Object.freeze({ ...this.TOOLS });
  }

  /**
   * Retrieves a specific tool definition.
   */
  public static getTool(name: string): ToolDefinition | undefined {
    return this.TOOLS[name];
  }
}
