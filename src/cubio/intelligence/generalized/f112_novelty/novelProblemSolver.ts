/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F112: Novel Problem Solver
 *
 * Solves completely new, undefined problems without relying on static templates.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  CrossDomainIsomorphismMapping,
  NovelUnknownTaskSpecification,
  ZeroTemplateSolutionDAG,
} from '../types';
import { ZeroTemplateProblemSolver } from '../synthesis/zeroTemplateProblemSolver';

export class CubiONovelProblemSolver {
  private solver = new ZeroTemplateProblemSolver();

  public solveNovelProblem(
    novelTask: NovelUnknownTaskSpecification,
    isomorphism: CrossDomainIsomorphismMapping
  ): ZeroTemplateSolutionDAG {
    return this.solver.synthesizeSolutionDAG(novelTask, isomorphism);
  }
}
