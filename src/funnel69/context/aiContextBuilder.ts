/**
 * 3D Memory Studio — Funnel 69
 * AI Context Builder
 *
 * Constructs permitted context from upstream adapters without exposing full app state.
 * Strictly blocks RED data from ever entering prompts or context.
 */

import { SecurityAIAdapter, RESTRICTED_NOTICE } from '../adapters/securityAIAdapter';
import { SearchAIAdapter } from '../adapters/searchAIAdapter';
import { DatabaseAIAdapter } from '../adapters/databaseAIAdapter';
import { GraphAIAdapter } from '../adapters/graphAIAdapter';
import { ClusterAIAdapter } from '../adapters/clusterAIAdapter';
import { DimensionAIAdapter } from '../adapters/dimensionAIAdapter';
import { CoordinateAIAdapter } from '../adapters/coordinateAIAdapter';
import { SelectionAIAdapter } from '../adapters/selectionAIAdapter';
import { AIContext } from '../types';
import { MAX_CONTEXT_STATES, MAX_CONTEXT_RELATIONSHIPS } from './contextLimits';

export interface ContextBuilderAdapters {
  security?: SecurityAIAdapter;
  search?: SearchAIAdapter;
  database?: DatabaseAIAdapter;
  graph?: GraphAIAdapter;
  cluster?: ClusterAIAdapter;
  dimension?: DimensionAIAdapter;
  coordinate?: CoordinateAIAdapter;
  selection?: SelectionAIAdapter;
}

export class AIContextBuilder {
  public readonly security: SecurityAIAdapter;
  public readonly search: SearchAIAdapter;
  public readonly database: DatabaseAIAdapter;
  public readonly graph: GraphAIAdapter;
  public readonly cluster: ClusterAIAdapter;
  public readonly dimension: DimensionAIAdapter;
  public readonly coordinate: CoordinateAIAdapter;
  public readonly selection: SelectionAIAdapter;

  constructor(adapters?: ContextBuilderAdapters) {
    this.security = adapters?.security ?? new SecurityAIAdapter();
    this.search = adapters?.search ?? new SearchAIAdapter();
    this.database = adapters?.database ?? new DatabaseAIAdapter();
    this.graph = adapters?.graph ?? new GraphAIAdapter();
    this.cluster = adapters?.cluster ?? new ClusterAIAdapter();
    this.dimension = adapters?.dimension ?? new DimensionAIAdapter();
    this.coordinate = adapters?.coordinate ?? new CoordinateAIAdapter();
    this.selection = adapters?.selection ?? new SelectionAIAdapter();
  }

  public async buildContext(query: string, targetStateId?: string): Promise<AIContext> {
    // 1. Security check on prompt & target
    const promptCheck = this.security.sanitizePrompt(query);
    const effectiveTargetId = targetStateId ?? this.extractStateId(query) ?? this.selection.getSelectedStateId() ?? undefined;

    if (!promptCheck.isClean || (effectiveTargetId && !this.security.isStatePermitted(effectiveTargetId))) {
      return {
        query,
        classification: 'RED',
        formattedPromptContext: `RESTRICTED CONTEXT:\n${RESTRICTED_NOTICE}`,
      };
    }

    const activeDim = this.dimension.getActiveDimension();
    const dimLabel = this.dimension.getDimensionLabel(activeDim);
    const isPhysical = this.dimension.isPhysicalSpatial(activeDim);

    let entityType: string | undefined;
    let coords: readonly [number, number, number] | undefined;
    let rels: readonly string[] | undefined;
    let clusterId: string | undefined;
    let searchResults: string[] = [];

    if (effectiveTargetId) {
      const record = this.database.getRecord(effectiveTargetId);
      if (record) {
        entityType = record.type;
        clusterId = record.clusterId;
      }

      coords = this.coordinate.getCoordinatesForState(effectiveTargetId, 'GREEN');
      rels = this.graph.getRelationshipsForState(effectiveTargetId);

      if (!clusterId) {
        const clusterInfo = this.cluster.getClusterForState(effectiveTargetId);
        if (clusterInfo) {
          clusterId = clusterInfo.clusterId;
        }
      }
    } else {
      // General search query context
      const matches = await this.search.getPermittedStateIds(query);
      searchResults = [...matches.slice(0, MAX_CONTEXT_STATES)];
    }

    // Format deterministic text context for LLM prompt
    const lines: string[] = [];
    lines.push(`STUDIO CONTEXT:`);
    lines.push(`DIMENSION: Z${activeDim} (${dimLabel})`);
    lines.push(`MODE: ${isPhysical ? 'ACTUAL 3D SPATIAL MODE' : 'COMPUTATIONAL PROJECTION'}`);

    if (effectiveTargetId) {
      lines.push(`TARGET: ${effectiveTargetId}`);
      if (entityType) lines.push(`TYPE: ${entityType}`);
      lines.push(`CLASSIFICATION: GREEN`);
      if (coords) lines.push(`POSITION: [${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}, ${coords[2].toFixed(2)}]`);
      if (rels) lines.push(`RELATIONSHIPS: ${rels.length}`);
      if (clusterId) lines.push(`CLUSTER: ${clusterId}`);
    } else if (searchResults.length > 0) {
      lines.push(`SEARCH MATCHES (${searchResults.length}): ${searchResults.slice(0, 10).join(', ')}`);
    }

    return {
      query,
      selectedStateId: effectiveTargetId,
      entityType,
      classification: 'GREEN',
      dimension: activeDim,
      dimensionLabel: dimLabel,
      isPhysicalSpatial: isPhysical,
      coordinates: coords,
      relationships: rels,
      clusterId,
      searchResults,
      formattedPromptContext: lines.join('\n'),
    };
  }

  private extractStateId(text: string): string | null {
    const match = text.match(/\b(STATE_[A-Za-z0-9_]+|STATE_\d{3})\b/i);
    return match ? match[1].toUpperCase() : null;
  }
}
