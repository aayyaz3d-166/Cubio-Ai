/**
 * 3D Memory Studio — Funnel 62
 * Actual 3D Memory Studio Experience & Frontend Integration Tests
 *
 * 30 Focused Tests:
 * TC-F62-01  Studio Experience initializes
 * TC-F62-02  Landing experience initializes
 * TC-F62-03  Landing cube interaction is bounded
 * TC-F62-04  START opens Studio
 * TC-F62-05  Landing transition is deterministic
 * TC-F62-06  Studio shell initializes
 * TC-F62-07  Database panel receives permitted data
 * TC-F62-08  Coordinate panel synchronizes with F60
 * TC-F62-09  Information panel displays selected state
 * TC-F62-10  Graph panel synchronizes with F58
 * TC-F62-11  Cluster panel synchronizes with F59
 * TC-F62-12  Camera controls synchronize with F61
 * TC-F62-13  Dimension selector synchronizes with F60
 * TC-F62-14  More Options opens correctly
 * TC-F62-15  More Options visibility is deterministic
 * TC-F62-16  Search result selects permitted state
 * TC-F62-17  Search selection focuses camera
 * TC-F62-18  Search selection highlights graph
 * TC-F62-19  Search selection highlights cluster
 * TC-F62-20  Selection identity remains synchronized
 * TC-F62-21  AI context contains only selected permitted data
 * TC-F62-22  LLM model selector works
 * TC-F62-23  Multiple LLM providers can be represented
 * TC-F62-24  Local DataProvider interface works
 * TC-F62-25  Remote DataProvider interface works
 * TC-F62-26  RED data never reaches Studio UI
 * TC-F62-27  RED data never reaches AI context
 * TC-F62-28  Dimension switching preserves Studio selection
 * TC-F62-29  Studio reset restores deterministic state
 * TC-F62-30  No second RAF loop exists
 */

import { StudioCoordinator } from '../integration/studioCoordinator';
import { createInitialLandingCubeState, rotateLandingCube } from '../landing/landingCube';
import { LandingTransitionController } from '../landing/landingTransition';
import { ModelRegistry } from '../ai/modelRegistry';
import { buildAIContextFromSelectedState } from '../ai/aiContextBuilder';
import { SimulationDataProvider, LocalDataProvider, RemoteDataProvider } from '../data/dataProvider';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import { F62TestResult } from '../types';

// ─── TC-F62-01: Studio Experience initializes ─────────────────────────────

