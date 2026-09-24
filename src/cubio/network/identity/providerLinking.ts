/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: Multi-Provider Identity Linking
 *
 * Manages 1:N linkages between Sovereign CubiO IDs and external authentication providers
 * (e.g. Google, Native Credentials, Web3, Passkeys, Enterprise OIDC).
 */

import { CubiOProvenanceManager } from './provenance';
import {
  CubiOIdentity,
  ExternalProviderLink,
  ExternalProviderType,
} from './types';

export class CubiOProviderLinkManager {
  /**
   * Links an external authentication provider account to a CubiO Identity.
   */
  public static linkProvider(
    identity: CubiOIdentity,
    link: ExternalProviderLink
  ): Readonly<CubiOIdentity> {
    const existing = identity.providers.find(
      (p) => p.provider === link.provider && p.subjectId === link.subjectId
    );
    if (existing) {
      throw new Error(
        `Provider '${link.provider}' with subject '${link.subjectId}' is already linked to '${identity.cubId}'.`
      );
    }

    const newLink: ExternalProviderLink = Object.freeze({
      provider: link.provider,
      subjectId: link.subjectId,
      email: link.email,
      displayName: link.displayName,
      linkedAt: link.linkedAt || Date.now(),
      metadata: Object.freeze({ ...(link.metadata || {}) }),
    });

    const updatedProvenance = CubiOProvenanceManager.appendAuditEvent(
      identity.provenance,
      'PROVIDER_LINKED',
      `Linked external provider '${link.provider}' (subject: ${link.subjectId}${link.email ? `, email: ${link.email}` : ''}).`,
      'SYSTEM',
      newLink.linkedAt
    );

    return Object.freeze({
      ...identity,
      providers: Object.freeze([...identity.providers, newLink]),
      provenance: updatedProvenance,
    });
  }

  /**
   * Unlinks an external provider account from an identity.
   */
  public static unlinkProvider(
    identity: CubiOIdentity,
    provider: ExternalProviderType,
    subjectId: string,
    unlinkedAt = Date.now()
  ): Readonly<CubiOIdentity> {
    const existing = identity.providers.find(
      (p) => p.provider === provider && p.subjectId === subjectId
    );
    if (!existing) {
      throw new Error(
        `Provider '${provider}' with subject '${subjectId}' is not linked to '${identity.cubId}'.`
      );
    }

    const updatedProviders = identity.providers.filter(
      (p) => !(p.provider === provider && p.subjectId === subjectId)
    );

    const updatedProvenance = CubiOProvenanceManager.appendAuditEvent(
      identity.provenance,
      'PROVIDER_UNLINKED',
      `Unlinked provider '${provider}' (subject: ${subjectId}).`,
      'SYSTEM',
      unlinkedAt
    );

    return Object.freeze({
      ...identity,
      providers: Object.freeze(updatedProviders),
      provenance: updatedProvenance,
    });
  }

  /**
   * Finds the first link for a specified provider type.
   */
  public static findProviderLink(
    identity: CubiOIdentity,
    provider: ExternalProviderType
  ): Readonly<ExternalProviderLink> | undefined {
    return identity.providers.find((p) => p.provider === provider);
  }

  /**
   * Checks if an identity has a link matching provider + subjectId.
   */
  public static hasProviderLink(
    identity: CubiOIdentity,
    provider: ExternalProviderType,
    subjectId: string
  ): boolean {
    return identity.providers.some((p) => p.provider === provider && p.subjectId === subjectId);
  }
}
