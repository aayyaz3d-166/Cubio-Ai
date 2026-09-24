/**
 * CUBiO AI — Task 192: Native Knowledge Contradiction Detection and Resolution
 * src/cubio/model/native_knowledge_contradiction/resolutionEngine.ts
 *
 * Deterministic Resolution Engine:
 * Evaluates epistemic hierarchy, evidence rigor, and historical OCC lineage.
 * Never silently overwrites. Resolves only on decisive authority; otherwise quarantines.
 */

import {
  ConflictRecord,
  ResolutionResult,
  ResolutionStrategy,
} from './types';
import { QuarantineStore } from './quarantineStore';
import {
  KnowledgeFact,
  Relationship,
  Evidence,
  EPISTEMIC_WEIGHTS,
  KnowledgeEpistemicStatus,
} from '../native_knowledge_architecture/types';

export class ResolutionEngine {
  /**
   * Evaluates and attempts deterministic resolution of a detected conflict.
   */
  public static resolveConflict(conflict: ConflictRecord): ResolutionResult {
    switch (conflict.conflictType) {
      case 'FACT_CONFLICT':
        return this.resolveFactConflict(conflict);
      case 'RELATIONSHIP_CONFLICT':
        return this.resolveRelationshipConflict(conflict);
      case 'EVIDENCE_CONFLICT':
        return this.resolveEvidenceConflict(conflict);
      case 'HISTORICAL_STATE_CONFLICT':
        return this.resolveHistoricalConflict(conflict);
      case 'EPISTEMIC_CONFLICT':
        return this.resolveEpistemicConflict(conflict);
      default:
        return this.quarantineFallback(conflict, 'Unknown conflict type');
    }
  }

  /**
   * Resolves fact conflicts based on epistemic hierarchy and evidence backing.
   */
  private static resolveFactConflict(conflict: ConflictRecord): ResolutionResult {
    const [rec1, rec2] = conflict.records as [KnowledgeFact, KnowledgeFact];
    if (!rec1 || !rec2) {
      return this.quarantineFallback(conflict, 'Malformed conflict records');
    }

    const w1 = EPISTEMIC_WEIGHTS[rec1.epistemicStatus] ?? 0.5;
    const w2 = EPISTEMIC_WEIGHTS[rec2.epistemicStatus] ?? 0.5;
    const epistemicDelta = Math.abs(w1 - w2);

    // Rule 1: Decisive Epistemic Superiority (delta >= 0.35)
    if (epistemicDelta >= 0.35) {
      const winner = w1 > w2 ? rec1 : rec2;
      const loser = w1 > w2 ? rec2 : rec1;
      return {
        conflictId: conflict.conflictId,
        resolved: true,
        strategyApplied: 'DECISIVE_EPISTEMIC_SUPERIORITY',
        winningRecordId: winner.factId,
        resolutionProofNotes: `Decisive epistemic superiority: '${winner.epistemicStatus}' (weight ${Math.max(
          w1,
          w2
        )}) decisively supersedes '${loser.epistemicStatus}' (weight ${Math.min(w1, w2)})`,
        resolvedRecord: winner,
      };
    }

    // Rule 2: Empirical Evidence Superiority
    const evCount1 = rec1.evidenceIds ? rec1.evidenceIds.length : 0;
    const evCount2 = rec2.evidenceIds ? rec2.evidenceIds.length : 0;

    if (evCount1 > 0 && evCount2 === 0) {
      return {
        conflictId: conflict.conflictId,
        resolved: true,
        strategyApplied: 'EMPIRICAL_EVIDENCE_SUPERIORITY',
        winningRecordId: rec1.factId,
        resolutionProofNotes: `Empirical evidence superiority: Record '${rec1.factId}' has ${evCount1} verified evidence references whereas '${rec2.factId}' has none`,
        resolvedRecord: rec1,
      };
    } else if (evCount2 > 0 && evCount1 === 0) {
      return {
        conflictId: conflict.conflictId,
        resolved: true,
        strategyApplied: 'EMPIRICAL_EVIDENCE_SUPERIORITY',
        winningRecordId: rec2.factId,
        resolutionProofNotes: `Empirical evidence superiority: Record '${rec2.factId}' has ${evCount2} verified evidence references whereas '${rec1.factId}' has none`,
        resolvedRecord: rec2,
      };
    }

    // Rule 3: Equal authority or ambiguous claims -> NEVER silently overwrite. Quarantine!
    return this.quarantineFallback(
      conflict,
      `Equal epistemic authority (${rec1.epistemicStatus}) and evidence parity (${evCount1} vs ${evCount2}). Refusing silent overwrite.`
    );
  }

