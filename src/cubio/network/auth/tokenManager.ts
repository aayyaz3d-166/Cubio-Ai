/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Cryptographic Token Manager
 *
 * Implements token issuance, verification, tampering detection, and expiration validation.
 *
 * Security Invariant:
 * Server signing secrets must remain server-side and are NEVER exposed to client bundles.
 */

import { CubiOCryptoEngine } from '../../security/crypto';
import { CubiOAuthToken, AuthenticationProviderType } from './types';

export class CubiOTokenManager {
  private serverSecret: string;
  private defaultTtlSeconds: number;

  constructor(serverSecret = 'CUBIO_AUTH_SERVER_SECRET_DEFAULT', defaultTtlSeconds = 3600) {
    this.serverSecret = serverSecret;
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  /**
   * Issues a signed cryptographic session token.
   */
  public issueToken(
    sessionId: string,
    cubId: string,
    provider: AuthenticationProviderType,
    ttlSeconds?: number,
    issuedAt = Date.now()
  ): Readonly<CubiOAuthToken> {
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    const expiresAt = issuedAt + ttl * 1000;
    const payload = `${sessionId}:${cubId}:${provider}:${issuedAt}:${expiresAt}`;
    const tokenSignature = CubiOCryptoEngine.signMessage(payload, this.serverSecret);

    // Format token string: CUBTOK.<encodedPayload>.<sig>
    const encodedPayload = Buffer.from(payload).toString('base64url');
    const token = `CUBTOK.${encodedPayload}.${tokenSignature}`;

    return Object.freeze({
      token,
      sessionId,
      cubId,
      provider,
      issuedAt,
      expiresAt,
      tokenSignature,
    });
  }

  /**
   * Verifies and decodes a session token string.
   */
  public verifyToken(tokenString: string): {
    isValid: boolean;
    sessionId?: string;
    cubId?: string;
    provider?: AuthenticationProviderType;
    issuedAt?: number;
    expiresAt?: number;
    error?: string;
  } {
    if (!tokenString || typeof tokenString !== 'string') {
      return { isValid: false, error: 'Empty or malformed token string.' };
    }

    const parts = tokenString.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'CUBTOK') {
      return { isValid: false, error: 'Invalid token format (must be CUBTOK.<payload>.<signature>).' };
    }

    const [, encodedPayload, signature] = parts;
    let payloadStr: string;
    try {
      payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    } catch {
      return { isValid: false, error: 'Failed to decode token base64 payload.' };
    }

    const [sessionId, cubId, provider, issuedAtStr, expiresAtStr] = payloadStr.split(':');
    if (!sessionId || !cubId || !provider || !issuedAtStr || !expiresAtStr) {
      return { isValid: false, error: 'Malformed token payload structure.' };
    }

    const issuedAt = Number(issuedAtStr);
    const expiresAt = Number(expiresAtStr);

    // 1. Verify digital signature against server secret
    const isSigValid = CubiOCryptoEngine.verifySignature(payloadStr, signature, this.serverSecret);
    if (!isSigValid) {
      return { isValid: false, error: 'Token signature verification failed (tampering detected).' };
    }

    // 2. Check expiration
    if (Date.now() > expiresAt) {
      return { isValid: false, error: `Token expired at ${new Date(expiresAt).toISOString()}.` };
    }

    return {
      isValid: true,
      sessionId,
      cubId,
      provider,
      issuedAt,
      expiresAt,
    };
  }
}
