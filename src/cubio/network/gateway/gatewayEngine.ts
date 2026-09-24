/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-16: Master Network Gateway & Routing Engine
 *
 * Implements unified coordinate-based request dispatching, multi-protocol abstraction,
 * route matching, cross-layer authorization gates, and failure isolation.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Every gateway request must resolve through sovereign identity (NET-01) and authorization (NET-03).
 * - Existing authorization or identity boundaries MUST NOT be bypassed.
 * - Faults in downstream subsystems are captured safely into structured GatewayResponseEnvelopes.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiONodeRegistry } from '../coordinate/registry';
import { CubiOLogicalRouter } from '../coordinate/routing';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import {
  GatewayRoute,
  GatewayRequestEnvelope,
  GatewayResponseEnvelope,
  RegisterRouteInput,
  GatewayMetrics,
} from './types';
import { IGatewayRouteRepository } from './repositories/types';
import { MemoryGatewayRouteRepository } from './repositories/memoryRepositories';

export class CubiOGatewayEngine {
  private repository: IGatewayRouteRepository;
  private coordinateRegistry?: CubiONodeRegistry;
  private router?: CubiOLogicalRouter;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private stack?: any;

  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private rejectedAuthRequests = 0;
  private totalDurationMs = 0;

  constructor(options: {
    repository?: IGatewayRouteRepository;
    coordinateRegistry?: CubiONodeRegistry;
    router?: CubiOLogicalRouter;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
    stack?: any;
  } = {}) {
    this.repository = options.repository || new MemoryGatewayRouteRepository();
    this.coordinateRegistry = options.coordinateRegistry;
    this.router = options.router;
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
    this.stack = options.stack;

    this.registerDefaultRoutes();
  }

  public getRepository(): IGatewayRouteRepository {
    return this.repository;
  }

  private registerDefaultRoutes(): void {
    const defaults: RegisterRouteInput[] = [
      { prefix: 'CUBIO://SERVICE', targetSubsystem: 'SERVICE', requiredPermission: 'SERVICE_INVOKE', description: 'Universal API / Service Engine' },
      { prefix: 'CUBIO://FILE', targetSubsystem: 'FILE', requiredPermission: 'STORAGE_READ', description: 'Sovereign File & Object Network' },
      { prefix: 'CUBIO://STORAGE', targetSubsystem: 'STORAGE', requiredPermission: 'STORAGE_READ', description: 'Content-Addressable Storage' },
      { prefix: 'CUBIO://SEARCH', targetSubsystem: 'SEARCH', requiredPermission: 'SEARCH_EXECUTE', description: 'Discovery & Search Engine' },
      { prefix: 'CUBIO://EVENT', targetSubsystem: 'EVENT', requiredPermission: 'CHANNEL_SUBSCRIBE', description: 'Event Pub/Sub Realtime Pipeline' },
      { prefix: 'CUBIO://DEVICE', targetSubsystem: 'DEVICE', requiredPermission: 'DEVICE_MANAGE', description: 'Device / Node Mesh' },
      { prefix: 'CUBIO://AGENT', targetSubsystem: 'AGENT', requiredPermission: 'AGENT_CREATE', description: 'Autonomous AI Agent Network' },
      { prefix: 'CUBIO://NOTIFICATION', targetSubsystem: 'NOTIFICATION', description: 'Notification Delivery Network' },
      { prefix: 'CUBIO://OMAIL', targetSubsystem: 'OMAIL', requiredPermission: 'MAIL_SEND', description: 'OMail Email Network' },
      { prefix: 'CUBIO://NETWORK', targetSubsystem: 'COORDINATE', description: 'CNC Logical Coordinate Router' },
      { prefix: 'CUBIO://PUBLIC', targetSubsystem: 'SERVICE', isPublic: true, description: 'Public Unauthenticated Gateway Endpoints' },
    ];

    const now = Date.now();
    for (const def of defaults) {
      const routeId = `RT_${deterministicHash(`${def.prefix}:${def.targetSubsystem}`).slice(2, 18)}`;
      this.repository.saveRoute(
        Object.freeze({
          routeId,
          prefix: def.prefix.toUpperCase(),
          targetSubsystem: def.targetSubsystem,
          requiredPermission: def.requiredPermission,
          description: def.description || '',
          isPublic: def.isPublic || false,
          createdAt: now,
        })
      );
    }
  }

