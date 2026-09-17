/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Determinism Utilities
 *
 * Enforces zero random variation (σ² = 0) across all parametric feature computations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicParamId(featureId: string, paramName: string): string {
  return `PRM_${featureId}_${paramName}`;
}

export function generateDeterministicFeatureId(type: string, count: number): string {
  return `FEAT_P67_${type}_${count.toString().padStart(3, '0')}`;
}
