/**
 * 3D Memory Studio — Funnel 85
 * Analysis: Depth Visibility Analyzer (Perspective vs Orthographic)
 */

import { F85DepthVisibilityReport } from '../types';
import { createSpatialConfiguration } from '../core/spatialConfiguration';
import { createStandardObservers } from '../observer/observerSpatialView';
import { synthesizeSpatialDisplay } from '../projection/dimensionalVisibility';

export function analyzeDepthVisibility(): F85DepthVisibilityReport {
  const config = createSpatialConfiguration('Z_DEPTH');
  const { observerA } = createStandardObservers();

  const displayPersp = synthesizeSpatialDisplay(config, observerA, 'PERSPECTIVE_3D');
  const displayOrtho = synthesizeSpatialDisplay(config, observerA, 'ORTHOGRAPHIC_3D');

  const perspCollisions = displayPersp.collisionReport.collisionCount;
  const orthoCollisions = displayOrtho.collisionReport.collisionCount;

  // In orthographic frontal projection, all objects along Z have identical (X, Y) = (0, 0)
  // hence they all collapse to the exact same screen center (sx, sy).
  // In perspective projection, objects have depth scaling or off-center parallax.
  const doesOrthographicSeparateDepth = displayOrtho.collisionReport.visuallyDistinctObjectCount > 1;
  const doesPerspectiveSeparateDepth = displayPersp.displayChecksum !== displayOrtho.displayChecksum;

  return Object.freeze({
    experimentName: 'DEPTH_ONLY_COMPARISON',
    perspectiveDistinctCount: displayPersp.collisionReport.visuallyDistinctObjectCount,
    orthographicDistinctCount: displayOrtho.collisionReport.visuallyDistinctObjectCount,
    doesPerspectiveSeparateDepth,
    doesOrthographicSeparateDepth,
    mathematicalDifferenceVerified: displayPersp.displayChecksum !== displayOrtho.displayChecksum,
  });
}
