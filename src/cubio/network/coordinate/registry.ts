/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-NET-00: CubiO Network Node Registry
 *
 * Isolated in-memory deterministic node registry for CubiO network coordinates.
 * Allows nodes to register, unregister, and be discovered by coordinate, service, dimension, or zone.
 */

import { CubiONetworkCoordinateEngine } from './coordinate';
import {
  CubiONetworkCoordinate,
  CubiONetworkNode,
  NodeStatus,
  CubiOServiceIdentifier,
} from './types';

export class CubiONodeRegistry {
  private nodesByUri: Map<string, CubiONetworkNode> = new Map();

  /**
   * Registers a node at a specified coordinate.
   * Throws if address is invalid. Overwrites or updates if already registered.
   */
  public register(
    input:
      | CubiONetworkNode
      | {
          coordinate: CubiONetworkCoordinate | string;
          nodeName?: string;
          service?: CubiOServiceIdentifier;
          status?: NodeStatus;
          metadata?: Record<string, any>;
        }
  ): Readonly<CubiONetworkNode> {
    let coord: CubiONetworkCoordinate;
    if (typeof input.coordinate === 'string') {
      coord = CubiONetworkCoordinateEngine.parse(input.coordinate);
    } else {
      coord = input.coordinate;
    }

    const uri = CubiONetworkCoordinateEngine.format(coord);
    const service = (input.service || coord.service || 'GENERIC').toUpperCase();
    const nodeName = input.nodeName || `Node_${service}_${coord.node}`;
    const status: NodeStatus = input.status || 'ACTIVE';
    const metadata = Object.freeze({ ...(input.metadata || {}) });

    const node: CubiONetworkNode = Object.freeze({
      coordinate: coord,
      uri,
      nodeName,
      service,
      status,
      registeredAt: Date.now(),
      metadata,
    });

    this.nodesByUri.set(uri, node);
    return node;
  }

  /**
   * Unregisters a node by coordinate or URI.
   */
  public unregister(address: CubiONetworkCoordinate | string): boolean {
    try {
      const canonical = CubiONetworkCoordinateEngine.normalize(address);
      return this.nodesByUri.delete(canonical);
    } catch {
      return false;
    }
  }

  /**
   * Looks up a registered node by coordinate or URI.
   */
  public lookup(address: CubiONetworkCoordinate | string): Readonly<CubiONetworkNode> | undefined {
    try {
      const canonical = CubiONetworkCoordinateEngine.normalize(address);
      return this.nodesByUri.get(canonical);
    } catch {
      return undefined;
    }
  }

  /**
   * Checks if a node is registered at the given coordinate.
   */
  public has(address: CubiONetworkCoordinate | string): boolean {
    return this.lookup(address) !== undefined;
  }

  /**
   * Lists all currently registered nodes in deterministic order.
   */
  public list(): readonly CubiONetworkNode[] {
    return Object.freeze(
      Array.from(this.nodesByUri.values()).sort((a, b) => a.uri.localeCompare(b.uri))
    );
  }

  /**
   * Finds all registered nodes providing a specific service.
   */
  public findByService(service: string): readonly CubiONetworkNode[] {
    const targetService = service.trim().toUpperCase();
    return Object.freeze(
      Array.from(this.nodesByUri.values()).filter(
        (n) => n.service.toUpperCase() === targetService
      )
    );
  }

  /**
   * Finds all nodes registered in a specific dimension.
   */
  public findByDimension(dimension: number): readonly CubiONetworkNode[] {
    return Object.freeze(
      Array.from(this.nodesByUri.values()).filter((n) => n.coordinate.dimension === dimension)
    );
  }

  /**
   * Finds all nodes registered in a specific zone.
   */
  public findByZone(dimension: number, zone: number): readonly CubiONetworkNode[] {
    return Object.freeze(
      Array.from(this.nodesByUri.values()).filter(
        (n) => n.coordinate.dimension === dimension && n.coordinate.zone === zone
      )
    );
  }

  /**
   * Total number of registered nodes.
   */
  public count(): number {
    return this.nodesByUri.size;
  }

  /**
   * Clears the registry.
   */
  public clear(): void {
    this.nodesByUri.clear();
  }
}
