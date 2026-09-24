import { LearningCandidateProposal } from '../types';

export class LearningCandidateSystemL9 {
  public formulateCandidate(subsystem: string, proposedRule: string, rationale: string): LearningCandidateProposal {
    const candidateId = 'CAND_' + Date.now();

    return Object.freeze({
      candidateId,
      targetSubsystem: subsystem,
      proposedSkillOrRule: proposedRule,
      rationale,
      isSandboxed: true,
      status: 'PROPOSED_SANDBOXED',
    });
  }
}
