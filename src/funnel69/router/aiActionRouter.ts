/**
 * 3D Memory Studio — Funnel 69
 * AI Action Router
 *
 * Routes validated structured actions to authoritative upstream adapters.
 * Never manipulates rendering/scene engines directly.
 */

import { AIAction } from '../types';
import { AIActionValidator } from './aiActionValidator';
import { CameraAIAdapter } from '../adapters/cameraAIAdapter';
import { GraphAIAdapter } from '../adapters/graphAIAdapter';
import { ClusterAIAdapter } from '../adapters/clusterAIAdapter';
import { DimensionAIAdapter } from '../adapters/dimensionAIAdapter';
import { SelectionAIAdapter } from '../adapters/selectionAIAdapter';

export interface ActionRouterAdapters {
  validator?: AIActionValidator;
  camera?: CameraAIAdapter;
  graph?: GraphAIAdapter;
  cluster?: ClusterAIAdapter;
  dimension?: DimensionAIAdapter;
  selection?: SelectionAIAdapter;
}

export interface ActionResult {
  action: AIAction;
  executed: boolean;
  message?: string;
}

export class AIActionRouter {
  public readonly validator: AIActionValidator;
  public readonly camera: CameraAIAdapter;
  public readonly graph: GraphAIAdapter;
  public readonly cluster: ClusterAIAdapter;
  public readonly dimension: DimensionAIAdapter;
  public readonly selection: SelectionAIAdapter;

  constructor(adapters?: ActionRouterAdapters) {
    this.validator = adapters?.validator ?? new AIActionValidator();
    this.camera = adapters?.camera ?? new CameraAIAdapter();
    this.graph = adapters?.graph ?? new GraphAIAdapter();
    this.cluster = adapters?.cluster ?? new ClusterAIAdapter();
    this.dimension = adapters?.dimension ?? new DimensionAIAdapter();
    this.selection = adapters?.selection ?? new SelectionAIAdapter();
  }

  public async executeActions(actions?: readonly AIAction[]): Promise<readonly ActionResult[]> {
    if (!actions || actions.length === 0) return [];

    const validation = this.validator.validateActions(actions);
    const results: ActionResult[] = [];

    for (const action of validation.sanitizedActions) {
      let executed = false;
      let message = '';

      switch (action.type) {
        case 'FOCUS_STATE':
          if (action.targetId) {
            executed = this.camera.focusState(action.targetId);
            this.selection.setSelectedStateId(action.targetId);
            message = `Focused state ${action.targetId} in 3D camera.`;
          }
          break;

        case 'FOCUS_CLUSTER':
          if (action.targetId) {
            this.cluster.highlightCluster(action.targetId);
            executed = this.camera.focusCluster(action.targetId);
            message = `Focused cluster ${action.targetId} in 3D.`;
          }
          break;

        case 'FOCUS_RELATIONSHIP':
          if (action.targetId) {
            executed = this.graph.highlightRelationship(action.targetId);
            message = `Highlighted relationship ${action.targetId} in 3D graph.`;
          }
          break;

        case 'SWITCH_DIMENSION':
          if (action.dimension) {
            executed = this.dimension.switchDimension(action.dimension);
            message = `Switched dimension to Z${action.dimension} (${this.dimension.getDimensionLabel(action.dimension)}).`;
          }
          break;

        case 'SHOW_INFORMATION':
          if (action.targetId) {
            executed = this.selection.setSelectedStateId(action.targetId);
            message = `Updated information panel target to ${action.targetId}.`;
          }
          break;

        case 'SHOW_DATABASE':
        case 'SHOW_GRAPH':
        case 'SHOW_CLUSTERS':
          executed = true;
          message = `Switched view mode to ${action.type}.`;
          break;

        default:
          executed = false;
          message = `Unknown action type.`;
          break;
      }

      results.push({ action, executed, message });
    }

    return results;
  }
}
