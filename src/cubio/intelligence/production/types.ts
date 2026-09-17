/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F22: CubiO Intelligence Production Core Engine (Types & Contracts)
 *
 * Master specification for enterprise security gateways, real-time telemetry monitoring,
 * circuit breaker self-healing fault recovery, and production deployment readiness.
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStatus {
  readonly engineId: string;
  readonly state: CircuitBreakerState;
  readonly consecutiveFailures: number;
  readonly failureThreshold: number;
  readonly lastFailureTime?: number;
  readonly cooldownMs: number;
}

export interface ProductionSecurityConfig {
  readonly authMode: 'SOVEREIGN_TOKEN' | 'HMAC_MERKLE';
  readonly minResonanceThreshold: number;
  readonly allowedTiers: readonly string[];
}

export interface ProductionTelemetrySnapshot {
  readonly timestamp: number;
  readonly clusterStatus: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  readonly activeEnginesCount: number;
  readonly uptimeSeconds: number;
  readonly totalRequests: number;
  readonly errorRatePercent: number;
  readonly avgConvergenceLatencyMs: number;
  readonly circuitBreakersTripped: number;
  readonly snapshotChecksum: string;
}

export interface ProductionDeploymentReadiness {
  readonly readinessId: string;
  readonly isProductionReady: boolean;
  readonly securityVerified: boolean;
  readonly monitoringActive: boolean;
  readonly faultToleranceTested: boolean;
  readonly activeVersion: string;
  readonly evaluatedFunnelsCount: number; // 22 for F1-F22
  readonly readinessChecksum: string;
}
