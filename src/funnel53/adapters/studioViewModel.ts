/**
 * 3D Memory Studio — Funnel 53
 * Studio View Model Adapter
 *
 * Transforms F52 SimulationWorldState into an immutable, renderable StudioViewModel.
 */

import { SimulationWorldState } from '../../funnel52/types';
import {
  StudioViewModel,
  StudioNodeViewModel,
  StudioEdgeViewModel,
  StudioClusterViewModel,
  StudioCoreViewModel,
} from '../types';
import { project3DCoordinateToScreen } from '../visual/cameraController';
import { formatSequence369Stream } from '../visual/stateRenderer';

export function deriveStudioViewModel(
  world: SimulationWorldState,
  hoveredNodeId: string | null = null
): StudioViewModel {
  const camera = world.camera;

  // 1. Project Memory Core in center (0, 0, 0)
  const coreProj = project3DCoordinateToScreen(0, 0, 0, camera);
  const corePulse = 1.0 + Math.sin(world.simulationTimeMs * 0.003) * 0.05;

  const core: StudioCoreViewModel = Object.freeze({
    screenX: coreProj.screenX,
    screenY: coreProj.screenY,
    scale: coreProj.scale,
    radius: 28 * coreProj.scale,
    activeDimension: world.activeDimension,
    pulseScale: corePulse,
    label: `Z${world.activeDimension} CORE`,
  });

  // 2. Project State Nodes
  const nodeMap = new Map<string, StudioNodeViewModel>();
  const nodes: StudioNodeViewModel[] = world.activeNodes.map((n) => {
    const proj = project3DCoordinateToScreen(n.x, n.y, n.z, camera);
    const isSelected = world.selectedStateId === n.stateId;
    const isHighlighted = world.highlightedStateIds.includes(n.stateId);
    const isHovered = hoveredNodeId === n.stateId;

    const nodeVm: StudioNodeViewModel = Object.freeze({
      stateId: n.stateId,
      recordId: n.recordId,
      entityName: n.entityName,
      category: n.category,
      sourceDomain: n.sourceDomain,
      classification: n.classification,
      processingAllowed: n.processingAllowed,
      lifecycleStage: n.lifecycleStage,
      sequence369: n.sequence369,
      sequence369Formatted: formatSequence369Stream(n.sequence369),
      numericStateBigIntString: n.numericStateBigIntString,
      formattedCoordinate: n.formattedCoordinate,
      coordinateValues: n.coordinateValues,
      checksum: n.checksum,
      x: n.x,
      y: n.y,
      z: n.z,
      screenX: proj.screenX,
      screenY: proj.screenY,
      scale: proj.scale,
      zDepth: proj.zDepth,
      radius: n.radius * proj.scale,
      colorHex: isHighlighted ? '#f59e0b' : isSelected ? '#38bdf8' : n.colorHex,
      clusterId: n.clusterId,
      isSelected,
      isHighlighted,
      isHovered,
      sourceState: n.sourceState,
    });

    nodeMap.set(n.stateId, nodeVm);
    return nodeVm;
  });

  // Sort nodes by z-depth descending (painter's algorithm)
  nodes.sort((a, b) => b.zDepth - a.zDepth);

  // 3. Project Relational Edges
  const edges: StudioEdgeViewModel[] = [];
  for (const edge of world.activeEdges) {
    const src = nodeMap.get(edge.sourceNodeId);
    const tgt = nodeMap.get(edge.targetNodeId);
    if (!src || !tgt) continue;

    edges.push(
      Object.freeze({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        relationshipType: edge.relationshipType,
        opacity: Math.min(1.0, edge.opacity * Math.min(src.scale, tgt.scale)),
        colorHex: edge.colorHex,
        x1: src.screenX,
        y1: src.screenY,
        x2: tgt.screenX,
        y2: tgt.screenY,
        strokeWidth: Math.max(0.8, 1.5 * Math.min(src.scale, tgt.scale)),
      })
    );
  }

  // 4. Project Clusters
  const clusters: StudioClusterViewModel[] = world.clusters.map((c) => {
    const proj = project3DCoordinateToScreen(c.centerX, c.centerY, c.centerZ, camera);
    return Object.freeze({
      clusterId: c.clusterId,
      label: c.label,
      colorHex: c.colorHex,
      centerX: c.centerX,
      centerY: c.centerY,
      centerZ: c.centerZ,
      screenX: proj.screenX,
      screenY: proj.screenY,
      screenRadius: c.radius * proj.scale,
      scale: proj.scale,
      memberCount: c.memberStateIds.length,
    });
  });

  const selectedNode = world.selectedStateId ? nodeMap.get(world.selectedStateId) || null : null;
  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) || null : null;

  return Object.freeze({
    core,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    clusters: Object.freeze(clusters),
    particles: world.particles,
    telemetry: world.telemetry,
    projection: world.projection,
    camera: world.camera,
    selectedNode,
    hoveredNode,
    highlightedNodeIds: world.highlightedStateIds,
    activeDimension: world.activeDimension,
    speed: world.speed,
    isPaused: world.isPaused,
    searchQuery: world.searchQuery,
    activeFilter: world.activeFilter,
    sourceWorldState: world,
  });
}
