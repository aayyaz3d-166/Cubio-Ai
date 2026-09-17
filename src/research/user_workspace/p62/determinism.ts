/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Deterministic ID & Hash Utilities
 *
 * Enforces zero random variation (σ² = 0).
 * Never uses Math.random() or non-deterministic timestamps for IDs or checksums.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicObjectId(existingCount: number, prefix = 'P62_OBJ'): string {
  const code = String.fromCharCode(65 + (existingCount % 26));
  const num = Math.floor(existingCount / 26);
  return `${prefix}_${code}${num > 0 ? num : ''}`;
}

export function generateDeterministicMutationId(stepIndex: number, action: string): string {
  return `MUT_${stepIndex.toString().padStart(4, '0')}_${action}`;
}
