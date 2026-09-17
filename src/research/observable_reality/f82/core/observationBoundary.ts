/**
 * 3D Memory Studio — Funnel 82
 * Hard Observation Boundary & Field Isolation Gate
 */

import { ObservationBoundary, Coordinate3D, FullStateObject } from '../types';

export function createDefaultObservationBoundary(
  options: Partial<ObservationBoundary> = {}
): ObservationBoundary {
  return Object.freeze({
    boundaryId: options.boundaryId || 'F82_BOUNDARY_DEFAULT',
    permittedFields: Object.freeze(
      options.permittedFields || [
        'color',
        'label',
        'mass',
        'category',
        'status',
        'visibleShape',
        'brightness',
        'temperature',
      ]
    ),
    hiddenFields: Object.freeze(
      options.hiddenFields || [
        'hiddenPayload',
        'privateDimensions',
        'internalMetadata',
        'secretKey',
        'underlyingCoordinates4D',
      ]
    ),
    allowedObjectTypes: Object.freeze(options.allowedObjectTypes || ['ALL']),
    maxRange: Object.freeze(options.maxRange || [1000, 1000, 1000]) as unknown as Coordinate3D,
    minRange: Object.freeze(options.minRange || [-1000, -1000, -1000]) as unknown as Coordinate3D,
    maximumObjects: options.maximumObjects || 1000,
    maximumDepth: options.maximumDepth || 16,
    exposeWDimension: options.exposeWDimension === true,
    filterRedactedProperties: options.filterRedactedProperties !== false,
  });
}

export function isObjectAdmittedByBoundary(
  obj: FullStateObject,
  boundary: ObservationBoundary
): boolean {
  if (
    boundary.allowedObjectTypes.length > 0 &&
    !boundary.allowedObjectTypes.includes('ALL') &&
    !boundary.allowedObjectTypes.includes(obj.entityType)
  ) {
    return false;
  }

  const [x, y, z] = obj.coordinates;
  const [minX, minY, minZ] = boundary.minRange;
  const [maxX, maxY, maxZ] = boundary.maxRange;

  if (x < minX || x > maxX || y < minY || y > maxY || z < minZ || z > maxZ) {
    return false;
  }

  return true;
}

export function filterPropertiesByBoundary(
  metadata: Readonly<Record<string, unknown>>,
  boundary: ObservationBoundary
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Explicitly reject hidden fields
    if (boundary.hiddenFields.includes(key)) {
      continue;
    }
    // Admit only permitted fields
    if (boundary.permittedFields.includes(key)) {
      result[key] = value;
    }
  }

  return Object.freeze(result);
}
