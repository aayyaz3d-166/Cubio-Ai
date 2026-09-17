/**
 * 3D Memory Studio — Funnel 69
 * AI Action Validator
 */

import { AIAction, AIActionType } from '../types';
import { SecurityAIAdapter } from '../adapters/securityAIAdapter';
import { MAX_ACTIONS_PER_RESPONSE } from '../context/contextLimits';

const VALID_ACTION_TYPES: ReadonlySet<AIActionType> = new Set([
  'FOCUS_STATE',
  'FOCUS_CLUSTER',
  'FOCUS_RELATIONSHIP',
  'SHOW_INFORMATION',
  'SHOW_DATABASE',
  'SHOW_GRAPH',
  'SHOW_CLUSTERS',
  'SWITCH_DIMENSION',
]);

const VALID_DIMENSIONS = new Set([1, 2, 3, 4, 8, 12, 16]);

export interface ActionValidationResult {
  isValid: boolean;
  sanitizedActions: AIAction[];
  rejectedReasons: string[];
}

export class AIActionValidator {
  constructor(private readonly security: SecurityAIAdapter = new SecurityAIAdapter()) {}

  public validateActions(actions?: readonly AIAction[]): ActionValidationResult {
    if (!actions || actions.length === 0) {
      return { isValid: true, sanitizedActions: [], rejectedReasons: [] };
    }

    const sanitizedActions: AIAction[] = [];
    const rejectedReasons: string[] = [];

    // Enforce hard cap
    const boundedActions = actions.slice(0, MAX_ACTIONS_PER_RESPONSE);

    for (let i = 0; i < boundedActions.length; i++) {
      const action = boundedActions[i];

      // 1. Check type
      if (!VALID_ACTION_TYPES.has(action.type)) {
        rejectedReasons.push(`Invalid action type: "${(action as any).type}"`);
        continue;
      }

      // 2. Check targetId security
      if (action.targetId) {
        if (!this.security.isStatePermitted(action.targetId)) {
          rejectedReasons.push(`Security violation: targetId "${action.targetId}" is classified RED / restricted.`);
          continue;
        }
      }

      // 3. Dimension check
      if (action.type === 'SWITCH_DIMENSION') {
        if (!action.dimension || !VALID_DIMENSIONS.has(action.dimension)) {
          rejectedReasons.push(`Invalid dimension "${action.dimension}". Supported: 1, 2, 3, 4, 8, 12, 16.`);
          continue;
        }
      }

      // 4. Focus target check
      if (
        (action.type === 'FOCUS_STATE' ||
          action.type === 'FOCUS_CLUSTER' ||
          action.type === 'FOCUS_RELATIONSHIP') &&
        !action.targetId
      ) {
        rejectedReasons.push(`Action "${action.type}" requires targetId.`);
        continue;
      }

      sanitizedActions.push(action);
    }

    return {
      isValid: rejectedReasons.length === 0,
      sanitizedActions,
      rejectedReasons,
    };
  }
}