  /**
   * Resolves relationship conflicts.
   */
  private static resolveRelationshipConflict(conflict: ConflictRecord): ResolutionResult {
    const [r1, r2] = conflict.records as [Relationship, Relationship];
    if (!r1 || !r2) {
      return this.quarantineFallback(conflict, 'Malformed relationship conflict records');
    }

    const w1 = EPISTEMIC_WEIGHTS[r1.epistemicStatus] ?? 0.5;
    const w2 = EPISTEMIC_WEIGHTS[r2.epistemicStatus] ?? 0.5;

    if (Math.abs(w1 - w2) >= 0.35) {
      const winner = w1 > w2 ? r1 : r2;
      return {
        conflictId: conflict.conflictId,
        resolved: true,
        strategyApplied: 'DECISIVE_EPISTEMIC_SUPERIORITY',
        winningRecordId: winner.relationshipId,
        resolutionProofNotes: `Relationship resolved by decisive epistemic weight disparity: '${winner.epistemicStatus}' prevails`,
        resolvedRecord: winner,
      };
    }

    // Equal authority circular/opposing relationship -> quarantine
    return this.quarantineFallback(
      conflict,
      `Mutually exclusive relationships with balanced epistemic weight (${r1.epistemicStatus} vs ${r2.epistemicStatus}). Quarantined.`
    );
  }

  /**
   * Resolves evidence conflicts.
   */
  private static resolveEvidenceConflict(conflict: ConflictRecord): ResolutionResult {
    const [e1, e2] = conflict.records as [Evidence, Evidence];
    if (!e1 || !e2) {
      return this.quarantineFallback(conflict, 'Malformed evidence records');
    }

    // If one evidence item has a verifiable cryptographic hash and higher reliability score
    const score1 = (e1.confidence ?? 0.5) * (e1.provenanceId ? 1.2 : 1.0);
    const score2 = (e2.confidence ?? 0.5) * (e2.provenanceId ? 1.2 : 1.0);

    if (Math.abs(score1 - score2) >= 0.4) {
      const winner = score1 > score2 ? e1 : e2;
      return {
        conflictId: conflict.conflictId,
        resolved: true,
        strategyApplied: 'EMPIRICAL_EVIDENCE_SUPERIORITY',
        winningRecordId: winner.evidenceId,
        resolutionProofNotes: `Evidence conflict resolved by provenance confidence superiority (${Math.max(
          score1,
          score2
        ).toFixed(2)} vs ${Math.min(score1, score2).toFixed(2)})`,
        resolvedRecord: winner,
      };
    }

    return this.quarantineFallback(
      conflict,
      `Contradictory evidence measurements with comparable reliability (${score1.toFixed(2)} vs ${score2.toFixed(2)}). Quarantined.`
    );
  }

  /**
   * Resolves historical state conflicts.
   */
  private static resolveHistoricalConflict(conflict: ConflictRecord): ResolutionResult {
    // OCC version forks (identical stateVersion, different checksums) represent split-brain divergence.
    // They cannot be resolved automatically without human/provenance arbitration.
    return this.quarantineFallback(
      conflict,
      'OCC Version Fork: Divergent states detected at identical stateVersion. Automatic overwrite forbidden.'
    );
  }

  /**
   * Resolves generic epistemic disputes.
   */
  private static resolveEpistemicConflict(conflict: ConflictRecord): ResolutionResult {
    return this.quarantineFallback(
      conflict,
      'Direct epistemic dispute requires deterministic empirical proof.'
    );
  }

  /**
   * Quarantines an unresolvable conflict and preserves both records.
   */
  private static quarantineFallback(conflict: ConflictRecord, reason: string): ResolutionResult {
    const quarantineRecord = QuarantineStore.register(conflict, reason);
    return {
      conflictId: conflict.conflictId,
      resolved: false,
      strategyApplied: 'PRESERVE_AND_QUARANTINE',
      quarantineId: quarantineRecord.quarantineId,
      resolutionProofNotes: `Resolution refused: ${reason}. Both records quarantined under ID '${quarantineRecord.quarantineId}'`,
    };
  }
}
