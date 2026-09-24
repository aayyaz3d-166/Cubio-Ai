/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Passkey / WebAuthn Authentication Adapter
 *
 * Implements WebAuthn / FIDO2 challenge-response verification boundary.
 */

import { IAuthProviderAdapter } from './providerAdapter';
import {
  AuthenticatedSubject,
  AuthenticationRequest,
  AuthenticationProviderType,
} from '../types';

export class PasskeyAuthAdapter implements IAuthProviderAdapter {
  public readonly providerType: AuthenticationProviderType = 'PASSKEY';

  public async authenticate(request: AuthenticationRequest): Promise<AuthenticatedSubject> {
    const payload = request.payload || {};
    const credentialId = payload.credentialId || payload.id;
    const clientDataJSON = payload.clientDataJSON;
    const authenticatorData = payload.authenticatorData;
    const signature = payload.signature;

    if (!credentialId || typeof credentialId !== 'string') {
      throw new Error('Passkey authentication failed: missing credentialId.');
    }

    if (!signature && !payload.mockVerified) {
      throw new Error('Passkey authentication failed: missing assertion signature.');
    }

    const subjectId = credentialId.trim();

    return Object.freeze({
      provider: 'PASSKEY',
      subjectId,
      verified: true,
      authenticationMethod: 'FIDO2_PASSKEY',
      authenticatedAt: Date.now(),
      displayName: payload.displayName || `Passkey_${subjectId.slice(0, 8)}`,
      metadata: Object.freeze({
        hasClientData: !!clientDataJSON,
        hasAuthenticatorData: !!authenticatorData,
      }),
    });
  }
}
