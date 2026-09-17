/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Determinism Utilities & Index Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all index operations, searches, and sortings.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicIndexRecordId(
  userId: string,
  entityType: string,
  entityId: string
): string {
  const hashKey = deterministicHash(`${userId}_${entityType}_${entityId}`);
  return `IDX_REC_P610_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicTagId(tagName: string): string {
  const hashKey = deterministicHash(tagName.toLowerCase().trim());
  return `TAG_P610_${hashKey.slice(0, 8)}`;
}
