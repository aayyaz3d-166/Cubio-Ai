/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: NET-00 Coordinate Adapter
 *
 * Provides deterministic mapping between Sovereign CubiO Identities (CUB-XXXXXXXX)
 * and NET-00 Logical Network Coordinates (CUBIO://NETWORK/<dim>/<zone>/<node>/<service>).
 *
 * Invariant:
 * Does NOT modify NET-00's canonical format or coordinate rules.
 */

import { CubiONetworkCoordinateEngine } from '../coordinate/coordinate';
import { CubiONetworkCoordinate, CubiOServiceIdentifier } from '../coordinate/types';
import { CubiOIdentity } from './types';

export class CubiOIdentityCoordinateAdapter {
  /**
   * Maps a sovereign CubiO identity to a valid NET-00 Network Coordinate.
   */
  public static mapIdentityToCoordinate(
    identity: CubiOIdentity,
    options: {
      dimension?: number;
      zone?: number;
      node?: number;
      service?: CubiOServiceIdentifier;
    } = {}
  ): Readonly<CubiONetworkCoordinate> {
    const dimension = options.dimension !== undefined ? options.dimension : 0;
    const zone = options.zone !== undefined ? options.zone : 1;

    // Deterministically derive node slot from the hex segment of CUB-XXXXXXXX if not explicitly passed
    let node: number;
    if (options.node !== undefined) {
      node = options.node;
    } else {
      const hexPart = identity.cubId.replace('CUB-', '').slice(0, 5);
      const parsedNum = parseInt(hexPart, 16);
      node = isNaN(parsedNum) ? 1 : parsedNum % 100000;
    }

    // Determine logical service name
    let service: CubiOServiceIdentifier;
    if (options.service) {
      service = options.service;
    } else {
      switch (identity.type) {
        case 'USER':
          service = 'TERMINAL';
          break;
        case 'AGENT':
          service = 'INTELLIGENCE';
          break;
        case 'DEVICE':
          service = 'NODE';
          break;
        case 'SERVICE':
          const cleanServiceName =
            identity.name.replace(/[^a-zA-Z0-9]/g, '_').split('_').filter(Boolean)[0] || 'SERVICE';
          service = cleanServiceName.toUpperCase();
          break;
        default:
          service = 'GENERIC';
      }
    }

    return CubiONetworkCoordinateEngine.create(dimension, zone, node, service);
  }

  /**
   * Formats the canonical URI for an identity at a given network coordinate.
   */
  public static formatIdentityAddress(
    identity: CubiOIdentity,
    options: {
      dimension?: number;
      zone?: number;
      node?: number;
      service?: CubiOServiceIdentifier;
    } = {}
  ): string {
    const coord = this.mapIdentityToCoordinate(identity, options);
    return CubiONetworkCoordinateEngine.format(coord);
  }
}
