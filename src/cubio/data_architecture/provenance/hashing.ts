import { deterministicHash } from '../../state/determinism';
import { CanonicalSerializer } from '../canonical/serializer';

export class ProvenanceHasher {
  private serializer = new CanonicalSerializer();

  public hashContent(content: unknown): string {
    const canonicalStr = this.serializer.serializeDeterministic(content);
    return deterministicHash(canonicalStr);
  }

  public hashProvenanceLeaf(contentHash: string, tier: string, parentLineage: readonly string[]): string {
    return deterministicHash('LEAF:' + contentHash + ':' + tier + ':' + parentLineage.join(','));
  }

  public hashNode(nodeId: string, contentHash: string, provenanceHash: string, timestamp: number): string {
    return deterministicHash('NODE:' + nodeId + ':' + contentHash + ':' + provenanceHash + ':' + timestamp);
  }
}
