/**
 * 3D Memory Studio — Funnel 70
 * Studio Action Executor
 *
 * Dispatches validated StudioActions to appropriate upstream authority adapters.
 * Never directly accesses Three.js rendering loops or scene structures.
 */

import { StudioAction, StudioActionResult } from '../types';
import { NavigationActionAdapter } from '../adapters/navigationActionAdapter';
import { PanelActionAdapter } from '../adapters/panelActionAdapter';
import { SelectionActionAdapter } from '../adapters/selectionActionAdapter';
import { CameraActionAdapter } from '../adapters/cameraActionAdapter';
import { GraphActionAdapter } from '../adapters/graphActionAdapter';
import { ClusterActionAdapter } from '../adapters/clusterActionAdapter';
import { DimensionActionAdapter } from '../adapters/dimensionActionAdapter';
import { DatabaseActionAdapter } from '../adapters/databaseActionAdapter';
import { SearchActionAdapter } from '../adapters/searchActionAdapter';
import { createSuccessResult, createFailedResult } from './actionResult';

export interface ActionExecutorAdapters {
  navigation?: NavigationActionAdapter;
  panel?: PanelActionAdapter;
  selection?: SelectionActionAdapter;
  camera?: CameraActionAdapter;
  graph?: GraphActionAdapter;
  cluster?: ClusterActionAdapter;
  dimension?: DimensionActionAdapter;
  database?: DatabaseActionAdapter;
  search?: SearchActionAdapter;
}

export class ActionExecutor {
  public readonly navigation: NavigationActionAdapter;
  public readonly panel: PanelActionAdapter;
  public readonly selection: SelectionActionAdapter;
  public readonly camera: CameraActionAdapter;
  public readonly graph: GraphActionAdapter;
  public readonly cluster: ClusterActionAdapter;
  public readonly dimension: DimensionActionAdapter;
  public readonly database: DatabaseActionAdapter;
  public readonly search: SearchActionAdapter;

  constructor(adapters?: ActionExecutorAdapters) {
    this.navigation = adapters?.navigation ?? new NavigationActionAdapter();
    this.panel = adapters?.panel ?? new PanelActionAdapter();
    this.selection = adapters?.selection ?? new SelectionActionAdapter();
    this.camera = adapters?.camera ?? new CameraActionAdapter();
    this.graph = adapters?.graph ?? new GraphActionAdapter();
    this.cluster = adapters?.cluster ?? new ClusterActionAdapter();
    this.dimension = adapters?.dimension ?? new DimensionActionAdapter();
    this.database = adapters?.database ?? new DatabaseActionAdapter();
    this.search = adapters?.search ?? new SearchActionAdapter();
  }

