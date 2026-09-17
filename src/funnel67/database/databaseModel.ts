/**
 * 3D Memory Studio — Funnel 67
 * Database Model Constants & Limits
 */

export const MAX_VISIBLE_RECORDS = 50;
export const MAX_RELATIONSHIP_ROWS = 20;
export const MAX_CLUSTER_ROWS = 20;
export const MAX_DIMENSION_ROWS = 16;
export const MAX_DETAIL_PANELS = 2;

export function getDimensionModeLabel(dim: number): string {
  if (dim === 3) {
    return 'Z3 (ACTUAL 3D SPATIAL MODE)';
  }
  return `Z${dim} (COMPUTATIONAL PROJECTION)`;
}
