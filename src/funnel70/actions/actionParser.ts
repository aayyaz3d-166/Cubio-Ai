/**
 * 3D Memory Studio — Funnel 70
 * Natural Language Action Parser
 *
 * Deterministically parses natural language prompts and queries into
 * strongly typed StudioActions. Never guesses dangerous or unknown targets.
 */

import { StudioAction, StudioActionSource } from '../types';
import { CameraPresetType } from '../../funnel61/types';
import { ClusterLayoutMode } from '../../funnel59/types';
import { SectionId } from '../../funnel66/types';

let actionCounter = 0;

export function resetActionCounter(): void {
  actionCounter = 0;
}

export interface ActionParseResult {
  readonly success: boolean;
  readonly action?: StudioAction;
  readonly error?: string;
  readonly isAmbiguous?: boolean;
}

export class ActionParser {
  public parseCommand(
    text: string,
    context?: {
      selectedStateId?: string | null;
      selectedClusterId?: string | null;
      selectedRelationshipId?: string | null;
      source?: StudioActionSource;
    }
  ): ActionParseResult {
    const raw = text.trim();
    if (!raw) {
      return { success: false, error: 'Command string is empty.' };
    }

    const lower = raw.toLowerCase();
    const source = context?.source ?? 'AI';
    actionCounter++;
    const actionId = `act-${String(actionCounter).padStart(4, '0')}`;

    // 1. DIMENSION SWITCH: e.g. "Switch to Z8", "Change dimension to Z3", "Set dimension 4"
    const dimMatch = lower.match(/(?:switch|change|set)(?:\s+dimension)?\s+to\s+z?(\d+)/i) ||
                     lower.match(/dimension\s+z?(\d+)/i);
    if (dimMatch) {
      const dimNum = parseInt(dimMatch[1], 10);
      return {
        success: true,
        action: {
          id: actionId,
          type: 'SWITCH_DIMENSION',
          source,
          timestamp: Date.now(),
          target: String(dimNum),
          parameters: { dimension: dimNum as any },
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    // 2. CAMERA PRESETS: e.g. "Go to top view", "Set camera to front", "Isometric view"
    if (lower.includes('top view') || lower.includes('preset top')) {
      return this.createPresetAction(actionId, source, 'TOP');
    }
    if (lower.includes('front view') || lower.includes('preset front')) {
      return this.createPresetAction(actionId, source, 'FRONT');
    }
    if (lower.includes('side view') || lower.includes('preset side')) {
      return this.createPresetAction(actionId, source, 'SIDE');
    }
    if (lower.includes('default view') || lower.includes('reset view')) {
      return this.createPresetAction(actionId, source, 'DEFAULT');
    }

    // 3. CAMERA RESET & FIT
    if (lower.includes('reset camera')) {
      return {
        success: true,
        action: {
          id: actionId,
          type: 'RESET_CAMERA',
          source,
          timestamp: Date.now(),
          confidence: 0.98,
          status: 'PENDING',
        },
      };
    }
    if (lower.includes('fit selected') || lower.includes('fit object')) {
      return {
        success: true,
        action: {
          id: actionId,
          type: 'FIT_SELECTED',
          source,
          timestamp: Date.now(),
          target: context?.selectedStateId ?? undefined,
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    // 4. FOCUS STATE: "Focus STATE_049", "Show STATE_049 in 3D"
    const stateMatch = raw.match(/\b(STATE_[A-Za-z0-9_]+|STATE_\d{3})\b/i);
    if (stateMatch) {
      const stateId = stateMatch[1].toUpperCase();
      return {
        success: true,
        action: {
          id: actionId,
          type: 'FOCUS_STATE',
          source,
          timestamp: Date.now(),
          target: stateId,
          parameters: { stateId },
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    // 4b. "Focus this state" / "Show this state in 3D" (uses context)
    if (
      lower.includes('this state in 3d') ||
      lower.includes('focus this state') ||
      lower.includes('focus the state') ||
      lower.includes('show this state')
    ) {
      if (!context?.selectedStateId) {
        return {
          success: false,
          isAmbiguous: true,
          error: 'Please select a state first.',
        };
      }
      return {
        success: true,
        action: {
          id: actionId,
          type: 'FOCUS_STATE',
          source,
          timestamp: Date.now(),
          target: context.selectedStateId,
          parameters: { stateId: context.selectedStateId },
          confidence: 0.9,
          status: 'PENDING',
        },
      };
    }

    // 5. CLUSTERS: Layout, Show, Focus
    const clusterMatch = raw.match(/\b(CLUSTER_[A-Za-z0-9_]+|CLUSTER_\d{2})\b/i);
    if (clusterMatch) {
      const clusterId = clusterMatch[1].toUpperCase();
      return {
        success: true,
        action: {
          id: actionId,
          type: 'FOCUS_CLUSTER',
          source,
          timestamp: Date.now(),
          target: clusterId,
          parameters: { clusterId },
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    if (lower.includes('change cluster layout to') || lower.includes('cluster layout')) {
      const layoutMatch = lower.match(/(?:to\s+)?(radial|grid|orbital|hierarchical|domain_radial)/i);
      if (layoutMatch) {
        const layoutMode = layoutMatch[1].toUpperCase() as ClusterLayoutMode;
        return {
          success: true,
          action: {
            id: actionId,
            type: 'CHANGE_CLUSTER_LAYOUT',
            source,
            timestamp: Date.now(),
            target: layoutMode,
            parameters: { clusterLayout: layoutMode },
            confidence: 0.95,
            status: 'PENDING',
          },
        };
      }
    }

    if (lower.includes('show clusters') || lower.includes('open clusters')) {
      return {
        success: true,
        action: {
          id: actionId,
          type: 'SHOW_CLUSTERS',
          source,
          timestamp: Date.now(),
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }
    if (lower.includes('hide clusters')) {
      return {
        success: true,
        action: {
          id: actionId,
          type: 'HIDE_CLUSTERS',
          source,
          timestamp: Date.now(),
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    // 6. GRAPH: Relationships, Neighborhood, Show/Hide
    if (lower.includes('its relationships') || lower.includes('graph neighborhood') || lower.includes('connected states')) {
      if (!context?.selectedStateId) {
        return {
          success: false,
          isAmbiguous: true,
          error: 'Please select a state first.',
        };
      }
      return {
        success: true,
        action: {
          id: actionId,
          type: 'HIGHLIGHT_NEIGHBORHOOD',
          source,
          timestamp: Date.now(),
          target: context.selectedStateId,
          parameters: { stateId: context.selectedStateId },
          confidence: 0.9,
          status: 'PENDING',
        },
      };
    }

    const relMatch = raw.match(/\b(REL_[A-Za-z0-9_]+|REL_\d{3})\b/i);
    if (relMatch) {
      const relId = relMatch[1].toUpperCase();
      return {
        success: true,
        action: {
          id: actionId,
          type: 'HIGHLIGHT_RELATIONSHIP',
          source,
          timestamp: Date.now(),
          target: relId,
          parameters: { relationshipId: relId },
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    if (lower.includes('show graph') || lower.includes('open graph')) {
      return {
        success: true,
        action: {
          id: actionId,
          type: 'SHOW_GRAPH',
          source,
          timestamp: Date.now(),
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }
    if (lower.includes('hide graph')) {
      return {
        success: true,
        action: {
          id: actionId,
          type: 'HIDE_GRAPH',
          source,
          timestamp: Date.now(),
          confidence: 0.95,
          status: 'PENDING',
        },
      };
    }

    // 7. SEARCH: e.g. "Search W3C", "Find HTTP/2"
    const searchMatch = lower.match(/(?:search|find)\s+(?:for\s+)?(.+)/i);
    if (searchMatch && !lower.includes('open') && !lower.includes('show')) {
      const q = searchMatch[1].trim();
      return {
        success: true,
        action: {
          id: actionId,
          type: 'SEARCH_INFORMATION',
          source,
          timestamp: Date.now(),
          target: q,
          parameters: { searchQuery: q },
          confidence: 0.9,
          status: 'PENDING',
        },
      };
    }

    // 8. PANEL & NAVIGATION: "Open database", "Show information", "Open coordinates", "Open settings"
    const sections: Array<[string, SectionId]> = [
      ['database', 'DATABASE'],
      ['coordinates', 'COORDINATES'],
      ['information', 'INFORMATION'],
      ['chat', 'CHAT'],
      ['graph', 'GRAPH'],
      ['clusters', 'CLUSTERS'],
      ['dimensions', 'DIMENSIONS'],
      ['search', 'SEARCH'],
      ['settings', 'SETTINGS'],
    ];

    for (const [kw, secId] of sections) {
      if (lower.includes(`open ${kw}`) || lower.includes(`show ${kw}`) || lower.includes(`navigate to ${kw}`)) {
        return {
          success: true,
          action: {
            id: actionId,
            type: 'OPEN_PANEL',
            source,
            timestamp: Date.now(),
            target: secId,
            parameters: { panelId: secId, sectionId: secId },
            confidence: 0.95,
            status: 'PENDING',
          },
        };
      }
      if (lower.includes(`close ${kw}`) || lower.includes(`hide ${kw}`)) {
        return {
          success: true,
          action: {
            id: actionId,
            type: 'CLOSE_PANEL',
            source,
            timestamp: Date.now(),
            target: secId,
            parameters: { panelId: secId, sectionId: secId },
            confidence: 0.95,
            status: 'PENDING',
          },
        };
      }
    }

    // 9. VIEWPORT HELPERS: Axes and Grid
    if (lower.includes('show axes')) {
      return { success: true, action: { id: actionId, type: 'SHOW_AXES', source, timestamp: Date.now(), confidence: 0.95, status: 'PENDING' } };
    }
    if (lower.includes('hide axes')) {
      return { success: true, action: { id: actionId, type: 'HIDE_AXES', source, timestamp: Date.now(), confidence: 0.95, status: 'PENDING' } };
    }
    if (lower.includes('show grid')) {
      return { success: true, action: { id: actionId, type: 'SHOW_GRID', source, timestamp: Date.now(), confidence: 0.95, status: 'PENDING' } };
    }
    if (lower.includes('hide grid')) {
      return { success: true, action: { id: actionId, type: 'HIDE_GRID', source, timestamp: Date.now(), confidence: 0.95, status: 'PENDING' } };
    }

    return {
      success: false,
      error: `Could not determine a safe Studio action for: "${text}"`,
    };
  }

  private createPresetAction(id: string, source: StudioActionSource, preset: CameraPresetType): ActionParseResult {
    return {
      success: true,
      action: {
        id,
        type: 'SET_CAMERA_PRESET',
        source,
        timestamp: Date.now(),
        target: preset,
        parameters: { cameraPreset: preset },
        confidence: 0.98,
        status: 'PENDING',
      },
    };
  }
}
