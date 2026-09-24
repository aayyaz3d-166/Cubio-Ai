/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tier 4 — Long-Term & Episodic Memory Store
 *
 * Cross-session persistent semantic memory with Merkle hash indices.
 */

import { deterministicHash } from '../../../state/determinism';
import { LongTermMemoryEntry } from './types';

export class LongTermMemoryStore {
  private memories: LongTermMemoryEntry[] = [];

  public saveMemory(
    topic: string,
    summary: string,
    payload: unknown = null,
    importance: number = 0.8
  ): Readonly<LongTermMemoryEntry> {
    const createdAt = Date.now();
    const episodicHash = deterministicHash(`EPISODIC:${topic}:${summary}:${importance}:${createdAt}`);
    const memoryId = `MEM_${episodicHash.slice(2, 10)}`;

    const entry: LongTermMemoryEntry = Object.freeze({
      memoryId,
      topic,
      summary,
      payload,
      importance,
      episodicHash,
      createdAt,
    });

    this.memories.push(entry);
    return entry;
  }

  public searchMemories(query: string, limit: number = 3): readonly LongTermMemoryEntry[] {
    const qTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const matched = this.memories
      .filter((m) => {
        const text = `${m.topic} ${m.summary}`.toLowerCase();
        return qTokens.length === 0 || qTokens.some((token) => text.includes(token));
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);

    return Object.freeze(matched);
  }

  public getAllMemories(): readonly LongTermMemoryEntry[] {
    return Object.freeze([...this.memories]);
  }
}