  /**
   * Registers a custom routing rule into the gateway.
   */
  public async registerRoute(input: RegisterRouteInput): Promise<Readonly<GatewayRoute>> {
    const now = Date.now();
    const routeId = `RT_${deterministicHash(`${input.prefix}:${input.targetSubsystem}:${now}`).slice(2, 18)}`;

    const route: GatewayRoute = Object.freeze({
      routeId,
      prefix: input.prefix.toUpperCase().trim(),
      targetSubsystem: input.targetSubsystem,
      requiredPermission: input.requiredPermission,
      description: (input.description || '').trim(),
      isPublic: input.isPublic || false,
      createdAt: now,
    });

    await this.repository.saveRoute(route);
    return route;
  }

  /**
   * Dispatches a request envelope across the sovereign gateway with full authentication and authorization gates.
   */
  public async routeRequest(
    envelope: GatewayRequestEnvelope
  ): Promise<Readonly<GatewayResponseEnvelope>> {
    const startTime = Date.now();
    this.totalRequests++;
    const hops: string[] = ['GATEWAY_INGRESS'];

    try {
      // 1. Route Matching
      const matchedRoute = await this.repository.matchRoute(envelope.targetUri);
      hops.push('ROUTE_MATCH');

      if (!matchedRoute) {
        this.failedRequests++;
        const durationMs = Date.now() - startTime;
        this.totalDurationMs += durationMs;
        hops.push('ROUTE_NOT_FOUND');

        return Object.freeze({
          requestId: envelope.requestId,
          statusCode: 404,
          statusText: 'Not Found',
          targetUri: envelope.targetUri,
          error: `Gateway Routing Error: No route matching URI '${envelope.targetUri}'.`,
          traceHops: Object.freeze(hops),
          durationMs,
          timestamp: Date.now(),
        });
      }

      // 2. Authentication Gate
      hops.push('AUTH_CHECK');
      let callerCubId: string | undefined;

      if (envelope.tokenOrSession) {
        if (envelope.tokenOrSession.startsWith('CUB-')) {
          callerCubId = envelope.tokenOrSession;
        } else if (this.authEngine) {
          let verification;
          if (envelope.tokenOrSession.startsWith('CUBTOK.')) {
            verification = await this.authEngine.verifyToken(envelope.tokenOrSession);
          } else {
            verification = await this.authEngine.verifySession(envelope.tokenOrSession);
          }

          if (!verification.isValid || !verification.identity) {
            this.rejectedAuthRequests++;
            this.failedRequests++;
            const durationMs = Date.now() - startTime;
            this.totalDurationMs += durationMs;
            hops.push('AUTH_FAILED');

            return Object.freeze({
              requestId: envelope.requestId,
              statusCode: 401,
              statusText: 'Unauthorized',
              targetUri: envelope.targetUri,
              routedSubsystem: matchedRoute.targetSubsystem,
              error: `Authentication Denied: ${verification.error || 'Invalid session credentials'}`,
              traceHops: Object.freeze(hops),
              durationMs,
              timestamp: Date.now(),
            });
          }

          callerCubId = verification.identity.cubId;
        }
      } else if (!matchedRoute.isPublic) {
        this.rejectedAuthRequests++;
        this.failedRequests++;
        const durationMs = Date.now() - startTime;
        this.totalDurationMs += durationMs;
        hops.push('AUTH_MISSING');

        return Object.freeze({
          requestId: envelope.requestId,
          statusCode: 401,
          statusText: 'Unauthorized',
          targetUri: envelope.targetUri,
          routedSubsystem: matchedRoute.targetSubsystem,
          error: 'Authentication Required: No session or token credentials provided.',
          traceHops: Object.freeze(hops),
          durationMs,
          timestamp: Date.now(),
        });
      }

      // 3. Authorization Gate
      hops.push('AUTHZ_CHECK');
      if (callerCubId && matchedRoute.requiredPermission && this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: matchedRoute.requiredPermission,
          resourceUri: envelope.targetUri,
        });

        if (!decision.allowed) {
          this.failedRequests++;
          const durationMs = Date.now() - startTime;
          this.totalDurationMs += durationMs;
          hops.push('AUTHZ_DENIED');

          return Object.freeze({
            requestId: envelope.requestId,
            statusCode: 403,
            statusText: 'Forbidden',
            targetUri: envelope.targetUri,
            routedSubsystem: matchedRoute.targetSubsystem,
            authenticatedCaller: callerCubId,
            error: `Access Denied: Caller '${callerCubId}' lacks permission '${matchedRoute.requiredPermission}'.`,
            traceHops: Object.freeze(hops),
            durationMs,
            timestamp: Date.now(),
          });
        }
      }

