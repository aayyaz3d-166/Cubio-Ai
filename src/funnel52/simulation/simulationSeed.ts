/**
 * 3D Memory Studio — Funnel 52
 * Deterministic PRNG & Hashing Engine
 */

/**
 * Computes deterministic FNV-1a hash value as integer
 */
export function seededHash(input: string, seed = 0x811c9dc5): number {
  let hash = seed;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Generates deterministic pseudo-random float [0, 1) from string input
 */
export function seededRandom(input: string, seed = 42): number {
  const h = seededHash(`${input}:${seed}`);
  return (h % 1000000) / 1000000;
}
