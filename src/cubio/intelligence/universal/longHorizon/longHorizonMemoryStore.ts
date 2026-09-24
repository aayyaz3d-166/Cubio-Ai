/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F64: Long-Horizon Memory Store
 *
 * Pillar 5: Multi-session episodic memory persistence & state restoration.
 */

import { deterministicHash } from '../../../state/determinism';
import { LongHorizonMemoryState, ProjectSessionSnapshot } from './types';

export class LongHorizonMemoryStore {
  private snapshots: Map<string, ProjectSessionSnapshot[]> = new Map();

  public saveSnapshot(snapshot: ProjectSessionSnapshot): void {
    const list = this.snapshots.get(snapshot.projectId) || [];
    list.push(snapshot);
    this.snapshots.set(snapshot.projectId, list);
  }

  public getLatestSnapshot(projectId: string): ProjectSessionSnapshot | undefined {
    const list = this.snapshots.get(projectId);
    if (!list || list.length === 0) return undefined;
    return list[list.length - 1];
  }

  public getHistory(projectId: string): readonly ProjectSessionSnapshot[] {
    return Object.freeze(this.snapshots.get(projectId) || []);
  }

  public createInitialMemoryState(initialDecision: string): LongHorizonMemoryState {
    const historicalDecisions = [initialDecision];
    const episodicSnapshots = ['SESSION_01_INIT'];
    const memoryChecksum = deterministicHash(
      `MEMORY_STATE:1:${historicalDecisions.join(';')}`
    );

    return Object.freeze({
      sessionCount: 1,
      historicalDecisions: Object.freeze(historicalDecisions),
      episodicSnapshots: Object.freeze(episodicSnapshots),
      userPreferences: Object.freeze({ theme: 'Obsidian-Gold', autoConfirmNonDestructive: true }),
      memoryChecksum,
    });
  }

  public evolveMemoryState(
    current: LongHorizonMemoryState,
    newDecision: string,
    newSessionTag: string
  ): LongHorizonMemoryState {
    const sessionCount = current.sessionCount + 1;
    const historicalDecisions = [...current.historicalDecisions, newDecision];
    const episodicSnapshots = [...current.episodicSnapshots, newSessionTag];
    const memoryChecksum = deterministicHash(
      `MEMORY_STATE:${sessionCount}:${historicalDecisions.join(';')}`
    );

    return Object.freeze({
      sessionCount,
      historicalDecisions: Object.freeze(historicalDecisions),
      episodicSnapshots: Object.freeze(episodicSnapshots),
      userPreferences: current.userPreferences,
      memoryChecksum,
    });
  }
}
