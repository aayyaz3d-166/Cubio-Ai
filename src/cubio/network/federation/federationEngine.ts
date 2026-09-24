/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-17: Master Distributed / Federation Engine
 *
 * Implements sovereign multi-cluster federation, trust management,
 * cryptographic node handshakes, cross-network message forwarding, and isolation.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - "Federation must never automatically grant cross-network authorization."
 * - Foreign cluster identities must pass explicit local authorization (NET-03)
 *   and local policy boundaries before accessing any protected cluster resource.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiONodeRegistry } from '../coordinate/registry';
import { CubiOLogicalRouter } from '../coordinate/routing';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import {
  FederationNode,
  HandshakeState,
  CrossNetworkMessageEnvelope,
  FederationVerificationResult,
  RegisterFederationNodeInput,
  InitiateHandshakeInput,
  CompleteHandshakeInput,
  TrustLevel,
} from './types';
import { IFederationRepository } from './repositories/types';
import { MemoryFederationRepository } from './repositories/memoryRepositories';
import { GatewayResponseEnvelope } from '../gateway/types';

export class CubiOFederationEngine {
  private repository: IFederationRepository;
  private localNetworkId: string;
  private coordinateRegistry?: CubiONodeRegistry;
  private router?: CubiOLogicalRouter;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private stack?: any;

  constructor(options: {
    repository?: IFederationRepository;
    localNetworkId?: string;
    coordinateRegistry?: CubiONodeRegistry;
    router?: CubiOLogicalRouter;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
    stack?: any;
  } = {}) {
    this.repository = options.repository || new MemoryFederationRepository();
    this.localNetworkId = options.localNetworkId || 'NET_ORIGIN_MAIN';
    this.coordinateRegistry = options.coordinateRegistry;
    this.router = options.router;
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
    this.stack = options.stack;
  }

  public getRepository(): IFederationRepository {
    return this.repository;
  }

