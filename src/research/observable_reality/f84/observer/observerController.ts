/**
 * 3D Memory Studio — Funnel 84
 * Observer: Observer Controller & Transformations
 */

import { ObserverState } from '../types';
import { createObserverState } from './observerState';

export class ObserverController {
  private currentObserver: ObserverState;

  constructor(initialObserver: ObserverState) {
    this.currentObserver = initialObserver;
  }

  public getObserver(): ObserverState {
    return this.currentObserver;
  }

  public setObserver(observer: ObserverState): void {
    this.currentObserver = observer;
  }

  public translate(dx: number, dy: number, dz = 0, dw = 0): ObserverState {
    const [x = 0, y = 0, z = 0, w = 0] = this.currentObserver.position;
    this.currentObserver = createObserverState(
      this.currentObserver.observerId,
      this.currentObserver.name,
      {
        ...this.currentObserver,
        position: [x + dx, y + dy, z + dz, w + dw],
      }
    );
    return this.currentObserver;
  }

  public rotate(dYaw: number, dPitch: number, dRoll = 0): ObserverState {
    const [yaw = 0, pitch = 0, roll = 0] = this.currentObserver.orientation;
    this.currentObserver = createObserverState(
      this.currentObserver.observerId,
      this.currentObserver.name,
      {
        ...this.currentObserver,
        orientation: [yaw + dYaw, pitch + dPitch, roll + dRoll],
      }
    );
    return this.currentObserver;
  }

  public zoom(factor: number): ObserverState {
    const newZoom = Math.max(0.1, Math.min(10.0, this.currentObserver.zoom * factor));
    this.currentObserver = createObserverState(
      this.currentObserver.observerId,
      this.currentObserver.name,
      {
        ...this.currentObserver,
        zoom: Number(newZoom.toFixed(4)),
      }
    );
    return this.currentObserver;
  }

  public setDimension(dim: number): ObserverState {
    this.currentObserver = createObserverState(
      this.currentObserver.observerId,
      this.currentObserver.name,
      {
        ...this.currentObserver,
        dimension: dim,
      }
    );
    return this.currentObserver;
  }

  public reset(baselineObserver: ObserverState): ObserverState {
    this.currentObserver = baselineObserver;
    return this.currentObserver;
  }
}
