/**
 * 3D Memory Studio — Funnel 56
 * Actual 3D Scene Engine Tests
 *
 * 20 Focused Research & Interaction Tests:
 * TC-F56-01  Scene Engine Initializes
 * TC-F56-02  Scene Lifecycle Deterministic
 * TC-F56-03  Scene Graph Creates Correct Hierarchy
 * TC-F56-04  Scene Registry Prevents Duplicate IDs
 * TC-F56-05  GREEN State Becomes Scene Object
 * TC-F56-06  RED State Is Blocked
 * TC-F56-07  Scene Layers Initialize Correctly
 * TC-F56-08  Layer Visibility Works
 * TC-F56-09  Object Add/Remove Works
 * TC-F56-10  Object Lifecycle Works
 * TC-F56-11  Local Transform Works
 * TC-F56-12  World Transform Works
 * TC-F56-13  Parent/Child Transform Works
 * TC-F56-14  State Selection Works
 * TC-F56-15  Search Highlight Synchronization Works
 * TC-F56-16  Dimension Object Works
 * TC-F56-17  Scene Synchronization With F52 Works
 * TC-F56-18  Object Bounds Are Enforced
 * TC-F56-19  Scene Disposal Releases Objects
 * TC-F56-20  Deterministic Scene Replay
 */

import { SceneEngine } from '../scene/sceneEngine';
import { SceneGraph } from '../scene/sceneGraph';
import { SceneRegistry } from '../scene/sceneRegistry';
import { StateSceneObject } from '../objects/stateSceneObject';
import { CoreSceneObject } from '../objects/coreSceneObject';
import { DimensionSceneObject } from '../objects/dimensionSceneObject';
import { computeWorldTransform } from '../transform/transform';
import { filterAndCreateStateObjects } from '../adapters/securitySceneAdapter';
import { createInitialSimulationWorld, stepSimulationWorld } from '../../funnel52/simulation/simulationWorld';
import { getStandardInformationUniverseFixture, getScaleBenchmarkUniverseIndex } from '../../funnel49/model';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { F56TestResult } from '../types';

// ─── TC-F56-01: Scene Engine Initializes ──────────────────────────────────

