/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 10 & NET-01: CubiO Identity & Provenance Manager
 *
 * Manages cryptographic peer identities, public keys, and provenance signatures,
 * and exports the sovereign NET-01 CubiO Identity subsystem.
 */

import { deterministicHash } from '../state/determinism';
import { NetworkUserNode } from './types';

export class CubiOIdentityManager {
  /**
   * Generates a deterministic peer identity for a user.
   */
  public static createUserIdentity(
    userId: string,
    displayName: string,
    role: NetworkUserNode['role'] = 'CONTRIBUTOR',
    options: { customPublicKey?: string; bandwidthBps?: number } = {}
  ): Readonly<NetworkUserNode> {
    const peerId = `PEER_${deterministicHash(userId + displayName).slice(2, 12)}`;
    const publicKey =
      options.customPublicKey || `0xPUB_${deterministicHash(userId + ':PUBLIC_KEY_SEED').slice(2, 34)}`;

    return Object.freeze({
      userId,
      peerId,
      displayName,
      role,
      publicKey,
      status: 'ONLINE',
      latencyMs: 12,
      bandwidthBps: options.bandwidthBps || 100_000_000, // 100 Mbps
      connectedAt: Date.now(),
    });
  }

  /**
   * Signs a payload deterministically with an identity secret / seed.
   */
  public static signPayload(payload: any, identitySeed: string): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return `0xSIG_${deterministicHash(serialized + ':' + identitySeed).slice(2, 34)}`;
  }

  /**
   * Verifies the cryptographic signature of a payload.
   */
  public static verifySignature(
    payload: any,
    signature: string,
    expectedIdentitySeed: string
  ): boolean {
    const expectedSig = this.signPayload(payload, expectedIdentitySeed);
    return signature === expectedSig;
  }
}

export * from './identity/index';
