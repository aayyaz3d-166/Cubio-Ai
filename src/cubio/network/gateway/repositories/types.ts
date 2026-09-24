/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-16: Gateway Route Repository Interfaces
 */

import {
  GatewayRoute,
} from '../types';

export interface IGatewayRouteRepository {
  saveRoute(route: GatewayRoute): Promise<void>;
  getRoute(routeId: string): Promise<GatewayRoute | undefined>;
  matchRoute(targetUri: string): Promise<GatewayRoute | undefined>;
  listRoutes(): Promise<readonly GatewayRoute[]>;
  deleteRoute(routeId: string): Promise<boolean>;
}
