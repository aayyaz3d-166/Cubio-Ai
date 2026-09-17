/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Determinism Utilities & Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all Space, Experiment, and SavedState identities.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicSpaceId(userId: string, count: number): string {
  const hashKey = deterministicHash(`${userId}_SPACE_${count}`);
  return `SPACE_P68_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicExperimentId(spaceId: string, count: number): string {
  const hashKey = deterministicHash(`${spaceId}_EXP_${count}`);
  return `EXP_P68_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSavedStateId(spaceId: string, count: number): string {
  const hashKey = deterministicHash(`${spaceId}_STATE_${count}`);
  return `STATE_P68_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicRecentViewId(spaceId: string, count: number): string {
  const hashKey = deterministicHash(`${spaceId}_VIEW_${count}`);
  return `VIEW_P68_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicLineageId(sourceSpaceId: string, count: number): string {
  const hashKey = deterministicHash(`${sourceSpaceId}_LIN_${count}`);
  return `LIN_P68_${hashKey.slice(0, 8)}`;
}
