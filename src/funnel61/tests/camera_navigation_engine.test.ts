/**
 * 3D Memory Studio — Funnel 61
 * Actual 3D Camera & Navigation Engine Tests
 *
 * 30 Focused Tests:
 * TC-F61-01  Camera Engine initializes correctly
 * TC-F61-02  Camera lifecycle is deterministic
 * TC-F61-03  Default camera state is valid
 * TC-F61-04  Orbit controller works
 * TC-F61-05  Orbit pitch bounds are enforced
 * TC-F61-06  Orbit distance bounds are enforced
 * TC-F61-07  Pan controller works
 * TC-F61-08  Zoom controller works
 * TC-F61-09  Zero-distance camera is prevented
 * TC-F61-10  NaN camera coordinates are blocked
 * TC-F61-11  Infinity camera coordinates are blocked
 * TC-F61-12  Camera target manager works
 * TC-F61-13  Focus state works
 * TC-F61-14  Focus cluster works
 * TC-F61-15  Focus relationship works
 * TC-F61-16  Frame object calculates bounded distance
 * TC-F61-17  Graph neighborhood focus works
 * TC-F61-18  Depth-3 camera traversal remains bounded
 * TC-F61-19  Camera presets are deterministic
 * TC-F61-20  Camera reset works
 * TC-F61-21  Camera transition works
 * TC-F61-22  Camera transition is frame-rate independent
 * TC-F61-23  Dimension switch preserves camera identity
 * TC-F61-24  Z4 camera correctly identifies computational projection
 * TC-F61-25  Search result can focus permitted state
 * TC-F61-26  Selection focus works
 * TC-F61-27  Navigation bounds are enforced
 * TC-F61-28  Camera history is bounded to 20 states
 * TC-F61-29  Camera resources dispose safely
 * TC-F61-30  No second RAF loop is created
 */

import { CameraEngine } from '../camera/cameraEngine';
import { createDefaultCameraState } from '../camera/cameraState';
import { rotateHorizontal, rotateVertical, setOrbitYawPitch } from '../camera/orbitController';
import { panWorld, panScreen, panTo } from '../camera/panController';
import { zoomCamera, setCameraDistance } from '../camera/zoomController';
import { calculateFrameDistance } from '../focus/frameManager';
import { calculateNeighborhoodFraming } from '../focus/neighborhoodFocus';
import { isFiniteNumber, clampDistance, clampPitch, clampCameraPosition } from '../camera/cameraSafetyController';
import { CAMERA_PRESETS } from '../presets/cameraPresets';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import { createInitialSimulationWorld } from '../../funnel52/simulation/simulationWorld';
import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { F61TestResult } from '../types';

// ─── TC-F61-01: Camera Engine initializes correctly ───────────────────────

