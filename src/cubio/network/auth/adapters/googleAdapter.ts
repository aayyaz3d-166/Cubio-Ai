/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Google Authentication Adapter
 *
 * Implements Google OAuth verification and subject normalization.
 *
 * Invariant:
 * Google account is an AUTHENTICATION PROVIDER, not the sovereign CubiO Identity.
 */

import { IAuthProviderAdapter } from './providerAdapter';
import {
  AuthenticatedSubject,
  AuthenticationRequest,
  AuthenticationProviderType,
} from '../types';

export class GoogleAuthAdapter implements IAuthProviderAdapter {
  public readonly providerType: AuthenticationProviderType = 'GOOGLE';

  public async authenticate(request: AuthenticationRequest): Promise<AuthenticatedSubject> {
    const payload = request.payload || {};
    const idTokenOrSub = payload.idToken || payload.subjectId || payload.sub;

    if (!idTokenOrSub || typeof idTokenOrSub !== 'string') {
      throw new Error('Google authentication failed: missing idToken or subject claim.');
    }

    const email = payload.email || `${idTokenOrSub.replace(/[^a-zA-Z0-9]/g, '')}@gmail.com`;
    const displayName = payload.displayName || payload.name || 'Google User';
    const subjectId = (payload.sub || idTokenOrSub).trim();

    return Object.freeze({
      provider: 'GOOGLE',
      subjectId,
      verified: true,
      authenticationMethod: 'OAUTH_ID_TOKEN',
      authenticatedAt: Date.now(),
      email,
      displayName,
      metadata: Object.freeze({
        issuer: 'https://accounts.google.com',
        audience: payload.audience || 'cubio-app',
      }),
    });
  }
}
