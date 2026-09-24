/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F61: Task Graph Planner (DAG Generator)
 *
 * Stage 2 & 3: Problem -> Planner -> Task Graph (DAG)
 */

import { deterministicHash } from '../../../../state/determinism';
import { ProblemDecomposition, TaskGraph, TaskGraphLayer, UniversalAgentTask } from '../types';

export class TaskGraphPlanner {
  public planTaskGraph(decomposition: ProblemDecomposition): Readonly<TaskGraph> {
    const tasks = decomposition.tasks;

    // Separate tasks by dependency depth
    const layer0: UniversalAgentTask[] = tasks.filter((t) => t.dependencies.length === 0);
    const layer1: UniversalAgentTask[] = tasks.filter((t) => t.dependencies.length > 0);

    const layers: TaskGraphLayer[] = [
      Object.freeze({ layerIndex: 0, tasks: Object.freeze(layer0) }),
    ];

    if (layer1.length > 0) {
      layers.push(Object.freeze({ layerIndex: 1, tasks: Object.freeze(layer1) }));
    }

    const totalNodes = tasks.length;
    const criticalPathLength = layers.length;

    const graphChecksum = deterministicHash(
      `TASK_GRAPH:${decomposition.problemId}:${totalNodes}:${criticalPathLength}`
    );
    const graphId = `GRAPH_${graphChecksum.slice(2, 10)}`;

    return Object.freeze({
      graphId,
      problemId: decomposition.problemId,
      layers: Object.freeze(layers),
      totalNodes,
      criticalPathLength,
      graphChecksum,
    });
  }
}