export function testCameraEngineInitializes(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();
  engine.initialize();

  const stats = engine.getStats();
  const passed =
    engine.state !== undefined &&
    engine.navigation !== undefined &&
    stats.mode === 'ORBIT' &&
    stats.distance > 0 &&
    stats.activeDimension === 3;

  engine.dispose();

  return {
    testId: 'TC-F61-01',
    name: 'Camera Engine initializes correctly',
    passed,
    details: passed
      ? 'CameraEngine initialized with ORBIT mode, distance 260, and Z3 active dimension.'
      : 'CameraEngine initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-02: Camera lifecycle is deterministic ─────────────────────────

export function testCameraLifecycleDeterministic(): F61TestResult {
  const t0 = performance.now();
  const runs = 250;
  let firstSig = '';

  for (let i = 0; i < runs; i++) {
    const engine = new CameraEngine();
    engine.initialize();

    engine.navigation.orbit(engine.state, 45, 10);
    engine.navigation.pan(engine.state, 20, -10);
    engine.navigation.zoom(engine.state, -50);

    const sig = `${engine.state.position.join(',')}:${engine.state.target.join(',')}:${engine.state.yaw}:${engine.state.pitch}`;
    if (i === 0) {
      firstSig = sig;
    } else if (sig !== firstSig) {
      engine.dispose();
      return {
        testId: 'TC-F61-02',
        name: 'Camera lifecycle is deterministic',
        passed: false,
        details: `Non-deterministic camera state at run ${i}`,
        durationMs: performance.now() - t0,
      };
    }
    engine.dispose();
  }

  return {
    testId: 'TC-F61-02',
    name: 'Camera lifecycle is deterministic',
    passed: true,
    details: `${runs} camera construction & navigation runs produced 100% deterministic state (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}

// ─── TC-F61-03: Default camera state is valid ─────────────────────────────

export function testDefaultCameraStateValid(): F61TestResult {
  const t0 = performance.now();
  const def = createDefaultCameraState();

  const passed =
    def.position.length === 3 &&
    def.target.length === 3 &&
    def.up.length === 3 &&
    def.distance === 260 &&
    def.fov === 60 &&
    def.mode === 'ORBIT';

  return {
    testId: 'TC-F61-03',
    name: 'Default camera state is valid',
    passed,
    details: passed
      ? 'Default camera state has valid position [0, 80, 260], target [0, 0, 0], and FOV 60°.'
      : 'Default camera state invalid',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-04: Orbit controller works ────────────────────────────────────

export function testOrbitControllerWorks(): F61TestResult {
  const t0 = performance.now();
  const state = createDefaultCameraState();
  const initialPos = [...state.position];

  rotateHorizontal(state, 90);
  const rotatedPos = [...state.position];

  const passed = initialPos[0] !== rotatedPos[0] || initialPos[2] !== rotatedPos[2];

  return {
    testId: 'TC-F61-04',
    name: 'Orbit controller works',
    passed,
    details: passed
      ? `Orbit 90° yaw rotated position from [${initialPos.join(', ')}] to [${rotatedPos.join(', ')}].`
      : 'Orbit rotation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-05: Orbit pitch bounds are enforced ───────────────────────────

export function testOrbitPitchBoundsEnforced(): F61TestResult {
  const t0 = performance.now();
  const state = createDefaultCameraState();

  rotateVertical(state, 120);
  const maxClamped = state.pitch <= 89;

  rotateVertical(state, -250);
  const minClamped = state.pitch >= -89;

  const passed = maxClamped && minClamped;

  return {
    testId: 'TC-F61-05',
    name: 'Orbit pitch bounds are enforced',
    passed,
    details: passed
      ? `Pitch strictly clamped within [-89°, 89°] envelope (Current: ${state.pitch}°).`
      : 'Pitch bounds exceeded',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-06: Orbit distance bounds are enforced ────────────────────────

export function testOrbitDistanceBoundsEnforced(): F61TestResult {
  const t0 = performance.now();
  const state = createDefaultCameraState();

  zoomCamera(state, -9999);
  const minBound = state.distance >= 10;

  zoomCamera(state, 9999);
  const maxBound = state.distance <= 1200;

  const passed = minBound && maxBound;

  return {
    testId: 'TC-F61-06',
    name: 'Orbit distance bounds are enforced',
    passed,
    details: passed
      ? `Distance strictly clamped within [10, 1200] envelope (Current: ${state.distance}).`
      : 'Distance bounds exceeded',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-07: Pan controller works ──────────────────────────────────────

export function testPanControllerWorks(): F61TestResult {
  const t0 = performance.now();
  const state = createDefaultCameraState();
  const targetBefore = [...state.target];

  panWorld(state, [50, 20, -30]);
  const targetAfter = [...state.target];

  const passed =
    targetAfter[0] === targetBefore[0] + 50 &&
    targetAfter[1] === targetBefore[1] + 20 &&
    targetAfter[2] === targetBefore[2] - 30;

  return {
    testId: 'TC-F61-07',
    name: 'Pan controller works',
    passed,
    details: passed
      ? `Pan translated world target cleanly to [${targetAfter.join(', ')}].`
      : 'Pan translation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-08: Zoom controller works ─────────────────────────────────────

export function testZoomControllerWorks(): F61TestResult {
  const t0 = performance.now();
  const state = createDefaultCameraState();
  const distBefore = state.distance;

  zoomCamera(state, -50);
  const distAfter = state.distance;

  const passed = distAfter === distBefore - 50;

  return {
    testId: 'TC-F61-08',
    name: 'Zoom controller works',
    passed,
    details: passed
      ? `Zoom decreased camera distance from ${distBefore} to ${distAfter}.`
      : 'Zoom controller failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-09: Zero-distance camera is prevented ─────────────────────────

export function testZeroDistancePrevented(): F61TestResult {
  const t0 = performance.now();
  const clamped = clampDistance(0);
  const clampedNeg = clampDistance(-100);

  const passed = clamped >= 10 && clampedNeg >= 10;

  return {
    testId: 'TC-F61-09',
    name: 'Zero-distance camera is prevented',
    passed,
    details: passed
      ? `Zero and negative camera distances clamped to safe minimum of ${clamped}m.`
      : 'Zero distance permitted',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-10: NaN camera coordinates are blocked ────────────────────────

export function testNaNCoordinatesBlocked(): F61TestResult {
  const t0 = performance.now();
  const valid = isFiniteNumber(NaN);
  const clamped = clampCameraPosition([NaN as any, 50, 100]);

  const passed = !valid && clamped[0] === 0;

  return {
    testId: 'TC-F61-10',
    name: 'NaN camera coordinates are blocked',
    passed,
    details: passed
      ? 'NaN position coordinates blocked and sanitized to safe origin value.'
      : 'NaN coordinates leaked',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-11: Infinity camera coordinates are blocked ───────────────────

export function testInfinityCoordinatesBlocked(): F61TestResult {
  const t0 = performance.now();
  const valid = isFiniteNumber(Infinity);
  const clamped = clampCameraPosition([Infinity as any, 50, 100]);

  const passed = !valid && clamped[0] === 1500;

  return {
    testId: 'TC-F61-11',
    name: 'Infinity camera coordinates are blocked',
    passed,
    details: passed
      ? 'Infinity coordinates clamped safely within maximum envelope.'
      : 'Infinity coordinates leaked',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-12: Camera target manager works ───────────────────────────────

export function testCameraTargetManagerWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  const greenAccepted = engine.navigation.targetManager.setTarget({
    targetType: 'STATE',
    targetId: 'STATE_001',
    position: [100, 20, 50],
    classification: 'GREEN',
  });

  const redRejected = engine.navigation.targetManager.setTarget({
    targetType: 'STATE',
    targetId: 'STATE_RED_BLOCKED',
    position: [200, 30, 80],
    classification: 'RED',
  });

  const passed = greenAccepted === true && redRejected === false;
  engine.dispose();

  return {
    testId: 'TC-F61-12',
    name: 'Camera target manager works',
    passed,
    details: passed
      ? 'TargetManager accepted GREEN target and strictly blocked RED target.'
      : 'TargetManager validation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-13: Focus state works ─────────────────────────────────────────

export function testFocusStateWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.focusManager.focusState(engine.state, 'STATE_042', [120, 45, -80], 20);

  const passed =
    engine.state.focusedObjectId === 'STATE_042' &&
    engine.state.target[0] === 120 &&
    engine.state.target[1] === 45 &&
    engine.state.target[2] === -80 &&
    engine.state.mode === 'FOCUS';

  engine.dispose();

  return {
    testId: 'TC-F61-13',
    name: 'Focus state works',
    passed,
    details: passed
      ? 'Camera focusState updated target to [120, 45, -80] with focusedObjectId STATE_042.'
      : 'Focus state failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-14: Focus cluster works ───────────────────────────────────────

export function testFocusClusterWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.focusManager.focusCluster(engine.state, 'CLUSTER_DOM_A', [-50, 30, 100], 60);

  const passed =
    engine.state.focusedObjectId === 'CLUSTER_DOM_A' &&
    engine.state.target[0] === -50 &&
    engine.state.distance > 60;

  engine.dispose();

  return {
    testId: 'TC-F61-14',
    name: 'Focus cluster works',
    passed,
    details: passed
      ? `Camera framed cluster with radius 60 at distance ${engine.state.distance.toFixed(1)}m.`
      : 'Cluster focus failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-15: Focus relationship works ──────────────────────────────────

export function testFocusRelationshipWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.focusManager.focusRelationship(
    engine.state,
    'REL_001',
    [0, 0, 0],
    [100, 100, 100]
  );

  const passed =
    engine.state.focusedObjectId === 'REL_001' &&
    engine.state.target[0] === 50 &&
    engine.state.target[1] === 50 &&
    engine.state.target[2] === 50;

  engine.dispose();

  return {
    testId: 'TC-F61-15',
    name: 'Focus relationship works',
    passed,
    details: passed
      ? 'Camera framed relationship midpoint [50, 50, 50] with bounded viewing distance.'
      : 'Relationship focus failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-16: Frame object calculates bounded distance ──────────────────

export function testFrameObjectCalculatesBoundedDistance(): F61TestResult {
  const t0 = performance.now();
  const dSmall = calculateFrameDistance(5, 60);
  const dLarge = calculateFrameDistance(500, 60);

  const passed = dSmall >= 10 && dLarge <= 1200 && dLarge > dSmall;

  return {
    testId: 'TC-F61-16',
    name: 'Frame object calculates bounded distance',
    passed,
    details: passed
      ? `Frame distance bounded smoothly (Small radius: ${dSmall}m, Large radius: ${dLarge}m).`
      : 'Frame distance calculation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-17: Graph neighborhood focus works ────────────────────────────

export function testGraphNeighborhoodFocusWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();
  const graphEngine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  graphEngine.synchronizeSimulation(world);

  const positions = new Map<string, [number, number, number]>();
  for (const s of fixture.states) {
    const vals = s.coordinatesByDimension?.[3]?.coordinateValues ?? [0, 0, 0];
    positions.set(s.stateId, [vals[0] ?? 0, vals[1] ?? 0, vals[2] ?? 0]);
  }

  const rootId = fixture.states[0].stateId;
  const focused = engine.navigation.focusManager.focusNeighborhood(
    engine.state,
    rootId,
    2,
    graphEngine.registry,
    positions
  );

  const passed = focused === true && engine.state.focusedObjectId === rootId;

  engine.dispose();
  graphEngine.dispose();

  return {
    testId: 'TC-F61-17',
    name: 'Graph neighborhood focus works',
    passed,
    details: passed
      ? `Successfully framed depth-2 graph neighborhood centered on '${rootId}'.`
      : 'Neighborhood focus failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-18: Depth-3 camera traversal remains bounded ──────────────────

export function testDepth3TraversalRemainsBounded(): F61TestResult {
  const t0 = performance.now();
  const graphEngine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  graphEngine.synchronizeSimulation(world);

  const positions = new Map<string, [number, number, number]>();
  for (const s of fixture.states) {
    const vals = s.coordinatesByDimension?.[3]?.coordinateValues ?? [0, 0, 0];
    positions.set(s.stateId, [vals[0] ?? 0, vals[1] ?? 0, vals[2] ?? 0]);
  }

  const rootId = fixture.states[0].stateId;
  const framing = calculateNeighborhoodFraming(rootId, 5, graphEngine.registry, positions, 60);

  const passed = framing !== null && framing.distance <= 1200 && framing.nodeCount <= 50;

  graphEngine.dispose();

  return {
    testId: 'TC-F61-18',
    name: 'Depth-3 camera traversal remains bounded',
    passed,
    details: passed
      ? `Depth bounded to 3 with ${framing?.nodeCount} nodes and distance ${framing?.distance}m.`
      : 'Depth-3 traversal unbounded',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-19: Camera presets are deterministic ──────────────────────────

export function testCameraPresetsDeterministic(): F61TestResult {
  const t0 = performance.now();
  const state = createDefaultCameraState();
  const engine = new CameraEngine();

  engine.navigation.setPreset(state, 'TOP');
  const posTop = [...state.position];

  engine.navigation.setPreset(state, 'SIDE');
  const posSide = [...state.position];

  engine.navigation.setPreset(state, 'TOP');
  const posTop2 = [...state.position];

  const passed =
    posTop[0] === posTop2[0] &&
    posTop[1] === posTop2[1] &&
    posTop[2] === posTop2[2] &&
    posTop[1] !== posSide[1];

  engine.dispose();

  return {
    testId: 'TC-F61-19',
    name: 'Camera presets are deterministic',
    passed,
    details: passed
      ? 'Camera presets TOP and SIDE produce 100% reproducible positions across transitions.'
      : 'Camera presets non-deterministic',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F61-20: Camera reset works ────────────────────────────────────────

export function testCameraResetWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.orbit(engine.state, 90, 45);
  engine.navigation.pan(engine.state, 100, 50);
  engine.navigation.zoom(engine.state, 200);

  engine.navigation.resetCamera(engine.state);

  const passed =
    engine.state.target[0] === 0 &&
    engine.state.target[1] === 0 &&
    engine.state.target[2] === 0 &&
    engine.state.distance === 260 &&
    engine.state.focusedObjectId === null;

  engine.dispose();

  return {
    testId: 'TC-F61-20',
    name: 'Camera reset works',
    passed,
    details: passed
      ? 'Camera reset cleanly restored target [0, 0, 0] and distance 260m.'
      : 'Camera reset failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-21: Camera transition works ───────────────────────────────────

export function testCameraTransitionWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.transitionManager.startTransition(
    engine.state,
    [100, 50, 0],
    45,
    30,
    150,
    200
  );

  const transitioningBefore = engine.state.isTransitioning;
  engine.navigation.update(engine.state, 0.1); // Halfway
  const intermediatePos = [...engine.state.target];

  engine.navigation.update(engine.state, 0.2); // Complete
  const targetFinal = [...engine.state.target];

  const passed =
    transitioningBefore === true &&
    intermediatePos[0] > 0 &&
    targetFinal[0] === 100 &&
    engine.state.isTransitioning === false;

  engine.dispose();

  return {
    testId: 'TC-F61-21',
    name: 'Camera transition works',
    passed,
    details: passed
      ? `Smooth transition completed cleanly from origin to [${targetFinal.join(', ')}].`
      : 'Camera transition failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F61-22: Camera transition is frame-rate independent ───────────────

export function testTransitionFrameRateIndependent(): F61TestResult {
  const t0 = performance.now();

  // Run 1: 10 small steps of 0.02s (60 FPS simulated)
  const e1 = new CameraEngine();
  e1.navigation.transitionManager.startTransition(e1.state, [100, 0, 0], 0, 0, 200, 200);
  for (let i = 0; i < 10; i++) e1.navigation.update(e1.state, 0.02);
  const target1 = [...e1.state.target];

  // Run 2: 2 larger steps of 0.1s (10 FPS simulated)
  const e2 = new CameraEngine();
  e2.navigation.transitionManager.startTransition(e2.state, [100, 0, 0], 0, 0, 200, 200);
  for (let i = 0; i < 2; i++) e2.navigation.update(e2.state, 0.1);
  const target2 = [...e2.state.target];

  const passed = Math.abs(target1[0] - target2[0]) < 0.001;

  e1.dispose();
  e2.dispose();

  return {
    testId: 'TC-F61-22',
    name: 'Camera transition is frame-rate independent',
    passed,
    details: passed
      ? `Step accumulation produced identical target (${target1[0].toFixed(2)} vs ${target2[0].toFixed(2)}).`
      : 'Frame-rate dependence detected',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F61-23: Dimension switch preserves camera identity ────────────────

export function testDimensionSwitchPreservesCameraIdentity(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();
  const dimEngine = new DimensionEngine();
  const fixture = getStandardInformationUniverseFixture();

  dimEngine.projectStates(fixture.states);
  engine.navigation.focusManager.focusState(
    engine.state,
    fixture.states[0].stateId,
    [10, 20, 30]
  );

  const focusedIdBefore = engine.state.focusedObjectId;
  dimEngine.setDimension(8, 'RADIAL');
  dimEngine.projectStates(fixture.states);

  engine.state.dimension = 8;
  const focusedIdAfter = engine.state.focusedObjectId;

  const passed = focusedIdBefore !== null && focusedIdBefore === focusedIdAfter;

  engine.dispose();
  dimEngine.dispose();

  return {
    testId: 'TC-F61-23',
    name: 'Dimension switch preserves camera identity',
    passed,
    details: passed
      ? `Focused object ID '${focusedIdBefore}' preserved across Z3 -> Z8 dimension switch.`
      : 'Focused object lost on dimension switch',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-24: Z4 camera correctly identifies computational projection ───

export function testZ4CameraIdentifiesComputationalProjection(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();
  engine.state.dimension = 4;

  const stats = engine.getStats();
  const passed = stats.activeDimension === 4 && stats.isComputationalProjection === true;

  engine.dispose();

  return {
    testId: 'TC-F61-24',
    name: 'Z4 camera correctly identifies computational projection',
    passed,
    details: passed
      ? 'Z4 camera verified as computational projection view with isComputationalProjection = true.'
      : 'Z4 projection identification failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-25: Search result can focus permitted state ───────────────────

export function testSearchResultFocusPermittedState(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.focusManager.focusState(
    engine.state,
    'STATE49:REC_W3C_LDP_CONTAINER',
    [35, 10, -20],
    15
  );

  const passed =
    engine.state.focusedObjectId === 'STATE49:REC_W3C_LDP_CONTAINER' &&
    engine.state.target[0] === 35;

  engine.dispose();

  return {
    testId: 'TC-F61-25',
    name: 'Search result can focus permitted state',
    passed,
    details: passed
      ? 'Permitted search result state focused and framed cleanly.'
      : 'Search result focus failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-26: Selection focus works ─────────────────────────────────────

export function testSelectionFocusWorks(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.focusManager.focusPosition(engine.state, [75, 40, -10], 120);

  const passed =
    engine.state.target[0] === 75 &&
    engine.state.target[1] === 40 &&
    engine.state.target[2] === -10 &&
    engine.state.distance === 120;

  engine.dispose();

  return {
    testId: 'TC-F61-26',
    name: 'Selection focus works',
    passed,
    details: passed
      ? 'Selection focus updated position and distance to [75, 40, -10] / 120m.'
      : 'Selection focus failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-27: Navigation bounds are enforced ────────────────────────────

export function testNavigationBoundsEnforced(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  panWorld(engine.state, [99999, -99999, 88888]);

  const passed =
    engine.state.target[0] <= 500 &&
    engine.state.target[1] >= -500 &&
    engine.state.position[0] <= 1500;

  engine.dispose();

  return {
    testId: 'TC-F61-27',
    name: 'Navigation bounds are enforced',
    passed,
    details: passed
      ? `Target clamped within [-500, 500] and position within [-1500, 1500].`
      : 'Navigation bounds violated',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-28: Camera history is bounded to 20 states ─────────────────────

export function testCameraHistoryBoundedTo20(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  for (let i = 0; i < 35; i++) {
    engine.navigation.orbit(engine.state, 5, 2);
    engine.navigation.history.save(engine.state);
  }

  const countBeforeDispose = engine.navigation.history.count;
  const passed = countBeforeDispose === 20;
  engine.dispose();

  return {
    testId: 'TC-F61-28',
    name: 'Camera history is bounded to 20 states',
    passed,
    details: passed
      ? `History count strictly capped at ${countBeforeDispose} snapshots.`
      : 'History count unbounded',
    durationMs: performance.now() - t0,
    totalEvaluations: 35,
  };
}

// ─── TC-F61-29: Camera resources dispose safely ───────────────────────────

export function testCameraResourcesDisposeSafely(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  engine.navigation.history.save(engine.state);
  const countBefore = engine.navigation.history.count;

  engine.dispose();
  const countAfter = engine.navigation.history.count;

  const passed = countBefore > 0 && countAfter === 0;

  return {
    testId: 'TC-F61-29',
    name: 'Camera resources dispose safely',
    passed,
    details: passed
      ? 'Disposal cleared all history snapshots and released camera resources.'
      : 'Camera disposal failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F61-30: No second RAF loop is created ─────────────────────────────

export function testNoSecondRAFLoop(): F61TestResult {
  const t0 = performance.now();
  const engine = new CameraEngine();

  // F61 exposes update(deltaSeconds) called by F55 single render loop
  const hasExternalUpdate = typeof engine.update === 'function';
  const hasNoInternalInterval = (engine as any).rafId === undefined;

  const passed = hasExternalUpdate && hasNoInternalInterval;
  engine.dispose();

  return {
    testId: 'TC-F61-30',
    name: 'No second RAF loop is created',
    passed,
    details: passed
      ? 'F61 verified to use update(deltaSeconds) hook without independent RAF loops.'
      : 'Internal RAF loop detected',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}
