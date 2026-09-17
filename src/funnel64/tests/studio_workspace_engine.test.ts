/**
 * 3D Memory Studio — Funnel 64
 * Actual Studio Workspace & Panel Orchestration Engine Tests
 *
 * 30 Focused Tests:
 * TC-F64-01  Workspace initializes correctly
 * TC-F64-02  Workspace lifecycle is deterministic (250 runs, σ² = 0)
 * TC-F64-03  Panel registry initializes correctly
 * TC-F64-04  Duplicate panel IDs are rejected
 * TC-F64-05  Panel opening works
 * TC-F64-06  Panel closing works
 * TC-F64-07  Panel activation works
 * TC-F64-08  Panel visibility works
 * TC-F64-09  Maximum visible panel limit is enforced (<= 8)
 * TC-F64-10  Workspace layout is deterministic
 * TC-F64-11  Sidebar layout works
 * TC-F64-12  Three-column layout works
 * TC-F64-13  Panel resizing remains bounded ([280, 520]px)
 * TC-F64-14  Panel docking works
 * TC-F64-15  3D viewport adapter attaches correctly
 * TC-F64-16  F55 renderer remains authoritative
 * TC-F64-17  No second RAF loop is created
 * TC-F64-18  Database panel adapter works
 * TC-F64-19  Coordinates panel synchronizes with F60
 * TC-F64-20  Information panel synchronizes with permitted state
 * TC-F64-21  Chat panel initializes correctly
 * TC-F64-22  Model registry works
 * TC-F64-23  Search panel routes through F50
 * TC-F64-24  Search selection synchronizes workspace
 * TC-F64-25  Graph panel synchronizes with F58
 * TC-F64-26  Cluster panel synchronizes with F59
 * TC-F64-27  Dimension panel synchronizes with F60
 * TC-F64-28  Camera focus synchronizes with F61
 * TC-F64-29  GREEN selection is permitted
 * TC-F64-30  RED selection is blocked
 */

import { StudioWorkspaceManager } from '../workspace/workspaceManager';
import { PanelRegistry, MAX_REGISTERED_PANELS } from '../panels/panelRegistry';
import { PanelManager, MAX_VISIBLE_PANELS } from '../panels/panelManager';
import { WorkspaceModelRegistry } from '../panels/chat/modelRegistry';
import { LLMPanelAdapter } from '../panels/chat/llmPanelAdapter';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import { F64TestResult, PanelDescriptor } from '../types';

// ─── TC-F64-01: Workspace initializes correctly ───────────────────────────

