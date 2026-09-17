/**
 * 3D Memory Studio — Funnel 68
 * Coordinate Model, Limits & Sanity Validators
 */

export const MAX_SELECTED_OBJECTS = 1;
export const MAX_COORDINATE_PANELS = 2;
export const MAX_3D_MARKERS = 1;
export const MAX_ACTIVE_CAMERA_REQUESTS = 1;
export const MAX_AXIS_OBJECTS = 3;
export const MAX_GRID_OBJECTS = 1;
export const MAX_CONTROL_OVERLAYS = 4;
export const MAX_GRID_EXTENT = 500;

export function isValidCoordinate(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

export function sanitizeCoordinate(val: number, fallback = 0.0): number {
  return isValidCoordinate(val) ? val : fallback;
}
