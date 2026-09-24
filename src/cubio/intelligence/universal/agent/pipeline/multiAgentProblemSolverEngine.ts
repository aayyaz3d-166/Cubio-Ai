/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F61: Master 8-Stage Multi-Agent Problem Solver Engine
 *
 * Implements the full 8-stage pipeline:
 * Problem -> Planner -> Task Graph -> Specialist Agents -> Parallel Exec -> Cross-check -> Validator -> Final Solution
 */

import { deterministicHash } from '../../../../state/determinism';
import {
  IUniversalMultiAgentSolver,
  MultiAgentSolveResult,
  ProblemDecomposition,
} from '../types';
import { decomposeProblem } from '../problemDecomposer';
import { TaskGraphPlanner } from './taskGraphPlanner';
import { ParallelExecutionEngine } from './parallelExecutionEngine';
import { CrossCheckReconciler } from './crossCheckReconciler';
import { ValidatorAgent } from '../agents/validatorAgent';
import { FinalAnswerSynthesizer } from '../agents/finalAnswerSynthesizer';
import { judgeAndSynthesizeSolution } from '../consensusJudge';

export class CubiOMultiAgentProblemSolverEngine implements IUniversalMultiAgentSolver {
  private planner = new TaskGraphPlanner();
  private parallelExec = new ParallelExecutionEngine();
  private crossChecker = new CrossCheckReconciler();
  private validator = new ValidatorAgent();
  private synthesizer = new FinalAnswerSynthesizer();

  public decomposeProblem(problem: string): Readonly<ProblemDecomposition> {
    return decomposeProblem(problem);
  }

  /**
   * Executes the full 8-Stage Multi-Agent Super Intelligence Solver.
   */
  public async solveProblem(problem: string): Promise<Readonly<MultiAgentSolveResult>> {
    const startTime = Date.now();

    // Stage 1 & 2: Problem -> Planner Decomposition
    const decomposition = this.decomposeProblem(problem);

    // Stage 3: Task Graph (DAG) Generation
    const taskGraph = this.planner.planTaskGraph(decomposition);

    // Stage 4 & 5: Specialist Agents -> Parallel Execution across DAG Layers
    const contributions = await this.parallelExec.executeTaskGraph(taskGraph, problem);

    // Stage 6: Cross-check & Reconcile
    const crossCheckReport = this.crossChecker.reconcileContributions(problem, contributions);

    // Stage 7: Validator Certification
    const validationReport = this.validator.validateContributions(problem, contributions);

    // Stage 8: Final Solution Synthesis
    const masterPlan = `DAG Plan (${taskGraph.layers.length} Layers, ${taskGraph.totalNodes} Nodes): Concurrently executed specialist agents with peer-reviewed consensus and formal validation.`;
    const finalAnswer = this.synthesizer.synthesizeFinalAnswer(
      problem,
      masterPlan,
      contributions,
      validationReport
    );

    const consensus = judgeAndSynthesizeSolution(problem, contributions);
    const totalExecutionTimeMs = Math.max(1, Date.now() - startTime);

    const solveChecksum = deterministicHash(
      `8STAGE_SOLVE:${decomposition.problemId}:${taskGraph.graphChecksum}:${crossCheckReport.crossCheckChecksum}:${finalAnswer.solutionChecksum}`
    );

    return Object.freeze({
      problemId: decomposition.problemId,
      originalProblem: problem,
      decomposition,
      taskGraph,
      contributions,
      messages: crossCheckReport.messagesExchanged,
      crossCheckReport,
      consensus,
      validationReport,
      finalAnswer,
      totalExecutionTimeMs,
      solveChecksum,
      timestamp: Date.now(),
    });
  }
}
