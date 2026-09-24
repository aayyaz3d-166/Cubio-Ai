/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-NET-00: CubiO Logical Network Router
 *
 * Minimal logical routing layer resolving destination CubiO Network Coordinates
 * to registered node destinations.
 *
 * Invariant: Logical routing layer only. Does NOT replace IP/TCP/Internet transport.
 */

import { CubiONetworkCoordinateEngine } from './coordinate';
import { CubiONodeRegistry } from './registry';
import { CubiONetworkCoordinate, LogicalRouteResult } from './types';

export class CubiOLogicalRouter {
  private registry: CubiONodeRegistry;

  constructor(registry?: CubiONodeRegistry) {
    this.registry = registry || new CubiONodeRegistry();
  }

  public getRegistry(): CubiONodeRegistry {
    return this.registry;
  }

  /**
   * Resolves a destination coordinate through the logical routing hierarchy.
   */
  public route(destination: CubiONetworkCoordinate | string): LogicalRouteResult {
    let coord: CubiONetworkCoordinate;
    try {
      if (typeof destination === 'string') {
        coord = CubiONetworkCoordinateEngine.parse(destination);
      } else {
        coord = destination;
      }
    } catch (err: any) {
      const dummyCoord: CubiONetworkCoordinate = {
        network: 'CUBIO',
        dimension: 0,
        zone: 0,
        node: 0,
        service: 'UNKNOWN',
      };
      return Object.freeze({
        success: false,
        destinationUri: typeof destination === 'string' ? destination : 'INVALID_COORDINATE',
        destinationCoordinate: dummyCoord,
        routePath: [],
        latencyEstimateMs: 0,
        error: `Invalid destination address: ${err?.message || 'Parse error'}`,
      });
    }

    const destinationUri = CubiONetworkCoordinateEngine.format(coord);
    const targetNode = this.registry.lookup(destinationUri);

    if (!targetNode) {
      return Object.freeze({
        success: false,
        destinationUri,
        destinationCoordinate: coord,
        routePath: [
          'INGRESS',
          `DIM_${coord.dimension}`,
          `ZONE_${coord.zone.toString().padStart(2, '0')}`,
          'DESTINATION_UNREACHABLE',
        ],
        latencyEstimateMs: 0,
        error: `No active CubiO node registered at coordinate '${destinationUri}'.`,
      });
    }

    // Synthesize deterministic logical routing path
    const routePath = [
      'INGRESS',
      `DIM_${coord.dimension}`,
      `ZONE_${coord.zone.toString().padStart(2, '0')}`,
      `NODE_${coord.node.toString().padStart(5, '0')}`,
      `SERVICE_${coord.service}`,
    ];

    // Estimated logical intra-network dispatch latency
    const latencyEstimateMs = 1 + (coord.dimension > 3 ? 2 : 0);

    return Object.freeze({
      success: true,
      destinationUri,
      destinationCoordinate: coord,
      targetNode,
      routePath: Object.freeze(routePath),
      latencyEstimateMs,
    });
  }
}
