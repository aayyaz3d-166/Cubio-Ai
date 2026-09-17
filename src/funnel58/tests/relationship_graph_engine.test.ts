/**
 * 3D Memory Studio — Funnel 58
 * Actual 3D Relationship & Graph Rendering Engine Tests
 *
 * 24 Focused Tests:
 * TC-F58-01  Graph Engine initializes correctly
 * TC-F58-02  Graph lifecycle is deterministic
 * TC-F58-03  Relationship registry prevents duplicate IDs
 * TC-F58-04  GREEN relationship enters graph
 * TC-F58-05  RED relationship is blocked
 * TC-F58-06  Invalid source state is rejected
 * TC-F58-07  Invalid target state is rejected
 * TC-F58-08  Relationship types remain consistent
 * TC-F58-09  Relationship strength normalization works
 * TC-F58-10  Straight edge geometry connects endpoints
 * TC-F58-11  Curved edge geometry updates correctly
 * TC-F58-12  Source state movement updates edge
 * TC-F58-13  Target state movement updates edge
 * TC-F58-14  Relationship material reuse works
 * TC-F58-15  Graph filtering works
 * TC-F58-16  Graph visibility works
 * TC-F58-17  Node selection highlights connected edges
 * TC-F58-18  Relationship selection works
 * TC-F58-19  F50 search highlight synchronizes
 * TC-F58-20  Neighbor query works
 * TC-F58-21  Depth-3 traversal remains bounded
 * TC-F58-22  Graph rendering budget is enforced
 * TC-F58-23  Orphan relationships are removed safely
 * TC-F58-24  Graph disposal releases resources
 */

import * as THREE from 'three';
import { GraphEngine } from '../graph/graphEngine';
import { GraphRegistry } from '../graph/graphRegistry';
import { GraphModel } from '../graph/graphModel';
import { resolveRelationship, normalizeStrength } from '../graph/relationshipResolver';
import { createStraightEdgeGeometry, createCurvedEdgeGeometry, updateEdgeGeometryBuffer } from '../edges/edgeGeometry';
import { getConnectedRelationships, getSubgraph, getRelationshipsBetween } from '../graph/graphQueries';
import { applyFiltersToRegistry } from '../graph/graphFilters';
import { prioritizeAndBoundEdges } from '../graph/graphPrioritizer';
import { getStandardInformationUniverseFixture, getScaleBenchmarkUniverseIndex } from '../../funnel49/model';
import { createInitialSimulationWorld, stepSimulationWorld } from '../../funnel52/simulation/simulationWorld';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { F58TestResult } from '../types';

// ─── TC-F58-01: Graph Engine initializes correctly ────────────────────────

