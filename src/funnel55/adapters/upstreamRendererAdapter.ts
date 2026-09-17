/**
 * 3D Memory Studio — Funnel 55
 * Upstream Renderer Adapter & GREEN/RED Security Gate
 *
 * Strictly authorizes only GREEN research states to become scene renderables.
 * RED records are 100% blocked from entering the scene.
 */

import { MemoryScene } from '../scene/memoryScene';
import { RenderableStateNode } from '../scene/renderableObject';
import { DimensionalInformationState } from '../../funnel49/types';

export interface UpstreamPopulateReport {
  readonly greenObjectsCreated: number;
  readonly redRecordsBlocked: number;
  readonly totalInputStates: number;
}

export function populateSceneWithGreenStates(
  scene: MemoryScene,
  states: readonly DimensionalInformationState[]
): UpstreamPopulateReport {
  const stateLayer = scene.getLayer('STATE_LAYER');
  stateLayer.clear();

  let greenCount = 0;
  let redBlocked = 0;

  for (const state of states) {
    if (state.classification === 'GREEN' && state.processingAllowed) {
      const coord = state.coordinatesByDimension[3] || state.coordinatesByDimension[1];
      const node = new RenderableStateNode(
        state.stateId,
        state.entityName,
        state.category,
        'GREEN',
        state.sequence369,
        '#06b6d4',
        state
      );

      if (coord && coord.coordinateValues.length >= 3) {
        node.setTransform(
          coord.coordinateValues[0] * 20,
          coord.coordinateValues[1] * 20,
          coord.coordinateValues[2] * 20
        );
      }

      stateLayer.addObject(node);
      greenCount++;
    } else {
      // Strictly blocked from becoming scene renderable
      redBlocked++;
    }
  }

  return Object.freeze({
    greenObjectsCreated: greenCount,
    redRecordsBlocked: redBlocked,
    totalInputStates: states.length,
  });
}
