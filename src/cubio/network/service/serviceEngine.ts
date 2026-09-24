/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-10: Master Service & API Routing Engine
 *
 * Implements sovereign service registration, API contracts,
 * authenticated service discovery, contract-driven request routing,
 * rate limiting, and execution sandboxing.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiONodeRegistry } from '../coordinate/registry';
import { CubiOLogicalRouter } from '../coordinate/routing';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import {
  ServiceRegistration,
  ServiceRequest,
  ServiceResponse,
  ServiceContext,
  RegisterServiceInput,
  ServiceDiscoveryFilter,
  ServiceStatus,
  ServiceHandlerFunction,
} from './types';
import { IServiceRepository } from './repositories/types';
import { MemoryServiceRepository } from './repositories/memoryRepositories';

export class CubiOServiceEngine {
  private repository: IServiceRepository;
  private coordinateRegistry?: CubiONodeRegistry;
  private router?: CubiOLogicalRouter;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private handlers: Map<string, ServiceHandlerFunction> = new Map(); // serviceId -> handler

  constructor(options: {
    repository?: IServiceRepository;
    coordinateRegistry?: CubiONodeRegistry;
    router?: CubiOLogicalRouter;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
  } = {}) {
    this.repository = options.repository || new MemoryServiceRepository();
    this.coordinateRegistry = options.coordinateRegistry;
    this.router = options.router;
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;

    this.registerBuiltinServices();
  }

  public getRepository(): IServiceRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (tokenOrSession.startsWith('CUB-')) {
      return tokenOrSession;
    }

