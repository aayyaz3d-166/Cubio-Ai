/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Causality Engine
 *
 * Implements strict causality auditing across all R9 domains:
 * Reality → State → Observation → Reality Object → Spatial → Workspace → Visual → Interaction → Geometry → Topology → Measurement → Boolean → Edit → Undo/Redo → Camera/UI.
 *
 * PRIMARY INVARIANT: Every downstream operation MUST maintain ΔReality = 0.
 */

import { GeometryCausalityEvent } from './types';
import { deterministicHash } from './determinism';

export class R9CausalityAuditor {
  private _events: GeometryCausalityEvent[] = [];
  private _sequence = 0;

  /**
   * Records a causality event and audits ΔReality invariant.
   */
  public logEvent(
    operation: string,
    domain: string,
    realityChecksumBefore: string,
    realityChecksumAfter: string
  ): GeometryCausalityEvent {
    const isRealityInvariant = realityChecksumBefore === realityChecksumAfter;
    const seq = this._sequence++;
    const eventId = `CAUS_R9_${deterministicHash(`${operation}_${domain}_${seq}`)}`;

    const event: GeometryCausalityEvent = Object.freeze({
      eventId,
      operation,
      domain,
      realityChecksumBefore,
      realityChecksumAfter,
      isRealityInvariant,
      sequence: seq,
    });

    this._events.push(event);
    return event;
  }

  /**
   * Retrieves all recorded causality events.
   */
  public getEvents(): readonly GeometryCausalityEvent[] {
    return Object.freeze([...this._events]);
  }

  /**
   * Audits that ALL downstream events satisfy ΔReality = 0.
   */
  public verifyInvariant(): boolean {
    return this._events.every((e) => e.isRealityInvariant);
  }

  /**
   * Resets the auditor.
   */
  public reset(): void {
    this._events = [];
    this._sequence = 0;
  }
}
