/**
 * 3D Memory Studio — Funnel 54
 * Advanced Scene Model Adapter
 *
 * Enriches F53 StudioViewModel with spatial depth falloff, focus mode dimming,
 * cluster emphasis, and deterministic ambient particle fields.
 */

import { StudioViewModel } from '../../funnel53/types';
import {
  AdvancedSceneModel,
  AdvancedSceneNode,
  AdvancedSceneEdge,
  AdvancedSceneCluster,
  StudioPresentationMode,
} from '../types';
import { calculateDepthOpacity, calculateDepthScale } from '../visual/depthRenderer';
import { generateAdvancedParticles } from '../visual/advancedParticleField';

export function deriveAdvancedSceneModel(
  studioVm: StudioViewModel,
  presentationMode: StudioPresentationMode = 'SPACE',
  focusedClusterId: string | null = null,
  prefersReducedMotion = false
): AdvancedSceneModel {
  const selectedNodeId = studioVm.selectedNode?.stateId ?? null;
  const isFocusMode = presentationMode === 'FOCUS' || selectedNodeId !== null || focusedClusterId !== null;

  // 1. Enrich Nodes
  const nodes: AdvancedSceneNode[] = studioVm.nodes.map((n) => {
    const depthOpacity = calculateDepthOpacity(n.zDepth);
    const depthScale = calculateDepthScale(n.zDepth, n.scale);

    const isSelected = n.stateId === selectedNodeId;
    const belongsToFocusedCluster = focusedClusterId ? n.clusterId === focusedClusterId : false;
    const isFocused = isSelected || belongsToFocusedCluster;
    const isDimmed = isFocusMode && !isFocused && !n.isHighlighted;

    const ringRadius = (n.radius + 4) * depthScale;

    return Object.freeze({
      ...n,
      depthOpacity,
      depthScale,
      isDimmed,
      isFocused,
      ringRadius,
    });
  });

  const selectedNode = nodes.find((n) => n.stateId === selectedNodeId) || null;
  const hoveredNode = studioVm.hoveredNode ? nodes.find((n) => n.stateId === studioVm.hoveredNode!.stateId) || null : null;

  // 2. Enrich Edges
  const edges: AdvancedSceneEdge[] = studioVm.edges.map((e) => {
    const isConnectedToSelected = selectedNodeId
      ? e.sourceNodeId === selectedNodeId || e.targetNodeId === selectedNodeId
      : false;
    const isFocused = isConnectedToSelected;
    const isDimmed = isFocusMode && !isFocused;
    const depthOpacity = isDimmed ? e.opacity * 0.25 : e.opacity;

    return Object.freeze({
      ...e,
      depthOpacity,
      isDimmed,
      isFocused,
    });
  });

  // 3. Enrich Clusters
  const clusters: AdvancedSceneCluster[] = studioVm.clusters.map((c) => {
    const isFocused = focusedClusterId === c.clusterId;
    const isDimmed = isFocusMode && focusedClusterId !== null && !isFocused;

    return Object.freeze({
      ...c,
      isDimmed,
      isFocused,
    });
  });

  // 4. Generate Advanced Ambient Particles (bounded <= 100)
  const particles = generateAdvancedParticles(
    48,
    studioVm.activeDimension,
    studioVm.sourceWorldState.simulationTimeMs,
    studioVm.camera,
    studioVm.sourceWorldState.seed,
    prefersReducedMotion
  );

  return Object.freeze({
    core: studioVm.core,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    clusters: Object.freeze(clusters),
    particles,
    telemetry: studioVm.telemetry,
    projection: studioVm.projection,
    camera: studioVm.camera,
    presentationMode,
    selectedNode,
    focusedClusterId,
    hoveredNode,
    highlightedNodeIds: studioVm.highlightedNodeIds,
    activeDimension: studioVm.activeDimension,
    speed: studioVm.speed,
    isPaused: studioVm.isPaused,
    searchQuery: studioVm.searchQuery,
    activeFilter: studioVm.activeFilter,
    prefersReducedMotion,
    sourceStudioViewModel: studioVm,
  });
}
