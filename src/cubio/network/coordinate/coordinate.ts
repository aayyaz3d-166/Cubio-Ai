/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-NET-00: CubiO Network Coordinate (CNC) Engine
 *
 * Implements deterministic serialization, deserialization, strict validation,
 * canonical normalization, and mathematical equivalence checks for CNC coordinates.
 *
 * Invariant:
 * 1. deserialize(serialize(coordinate)) === coordinate (Round-trip equality)
 * 2. Equivalent valid coordinates normalize to identical canonical URI strings.
 * 3. Malformed or out-of-bounds coordinates produce structured validation errors.
 */

import { deterministicHash } from '../../state/determinism';
import {
  CubiONetworkCoordinate,
  CoordinateValidationError,
  CoordinateValidationResult,
  CubiOServiceIdentifier,
} from './types';

export class CubiONetworkCoordinateEngine {
  public static readonly SCHEME_PREFIX = 'CUBIO://NETWORK/';
  public static readonly MIN_DIMENSION = 0;
  public static readonly MAX_DIMENSION = 99;
  public static readonly MIN_ZONE = 0;
  public static readonly MAX_ZONE = 99;
  public static readonly MIN_NODE = 0;
  public static readonly MAX_NODE = 99999;

  /**
   * Constructs a typed CubiONetworkCoordinate with range validation.
   */
  public static create(
    dimension: number,
    zone: number,
    node: number,
    service: CubiOServiceIdentifier
  ): Readonly<CubiONetworkCoordinate> {
    const coord: CubiONetworkCoordinate = {
      network: 'CUBIO',
      dimension: Math.floor(dimension),
      zone: Math.floor(zone),
      node: Math.floor(node),
      service: (service || '').trim().toUpperCase(),
    };

    const validation = this.validate(coord);
    if (!validation.isValid) {
      const errorMsg = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Invalid CubiO Network Coordinate: ${errorMsg}`);
    }

    return Object.freeze(coord);
  }

  /**
   * Serializes a typed coordinate to its canonical CUBIO URI string.
   * Format: CUBIO://NETWORK/<dimension>/<zone:2>/<node:5>/<service>
   * Example: CUBIO://NETWORK/0/01/00001/TERMINAL
   */
  public static format(coord: CubiONetworkCoordinate): string {
    const dimStr = coord.dimension.toString();
    const zoneStr = coord.zone.toString().padStart(2, '0');
    const nodeStr = coord.node.toString().padStart(5, '0');
    const serviceStr = coord.service.trim().toUpperCase();

    return `${this.SCHEME_PREFIX}${dimStr}/${zoneStr}/${nodeStr}/${serviceStr}`;
  }

  /**
   * Serializes a coordinate object (alias for format).
   */
  public static serialize(coord: CubiONetworkCoordinate): string {
    return this.format(coord);
  }

  /**
   * Deserializes a CUBIO URI string into a typed CubiONetworkCoordinate.
   * Throws if malformed or invalid.
   */
  public static parse(uri: string): Readonly<CubiONetworkCoordinate> {
    const result = this.tryParse(uri);
    if (!result.isValid || !result.coordinate) {
      const errorMsg = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Failed to parse CubiO Network Coordinate URI '${uri}': ${errorMsg}`);
    }
    return result.coordinate;
  }

  /**
   * Deserializes a CUBIO URI string (alias for parse).
   */
  public static deserialize(uri: string): Readonly<CubiONetworkCoordinate> {
    return this.parse(uri);
  }

  /**
   * Safe parsing function that returns a structured validation result without throwing.
   */
  public static tryParse(uri: string): CoordinateValidationResult {
    const errors: CoordinateValidationError[] = [];

    if (!uri || typeof uri !== 'string') {
      const err: CoordinateValidationError = { field: 'format', message: 'URI must be a non-empty string.', code: 'ERR_EMPTY_URI' };
      return Object.freeze({
        isValid: false,
        errors: Object.freeze([err]),
      });
    }

    const trimmed = uri.trim();
    const upper = trimmed.toUpperCase();

    if (!upper.startsWith(this.SCHEME_PREFIX)) {
      errors.push({
        field: 'network',
        message: `URI must start with scheme '${this.SCHEME_PREFIX}'. Received: '${trimmed.slice(0, 20)}...'`,
        code: 'ERR_INVALID_SCHEME',
      });
      return Object.freeze({ isValid: false, errors: Object.freeze(errors) });
    }

    const pathPart = trimmed.slice(this.SCHEME_PREFIX.length);
    const segments = pathPart.split('/');

    if (segments.length !== 4) {
      errors.push({
        field: 'format',
        message: `URI must contain exactly 4 path segments (<dim>/<zone>/<node>/<service>). Found ${segments.length}.`,
        code: 'ERR_SEGMENT_COUNT',
      });
      return Object.freeze({ isValid: false, errors: Object.freeze(errors) });
    }

    const [dimRaw, zoneRaw, nodeRaw, serviceRaw] = segments;

    // 1. Dimension validation
    const dimNum = Number(dimRaw);
    if (!/^\d+$/.test(dimRaw) || isNaN(dimNum)) {
      errors.push({
        field: 'dimension',
        message: `Dimension must be a non-negative integer. Received '${dimRaw}'.`,
        code: 'ERR_INVALID_DIMENSION',
      });
    } else if (dimNum < this.MIN_DIMENSION || dimNum > this.MAX_DIMENSION) {
      errors.push({
        field: 'dimension',
        message: `Dimension '${dimNum}' out of range [${this.MIN_DIMENSION}..${this.MAX_DIMENSION}].`,
        code: 'ERR_DIMENSION_OUT_OF_RANGE',
      });
    }

    // 2. Zone validation
    const zoneNum = Number(zoneRaw);
    if (!/^\d+$/.test(zoneRaw) || isNaN(zoneNum)) {
      errors.push({
        field: 'zone',
        message: `Zone must be a non-negative integer. Received '${zoneRaw}'.`,
        code: 'ERR_INVALID_ZONE',
      });
    } else if (zoneNum < this.MIN_ZONE || zoneNum > this.MAX_ZONE) {
      errors.push({
        field: 'zone',
        message: `Zone '${zoneNum}' out of range [${this.MIN_ZONE}..${this.MAX_ZONE}].`,
        code: 'ERR_ZONE_OUT_OF_RANGE',
      });
    }

    // 3. Node validation
    const nodeNum = Number(nodeRaw);
    if (!/^\d+$/.test(nodeRaw) || isNaN(nodeNum)) {
      errors.push({
        field: 'node',
        message: `Node must be a non-negative integer. Received '${nodeRaw}'.`,
        code: 'ERR_INVALID_NODE',
      });
    } else if (nodeNum < this.MIN_NODE || nodeNum > this.MAX_NODE) {
      errors.push({
        field: 'node',
        message: `Node '${nodeNum}' out of range [${this.MIN_NODE}..${this.MAX_NODE}].`,
        code: 'ERR_NODE_OUT_OF_RANGE',
      });
    }

    // 4. Service validation
    const serviceClean = (serviceRaw || '').trim().toUpperCase();
    if (!serviceClean || !/^[A-Z0-9_-]+$/.test(serviceClean)) {
      errors.push({
        field: 'service',
        message: `Service identifier must be non-empty alphanumeric (A-Z, 0-9, _, -). Received '${serviceRaw}'.`,
        code: 'ERR_INVALID_SERVICE',
      });
    }

    if (errors.length > 0) {
      return Object.freeze({
        isValid: false,
        errors: Object.freeze(errors),
      });
    }

    const coordinate: CubiONetworkCoordinate = Object.freeze({
      network: 'CUBIO',
      dimension: dimNum,
      zone: zoneNum,
      node: nodeNum,
      service: serviceClean,
    });

    const canonicalUri = this.format(coordinate);

    return Object.freeze({
      isValid: true,
      errors: Object.freeze([]),
      canonicalUri,
      coordinate,
    });
  }

  /**
   * Validates a coordinate object.
   */
  public static validate(coord: any): CoordinateValidationResult {
    const errors: CoordinateValidationError[] = [];

    if (!coord || typeof coord !== 'object') {
      const err: CoordinateValidationError = { field: 'format', message: 'Coordinate must be an object.', code: 'ERR_NOT_OBJECT' };
      return Object.freeze({
        isValid: false,
        errors: Object.freeze([err]),
      });
    }

    if (coord.network !== 'CUBIO') {
      errors.push({
        field: 'network',
        message: `Network must be 'CUBIO'. Received '${coord.network}'.`,
        code: 'ERR_INVALID_NETWORK',
      });
    }

    if (
      typeof coord.dimension !== 'number' ||
      !Number.isInteger(coord.dimension) ||
      coord.dimension < this.MIN_DIMENSION ||
      coord.dimension > this.MAX_DIMENSION
    ) {
      errors.push({
        field: 'dimension',
        message: `Dimension must be an integer in [${this.MIN_DIMENSION}..${this.MAX_DIMENSION}].`,
        code: 'ERR_DIMENSION_OUT_OF_RANGE',
      });
    }

    if (
      typeof coord.zone !== 'number' ||
      !Number.isInteger(coord.zone) ||
      coord.zone < this.MIN_ZONE ||
      coord.zone > this.MAX_ZONE
    ) {
      errors.push({
        field: 'zone',
        message: `Zone must be an integer in [${this.MIN_ZONE}..${this.MAX_ZONE}].`,
        code: 'ERR_ZONE_OUT_OF_RANGE',
      });
    }

    if (
      typeof coord.node !== 'number' ||
      !Number.isInteger(coord.node) ||
      coord.node < this.MIN_NODE ||
      coord.node > this.MAX_NODE
    ) {
      errors.push({
        field: 'node',
        message: `Node must be an integer in [${this.MIN_NODE}..${this.MAX_NODE}].`,
        code: 'ERR_NODE_OUT_OF_RANGE',
      });
    }

    const serviceClean = typeof coord.service === 'string' ? coord.service.trim().toUpperCase() : '';
    if (!serviceClean || !/^[A-Z0-9_-]+$/.test(serviceClean)) {
      errors.push({
        field: 'service',
        message: `Service must be non-empty alphanumeric identifier. Received '${coord.service}'.`,
        code: 'ERR_INVALID_SERVICE',
      });
    }

    if (errors.length > 0) {
      return Object.freeze({
        isValid: false,
        errors: Object.freeze(errors),
      });
    }

    const typedCoord: CubiONetworkCoordinate = Object.freeze({
      network: 'CUBIO',
      dimension: coord.dimension,
      zone: coord.zone,
      node: coord.node,
      service: serviceClean,
    });

    return Object.freeze({
      isValid: true,
      errors: Object.freeze([]),
      canonicalUri: this.format(typedCoord),
      coordinate: typedCoord,
    });
  }

  /**
   * Normalizes a coordinate object or URI string into its canonical URI string.
   */
  public static normalize(input: CubiONetworkCoordinate | string): string {
    if (typeof input === 'string') {
      const parsed = this.parse(input);
      return this.format(parsed);
    }
    return this.format(input);
  }

  /**
   * Checks if two coordinates or URIs are logically identical.
   */
  public static equals(
    a: CubiONetworkCoordinate | string,
    b: CubiONetworkCoordinate | string
  ): boolean {
    try {
      const canonicalA = this.normalize(a);
      const canonicalB = this.normalize(b);
      return canonicalA === canonicalB;
    } catch {
      return false;
    }
  }

  /**
   * Computes a deterministic content-addressable hash for a coordinate.
   */
  public static hash(coord: CubiONetworkCoordinate | string): string {
    const canonical = this.normalize(coord);
    return `0xCNC_${deterministicHash(canonical).slice(2, 18)}`;
  }
}
