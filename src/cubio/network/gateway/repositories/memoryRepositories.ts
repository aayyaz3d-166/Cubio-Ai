/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-16: In-Memory Gateway Route Repository
 */

import {
  GatewayRoute,
} from '../types';
import { IGatewayRouteRepository } from './types';

export class MemoryGatewayRouteRepository implements IGatewayRouteRepository {
  private routesById: Map<string, GatewayRoute> = new Map();

  public async saveRoute(route: GatewayRoute): Promise<void> {
    this.routesById.set(route.routeId, Object.freeze({ ...route }));
  }

  public async getRoute(routeId: string): Promise<GatewayRoute | undefined> {
    return this.routesById.get(routeId);
  }

  public async matchRoute(targetUri: string): Promise<GatewayRoute | undefined> {
    const normUri = targetUri.toUpperCase().trim();
    let bestMatch: GatewayRoute | undefined;
    let longestPrefixLen = -1;

    for (const route of this.routesById.values()) {
      const prefix = route.prefix.toUpperCase().trim();
      if (normUri.startsWith(prefix) && prefix.length > longestPrefixLen) {
        bestMatch = route;
        longestPrefixLen = prefix.length;
      }
    }

    return bestMatch;
  }

  public async listRoutes(): Promise<readonly GatewayRoute[]> {
    return Object.freeze(Array.from(this.routesById.values()));
  }

  public async deleteRoute(routeId: string): Promise<boolean> {
    return this.routesById.delete(routeId);
  }
}