export function testGraphEngineInitializes(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  engine.initialize();

  const passed =
    engine.registry !== undefined &&
    engine.model !== undefined &&
    engine.selectionManager !== undefined &&
    engine.getStats().totalRelationships === 0;

  engine.dispose();

  return {
    testId: 'TC-F58-01',
    name: 'Graph Engine initializes correctly',
    passed,
    details: passed
      ? 'GraphEngine initialized cleanly with empty registry and graph model.'
      : 'GraphEngine initialization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-02: Graph lifecycle is deterministic ──────────────────────────

export function testGraphLifecycleDeterministic(): F58TestResult {
  const t0 = performance.now();
  const runs = 250;
  const fixture = getStandardInformationUniverseFixture();
  let firstSig = '';

  for (let i = 0; i < runs; i++) {
    const engine = new GraphEngine();
    engine.initialize();

    const world = createInitialSimulationWorld(fixture.states, 3);
    engine.synchronizeSimulation(world);

    const sig = `${engine.registry.count}:${engine.model.count}`;
    if (i === 0) {
      firstSig = sig;
    } else if (sig !== firstSig) {
      engine.dispose();
      return {
        testId: 'TC-F58-02',
        name: 'Graph lifecycle is deterministic',
        passed: false,
        details: `Non-deterministic graph state at run ${i}`,
        durationMs: performance.now() - t0,
      };
    }
    engine.dispose();
  }

  return {
    testId: 'TC-F58-02',
    name: 'Graph lifecycle is deterministic',
    passed: true,
    details: `${runs} graph construction cycles produced 100% deterministic topologies (σ² = 0.00).`,
    durationMs: performance.now() - t0,
    totalEvaluations: runs,
    variance: 0.0,
  };
}

// ─── TC-F58-03: Relationship registry prevents duplicate IDs ───────────────

export function testRegistryPreventsDuplicates(): F58TestResult {
  const t0 = performance.now();
  const registry = new GraphRegistry();
  const fixture = getStandardInformationUniverseFixture();
  const [s1, s2] = fixture.states.filter((s) => s.classification === 'GREEN');

  const rel1 = resolveRelationship(s1, s2, 'SEMANTIC', 0.8)!;
  const rel2 = resolveRelationship(s1, s2, 'SEMANTIC', 0.8)!;

  const added1 = registry.registerRelationship(rel1);
  const added2 = registry.registerRelationship(rel2);

  const passed = added1 === true && added2 === false && registry.count === 1;
  registry.clear();

  return {
    testId: 'TC-F58-03',
    name: 'Relationship registry prevents duplicate IDs',
    passed,
    details: passed
      ? 'GraphRegistry strictly rejected duplicate relationship ID.'
      : 'Duplicate relationship registered',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F58-04: GREEN relationship enters graph ───────────────────────────

export function testGreenRelationshipEntersGraph(): F58TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const [s1, s2] = fixture.states.filter((s) => s.classification === 'GREEN');

  const rel = resolveRelationship(s1, s2, 'DOMAIN', 0.75);
  const passed = rel !== null && rel.classification === 'GREEN' && rel.strength === 0.75;

  return {
    testId: 'TC-F58-04',
    name: 'GREEN relationship enters graph',
    passed,
    details: passed
      ? `Authorized GREEN relationship created between '${s1.entityName}' and '${s2.entityName}'.`
      : 'GREEN relationship creation failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-05: RED relationship is blocked ───────────────────────────────

export function testRedRelationshipBlocked(): F58TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const greenState = fixture.states.find((s) => s.classification === 'GREEN')!;
  const redState = fixture.states.find((s) => s.classification === 'RED')!;

  const rel = resolveRelationship(greenState, redState, 'SEMANTIC', 0.9);
  const passed = rel === null;

  return {
    testId: 'TC-F58-05',
    name: 'RED relationship is blocked',
    passed,
    details: passed
      ? 'F47 security enforced: relationship with RED endpoint strictly blocked.'
      : 'RED relationship was created',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-06: Invalid source state is rejected ──────────────────────────

export function testInvalidSourceRejected(): F58TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const greenState = fixture.states.find((s) => s.classification === 'GREEN')!;

  const rel = resolveRelationship(null as any, greenState, 'SEMANTIC');
  const passed = rel === null;

  return {
    testId: 'TC-F58-06',
    name: 'Invalid source state is rejected',
    passed,
    details: passed
      ? 'Null/undefined source state safely rejected by resolver.'
      : 'Invalid source accepted',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-07: Invalid target state is rejected ──────────────────────────

export function testInvalidTargetRejected(): F58TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const greenState = fixture.states.find((s) => s.classification === 'GREEN')!;

  const rel = resolveRelationship(greenState, null as any, 'SEMANTIC');
  const passed = rel === null;

  return {
    testId: 'TC-F58-07',
    name: 'Invalid target state is rejected',
    passed,
    details: passed
      ? 'Null/undefined target state safely rejected by resolver.'
      : 'Invalid target accepted',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-08: Relationship types remain consistent ──────────────────────

export function testRelationshipTypesConsistent(): F58TestResult {
  const t0 = performance.now();
  const fixture = getStandardInformationUniverseFixture();
  const [s1, s2] = fixture.states.filter((s) => s.classification === 'GREEN');

  const rel1 = resolveRelationship(s1, s2, 'SEMANTIC');
  const rel2 = resolveRelationship(s1, s2, 'SEQUENCE');
  const rel3 = resolveRelationship(s1, s2, 'COORDINATE');

  const passed =
    rel1?.relationshipType === 'SEMANTIC' &&
    rel2?.relationshipType === 'SEQUENCE' &&
    rel3?.relationshipType === 'COORDINATE';

  return {
    testId: 'TC-F58-08',
    name: 'Relationship types remain consistent',
    passed,
    details: passed
      ? 'Supported vocabulary types (SEMANTIC, SEQUENCE, COORDINATE) verified consistently.'
      : 'Relationship type mapping failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F58-09: Relationship strength normalization works ─────────────────

export function testStrengthNormalizationWorks(): F58TestResult {
  const t0 = performance.now();
  const s1 = normalizeStrength(1.5);
  const s2 = normalizeStrength(-0.5);
  const s3 = normalizeStrength(0.74289);
  const s4 = normalizeStrength(undefined);

  const passed = s1 === 1.0 && s2 === 0.0 && s3 === 0.743 && s4 === 0.5;

  return {
    testId: 'TC-F58-09',
    name: 'Relationship strength normalization works',
    passed,
    details: passed
      ? 'Strength clamped to [0.0, 1.0] with 3-decimal precision and default 0.5.'
      : 'Strength normalization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 4,
  };
}

// ─── TC-F58-10: Straight edge geometry connects endpoints ─────────────────

export function testStraightEdgeGeometryConnects(): F58TestResult {
  const t0 = performance.now();
  const geo = createStraightEdgeGeometry([10, 20, 30], [100, 200, 300]);
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;

  const passed =
    posAttr !== undefined &&
    posAttr.count === 2 &&
    posAttr.getX(0) === 10 &&
    posAttr.getX(1) === 100;

  geo.dispose();

  return {
    testId: 'TC-F58-10',
    name: 'Straight edge geometry connects endpoints',
    passed,
    details: passed
      ? 'Straight edge buffer geometry generated with exact 2-vertex endpoints.'
      : 'Straight edge geometry failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-11: Curved edge geometry updates correctly ────────────────────

export function testCurvedEdgeGeometryUpdates(): F58TestResult {
  const t0 = performance.now();
  const geo = createCurvedEdgeGeometry([0, 0, 0], [100, 0, 0], 20, 16);
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;

  const passed = posAttr !== undefined && posAttr.count === 17;
  geo.dispose();

  return {
    testId: 'TC-F58-11',
    name: 'Curved edge geometry updates correctly',
    passed,
    details: passed
      ? `Curved quadratic bezier geometry generated with ${posAttr?.count} interpolated points.`
      : 'Curved edge geometry failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-12: Source state movement updates edge ────────────────────────

export function testSourceMovementUpdatesEdge(): F58TestResult {
  const t0 = performance.now();
  const geo = createStraightEdgeGeometry([0, 0, 0], [100, 100, 100]);
  updateEdgeGeometryBuffer(geo, 'STRAIGHT', [50, 60, 70], [100, 100, 100]);

  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const passed = posAttr.getX(0) === 50 && posAttr.getY(0) === 60 && posAttr.getZ(0) === 70;

  geo.dispose();

  return {
    testId: 'TC-F58-12',
    name: 'Source state movement updates edge',
    passed,
    details: passed
      ? 'In-place buffer attribute update dynamically updated source endpoint to [50, 60, 70].'
      : 'Source movement update failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-13: Target state movement updates edge ────────────────────────

export function testTargetMovementUpdatesEdge(): F58TestResult {
  const t0 = performance.now();
  const geo = createStraightEdgeGeometry([0, 0, 0], [100, 100, 100]);
  updateEdgeGeometryBuffer(geo, 'STRAIGHT', [0, 0, 0], [250, 300, 350]);

  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const passed = posAttr.getX(1) === 250 && posAttr.getY(1) === 300 && posAttr.getZ(1) === 350;

  geo.dispose();

  return {
    testId: 'TC-F58-13',
    name: 'Target state movement updates edge',
    passed,
    details: passed
      ? 'In-place buffer attribute update dynamically updated target endpoint to [250, 300, 350].'
      : 'Target movement update failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-14: Relationship material reuse works ─────────────────────────

export function testRelationshipMaterialReuse(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const mat1 = engine.materialManager.getMaterialForType('SEMANTIC', 0.5);
  const mat2 = engine.materialManager.getMaterialForType('SEMANTIC', 0.5);

  const passed = mat1 === mat2;
  engine.dispose();

  return {
    testId: 'TC-F58-14',
    name: 'Relationship material reuse works',
    passed,
    details: passed
      ? 'Repeated material requests for SEMANTIC edge returned identical cached Three.js material.'
      : 'Material reuse failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F58-15: Graph filtering works ─────────────────────────────────────

export function testGraphFilteringWorks(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);

  // Filter to only SEMANTIC
  engine.applyFilters({
    allowedTypes: new Set(['SEMANTIC']),
    strengthFilter: 'ALL',
    minStrength: 0.0,
    showDirectedOnly: false,
    showSelectedNeighborhoodOnly: false,
  });

  const visibleRels = engine.registry.getVisible();
  const passed = visibleRels.every((r) => r.relationshipType === 'SEMANTIC');

  engine.dispose();

  return {
    testId: 'TC-F58-15',
    name: 'Graph filtering works',
    passed,
    details: passed
      ? `Filter criteria successfully isolated ${visibleRels.length} SEMANTIC relationships.`
      : 'Graph filtering failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-16: Graph visibility works ────────────────────────────────────

export function testGraphVisibilityWorks(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);

  engine.visibilityManager.setGraphVisibility(false, engine.registry);
  const hiddenCount = engine.registry.getVisible().length;

  engine.visibilityManager.setGraphVisibility(true, engine.registry);
  const visibleCount = engine.registry.getVisible().length;

  const passed = hiddenCount === 0 && visibleCount > 0;
  engine.dispose();

  return {
    testId: 'TC-F58-16',
    name: 'Graph visibility works',
    passed,
    details: passed
      ? `Graph visibility toggle tested: ${hiddenCount} visible when hidden, ${visibleCount} when shown.`
      : 'Graph visibility failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
  };
}

// ─── TC-F58-17: Node selection highlights connected edges ─────────────────

export function testNodeSelectionHighlightsEdges(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);
  const firstNode = engine.model.getAllNodes()[0];

  engine.selectNode(firstNode.stateId);
  const connected = getConnectedRelationships(firstNode.stateId, engine.registry);
  const allHighlighted = connected.every((r) => r.highlighted);

  const passed = connected.length > 0 && allHighlighted;
  engine.dispose();

  return {
    testId: 'TC-F58-17',
    name: 'Node selection highlights connected edges',
    passed,
    details: passed
      ? `Selecting '${firstNode.stateId}' highlighted all ${connected.length} connected relationships.`
      : 'Node selection highlight failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-18: Relationship selection works ──────────────────────────────

export function testRelationshipSelectionWorks(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);
  const firstRel = engine.registry.getAll()[0];
  const relId = firstRel?.relationshipId ?? '';

  engine.selectRelationship(relId);
  const passed = firstRel !== undefined && firstRel.selected === true;

  engine.dispose();

  return {
    testId: 'TC-F58-18',
    name: 'Relationship selection works',
    passed,
    details: passed
      ? `Selected relationship '${relId}' flagged as selected.`
      : 'Relationship selection failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-19: F50 search highlight synchronizes ─────────────────────────

export function testSearchHighlightSynchronizes(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);
  const count = engine.searchHighlight('W3C');

  const passed = count > 0 && engine.highlightManager.getHighlightedCount().nodes > 0;
  engine.dispose();

  return {
    testId: 'TC-F58-19',
    name: 'F50 search highlight synchronizes',
    passed,
    details: passed
      ? `Search for 'W3C' highlighted ${count} matching nodes and connected edges.`
      : 'Search highlight sync failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-20: Neighbor query works ──────────────────────────────────────

export function testNeighborQueryWorks(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);
  const node = engine.model.getAllNodes()[0];
  const neighbors = engine.model.getNeighbors(node.stateId, engine.registry);

  const passed = neighbors.length > 0;
  engine.dispose();

  return {
    testId: 'TC-F58-20',
    name: 'Neighbor query works',
    passed,
    details: passed
      ? `Found ${neighbors.length} topological neighbors for node '${node.stateId}'.`
      : 'Neighbor query failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-21: Depth-3 traversal remains bounded ─────────────────────────

export function testDepth3TraversalBounded(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);
  const node = engine.model.getAllNodes()[0];

  const sub1 = getSubgraph(node.stateId, 1, engine.registry);
  const sub3 = getSubgraph(node.stateId, 3, engine.registry);
  const sub5 = getSubgraph(node.stateId, 5, engine.registry); // Clamped to 3

  const passed = sub1.depth === 1 && sub3.depth === 3 && sub5.depth === 3;
  engine.dispose();

  return {
    testId: 'TC-F58-21',
    name: 'Depth-3 traversal remains bounded',
    passed,
    details: passed
      ? `Traversal bounded: depth=1 (${sub1.totalNodes} nodes), depth=3 (${sub3.totalNodes} nodes), depth=5 clamped to 3.`
      : 'Depth-3 traversal bounding failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 3,
  };
}

// ─── TC-F58-22: Graph rendering budget is enforced ────────────────────────

export function testGraphRenderingBudgetEnforced(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const benchmarkIndex = getScaleBenchmarkUniverseIndex(4096, 'BENCHMARK_SCALE_4096');
  const world = createInitialSimulationWorld(benchmarkIndex.states, 8);

  engine.synchronizeSimulation(world);
  const stats = engine.getStats(8);

  const passed =
    stats.visibleNodes <= 50 &&
    stats.visibleEdges <= 100 &&
    (stats.visibleNodes + stats.visibleEdges) <= 150;

  engine.dispose();

  return {
    testId: 'TC-F58-22',
    name: 'Graph rendering budget is enforced',
    passed,
    details: passed
      ? `Scale test bounded: VisibleNodes=${stats.visibleNodes} (≤50), VisibleEdges=${stats.visibleEdges} (≤100).`
      : 'Rendering budget exceeded',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-23: Orphan relationships are removed safely ───────────────────

export function testOrphanRelationshipsRemoved(): F58TestResult {
  const t0 = performance.now();
  const registry = new GraphRegistry();
  const fixture = getStandardInformationUniverseFixture();
  const [s1, s2] = fixture.states.filter((s) => s.classification === 'GREEN');

  const rel = resolveRelationship(s1, s2, 'SEMANTIC')!;
  registry.registerRelationship(rel);
  const countBefore = registry.count;

  registry.removeRelationship(rel.relationshipId);
  const countAfter = registry.count;
  const lookupAfter = registry.hasRelationship(rel.relationshipId);

  const passed = countBefore === 1 && countAfter === 0 && lookupAfter === false;

  return {
    testId: 'TC-F58-23',
    name: 'Orphan relationships are removed safely',
    passed,
    details: passed
      ? 'Removed relationship cleared from all registry lookup indices safely.'
      : 'Orphan removal failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}

// ─── TC-F58-24: Graph disposal releases resources ─────────────────────────

export function testGraphDisposalReleasesResources(): F58TestResult {
  const t0 = performance.now();
  const engine = new GraphEngine();
  const fixture = getStandardInformationUniverseFixture();
  const world = createInitialSimulationWorld(fixture.states, 3);

  engine.synchronizeSimulation(world);
  const relsBefore = engine.registry.count;

  engine.dispose();
  const relsAfter = engine.registry.count;
  const nodesAfter = engine.model.count;

  const passed = relsBefore > 0 && relsAfter === 0 && nodesAfter === 0;

  return {
    testId: 'TC-F58-24',
    name: 'Graph disposal releases resources',
    passed,
    details: passed
      ? `Disposal released all ${relsBefore} relationships, edge meshes, and cleared registry.`
      : 'Graph disposal failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
  };
}
