/**
 * 3D Memory Studio — Funnel 73
 * Bounded Boot Event History Tracker (Max <= 50 events)
 */

import { BootEvent, BootPhase } from '../types';

export const MAX_BOOT_EVENTS = 50;

export class BootEventHistory {
  private events: BootEvent[] = [];

  public addEvent(
    phase: BootPhase,
    message: string,
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO'
  ): void {
    const event: BootEvent = {
      timestamp: Date.now(),
      phase,
      message,
      level,
    };

    this.events.push(event);

    if (this.events.length > MAX_BOOT_EVENTS) {
      this.events = this.events.slice(-MAX_BOOT_EVENTS);
    }
  }

  public getEvents(): readonly BootEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
  }
}