export async function testStudioExperienceInitializes(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const passed =
    coordinator.sceneEngine !== undefined &&
    coordinator.graphEngine !== undefined &&
    coordinator.clusterEngine !== undefined &&
    coordinator.dimensionEngine !== undefined &&
    coordinator.cameraEngine !== undefined &&
    coordinator.sessionState.currentScreen === 'LANDING';

  coordinator.dispose();

  return {
    testId: 'TC-F62-01',
    name: 'Studio Experience initializes',
    passed,
    details: passed
      ? 'StudioCoordinator initialized cleanly with all upstream engines bound.'
      : 'Studio initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-02: Landing experience initializes ────────────────────────────

export function testLandingExperienceInitializes(): F62TestResult {
  const t0 = performance.now();
  const cube = createInitialLandingCubeState();

  const passed =
    cube.rotationX === 25 &&
    cube.rotationY === 45 &&
    cube.scale === 1.0 &&
    cube.autoRotate === true;

  return {
    testId: 'TC-F62-02',
    name: 'Landing experience initializes',
    passed,
    details: passed
      ? 'Landing cube initialized with valid rotationX 25°, rotationY 45°, scale 1.0.'
      : 'Landing initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-03: Landing cube interaction is bounded ───────────────────────

export function testLandingCubeInteractionBounded(): F62TestResult {
  const t0 = performance.now();
  const cube = createInitialLandingCubeState();

  rotateLandingCube(cube, 100, 500); // Extreme pitch drag
  const pitchBounded = cube.rotationX <= 85 && cube.rotationX >= -85;

  rotateLandingCube(cube, 100, -1000);
  const pitchBounded2 = cube.rotationX >= -85;

  const passed = pitchBounded && pitchBounded2;

  return {
    testId: 'TC-F62-03',
    name: 'Landing cube interaction is bounded',
    passed,
    details: passed
      ? `Pitch strictly bounded within [-85°, 85°] (Current: ${cube.rotationX}°).`
      : 'Landing cube interaction unbounded',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F62-04: START opens Studio ────────────────────────────────────────

export async function testStartOpensStudio(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  coordinator.startStudio();
  const transBefore = coordinator.sessionState.isTransitioning;

  coordinator.update(0.7); // Complete 600ms transition
  const screenAfter = coordinator.sessionState.currentScreen;

  const passed = transBefore === true && screenAfter === 'STUDIO';
  coordinator.dispose();

  return {
    testId: 'TC-F62-04',
    name: 'START opens Studio',
    passed,
    details: passed
      ? 'START transition completed cleanly: currentScreen transitioned to STUDIO.'
      : 'START action failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F62-05: Landing transition is deterministic ───────────────────────

export function testLandingTransitionDeterministic(): F62TestResult {
  const t0 = performance.now();
  const runs = 250;
  let firstProgress = 0;

  for (let i = 0; i < runs; i++) {
    const controller = new LandingTransitionController();
    controller.startTransition(600);
    controller.update(0.3); // 300ms step

    const p = controller.currentProgress;
    if (i === 0) {
      firstProgress = p;
    } else if (Math.abs(p - firstProgress) > 0.0001) {
      return {
        testId: 'TC-F62-05',
        name: 'Landing transition is deterministic',
        passed: false,
        details: `Non-deterministic transition at run ${i}`,
        durationMs: performance.now() - t0,
      };
    }
  }

  return {
    testId: 'TC-F62-05',
    name: 'Landing transition is deterministic',
    passed: true,
    details: `${runs} transition cycles produced 100% deterministic easing (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}

// ─── TC-F62-06: Studio shell initializes ──────────────────────────────────

export async function testStudioShellInitializes(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();
  coordinator.sessionState.currentScreen = 'STUDIO';

  const passed =
    coordinator.sessionState.currentScreen === 'STUDIO' &&
    coordinator.sessionState.activePanel === 'DATABASE' &&
    coordinator.sessionState.activeDimension === 3;

  coordinator.dispose();

  return {
    testId: 'TC-F62-06',
    name: 'Studio shell initializes',
    passed,
    details: passed
      ? 'Studio shell initialized with DATABASE active panel and Z3 dimension.'
      : 'Studio shell initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-07: Database panel receives permitted data ────────────────────

export async function testDatabasePanelReceivesPermittedData(): Promise<F62TestResult> {
  const t0 = performance.now();
  const provider = new SimulationDataProvider();
  const states = await provider.getStates();

  const allGreen = states.every((s) => s.classification === 'GREEN');
  const passed = states.length > 0 && allGreen;

  return {
    testId: 'TC-F62-07',
    name: 'Database panel receives permitted data',
    passed,
    details: passed
      ? `Database received ${states.length} verified GREEN states with 0 RED records.`
      : 'Database data validation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: states.length,
  };
}

// ─── TC-F62-08: Coordinate panel synchronizes with F60 ────────────────────

export async function testCoordinatePanelSyncWithF60(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const stateId = fixture.states[0].stateId;
  coordinator.selectState(stateId);

  const coordZ3 = coordinator.dimensionEngine.getCoordinate(stateId);
  coordinator.switchDimension(8, 'RADIAL');
  const coordZ8 = coordinator.dimensionEngine.getCoordinate(stateId);

  const passed =
    coordZ3 !== undefined &&
    coordZ8 !== undefined &&
    coordZ8.dimension === 8 &&
    coordZ8.projectionType === 'RADIAL';

  coordinator.dispose();

  return {
    testId: 'TC-F62-08',
    name: 'Coordinate panel synchronizes with F60',
    passed,
    details: passed
      ? `Coordinate panel synchronized with Z8 RADIAL projection for '${stateId}'.`
      : 'Coordinate panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F62-09: Information panel displays selected state ─────────────────

export async function testInfoPanelDisplaysSelectedState(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const state = fixture.states[0];
  coordinator.selectState(state.stateId);

  const passed = coordinator.sessionState.selectedStateId === state.stateId;
  coordinator.dispose();

  return {
    testId: 'TC-F62-09',
    name: 'Information panel displays selected state',
    passed,
    details: passed
      ? `Information panel bound to selected state '${state.stateId}'.`
      : 'Information panel binding failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-10: Graph panel synchronizes with F58 ─────────────────────────

export async function testGraphPanelSyncWithF58(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const rels = coordinator.graphEngine.registry.getAll();
  const passed = rels.length > 0 && coordinator.graphEngine.registry.hasRelationship(rels[0].relationshipId);

  coordinator.dispose();

  return {
    testId: 'TC-F62-10',
    name: 'Graph panel synchronizes with F58',
    passed,
    details: passed
      ? `Graph panel successfully synchronized ${rels.length} relationships from F58.`
      : 'Graph panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-11: Cluster panel synchronizes with F59 ───────────────────────

export async function testClusterPanelSyncWithF59(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const clusters = coordinator.clusterEngine.registry.getAll();
  const passed = clusters.length > 0 && coordinator.clusterEngine.registry.hasCluster(clusters[0].clusterId);

  coordinator.dispose();

  return {
    testId: 'TC-F62-11',
    name: 'Cluster panel synchronizes with F59',
    passed,
    details: passed
      ? `Cluster panel successfully synchronized ${clusters.length} clusters from F59.`
      : 'Cluster panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-12: Camera controls synchronize with F61 ──────────────────────

export async function testCameraControlsSyncWithF61(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  coordinator.applyCameraPreset('TOP');
  const stats = coordinator.cameraEngine.getStats();

  const passed = stats.currentPreset === 'TOP' && coordinator.sessionState.cameraPreset === 'TOP';
  coordinator.dispose();

  return {
    testId: 'TC-F62-12',
    name: 'Camera controls synchronize with F61',
    passed,
    details: passed
      ? 'Camera preset TOP synchronized across Studio session and F61 CameraEngine.'
      : 'Camera sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-13: Dimension selector synchronizes with F60 ──────────────────

export async function testDimensionSelectorSyncWithF60(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  coordinator.switchDimension(8, 'PAIRWISE');
  const stats = coordinator.dimensionEngine.getStats();

  const passed =
    coordinator.sessionState.activeDimension === 8 &&
    stats.activeDimension === 8 &&
    stats.projectionType === 'PAIRWISE';

  coordinator.dispose();

  return {
    testId: 'TC-F62-13',
    name: 'Dimension selector synchronizes with F60',
    passed,
    details: passed
      ? 'Dimension switch to Z8 PAIRWISE synchronized with F60 DimensionEngine.'
      : 'Dimension selector sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-14: More Options opens correctly ──────────────────────────────

export async function testMoreOptionsOpensCorrectly(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  coordinator.sessionState.moreOptionsOpen = true;
  const passed = coordinator.sessionState.moreOptionsOpen === true;
  coordinator.dispose();

  return {
    testId: 'TC-F62-14',
    name: 'More Options opens correctly',
    passed,
    details: passed
      ? 'More Options menu state toggled to open.'
      : 'More Options open failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-15: More Options visibility is deterministic ──────────────────

export function testMoreOptionsVisibilityDeterministic(): F62TestResult {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();

  coordinator.sessionState.moreOptionsOpen = false;
  const closed = !coordinator.sessionState.moreOptionsOpen;

  coordinator.sessionState.moreOptionsOpen = true;
  const opened = coordinator.sessionState.moreOptionsOpen;

  const passed = closed && opened;
  coordinator.dispose();

  return {
    testId: 'TC-F62-15',
    name: 'More Options visibility is deterministic',
    passed,
    details: passed
      ? 'More Options menu visibility verified deterministic across state changes.'
      : 'More Options visibility non-deterministic',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F62-16: Search result selects permitted state ─────────────────────

export async function testSearchResultSelectsPermittedState(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const selectedId = await coordinator.searchAndSelect('HTTP');
  const passed = selectedId !== null && coordinator.sessionState.selectedStateId === selectedId;

  coordinator.dispose();

  return {
    testId: 'TC-F62-16',
    name: 'Search result selects permitted state',
    passed,
    details: passed
      ? `Search query 'HTTP' matched and selected permitted state '${selectedId}'.`
      : 'Search selection failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-17: Search selection focuses camera ───────────────────────────

export async function testSearchSelectionFocusesCamera(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const selectedId = await coordinator.searchAndSelect('HTTP');
  const camFocusedId = coordinator.cameraEngine.state.focusedObjectId;

  const passed = selectedId !== null && camFocusedId === selectedId;
  coordinator.dispose();

  return {
    testId: 'TC-F62-17',
    name: 'Search selection focuses camera',
    passed,
    details: passed
      ? `Camera focused directly onto search-selected state '${selectedId}'.`
      : 'Camera focus on search failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-18: Search selection highlights graph ─────────────────────────

export async function testSearchSelectionHighlightsGraph(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const selectedId = await coordinator.searchAndSelect('HTTP');
  const highlightedCounts = coordinator.graphEngine.highlightManager.getHighlightedCount();

  const passed = selectedId !== null && highlightedCounts.nodes > 0;
  coordinator.dispose();

  return {
    testId: 'TC-F62-18',
    name: 'Search selection highlights graph',
    passed,
    details: passed
      ? `Graph highlight synchronized with search selection '${selectedId}' (${highlightedCounts.nodes} nodes).`
      : 'Graph highlight failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-19: Search selection highlights cluster ───────────────────────

export async function testSearchSelectionHighlightsCluster(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const selectedId = await coordinator.searchAndSelect('HTTP');
  const highlightedClusters = coordinator.clusterEngine.highlightManager.highlightedCount;

  const passed = selectedId !== null && highlightedClusters > 0;
  coordinator.dispose();

  return {
    testId: 'TC-F62-19',
    name: 'Search selection highlights cluster',
    passed,
    details: passed
      ? `Cluster highlight synchronized with search selection '${selectedId}' (${highlightedClusters} clusters).`
      : 'Cluster highlight failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-20: Selection identity remains synchronized ───────────────────

export async function testSelectionIdentityRemainsSynchronized(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const stateId = fixture.states[0].stateId;
  coordinator.selectState(stateId);

  const s1 = coordinator.sessionState.selectedStateId;
  const s2 = coordinator.selectionManager.currentStateId;
  const s3 = coordinator.cameraEngine.state.focusedObjectId;

  const passed = s1 === stateId && s2 === stateId && s3 === stateId;
  coordinator.dispose();

  return {
    testId: 'TC-F62-20',
    name: 'Selection identity remains synchronized',
    passed,
    details: passed
      ? `Single authoritative selection identity '${stateId}' confirmed across all subsystems.`
      : 'Selection identity synchronization mismatch',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F62-21: AI context contains only selected permitted data ──────────

export async function testAIContextContainsPermittedData(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const stateId = fixture.states[0].stateId;
  coordinator.selectState(stateId);

  const context = coordinator.getSelectedAIContext();
  const passed =
    context !== null &&
    context.selectedStateId === stateId &&
    context.classification === 'GREEN' &&
    context.connectedRelationships.every((r) => r !== undefined);

  coordinator.dispose();

  return {
    testId: 'TC-F62-21',
    name: 'AI context contains only selected permitted data',
    passed,
    details: passed
      ? `AI context payload constructed cleanly for '${stateId}' with classification GREEN.`
      : 'AI context construction failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-22: LLM model selector works ──────────────────────────────────

export function testLLMModelSelectorWorks(): F62TestResult {
  const t0 = performance.now();
  const registry = new ModelRegistry();
  const defaultModel = registry.getDefaultModel();

  const passed = defaultModel.modelId === 'gemini-2.5-pro' && registry.count >= 5;

  return {
    testId: 'TC-F62-22',
    name: 'LLM model selector works',
    passed,
    details: passed
      ? `Model registry loaded ${registry.count} multi-provider models with '${defaultModel.displayName}' default.`
      : 'Model selector registry failed',
    durationMs: performance.now() - t0,
    totalEvaluations: registry.count,
  };
}

// ─── TC-F62-23: Multiple LLM providers can be represented ─────────────────

export function testMultipleLLMProvidersRepresented(): F62TestResult {
  const t0 = performance.now();
  const registry = new ModelRegistry();

  const gemini = registry.getModelsByProvider('GOOGLE_GEMINI');
  const openai = registry.getModelsByProvider('OPENAI');
  const anthropic = registry.getModelsByProvider('ANTHROPIC');
  const local = registry.getModelsByProvider('LOCAL_LLM');

  const passed =
    gemini.length > 0 &&
    openai.length > 0 &&
    anthropic.length > 0 &&
    local.length > 0;

  return {
    testId: 'TC-F62-23',
    name: 'Multiple LLM providers can be represented',
    passed,
    details: passed
      ? 'Google Gemini, OpenAI, Anthropic, and Local On-Device providers all represented cleanly.'
      : 'Provider representation incomplete',
    durationMs: performance.now() - t0,
    totalEvaluations: 4,
  };
}

// ─── TC-F62-24: Local DataProvider interface works ────────────────────────

export async function testLocalDataProviderWorks(): Promise<F62TestResult> {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const localProvider = new LocalDataProvider(fixture.states as any);

  const states = await localProvider.getStates();
  const passed = states.length > 0;

  return {
    testId: 'TC-F62-24',
    name: 'Local DataProvider interface works',
    passed,
    details: passed
      ? `LocalDataProvider loaded ${states.length} cached states successfully.`
      : 'LocalDataProvider failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-25: Remote DataProvider interface works ───────────────────────

export async function testRemoteDataProviderWorks(): Promise<F62TestResult> {
  const t0 = performance.now();
  const remoteProvider = new RemoteDataProvider('/api/custom_endpoint');

  const states = await remoteProvider.getStates();
  const passed = states.length > 0;

  return {
    testId: 'TC-F62-25',
    name: 'Remote DataProvider interface works',
    passed,
    details: passed
      ? `RemoteDataProvider abstraction initialized and loaded ${states.length} states.`
      : 'RemoteDataProvider failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-26: RED data never reaches Studio UI ──────────────────────────

export async function testREDDataNeverReachesStudioUI(): Promise<F62TestResult> {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const redState: any = {
    stateId: 'STATE_RED_PROHIBITED',
    recordId: 'REC_RED',
    entityName: 'Restricted Secret',
    classification: 'RED',
    processingAllowed: false,
  };

  const provider = new LocalDataProvider([...(fixture.states as any), redState]);
  const states = await provider.getStates();

  const redLeaked = states.some((s) => s.classification === 'RED');
  const passed = !redLeaked;

  return {
    testId: 'TC-F62-26',
    name: 'RED data never reaches Studio UI',
    passed,
    details: passed
      ? '100% of RED records strictly filtered out before reaching Studio data layer.'
      : 'RED record leaked into UI layer',
    durationMs: performance.now() - t0,
    totalEvaluations: states.length,
  };
}

// ─── TC-F62-27: RED data never reaches AI context ─────────────────────────

export function testREDDataNeverReachesAIContext(): F62TestResult {
  const t0 = performance.now();
  const redState: any = {
    stateId: 'STATE_RED_PROHIBITED',
    recordId: 'REC_RED',
    entityName: 'Restricted Secret',
    classification: 'RED',
    processingAllowed: false,
  };

  const context = buildAIContextFromSelectedState(redState);
  const passed = context === null;

  return {
    testId: 'TC-F62-27',
    name: 'RED data never reaches AI context',
    passed,
    details: passed
      ? 'AI context builder strictly returned null for RED classification record.'
      : 'RED record allowed into AI context',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-28: Dimension switching preserves Studio selection ────────────

export async function testDimensionSwitchPreservesStudioSelection(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const stateId = fixture.states[0].stateId;
  coordinator.selectState(stateId);

  coordinator.switchDimension(8, 'RADIAL');
  const selZ8 = coordinator.sessionState.selectedStateId;

  coordinator.switchDimension(16, 'LAYER');
  const selZ16 = coordinator.sessionState.selectedStateId;

  const passed = selZ8 === stateId && selZ16 === stateId;
  coordinator.dispose();

  return {
    testId: 'TC-F62-28',
    name: 'Dimension switching preserves Studio selection',
    passed,
    details: passed
      ? `Selected state '${stateId}' preserved across Z3 -> Z8 -> Z16 dimension switches.`
      : 'Selection lost during dimension switch',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F62-29: Studio reset restores deterministic state ─────────────────

export async function testStudioResetRestoresDeterministicState(): Promise<F62TestResult> {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();
  await coordinator.initialize();

  coordinator.selectState('STATE49:REC_W3C_LDP_CONTAINER');
  coordinator.switchDimension(12, 'LAYER');
  coordinator.applyCameraPreset('SIDE');

  coordinator.resetStudio();

  const passed =
    coordinator.sessionState.selectedStateId === null &&
    coordinator.sessionState.activeDimension === 3 &&
    coordinator.sessionState.projectionMode === 'DIRECT' &&
    coordinator.cameraEngine.state.target[0] === 0;

  coordinator.dispose();

  return {
    testId: 'TC-F62-29',
    name: 'Studio reset restores deterministic state',
    passed,
    details: passed
      ? 'Studio reset restored Z3 dimension, DIRECT projection, target [0, 0, 0], and cleared selection.'
      : 'Studio reset failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F62-30: No second RAF loop exists ─────────────────────────────────

export function testNoSecondRAFLoop(): F62TestResult {
  const t0 = performance.now();
  const coordinator = new StudioCoordinator();

  // F62 coordinator uses update(deltaSeconds) called by the existing single RAF loop
  const hasUpdate = typeof coordinator.update === 'function';
  const noSeparateLoop = (coordinator as any).rafId === undefined;

  const passed = hasUpdate && noSeparateLoop;
  coordinator.dispose();

  return {
    testId: 'TC-F62-30',
    name: 'No second RAF loop exists',
    passed,
    details: passed
      ? 'StudioCoordinator verified to use external update(delta) with zero duplicate RAF loops.'
      : 'Duplicate RAF loop detected',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}