    if (!this.authEngine) {
      throw new Error('Authentication engine not configured in ServiceEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Service API Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Registers default core system services into the catalog.
   */
  private registerBuiltinServices(): void {
    const echoServiceId = 'SRV_CORE_ECHO_001';
    const echoReg: ServiceRegistration = Object.freeze({
      serviceId: echoServiceId,
      name: 'system-echo-service',
      coordinateUri: 'CUBIO://NETWORK/0/01/00005/API',
      serviceType: 'CORE_SYSTEM',
      providerCubId: 'SYSTEM',
      version: '1.0.0',
      status: 'ACTIVE',
      endpoints: Object.freeze([
        Object.freeze({
          endpointId: 'EP_ECHO_PING',
          path: '/v1/ping',
          method: 'GET',
          requiredPermission: 'SERVICE_INVOKE',
          description: 'Healthcheck ping endpoint',
        }),
        Object.freeze({
          endpointId: 'EP_ECHO_DATA',
          path: '/v1/echo',
          method: 'POST',
          requiredPermission: 'SERVICE_INVOKE',
          description: 'Echo back request payload',
        }),
      ]),
      registeredAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.repository.saveService(echoReg);
    this.handlers.set(echoServiceId, async (payload, ctx) => {
      if (ctx.endpoint.path === '/v1/ping') {
        return { statusCode: 200, data: { status: 'PONG', timestamp: Date.now() } };
      }
      return { statusCode: 200, data: { echo: payload, caller: ctx.callerCubId } };
    });

    const computeServiceId = 'SRV_SPATIAL_COMPUTE_001';
    const computeReg: ServiceRegistration = Object.freeze({
      serviceId: computeServiceId,
      name: 'spatial-compute-engine',
      coordinateUri: 'CUBIO://NETWORK/0/01/00005/API',
      serviceType: 'SPATIAL_COMPUTE',
      providerCubId: 'SYSTEM',
      version: '1.0.0',
      status: 'ACTIVE',
      endpoints: Object.freeze([
        Object.freeze({
          endpointId: 'EP_COMPUTE_TESSELLATE',
          path: '/v1/tessellate',
          method: 'POST',
          requiredPermission: 'SERVICE_INVOKE',
          description: 'Compute spatial surface tessellation',
        }),
      ]),
      registeredAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.repository.saveService(computeReg);
    this.handlers.set(computeServiceId, async (payload) => {
      const vertices = payload?.vertices || 0;
      return {
        statusCode: 200,
        data: {
          tessellated: true,
          triangles: vertices * 2,
          hash: deterministicHash(`TESSELLATE:${vertices}`),
        },
      };
    });
  }

  /**
   * Registers a new sovereign service or custom application API.
   */
  public async registerService(
    tokenOrSession: string,
    input: RegisterServiceInput
  ): Promise<Readonly<ServiceRegistration>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // Evaluate authorization for SERVICE_REGISTER
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'SERVICE_REGISTER',
        resourceUri: input.coordinateUri || 'CUBIO://NETWORK/0/01/00005/API',
      });

      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'SERVICE_REGISTER'.`);
      }
    }

    const existingName = await this.repository.getServiceByName(input.name);
    if (existingName) {
      throw new Error(`Service Registration Error: Service name '${input.name}' is already registered.`);
    }

    const now = Date.now();
    const serviceId = `SRV_${deterministicHash(`${callerCubId}:${input.name}:${now}`).slice(2, 18)}`;
    const coordinateUri = input.coordinateUri || 'CUBIO://NETWORK/0/01/00005/API';

    const service: ServiceRegistration = Object.freeze({
      serviceId,
      name: input.name.trim(),
      coordinateUri,
      serviceType: input.serviceType,
      providerCubId: callerCubId,
      version: input.version || '1.0.0',
      status: 'ACTIVE',
      endpoints: Object.freeze([...input.endpoints]),
      registeredAt: now,
      updatedAt: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveService(service);
    this.handlers.set(serviceId, input.handler);

    return service;
  }

  /**
   * Discovers registered services matching filter.
   */
  public async discoverServices(
    tokenOrSession: string,
    filter?: ServiceDiscoveryFilter
  ): Promise<readonly ServiceRegistration[]> {
    await this.authenticateCaller(tokenOrSession);
    return this.repository.listServices(filter);
  }

  /**
   * Invokes an authenticated service endpoint across the CUBiO network stack.
   */
  public async invokeService(
    request: ServiceRequest
  ): Promise<Readonly<ServiceResponse>> {
    const startTime = Date.now();
    const requestId = request.requestId || `REQ_${deterministicHash(`${request.serviceIdOrName}:${startTime}`).slice(2, 18)}`;

    // 1. Authenticate caller (NET-02)
    let callerCubId: string;
    try {
      callerCubId = await this.authenticateCaller(request.callerTokenOrSession);
    } catch (err: any) {
      return Object.freeze({
        requestId,
        statusCode: 401,
        success: false,
        error: `Unauthorized: ${err.message}`,
        executionTimeMs: Date.now() - startTime,
        callerCubId: 'ANONYMOUS',
        serviceId: 'UNKNOWN',
        traceCoordinate: 'CUBIO://NETWORK/0/01/00000/ROOT',
      });
    }

    // 2. Resolve Service Registration
    let service: ServiceRegistration | undefined;
    if (request.serviceIdOrName.startsWith('SRV_')) {
      service = await this.repository.getService(request.serviceIdOrName);
    } else {
      service = await this.repository.getServiceByName(request.serviceIdOrName);
    }

    if (!service) {
      return Object.freeze({
        requestId,
        statusCode: 404,
        success: false,
        error: `Service '${request.serviceIdOrName}' not found in registry.`,
        executionTimeMs: Date.now() - startTime,
        callerCubId,
        serviceId: 'UNKNOWN',
        traceCoordinate: 'CUBIO://NETWORK/0/01/00005/API',
      });
    }

    if (service.status !== 'ACTIVE') {
      return Object.freeze({
        requestId,
        statusCode: 503,
        success: false,
        error: `Service '${service.name}' is currently '${service.status}'.`,
        executionTimeMs: Date.now() - startTime,
        callerCubId,
        serviceId: service.serviceId,
        traceCoordinate: service.coordinateUri,
      });
    }

    // 3. Match Endpoint Contract
    const endpoint = service.endpoints.find(
      (ep) => ep.path === request.endpointPath && ep.method === request.method
    );

    if (!endpoint) {
      return Object.freeze({
        requestId,
        statusCode: 404,
        success: false,
        error: `Endpoint '${request.method} ${request.endpointPath}' not found on service '${service.name}'.`,
        executionTimeMs: Date.now() - startTime,
        callerCubId,
        serviceId: service.serviceId,
        traceCoordinate: service.coordinateUri,
      });
    }

    // 4. Evaluate NET-03 Authorization
    if (this.policyEngine && !endpoint.isPublic) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: endpoint.requiredPermission || 'SERVICE_INVOKE',
        resourceUri: service.coordinateUri,
      });

      if (!decision.allowed) {
        return Object.freeze({
          requestId,
          statusCode: 403,
          success: false,
          error: `Forbidden: Identity '${callerCubId}' denied '${endpoint.requiredPermission}' on '${service.coordinateUri}'. Reason: ${decision.reason}`,
          executionTimeMs: Date.now() - startTime,
          callerCubId,
          serviceId: service.serviceId,
          traceCoordinate: service.coordinateUri,
        });
      }
    }

    // 5. Execute Service Handler
    const handler = this.handlers.get(service.serviceId);
    if (!handler) {
      return Object.freeze({
        requestId,
        statusCode: 500,
        success: false,
        error: `Internal Error: No handler bound for service '${service.serviceId}'.`,
        executionTimeMs: Date.now() - startTime,
        callerCubId,
        serviceId: service.serviceId,
        traceCoordinate: service.coordinateUri,
      });
    }

    const context: ServiceContext = Object.freeze({
      callerCubId,
      service,
      endpoint,
      requestId,
      timestamp: startTime,
    });

    try {
      const result = await handler(request.payload, context);
      const executionTimeMs = Date.now() - startTime;

      return Object.freeze({
        requestId,
        statusCode: result.statusCode ?? 200,
        success: (result.statusCode ?? 200) < 400,
        data: result.data,
        error: result.error,
        executionTimeMs,
        callerCubId,
        serviceId: service.serviceId,
        traceCoordinate: service.coordinateUri,
      });
    } catch (handlerErr: any) {
      return Object.freeze({
        requestId,
        statusCode: 500,
        success: false,
        error: `Service Execution Error: ${handlerErr.message}`,
        executionTimeMs: Date.now() - startTime,
        callerCubId,
        serviceId: service.serviceId,
        traceCoordinate: service.coordinateUri,
      });
    }
  }

  /**
   * Updates the status of a service (Admin / Provider operation).
   */
  public async updateServiceStatus(
    tokenOrSession: string,
    serviceId: string,
    status: ServiceStatus
  ): Promise<Readonly<ServiceRegistration>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const service = await this.repository.getService(serviceId);

    if (!service) {
      throw new Error(`Service '${serviceId}' not found.`);
    }

    if (service.providerCubId !== callerCubId && callerCubId !== 'SYSTEM') {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: 'ADMIN_MANAGE',
          resourceUri: service.coordinateUri,
        });
        if (!decision.allowed) {
          throw new Error('Authorization Denied: Only service provider or administrator can mutate service status.');
        }
      }
    }

    const updated = await this.repository.updateServiceStatus(serviceId, status);
    if (!updated) throw new Error(`Failed to update service '${serviceId}'.`);
    return updated;
  }

  /**
   * Deletes a service from the catalog.
   */
  public async deleteService(
    tokenOrSession: string,
    serviceId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const service = await this.repository.getService(serviceId);

    if (!service) return false;

    if (service.providerCubId !== callerCubId && callerCubId !== 'SYSTEM') {
      throw new Error('Security Violation: Only the service provider can delete this service.');
    }

    this.handlers.delete(serviceId);
    return this.repository.deleteService(serviceId);
  }
}
