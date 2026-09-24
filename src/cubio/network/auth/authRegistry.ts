/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Authentication Provider Registry
 *
 * Manages the registration, lookup, and dispatch of authentication provider adapters.
 *
 * Invariant:
 * Decoupled from CubiOIdentityRegistry (NET-01).
 */

import { IAuthProviderAdapter } from './adapters/providerAdapter';
import { GoogleAuthAdapter } from './adapters/googleAdapter';
import { CubiONativeAuthAdapter } from './adapters/nativeAdapter';
import { PasskeyAuthAdapter } from './adapters/passkeyAdapter';
import { Web3AuthAdapter } from './adapters/web3Adapter';
import { AuthenticationProviderType } from './types';

export class CubiOAuthRegistry {
  private adapters: Map<string, IAuthProviderAdapter> = new Map();

  constructor(registerDefaults = true) {
    if (registerDefaults) {
      this.registerAdapter(new GoogleAuthAdapter());
      this.registerAdapter(new CubiONativeAuthAdapter());
      this.registerAdapter(new PasskeyAuthAdapter());
      this.registerAdapter(new Web3AuthAdapter());
    }
  }

  /**
   * Registers a provider adapter.
   */
  public registerAdapter(adapter: IAuthProviderAdapter): void {
    const key = adapter.providerType.toUpperCase();
    this.adapters.set(key, adapter);
  }

  /**
   * Unregisters a provider adapter.
   */
  public unregisterAdapter(providerType: AuthenticationProviderType): boolean {
    return this.adapters.delete(providerType.toUpperCase());
  }

  /**
   * Retrieves an adapter for a given provider type.
   */
  public getAdapter(providerType: AuthenticationProviderType): IAuthProviderAdapter | undefined {
    return this.adapters.get(providerType.toUpperCase());
  }

  /**
   * Checks if an adapter is registered.
   */
  public hasAdapter(providerType: AuthenticationProviderType): boolean {
    return this.adapters.has(providerType.toUpperCase());
  }

  /**
   * Lists all registered provider types.
   */
  public listProviders(): readonly AuthenticationProviderType[] {
    return Object.freeze(Array.from(this.adapters.keys()));
  }
}
