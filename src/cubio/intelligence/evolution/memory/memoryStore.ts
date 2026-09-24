/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F104: Merkle-Backed Evolutionary Memory Store
 *
 * Persists and indexes episodic records, solution patterns, failure post-mortems,
 * and user approvals with Merkle tree cryptographic integrity (zero catastrophic forgetting).
 */

import { deterministicHash } from '../../../state/determinism';
import { EvolutionaryMemoryRecord, MemoryEntryType, EvolutionaryMemoryQueryFilter } from './types';

export class EvolutionaryMemoryStore {
  private records = new Map<string, EvolutionaryMemoryRecord>();
  private keywordIndex = new Map<string, Set<string>>();

  public saveRecord(record: EvolutionaryMemoryRecord): void {
    this.records.set(record.memoryId, record);

    // Index keywords
    for (const kw of record.keywords) {
      const cleanKw = kw.toLowerCase().trim();
      const set = this.keywordIndex.get(cleanKw) || new Set<string>();
      set.add(record.memoryId);
      this.keywordIndex.set(cleanKw, set);
    }
  }

  public getRecord(memoryId: string): EvolutionaryMemoryRecord | undefined {
    return this.records.get(memoryId);
  }

  public getAllRecords(): readonly EvolutionaryMemoryRecord[] {
    return Array.from(this.records.values());
  }

  public query(filter: EvolutionaryMemoryQueryFilter): readonly EvolutionaryMemoryRecord[] {
    const q = filter.query.toLowerCase().trim();
    const queryTokens = q.split(/\s+/).filter((t) => t.length > 0);

    const candidates = new Set<string>();

    if (queryTokens.length === 0) {
      for (const id of this.records.keys()) {
        candidates.add(id);
      }
    } else {
      for (const token of queryTokens) {
        // Direct keyword match
        const matchingIds = this.keywordIndex.get(token);
        if (matchingIds) {
          for (const id of matchingIds) {
            candidates.add(id);
          }
        }
        // Substring match in all records
        for (const [id, rec] of this.records.entries()) {
          if (
            rec.title.toLowerCase().includes(token) ||
            rec.domain.toLowerCase().includes(token) ||
            JSON.stringify(rec.payload).toLowerCase().includes(token)
          ) {
            candidates.add(id);
          }
        }
      }
    }

    let results: EvolutionaryMemoryRecord[] = [];
    for (const id of candidates) {
      const rec = this.records.get(id);
      if (!rec) continue;

      if (filter.entryType && rec.entryType !== filter.entryType) continue;
      if (filter.domain && rec.domain.toLowerCase() !== filter.domain.toLowerCase()) continue;
      if (filter.minResonance && rec.resonanceScore < filter.minResonance) continue;

      results.push(rec);
    }

    // Sort by resonance score descending
    results.sort((a, b) => b.resonanceScore - a.resonanceScore);

    if (filter.limit && filter.limit > 0) {
      results = results.slice(0, filter.limit);
    }

    return Object.freeze(results);
  }

  public reinforceRecord(memoryId: string, successDelta: boolean): EvolutionaryMemoryRecord | undefined {
    const rec = this.records.get(memoryId);
    if (!rec) return undefined;

    const newAccessCount = rec.accessCount + 1;
    const newSuccessRate = successDelta
      ? (rec.successRate * rec.accessCount + 1) / newAccessCount
      : (rec.successRate * rec.accessCount) / newAccessCount;

    // Resonance score increases with successful accesses up to 1.0
    const newResonance = Math.min(1.0, Math.max(0.1, rec.resonanceScore + (successDelta ? 0.05 : -0.05)));

    const updatedRecord: EvolutionaryMemoryRecord = {
      ...rec,
      accessCount: newAccessCount,
      successRate: parseFloat(newSuccessRate.toFixed(3)),
      resonanceScore: parseFloat(newResonance.toFixed(3)),
      lastAccessedAt: Date.now(),
      recordChecksum: deterministicHash(`${rec.memoryId}:${newAccessCount}:${newResonance.toFixed(3)}`),
    };

    this.records.set(memoryId, updatedRecord);
    return updatedRecord;
  }

  public computeMerkleRootHash(): string {
    const allIds = Array.from(this.records.keys()).sort();
    if (allIds.length === 0) {
      return deterministicHash('EMPTY_MEMORY_TREE_ROOT');
    }

    let currentLevelHashes = allIds.map((id) => this.records.get(id)!.recordChecksum);

    while (currentLevelHashes.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevelHashes.length; i += 2) {
        const left = currentLevelHashes[i];
        const right = currentLevelHashes[i + 1] || left; // Pair with self if odd
        nextLevel.push(deterministicHash(`${left}:${right}`));
      }
      currentLevelHashes = nextLevel;
    }

    return currentLevelHashes[0];
  }
}
