/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tier 1 — Working Memory Store
 *
 * Fast volatile scratchpad and turn-level intent variable cache.
 */

import { WorkingMemoryState } from './types';

export class WorkingMemoryStore {
  private scratchpad: Map<string, unknown> = new Map();
  private turnVariables: Map<string, unknown> = new Map();

  public set(key: string, value: unknown): void {
    this.scratchpad.set(key, value);
    this.turnVariables.set(key, value);
  }

  public get(key: string): unknown {
    return this.scratchpad.get(key);
  }

  public has(key: string): boolean {
    return this.scratchpad.has(key);
  }

  public delete(key: string): boolean {
    this.turnVariables.delete(key);
    return this.scratchpad.delete(key);
  }

  public clearTurnVariables(): void {
    this.turnVariables.clear();
  }

  public getState(): Readonly<WorkingMemoryState> {
    const scratch: Record<string, unknown> = {};
    for (const [k, v] of this.scratchpad.entries()) {
      scratch[k] = v;
    }

    const turnVars: Record<string, unknown> = {};
    for (const [k, v] of this.turnVariables.entries()) {
      turnVars[k] = v;
    }

    return Object.freeze({
      scratchpad: Object.freeze(scratch),
      activeTokensCount: Object.keys(scratch).length * 15,
      currentTurnVariables: Object.freeze(turnVars),
    });
  }
}
