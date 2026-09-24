/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-16: CubiO Network Gateway / Routing Layer (Types & Models)
 *
 * Master specification for unified coordinate-based request dispatching,
 * multi-protocol abstraction, route matching, and cross-layer authorization gates.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Every gateway request must resolve through sovereign identity (NET-01) and authorization (NET-03).
 * - Existing authorization or identity boundaries MUST NOT be bypassed.
 * - Faults in downstream subsystems must be captured safely into structured GatewayResponseEnvelopes.
 */

import { NetworkPermission } from '../authz/types';

export type GatewayProtocol = 'HTTP' | 'WEBSOCKET' | 'CNC_P2P' | 'SPATIAL_RPC';

export type GatewayRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'SUBSCRIBE' | 'STREAM';

export type GatewaySubsystem =
  | 'IDENTITY'
  | 'AUTH'
  | 'STORAGE'
  | 'MESSAGING'
  | 'OMAIL'
  | 'PREMIUM'
  | 'NOTIFICATION'
  | 'SERVICE'
  | 'DEVICE'
  | 'AGENT'
  | 'FILE'
  | 'SEARCH'
  | 'EVENT'
  | 'COORDINATE';

export interface GatewayRoute {
  readonly routeId: string; // RT_...
  readonly prefix: string; // e.g. "CUBIO://SERVICE", "CUBIO://FILE"
  readonly targetSubsystem: GatewaySubsystem;
  readonly requiredPermission?: NetworkPermission;
  readonly description: string;
  readonly isPublic?: boolean;
  readonly createdAt: number;
}

export interface GatewayRequestEnvelope {
  readonly requestId: string; // REQ_...
  readonly targetUri: string; // e.g. "CUBIO://SERVICE/system-echo-service/v1/ping"
  readonly method: GatewayRequestMethod;
  readonly protocol: GatewayProtocol;
  readonly tokenOrSession?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: any;
  readonly timestamp: number;
}

export interface GatewayResponseEnvelope {
  readonly requestId: string;
  readonly statusCode: number; // 200, 400, 401, 403, 404, 500, 503
  readonly statusText: string;
  readonly targetUri: string;
  readonly routedSubsystem?: GatewaySubsystem;
  readonly authenticatedCaller?: string; // Sovereign CUB-XXXXXXXX
  readonly body?: any;
  readonly error?: string;
  readonly traceHops: readonly string[];
  readonly durationMs: number;
  readonly timestamp: number;
}

export interface RegisterRouteInput {
  readonly prefix: string;
  readonly targetSubsystem: GatewaySubsystem;
  readonly requiredPermission?: NetworkPermission;
  readonly description?: string;
  readonly isPublic?: boolean;
}

export interface GatewayMetrics {
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly failedRequests: number;
  readonly rejectedAuthRequests: number;
  readonly averageLatencyMs: number;
}
