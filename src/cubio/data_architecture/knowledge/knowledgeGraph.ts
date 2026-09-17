import { CanonicalKnowledgeNode, KnowledgeRelation, MasterProvenanceRecord } from '../types';
import { MerkleTreeEngine } from '../provenance/merkleTree';
import { ProvenanceHasher } from '../provenance/hashing';

export class KnowledgeGraphStore {
  private nodes = new Map<string, CanonicalKnowledgeNode>();
  private relations = new Map<string, KnowledgeRelation>();
  private merkleEngine = new MerkleTreeEngine();
  private hasher = new ProvenanceHasher();

  public addNode(node: CanonicalKnowledgeNode): void {
    this.nodes.set(node.nodeId, node);
  }

  public addRelation(
    sourceNodeId: string,
    targetNodeId: string,
    relationType: KnowledgeRelation['relationType'],
    weight: number = 1.0,
    proofHash?: string
  ): KnowledgeRelation {
    const timestamp = Date.now();
    const relationId = 'REL_' + timestamp;
    const content = Object.freeze({
      weight,
      formalProofHash: proofHash,
    });

    const contentHash = this.hasher.hashContent(content);
    const provenanceHash = this.hasher.hashProvenanceLeaf(contentHash, 'TIER_2_VERIFIED_INVARIANT', [sourceNodeId, targetNodeId]);
    const relationHash = this.hasher.hashNode(relationId, contentHash, provenanceHash, timestamp);

    const provenance: MasterProvenanceRecord = Object.freeze({
      recordId: 'PROV_' + provenanceHash.slice(2, 10),
      provenanceTier: 'TIER_2_VERIFIED_INVARIANT',
      version: 1,
      parentLineage: Object.freeze([sourceNodeId, targetNodeId]),
      verificationState: proofHash ? 'FORMALLY_PROVEN' : 'EMPIRICALLY_VERIFIED',
      timestamp,
      hash: provenanceHash,
      content: Object.freeze({
        creatorType: 'FORMAL_VERIFIER',
        verifierProofHash: proofHash,
        targetResourceHash: contentHash,
      }),
    });

    const rel: KnowledgeRelation = Object.freeze({
      relationId,
      sourceNodeId,
      targetNodeId,
      relationType,
      version: 1,
      parentLineage: Object.freeze([sourceNodeId, targetNodeId]),
      verificationState: proofHash ? 'FORMALLY_PROVEN' : 'EMPIRICALLY_VERIFIED',
      timestamp,
      hash: relationHash,
      provenance,
      content,
    });

    this.relations.set(relationId, rel);
    return rel;
  }

  public getNode(id: string): CanonicalKnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): readonly CanonicalKnowledgeNode[] {
    return Object.freeze(Array.from(this.nodes.values()));
  }

  public getAllRelations(): readonly KnowledgeRelation[] {
    return Object.freeze(Array.from(this.relations.values()));
  }

  public computeGraphMerkleRoot(): string {
    const nodeHashes = Array.from(this.nodes.values()).map(n => n.hash);
    const relHashes = Array.from(this.relations.values()).map(r => r.hash);
    return this.merkleEngine.computeMerkleRoot([...nodeHashes, ...relHashes]);
  }
}