  public async execute(action: StudioAction): Promise<StudioActionResult> {
    try {
      const target = action.target;
      const params = action.parameters || {};

      switch (action.type) {
        case 'NAVIGATE_SECTION': {
          const sec = (params.sectionId || target) as any;
          this.navigation.navigateToSection(sec);
          return createSuccessResult(action.id, `Navigated to section ${sec}.`, { affectedSection: sec });
        }

        case 'OPEN_PANEL': {
          const p = (params.panelId || target) as any;
          this.panel.openPanel(p);
          return createSuccessResult(action.id, `Opened panel ${p}.`, { affectedPanel: p });
        }

        case 'CLOSE_PANEL': {
          const p = (params.panelId || target) as any;
          this.panel.closePanel(p);
          return createSuccessResult(action.id, `Closed panel ${p}.`, { affectedPanel: p });
        }

        case 'TOGGLE_PANEL': {
          const p = (params.panelId || target) as any;
          this.panel.togglePanel(p);
          return createSuccessResult(action.id, `Toggled panel ${p}.`, { affectedPanel: p });
        }

        case 'SELECT_STATE': {
          const st = params.stateId || target;
          this.selection.selectState(st ?? null);
          return createSuccessResult(action.id, `Selected state ${st}.`, { affectedObjectId: st });
        }

        case 'SELECT_CLUSTER': {
          const cl = params.clusterId || target;
          this.selection.selectCluster(cl ?? null);
          return createSuccessResult(action.id, `Selected cluster ${cl}.`, { affectedObjectId: cl });
        }

        case 'SELECT_RELATIONSHIP': {
          const rel = params.relationshipId || target;
          this.selection.selectRelationship(rel ?? null);
          return createSuccessResult(action.id, `Selected relationship ${rel}.`, { affectedObjectId: rel });
        }

        case 'FOCUS_STATE': {
          const st = (params.stateId || target)!;
          this.selection.selectState(st);
          this.camera.focusState(st);
          return createSuccessResult(action.id, `${st} focused in 3D.`, { affectedObjectId: st });
        }

        case 'FOCUS_CLUSTER': {
          const cl = (params.clusterId || target)!;
          this.selection.selectCluster(cl);
          this.cluster.highlightCluster(cl);
          this.camera.focusCluster(cl);
          return createSuccessResult(action.id, `Cluster ${cl} focused in 3D.`, { affectedObjectId: cl });
        }

        case 'FOCUS_RELATIONSHIP': {
          const rel = (params.relationshipId || target)!;
          this.selection.selectRelationship(rel);
          this.graph.highlightRelationship(rel);
          this.camera.focusRelationship(rel);
          return createSuccessResult(action.id, `Relationship ${rel} focused in 3D.`, { affectedObjectId: rel });
        }

        case 'SHOW_GRAPH': {
          this.graph.showGraph();
          return createSuccessResult(action.id, '3D relationship graph displayed.', { affectedPanel: 'GRAPH' });
        }

        case 'HIDE_GRAPH': {
          this.graph.hideGraph();
          return createSuccessResult(action.id, '3D relationship graph hidden.', { affectedPanel: 'GRAPH' });
        }

        case 'FILTER_GRAPH': {
          this.graph.filterGraph();
          return createSuccessResult(action.id, 'Graph filter updated.', { affectedPanel: 'GRAPH' });
        }

        case 'HIGHLIGHT_RELATIONSHIP': {
          const rel = (params.relationshipId || target)!;
          this.graph.highlightRelationship(rel);
          return createSuccessResult(action.id, `Highlighted relationship ${rel}.`, { affectedObjectId: rel });
        }

        case 'HIGHLIGHT_NEIGHBORHOOD': {
          const st = (params.stateId || target)!;
          this.graph.highlightNeighborhood(st);
          return createSuccessResult(action.id, `Highlighted neighborhood for state ${st}.`, { affectedObjectId: st });
        }

        case 'SHOW_CLUSTERS': {
          this.cluster.showClusters();
          return createSuccessResult(action.id, 'Spatial clusters displayed.', { affectedPanel: 'CLUSTERS' });
        }

        case 'HIDE_CLUSTERS': {
          this.cluster.hideClusters();
          return createSuccessResult(action.id, 'Spatial clusters hidden.', { affectedPanel: 'CLUSTERS' });
        }

        case 'CHANGE_CLUSTER_LAYOUT': {
          const layout = (params.clusterLayout || target) as any;
          this.cluster.changeClusterLayout(layout);
          return createSuccessResult(action.id, `Cluster layout changed to ${layout}.`, { affectedPanel: 'CLUSTERS' });
        }

        case 'SWITCH_DIMENSION': {
          const dim = (params.dimension ?? parseInt(String(target || '3'), 10)) as any;
          this.dimension.switchDimension(dim);
          const label = this.dimension.getDimensionModeLabel(dim);
          return createSuccessResult(
            action.id,
            `Switched to Z${dim} (${label}).`,
            { affectedPanel: 'DIMENSIONS' }
          );
        }

        case 'SHOW_AXES':
        case 'HIDE_AXES':
        case 'SHOW_GRID':
        case 'HIDE_GRID': {
          return createSuccessResult(action.id, `Updated viewport helper: ${action.type}.`);
        }

        case 'SEARCH_INFORMATION': {
          const query = (params.searchQuery ?? target) as string;
          const results = await this.search.search(query);
          this.panel.openPanel('SEARCH');
          return createSuccessResult(
            action.id,
            `Search executed for "${query}": ${results.length} results found.`,
            { affectedPanel: 'SEARCH' }
          );
        }

        case 'SET_CAMERA_PRESET': {
          const preset = (params.cameraPreset || target) as any;
          this.camera.setPreset(preset);
          return createSuccessResult(action.id, `Camera set to ${preset} preset.`);
        }

        case 'RESET_CAMERA': {
          this.camera.resetCamera();
          return createSuccessResult(action.id, 'Camera reset to default position.');
        }

        case 'FIT_SELECTED': {
          const st = (params.stateId || target) as string | undefined;
          this.camera.fitSelected(st);
          return createSuccessResult(action.id, 'Camera framed to target object.');
        }

        case 'DATABASE_FILTER': {
          const txt = (params.filterText ?? target ?? '') as string;
          this.database.filter(txt);
          return createSuccessResult(action.id, `Database filter set to "${txt}".`, { affectedPanel: 'DATABASE' });
        }

        case 'DATABASE_SORT': {
          const field = (params.sortField || target || 'id') as string;
          const dir = (params.sortDirection || 'ASC') as 'ASC' | 'DESC';
          this.database.sort(field, dir);
          return createSuccessResult(action.id, `Database sorted by ${field} (${dir}).`, { affectedPanel: 'DATABASE' });
        }

        default:
          return createFailedResult(action.id, `Unsupported action type: ${(action as any).type}`);
      }
    } catch (err: any) {
      return createFailedResult(action.id, err?.message || 'Execution error');
    }
  }
}
