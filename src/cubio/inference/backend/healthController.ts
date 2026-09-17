/**
 * CubiO — Step 87 Backend Health Controller
 */

import { BackendHealthStatus } from '../types';
import { InferenceTelemetry } from '../telemetry/inferenceTelemetry';

export class HealthController {
  private static startTime = Date.now();

  public static getHealth(activeSessions = 1): BackendHealthStatus {
    const stats = InferenceTelemetry.getStats();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return Object.freeze({
      status: 'HEALTHY',
      modelLoaded: true,
      checkpointHash: '068cad70fa3850652e6ebc0ad7a49847568f32e6eda5a8527e5893de9a7b8939',
      activeSessions,
      totalRequestsHandled: stats.totalRequests,
      averageLatencyMs: stats.avgLatencyMs,
      uptimeSeconds: uptime,
      fallbackOccurred: stats.fallbackCount > 0,
    });
  }
}
