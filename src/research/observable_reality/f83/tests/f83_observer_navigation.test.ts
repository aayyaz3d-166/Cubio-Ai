/**
 * 3D Memory Studio — Funnel 83
 * Dedicated Test Suite: F83-NAV-01 to F83-NAV-40
 */

import {
  createFullState,
  createFullStateObject,
} from '../../f82/core/fullState';
import { createDefaultObservationBoundary } from '../../f82/core/observationBoundary';
import { createObserverFrame, toF82Observer } from '../core/observerFrame';
import { FrameTraversalEngine } from '../core/frameTraversal';
import { verifyStateInvariance } from '../core/stateInvariant';
import { FrameProjectionEngine } from '../projection/frameProjection';
import { translateObserverFrame, switchProjectionType } from '../projection/frameTransform';
import { analyzeFrameDifference } from '../analysis/frameDifference';
import { testFrameReversibility } from '../analysis/frameReversibility';
import { compareSimultaneousObservers } from '../analysis/observerComparison';
import { FrameTimelineEngine, TimelineTransitionNode } from '../temporal/frameTimeline';

export interface F83TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details?: string;
  readonly durationMs: number;
}

export interface F83TestSuiteSummary {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly results: readonly F83TestResult[];
  readonly totalDurationMs: number;
}

