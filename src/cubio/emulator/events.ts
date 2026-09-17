/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: CubiO Emulator Event Emitter Bus
 *
 * Strongly-typed event subscription system for reactive simulation state observation.
 */

import { CubiOState, CubiORelationship } from '../state/types';
import { CubiOHarmonic369 } from '../types';
import { MemoryIndexEntry, MemoryQueryFilter } from '../memory/types';
import { DimensionTransitionResult } from '../dimension/types';
import { EmulatorCommand, EmulatorResult } from './types';

export interface EmulatorEvents {
  stateCreated: { state: CubiOState; harmonic?: CubiOHarmonic369 };
  stateUpdated: { state: CubiOState; previousChecksum: string };
  stateRemoved: { stateId: string };
  stateTransformed: { transition: DimensionTransitionResult };
  relationCreated: { relation: CubiORelationship; sourceStateId: string; targetStateId: string };
  memoryStored: { indexEntry: MemoryIndexEntry };
  memoryRetrieved: { filter: MemoryQueryFilter; count: number };
  commandCompleted: { result: EmulatorResult };
  commandFailed: { command: EmulatorCommand; error: string };
}

export type EmulatorEventListener<K extends keyof EmulatorEvents> = (
  payload: EmulatorEvents[K]
) => void | Promise<void>;

export class EmulatorEventEmitter {
  private listeners: Map<keyof EmulatorEvents, Set<EmulatorEventListener<any>>> = new Map();

  public on<K extends keyof EmulatorEvents>(
    event: K,
    listener: EmulatorEventListener<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener);

    // Return unsubscribe function
    return () => {
      set.delete(listener);
    };
  }

  public emit<K extends keyof EmulatorEvents>(event: K, payload: EmulatorEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    for (const listener of set) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`Error in Emulator event listener for '${String(event)}':`, err);
      }
    }
  }

  public removeAllListeners(): void {
    this.listeners.clear();
  }
}
