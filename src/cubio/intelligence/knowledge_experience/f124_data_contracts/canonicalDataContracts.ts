import { deterministicHash } from '../../../state/determinism';
import { CanonicalKnowledgeItem, ProvenanceTier, VerificationStatus } from '../types';

export class CanonicalDataContractsEngine {
  public createKnowledgeItem(
    modality: CanonicalKnowledgeItem['modality'],
    payload: Record<string, unknown>,
    tier: ProvenanceTier = 'TIER_1_HUMAN_AXIOM',
    status: VerificationStatus = 'FORMALLY_PROVEN',
    invariants: string[] = ['EulerChi==2']
  ): CanonicalKnowledgeItem {
    const payloadStr = JSON.stringify(payload);
    const provenanceHash = deterministicHash(payloadStr + ':' + tier + ':' + status);
    const itemId = 'KITEM_' + provenanceHash.slice(2, 10);

    return Object.freeze({
      itemId,
      provenanceTier: tier,
      verificationStatus: status,
      modality,
      payload: Object.freeze({ ...payload }),
      mathematicalInvariants: Object.freeze([...invariants]),
      provenanceHash,
      createdTimestamp: Date.now(),
    });
  }
}
