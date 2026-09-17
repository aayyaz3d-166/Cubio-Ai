/**
 * 3D Memory Studio — Funnel 52
 * Real-Time Simulation Engine Controller
 */

import { SimulationWorldState, SimulationDimension, SimulationSpeed } from '../types';
import { createInitialSimulationWorld } from './simulationWorld';
import { simulationReducer, SimulationAction } from './simulationReducer';
import { DimensionalInformationState } from '../../funnel49/types';

export type SimulationWorldListener = (state: SimulationWorldState) => void;

const safeRaf =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (cb: (t: number) => void) => (setTimeout(() => cb(performance.now()), 16) as unknown as number);

const safeCaf =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);

export class RealTimeSimulationEngine {
  private state: SimulationWorldState;
  private listeners = new Set<SimulationWorldListener>();
  private rafId: number | null = null;
  private lastTimeMs: number | null = null;
  private isDestroyed = false;

  constructor(sourceStates?: readonly DimensionalInformationState[], initialDimension: SimulationDimension = 3, seed = 42) {
    this.state = createInitialSimulationWorld(sourceStates, initialDimension, seed);
    this.startLoop();
  }

  public getState(): SimulationWorldState {
    return this.state;
  }

  public dispatch(action: SimulationAction): void {
    if (this.isDestroyed) return;
    this.state = simulationReducer(this.state, action);
    this.notify();
  }

  public subscribe(listener: SimulationWorldListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    if (this.isDestroyed) return;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public pause(): void {
    this.dispatch({ type: 'PAUSE' });
  }

  public resume(): void {
    this.dispatch({ type: 'RESUME' });
  }

  public restart(): void {
    this.dispatch({ type: 'RESTART' });
  }

  public setSpeed(speed: SimulationSpeed): void {
    this.dispatch({ type: 'SET_SPEED', speed });
  }

  public setDimension(dimension: SimulationDimension): void {
    this.dispatch({ type: 'SET_DIMENSION', dimension });
  }

  public selectState(stateId: string | null): void {
    this.dispatch({ type: 'SELECT_STATE', stateId });
  }

  public setSearchQuery(query: string): void {
    this.dispatch({ type: 'SET_SEARCH_QUERY', query });
  }

  public setFilter(filter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL'): void {
    this.dispatch({ type: 'SET_FILTER', filter });
  }

  private startLoop(): void {
    if (this.rafId !== null || this.isDestroyed) return;

    this.lastTimeMs = performance.now();
    const tick = (now: number) => {
      if (this.isDestroyed) return;

      const last = this.lastTimeMs ?? now;
      const delta = Math.min(50, Math.max(0, now - last));
      this.lastTimeMs = now;

      if (this.state.isRunning && !this.state.isPaused) {
        this.state = simulationReducer(this.state, { type: 'TICK', deltaMs: delta });
        this.notify();
      }

      this.rafId = safeRaf(tick);
    };

    this.rafId = safeRaf(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      safeCaf(this.rafId);
      this.rafId = null;
    }
    this.lastTimeMs = null;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopLoop();
    this.listeners.clear();
  }
}
