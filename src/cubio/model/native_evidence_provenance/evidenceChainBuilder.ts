/**
 * CUBiO AI — Task 193: Native Evidence and Source Provenance Architecture
 * src/cubio/model/native_evidence_provenance/evidenceChainBuilder.ts
 *
 * Deterministic Evidence Chain Builder:
 * Constructs Merkle-style cryptographic evidence chains linking raw source inputs,
 * empirical observations, derivation steps, and final knowledge claims.
 */

import * as crypto from 'crypto';
import {
  EvidenceChain,
  EvidenceChainNode,
  MAX_EVIDENCE_CHAIN_DEPTH,
  EvidenceUnverifiableLineageError,
} from './types';

export interface RawChainNodeInput {
  readonly nodeId: string;
  readonly parentNodeId?: string;
  readonly sourceIdentity: {
    readonly sourceId: string;
    readonly sourceType: string;
    readonly locationUri: string;
    readonly authorOrInstrument: string;
    readonly payloadChecksum: string;
    readonly recordedAt: number;
  };
  readonly epistemicTier: any;
  readonly confidence: number;
  readonly derivationRule?: string;
  readonly rawPayloadContent?: string;
  readonly timestamp?: number;
}

export class EvidenceChainBuilder {
  /**
   * Constructs a fully linked, deterministic evidence chain.
   */
  public static buildChain(
    claimId: string,
    tenantId: string,
    rawNodes: readonly RawChainNodeInput[],
    creationTimestamp: number = 1000
  ): EvidenceChain {
    if (rawNodes.length === 0) {
      throw new EvidenceUnverifiableLineageError(
        `claim-${claimId}`,
        'Cannot construct an evidence chain with zero nodes'
      );
    }

    if (rawNodes.length > MAX_EVIDENCE_CHAIN_DEPTH) {
      throw new EvidenceUnverifiableLineageError(
        `claim-${claimId}`,
        `Evidence chain depth ${rawNodes.length} exceeds maximum allowable depth of ${MAX_EVIDENCE_CHAIN_DEPTH}`
      );
    }

    // Index raw nodes and detect circular references
    const rawNodeMap = new Map<string, RawChainNodeInput>();
    for (const node of rawNodes) {
      if (rawNodeMap.has(node.nodeId)) {
        throw new EvidenceUnverifiableLineageError(
          `claim-${claimId}`,
          `Duplicate node ID '${node.nodeId}' in chain definition`
        );
      }
      rawNodeMap.set(node.nodeId, node);
    }

    // Topological traversal / cycle check
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const checkCycles = (id: string) => {
      if (visiting.has(id)) {
        throw new EvidenceUnverifiableLineageError(
          `claim-${claimId}`,
          `Circular parent dependency detected involving node '${id}'`
        );
      }
      if (visited.has(id)) return;

      visiting.add(id);
      const node = rawNodeMap.get(id);
      if (node && node.parentNodeId) {
        if (!rawNodeMap.has(node.parentNodeId)) {
          throw new EvidenceUnverifiableLineageError(
            `claim-${claimId}`,
            `Parent node '${node.parentNodeId}' referenced by '${id}' does not exist in chain inputs`
          );
        }
        checkCycles(node.parentNodeId);
      }
      visiting.delete(id);
      visited.add(id);
    };

    for (const node of rawNodes) {
      checkCycles(node.nodeId);
    }

    // Construct linked nodes in deterministic topological order (parents first)
    const builtNodes: EvidenceChainNode[] = [];
    const builtNodeHashMap = new Map<string, string>();
    const rootSourceIds: string[] = [];

    // Helper to evaluate and compute hash for a node once parent is computed
    const processNode = (raw: RawChainNodeInput): EvidenceChainNode => {
      let parentHash = '';
      if (raw.parentNodeId) {
        parentHash = builtNodeHashMap.get(raw.parentNodeId) || '';
      } else {
        rootSourceIds.push(raw.sourceIdentity.sourceId);
      }

      const chainedHash = this.computeChainedHash(
        raw.nodeId,
        raw.parentNodeId,
        parentHash,
        raw.sourceIdentity.payloadChecksum,
        raw.epistemicTier,
        raw.confidence,
        raw.derivationRule
      );

      builtNodeHashMap.set(raw.nodeId, chainedHash);

      return {
        nodeId: raw.nodeId,
        claimId,
        parentNodeId: raw.parentNodeId,
        sourceIdentity: { ...raw.sourceIdentity },
        epistemicTier: raw.epistemicTier,
        confidence: raw.confidence,
        derivationRule: raw.derivationRule,
        rawPayloadContent: raw.rawPayloadContent,
        chainedHash,
        timestamp: raw.timestamp ?? creationTimestamp,
      };
    };

    // Topological order list
    const orderedNodeIds: string[] = [];
    const addedToOrder = new Set<string>();

    const addToOrder = (id: string) => {
      if (addedToOrder.has(id)) return;
      const node = rawNodeMap.get(id)!;
      if (node.parentNodeId) {
        addToOrder(node.parentNodeId);
      }
      orderedNodeIds.push(id);
      addedToOrder.add(id);
    };

    for (const node of rawNodes) {
      addToOrder(node.nodeId);
    }

    for (const id of orderedNodeIds) {
      const raw = rawNodeMap.get(id)!;
      builtNodes.push(processNode(raw));
    }

    const leafNode = builtNodes[builtNodes.length - 1];
    const leafHash = leafNode.chainedHash;

    const allChainedHashes = builtNodes.map((n) => n.chainedHash).join(':::');
    const compositeHash = crypto
      .createHash('sha256')
      .update(`CHAIN:::${tenantId}:::${claimId}:::${allChainedHashes}`)
      .digest('hex');

    const chainId = `CHAIN-${compositeHash.slice(0, 16)}`;

    return {
      chainId,
      claimId,
      tenantId,
      nodes: builtNodes,
      rootSourceIds: [...new Set(rootSourceIds)],
      leafHash,
      compositeHash,
      createdAt: creationTimestamp,
    };
  }

  /**
   * Computes deterministic chained hash for an evidence node.
   */
  public static computeChainedHash(
    nodeId: string,
    parentNodeId: string | undefined,
    parentHash: string,
    payloadChecksum: string,
    epistemicTier: string,
    confidence: number,
    derivationRule?: string
  ): string {
    const payload = `${nodeId}:${parentNodeId ?? 'ROOT'}:${parentHash}:${payloadChecksum}:${epistemicTier}:${confidence.toFixed(
      4
    )}:${derivationRule ?? 'NONE'}`;

    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
