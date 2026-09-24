/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F78: Observability Telemetry Exporter
 *
 * Emits Prometheus metrics, OpenTelemetry spans, and health probe states.
 */

import { deterministicHash } from '../../../state/determinism';

export interface TelemetryTraceSpan {
  readonly spanId: string;
  readonly name: string;
  readonly durationMs: number;
  readonly status: 'OK' | 'ERROR';
}

export class ObservabilityTelemetryExporter {
  private spans: TelemetryTraceSpan[] = [];
  private metrics: Map<string, number> = new Map();

  public recordSpan(name: string, durationMs: number, status: 'OK' | 'ERROR' = 'OK'): void {
    const spanId = `SPAN_${deterministicHash(`${name}:${Date.now()}`).slice(2, 10)}`;
    this.spans.push({ spanId, name, durationMs, status });
  }

  public incrementMetric(metricName: string, value = 1): void {
    const curr = this.metrics.get(metricName) || 0;
    this.metrics.set(metricName, curr + value);
  }

  public exportPrometheusMetrics(): string {
    const lines: string[] = ['# HELP cubio_requests_total Total number of universal intelligence requests'];
    lines.push('# TYPE cubio_requests_total counter');
    for (const [key, val] of this.metrics.entries()) {
      lines.push(`cubio_${key}_total ${val}`);
    }
    return lines.join('\n');
  }

  public getRecordedSpans(): readonly TelemetryTraceSpan[] {
    return Object.freeze([...this.spans]);
  }
}
