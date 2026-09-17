/**
 * 3D Memory Studio — Funnel 65
 * Runtime Diagnostics Reporter
 */

import { RuntimeBootstrap } from '../runtime/runtimeBootstrap';
import { RuntimeDiagnosticReport } from '../types';

export class RuntimeDiagnosticsReporter {
  constructor(public readonly bootstrap: RuntimeBootstrap) {}

  public generateReport(): RuntimeDiagnosticReport {
    return this.bootstrap.getDiagnosticReport();
  }

  public isHealthy(): boolean {
    const r = this.generateReport();
    return r.rootMounted && (r.landingMounted || r.studioMounted) && r.rendererCreated;
  }
}
