/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Feature Dependency Resolver
 *
 * Resolves execution order in the DAG and detects cyclic dependencies.
 */

import { ParametricFeature } from './types';

export class DependencyResolver {
  public static resolveExecutionOrder(features: readonly ParametricFeature[]): {
    executionOrder: readonly string[];
    isCyclic: boolean;
  } {
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const f of features) {
      adj.set(f.id, []);
      inDegree.set(f.id, 0);
    }

    for (const f of features) {
      for (const depId of f.dependencyIds) {
        if (adj.has(depId)) {
          adj.get(depId)!.push(f.id);
          inDegree.set(f.id, (inDegree.get(f.id) || 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    const order: string[] = [];
    while (queue.length > 0) {
      queue.sort(); // Deterministic ordering
      const curr = queue.shift()!;
      order.push(curr);

      for (const next of adj.get(curr) || []) {
        const nextDeg = (inDegree.get(next) || 0) - 1;
        inDegree.set(next, nextDeg);
        if (nextDeg === 0) {
          queue.push(next);
        }
      }
    }

    const isCyclic = order.length !== features.length;

    return {
      executionOrder: Object.freeze(order),
      isCyclic,
    };
  }

  public static findDownstreamDependencies(featureId: string, features: readonly ParametricFeature[]): Set<string> {
    const downstream = new Set<string>();
    const queue = [featureId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const f of features) {
        if (f.dependencyIds.includes(current) && !downstream.has(f.id)) {
          downstream.add(f.id);
          queue.push(f.id);
        }
      }
    }

    return downstream;
  }
}
