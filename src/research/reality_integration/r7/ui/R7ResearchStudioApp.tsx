/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Observable Reality 3D Studio Research Application
 *
 * Provides live integration connecting R1-R6 Observable Reality directly to the R7 3D Viewport.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { RealityStateEngine } from '../../r2/realityStateEngine';
import { RealityMultiObjectEngine } from '../../r4/multiObjectEngine';
import { RealitySpatialEngine } from '../../r5/spatialEngine';
import { RealityWorkspaceAdapter } from '../../r6/realityWorkspaceAdapter';
import { RealityLiveBindingEngine } from '../liveBinding';
import { R7RealityViewport } from './R7RealityViewport';

interface R7ResearchStudioAppProps {
  onExit?: () => void;
}

export const R7ResearchStudioApp: React.FC<R7ResearchStudioAppProps> = ({ onExit }) => {
  const r2Engine = useMemo(() => new RealityStateEngine(), []);
  const [currentRealityState, setCurrentRealityState] = useState(() => r2Engine.getCurrentState());

  const moEngine = useMemo(
    () => new RealityMultiObjectEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  const spatialEngine = useMemo(
    () => new RealitySpatialEngine(currentRealityState.stateId, currentRealityState.checksum),
    [currentRealityState.stateId, currentRealityState.checksum]
  );

  // Initialize with canonical [5, 3, 6] object
  const initialObjects = useMemo(() => {
    const objA = moEngine.createObject(
      currentRealityState,
      'canonical_core',
      'Canonical Reality Object',
      'SOLID',
      [5, 3, 6],
      [2, 2, 2],
      'EXACT',
      'OBSERVED',
      'CANONICAL_CONTRACT'
    );
    const objB = moEngine.createObject(
      currentRealityState,
      'adjacent_node',
      'Spatial Adjacent Node',
      'SOLID',
      [10, 3, 6],
      [2, 2, 2],
      'EXACT',
      'OBSERVED',
      'RESEARCH_USER'
    );

    spatialEngine.registerObject(objA);
    spatialEngine.registerObject(objB);
    spatialEngine.evaluateRelation(objA, objB);

    return [objA, objB];
  }, []);

  const wsAdapter = useMemo(() => {
    const allObjs = moEngine.listObjects();
    const allRels = moEngine.getRelationshipEngine().listRelationships();
    const allSpatial = spatialEngine.listRelations();
    const topo = spatialEngine.getTopology();

    return new RealityWorkspaceAdapter(
      currentRealityState,
      allObjs,
      allRels,
      allSpatial,
      topo
    );
  }, []);

  const bindingEngine = useMemo(() => {
    return new RealityLiveBindingEngine(wsAdapter.getState());
  }, [wsAdapter]);

  const [, setTick] = useState(0);
  const triggerUpdate = useCallback(() => setTick((t) => t + 1), []);

  return (
    <R7RealityViewport
      bindingEngine={bindingEngine}
      onExit={onExit}
    />
  );
};