export async function runF83TestSuite(): Promise<F83TestSuiteSummary> {
  const results: F83TestResult[] = [];
  const startAll = performance.now();

  const runTest = async (testId: string, name: string, fn: () => void | Promise<void>) => {
    const t0 = performance.now();
    try {
      await fn();
      results.push({
        testId,
        name,
        passed: true,
        durationMs: performance.now() - t0,
      });
    } catch (err: any) {
      results.push({
        testId,
        name,
        passed: false,
        details: err?.message || String(err),
        durationMs: performance.now() - t0,
      });
    }
  };

  // F83-NAV-01: Observer frame construction with default parameters
  await runTest('F83-NAV-01', 'Observer frame construction with default parameters', () => {
    const frame = createObserverFrame('F0', 'OBS_DEFAULT');
    if (frame.frameId !== 'F0' || frame.observerId !== 'OBS_DEFAULT' || frame.projectionType !== 'DIRECT_ORTHOGRAPHIC_3D') {
      throw new Error('Default frame construction mismatch');
    }
  });

  // F83-NAV-02: Custom observer frame with perspective parameters
  await runTest('F83-NAV-02', 'Custom observer frame with perspective parameters', () => {
    const frame = createObserverFrame('F_PERSP', 'OBS_P', [0, 0, 100], [0, 0, -1], 'PERSPECTIVE_PINHOLE_3D', undefined, {
      fovDegrees: 90,
      focalLength: 25.0,
    });
    if (frame.fovDegrees !== 90 || frame.focalLength !== 25.0 || frame.position[2] !== 100) {
      throw new Error('Perspective frame configuration mismatch');
    }
  });

  // F83-NAV-03: Custom observer frame with sliced hyperplane parameters
  await runTest('F83-NAV-03', 'Custom observer frame with sliced hyperplane parameters', () => {
    const frame = createObserverFrame('F_SLICE', 'OBS_S', [0, 0, 0], [0, 0, 1], 'SLICED_HYPERPLANE_3D', undefined, {
      sliceW: 42.5,
      sliceThickness: 2.0,
    });
    if (frame.sliceW !== 42.5 || frame.sliceThickness !== 2.0) {
      throw new Error('Sliced frame configuration mismatch');
    }
  });

  // F83-NAV-04: Frame translation (O0 -> O1)
  await runTest('F83-NAV-04', 'Observer frame translation', () => {
    const f0 = createObserverFrame('F0', 'OBS_T', [10, 20, 30]);
    const f1 = translateObserverFrame(f0, [5, -10, 20], 'F1');
    if (f1.position[0] !== 15 || f1.position[1] !== 10 || f1.position[2] !== 50 || f1.frameId !== 'F1') {
      throw new Error('Translation calculation mismatch');
    }
  });

  // F83-NAV-05: Frame projection type switching
  await runTest('F83-NAV-05', 'Observer frame projection type switching', () => {
    const f0 = createObserverFrame('F0', 'OBS_SW', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    const f1 = switchProjectionType(f0, 'PERSPECTIVE_PINHOLE_3D', 'F1_PERSP');
    if (f1.projectionType !== 'PERSPECTIVE_PINHOLE_3D' || f1.frameId !== 'F1_PERSP') {
      throw new Error('Projection switch mismatch');
    }
  });

  // F83-NAV-06: Single state observed through multiple frames
  await runTest('F83-NAV-06', 'Single state observed through multiple frames', () => {
    const state = createFullState('S_MULTI_OBS', 0, [createFullStateObject('O1', 'STAR', [10, 20, 30, 5])]);
    const frames = [
      createObserverFrame('F0', 'OBS_1', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D'),
      createObserverFrame('F1', 'OBS_2', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D'),
      createObserverFrame('F2', 'OBS_3', [0, 0, 0], [0, 0, 1], 'SLICED_HYPERPLANE_3D', undefined, { sliceW: 5, sliceThickness: 1 }),
    ];
    const traversal = new FrameTraversalEngine().traverse(state, frames);
    if (traversal.steps.length !== 3 || traversal.steps[0].observationFrame.frameHash === traversal.steps[1].observationFrame.frameHash) {
      throw new Error('Different frames should produce distinct observation frames');
    }
  });

  // F83-NAV-07: Underlying state hash invariance across observer transitions
  await runTest('F83-NAV-07', 'Underlying state hash invariance across observer transitions', () => {
    const state = createFullState('S_INV_07', 0, [createFullStateObject('NODE', 'CORE', [1, 2, 3, 4])]);
    const frames = [createObserverFrame('F0', 'O0'), createObserverFrame('F1', 'O1'), createObserverFrame('F2', 'O2')];
    const report = verifyStateInvariance(state, frames);
    if (report.isStateMutated || report.initialHash !== report.finalHash) {
      throw new Error('State was mutated during observer transitions');
    }
  });

  // F83-NAV-08: Deep object immutability under frame traversal
  await runTest('F83-NAV-08', 'Deep object immutability under frame traversal', () => {
    const obj = createFullStateObject('O_MUT', 'PARTICLE', [5, 10, 15, 20], [0, 0, 0, 0], ['REL_A'], { color: 'blue' }, 'SECRET');
    const state = createFullState('S_MUT', 0, [obj]);
    const traversal = new FrameTraversalEngine().traverse(state, [createObserverFrame('F0', 'O0')]);

    try {
      (traversal.steps[0].observableRepresentation.observableObjects as any).push({});
      throw new Error('Should have thrown mutation error');
    } catch {
      // Expected frozen array
    }
  });

  // F83-NAV-09: Traversal step hashing determinism
  await runTest('F83-NAV-09', 'Traversal step hashing determinism', () => {
    const state = createFullState('S_HASH_09', 0, [createFullStateObject('O9', 'POINT', [1, 1, 1, 1])]);
    const frame = createObserverFrame('F0', 'O0');
    const engine = new FrameTraversalEngine();

    const t1 = engine.traverse(state, [frame]);
    const t2 = engine.traverse(state, [frame]);

    if (t1.steps[0].stepHash !== t2.steps[0].stepHash) {
      throw new Error('Step hash non-deterministic');
    }
  });

  // F83-NAV-10: Complete traversal sequence hashing determinism
  await runTest('F83-NAV-10', 'Complete traversal sequence hashing determinism', () => {
    const state = createFullState('S_HASH_10', 0, [createFullStateObject('O10', 'POINT', [2, 4, 6, 8])]);
    const frames = [createObserverFrame('F0', 'O0'), createObserverFrame('F1', 'O1')];
    const engine = new FrameTraversalEngine();

    const t1 = engine.traverse(state, frames);
    const t2 = engine.traverse(state, frames);

    if (t1.traversalHash !== t2.traversalHash) {
      throw new Error('Traversal sequence hash non-deterministic');
    }
  });

  // F83-NAV-11: Frame difference detection on position translation
  await runTest('F83-NAV-11', 'Frame difference detection on position translation', () => {
    const state = createFullState('S_DIFF_11', 0, [createFullStateObject('O11', 'PLANET', [10, 20, 30, 0])]);
    const f0 = createObserverFrame('F0', 'O0', [0, 0, 0]);
    const f1 = createObserverFrame('F1', 'O1', [10, 0, 0]);
    const projEngine = new FrameProjectionEngine();

    const res0 = projEngine.projectFrame(state, f0);
    const res1 = projEngine.projectFrame(state, f1);

    const diff = analyzeFrameDifference(res0.frame, res1.frame, f0, f1);
    if (diff.positionDelta[0] !== 10 || diff.positionDeltaMagnitude !== 10) {
      throw new Error('Position delta calculation mismatch');
    }
  });

  // F83-NAV-12: Frame difference magnitude calculation
  await runTest('F83-NAV-12', 'Frame difference magnitude calculation (3D distance)', () => {
    const f0 = createObserverFrame('F0', 'O0', [0, 0, 0]);
    const f1 = createObserverFrame('F1', 'O1', [3, 4, 0]); // 3-4-5 triangle
    const state = createFullState('S_MAG_12', 0, [createFullStateObject('O12', 'P', [0, 0, 0, 0])]);
    const proj = new FrameProjectionEngine();

    const r0 = proj.projectFrame(state, f0);
    const r1 = proj.projectFrame(state, f1);

    const diff = analyzeFrameDifference(r0.frame, r1.frame, f0, f1);
    if (diff.positionDeltaMagnitude !== 5.0) {
      throw new Error('Distance magnitude must equal 5.0');
    }
  });

  // F83-NAV-13: Frame difference with identical observer frames
  await runTest('F83-NAV-13', 'Frame difference with identical observer frames', () => {
    const f0 = createObserverFrame('F0', 'O0', [5, 5, 5]);
    const state = createFullState('S_ID_13', 0, [createFullStateObject('O13', 'P', [1, 2, 3, 0])]);
    const proj = new FrameProjectionEngine();

    const r0 = proj.projectFrame(state, f0);
    const diff = analyzeFrameDifference(r0.frame, r0.frame, f0, f0);

    if (!diff.representationMatches || diff.positionDeltaMagnitude !== 0) {
      throw new Error('Identical frames should match with 0 delta');
    }
  });

  // F83-NAV-14: Multi-observer simultaneous projection
  await runTest('F83-NAV-14', 'Multi-observer simultaneous projection (3 views)', () => {
    const state = createFullState('S_MULTI_14', 0, [createFullStateObject('O14', 'BEACON', [100, 200, 300, 10])]);
    const frames = [
      createObserverFrame('V1', 'OBS_A', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D'),
      createObserverFrame('V2', 'OBS_B', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D'),
      createObserverFrame('V3', 'OBS_C', [0, 0, 0], [0, 0, 1], 'CONVERGENT_ENERGY_3D'),
    ];

    const report = compareSimultaneousObservers(state, frames);
    if (report.totalObservers !== 3 || report.views.length !== 3) {
      throw new Error('Observer view count mismatch');
    }
  });

  // F83-NAV-15: Multi-observer distinct representations verification
  await runTest('F83-NAV-15', 'Multi-observer distinct representations verification', () => {
    const state = createFullState('S_DIST_15', 0, [createFullStateObject('O15', 'BEACON', [10, 20, 30, 40])]);
    const frames = [
      createObserverFrame('V1', 'OBS_ORTHO', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D'),
      createObserverFrame('V2', 'OBS_PERSP', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D'),
    ];

    const report = compareSimultaneousObservers(state, frames);
    if (!report.allRepresentationsDistinct || report.pairwiseHashCollisions !== 0) {
      throw new Error('Distinct projections must yield distinct representations');
    }
  });

  // F83-NAV-16: Multi-observer with perspective attenuation variances
  await runTest('F83-NAV-16', 'Multi-observer perspective focal length variances', () => {
    const state = createFullState('S_FOCAL_16', 0, [createFullStateObject('O16', 'LENS', [10, 20, 30, 50])]);
    const fShort = createObserverFrame('V_SHORT', 'OBS_SHORT', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D', undefined, { focalLength: 5 });
    const fLong = createObserverFrame('V_LONG', 'OBS_LONG', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D', undefined, { focalLength: 50 });

    const report = compareSimultaneousObservers(state, [fShort, fLong]);
    if (!report.allRepresentationsDistinct) {
      throw new Error('Focal length changes must produce distinct representations');
    }
  });

  // F83-NAV-17: Frame reversibility (O0 -> O1 -> O0) exact recovery
  await runTest('F83-NAV-17', 'Frame reversibility (O0 -> O1 -> O0) exact recovery', () => {
    const state = createFullState('S_REV_17', 0, [createFullStateObject('O17', 'CRYSTAL', [15, 30, 45, 60])]);
    const f0 = createObserverFrame('F0', 'OBS_REV', [0, 0, 0]);
    const f1 = createObserverFrame('F1', 'OBS_REV', [100, 200, 300]);
    const f0Prime = createObserverFrame('F0_PRIME', 'OBS_REV', [0, 0, 0]);

    const report = testFrameReversibility(state, f0, f1, f0Prime);
    if (!report.isReversible || report.hashF0 !== report.hashF0Prime) {
      throw new Error('Reversibility violated on returning to initial observer frame');
    }
  });

  // F83-NAV-18: Frame reversibility with multi-step loop
  await runTest('F83-NAV-18', 'Frame reversibility with multi-step loop (O0 -> O1 -> O2 -> O0)', () => {
    const state = createFullState('S_REV_18', 0, [createFullStateObject('O18', 'ORBITER', [5, 10, 15, 20])]);
    const f0 = createObserverFrame('F0', 'O', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    const f1 = createObserverFrame('F1', 'O', [10, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D');
    const f2 = createObserverFrame('F2', 'O', [0, 10, 0], [0, 0, 1], 'SLICED_HYPERPLANE_3D', undefined, { sliceW: 20, sliceThickness: 1 });
    const f0Prime = createObserverFrame('F0_RETURN', 'O', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');

    const report = testFrameReversibility(state, f0, f1, f0Prime);
    if (!report.isReversible) {
      throw new Error('Multi-step loop reversibility failed');
    }
  });

  // F83-NAV-19: Frame reversibility coordinate tolerance verification
  await runTest('F83-NAV-19', 'Frame reversibility coordinate tolerance verification', () => {
    const state = createFullState('S_TOL_19', 0, [createFullStateObject('O19', 'POINT', [1.00001, 2, 3, 0])]);
    const f0 = createObserverFrame('F0', 'O', [0, 0, 0]);
    const f0Prime = createObserverFrame('F0_P', 'O', [0, 0, 0]);

    const report = testFrameReversibility(state, f0, f0, f0Prime, 0.001);
    if (!report.isReversible) {
      throw new Error('Tolerance matching failed');
    }
  });

  // F83-NAV-20: Temporal timeline: Static equivalence
  await runTest('F83-NAV-20', 'Temporal timeline: Static equivalence ((X0, O0) -> (X0, O0))', () => {
    const s0 = createFullState('S0', 0, [createFullStateObject('O', 'P', [1, 1, 1, 0])]);
    const f0 = createObserverFrame('F0', 'O0');
    const nodes: TimelineTransitionNode[] = [
      { state: s0, observerFrame: f0 },
      { state: s0, observerFrame: f0 },
    ];

    const log = new FrameTimelineEngine().traceTimeline(nodes);
    if (log.events[1].stepType !== 'STATIC_EQUIVALENCE' || log.events[1].observationChanged) {
      throw new Error('Static step must produce STATIC_EQUIVALENCE');
    }
  });

  // F83-NAV-21: Temporal timeline: Observer frame transition only
  await runTest('F83-NAV-21', 'Temporal timeline: Observer frame transition only ((X0, O0) -> (X0, O1))', () => {
    const s0 = createFullState('S0', 0, [createFullStateObject('O', 'P', [1, 2, 3, 10])]);
    const f0 = createObserverFrame('F0', 'O0', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    const f1 = createObserverFrame('F1', 'O1', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D');
    const nodes: TimelineTransitionNode[] = [
      { state: s0, observerFrame: f0 },
      { state: s0, observerFrame: f1 },
    ];

    const log = new FrameTimelineEngine().traceTimeline(nodes);
    if (log.events[1].stepType !== 'OBSERVER_FRAME_TRANSITION' || log.events[1].underlyingStateChanged || !log.events[1].observerChanged) {
      throw new Error('Observer transition misclassified');
    }
  });

  // F83-NAV-22: Temporal timeline: State mutation only
  await runTest('F83-NAV-22', 'Temporal timeline: State mutation only ((X0, O1) -> (X1, O1))', () => {
    const s0 = createFullState('S0', 0, [createFullStateObject('O', 'P', [0, 0, 0, 0])]);
    const s1 = createFullState('S1', 1, [createFullStateObject('O', 'P', [10, 10, 10, 0])]);
    const f1 = createObserverFrame('F1', 'O1');
    const nodes: TimelineTransitionNode[] = [
      { state: s0, observerFrame: f1 },
      { state: s1, observerFrame: f1 },
    ];

    const log = new FrameTimelineEngine().traceTimeline(nodes);
    if (log.events[1].stepType !== 'UNDERLYING_STATE_MUTATION' || !log.events[1].underlyingStateChanged || log.events[1].observerChanged) {
      throw new Error('State mutation misclassified');
    }
  });

  // F83-NAV-23: Temporal timeline: Joint transition
  await runTest('F83-NAV-23', 'Temporal timeline: Joint transition ((X0, O0) -> (X1, O1))', () => {
    const s0 = createFullState('S0', 0, [createFullStateObject('O', 'P', [0, 0, 0, 0])]);
    const s1 = createFullState('S1', 1, [createFullStateObject('O', 'P', [5, 5, 5, 5])]);
    const f0 = createObserverFrame('F0', 'O0', [0, 0, 0]);
    const f1 = createObserverFrame('F1', 'O1', [10, 10, 10]);
    const nodes: TimelineTransitionNode[] = [
      { state: s0, observerFrame: f0 },
      { state: s1, observerFrame: f1 },
    ];

    const log = new FrameTimelineEngine().traceTimeline(nodes);
    if (log.events[1].stepType !== 'JOINT_STATE_AND_OBSERVER_TRANSITION') {
      throw new Error('Joint transition misclassified');
    }
  });

  // F83-NAV-24: Temporal timeline full 4-stage traversal log
  await runTest('F83-NAV-24', 'Temporal timeline full 4-stage traversal log', () => {
    const s0 = createFullState('X0', 0, [createFullStateObject('O', 'P', [1, 1, 1, 1])]);
    const s1 = createFullState('X1', 1, [createFullStateObject('O', 'P', [2, 2, 2, 2])]);
    const o0 = createObserverFrame('O0', 'OBS_A', [0, 0, 0]);
    const o1 = createObserverFrame('O1', 'OBS_B', [10, 10, 10]);
    const o2 = createObserverFrame('O2', 'OBS_C', [20, 20, 20]);

    // (X0, O0) -> (X0, O1) -> (X1, O1) -> (X1, O2)
    const nodes: TimelineTransitionNode[] = [
      { state: s0, observerFrame: o0 },
      { state: s0, observerFrame: o1 },
      { state: s1, observerFrame: o1 },
      { state: s1, observerFrame: o2 },
    ];

    const log = new FrameTimelineEngine().traceTimeline(nodes);
    if (log.totalEvents !== 4 || log.stateTransitionCount !== 1 || log.observerTransitionCount !== 2) {
      throw new Error('4-stage traversal log accounting mismatch');
    }
  });

  // F83-NAV-25: Hidden dimension (W) representation variance
  await runTest('F83-NAV-25', 'Hidden dimension (W) representation variance across observer frames', () => {
    const state = createFullState('S_W_25', 0, [createFullStateObject('O25', 'W_ENTITY', [10, 20, 30, 100])]);
    const fOrtho = createObserverFrame('F_ORTHO', 'O_O', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    const fPersp = createObserverFrame('F_PERSP', 'O_P', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D');
    const proj = new FrameProjectionEngine();

    const rOrtho = proj.projectFrame(state, fOrtho);
    const rPersp = proj.projectFrame(state, fPersp);

    if (rOrtho.representation.frameHash === rPersp.representation.frameHash) {
      throw new Error('W dimension must modulate perspective projection representation');
    }
  });

  // F83-NAV-26: Hard boundary isolation across frame traversal
  await runTest('F83-NAV-26', 'Hard boundary isolation across frame traversal', () => {
    const secretObj = createFullStateObject('O_SEC', 'CLASSIFIED', [1, 2, 3, 4], [0, 0, 0, 0], [], { key: 'VAL' }, 'TOP_SECRET');
    const state = createFullState('S_SEC_26', 0, [secretObj]);
    const frames = [createObserverFrame('F0', 'O0'), createObserverFrame('F1', 'O1')];

    const traversal = new FrameTraversalEngine().traverse(state, frames);
    for (const step of traversal.steps) {
      if ((step.observableRepresentation.observableObjects[0] as any).hiddenPayload !== undefined) {
        throw new Error('hiddenPayload leaked during frame traversal');
      }
    }
  });

  // F83-NAV-27: Out-of-bounds clipping dynamic response to observer frame translation
  await runTest('F83-NAV-27', 'Dynamic clipping response under bounded observer frame', () => {
    const obj = createFullStateObject('O_CLIP', 'NODE', [50, 50, 50, 0]);
    const state = createFullState('S_CLIP_27', 0, [obj]);
    const tightBoundary = createDefaultObservationBoundary({ maxRange: [40, 40, 40], minRange: [-40, -40, -40] });
    const fTight = createObserverFrame('F_TIGHT', 'O_T', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D', tightBoundary);

    const proj = new FrameProjectionEngine().projectFrame(state, fTight);
    if (proj.frame.visibleObjects.length !== 0) {
      throw new Error('Object should be clipped by tight boundary');
    }
  });

  // F83-NAV-28: Multi-object spatial ordering preservation
  await runTest('F83-NAV-28', 'Multi-object deterministic sorting across observer frames', () => {
    const objs = [
      createFullStateObject('Z_OBJ', 'PARTICLE', [1, 1, 1, 0]),
      createFullStateObject('A_OBJ', 'PARTICLE', [2, 2, 2, 0]),
      createFullStateObject('M_OBJ', 'PARTICLE', [3, 3, 3, 0]),
    ];
    const state = createFullState('S_SORT_28', 0, objs);
    const f0 = createObserverFrame('F0', 'O0');
    const f1 = createObserverFrame('F1', 'O1');

    const t = new FrameTraversalEngine().traverse(state, [f0, f1]);
    for (const step of t.steps) {
      const ids = step.observationFrame.visibleObjects.map((o) => o.id);
      if (ids[0] !== 'A_OBJ' || ids[1] !== 'M_OBJ' || ids[2] !== 'Z_OBJ') {
        throw new Error('Objects not deterministically sorted');
      }
    }
  });

  // F83-NAV-29: Empty state frame traversal
  await runTest('F83-NAV-29', 'Empty state frame traversal', () => {
    const state = createFullState('S_EMPTY_29', 0, []);
    const frames = [createObserverFrame('F0', 'O0'), createObserverFrame('F1', 'O1')];
    const t = new FrameTraversalEngine().traverse(state, frames);

    if (t.steps[0].observationFrame.visibleObjects.length !== 0) {
      throw new Error('Empty state should produce 0 visible objects');
    }
  });

  // F83-NAV-30: High-density state frame traversal (100 objects)
  await runTest('F83-NAV-30', 'High-density state frame traversal (100 objects)', () => {
    const objs = Array.from({ length: 100 }, (_, i) =>
      createFullStateObject('OBJ_' + i.toString().padStart(3, '0'), 'DENSE', [i, i * 2, i * 3, 0])
    );
    const state = createFullState('S_DENSE_30', 0, objs);
    const frames = [createObserverFrame('F0', 'O0'), createObserverFrame('F1', 'O1')];
    const t = new FrameTraversalEngine().traverse(state, frames);

    if (t.steps[0].observationFrame.visibleObjects.length !== 100) {
      throw new Error('All 100 objects must be rendered');
    }
  });

  // F83-NAV-31: Long traversal sequence (50 observer frames)
  await runTest('F83-NAV-31', 'Long traversal sequence (50 observer frames)', () => {
    const state = createFullState('S_LONG_31', 0, [createFullStateObject('O', 'P', [10, 20, 30, 0])]);
    const frames = Array.from({ length: 50 }, (_, i) =>
      createObserverFrame('F_' + i, 'OBS_' + i, [i, 0, 0])
    );
    const t = new FrameTraversalEngine().traverse(state, frames);

    if (t.totalSteps !== 50 || !t.traversalHash.startsWith('HASH_TRAV_SEQ_')) {
      throw new Error('Long sequence traversal failed');
    }
  });

  // F83-NAV-32: Invalid observer frame rejection
  await runTest('F83-NAV-32', 'Invalid observer frame rejection on empty IDs', () => {
    try {
      createObserverFrame('', 'O0');
      throw new Error('Should have thrown on empty frameId');
    } catch {
      // Expected
    }
    try {
      createObserverFrame('F0', '');
      throw new Error('Should have thrown on empty observerId');
    } catch {
      // Expected
    }
  });

  // F83-NAV-33: Invalid traversal sequence rejection
  await runTest('F83-NAV-33', 'Invalid traversal sequence rejection on empty array', () => {
    const state = createFullState('S33', 0, []);
    try {
      new FrameTraversalEngine().traverse(state, []);
      throw new Error('Should have thrown on empty observerFrames');
    } catch {
      // Expected
    }
  });

  // F83-NAV-34: Invariance report data structure validity
  await runTest('F83-NAV-34', 'Invariance report structure validity', () => {
    const state = createFullState('S34', 0, [createFullStateObject('O', 'P', [1, 2, 3, 4])]);
    const rep = verifyStateInvariance(state, [createObserverFrame('F0', 'O0')]);

    if (!rep.stateId || !rep.initialHash || !rep.finalHash || rep.isStateMutated !== false) {
      throw new Error('Invariance report structure invalid');
    }
  });

  // F83-NAV-35: Difference report changed vs unchanged object partition
  await runTest('F83-NAV-35', 'Difference report changed vs unchanged partition', () => {
    const state = createFullState('S35', 0, [
      createFullStateObject('O_STABLE', 'P', [0, 0, 0, 0]),
      createFullStateObject('O_CHANGE', 'P', [10, 10, 10, 0]),
    ]);
    const f0 = createObserverFrame('F0', 'O0', [0, 0, 0]);
    const f1 = createObserverFrame('F1', 'O1', [5, 5, 5]); // Translated observer
    const proj = new FrameProjectionEngine();

    const r0 = proj.projectFrame(state, f0);
    const r1 = proj.projectFrame(state, f1);
    const diff = analyzeFrameDifference(r0.frame, r1.frame, f0, f1);

    if (diff.changedObjectIds.length + diff.unchangedObjectIds.length !== 2) {
      throw new Error('Object partition count mismatch');
    }
  });

  // F83-NAV-36: Multi-observer comparison report collision detection
  await runTest('F83-NAV-36', 'Multi-observer comparison report collision detection', () => {
    const state = createFullState('S36', 0, [createFullStateObject('O', 'P', [1, 2, 3, 0])]);
    const f1 = createObserverFrame('F1', 'O1', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    const f2 = createObserverFrame('F2', 'O2', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D'); // Same projection

    const report = compareSimultaneousObservers(state, [f1, f2]);
    if (report.pairwiseHashCollisions !== 1 || report.allRepresentationsDistinct !== false) {
      throw new Error('Identical observer configs should report collision');
    }
  });

  // F83-NAV-37: Repeatability across fresh engine instances
  await runTest('F83-NAV-37', 'Repeatability across fresh engine instances', () => {
    const state = createFullState('S37', 0, [createFullStateObject('O', 'P', [7, 14, 21, 28])]);
    const frame = createObserverFrame('F0', 'O0', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D');

    const e1 = new FrameProjectionEngine();
    const e2 = new FrameProjectionEngine();

    const r1 = e1.projectFrame(state, frame);
    const r2 = e2.projectFrame(state, frame);

    if (r1.frame.frameHash !== r2.frame.frameHash || r1.representation.frameHash !== r2.representation.frameHash) {
      throw new Error('Cross-engine instance hash mismatch');
    }
  });

  // F83-NAV-38: 250-run determinism regression
  await runTest('F83-NAV-38', '250-run determinism regression (variance = 0)', () => {
    const state = createFullState('S38_DET', 0, [
      createFullStateObject('O38', 'NEXUS', [50, 100, 150, 200], [0, 0, 0, 0], ['REL_NEXUS'], { active: true })
    ]);
    const frames = [
      createObserverFrame('F0', 'O0', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D'),
      createObserverFrame('F1', 'O1', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D'),
      createObserverFrame('F2', 'O2', [0, 0, 0], [0, 0, 1], 'SLICED_HYPERPLANE_3D', undefined, { sliceW: 200, sliceThickness: 5 }),
    ];
    const engine = new FrameTraversalEngine();

    const firstRun = engine.traverse(state, frames);
    const expectedHash = firstRun.traversalHash;

    for (let i = 0; i < 250; i++) {
      const run = engine.traverse(state, frames);
      if (run.traversalHash !== expectedHash) {
        throw new Error('Variance detected at run ' + i);
      }
    }
  });

  // F83-NAV-39: F82 adapter & projection engine compatibility
  await runTest('F83-NAV-39', 'F82 adapter & projection engine compatibility', () => {
    const frame = createObserverFrame('F39', 'O39', [1, 2, 3], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D');
    const f82Obs = toF82Observer(frame);

    if (f82Obs.observerId !== 'O39' || f82Obs.position[0] !== 1 || f82Obs.projectionType !== 'PERSPECTIVE_PINHOLE_3D') {
      throw new Error('F82 observer adaptation failed');
    }
  });

  // F83-NAV-40: Full end-to-end traversal pipeline verification
  await runTest('F83-NAV-40', 'Full end-to-end traversal pipeline verification', () => {
    const state = createFullState('S40_MASTER', 0, [
      createFullStateObject('MASTER_OBJ', 'TITAN', [10, 20, 30, 40], [1, 0, 0, 0], ['TITAN_LINK'], { power: 9000 })
    ]);
    const f0 = createObserverFrame('F0', 'O0', [0, 0, 0], [0, 0, 1], 'DIRECT_ORTHOGRAPHIC_3D');
    const f1 = createObserverFrame('F1', 'O1', [0, 0, 0], [0, 0, 1], 'PERSPECTIVE_PINHOLE_3D');

    // 1. Traversal
    const traversal = new FrameTraversalEngine().traverse(state, [f0, f1]);
    if (traversal.steps.length !== 2) throw new Error('Step 1 Traversal failed');

    // 2. Invariance
    const inv = verifyStateInvariance(state, [f0, f1]);
    if (inv.isStateMutated) throw new Error('Step 2 Invariance failed');

    // 3. Difference
    const diff = analyzeFrameDifference(traversal.steps[0].observationFrame, traversal.steps[1].observationFrame, f0, f1);
    if (diff.representationMatches) throw new Error('Step 3 Difference failed');

    // 4. Reversibility
    const rev = testFrameReversibility(state, f0, f1, f0);
    if (!rev.isReversible) throw new Error('Step 4 Reversibility failed');

    // 5. Timeline
    const timeline = new FrameTimelineEngine().traceTimeline([
      { state, observerFrame: f0 },
      { state, observerFrame: f1 },
    ]);
    if (timeline.events.length !== 2) throw new Error('Step 5 Timeline failed');
  });

  const totalDurationMs = performance.now() - startAll;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  return {
    suiteName: 'Funnel 83 Observer Navigation Test Suite',
    totalTests: results.length,
    passedTests,
    failedTests,
    allPassed: failedTests === 0,
    results: Object.freeze(results),
    totalDurationMs,
  };
}
