/**
 * 3D Memory Studio — Funnel 52
 * Simulation World Action Reducer
 */

import {
  SimulationWorldState,
  SimulationSpeed,
  SimulationDimension,
  SimulationCamera,
} from '../types';
import { createInitialSimulationWorld, stepSimulationWorld } from './simulationWorld';
import { analyzeDimensionProjection } from '../visual/dimensionProjection';
import { searchDimensionalUniverse } from '../../funnel49/search';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';

export type SimulationAction =
  | { type: 'TICK'; deltaMs: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'SET_SPEED'; speed: SimulationSpeed }
  | { type: 'SET_DIMENSION'; dimension: SimulationDimension }
  | { type: 'SET_CAMERA'; camera: Partial<SimulationCamera> }
  | { type: 'SELECT_STATE'; stateId: string | null }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTER'; filter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL' };

export function simulationReducer(
  state: SimulationWorldState,
  action: SimulationAction
): SimulationWorldState {
  switch (action.type) {
    case 'TICK':
      return stepSimulationWorld(state, action.deltaMs);

    case 'PAUSE':
      return Object.freeze({ ...state, isPaused: true });

    case 'RESUME':
      return Object.freeze({ ...state, isPaused: false });

    case 'RESTART': {
      const reset = createInitialSimulationWorld(state.allSourceStates, state.activeDimension, state.seed);
      return reset;
    }

    case 'SET_SPEED':
      return Object.freeze({ ...state, speed: action.speed });

    case 'SET_DIMENSION': {
      if (action.dimension === state.activeDimension) return state;
      const projection = analyzeDimensionProjection(state.activeDimension, action.dimension);
      const updated = Object.freeze({
        ...state,
        activeDimension: action.dimension,
        projection,
      });
      return stepSimulationWorld(updated, 1);
    }

    case 'SET_CAMERA':
      return Object.freeze({
        ...state,
        camera: Object.freeze({ ...state.camera, ...action.camera }),
      });

    case 'SELECT_STATE': {
      const updated = Object.freeze({
        ...state,
        selectedStateId: action.stateId,
      });
      return stepSimulationWorld(updated, 1);
    }

    case 'SET_SEARCH_QUERY': {
      const q = action.query.trim();
      let highlighted: string[] = [];

      if (q) {
        // Resolve using F49/F50 unified search engine
        const searchIndex = getStandardInformationUniverseFixture();
        const searchRes = searchDimensionalUniverse(searchIndex, q);
        highlighted = searchRes.results.map((r) => r.stateId);
      }

      const updated = Object.freeze({
        ...state,
        searchQuery: action.query,
        highlightedStateIds: Object.freeze(highlighted),
        selectedStateId: highlighted.length > 0 ? highlighted[0] : state.selectedStateId,
      });
      return stepSimulationWorld(updated, 1);
    }

    case 'SET_FILTER': {
      const updated = Object.freeze({
        ...state,
        activeFilter: action.filter,
      });
      return stepSimulationWorld(updated, 1);
    }

    default:
      return state;
  }
}