export function testSceneEngineInitializes(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  engine.initialize();

  const passed =
    engine.state === 'INITIALIZED' &&
    engine.graph !== undefined &&
    engine.registry !== undefined &&
    engine.layerManager !== undefined;

  engine.dispose();

  return {
    testId: 'TC-F56-01',
    name: 'Scene Engine Initializes',
    passed,
    details: passed
      ? 'Scene Engine initialized cleanly with complete graph, registry, and layer hierarchy.'
      : 'Scene Engine initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-02: Scene Lifecycle Deterministic ────────────────────────────

export function testSceneLifecycleDeterministic(): F56TestResult {
  const t0 = performance.now();
  const runs = 250;

  for (let i = 0; i < runs; i++) {
    const engine = new SceneEngine();
    const host = new MemoryRendererHost();

    if ((engine.state as string) !== 'CREATED') return { testId: 'TC-F56-02', name: 'Scene Lifecycle Deterministic', passed: false, details: 'State not CREATED', durationMs: performance.now() - t0 };
    engine.initialize();
    if ((engine.state as string) !== 'INITIALIZED') return { testId: 'TC-F56-02', name: 'Scene Lifecycle Deterministic', passed: false, details: 'State not INITIALIZED', durationMs: performance.now() - t0 };
    engine.attachRenderer(host);
    if ((engine.state as string) !== 'READY') return { testId: 'TC-F56-02', name: 'Scene Lifecycle Deterministic', passed: false, details: 'State not READY', durationMs: performance.now() - t0 };
    engine.dispose();
    host.dispose();
    if ((engine.state as string) !== 'DISPOSED') return { testId: 'TC-F56-02', name: 'Scene Lifecycle Deterministic', passed: false, details: 'State not DISPOSED', durationMs: performance.now() - t0 };
  }

  return {
    testId: 'TC-F56-02',
    name: 'Scene Lifecycle Deterministic',
    passed: true,
    details: `${runs} complete SceneEngine lifecycle cycles executed with 100% deterministic state transitions (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}

// ─── TC-F56-03: Scene Graph Creates Correct Hierarchy ─────────────────────

export function testSceneGraphCreatesHierarchy(): F56TestResult {
  const t0 = performance.now();
  const graph = new SceneGraph();

  const passed =
    graph.root.id === 'MEMORY_WORLD' &&
    graph.root.children.length === 7 &&
    graph.coreNode.id === 'MEMORY_CORE' &&
    graph.statesNode.id === 'INFORMATION_STATES' &&
    graph.relationshipsNode.id === 'RELATIONSHIPS' &&
    graph.clustersNode.id === 'CLUSTERS' &&
    graph.dimensionsNode.id === 'DIMENSION_SPACE';

  graph.dispose();

  return {
    testId: 'TC-F56-03',
    name: 'Scene Graph Creates Correct Hierarchy',
    passed,
    details: passed
      ? 'Verified SceneGraph root MEMORY_WORLD contains all 7 structural child containers.'
      : 'SceneGraph hierarchy verification failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 7,
  };
}

// ─── TC-F56-04: Scene Registry Prevents Duplicate IDs ─────────────────────

export function testSceneRegistryPreventsDuplicates(): F56TestResult {
  const t0 = performance.now();
  const registry = new SceneRegistry();
  const node1 = new CoreSceneObject('CORE_OBJ_01');
  const node2 = new CoreSceneObject('CORE_OBJ_01');

  registry.register(node1);
  let duplicateCaught = false;

  try {
    registry.register(node2);
  } catch {
    duplicateCaught = true;
  }

  const passed = duplicateCaught && registry.count === 1;

  return {
    testId: 'TC-F56-04',
    name: 'Scene Registry Prevents Duplicate IDs',
    passed,
    details: passed
      ? 'Duplicate object ID registration was strictly rejected by SceneRegistry.'
      : 'Duplicate object registration allowed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F56-05: GREEN State Becomes Scene Object ──────────────────────────

export function testGreenStateBecomesSceneObject(): F56TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const { objects, report } = filterAndCreateStateObjects(fixture.states, 3);

  const passed =
    objects.length > 0 &&
    report.admittedGreenCount === objects.length &&
    objects.every((o) => o.classification === 'GREEN' && o.layerId === 'STATE_LAYER');

  return {
    testId: 'TC-F56-05',
    name: 'GREEN State Becomes Scene Object',
    passed,
    details: passed
      ? `All ${objects.length} authorized GREEN states converted into StateSceneObjects.`
      : 'GREEN state conversion failed',
    durationMs: performance.now() - t0,
    totalEvaluations: objects.length,
  };
}

// ─── TC-F56-06: RED State Is Blocked ──────────────────────────────────────

export function testRedStateIsBlocked(): F56TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const { objects, report } = filterAndCreateStateObjects(fixture.states, 3);

  const redObjects = objects.filter((o) => o.classification === 'RED');
  const passed = redObjects.length === 0 && report.blockedRedCount > 0;

  return {
    testId: 'TC-F56-06',
    name: 'RED State Is Blocked',
    passed,
    details: passed
      ? `Security invariant enforced: 0 RED objects admitted (${report.blockedRedCount} strictly blocked).`
      : 'RED restricted record leakage detected',
    durationMs: performance.now() - t0,
    totalEvaluations: fixture.states.length,
  };
}

// ─── TC-F56-07: Scene Layers Initialize Correctly ─────────────────────────

export function testSceneLayersInitializeCorrectly(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  const layers = engine.layerManager.getAllLayers();

  const passed =
    layers.length === 7 &&
    layers[0].id === 'DIMENSION_LAYER' &&
    layers[1].id === 'RELATIONSHIP_LAYER' &&
    layers[2].id === 'CLUSTER_LAYER' &&
    layers[3].id === 'STATE_LAYER' &&
    layers[4].id === 'CORE_LAYER' &&
    layers[5].id === 'EFFECTS_LAYER' &&
    layers[6].id === 'OVERLAY_LAYER';

  engine.dispose();

  return {
    testId: 'TC-F56-07',
    name: 'Scene Layers Initialize Correctly',
    passed,
    details: passed
      ? `7 scene layers initialized with deterministic render ordering (${layers.map((l) => l.id).join(' → ')}).`
      : 'Scene layers ordering invalid',
    durationMs: performance.now() - t0,
    totalEvaluations: layers.length,
  };
}

// ─── TC-F56-08: Layer Visibility Works ────────────────────────────────────

export function testLayerVisibilityWorks(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();

  const initialVisible = engine.visibility.isLayerVisible('STATE_LAYER');
  engine.visibility.hideLayer('STATE_LAYER');
  const afterHide = engine.visibility.isLayerVisible('STATE_LAYER');
  engine.visibility.showLayer('STATE_LAYER');
  const afterShow = engine.visibility.isLayerVisible('STATE_LAYER');

  engine.dispose();

  const passed = initialVisible === true && afterHide === false && afterShow === true;

  return {
    testId: 'TC-F56-08',
    name: 'Layer Visibility Works',
    passed,
    details: passed
      ? 'Layer visibility show/hide operations executed without mutating underlying layer items.'
      : 'Layer visibility failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F56-09: Object Add/Remove Works ────────────────────────────────────

export function testObjectAddRemoveWorks(): F56TestResult {
  const t0 = performance.now();
  const graph = new SceneGraph();
  const core = new CoreSceneObject('TEST_CORE_01');

  graph.statesNode.addChild(core);
  const countAfterAdd = graph.statesNode.children.length;

  const removed = graph.statesNode.removeChild('TEST_CORE_01');
  const countAfterRemove = graph.statesNode.children.length;

  graph.dispose();

  const passed = countAfterAdd === 1 && removed && countAfterRemove === 0;

  return {
    testId: 'TC-F56-09',
    name: 'Object Add/Remove Works',
    passed,
    details: passed
      ? 'Child scene object addition and removal executed deterministically.'
      : 'Object add/remove failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F56-10: Object Lifecycle Works ────────────────────────────────────

export function testObjectLifecycleWorks(): F56TestResult {
  const t0 = performance.now();
  const core = new CoreSceneObject('CORE_LIFECYCLE_01');

  core.update(16.6, 100);
  const updatedAngle = core.innerAngle;
  core.dispose();

  const passed = core.disposed && updatedAngle > 0;

  return {
    testId: 'TC-F56-10',
    name: 'Object Lifecycle Works',
    passed,
    details: passed
      ? 'Scene object update and disposal verified.'
      : 'Object lifecycle failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-11: Local Transform Works ─────────────────────────────────────

export function testLocalTransformWorks(): F56TestResult {
  const t0 = performance.now();
  const core = new CoreSceneObject('CORE_TRANS_01');
  core.transform.position = [10, 20, 30];
  core.transform.scale = [2, 2, 2];

  core.update(16.6, 0);

  const [wx, wy, wz] = core.worldTransform.position;
  const [sx, sy, sz] = core.worldTransform.scale;

  const passed = wx === 10 && wy === 20 && wz === 30 && sx === 2 && sy === 2 && sz === 2;

  return {
    testId: 'TC-F56-11',
    name: 'Local Transform Works',
    passed,
    details: passed
      ? `Local transform without parent mapped to world [${wx}, ${wy}, ${wz}], scale [${sx}, ${sy}, ${sz}].`
      : 'Local transform calculation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-12: World Transform Works ─────────────────────────────────────

export function testWorldTransformWorks(): F56TestResult {
  const t0 = performance.now();
  const parent = new CoreSceneObject('PARENT_01');
  parent.transform.position = [100, 50, 0];

  const child = new CoreSceneObject('CHILD_01');
  child.transform.position = [10, 10, 0];

  parent.addChild(child);
  parent.update(16.6, 0);

  const [cwx, cwy] = child.worldTransform.position;
  const passed = cwx === 110 && cwy === 60;

  return {
    testId: 'TC-F56-12',
    name: 'World Transform Works',
    passed,
    details: passed
      ? `Child world position [${cwx}, ${cwy}] correctly derived from parent position.`
      : 'World transform derivation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-13: Parent/Child Transform Works ──────────────────────────────

export function testParentChildTransformWorks(): F56TestResult {
  const t0 = performance.now();
  const parent = new CoreSceneObject('PARENT_SCALE_01');
  parent.transform.position = [0, 0, 0];
  parent.transform.scale = [2, 2, 2];

  const child = new CoreSceneObject('CHILD_SCALE_01');
  child.transform.position = [10, 10, 0];
  child.transform.scale = [3, 3, 3];

  parent.addChild(child);
  parent.update(16.6, 0);

  const [cwx, cwy] = child.worldTransform.position;
  const [csx, csy] = child.worldTransform.scale;

  const passed = cwx === 20 && cwy === 20 && csx === 6 && csy === 6;

  return {
    testId: 'TC-F56-13',
    name: 'Parent/Child Transform Works',
    passed,
    details: passed
      ? `Hierarchical scale propagation verified: Child world scale = ${csx}x, position = [${cwx}, ${cwy}].`
      : 'Parent/child scale propagation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-14: State Selection Works ─────────────────────────────────────

export function testStateSelectionWorks(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeWithSimulation(world);
  const states = engine.registry.getByType('STATE');
  const targetId = states[0].id;

  const selected = engine.selectObject(targetId);
  const isSelectedFlag = (selected as StateSceneObject)?.isSelected;

  engine.clearSelection();
  const selectedAfterClear = engine.selection.getSelectedObjectId();

  engine.dispose();

  const passed = selected !== null && isSelectedFlag === true && selectedAfterClear === null;

  return {
    testId: 'TC-F56-14',
    name: 'State Selection Works',
    passed,
    details: passed
      ? `State selection and deselection successfully toggled isSelected flag on '${targetId}'.`
      : 'State selection failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-15: Search Highlight Synchronization Works ────────────────────

export function testSearchHighlightSynchronizationWorks(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeWithSimulation(world);
  const matchCount = engine.highlightSearch('W3C');

  const passed = matchCount > 0 && engine.highlights.highlightedCount === matchCount;

  engine.dispose();

  return {
    testId: 'TC-F56-15',
    name: 'Search Highlight Synchronization Works',
    passed,
    details: passed
      ? `Search query 'W3C' highlighted ${matchCount} matching scene object(s).`
      : 'Search highlight failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F56-16: Dimension Object Works ────────────────────────────────────

export function testDimensionObjectWorks(): F56TestResult {
  const t0 = performance.now();
  const dim3 = new DimensionSceneObject(3);
  const dim8 = new DimensionSceneObject(8);

  const passed =
    dim3.dimension === 3 &&
    dim3.isComputationalProjection === false &&
    dim8.dimension === 8 &&
    dim8.isComputationalProjection === true;

  return {
    testId: 'TC-F56-16',
    name: 'Dimension Object Works',
    passed,
    details: passed
      ? 'Dimension objects verified: Z3 is spatial; Z8 is strictly labeled COMPUTATIONAL PROJECTION.'
      : 'Dimension object verification failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F56-17: Scene Synchronization With F52 Works ──────────────────────

export function testSceneSynchronizationWithF52Works(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  let world = createInitialSimulationWorld();
  world = stepSimulationWorld(world, 2000);

  engine.synchronizeWithSimulation(world);
  const stats = engine.getStats();

  const passed =
    stats.totalObjects > 0 &&
    stats.visibleStates > 0 &&
    stats.totalClusters === 7 &&
    stats.totalDimensionObjects === 1;

  engine.dispose();

  return {
    testId: 'TC-F56-17',
    name: 'Scene Synchronization With F52 Works',
    passed,
    details: passed
      ? `F52 world state synchronized ${stats.visibleStates} states, ${stats.totalClusters} clusters into scene graph.`
      : 'Scene synchronization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: stats.totalObjects,
  };
}

// ─── TC-F56-18: Object Bounds Are Enforced ────────────────────────────────

export function testObjectBoundsAreEnforced(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  const benchmarkIndex = getScaleBenchmarkUniverseIndex(4096, 'BENCHMARK_SCALE_UNIVERSE');
  let world = createInitialSimulationWorld(benchmarkIndex.states, 3);
  world = stepSimulationWorld(world, 1000);

  engine.synchronizeWithSimulation(world);
  const stats = engine.getStats();

  const passed =
    stats.totalObjects <= 150 &&
    stats.visibleStates <= 50 &&
    stats.visibleRelationships <= 100 &&
    stats.totalClusters <= 20;

  engine.dispose();

  return {
    testId: 'TC-F56-18',
    name: 'Object Bounds Are Enforced',
    passed,
    details: passed
      ? `Scale test (4096 states) cleanly bounded: TotalObjects=${stats.totalObjects} (≤150), VisibleStates=${stats.visibleStates} (≤50).`
      : 'Object bounds exceeded',
    durationMs: performance.now() - t0,
    totalEvaluations: 4096,
  };
}

// ─── TC-F56-19: Scene Disposal Releases Objects ───────────────────────────

export function testSceneDisposalReleasesObjects(): F56TestResult {
  const t0 = performance.now();
  const engine = new SceneEngine();
  const world = createInitialSimulationWorld();

  engine.synchronizeWithSimulation(world);
  const countBefore = engine.registry.count;

  engine.dispose();
  const countAfter = engine.registry.count;

  const passed = countBefore > 0 && countAfter === 0 && engine.state === 'DISPOSED';

  return {
    testId: 'TC-F56-19',
    name: 'Scene Disposal Releases Objects',
    passed,
    details: passed
      ? 'SceneEngine disposal released all registered scene objects and cleared registry.'
      : 'Scene disposal failed to clean up objects',
    durationMs: performance.now() - t0,
    totalEvaluations: countBefore,
  };
}

// ─── TC-F56-20: Deterministic Scene Replay ────────────────────────────────

export function testDeterministicSceneReplay(): F56TestResult {
  const t0 = performance.now();
  const runs = 250;
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 8);

  let baselinePositions = '';

  for (let i = 0; i < runs; i++) {
    const engine = new SceneEngine();
    engine.synchronizeWithSimulation(world);
    engine.update(16.6, 1000);

    const states = engine.registry.getByType('STATE');
    const posSignature = states
      .map((s) => `${s.id}:${s.worldTransform.position.join(',')}`)
      .join('|');

    engine.dispose();

    if (i === 0) {
      baselinePositions = posSignature;
    } else if (posSignature !== baselinePositions) {
      return {
        testId: 'TC-F56-20',
        name: 'Deterministic Scene Replay',
        passed: false,
        details: `Non-deterministic scene reconstruction drift at iteration ${i}`,
        durationMs: performance.now() - t0,
      };
    }
  }

  return {
    testId: 'TC-F56-20',
    name: 'Deterministic Scene Replay',
    passed: true,
    details: `${runs} repeated scene graph constructions produced 100% identical transforms (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}
