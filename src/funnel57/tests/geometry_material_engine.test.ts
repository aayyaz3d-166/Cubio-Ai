/**
 * 3D Memory Studio — Funnel 57
 * Actual 3D Geometry & Material Engine Tests
 *
 * 22 Focused Research & Infrastructure Tests:
 * TC-F57-01  Geometry Engine Initializes
 * TC-F57-02  Material Engine Initializes
 * TC-F57-03  Geometry Registry Prevents Duplicate Resources
 * TC-F57-04  Material Registry Prevents Duplicate Resources
 * TC-F57-05  Memory Core Geometry Created
 * TC-F57-06  GREEN State Receives Geometry
 * TC-F57-07  RED State Receives No Geometry
 * TC-F57-08  Relationship Geometry Connects Endpoints
 * TC-F57-09  Cluster Geometry Created
 * TC-F57-10  Dimension Geometry Created
 * TC-F57-11  State Material Reuse Works
 * TC-F57-12  Material Reference Counting Works
 * TC-F57-13  Highlight Material State Works
 * TC-F57-14  SceneObject -> Mesh Synchronization
 * TC-F57-15  Transform Synchronization
 * TC-F57-16  Visibility Synchronization
 * TC-F57-17  Selection Highlight Synchronization
 * TC-F57-18  Geometry Disposal Works
 * TC-F57-19  Material Disposal Works
 * TC-F57-20  Shared Resource Disposal Works
 * TC-F57-21  Rendering Budget Remains Bounded
 * TC-F57-22  Large Dataset Does Not Create Unlimited Resources
 */

import * as THREE from 'three';
import { GeometryEngine } from '../geometry/geometryEngine';
import { MaterialEngine } from '../materials/materialEngine';
import { GeometryRegistry } from '../geometry/geometryRegistry';
import { MaterialRegistry } from '../materials/materialRegistry';
import { GeometrySceneAdapter } from '../adapters/geometrySceneAdapter';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { StateSceneObject } from '../../funnel56/objects/stateSceneObject';
import { createSecureStateMesh } from '../adapters/securityGeometryAdapter';
import { createInitialSimulationWorld, stepSimulationWorld } from '../../funnel52/simulation/simulationWorld';
import { getStandardInformationUniverseFixture, getScaleBenchmarkUniverseIndex } from '../../funnel49/model';
import { F57TestResult } from '../types';

// ─── TC-F57-01: Geometry Engine Initializes ───────────────────────────────

