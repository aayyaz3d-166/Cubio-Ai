/**
 * 3D Memory Studio — Funnel 61
 * Security Camera Adapter & F47 Gate
 *
 * Ensures only authorized GREEN states can become camera targets or focus coordinates.
 */

import { DataClassification } from '../../funnel47/types';

export function isPermittedCameraTarget(classification: DataClassification): boolean {
  return classification === 'GREEN';
}
