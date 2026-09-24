/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/dependencyGraph.ts
 *
 * Targeted dependency graph generator and cycle detector.
 * Leverages ProjectNavigator catalogs and canonical subsystem topology
 * without performing expensive full-project disk scans.
 */

import { DRADependencyNode, DRADependencyGraph, DRANodeStatus } from './types';
import { ProjectNavigator, SubsystemDefinition } from '../../language/native/pma/projectNavigator';

export class DRADependencyGraphBuilder {
  private readonly projectNavigator: ProjectNavigator;
  private readonly staticDependencyMap: ReadonlyMap<string, readonly string[]>;

  constructor(customNavigator?: ProjectNavigator) {
    this.projectNavigator = customNavigator || new ProjectNavigator();
    this.staticDependencyMap = this.initializeStaticDependencies();
  }

  private initializeStaticDependencies(): Map<string, readonly string[]> {
    const map = new Map<string, readonly string[]>();

    map.set('SPATIAL_369', []);
    map.set('DATABASE_VDB', ['SPATIAL_369']);
    map.set('NATIVE_VISION', ['SPATIAL_369']);
    map.set('NATIVE_AUDIO', []);
    map.set('MULTIMODAL_FUSION', ['NATIVE_VISION', 'NATIVE_AUDIO', 'SPATIAL_369']);
    map.set('CROSS_MODAL_GRAPH', ['MULTIMODAL_FUSION']);
    map.set('MEMORY_CONSOLIDATION', ['MULTIMODAL_FUSION', 'DATABASE_VDB']);
    map.set('HYPOTHESIS_REASONING', ['CROSS_MODAL_GRAPH']);
    map.set('GENERALIZATION', ['MEMORY_CONSOLIDATION']);
    map.set('RUNTIME_OPTIMIZER', ['GENERALIZATION', 'SPATIAL_369']);
    map.set('SAFETY_BOUNDARY', []);
    map.set('GOLDEN_PATH', ['MULTIMODAL_FUSION', 'RUNTIME_OPTIMIZER', 'SAFETY_BOUNDARY']);
    map.set('ONE_LANGUAGE_NATIVE', ['HYPOTHESIS_REASONING', 'SAFETY_BOUNDARY']);
    map.set('PROJECT_MANAGER_AGENT', ['ONE_LANGUAGE_NATIVE', 'SAFETY_BOUNDARY']);

    return map;
  }

