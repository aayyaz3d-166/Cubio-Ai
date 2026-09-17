/**
 * 3D Memory Studio — Funnel 83
 * Frame-Bound Projection Engine
 */

import { ObserverFrameConfig } from '../types';
import { FullState, ObservableRepresentation, ObservationFrame } from '../../f82/types';
import { ObservableProjectionEngine } from '../../f82/projection/observableProjectionEngine';
import { toF82Observer } from '../core/observerFrame';

export class FrameProjectionEngine {
  private baseEngine = new ObservableProjectionEngine();

  public projectFrame(
    state: FullState,
    frameConfig: ObserverFrameConfig
  ): { representation: ObservableRepresentation; frame: ObservationFrame } {
    const observer = toF82Observer(frameConfig);
    const representation = this.baseEngine.project(state, observer);
    const frame = this.baseEngine.renderFrame(representation, observer);

    return { representation, frame };
  }
}
