/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F60: Master Agent Coordinator
 *
 * Coordinates problem intake, autonomous task decomposition, specialized agent dispatch
 * (Research, Coding, Spatial), Validator review, and Final Answer synthesis.
 */

import { deterministicHash } from '../../../../state/determinism';
import {
  AgentContribution,
  FinalAnswerResult,
  MultiAgentSolveResult,
  ProblemDecomposition,
  ValidationReport,
} from '../types';
import { ResearchAgent } from './researchAgent';
import { CodingAgent } from './codingAgent';
import { SpatialAgent } from './spatialAgent';
import { ValidatorAgent } from './validatorAgent';
import { FinalAnswerSynthesizer } from './finalAnswerSynthesizer';
import { MultiAgentCollaborationBus } from '../collaborationBus';
import { judgeAndSynthesizeSolution } from '../consensusJudge';
import { decomposeProblem } from '../problemDecomposer';

export class MasterAgentCoordinator {
  private researchAgent = new ResearchAgent();
  private codingAgent = new CodingAgent();
  private spatialAgent = new SpatialAgent();
  private validatorAgent = new ValidatorAgent();
  private synthesizer = new FinalAnswerSynthesizer();

  /**
   * Executes the full Master -> {Research, Coding, Spatial} -> Validator -> Final Answer pipeline.
   */
  public async coordinateSolve(problem: string): Promise<Readonly<MultiAgentSolveResult>> {
    const startTime = Date.now();
    const decomposition: ProblemDecomposition = decomposeProblem(problem);
    const bus = new MultiAgentCollaborationBus();

    // 1. Spawning specialized agents in parallel
    const [researchContrib, codingContrib, spatialContrib] = await Promise.all([
      this.researchAgent.execute(problem),
      this.codingAgent.execute(problem),
      this.spatialAgent.execute(problem),
    ]);

    const contributions: readonly AgentContribution[] = Object.freeze([
      researchContrib,
      codingContrib,
      spatialContrib,
    ]);

    for (const c of contributions) {
      bus.recordContribution(c);
    }

    // 2. Validator Agent Review
    const validationReport: ValidationReport = this.validatorAgent.validateContributions(
      problem,
      contributions
    );

    // 3. Final Answer Synthesis
    const masterPlan = `1. Research domain architecture and establish grounded facts.\n2. Synthesize type-safe TypeScript implementation.\n3. Compute 3D/4D spatial coordinates and geometric manifold.\n4. Validate cross-domain coherence through automated Validator Agent.`;

    const finalAnswer: FinalAnswerResult = this.synthesizer.synthesizeFinalAnswer(
      problem,
      masterPlan,
      contributions,
      validationReport
    );

    const consensus = judgeAndSynthesizeSolution(problem, contributions);
    const totalExecutionTimeMs = Math.max(1, Date.now() - startTime);

    const solveChecksum = deterministicHash(
      `MULTI_AGENT_SUPER_SOLVE:${decomposition.problemId}:${validationReport.validationChecksum}:${finalAnswer.solutionChecksum}`
    );

    return Object.freeze({
      problemId: decomposition.problemId,
      originalProblem: problem,
      decomposition,
      contributions,
      messages: bus.getMessages(),
      consensus,
      validationReport,
      finalAnswer,
      totalExecutionTimeMs,
      solveChecksum,
      timestamp: Date.now(),
    });
  }
}
