/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Deterministic Utilities
 *
 * Enforces zero random variation (σ² = 0) across all model construction operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicModelId(sourceRealityId: string, count: number): string {
  return `MDL_${sourceRealityId}_N${count.toString().padStart(3, '0')}`;
}

export function generateDeterministicMutationId(stepIndex: number, op: string): string {
  return `MUT_P65_S${stepIndex.toString().padStart(3, '0')}_${op}`;
}
