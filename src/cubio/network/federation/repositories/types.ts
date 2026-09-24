/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-17: Federation Repository Interfaces
 */

import {
  FederationNode,
  HandshakeState,
  TrustLevel,
} from '../types';

export interface IFederationRepository {
  // Nodes
  saveNode(node: FederationNode): Promise<void>;
  getNode(networkId: string): Promise<FederationNode | undefined>;
  listNodes(trustLevel?: TrustLevel): Promise<readonly FederationNode[]>;
  updateNode(networkId: string, updates: Partial<FederationNode>): Promise<FederationNode | undefined>;
  deleteNode(networkId: string): Promise<boolean>;

  // Handshakes
  saveHandshake(handshake: HandshakeState): Promise<void>;
  getHandshake(handshakeId: string): Promise<HandshakeState | undefined>;
  deleteHandshake(handshakeId: string): Promise<boolean>;
}
