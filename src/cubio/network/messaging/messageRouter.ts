/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-05: Message Router & Address Resolver
 *
 * Resolves destination coordinates, verifies network route hops via NET-00,
 * and determines physical/logical delivery targets.
 */

import { CubiOLogicalRouter } from '../coordinate/routing';
import { CubiONetworkCoordinateEngine } from '../coordinate/coordinate';

export class CubiOMessageRouter {
  private router: CubiOLogicalRouter;

  constructor(router?: CubiOLogicalRouter) {
    this.router = router || new CubiOLogicalRouter();
  }

  public getRouter(): CubiOLogicalRouter {
    return this.router;
  }

  /**
   * Resolves and verifies route deliverability to destination coordinate.
   */
  public resolveDeliveryRoute(destinationCoordinateUri: string): {
    canDeliver: boolean;
    traceHops: readonly string[];
    error?: string;
  } {
    const parseResult = CubiONetworkCoordinateEngine.tryParse(destinationCoordinateUri);
    if (!parseResult.isValid || !parseResult.coordinate) {
      const errDetail = parseResult.errors.map((e) => e.message).join('; ') || 'Parsing failed';
      return {
        canDeliver: false,
        traceHops: ['ROUTER_REJECT_MALFORMED_URI'],
        error: `Invalid destination coordinate: ${errDetail}`,
      };
    }

    const coordinate = parseResult.coordinate;
    const canonicalUri = CubiONetworkCoordinateEngine.format(coordinate);

    // Route resolution
    const route = this.router.route(canonicalUri);
    const traceHops = [
      'MSG_INGRESS',
      `ROUTE_DEST:${canonicalUri}`,
      `SERVICE_SLOT:${coordinate.service}`,
    ];

    if (route.success) {
      traceHops.push(`TARGET_NODE_FOUND:${route.targetNode?.nodeName || 'NODE'}`);
      traceHops.push('DELIVERABLE');
      return {
        canDeliver: true,
        traceHops: Object.freeze(traceHops),
      };
    }

    // Direct peer-to-peer coordinates (e.g. ad-hoc sovereign identity nodes)
    traceHops.push('DIRECT_P2P_DELIVERY');
    return {
      canDeliver: true,
      traceHops: Object.freeze(traceHops),
    };
  }
}
