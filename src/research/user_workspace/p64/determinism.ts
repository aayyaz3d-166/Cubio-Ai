/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Deterministic Utilities
 *
 * Enforces zero random variation (σ² = 0) across all fusion and candidate-space computations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicFusionId(step: number, keyCount: number): string {
  return `FUSION_S${step.toString().padStart(3, '0')}_K${keyCount}`;
}
