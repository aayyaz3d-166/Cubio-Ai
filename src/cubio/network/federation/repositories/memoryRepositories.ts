/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-17: In-Memory Federation Repository
 */

import {
  FederationNode,
  HandshakeState,
  TrustLevel,
} from '../types';
import { IFederationRepository } from './types';

export class MemoryFederationRepository implements IFederationRepository {
  private nodesByNetworkId: Map<string, FederationNode> = new Map();
  private handshakesById: Map<string, HandshakeState> = new Map();

  // --- NODES ---

  public async saveNode(node: FederationNode): Promise<void> {
    this.nodesByNetworkId.set(node.networkId, Object.freeze({ ...node }));
  }

  public async getNode(networkId: string): Promise<FederationNode | undefined> {
    return this.nodesByNetworkId.get(networkId);
  }

  public async listNodes(trustLevel?: TrustLevel): Promise<readonly FederationNode[]> {
    const list: FederationNode[] = [];
    for (const node of this.nodesByNetworkId.values()) {
      if (trustLevel && node.trustLevel !== trustLevel) continue;
      list.push(node);
    }
    return Object.freeze(list);
  }

  public async updateNode(
    networkId: string,
    updates: Partial<FederationNode>
  ): Promise<FederationNode | undefined> {
    const existing = this.nodesByNetworkId.get(networkId);
    if (!existing) return undefined;

    const updated: FederationNode = Object.freeze({
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    });

    this.nodesByNetworkId.set(networkId, updated);
    return updated;
  }

  public async deleteNode(networkId: string): Promise<boolean> {
    return this.nodesByNetworkId.delete(networkId);
  }

  // --- HANDSHAKES ---

  public async saveHandshake(handshake: HandshakeState): Promise<void> {
    this.handshakesById.set(handshake.handshakeId, Object.freeze({ ...handshake }));
  }

  public async getHandshake(handshakeId: string): Promise<HandshakeState | undefined> {
    return this.handshakesById.get(handshakeId);
  }

  public async deleteHandshake(handshakeId: string): Promise<boolean> {
    return this.handshakesById.delete(handshakeId);
  }
}
