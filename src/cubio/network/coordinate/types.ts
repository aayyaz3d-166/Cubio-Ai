/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-NET-00: CubiO Network Coordinate (CNC) Types
 *
 * Formal logical addressing specification for CubiO network nodes, services,
 * terminals, data blocks, and routing endpoints.
 *
 * Canonical URI Format:
 * CUBIO://NETWORK/<dimension>/<zone>/<node>/<service>
 *
 * Example:
 * CUBIO://NETWORK/0/01/00001/TERMINAL
 *
 * IMPORTANT SECURITY BOUNDARY:
 * A CubiO Network Coordinate is a logical address and locator only.
 * A coordinate does NOT authenticate a node or user.
 * Authentication and cryptographic authorization are handled separately in Pipeline 01+.
 */

export type CubiOServiceIdentifier =
  | 'TERMINAL'
  | 'MAIL'
  | 'INTELLIGENCE'
  | 'STORAGE'
  | 'API'
  | 'ROUTER'
  | 'GATEWAY'
  | 'CORE'
  | 'COMPUTE'
  | 'OBSERVER'
  | string;

export interface CubiONetworkCoordinate {
  readonly network: 'CUBIO';
  readonly dimension: number; // Dimension coordinate [0..99]
  readonly zone: number; // Zone identifier [0..99], formatted as 2-digit zero-padded
  readonly node: number; // Node identifier [0..99999], formatted as 5-digit zero-padded
  readonly service: CubiOServiceIdentifier; // Service identifier (uppercase string)
}

export interface CoordinateValidationError {
  readonly field: 'network' | 'dimension' | 'zone' | 'node' | 'service' | 'format';
  readonly message: string;
  readonly code: string;
}

export interface CoordinateValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly CoordinateValidationError[];
  readonly canonicalUri?: string;
  readonly coordinate?: CubiONetworkCoordinate;
}

export type NodeStatus = 'ACTIVE' | 'REGISTERED' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE';

export interface CubiONetworkNode {
  readonly coordinate: CubiONetworkCoordinate;
  readonly uri: string;
  readonly nodeName: string;
  readonly service: CubiOServiceIdentifier;
  readonly status: NodeStatus;
  readonly registeredAt: number;
  readonly metadata: Readonly<Record<string, any>>;
}

export interface LogicalRouteResult {
  readonly success: boolean;
  readonly destinationUri: string;
  readonly destinationCoordinate: CubiONetworkCoordinate;
  readonly targetNode?: CubiONetworkNode;
  readonly routePath: readonly string[];
  readonly latencyEstimateMs: number;
  readonly error?: string;
}

export interface CliCommandResult {
  readonly command: string;
  readonly success: boolean;
  readonly exitCode: number;
  readonly output: string;
  readonly data?: any;
}
