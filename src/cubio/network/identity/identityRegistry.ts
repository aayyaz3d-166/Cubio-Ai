/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: Sovereign CubiO Identity Registry
 *
 * Master in-memory registry managing the lifecycle, resolution, binding,
 * and multi-provider mapping for all CubiO Identities.
 *
 * Invariant:
 * 1. Global uniqueness of CubiO IDs (CUB-XXXXXXXX).
 * 2. Conflicting provider subject mappings are rejected across distinct identities.
 * 3. Type-safe bindings between Users, Devices, Agents, and Services.
 */

import { CubiOIdGenerator } from './idGenerator';
import { CubiOBindingManager } from './bindings';
import { CubiOProviderLinkManager } from './providerLinking';
import { CubiOProvenanceManager } from './provenance';
import {
  CubiOIdentity,
  CubiOEntityType,
  CubiOIdentityStatus,
  EntityBindingRelation,
  ExternalProviderLink,
  ExternalProviderType,
} from './types';

export class CubiOIdentityRegistry {
  private identities: Map<string, CubiOIdentity> = new Map();
  // Index: providerKey (`${provider}:${subjectId}`) -> cubId
  private providerIndex: Map<string, string> = new Map();

  /**
   * Registers a valid CubiOIdentity.
   * Throws if duplicate ID or conflicting provider mapping exists.
   */
  public register(identity: CubiOIdentity): Readonly<CubiOIdentity> {
    const validation = CubiOIdGenerator.validate(identity);
    if (!validation.isValid) {
      const errorMsg = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Cannot register invalid identity: ${errorMsg}`);
    }

    if (this.identities.has(identity.cubId)) {
      throw new Error(`Identity with ID '${identity.cubId}' is already registered.`);
    }

    // Verify no conflicting provider links
    for (const link of identity.providers) {
      const providerKey = `${link.provider}:${link.subjectId}`;
      const existingCubId = this.providerIndex.get(providerKey);
      if (existingCubId && existingCubId !== identity.cubId) {
        throw new Error(
          `Conflicting provider mapping: provider '${link.provider}' subject '${link.subjectId}' is already linked to '${existingCubId}'.`
        );
      }
    }

    // Store identity and index providers
    this.identities.set(identity.cubId, identity);
    for (const link of identity.providers) {
      const providerKey = `${link.provider}:${link.subjectId}`;
      this.providerIndex.set(providerKey, identity.cubId);
    }

    return identity;
  }

  /**
   * Helper factory to create and register an identity in one atomic step.
   */
  public createAndRegister(
    type: CubiOEntityType,
    canonicalSeed: string,
    options: {
      name?: string;
      status?: CubiOIdentityStatus;
      initialProvider?: ExternalProviderLink;
      originSource?: string;
      metadata?: Record<string, any>;
      createdAt?: number;
    } = {}
  ): Readonly<CubiOIdentity> {
    const identity = CubiOIdGenerator.create(type, canonicalSeed, options);
    return this.register(identity);
  }

  /**
   * Looks up an identity by its canonical CUB-XXXXXXXX identifier.
   */
  public get(cubId: string): Readonly<CubiOIdentity> | undefined {
    return this.identities.get(cubId.trim());
  }

  /**
   * Checks if an identity exists.
   */
  public has(cubId: string): boolean {
    return this.identities.has(cubId.trim());
  }

  /**
   * Resolves an external provider subject claim (e.g. Google sub) to its sovereign CubiO Identity.
   */
  public resolveByProvider(
    provider: ExternalProviderType,
    subjectId: string
  ): Readonly<CubiOIdentity> | undefined {
    const providerKey = `${provider}:${subjectId.trim()}`;
    const cubId = this.providerIndex.get(providerKey);
    if (!cubId) return undefined;
    return this.get(cubId);
  }

  /**
   * Links a new external provider account to an existing identity.
   */
  public linkProvider(
    cubId: string,
    link: ExternalProviderLink
  ): Readonly<CubiOIdentity> {
    const identity = this.get(cubId);
    if (!identity) {
      throw new Error(`Cannot link provider: identity '${cubId}' not found.`);
    }

    const providerKey = `${link.provider}:${link.subjectId}`;
    const existingCubId = this.providerIndex.get(providerKey);
    if (existingCubId && existingCubId !== cubId) {
      throw new Error(
        `Conflicting provider mapping: provider '${link.provider}' subject '${link.subjectId}' is already linked to '${existingCubId}'.`
      );
    }

    const updated = CubiOProviderLinkManager.linkProvider(identity, link);
    this.identities.set(cubId, updated);
    this.providerIndex.set(providerKey, cubId);

    return updated;
  }

  /**
   * Unlinks an external provider account from an existing identity.
   */
  public unlinkProvider(
    cubId: string,
    provider: ExternalProviderType,
    subjectId: string
  ): Readonly<CubiOIdentity> {
    const identity = this.get(cubId);
    if (!identity) {
      throw new Error(`Cannot unlink provider: identity '${cubId}' not found.`);
    }

    const updated = CubiOProviderLinkManager.unlinkProvider(identity, provider, subjectId);
    this.identities.set(cubId, updated);
    this.providerIndex.delete(`${provider}:${subjectId}`);

    return updated;
  }

  /**
   * Binds a target entity to a parent identity with type validation.
   */
  public bind(
    parentCubId: string,
    targetCubId: string,
    relation: EntityBindingRelation,
    metadata?: Record<string, any>
  ): boolean {
    const parent = this.get(parentCubId);
    const target = this.get(targetCubId);

    if (!parent) {
      throw new Error(`Binding failed: parent identity '${parentCubId}' not found.`);
    }
    if (!target) {
      throw new Error(`Binding failed: target identity '${targetCubId}' not found.`);
    }

    const validation = CubiOBindingManager.validateBinding(parent, target, relation);
    if (!validation.isValid) {
      throw new Error(`Binding validation rejected: ${validation.error}`);
    }

    const updated = CubiOBindingManager.addBinding(
      parent,
      target.cubId,
      target.type,
      relation,
      { metadata }
    );
    this.identities.set(parentCubId, updated);
    return true;
  }

  /**
   * Unbinds a target entity from a parent identity.
   */
  public unbind(parentCubId: string, targetCubId: string): boolean {
    const parent = this.get(parentCubId);
    if (!parent) {
      throw new Error(`Unbinding failed: parent identity '${parentCubId}' not found.`);
    }

    const updated = CubiOBindingManager.removeBinding(parent, targetCubId);
    this.identities.set(parentCubId, updated);
    return true;
  }

  /**
   * Updates an identity's lifecycle status.
   */
  public setStatus(
    cubId: string,
    status: CubiOIdentityStatus,
    reason = 'Administrative update'
  ): boolean {
    const identity = this.get(cubId);
    if (!identity) return false;

    const updatedProvenance = CubiOProvenanceManager.appendAuditEvent(
      identity.provenance,
      'STATUS_CHANGED',
      `Status changed from '${identity.status}' to '${status}': ${reason}.`
    );

    const updated: CubiOIdentity = Object.freeze({
      ...identity,
      status,
      provenance: updatedProvenance,
    });

    this.identities.set(cubId, updated);
    return true;
  }

  /**
   * Lists all identities with optional filtering.
   */
  public list(filter?: {
    type?: CubiOEntityType;
    status?: CubiOIdentityStatus;
  }): readonly CubiOIdentity[] {
    let result = Array.from(this.identities.values());

    if (filter?.type) {
      result = result.filter((i) => i.type === filter.type);
    }
    if (filter?.status) {
      result = result.filter((i) => i.status === filter.status);
    }

    return Object.freeze(result.sort((a, b) => a.cubId.localeCompare(b.cubId)));
  }

  /**
   * Returns total count of registered identities.
   */
  public count(): number {
    return this.identities.size;
  }

  /**
   * Clears the registry.
   */
  public clear(): void {
    this.identities.clear();
    this.providerIndex.clear();
  }
}
