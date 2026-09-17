/**
 * 3D Memory Studio — Funnel 70
 * Action Registry
 *
 * Maintains schema definitions, metadata, and handler mappings for supported Studio actions.
 */

import { StudioActionType } from '../types';
import { SAFE_ACTIONS, VIEW_ACTIONS, VALID_ACTION_TYPES } from './actionTypes';

export interface ActionDescriptor {
  readonly type: StudioActionType;
  readonly category: 'SAFE' | 'VIEW';
  readonly description: string;
  readonly requiresTarget: boolean;
}

export class ActionRegistry {
  private readonly descriptors: Map<StudioActionType, ActionDescriptor> = new Map();

  constructor() {
    this.seedDefaultDescriptors();
  }

  private seedDefaultDescriptors(): void {
    for (const type of VALID_ACTION_TYPES) {
      const isSafe = SAFE_ACTIONS.has(type);
      const isView = VIEW_ACTIONS.has(type);
      const requiresTarget = [
        'NAVIGATE_SECTION',
        'OPEN_PANEL',
        'CLOSE_PANEL',
        'TOGGLE_PANEL',
        'SELECT_STATE',
        'SELECT_CLUSTER',
        'SELECT_RELATIONSHIP',
        'FOCUS_STATE',
        'FOCUS_CLUSTER',
        'FOCUS_RELATIONSHIP',
        'HIGHLIGHT_RELATIONSHIP',
        'HIGHLIGHT_NEIGHBORHOOD',
        'SWITCH_DIMENSION',
        'SET_CAMERA_PRESET',
        'CHANGE_CLUSTER_LAYOUT',
        'SEARCH_INFORMATION',
      ].includes(type);

      this.descriptors.set(type, {
        type,
        category: isSafe ? 'SAFE' : 'VIEW',
        description: `Executes Studio command ${type}`,
        requiresTarget,
      });
    }
  }

  public getDescriptor(type: StudioActionType): ActionDescriptor | undefined {
    return this.descriptors.get(type);
  }

  public getAllDescriptors(): readonly ActionDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  public isRegistered(type: string): boolean {
    return this.descriptors.has(type as StudioActionType);
  }
}
