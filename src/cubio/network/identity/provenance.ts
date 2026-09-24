/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: Identity Provenance & Audit Trail
 *
 * Implements deterministic provenance tracking, creator source attribution,
 * and append-only cryptographic audit event chains.
 */

import { deterministicHash } from '../../state/determinism';
import {
  CubiOEntityType,
  IdentityProvenance,
  IdentityAuditEvent,
  ExternalProviderType,
  CubiOIdentity,
} from './types';

export class CubiOProvenanceManager {
  /**
   * Generates the initial provenance record for an identity.
   */
  public static createInitialProvenance(
    type: CubiOEntityType,
    canonicalSeed: string,
    creatorProvider: ExternalProviderType = 'CUBIO_NATIVE',
    originSource = 'NATIVE_GENESIS',
    establishedAt = Date.now()
  ): Readonly<IdentityProvenance> {
    const canonicalSeedHash = `0xSEED_${deterministicHash(`${type}:${canonicalSeed.trim()}`).slice(2, 18)}`;
    const eventId = `EVT_${deterministicHash(`${canonicalSeedHash}:CREATED:${establishedAt}`).slice(2, 12)}`;

    const initialEvent: IdentityAuditEvent = Object.freeze({
      eventId,
      action: 'CREATED',
      timestamp: establishedAt,
      details: `Identity initialized with type '${type}' via provider '${creatorProvider}'.`,
      performedBy: 'SYSTEM',
    });

    return Object.freeze({
      originSource,
      canonicalSeedHash,
      establishedAt,
      creatorProvider,
      auditTrail: Object.freeze([initialEvent]),
    });
  }

  /**
   * Appends an auditable event to the identity's provenance trail.
   */
  public static appendAuditEvent(
    provenance: IdentityProvenance,
    action: IdentityAuditEvent['action'],
    details: string,
    performedBy = 'SYSTEM',
    timestamp = Date.now()
  ): Readonly<IdentityProvenance> {
    const eventId = `EVT_${deterministicHash(`${provenance.canonicalSeedHash}:${action}:${provenance.auditTrail.length + 1}:${timestamp}`).slice(2, 12)}`;

    const newEvent: IdentityAuditEvent = Object.freeze({
      eventId,
      action,
      timestamp,
      details,
      performedBy,
    });

    return Object.freeze({
      ...provenance,
      auditTrail: Object.freeze([...provenance.auditTrail, newEvent]),
    });
  }

  /**
   * Verifies that an identity's provenance seed hash matches the expected canonical seed.
   */
  public static verifyProvenanceIntegrity(
    identity: CubiOIdentity,
    canonicalSeed: string
  ): boolean {
    const expectedHash = `0xSEED_${deterministicHash(`${identity.type}:${canonicalSeed.trim()}`).slice(2, 18)}`;
    return identity.provenance.canonicalSeedHash === expectedHash;
  }
}
