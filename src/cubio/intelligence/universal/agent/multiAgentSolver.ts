/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F60: Master Universal Multi-Agent Solver
 *
 * Coordinates the multi-agent architecture:
 * Master Agent -> [Research Agent, Coding Agent, Spatial Agent] -> Validator -> Final Answer
 */

import {
  IUniversalMultiAgentSolver,
  MultiAgentSolveResult,
  ProblemDecomposition,
} from './types';
import { decomposeProblem } from './problemDecomposer';
import { MasterAgentCoordinator } from './agents/masterAgent';

export class CubiOUniversalMultiAgentSolver implements IUniversalMultiAgentSolver {
  private coordinator = new MasterAgentCoordinator();

  /**
   * Decomposes a complex problem prompt into specialized agent sub-tasks.
   */
  public decomposeProblem(problem: string): Readonly<ProblemDecomposition> {
    return decomposeProblem(problem);
  }

  /**
   * Solves a complex problem using the full Master -> {Research, Coding, Spatial} -> Validator -> Final Answer pipeline.
   */
  public async solveProblem(problem: string): Promise<Readonly<MultiAgentSolveResult>> {
    return this.coordinator.coordinateSolve(problem);
  }
}
