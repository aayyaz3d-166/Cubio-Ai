/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-17: CubiO Distributed / Federation Layer (Types & Models)
 *
 * Master specification for multi-cluster federation, trust management,
 * cryptographic node handshakes, cross-network message forwarding, and isolation.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - "Federation must never automatically grant cross-network authorization."
 * - Foreign cluster identities must pass explicit local authorization (NET-03)
 *   and local policy boundaries before accessing any protected cluster resource.
 */

export type TrustLevel = 'UNTRUSTED' | 'PROVISIONAL' | 'VERIFIED' | 'FEDERATED' | 'BLOCKED';

export type FederationStatus = 'PENDING_HANDSHAKE' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export interface FederationNode {
  readonly networkId: string; // e.g. "NET_CLUSTER_ALPHA"
  readonly name: string;
  readonly coordinateUri: string; // CNC coordinate: CUBIO://NETWORK/1/01/00000/FEDERATION
  readonly publicKey: string;
  readonly endpointUrl: string;
  readonly trustLevel: TrustLevel;
  readonly status: FederationStatus;
  readonly allowedCapabilities: readonly string[]; // ['DISCOVERY', 'SERVICE_FORWARDING', 'EVENT_SUBSCRIPTION']
  readonly lastHeartbeat: number;
  readonly handshakeCompletedAt?: number;
  readonly metadata?: Readonly<Record<string, any>>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface HandshakeState {
  readonly handshakeId: string; // HND_...
  readonly initiatorNetworkId: string;
  readonly targetNetworkId: string;
  readonly challengeNonce: string;
  readonly stage: 'INITIATED' | 'CHALLENGE_ISSUED' | 'COMPLETED' | 'REJECTED';
  readonly expiresAt: number;
  readonly createdAt: number;
}

import { GatewayRequestMethod } from '../gateway/types';

export interface CrossNetworkMessageEnvelope {
  readonly messageId: string;
  readonly originNetworkId: string;
  readonly destinationNetworkId: string;
  readonly originCubId: string; // Sovereign identity from origin network
  readonly targetUri: string;
  readonly method?: GatewayRequestMethod;
  readonly payload: any;
  readonly signature: string;
  readonly hopCount: number;
  readonly maxHops: number;
  readonly timestamp: number;
}

export interface FederationVerificationResult {
  readonly allowed: boolean;
  readonly reason: string;
  readonly originNetworkId: string;
  readonly originCubId: string;
  readonly trustLevel: TrustLevel;
}

export interface RegisterFederationNodeInput {
  readonly networkId: string;
  readonly name: string;
  readonly coordinateUri: string;
  readonly publicKey: string;
  readonly endpointUrl: string;
  readonly allowedCapabilities?: readonly string[];
  readonly metadata?: Record<string, any>;
}

export interface InitiateHandshakeInput {
  readonly targetNetworkId: string;
}

export interface CompleteHandshakeInput {
  readonly handshakeId: string;
  readonly challengeResponseSignature: string;
}