export function testGeometryEngineInitializes(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  geoEngine.initialize();

  const passed =
    geoEngine.registry !== undefined &&
    geoEngine.factory !== undefined &&
    geoEngine.getStats().totalGeometries === 0;

  geoEngine.dispose();

  return {
    testId: 'TC-F57-01',
    name: 'Geometry Engine Initializes',
    passed,
    details: passed
      ? 'GeometryEngine initialized cleanly with registered factory and empty registry cache.'
      : 'GeometryEngine initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-02: Material Engine Initializes ───────────────────────────────

export function testMaterialEngineInitializes(): F57TestResult {
  const t0 = performance.now();
  const matEngine = new MaterialEngine();
  matEngine.initialize();

  const passed =
    matEngine.registry !== undefined &&
    matEngine.factory !== undefined &&
    matEngine.getStats().totalMaterials === 0;

  matEngine.dispose();

  return {
    testId: 'TC-F57-02',
    name: 'Material Engine Initializes',
    passed,
    details: passed
      ? 'MaterialEngine initialized cleanly with vocabulary factory and registry cache.'
      : 'MaterialEngine initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-03: Geometry Registry Prevents Duplicate Resources ─────────────

export function testGeometryRegistryPreventsDuplicates(): F57TestResult {
  const t0 = performance.now();
  const registry = new GeometryRegistry();
  const geo1 = new THREE.BufferGeometry();
  const geo2 = new THREE.BufferGeometry();

  registry.register('GEO_TEST_01', 'CORE_SPHERE', geo1);
  let duplicateCaught = false;

  try {
    registry.register('GEO_TEST_01', 'CORE_SPHERE', geo2);
  } catch {
    duplicateCaught = true;
  }

  const passed = duplicateCaught && registry.count === 1;
  registry.disposeAll();

  return {
    testId: 'TC-F57-03',
    name: 'Geometry Registry Prevents Duplicate Resources',
    passed,
    details: passed
      ? 'Geometry registry strictly rejected duplicate resource ID registration.'
      : 'Duplicate geometry registration allowed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F57-04: Material Registry Prevents Duplicate Resources ─────────────

export function testMaterialRegistryPreventsDuplicates(): F57TestResult {
  const t0 = performance.now();
  const registry = new MaterialRegistry();
  const mat1 = new THREE.MeshBasicMaterial();
  const mat2 = new THREE.MeshBasicMaterial();

  registry.register('MAT_TEST_01', 'STATE_DEFAULT', mat1);
  let duplicateCaught = false;

  try {
    registry.register('MAT_TEST_01', 'STATE_DEFAULT', mat2);
  } catch {
    duplicateCaught = true;
  }

  const passed = duplicateCaught && registry.count === 1;
  registry.disposeAll();

  return {
    testId: 'TC-F57-04',
    name: 'Material Registry Prevents Duplicate Resources',
    passed,
    details: passed
      ? 'Material registry strictly rejected duplicate material ID registration.'
      : 'Duplicate material registration allowed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F57-05: Memory Core Geometry Created ──────────────────────────────

export function testMemoryCoreGeometryCreated(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const sphereGeo = geoEngine.factory.getOrCreateCoreSphere(16, 'MEDIUM');
  const innerTorusGeo = geoEngine.factory.getOrCreateCoreTorus(28, 1.2, 'INNER', 'MEDIUM');
  const outerTorusGeo = geoEngine.factory.getOrCreateCoreTorus(40, 0.8, 'OUTER', 'MEDIUM');

  const passed =
    sphereGeo.getAttribute('position') !== undefined &&
    innerTorusGeo.getAttribute('position') !== undefined &&
    outerTorusGeo.getAttribute('position') !== undefined &&
    geoEngine.registry.count === 3;

  geoEngine.dispose();

  return {
    testId: 'TC-F57-05',
    name: 'Memory Core Geometry Created',
    passed,
    details: passed
      ? `Memory Core created 3 concentric geometries with ${sphereGeo.getAttribute('position').count} sphere vertices.`
      : 'Memory Core geometry creation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F57-06: GREEN State Receives Geometry ─────────────────────────────

export function testGreenStateReceivesGeometry(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const fixture = getStandardInformationUniverseFixture();
  const greenState = fixture.states.find((s) => s.classification === 'GREEN')!;

  const stateObj = new StateSceneObject(greenState, [10, 20, 30]);
  const mesh = createSecureStateMesh(stateObj, geoEngine.factory, matEngine.factory);

  const passed = mesh !== null && mesh.threeObject instanceof THREE.Group;
  geoEngine.dispose();
  matEngine.dispose();

  return {
    testId: 'TC-F57-06',
    name: 'GREEN State Receives Geometry',
    passed,
    details: passed
      ? `Authorized GREEN state '${greenState.entityName}' received valid Three.js mesh geometry.`
      : 'GREEN state geometry creation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-07: RED State Receives No Geometry ────────────────────────────

export function testRedStateReceivesNoGeometry(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const fixture = getStandardInformationUniverseFixture();
  const redState = fixture.states.find((s) => s.classification === 'RED')!;

  const stateObj = new StateSceneObject(redState, [0, 0, 0]);
  const mesh = createSecureStateMesh(stateObj, geoEngine.factory, matEngine.factory);

  const passed = mesh === null && redState.classification === 'RED';
  geoEngine.dispose();
  matEngine.dispose();

  return {
    testId: 'TC-F57-07',
    name: 'RED State Receives No Geometry',
    passed,
    details: passed
      ? 'F47 security boundary enforced: RED state strictly rejected with 0 geometry generated.'
      : 'RED state received geometry',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-08: Relationship Geometry Connects Endpoints ──────────────────

export function testRelationshipGeometryConnects(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const lineGeo = geoEngine.factory.createRelationshipGeometry([0, 0, 0], [100, 50, 25]);
  const posAttr = lineGeo.getAttribute('position');

  const passed =
    posAttr !== undefined &&
    posAttr.count === 2 &&
    posAttr.getX(0) === 0 &&
    posAttr.getX(1) === 100;

  lineGeo.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-08',
    name: 'Relationship Geometry Connects Endpoints',
    passed,
    details: passed
      ? 'Relationship line geometry connected endpoints [0, 0, 0] to [100, 50, 25].'
      : 'Relationship geometry endpoints invalid',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-09: Cluster Geometry Created ──────────────────────────────────

export function testClusterGeometryCreated(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const ringGeo = geoEngine.factory.getOrCreateClusterRing(60, 48);

  const passed = ringGeo.getAttribute('position') !== undefined && ringGeo.getAttribute('position').count > 0;
  geoEngine.dispose();

  return {
    testId: 'TC-F57-09',
    name: 'Cluster Geometry Created',
    passed,
    details: passed
      ? `Cluster boundary geometry created with ${ringGeo.getAttribute('position').count} vertices.`
      : 'Cluster geometry creation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-10: Dimension Geometry Created ────────────────────────────────

export function testDimensionGeometryCreated(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const gridGeo = geoEngine.factory.getOrCreateDimensionGrid(400, 20);

  const passed = gridGeo.getAttribute('position') !== undefined && gridGeo.getAttribute('position').count > 0;
  geoEngine.dispose();

  return {
    testId: 'TC-F57-10',
    name: 'Dimension Geometry Created',
    passed,
    details: passed
      ? `Dimension spatial grid geometry created with ${gridGeo.getAttribute('position').count} vertices.`
      : 'Dimension geometry creation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-11: State Material Reuse Works ────────────────────────────────

export function testStateMaterialReuseWorks(): F57TestResult {
  const t0 = performance.now();
  const matEngine = new MaterialEngine();
  const mat1 = matEngine.factory.getOrCreateStateMaterial('#06b6d4');
  const mat2 = matEngine.factory.getOrCreateStateMaterial('#06b6d4');

  const passed = mat1 === mat2 && matEngine.registry.count === 1;
  matEngine.dispose();

  return {
    testId: 'TC-F57-11',
    name: 'State Material Reuse Works',
    passed,
    details: passed
      ? 'Repeated state material requests returned identical cached Three.js material instance.'
      : 'Material reuse failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F57-12: Material Reference Counting Works ─────────────────────────

export function testMaterialReferenceCountingWorks(): F57TestResult {
  const t0 = performance.now();
  const matEngine = new MaterialEngine();
  const id = 'MAT_STATE_06b6d4';
  matEngine.factory.getOrCreateStateMaterial('#06b6d4');

  const refAfterFirst = matEngine.registry.get(id)?.referenceCount;
  matEngine.factory.getOrCreateStateMaterial('#06b6d4'); // Retain
  const refAfterSecond = matEngine.registry.get(id)?.referenceCount;

  matEngine.registry.release(id);
  const refAfterRelease = matEngine.registry.get(id)?.referenceCount;

  matEngine.registry.release(id);
  const existsAfterFinalRelease = matEngine.registry.has(id);

  matEngine.dispose();

  const passed =
    refAfterFirst === 1 &&
    refAfterSecond === 2 &&
    refAfterRelease === 1 &&
    existsAfterFinalRelease === false;

  return {
    testId: 'TC-F57-12',
    name: 'Material Reference Counting Works',
    passed,
    details: passed
      ? 'Material reference counting (1 → 2 → 1 → 0 dispose) verified deterministically.'
      : 'Reference counting failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 4,
  };
}

// ─── TC-F57-13: Highlight Material State Works ────────────────────────────

export function testHighlightMaterialStateWorks(): F57TestResult {
  const t0 = performance.now();
  const matEngine = new MaterialEngine();
  const selectedMat = matEngine.factory.getOrCreateSelectedStateMaterial();
  const highlightMat = matEngine.factory.getOrCreateHighlightedStateMaterial();

  const passed =
    (selectedMat as THREE.MeshBasicMaterial).color.getHex() === 0xc084fc &&
    (highlightMat as THREE.MeshBasicMaterial).color.getHex() === 0xeab308;

  matEngine.dispose();

  return {
    testId: 'TC-F57-13',
    name: 'Highlight Material State Works',
    passed,
    details: passed
      ? 'Selection and search highlight materials verified with distinct emissive hex codes.'
      : 'Highlight material state failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F57-14: SceneObject -> Mesh Synchronization ───────────────────────

export function testSceneObjectMeshSync(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const sceneEngine = new SceneEngine();
  const adapter = new GeometrySceneAdapter(geoEngine.factory, matEngine.factory);

  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  sceneEngine.synchronizeWithSimulation(world);
  adapter.synchronizeScene(sceneEngine);

  const meshCount = adapter.meshCount;
  const passed =
    meshCount > 0 &&
    adapter.rootGroup.children.length === meshCount;

  adapter.dispose();
  sceneEngine.dispose();
  matEngine.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-14',
    name: 'SceneObject -> Mesh Synchronization',
    passed,
    details: passed
      ? `Synchronized ${meshCount} SceneObjects into root Three.js group.`
      : 'Mesh synchronization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-15: Transform Synchronization ─────────────────────────────────

export function testTransformSynchronization(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const sceneEngine = new SceneEngine();
  const adapter = new GeometrySceneAdapter(geoEngine.factory, matEngine.factory);

  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  sceneEngine.synchronizeWithSimulation(world);
  adapter.synchronizeScene(sceneEngine);

  // Update scene engine object position
  const coreObj = sceneEngine.graph.coreNode;
  coreObj.transform.position = [150, 200, -50];
  sceneEngine.update(16.6, 100);

  adapter.syncTransforms(sceneEngine);
  const coreMesh = adapter.getMesh(coreObj.id);

  const passed =
    coreMesh !== undefined &&
    coreMesh.threeObject.position.x === 150 &&
    coreMesh.threeObject.position.y === 200 &&
    coreMesh.threeObject.position.z === -50;

  adapter.dispose();
  sceneEngine.dispose();
  matEngine.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-15',
    name: 'Transform Synchronization',
    passed,
    details: passed
      ? 'F56 world transforms seamlessly propagated to Three.js position [150, 200, -50].'
      : 'Transform synchronization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-16: Visibility Synchronization ────────────────────────────────

export function testVisibilitySynchronization(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const sceneEngine = new SceneEngine();
  const adapter = new GeometrySceneAdapter(geoEngine.factory, matEngine.factory);

  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  sceneEngine.synchronizeWithSimulation(world);
  adapter.synchronizeScene(sceneEngine);

  const coreObj = sceneEngine.graph.coreNode;
  coreObj.visible = false;
  adapter.syncTransforms(sceneEngine);

  const coreMesh = adapter.getMesh(coreObj.id);
  const passed = coreMesh !== undefined && coreMesh.visible === false;

  adapter.dispose();
  sceneEngine.dispose();
  matEngine.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-16',
    name: 'Visibility Synchronization',
    passed,
    details: passed
      ? 'SceneObject visibility flag seamlessly synchronized to Three.js mesh.'
      : 'Visibility synchronization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-17: Selection Highlight Synchronization ───────────────────────

export function testSelectionHighlightSync(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const sceneEngine = new SceneEngine();
  const adapter = new GeometrySceneAdapter(geoEngine.factory, matEngine.factory);

  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  sceneEngine.synchronizeWithSimulation(world);
  adapter.synchronizeScene(sceneEngine);

  const targetState = sceneEngine.registry.getByType('STATE')[0] as StateSceneObject;
  sceneEngine.selectObject(targetState.id);
  adapter.syncTransforms(sceneEngine);

  const stateMesh = adapter.getMesh(targetState.id);
  const haloChild = stateMesh?.threeObject.children.find((c) => c instanceof THREE.Mesh && c.geometry.type === 'RingGeometry');

  const passed = stateMesh !== undefined && haloChild !== undefined && haloChild.visible === true;

  adapter.dispose();
  sceneEngine.dispose();
  matEngine.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-17',
    name: 'Selection Highlight Synchronization',
    passed,
    details: passed
      ? `State selection activated halo mesh on '${targetState.id}'.`
      : 'Selection highlight sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-18: Geometry Disposal Works ───────────────────────────────────

export function testGeometryDisposalWorks(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  geoEngine.factory.getOrCreateCoreSphere(16, 'MEDIUM');
  const countBefore = geoEngine.registry.count;

  geoEngine.registry.dispose('GEO_CORE_SPHERE_16_24');
  const countAfter = geoEngine.registry.count;

  const passed = countBefore === 1 && countAfter === 0;
  geoEngine.dispose();

  return {
    testId: 'TC-F57-18',
    name: 'Geometry Disposal Works',
    passed,
    details: passed
      ? 'Geometry buffer safely disposed and removed from registry.'
      : 'Geometry disposal failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-19: Material Disposal Works ───────────────────────────────────

export function testMaterialDisposalWorks(): F57TestResult {
  const t0 = performance.now();
  const matEngine = new MaterialEngine();
  matEngine.factory.getOrCreateStateMaterial('#06b6d4');
  const countBefore = matEngine.registry.count;

  matEngine.registry.dispose('MAT_STATE_06b6d4');
  const countAfter = matEngine.registry.count;

  const passed = countBefore === 1 && countAfter === 0;
  matEngine.dispose();

  return {
    testId: 'TC-F57-19',
    name: 'Material Disposal Works',
    passed,
    details: passed
      ? 'Material safely disposed and purged from registry.'
      : 'Material disposal failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-20: Shared Resource Disposal Works ────────────────────────────

export function testSharedResourceDisposalWorks(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();

  geoEngine.factory.getOrCreateCoreSphere();
  geoEngine.factory.getOrCreateCoreTorus();
  matEngine.factory.getOrCreateCoreMaterial();
  matEngine.factory.getOrCreateStateMaterial();

  geoEngine.dispose();
  matEngine.dispose();

  const passed = geoEngine.registry.count === 0 && matEngine.registry.count === 0;

  return {
    testId: 'TC-F57-20',
    name: 'Shared Resource Disposal Works',
    passed,
    details: passed
      ? 'Bulk resource disposal released all registered Three.js geometries and materials.'
      : 'Bulk disposal failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 4,
  };
}

// ─── TC-F57-21: Rendering Budget Remains Bounded ──────────────────────────

export function testRenderingBudgetBounded(): F57TestResult {
  const t0 = performance.now();
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const sceneEngine = new SceneEngine();
  const adapter = new GeometrySceneAdapter(geoEngine.factory, matEngine.factory);

  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  sceneEngine.synchronizeWithSimulation(world);
  adapter.synchronizeScene(sceneEngine);

  const meshCount = adapter.meshCount;
  const geoCount = geoEngine.registry.count;
  const matCount = matEngine.registry.count;

  const passed =
    meshCount <= 150 &&
    geoCount <= 25 &&
    matCount <= 20;

  adapter.dispose();
  sceneEngine.dispose();
  matEngine.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-21',
    name: 'Rendering Budget Remains Bounded',
    passed,
    details: passed
      ? `Rendering budget strictly respected: Meshes=${meshCount} (≤150), SharedGeos=${geoCount} (≤25).`
      : 'Rendering budget exceeded',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F57-22: Large Dataset Does Not Create Unlimited Resources ─────────

export function testLargeDatasetBoundedResources(): F57TestResult {
  const t0 = performance.now();
  const runs = 250;
  const geoEngine = new GeometryEngine();
  const matEngine = new MaterialEngine();
  const sceneEngine = new SceneEngine();
  const adapter = new GeometrySceneAdapter(geoEngine.factory, matEngine.factory);

  const benchmarkIndex = getScaleBenchmarkUniverseIndex(4096, 'BENCHMARK_SCALE_4096');
  let world = createInitialSimulationWorld(benchmarkIndex.states, 8);
  world = stepSimulationWorld(world, 2000);

  let baselineSignature = '';
  let finalMeshCount = 0;
  let finalGeoCount = 0;

  for (let i = 0; i < runs; i++) {
    sceneEngine.synchronizeWithSimulation(world);
    adapter.synchronizeScene(sceneEngine);

    finalMeshCount = adapter.meshCount;
    finalGeoCount = geoEngine.registry.count;
    const sig = `${finalMeshCount}:${finalGeoCount}:${matEngine.registry.count}`;

    if (i === 0) {
      baselineSignature = sig;
    } else if (sig !== baselineSignature) {
      adapter.dispose();
      sceneEngine.dispose();
      matEngine.dispose();
      geoEngine.dispose();
      return {
        testId: 'TC-F57-22',
        name: 'Large Dataset Does Not Create Unlimited Resources',
        passed: false,
        details: `Non-deterministic resource allocation drift at iteration ${i}`,
        durationMs: performance.now() - t0,
      };
    }
  }

  const passed =
    finalMeshCount <= 150 &&
    finalGeoCount <= 25 &&
    matEngine.registry.count <= 20;

  adapter.dispose();
  sceneEngine.dispose();
  matEngine.dispose();
  geoEngine.dispose();

  return {
    testId: 'TC-F57-22',
    name: 'Large Dataset Does Not Create Unlimited Resources',
    passed,
    details: `${runs} repeated scale derivations bounded to ${finalMeshCount} meshes and ${finalGeoCount} shared geometries (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}
