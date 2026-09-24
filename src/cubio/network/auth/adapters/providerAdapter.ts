/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Authentication Provider Adapter Interface
 *
 * Pluggable boundary for external and native identity providers.
 */

import {
  AuthenticatedSubject,
  AuthenticationRequest,
  AuthenticationProviderType,
} from '../types';

export interface IAuthProviderAdapter {
  readonly providerType: AuthenticationProviderType;

  /**
   * Validates and authenticates the provider payload, returning a normalized AuthenticatedSubject.
   */
  authenticate(request: AuthenticationRequest): Promise<AuthenticatedSubject>;
}
