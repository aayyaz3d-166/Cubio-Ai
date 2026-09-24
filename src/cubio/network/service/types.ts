/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-10: CubiO Service / API Network (Types & Models)
 *
 * Formal specification for sovereign service registration, API contracts,
 * authenticated service discovery, contract-driven request routing,
 * rate limiting, and execution sandboxing.
 *
 * ARCHITECTURAL INVARIANT:
 * - Every service is bound to a provider identity (CUB-XXXXXXXX or SYSTEM).
 * - Every API request must resolve through NET-02 Authentication and NET-03 Authorization.
 * - Service coordinates map to CNC nodes (e.g. CUBIO://NETWORK/0/01/00005/API or custom).
 */

export type ServiceType =
  | 'CORE_SYSTEM'
  | 'COMMUNICATION'
  | 'STORAGE'
  | 'SPATIAL_COMPUTE'
  | 'IDENTITY'
  | 'BILLING'
  | 'CUSTOM_APP';

export type ServiceStatus =
  | 'ACTIVE'
  | 'DRAINING'
  | 'SUSPENDED'
  | 'DECOMMISSIONED';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiEndpointContract {
  readonly endpointId: string;
  readonly path: string; // e.g. "/v1/spatial/query"
  readonly method: HttpMethod;
  readonly requiredPermission: string; // e.g. "SERVICE_INVOKE", "STORAGE_READ"
  readonly rateLimitPerMinute?: number;
  readonly isPublic?: boolean;
  readonly description?: string;
}

export interface ServiceRegistration {
  readonly serviceId: string; // SRV_...
  readonly name: string; // e.g. "spatial-rendering-service"
  readonly coordinateUri: string; // CNC coordinate: CUBIO://SERVICE/0/01/00010/RENDER
  readonly serviceType: ServiceType;
  readonly providerCubId: string; // Sovereign CUB-XXXXXXXX or "SYSTEM"
  readonly version: string; // e.g. "1.0.0"
  readonly status: ServiceStatus;
  readonly endpoints: readonly ApiEndpointContract[];
  readonly registeredAt: number;
  readonly updatedAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface ServiceRequest {
  readonly requestId: string; // REQ_...
  readonly serviceIdOrName: string;
  readonly endpointPath: string;
  readonly method: HttpMethod;
  readonly callerTokenOrSession: string;
  readonly payload?: any;
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
}

export interface ServiceResponse {
  readonly requestId: string;
  readonly statusCode: number;
  readonly success: boolean;
  readonly data?: any;
  readonly error?: string;
  readonly executionTimeMs: number;
  readonly callerCubId: string;
  readonly serviceId: string;
  readonly traceCoordinate: string;
}

export interface ServiceContext {
  readonly callerCubId: string;
  readonly service: Readonly<ServiceRegistration>;
  readonly endpoint: Readonly<ApiEndpointContract>;
  readonly requestId: string;
  readonly timestamp: number;
}

export type ServiceHandlerFunction = (
  payload: any,
  context: ServiceContext
) => Promise<{ statusCode?: number; data?: any; error?: string }>;

export interface RegisterServiceInput {
  readonly name: string;
  readonly coordinateUri?: string;
  readonly serviceType: ServiceType;
  readonly version?: string;
  readonly endpoints: readonly ApiEndpointContract[];
  readonly handler: ServiceHandlerFunction;
  readonly metadata?: Record<string, any>;
}

export interface ServiceDiscoveryFilter {
  readonly serviceType?: ServiceType;
  readonly status?: ServiceStatus;
  readonly providerCubId?: string;
}