  public getLocalNetworkId(): string {
    return this.localNetworkId;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in FederationEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Federation Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Registers a foreign federation peer node for handshaking.
   */
  public async registerFederationNode(
    tokenOrSession: string,
    input: RegisterFederationNodeInput
  ): Promise<Readonly<FederationNode>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // Evaluate FEDERATION_ADMIN permission
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'FEDERATION_ADMIN',
        resourceUri: input.coordinateUri || 'CUBIO://NETWORK/0/01/00000/FEDERATION',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'FEDERATION_ADMIN'.`);
      }
    }

    const existing = await this.repository.getNode(input.networkId);
    if (existing) {
      throw new Error(`Federation Error: Node '${input.networkId}' is already registered.`);
    }

    const now = Date.now();
    const node: FederationNode = Object.freeze({
      networkId: input.networkId.trim().toUpperCase(),
      name: input.name.trim(),
      coordinateUri: input.coordinateUri.trim().toUpperCase(),
      publicKey: input.publicKey.trim(),
      endpointUrl: input.endpointUrl.trim(),
      trustLevel: 'PROVISIONAL',
      status: 'PENDING_HANDSHAKE',
      allowedCapabilities: Object.freeze([...(input.allowedCapabilities || ['DISCOVERY', 'SERVICE_FORWARDING'])]),
      lastHeartbeat: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveNode(node);
    return node;
  }

  /**
   * Initiates a cryptographic handshake with a registered peer node.
   */
  public async initiateHandshake(
    tokenOrSession: string,
    input: InitiateHandshakeInput
  ): Promise<Readonly<HandshakeState>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'FEDERATION_ADMIN',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/FEDERATION',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'FEDERATION_ADMIN'.`);
      }
    }

    const targetNode = await this.repository.getNode(input.targetNetworkId);
    if (!targetNode) {
      throw new Error(`Handshake Error: Target federation node '${input.targetNetworkId}' not found.`);
    }

    const now = Date.now();
    const handshakeId = `HND_${deterministicHash(`${this.localNetworkId}:${targetNode.networkId}:${now}`).slice(2, 18)}`;
    const challengeNonce = `NONCE_${deterministicHash(`${handshakeId}:${targetNode.publicKey}:${now}`).slice(2, 22)}`;

    const handshake: HandshakeState = Object.freeze({
      handshakeId,
      initiatorNetworkId: this.localNetworkId,
      targetNetworkId: targetNode.networkId,
      challengeNonce,
      stage: 'CHALLENGE_ISSUED',
      expiresAt: now + 300000, // 5 min TTL
      createdAt: now,
    });

    await this.repository.saveHandshake(handshake);
    return handshake;
  }

  /**
   * Completes a cryptographic handshake and elevates peer node to FEDERATED trust.
   */
  public async completeHandshake(
    input: CompleteHandshakeInput
  ): Promise<Readonly<FederationNode>> {
    const handshake = await this.repository.getHandshake(input.handshakeId);
    if (!handshake) {
      throw new Error(`Handshake Error: Handshake '${input.handshakeId}' not found.`);
    }

    if (Date.now() > handshake.expiresAt) {
      throw new Error('Handshake Error: Handshake challenge has expired.');
    }

    const targetNode = await this.repository.getNode(handshake.targetNetworkId);
    if (!targetNode) {
      throw new Error(`Handshake Error: Target node '${handshake.targetNetworkId}' not found.`);
    }

    // Verify cryptographic challenge signature: signature must match deterministic hash of nonce + target public key
    const expectedSig = `SIG_${deterministicHash(`${handshake.challengeNonce}:${targetNode.publicKey}`).slice(2, 18)}`;
    if (input.challengeResponseSignature !== expectedSig) {
      throw new Error('Handshake Error: Invalid cryptographic challenge response signature.');
    }

    // Elevate node to FEDERATED and ACTIVE
    const now = Date.now();
    const updated = await this.repository.updateNode(targetNode.networkId, {
      trustLevel: 'FEDERATED',
      status: 'ACTIVE',
      handshakeCompletedAt: now,
      lastHeartbeat: now,
    });

    await this.repository.deleteHandshake(input.handshakeId);
    return updated!;
  }

  /**
   * Evaluates cross-network authorization and trust boundaries.
   *
   * CRITICAL INVARIANT: Federation must never automatically grant cross-network authorization.
   */
  public async evaluateCrossNetworkAccess(
    envelope: CrossNetworkMessageEnvelope
  ): Promise<Readonly<FederationVerificationResult>> {
    const originNode = await this.repository.getNode(envelope.originNetworkId);

    // 1. Peer Node Trust Evaluation
    if (!originNode) {
      return Object.freeze({
        allowed: false,
        reason: `Untrusted: Origin network '${envelope.originNetworkId}' is not registered.`,
        originNetworkId: envelope.originNetworkId,
        originCubId: envelope.originCubId,
        trustLevel: 'UNTRUSTED',
      });
    }

    if (originNode.trustLevel !== 'FEDERATED' || originNode.status !== 'ACTIVE') {
      return Object.freeze({
        allowed: false,
        reason: `Restricted: Origin network '${envelope.originNetworkId}' is in '${originNode.trustLevel}' / '${originNode.status}' state.`,
        originNetworkId: envelope.originNetworkId,
        originCubId: envelope.originCubId,
        trustLevel: originNode.trustLevel,
      });
    }

    // 2. Hop Count Validation
    if (envelope.hopCount > envelope.maxHops) {
      return Object.freeze({
        allowed: false,
        reason: `Hop Limit Exceeded: Hop count ${envelope.hopCount} exceeds max limit ${envelope.maxHops}.`,
        originNetworkId: envelope.originNetworkId,
        originCubId: envelope.originCubId,
        trustLevel: originNode.trustLevel,
      });
    }

    // 3. Cryptographic Signature Verification
    const expectedSig = `SIG_${deterministicHash(`${envelope.messageId}:${envelope.originCubId}:${envelope.targetUri}:${originNode.publicKey}`).slice(2, 18)}`;
    if (envelope.signature !== expectedSig) {
      return Object.freeze({
        allowed: false,
        reason: 'Signature Failure: Invalid cross-network message cryptographic signature.',
        originNetworkId: envelope.originNetworkId,
        originCubId: envelope.originCubId,
        trustLevel: originNode.trustLevel,
      });
    }

    // 4. CRITICAL INVARIANT: Local Authorization Evaluation for foreign caller
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: envelope.originCubId,
        action: 'FEDERATION_ROUTE',
        resourceUri: envelope.targetUri,
      });

      if (!decision.allowed) {
        return Object.freeze({
          allowed: false,
          reason: `Local Authorization Denied: Foreign identity '${envelope.originCubId}' has no local access to '${envelope.targetUri}'.`,
          originNetworkId: envelope.originNetworkId,
          originCubId: envelope.originCubId,
          trustLevel: originNode.trustLevel,
        });
      }
    }

    return Object.freeze({
      allowed: true,
      reason: 'Cross-network access verified and authorized.',
      originNetworkId: envelope.originNetworkId,
      originCubId: envelope.originCubId,
      trustLevel: originNode.trustLevel,
    });
  }

  /**
   * Forwards a cross-network message to the local gateway if verified.
   */
  public async forwardCrossNetworkMessage(
    envelope: CrossNetworkMessageEnvelope
  ): Promise<Readonly<GatewayResponseEnvelope>> {
    const startTime = Date.now();
    const verification = await this.evaluateCrossNetworkAccess(envelope);

    if (!verification.allowed) {
      return Object.freeze({
        requestId: envelope.messageId,
        statusCode: 403,
        statusText: 'Forbidden',
        targetUri: envelope.targetUri,
        authenticatedCaller: envelope.originCubId,
        error: `Cross-Network Federation Gate Denied: ${verification.reason}`,
        traceHops: Object.freeze(['FEDERATION_INGRESS', 'FEDERATION_BLOCKED']),
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      });
    }

    // Forward to local gateway if configured
    if (this.stack?.gatewayEngine) {
      return this.stack.gatewayEngine.routeRequest({
        requestId: envelope.messageId,
        targetUri: envelope.targetUri,
        method: envelope.method || 'POST',
        protocol: 'CNC_P2P',
        tokenOrSession: envelope.originCubId, // Sovereign ID
        body: envelope.payload,
        timestamp: Date.now(),
      });
    }

    return Object.freeze({
      requestId: envelope.messageId,
      statusCode: 200,
      statusText: 'OK',
      targetUri: envelope.targetUri,
      authenticatedCaller: envelope.originCubId,
      body: { acknowledged: true, originNetwork: envelope.originNetworkId, forwarded: true },
      traceHops: Object.freeze(['FEDERATION_INGRESS', 'FEDERATION_VERIFIED', 'FEDERATION_EGRESS']),
      durationMs: Date.now() - startTime,
      timestamp: Date.now(),
    });
  }

  /**
   * Sets node trust level (Admin only).
   */
  public async setNodeTrustLevel(
    tokenOrSession: string,
    networkId: string,
    trustLevel: TrustLevel
  ): Promise<Readonly<FederationNode>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'FEDERATION_ADMIN',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/FEDERATION',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'FEDERATION_ADMIN'.`);
      }
    }

    const updated = await this.repository.updateNode(networkId, { trustLevel });
    if (!updated) {
      throw new Error(`Federation Error: Node '${networkId}' not found.`);
    }
    return updated;
  }

  /**
   * Revokes federation status for a peer network.
   */
  public async revokeFederation(
    tokenOrSession: string,
    networkId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'FEDERATION_ADMIN',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/FEDERATION',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'FEDERATION_ADMIN'.`);
      }
    }

    const updated = await this.repository.updateNode(networkId, {
      trustLevel: 'BLOCKED',
      status: 'REVOKED',
    });
    return !!updated;
  }
}
