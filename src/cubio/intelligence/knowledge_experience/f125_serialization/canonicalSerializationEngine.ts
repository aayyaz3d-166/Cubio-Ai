import { deterministicHash } from '../../../state/determinism';
import { CanonicalKnowledgeItem, CanonicalSerializationResult } from '../types';

export class CanonicalSerializationEngine {
  public serialize(item: CanonicalKnowledgeItem): CanonicalSerializationResult {
    // Deterministic sorted JSON string
    const keys = Object.keys(item.payload).sort();
    const sortedPayload: Record<string, unknown> = {};
    for (const k of keys) sortedPayload[k] = item.payload[k];

    const canonicalJsonString = JSON.stringify({
      itemId: item.itemId,
      modality: item.modality,
      provenanceTier: item.provenanceTier,
      payload: sortedPayload,
      mathematicalInvariants: item.mathematicalInvariants,
    });

    const canonicalDigest = deterministicHash(canonicalJsonString);

    return Object.freeze({
      originalItemId: item.itemId,
      canonicalJsonString,
      canonicalDigest,
      byteLength: Buffer.byteLength(canonicalJsonString, 'utf8'),
      isDeterministic: true,
    });
  }
}
