/**
 * 3D Memory Studio — Funnel 63
 * Security Landing Adapter & F47 Gate
 *
 * Ensures RED records never enter the landing experience.
 */

import { DataClassification } from '../../funnel47/types';

export function isAllowedOnLanding(classification: DataClassification): boolean {
  return classification === 'GREEN';
}
