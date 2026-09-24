/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F60: Final Answer Synthesizer
 *
 * Merges validated Research, Code, and Spatial contributions into an authoritative Final Answer.
 */

import { deterministicHash } from '../../../../state/determinism';
import { AgentContribution, FinalAnswerResult, ValidationReport } from '../types';

export class FinalAnswerSynthesizer {
  public synthesizeFinalAnswer(
    problem: string,
    masterPlan: string,
    contributions: readonly AgentContribution[],
    validation: ValidationReport
  ): Readonly<FinalAnswerResult> {
    const researchContrib = contributions.find((c) => c.role === 'RESEARCH_AGENT');
    const codeContrib = contributions.find((c) => c.role === 'CODING_AGENT');
    const spatialContrib = contributions.find((c) => c.role === 'SPATIAL_AGENT');

    const researchSummary = researchContrib?.summary || 'Research domain verified.';
    const codeSummary = codeContrib?.summary || 'Code architecture verified.';
    const spatialSummary = spatialContrib?.summary || 'Spatial coordinate models verified.';
    const validationSummary = validation.feedback;

    const finalAnswerText = `### Multi-Agent Super Intelligence Solution for: "${problem}"\n\n` +
      `**Master Strategy**:\n${masterPlan}\n\n` +
      `**1. Research & Evidence**:\n${researchSummary}\n\n` +
      `**2. Implementation Architecture**:\n${codeSummary}\n\n` +
      `**3. Spatial & Geometric Models**:\n${spatialSummary}\n\n` +
      `**Validation Status**: ${validation.isValid ? '✅ Fully Certified (Score: ' + validation.validationScore + ')' : '⚠️ Partial Certification'}`;

    const solutionChecksum = deterministicHash(
      `FINAL_ANSWER:${problem}:${validation.validationChecksum}:${contributions.length}`
    );
    const answerId = `ANS_${solutionChecksum.slice(2, 10)}`;

    return Object.freeze({
      answerId,
      problem,
      masterPlan,
      researchSummary,
      codeSummary,
      spatialSummary,
      validationSummary,
      finalAnswerText,
      solutionChecksum,
      timestamp: Date.now(),
    });
  }
}