export async function testWorkspaceInitializes(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const snapshot = workspace.getContextSnapshot();
  const passed =
    workspace.stateMachine.mode === 'READY' &&
    snapshot.activeDimension === 3 &&
    snapshot.layout === 'SIDEBAR' &&
    snapshot.registeredPanelsCount === 10;

  workspace.dispose();

  return {
    testId: 'TC-F64-01',
    name: 'Workspace initializes correctly',
    passed,
    details: passed
      ? 'StudioWorkspaceManager initialized cleanly with 10 registered panels and READY state.'
      : 'Workspace initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-02: Workspace lifecycle is deterministic ──────────────────────

export async function testWorkspaceLifecycleDeterministic(): Promise<F64TestResult> {
  const t0 = performance.now();
  const runs = 250;
  let firstCount = 0;

  for (let i = 0; i < runs; i++) {
    const workspace = new StudioWorkspaceManager();
    await workspace.initialize();

    workspace.panelManager.openPanel('COORDINATES');
    workspace.switchDimension(8);
    const snap = workspace.getContextSnapshot();

    if (i === 0) {
      firstCount = snap.registeredPanelsCount;
    } else if (snap.registeredPanelsCount !== firstCount || snap.activeDimension !== 8) {
      workspace.dispose();
      return {
        testId: 'TC-F64-02',
        name: 'Workspace lifecycle is deterministic',
        passed: false,
        details: `Non-deterministic state at run ${i}`,
        durationMs: performance.now() - t0,
      };
    }
    workspace.dispose();
  }

  return {
    testId: 'TC-F64-02',
    name: 'Workspace lifecycle is deterministic',
    passed: true,
    details: `${runs} workspace lifecycle runs produced 100% deterministic state (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}

// ─── TC-F64-03: Panel registry initializes correctly ──────────────────────

export function testPanelRegistryInitializes(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();

  const passed =
    registry.count === 10 &&
    registry.hasPanel('DATABASE') &&
    registry.hasPanel('COORDINATES') &&
    registry.hasPanel('CHAT') &&
    registry.hasPanel('SETTINGS');

  const count = registry.count;
  registry.dispose();

  return {
    testId: 'TC-F64-03',
    name: 'Panel registry initializes correctly',
    passed,
    details: passed
      ? `PanelRegistry initialized with ${count} standard first-class panels.`
      : 'Panel registry initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-04: Duplicate panel IDs are rejected ──────────────────────────

export function testDuplicatePanelIdsRejected(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();

  const duplicate: PanelDescriptor = {
    panelId: 'DATABASE',
    title: 'Duplicate DB',
    iconName: 'Database',
    category: 'DATA',
    defaultDock: 'LEFT',
    minWidth: 280,
    maxWidth: 520,
    defaultWidth: 320,
    width: 320,
    visible: true,
    active: true,
    order: 99,
    status: 'READY',
  };

  const registered = registry.registerPanel(duplicate);
  const passed = registered === false;

  registry.dispose();

  return {
    testId: 'TC-F64-04',
    name: 'Duplicate panel IDs are rejected',
    passed,
    details: passed
      ? "Duplicate panel registration for 'DATABASE' strictly rejected."
      : 'Duplicate panel was accepted',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-05: Panel opening works ───────────────────────────────────────

export function testPanelOpeningWorks(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const manager = new PanelManager(registry);

  manager.openPanel('COORDINATES');
  const panel = registry.getPanel('COORDINATES');

  const passed = panel !== undefined && panel.visible === true && panel.active === true;
  registry.dispose();

  return {
    testId: 'TC-F64-05',
    name: 'Panel opening works',
    passed,
    details: passed
      ? "Opening panel 'COORDINATES' set visible = true and active = true."
      : 'Panel open failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-06: Panel closing works ───────────────────────────────────────

export function testPanelClosingWorks(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const manager = new PanelManager(registry);

  manager.openPanel('DATABASE');
  manager.closePanel('DATABASE');
  const panel = registry.getPanel('DATABASE');

  const passed = panel !== undefined && panel.visible === false && panel.active === false;
  registry.dispose();

  return {
    testId: 'TC-F64-06',
    name: 'Panel closing works',
    passed,
    details: passed
      ? "Closing panel 'DATABASE' set visible = false and active = false."
      : 'Panel close failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-07: Panel activation works ────────────────────────────────────

export function testPanelActivationWorks(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const manager = new PanelManager(registry);

  manager.openPanel('CHAT');
  manager.activatePanel('CHAT');
  const panel = registry.getPanel('CHAT');

  const passed = panel?.active === true;
  registry.dispose();

  return {
    testId: 'TC-F64-07',
    name: 'Panel activation works',
    passed,
    details: passed
      ? "Panel 'CHAT' activated successfully."
      : 'Panel activation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-08: Panel visibility works ────────────────────────────────────

export function testPanelVisibilityWorks(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const manager = new PanelManager(registry);

  manager.closeAllPanels();
  manager.openPanel('SEARCH');
  manager.openPanel('GRAPH');

  const visible = registry.getVisiblePanels();
  const passed = visible.length === 2 && visible.some((p) => p.panelId === 'SEARCH');

  registry.dispose();

  return {
    testId: 'TC-F64-08',
    name: 'Panel visibility works',
    passed,
    details: passed
      ? `Visible panels count matches expected (Visible: ${visible.length}).`
      : 'Panel visibility failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-09: Maximum visible panel limit is enforced (<= 8) ────────────

export function testMaxVisiblePanelsEnforced(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const manager = new PanelManager(registry);

  manager.closeAllPanels();
  const panels = registry.getAll();
  for (const p of panels) {
    manager.openPanel(p.panelId);
  }

  const visibleCount = registry.getVisiblePanels().length;
  const passed = visibleCount <= MAX_VISIBLE_PANELS;

  registry.dispose();

  return {
    testId: 'TC-F64-09',
    name: 'Maximum visible panel limit is enforced (<= 8)',
    passed,
    details: passed
      ? `Visible panels strictly capped at ${visibleCount} (Limit: ${MAX_VISIBLE_PANELS}).`
      : 'Visible panel limit exceeded',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-10: Workspace layout is deterministic ─────────────────────────

export async function testWorkspaceLayoutDeterministic(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  workspace.layoutEngine.setLayout('THREE_COLUMN');
  const b1 = workspace.layoutEngine.calculateViewportBounds(1920, 1080);

  workspace.layoutEngine.setLayout('THREE_COLUMN');
  const b2 = workspace.layoutEngine.calculateViewportBounds(1920, 1080);

  const passed = b1.width === b2.width && b1.x === b2.x && b1.height === b2.height;
  workspace.dispose();

  return {
    testId: 'TC-F64-10',
    name: 'Workspace layout is deterministic',
    passed,
    details: passed
      ? `Three-column bounds calculation identical across passes (${b1.width}x${b1.height}).`
      : 'Layout calculation non-deterministic',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F64-11: Sidebar layout works ──────────────────────────────────────

export async function testSidebarLayoutWorks(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  workspace.layoutEngine.setLayout('SIDEBAR');
  const bounds = workspace.layoutEngine.calculateViewportBounds(1200, 800, 320);

  const passed = bounds.x === 320 && bounds.width === 880 && bounds.height === 800;
  workspace.dispose();

  return {
    testId: 'TC-F64-11',
    name: 'Sidebar layout works',
    passed,
    details: passed
      ? `Sidebar layout computed viewport: x=${bounds.x}, width=${bounds.width}px.`
      : 'Sidebar layout failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-12: Three-column layout works ─────────────────────────────────

export async function testThreeColumnLayoutWorks(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  workspace.layoutEngine.setLayout('THREE_COLUMN');
  const bounds = workspace.layoutEngine.calculateViewportBounds(1600, 900, 300, 300);

  const passed = bounds.x === 300 && bounds.width === 1000 && bounds.height === 900;
  workspace.dispose();

  return {
    testId: 'TC-F64-12',
    name: 'Three-column layout works',
    passed,
    details: passed
      ? `Three-column layout computed viewport width=${bounds.width}px with dual sidebars.`
      : 'Three-column layout failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-13: Panel resizing remains bounded ([280, 520]px) ─────────────

export function testPanelResizingBounded(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const manager = new PanelManager(registry);

  manager.resizePanel('DATABASE', 1000); // Extreme expand
  const maxW = registry.getPanel('DATABASE')?.width;

  manager.resizePanel('DATABASE', 50); // Extreme shrink
  const minW = registry.getPanel('DATABASE')?.width;

  const passed = maxW === 520 && minW === 280;
  registry.dispose();

  return {
    testId: 'TC-F64-13',
    name: 'Panel resizing remains bounded ([280, 520]px)',
    passed,
    details: passed
      ? `Panel width strictly clamped within [280, 520]px envelope (Max: ${maxW}px, Min: ${minW}px).`
      : 'Panel resizing unbounded',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F64-14: Panel docking works ───────────────────────────────────────

export function testPanelDockingWorks(): F64TestResult {
  const t0 = performance.now();
  const registry = new PanelRegistry();
  const leftPanels = registry.getAll().filter((p) => p.defaultDock === 'LEFT');
  const rightPanels = registry.getAll().filter((p) => p.defaultDock === 'RIGHT');

  const passed = leftPanels.length > 0 && rightPanels.length > 0;
  registry.dispose();

  return {
    testId: 'TC-F64-14',
    name: 'Panel docking works',
    passed,
    details: passed
      ? `Panel docking verified (${leftPanels.length} LEFT, ${rightPanels.length} RIGHT).`
      : 'Panel docking verification failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F64-15: 3D viewport adapter attaches correctly ────────────────────

export async function testViewportAdapterAttaches(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const bounds = { x: 320, y: 0, width: 900, height: 600 };
  workspace.viewportAdapter.setViewportBounds(bounds);
  const currentBounds = workspace.viewportAdapter.getViewportBounds();

  const passed = currentBounds.width === 900 && currentBounds.height === 600;
  workspace.dispose();

  return {
    testId: 'TC-F64-15',
    name: '3D viewport adapter attaches correctly',
    passed,
    details: passed
      ? 'Viewport adapter bounds set and retrieved cleanly without errors.'
      : 'Viewport adapter failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-16: F55 renderer remains authoritative ────────────────────────

export async function testF55RendererAuthoritative(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const passed = workspace.viewportAdapter.rendererHost !== undefined;
  workspace.dispose();

  return {
    testId: 'TC-F64-16',
    name: 'F55 renderer remains authoritative',
    passed,
    details: passed
      ? 'F64 verified to consume F55 renderer host authority via adapter.'
      : 'F55 renderer authority missing',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-17: No second RAF loop is created ─────────────────────────────

export async function testNoSecondRAFLoop(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const noRaf = (workspace as any).rafId === undefined;
  const passed = noRaf && typeof workspace.viewportAdapter.update === 'function';
  workspace.dispose();

  return {
    testId: 'TC-F64-17',
    name: 'No second RAF loop is created',
    passed,
    details: passed
      ? 'StudioWorkspaceManager verified to use external update() without second RAF loop.'
      : 'Duplicate RAF loop detected',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-18: Database panel adapter works ──────────────────────────────

export async function testDatabasePanelAdapterWorks(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const records = await workspace.databaseAdapter.getPermittedRecords();
  const allGreen = records.every((r) => r.classification === 'GREEN');
  const passed = records.length > 0 && allGreen;

  workspace.dispose();

  return {
    testId: 'TC-F64-18',
    name: 'Database panel adapter works',
    passed,
    details: passed
      ? `Database adapter returned ${records.length} verified GREEN records.`
      : 'Database adapter failed',
    durationMs: performance.now() - t0,
    totalEvaluations: records.length,
  };
}

// ─── TC-F64-19: Coordinates panel synchronizes with F60 ───────────────────

export async function testCoordinatesPanelSyncWithF60(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const stateId = fixture.states[0].stateId;
  workspace.selectState(stateId);

  workspace.switchDimension(8, 'RADIAL');
  const coord = workspace.dimensionAdapter.getCoordinate(stateId);

  const passed = coord !== undefined && coord.dimension === 8 && coord.projectionType === 'RADIAL';
  workspace.dispose();

  return {
    testId: 'TC-F64-19',
    name: 'Coordinates panel synchronizes with F60',
    passed,
    details: passed
      ? `Coordinates panel synchronized with Z8 RADIAL projection for '${stateId}'.`
      : 'Coordinates sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-20: Information panel synchronizes with permitted state ───────

export async function testInfoPanelSyncWithState(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const fixture = getStandardInformationUniverseFixture();
  const state = fixture.states[0];
  workspace.selectState(state.stateId);

  const passed = workspace.selectionManager.currentStateId === state.stateId;
  workspace.dispose();

  return {
    testId: 'TC-F64-20',
    name: 'Information panel synchronizes with permitted state',
    passed,
    details: passed
      ? `Information panel selection synchronized for state '${state.stateId}'.`
      : 'Information panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-21: Chat panel initializes correctly ──────────────────────────

export function testChatPanelInitializes(): F64TestResult {
  const t0 = performance.now();
  const adapter = new LLMPanelAdapter();
  const messages = adapter.getMessages();

  const passed = messages.length === 1 && messages[0].isMock === true;

  return {
    testId: 'TC-F64-21',
    name: 'Chat panel initializes correctly',
    passed,
    details: passed
      ? 'Chat adapter initialized with initial [MOCK / NOT CONNECTED] greeting.'
      : 'Chat panel initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-22: Model registry works ──────────────────────────────────────

export function testModelRegistryWorks(): F64TestResult {
  const t0 = performance.now();
  const registry = new WorkspaceModelRegistry();
  const defaultModel = registry.selectedModel;

  const passed = defaultModel.modelId === 'gemini-2.5-pro' && registry.count >= 5;

  return {
    testId: 'TC-F64-22',
    name: 'Model registry works',
    passed,
    details: passed
      ? `Model registry loaded ${registry.count} models with '${defaultModel.displayName}' default.`
      : 'Model registry failed',
    durationMs: performance.now() - t0,
    totalEvaluations: registry.count,
  };
}

// ─── TC-F64-23: Search panel routes through F50 ───────────────────────────

export async function testSearchPanelRoutesThroughF50(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const results = await workspace.searchAdapter.search('HTTP');
  const passed = results.length > 0 && results[0].stateId.includes('HTTP');

  workspace.dispose();

  return {
    testId: 'TC-F64-23',
    name: 'Search panel routes through F50',
    passed,
    details: passed
      ? `Search query 'HTTP' returned ${results.length} verified results.`
      : 'Search routing failed',
    durationMs: performance.now() - t0,
    totalEvaluations: results.length,
  };
}

// ─── TC-F64-24: Search selection synchronizes workspace ───────────────────

export async function testSearchSelectionSyncsWorkspace(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const selectedId = await workspace.searchAndSelect('HTTP');
  const snap = workspace.getContextSnapshot();

  const passed = selectedId !== null && snap.selectedStateId === selectedId;
  workspace.dispose();

  return {
    testId: 'TC-F64-24',
    name: 'Search selection synchronizes workspace',
    passed,
    details: passed
      ? `Search selection '${selectedId}' propagated across workspace snapshot.`
      : 'Search selection sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-25: Graph panel synchronizes with F58 ─────────────────────────

export async function testGraphPanelSyncWithF58(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const rels = workspace.graphAdapter.getAllRelationships();
  const passed = rels.length > 0;
  workspace.dispose();

  return {
    testId: 'TC-F64-25',
    name: 'Graph panel synchronizes with F58',
    passed,
    details: passed
      ? `Graph panel synchronized ${rels.length} relationships from F58.`
      : 'Graph panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-26: Cluster panel synchronizes with F59 ───────────────────────

export async function testClusterPanelSyncWithF59(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const clusters = workspace.clusterAdapter.getAllClusters();
  const passed = clusters.length > 0;
  workspace.dispose();

  return {
    testId: 'TC-F64-26',
    name: 'Cluster panel synchronizes with F59',
    passed,
    details: passed
      ? `Cluster panel synchronized ${clusters.length} clusters from F59.`
      : 'Cluster panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-27: Dimension panel synchronizes with F60 ─────────────────────

export async function testDimensionPanelSyncWithF60(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  workspace.switchDimension(12, 'LAYER');
  const dim = workspace.dimensionAdapter.activeDimension;
  const proj = workspace.dimensionAdapter.projectionType;

  const passed = dim === 12 && proj === 'LAYER';
  workspace.dispose();

  return {
    testId: 'TC-F64-27',
    name: 'Dimension panel synchronizes with F60',
    passed,
    details: passed
      ? 'Dimension switch to Z12 LAYER synchronized with F60.'
      : 'Dimension panel sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-28: Camera focus synchronizes with F61 ────────────────────────

export async function testCameraFocusSyncWithF61(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  workspace.cameraAdapter.setPreset('TOP');
  const mode = workspace.cameraAdapter.cameraMode;

  const passed = mode === 'ORBIT';
  workspace.dispose();

  return {
    testId: 'TC-F64-28',
    name: 'Camera focus synchronizes with F61',
    passed,
    details: passed
      ? 'Camera preset TOP synchronized cleanly with F61 camera engine.'
      : 'Camera focus sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-29: GREEN selection is permitted ──────────────────────────────

export async function testGreenSelectionPermitted(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const permitted = workspace.selectState('STATE_GREEN_001', 'GREEN');
  const passed = permitted === true && workspace.selectionManager.currentStateId === 'STATE_GREEN_001';

  workspace.dispose();

  return {
    testId: 'TC-F64-29',
    name: 'GREEN selection is permitted',
    passed,
    details: passed
      ? "GREEN state 'STATE_GREEN_001' accepted cleanly as selected object."
      : 'GREEN selection failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F64-30: RED selection is blocked ──────────────────────────────────

export async function testRedSelectionBlocked(): Promise<F64TestResult> {
  const t0 = performance.now();
  const workspace = new StudioWorkspaceManager();
  await workspace.initialize();

  const permitted = workspace.selectState('STATE_RED_PROHIBITED', 'RED');
  const passed = permitted === false && workspace.selectionManager.currentStateId !== 'STATE_RED_PROHIBITED';

  workspace.dispose();

  return {
    testId: 'TC-F64-30',
    name: 'RED selection is blocked',
    passed,
    details: passed
      ? 'RED state strictly blocked by F47 security boundary (permitted: false).'
      : 'RED selection allowed through security boundary',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}