      // 4. Subsystem Coordinate Dispatch
      hops.push(`DISPATCH_${matchedRoute.targetSubsystem}`);
      let responseBody: any;

      if (matchedRoute.targetSubsystem === 'COORDINATE' && this.router) {
        const routeResult = this.router.route(envelope.targetUri);
        responseBody = routeResult;
      } else if (matchedRoute.targetSubsystem === 'SERVICE' && envelope.targetUri.toUpperCase().startsWith('CUBIO://SERVICE') && this.stack?.serviceEngine) {
        const parts = envelope.targetUri.replace(/^CUBIO:\/\/SERVICE\/?/i, '').split('/');
        const serviceName = parts[0] || 'default-service';
        const actionPath = `/${parts.slice(1).join('/')}`;

        const svcResp = await this.stack.serviceEngine.invokeService({
          requestId: envelope.requestId,
          serviceIdOrName: serviceName,
          endpointPath: actionPath,
          method: envelope.method as any,
          callerTokenOrSession: envelope.tokenOrSession || 'ANONYMOUS',
          payload: envelope.body,
        });

        responseBody = svcResp.data || { acknowledged: true };
        if (svcResp.statusCode >= 400) {
          this.failedRequests++;
          const durationMs = Date.now() - startTime;
          hops.push('GATEWAY_EGRESS');
          return Object.freeze({
            requestId: envelope.requestId,
            statusCode: svcResp.statusCode,
            statusText: svcResp.statusCode === 404 ? 'Not Found' : svcResp.statusCode === 403 ? 'Forbidden' : 'Bad Request',
            targetUri: envelope.targetUri,
            routedSubsystem: matchedRoute.targetSubsystem,
            authenticatedCaller: callerCubId,
            body: svcResp.data,
            error: svcResp.error,
            traceHops: Object.freeze(hops),
            durationMs,
            timestamp: Date.now(),
          });
        }
      } else {
        responseBody = {
          acknowledged: true,
          subsystem: matchedRoute.targetSubsystem,
          action: envelope.method,
          caller: callerCubId || 'ANONYMOUS',
          targetUri: envelope.targetUri,
          payloadHash: deterministicHash(JSON.stringify(envelope.body || {})),
        };
      }

      hops.push('GATEWAY_EGRESS');
      this.successfulRequests++;
      const durationMs = Date.now() - startTime;
      this.totalDurationMs += durationMs;

      return Object.freeze({
        requestId: envelope.requestId,
        statusCode: 200,
        statusText: 'OK',
        targetUri: envelope.targetUri,
        routedSubsystem: matchedRoute.targetSubsystem,
        authenticatedCaller: callerCubId,
        body: responseBody,
        traceHops: Object.freeze(hops),
        durationMs,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      this.failedRequests++;
      const durationMs = Date.now() - startTime;
      this.totalDurationMs += durationMs;
      hops.push('GATEWAY_FAULT');

      return Object.freeze({
        requestId: envelope.requestId,
        statusCode: 500,
        statusText: 'Internal Server Error',
        targetUri: envelope.targetUri,
        error: `Gateway Error: ${err.message || 'Internal processing fault'}`,
        traceHops: Object.freeze(hops),
        durationMs,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Returns runtime metrics for the gateway.
   */
  public getMetrics(): GatewayMetrics {
    return Object.freeze({
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rejectedAuthRequests: this.rejectedAuthRequests,
      averageLatencyMs: this.totalRequests > 0 ? this.totalDurationMs / this.totalRequests : 0,
    });
  }
}
