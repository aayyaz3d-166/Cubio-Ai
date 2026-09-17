/**
 * 3D Memory Studio — Funnel 61
 * Master Camera Focus & Framing Manager
 */

import { CameraState } from '../types';
import { calculateFrameDistance } from './frameManager';
import { panTo } from '../camera/panController';
import { setCameraDistance } from '../camera/zoomController';
import { calculateNeighborhoodFraming } from './neighborhoodFocus';
import { GraphRegistry } from '../../funnel58/graph/graphRegistry';

export class CameraFocusManager {
  public focusPosition(
    state: CameraState,
    position: readonly [number, number, number],
    distance?: number
  ): void {
    panTo(state, position);
    if (distance !== undefined) {
      setCameraDistance(state, distance);
    }
  }

  public focusState(
    state: CameraState,
    stateId: string,
    position: readonly [number, number, number],
    radius = 15
  ): void {
    state.focusedObjectId = stateId;
    state.mode = 'FOCUS';
    const dist = calculateFrameDistance(radius, state.fov, 25);
    this.focusPosition(state, position, dist);
  }

  public focusCluster(
    state: CameraState,
    clusterId: string,
    center: readonly [number, number, number],
    radius: number
  ): void {
    state.focusedObjectId = clusterId;
    state.mode = 'FOCUS';
    const dist = calculateFrameDistance(radius, state.fov, 35);
    this.focusPosition(state, center, dist);
  }

  public focusRelationship(
    state: CameraState,
    relId: string,
    sourcePos: readonly [number, number, number],
    targetPos: readonly [number, number, number]
  ): void {
    state.focusedObjectId = relId;
    state.mode = 'FOCUS';
    const midX = (sourcePos[0] + targetPos[0]) / 2;
    const midY = (sourcePos[1] + targetPos[1]) / 2;
    const midZ = (sourcePos[2] + targetPos[2]) / 2;

    const dx = targetPos[0] - sourcePos[0];
    const dy = targetPos[1] - sourcePos[1];
    const dz = targetPos[2] - sourcePos[2];
    const edgeLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const dist = calculateFrameDistance(edgeLength / 2, state.fov, 30);
    this.focusPosition(state, [midX, midY, midZ], dist);
  }

  public focusCore(
    state: CameraState,
    corePosition: readonly [number, number, number] = [0, 0, 0],
    coreRadius = 45
  ): void {
    state.focusedObjectId = 'MEMORY_CORE';
    state.mode = 'FOCUS';
    const dist = calculateFrameDistance(coreRadius, state.fov, 40);
    this.focusPosition(state, corePosition, dist);
  }

  public focusNeighborhood(
    state: CameraState,
    rootStateId: string,
    depth: number,
    graphRegistry: GraphRegistry,
    nodePositions: Map<string, [number, number, number]>
  ): boolean {
    const framing = calculateNeighborhoodFraming(
      rootStateId,
      depth,
      graphRegistry,
      nodePositions,
      state.fov
    );

    if (!framing) return false;

    state.focusedObjectId = rootStateId;
    state.mode = 'FOCUS';
    this.focusPosition(state, framing.center, framing.distance);
    return true;
  }
}
