/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Native CubiO Authentication Adapter
 *
 * Implements native credential validation using salted hashes.
 */

import { IAuthProviderAdapter } from './providerAdapter';
import { CubiOCredentialManager } from '../credentialManager';
import {
  AuthenticatedSubject,
  AuthenticationRequest,
  AuthenticationProviderType,
} from '../types';

export class CubiONativeAuthAdapter implements IAuthProviderAdapter {
  public readonly providerType: AuthenticationProviderType = 'CUBIO_NATIVE';
  private credentialManager: CubiOCredentialManager;

  constructor(credentialManager?: CubiOCredentialManager) {
    this.credentialManager = credentialManager || new CubiOCredentialManager();
  }

  public getCredentialManager(): CubiOCredentialManager {
    return this.credentialManager;
  }

  public async authenticate(request: AuthenticationRequest): Promise<AuthenticatedSubject> {
    const payload = request.payload || {};
    const username = payload.username || payload.subjectId;
    const password = payload.password;

    if (!username || typeof username !== 'string') {
      throw new Error('Native authentication failed: username is required.');
    }
    if (!password || typeof password !== 'string') {
      throw new Error('Native authentication failed: password is required.');
    }

    const isValid = await this.credentialManager.verifyPassword(username, password);
    if (!isValid) {
      throw new Error('Native authentication failed: invalid username or password.');
    }

    const subjectId = username.trim().toLowerCase();

    return Object.freeze({
      provider: 'CUBIO_NATIVE',
      subjectId,
      verified: true,
      authenticationMethod: 'PASSWORD',
      authenticatedAt: Date.now(),
      displayName: payload.displayName || username,
      email: payload.email,
    });
  }
}