  /**
   * Constructs a targeted dependency graph for a set of target subsystems.
   */
  public buildGraph(
    targetSubsystems: readonly string[] = [],
    syntheticEdges?: readonly { from: string; to: string }[]
  ): DRADependencyGraph {
    const allDefs = this.getAllSubsystemDefinitions();
    const defMap = new Map<string, SubsystemDefinition>(allDefs.map((d) => [d.id, d]));

    // Determine nodes to include: targets + direct upstream + direct downstream
    const includedNodeIds = new Set<string>();
    if (targetSubsystems.length === 0) {
      allDefs.forEach((d) => includedNodeIds.add(d.id));
    } else {
      for (const t of targetSubsystems) {
        includedNodeIds.add(t);
        // Add upstream
        const up = this.staticDependencyMap.get(t) || [];
        up.forEach((u) => includedNodeIds.add(u));
        // Add downstream
        for (const [sub, deps] of this.staticDependencyMap.entries()) {
          if (deps.includes(t)) {
            includedNodeIds.add(sub);
          }
        }
      }
    }

    // Build downstream reverse map
    const downstreamMap = new Map<string, string[]>();
    for (const [sub, deps] of this.staticDependencyMap.entries()) {
      for (const dep of deps) {
        if (!downstreamMap.has(dep)) downstreamMap.set(dep, []);
        downstreamMap.get(dep)!.push(sub);
      }
    }

    // Include synthetic edges if any (e.g. for testing circular dependencies)
    if (syntheticEdges) {
      for (const e of syntheticEdges) {
        includedNodeIds.add(e.from);
        includedNodeIds.add(e.to);
      }
    }

    const nodes: DRADependencyNode[] = [];
    const edges: { from: string; to: string; type: 'IMPORTS' | 'DEPENDS_ON' }[] = [];

    for (const id of Array.from(includedNodeIds).sort()) {
      const def = defMap.get(id);
      const upstream = (this.staticDependencyMap.get(id) || []).filter((u) => includedNodeIds.has(u));
      const downstream = (downstreamMap.get(id) || []).filter((d) => includedNodeIds.has(d));

      const status: DRANodeStatus = def?.isFrozen
        ? 'FROZEN_AUTHORITY'
        : def
        ? 'CERTIFIED'
        : 'ACTIVE';

      nodes.push(
        Object.freeze({
          id,
          name: def?.name || id,
          primaryDir: def?.primaryDir || `src/cubio/${id.toLowerCase()}`,
          keyFiles: def?.keyFiles || [],
          tests: def?.tests || [],
          reports: def?.reports || [],
          status,
          isFrozen: def?.isFrozen || false,
          upstreamDependencies: Object.freeze([...upstream]),
          downstreamDependents: Object.freeze([...downstream]),
        })
      );

      for (const u of upstream) {
        edges.push({ from: id, to: u, type: 'DEPENDS_ON' });
      }
    }

    if (syntheticEdges) {
      for (const e of syntheticEdges) {
        edges.push({ from: e.from, to: e.to, type: 'DEPENDS_ON' });
      }
    }

    // Cycle detection & Topological sort
    const { hasCycles, cyclePaths, topologicalOrder } = this.analyzeTopology(
      nodes.map((n) => n.id),
      edges
    );

    return Object.freeze({
      nodes: Object.freeze(nodes),
      edges: Object.freeze(edges),
      hasCycles,
      cyclePaths: Object.freeze(cyclePaths),
      topologicalOrder: Object.freeze(topologicalOrder),
    });
  }

  private getAllSubsystemDefinitions(): SubsystemDefinition[] {
    const navAny = this.projectNavigator as any;
    const list: SubsystemDefinition[] = [];
    if (navAny.subsystems && typeof navAny.subsystems.values === 'function') {
      for (const def of navAny.subsystems.values()) {
        list.push(def);
      }
    }
    return list;
  }

  private analyzeTopology(
    nodeIds: readonly string[],
    edges: readonly { from: string; to: string }[]
  ): {
    hasCycles: boolean;
    cyclePaths: (readonly string[])[];
    topologicalOrder: string[];
  } {
    const adj = new Map<string, string[]>();
    nodeIds.forEach((id) => adj.set(id, []));
    for (const e of edges) {
      if (!adj.has(e.from)) adj.set(e.from, []);
      adj.get(e.from)!.push(e.to);
    }

    const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
    const cyclePaths: string[][] = [];
    const currentPath: string[] = [];
    const postOrder: string[] = [];

    const dfs = (node: string) => {
      visited.set(node, 1);
      currentPath.push(node);

      for (const neighbor of adj.get(node) || []) {
        const state = visited.get(neighbor) || 0;
        if (state === 1) {
          // Cycle found
          const cycleStartIdx = currentPath.indexOf(neighbor);
          if (cycleStartIdx !== -1) {
            cyclePaths.push([...currentPath.slice(cycleStartIdx), neighbor]);
          }
        } else if (state === 0) {
          dfs(neighbor);
        }
      }

      currentPath.pop();
      visited.set(node, 2);
      postOrder.push(node);
    };

    for (const id of nodeIds) {
      if ((visited.get(id) || 0) === 0) {
        dfs(id);
      }
    }

    const hasCycles = cyclePaths.length > 0;
    // Topological order: dependencies before dependents
    const topologicalOrder = [...postOrder];

    return {
      hasCycles,
      cyclePaths,
      topologicalOrder,
    };
  }
}
