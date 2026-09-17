/**
 * 3D Memory Studio — Funnel 70
 * Action Validator
 *
 * Enforces action schema validity, parameter bounds, authority rules,
 * and strict F47 security boundaries.
 */

import { StudioAction, ActionValidationResult } from '../types';
import {
  VALID_ACTION_TYPES,
  VALID_SECTIONS,
  VALID_DIMENSIONS,
  VALID_CAMERA_PRESETS,
  VALID_CLUSTER_LAYOUTS,
} from './actionTypes';
import { SecurityActionAdapter, SECURITY_REJECTION_REASON } from '../adapters/securityActionAdapter';

export class ActionValidator {
  constructor(private readonly security: SecurityActionAdapter = new SecurityActionAdapter()) {}

  public validateAction(action: StudioAction): ActionValidationResult {
    // 1. Type validation
    if (!action || !action.type || !VALID_ACTION_TYPES.has(action.type)) {
      return { isValid: false, reason: `Unknown or invalid action type: "${action?.type}"` };
    }

    // 2. Security validation (F47)
    const securityCheck = this.validateSecurity(action);
    if (!securityCheck.isValid) {
      return securityCheck;
    }

    // 3. Target and Parameter validation
    const paramCheck = this.validateParameters(action);
    if (!paramCheck.isValid) {
      return paramCheck;
    }

    return { isValid: true };
  }

  public validateSecurity(action: StudioAction): ActionValidationResult {
    const target = action.target || (action.parameters?.stateId as string) || (action.parameters?.clusterId as string) || (action.parameters?.relationshipId as string);
    if (target && !this.security.isTargetPermitted(target)) {
      return { isValid: false, reason: SECURITY_REJECTION_REASON };
    }

    if (action.parameters?.searchQuery && !this.security.isTargetPermitted(action.parameters.searchQuery)) {
      return { isValid: false, reason: SECURITY_REJECTION_REASON };
    }

    return { isValid: true };
  }

  public validateParameters(action: StudioAction): ActionValidationResult {
    const params = action.parameters || {};

    switch (action.type) {
      case 'NAVIGATE_SECTION': {
        const sec = params.sectionId || action.target;
        if (!sec || !VALID_SECTIONS.has(sec as string)) {
          return { isValid: false, reason: `Invalid section: "${sec}". Expected one of: ${Array.from(VALID_SECTIONS).join(', ')}` };
        }
        break;
      }

      case 'OPEN_PANEL':
      case 'CLOSE_PANEL':
      case 'TOGGLE_PANEL': {
        const panel = params.panelId || action.target;
        if (!panel || !VALID_SECTIONS.has(panel as string)) {
          return { isValid: false, reason: `Invalid panel: "${panel}". Expected one of: ${Array.from(VALID_SECTIONS).join(', ')}` };
        }
        break;
      }

      case 'SWITCH_DIMENSION': {
        const dim = params.dimension ?? (typeof action.target === 'number' ? action.target : parseInt(String(action.target || ''), 10));
        if (dim === undefined || isNaN(dim) || !VALID_DIMENSIONS.has(dim as any)) {
          return { isValid: false, reason: `Invalid dimension: "${dim}". Supported: 1, 2, 3, 4, 8, 12, 16.` };
        }
        break;
      }

      case 'SET_CAMERA_PRESET': {
        const preset = params.cameraPreset || action.target;
        if (!preset || !VALID_CAMERA_PRESETS.has(preset as any)) {
          return { isValid: false, reason: `Invalid camera preset: "${preset}". Supported: ${Array.from(VALID_CAMERA_PRESETS).join(', ')}` };
        }
        break;
      }

      case 'CHANGE_CLUSTER_LAYOUT': {
        const layout = params.clusterLayout || action.target;
        if (!layout || !VALID_CLUSTER_LAYOUTS.has(layout as any)) {
          return { isValid: false, reason: `Invalid cluster layout: "${layout}". Supported: ${Array.from(VALID_CLUSTER_LAYOUTS).join(', ')}` };
        }
        break;
      }

      case 'SELECT_STATE':
      case 'FOCUS_STATE': {
        const st = params.stateId || action.target;
        if (!st) {
          return { isValid: false, reason: `Action "${action.type}" requires a target state ID.` };
        }
        break;
      }

      case 'SELECT_CLUSTER':
      case 'FOCUS_CLUSTER': {
        const cl = params.clusterId || action.target;
        if (!cl) {
          return { isValid: false, reason: `Action "${action.type}" requires a target cluster ID.` };
        }
        break;
      }

      case 'SELECT_RELATIONSHIP':
      case 'FOCUS_RELATIONSHIP':
      case 'HIGHLIGHT_RELATIONSHIP': {
        const rel = params.relationshipId || action.target;
        if (!rel) {
          return { isValid: false, reason: `Action "${action.type}" requires a target relationship ID.` };
        }
        break;
      }

      case 'HIGHLIGHT_NEIGHBORHOOD': {
        const tgt = params.stateId || action.target;
        if (!tgt) {
          return { isValid: false, reason: `Action "${action.type}" requires a target state ID.` };
        }
        break;
      }

      case 'SEARCH_INFORMATION': {
        const q = params.searchQuery ?? action.target;
        if (q === undefined || typeof q !== 'string') {
          return { isValid: false, reason: `Action "${action.type}" requires a search query string.` };
        }
        break;
      }

      default:
        break;
    }

    return { isValid: true };
  }
}
