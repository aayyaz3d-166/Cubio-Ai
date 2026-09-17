/**
 * 3D Memory Studio — Funnel 73
 * Boot Diagnostics Aggregator
 */

import { BootDiagnosticsData, BootPhase, BootEvent, BootPerformanceMetrics } from '../types';

export class BootDiagnosticsAggregator {
  public compileReport(params: {
    rootMounted: boolean;
    rendererAvailable: boolean;
    sceneAvailable: boolean;
    cameraAvailable: boolean;
    studioAvailable: boolean;
    f72Ready: boolean;
    databaseAvailable: boolean;
    persistenceAvailable: boolean;
    finalState: BootPhase;
    failedPhase?: BootPhase;
    errorMessage?: string;
    events: readonly BootEvent[];
    metrics: BootPerformanceMetrics;
  }): BootDiagnosticsData {
    return {
      rootMounted: params.rootMounted,
      rendererAvailable: params.rendererAvailable,
      sceneAvailable: params.sceneAvailable,
      cameraAvailable: params.cameraAvailable,
      studioAvailable: params.studioAvailable,
      f72Ready: params.f72Ready,
      databaseAvailable: params.databaseAvailable,
      persistenceAvailable: params.persistenceAvailable,
      finalState: params.finalState,
      failedPhase: params.failedPhase,
      errorMessage: params.errorMessage,
      events: [...params.events],
      metrics: params.metrics,
    };
  }
}
