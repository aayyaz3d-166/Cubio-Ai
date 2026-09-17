/**
 * 3D Memory Studio — Funnel 85
 * Observer: Multi-Observer Comparison Evaluator
 */

import {
  F85SpatialConfiguration,
  F85ObserverState,
  F85ProjectionType,
  F85ObserverComparisonReport,
  F85DisplayState,
} from '../types';
import { synthesizeSpatialDisplay } from '../projection/dimensionalVisibility';

export function compareObservers(
  config: F85SpatialConfiguration,
  observers: readonly { observer: F85ObserverState; projection: F85ProjectionType }[]
): F85ObserverComparisonReport {
  const displays: F85DisplayState[] = observers.map((item) =>
    synthesizeSpatialDisplay(config, item.observer, item.projection)
  );

  const checksums = new Set(displays.map((d) => d.displayChecksum));
  const areAllDisplaysDistinct = checksums.size === displays.length;

  return Object.freeze({
    experimentType: config.experimentType,
    displays: Object.freeze(displays),
    areAllDisplaysDistinct,
    realityXPreserved: true,
  });
}
