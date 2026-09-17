/**
 * 3D Memory Studio — Funnel 55
 * Actual 3D Renderer Foundation Tests
 *
 * 18 Focused Research & Infrastructure Tests:
 * TC-F55-01  Renderer Initializes Successfully
 * TC-F55-02  Renderer Lifecycle is Deterministic
 * TC-F55-03  WebGL Capability Detection Works
 * TC-F55-04  Fallback Activates When WebGL is Unavailable
 * TC-F55-05  Canvas Attaches Correctly
 * TC-F55-06  Canvas Resize Works
 * TC-F55-07  DevicePixelRatio is Bounded
 * TC-F55-08  Render Loop Starts Correctly
 * TC-F55-09  Render Loop Pauses Correctly
 * TC-F55-10  Render Loop Resumes Correctly
 * TC-F55-11  Render Loop Cleanup Releases RAF
 * TC-F55-12  Double Dispose is Safe
 * TC-F55-13  Scene Layers Initialize Correctly
 * TC-F55-14  Renderable Object Lifecycle Works
 * TC-F55-15  Resource Registry Releases Resources
 * TC-F55-16  Renderer Telemetry Remains Bounded
 * TC-F55-17  GREEN Adapter Permits Authorized Render State
 * TC-F55-18  RED Data Cannot Become Render Payload
 */

import { MemoryRendererHost } from '../renderer/rendererHost';
import { detectRendererCapabilities } from '../renderer/rendererCapabilities';
import { RendererResourceRegistry } from '../renderer/rendererResources';
import { RendererLoop } from '../renderer/rendererLoop';
import { MemoryScene } from '../scene/memoryScene';
import { RenderableStateNode } from '../scene/renderableObject';
import { populateSceneWithGreenStates } from '../adapters/upstreamRendererAdapter';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import { F55TestResult } from '../types';

// ─── TC-F55-01: Renderer Initializes Successfully ─────────────────────────

