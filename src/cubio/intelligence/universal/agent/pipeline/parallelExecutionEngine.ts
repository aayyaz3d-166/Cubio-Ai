/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F61: Parallel Execution Engine
 *
 * Stage 4 & 5: Specialist Agents -> Parallel Execution across DAG layers.
 */

import { AgentContribution, TaskGraph, UniversalAgentTask } from '../types';
import { ResearchAgent } from '../agents/researchAgent';
import { CodingAgent } from '../agents/codingAgent';
import { SpatialAgent } from '../agents/spatialAgent';

export class ParallelExecutionEngine {
  private researchAgent = new ResearchAgent();
  private codingAgent = new CodingAgent();
  private spatialAgent = new SpatialAgent();

  public async executeTaskGraph(
    taskGraph: TaskGraph,
    problemContext: string
  ): Promise<readonly AgentContribution[]> {
    const allContributions: AgentContribution[] = [];

    // Process layer by layer
    for (const layer of taskGraph.layers) {
      // Execute all tasks in the current layer concurrently
      const layerPromises = layer.tasks.map((task) =>
        this.dispatchSpecialistTask(task, problemContext)
      );

      const layerResults = await Promise.all(layerPromises);
      allContributions.push(...layerResults);
    }

    return Object.freeze(allContributions);
  }

  private async dispatchSpecialistTask(
    task: UniversalAgentTask,
    problemContext: string
  ): Promise<AgentContribution> {
    switch (task.role) {
      case 'RESEARCH_AGENT':
        return this.researchAgent.execute(problemContext);

      case 'CODING_AGENT':
      case 'CODE_AGENT':
        return this.codingAgent.execute(problemContext);

      case 'SPATIAL_AGENT':
      case 'DESIGN_AGENT':
        return this.spatialAgent.execute(problemContext);

      default:
        return this.researchAgent.execute(problemContext);
    }
  }
}