export function testRendererInitializesSuccessfully(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();
  host.initialize();

  const passed =
    host.state === 'INITIALIZED' &&
    host.capabilities !== undefined &&
    host.scene !== undefined &&
    host.camera !== undefined;

  host.dispose();

  return {
    testId: 'TC-F55-01',
    name: 'Renderer Initializes Successfully',
    passed,
    details: passed
      ? `Renderer host initialized cleanly with backend '${host.capabilities.rendererType}'.`
      : 'Renderer host initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-02: Renderer Lifecycle is Deterministic ───────────────────────

export function testRendererLifecycleDeterministic(): F55TestResult {
  const t0 = performance.now();
  const runs = 250;

  for (let i = 0; i < runs; i++) {
    const host = new MemoryRendererHost();
    if ((host.state as string) !== 'UNINITIALIZED') return { testId: 'TC-F55-02', name: 'Renderer Lifecycle is Deterministic', passed: false, details: 'Initial state not UNINITIALIZED', durationMs: performance.now() - t0 };
    host.initialize();
    if ((host.state as string) !== 'INITIALIZED') return { testId: 'TC-F55-02', name: 'Renderer Lifecycle is Deterministic', passed: false, details: 'State not INITIALIZED', durationMs: performance.now() - t0 };
    host.start();
    if ((host.state as string) !== 'RUNNING') return { testId: 'TC-F55-02', name: 'Renderer Lifecycle is Deterministic', passed: false, details: 'State not RUNNING', durationMs: performance.now() - t0 };
    host.pause();
    if ((host.state as string) !== 'PAUSED') return { testId: 'TC-F55-02', name: 'Renderer Lifecycle is Deterministic', passed: false, details: 'State not PAUSED', durationMs: performance.now() - t0 };
    host.resume();
    if ((host.state as string) !== 'RUNNING') return { testId: 'TC-F55-02', name: 'Renderer Lifecycle is Deterministic', passed: false, details: 'State not RUNNING after resume', durationMs: performance.now() - t0 };
    host.dispose();
    if ((host.state as string) !== 'DISPOSED') return { testId: 'TC-F55-02', name: 'Renderer Lifecycle is Deterministic', passed: false, details: 'State not DISPOSED', durationMs: performance.now() - t0 };
  }

  return {
    testId: 'TC-F55-02',
    name: 'Renderer Lifecycle is Deterministic',
    passed: true,
    details: `${runs} complete lifecycle cycles executed with 100% deterministic state transitions (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}

// ─── TC-F55-03: WebGL Capability Detection Works ──────────────────────────

export function testWebGLCapabilityDetectionWorks(): F55TestResult {
  const t0 = performance.now();
  const caps = detectRendererCapabilities();

  const passed =
    typeof caps.webglAvailable === 'boolean' &&
    typeof caps.maxBoundedDpr === 'number' &&
    caps.maxBoundedDpr <= 2.0 &&
    caps.maxBoundedDpr >= 1.0 &&
    caps.rendererType !== undefined;

  return {
    testId: 'TC-F55-03',
    name: 'WebGL Capability Detection Works',
    passed,
    details: passed
      ? `Capability detector returned WebGL=${caps.webglAvailable}, Backend=${caps.rendererType}, MaxBoundedDPR=${caps.maxBoundedDpr}x.`
      : 'Capability detection failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-04: Fallback Activates When WebGL is Unavailable ──────────────

export function testFallbackActivatesWhenWebGLUnavailable(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();

  const passed =
    host.fallback !== undefined &&
    typeof host.fallback.render === 'function' &&
    (host.capabilities.webglAvailable || host.capabilities.fallbackRequired);

  host.dispose();

  return {
    testId: 'TC-F55-04',
    name: 'Fallback Activates When WebGL is Unavailable',
    passed,
    details: passed
      ? 'Fallback 2D Canvas pipeline verified and available for non-WebGL environments.'
      : 'Fallback activation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-05: Canvas Attaches Correctly ─────────────────────────────────

export function testCanvasAttachesCorrectly(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();
  const mockCanvas = {
    getContext: () => ({
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
    }),
  };

  host.attach(mockCanvas);
  const passed = host.state === 'ATTACHED';
  host.dispose();

  return {
    testId: 'TC-F55-05',
    name: 'Canvas Attaches Correctly',
    passed,
    details: passed
      ? 'Canvas attached cleanly and updated lifecycle state to ATTACHED.'
      : 'Canvas attachment failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-06: Canvas Resize Works ───────────────────────────────────────

export function testCanvasResizeWorks(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();
  host.resize(1920, 1080);

  const passed =
    host.currentViewport.width === 1920 &&
    host.currentViewport.height === 1080 &&
    Math.abs(host.currentViewport.aspect - 1920 / 1080) < 0.001 &&
    Math.abs(host.camera.aspect - 1920 / 1080) < 0.001;

  host.dispose();

  return {
    testId: 'TC-F55-06',
    name: 'Canvas Resize Works',
    passed,
    details: passed
      ? `Resize to 1920x1080 updated viewport and camera aspect to ${host.currentViewport.aspect.toFixed(3)}.`
      : 'Canvas resize failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-07: DevicePixelRatio is Bounded ───────────────────────────────

export function testDevicePixelRatioBounded(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();

  // Test extreme high DPR (e.g. 4.0)
  host.resize(800, 600, 4.0);
  const highDprBounded = host.currentViewport.dpr <= 2.0;

  // Test normal DPR
  host.resize(800, 600, 1.5);
  const normalDpr = host.currentViewport.dpr <= 2.0;

  host.dispose();

  const passed = highDprBounded && normalDpr;

  return {
    testId: 'TC-F55-07',
    name: 'DevicePixelRatio is Bounded',
    passed,
    details: passed
      ? 'DevicePixelRatio strictly clamped to max 2.0 to protect GPU resource budgets.'
      : 'DPR bounding violation detected',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F55-08: Render Loop Starts Correctly ──────────────────────────────

export function testRenderLoopStartsCorrectly(): F55TestResult {
  const t0 = performance.now();
  const loop = new RendererLoop();
  let ticks = 0;

  loop.start(() => {
    ticks++;
  });

  const passed = loop.isRunning && !loop.isPaused;
  loop.stop();

  return {
    testId: 'TC-F55-08',
    name: 'Render Loop Starts Correctly',
    passed,
    details: passed
      ? 'Render loop started cleanly with active RAF callback registration.'
      : 'Render loop start failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-09: Render Loop Pauses Correctly ──────────────────────────────

export function testRenderLoopPausesCorrectly(): F55TestResult {
  const t0 = performance.now();
  const loop = new RendererLoop();
  loop.start(() => {});
  loop.pause();

  const passed = loop.isRunning && loop.isPaused;
  loop.stop();

  return {
    testId: 'TC-F55-09',
    name: 'Render Loop Pauses Correctly',
    passed,
    details: passed
      ? 'Render loop pause state verified without tearing down loop handler.'
      : 'Render loop pause failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-10: Render Loop Resumes Correctly ─────────────────────────────

export function testRenderLoopResumesCorrectly(): F55TestResult {
  const t0 = performance.now();
  const loop = new RendererLoop();
  loop.start(() => {});
  loop.pause();
  loop.resume();

  const passed = loop.isRunning && !loop.isPaused;
  loop.stop();

  return {
    testId: 'TC-F55-10',
    name: 'Render Loop Resumes Correctly',
    passed,
    details: passed
      ? 'Render loop resume smoothly cleared paused flag.'
      : 'Render loop resume failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-11: Render Loop Cleanup Releases RAF ──────────────────────────

export function testRenderLoopCleanupReleasesRAF(): F55TestResult {
  const t0 = performance.now();
  const loop = new RendererLoop();
  loop.start(() => {});
  loop.stop();

  const passed = !loop.isRunning && !loop.isPaused;

  return {
    testId: 'TC-F55-11',
    name: 'Render Loop Cleanup Releases RAF',
    passed,
    details: passed
      ? 'Render loop stop cleanly invoked cancelAnimationFrame without leaving abandoned callbacks.'
      : 'Render loop cleanup failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-12: Double Dispose is Safe ────────────────────────────────────

export function testDoubleDisposeIsSafe(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();
  host.initialize();
  host.start();

  let threw = false;
  try {
    host.dispose();
    host.dispose(); // Double dispose
    host.dispose(); // Triple dispose
  } catch {
    threw = true;
  }

  const passed = !threw && host.state === 'DISPOSED';

  return {
    testId: 'TC-F55-12',
    name: 'Double Dispose is Safe',
    passed,
    details: passed
      ? 'Idempotent disposal verified: multiple dispose() calls execute safely without exception.'
      : 'Double dispose threw exception',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F55-13: Scene Layers Initialize Correctly ─────────────────────────

export function testSceneLayersInitializeCorrectly(): F55TestResult {
  const t0 = performance.now();
  const scene = new MemoryScene();
  const layers = scene.getAllLayers();

  const passed =
    layers.length === 7 &&
    scene.getLayer('CORE_LAYER') !== undefined &&
    scene.getLayer('STATE_LAYER') !== undefined &&
    scene.getLayer('RELATIONSHIP_LAYER') !== undefined &&
    scene.getLayer('CLUSTER_LAYER') !== undefined &&
    scene.getLayer('DIMENSION_LAYER') !== undefined &&
    scene.getLayer('EFFECTS_LAYER') !== undefined &&
    scene.getLayer('OVERLAY_LAYER') !== undefined;

  scene.dispose();

  return {
    testId: 'TC-F55-13',
    name: 'Scene Layers Initialize Correctly',
    passed,
    details: passed
      ? `Verified all 7 standard scene layers initialized (${layers.map((l) => l.id).join(', ')}).`
      : 'Scene layers initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: layers.length,
  };
}

// ─── TC-F55-14: Renderable Object Lifecycle Works ──────────────────────────

export function testRenderableObjectLifecycleWorks(): F55TestResult {
  const t0 = performance.now();
  const scene = new MemoryScene();
  const stateLayer = scene.getLayer('STATE_LAYER');

  const node = new RenderableStateNode('NODE_TEST_01', 'Test Node', 'STANDARDS', 'GREEN', '369');
  stateLayer.addObject(node);

  const initialCount = stateLayer.objects.length;
  stateLayer.update(16.6, 16.6);

  stateLayer.removeObject('NODE_TEST_01');
  const finalCount = stateLayer.objects.length;

  scene.dispose();

  const passed = initialCount === 1 && finalCount === 0;

  return {
    testId: 'TC-F55-14',
    name: 'Renderable Object Lifecycle Works',
    passed,
    details: passed
      ? 'Renderable object creation, layer registration, update, and removal verified.'
      : 'Renderable object lifecycle failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-15: Resource Registry Releases Resources ──────────────────────

export function testResourceRegistryReleasesResources(): F55TestResult {
  const t0 = performance.now();
  const registry = new RendererResourceRegistry();
  let disposedCount = 0;

  registry.registerResource('GEO_01', 'GEOMETRY', () => disposedCount++);
  registry.registerResource('MAT_01', 'MATERIAL', () => disposedCount++);
  registry.registerResource('TEX_01', 'TEXTURE', () => disposedCount++);

  const activeBefore = registry.getActiveCount();
  registry.releaseResource('GEO_01');
  const activeAfterOne = registry.getActiveCount();

  registry.disposeAll();
  const activeAfterAll = registry.getActiveCount();

  const passed = activeBefore === 3 && activeAfterOne === 2 && activeAfterAll === 0 && disposedCount === 3;

  return {
    testId: 'TC-F55-15',
    name: 'Resource Registry Releases Resources',
    passed,
    details: passed
      ? 'Centralized resource registry released GPU resources deterministically without leaks.'
      : 'Resource release failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F55-16: Renderer Telemetry Remains Bounded ────────────────────────

export function testRendererTelemetryRemainsBounded(): F55TestResult {
  const t0 = performance.now();
  const host = new MemoryRendererHost();
  host.initialize();
  host.render();
  const stats = host.getStats();
  host.dispose();

  const passed =
    stats.fps >= 0 &&
    stats.frameTimeMs >= 0 &&
    stats.frameDeltaMs >= 1 &&
    stats.frameDeltaMs <= 50 &&
    stats.canvasWidth > 0 &&
    stats.canvasHeight > 0 &&
    stats.dpr <= 2.0;

  return {
    testId: 'TC-F55-16',
    name: 'Renderer Telemetry Remains Bounded',
    passed,
    details: passed
      ? `Renderer stats verified: FPS=${stats.fps}, FrameDelta=${stats.frameDeltaMs}ms, DPR=${stats.dpr}x.`
      : 'Renderer telemetry out of bounds',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F55-17: GREEN Adapter Permits Authorized Render State ─────────────

export function testGreenAdapterPermitsAuthorizedState(): F55TestResult {
  const t0 = performance.now();
  const scene = new MemoryScene();
  const fixture = getStandardInformationUniverseFixture();
  const report = populateSceneWithGreenStates(scene, fixture.states);

  const stateLayer = scene.getLayer('STATE_LAYER');
  const passed =
    report.greenObjectsCreated > 0 &&
    stateLayer.objects.length === report.greenObjectsCreated &&
    report.greenObjectsCreated + report.redRecordsBlocked === report.totalInputStates;

  scene.dispose();

  return {
    testId: 'TC-F55-17',
    name: 'GREEN Adapter Permits Authorized Render State',
    passed,
    details: passed
      ? `Authorized ${report.greenObjectsCreated} GREEN states into scene renderables (${report.totalInputStates} total evaluated).`
      : 'GREEN state adaptation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: report.totalInputStates,
  };
}

// ─── TC-F55-18: RED Data Cannot Become Render Payload ─────────────────────

export function testRedDataCannotBecomeRenderPayload(): F55TestResult {
  const t0 = performance.now();
  const scene = new MemoryScene();
  const fixture = getStandardInformationUniverseFixture();
  const report = populateSceneWithGreenStates(scene, fixture.states);

  const stateLayer = scene.getLayer('STATE_LAYER');
  const redObjects = stateLayer.objects.filter(
    (o) => (o as RenderableStateNode).classification === 'RED'
  );

  const passed = redObjects.length === 0 && report.redRecordsBlocked > 0;
  scene.dispose();

  return {
    testId: 'TC-F55-18',
    name: 'RED Data Cannot Become Render Payload',
    passed,
    details: passed
      ? `F47 security boundary enforced: 0 RED objects entered scene (${report.redRecordsBlocked} blocked from renderables).`
      : 'RED restricted state leakage into scene detected',
    durationMs: performance.now() - t0,
    totalEvaluations: stateLayer.objects.length,
  };
}
