/**
 * CubiO — Universal Spatial Operating Environment
 * Process 1: Sovereign Communication Identity Manager
 *
 * Resolves communication endpoints strictly from sovereign NET-01 identities (CUB-XXXXXXXX),
 * attaches NET-00 canonical coordinates, associates NET-04 accounts, and enforces
 * communication pairing rules across Users, Agents, Services, and Devices.
 *
 * ARCHITECTURAL INVARIANT:
 * - Every communication participant MUST resolve through NET-01 CubiOIdentityRegistry.
 * - External email addresses, OAuth sub IDs, or temporary IDs are NEVER sovereign communication identities.
 */

import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOIdentityCoordinateAdapter } from '../identity/coordinateAdapter';
import { CubiOAccountService } from '../account/accountService';
import { CubiOAddressRegistry } from '../address/addressRegistry';
import {
  CubiOCommunicationIdentity,
  CommunicationMode,
} from './types';
import { CubiOEntityType } from '../identity/types';

export class CubiOCommunicationIdentityManager {
  private identityRegistry: CubiOIdentityRegistry;
  private accountService: CubiOAccountService;
  private addressRegistry?: CubiOAddressRegistry;

  constructor(
    identityRegistry?: CubiOIdentityRegistry,
    accountService?: CubiOAccountService,
    addressRegistry?: CubiOAddressRegistry
  ) {
    this.identityRegistry = identityRegistry || new CubiOIdentityRegistry();
    this.accountService = accountService || new CubiOAccountService(undefined, this.identityRegistry);
    this.addressRegistry = addressRegistry;
  }

  public getIdentityRegistry(): CubiOIdentityRegistry {
    return this.identityRegistry;
  }

  public getAccountService(): CubiOAccountService {
    return this.accountService;
  }

  public getAddressRegistry(): CubiOAddressRegistry | undefined {
    return this.addressRegistry;
  }

  public setAddressRegistry(addressRegistry: CubiOAddressRegistry): void {
    this.addressRegistry = addressRegistry;
  }

  /**
   * Resolves a sovereign CUB-XXXXXXXX identity into a formal communication identity.
   */
  public async resolveCommunicationIdentity(
    cubId: string
  ): Promise<Readonly<CubiOCommunicationIdentity>> {
    const cleanCubId = cubId.trim();

    // 1. Authoritative lookup in NET-01
    const identity = this.identityRegistry.get(cleanCubId);
    if (!identity) {
      throw new Error(
        `Communication Identity Error: Sovereign Identity '${cleanCubId}' does not exist in NET-01 registry.`
      );
    }

    // 2. Authoritative account lookup in NET-04 (if user)
    let account;
    if (identity.type === 'USER') {
      account = await this.accountService.getAccount(cleanCubId);
    }

    // 3. Resolve registered addresses
    let omailAddress = account?.omailAddress;
    let cubioAddress = account?.cubioAddress;

    if (this.addressRegistry) {
      const addresses = await this.addressRegistry.getAddressesForIdentity(cleanCubId);
      const omail = addresses.find((a) => a.type === 'OMAIL_FREE' && a.status === 'OWNED');
      if (omail) omailAddress = omail.fullAddress;

      const premium = addresses.find((a) => a.type === 'CUBIO_PREMIUM' && a.status === 'OWNED');
      if (premium) cubioAddress = premium.fullAddress;
    }

    // 4. Authoritative coordinate mapping in NET-00
    const coordinateUri = CubiOIdentityCoordinateAdapter.formatIdentityAddress(identity, {
      dimension: account?.settings?.defaultDimension || 0,
      zone: account?.settings?.defaultZone || 1,
    });

    // 5. Determine capabilities by entity type
    const capabilities = this.getCapabilitiesForEntityType(identity.type);

    const displayName =
      account?.displayName ||
      identity.name ||
      `${identity.type}_${cleanCubId.slice(4)}`;

    return Object.freeze({
      cubId: cleanCubId,
      entityType: identity.type,
      displayName,
      coordinateUri,
      account,
      omailAddress,
      cubioAddress,
      status: 'ONLINE',
      capabilities: Object.freeze(capabilities),
    });
  }

  /**
   * Resolves a public email address (@omail.com or @cubio.com) to a full communication identity.
   */
  public async resolveCommunicationIdentityByAddress(
    addressString: string
  ): Promise<Readonly<CubiOCommunicationIdentity>> {
    const clean = addressString.trim().toLowerCase();

    // 1. Resolve via Address Registry if available
    if (this.addressRegistry) {
      const res = await this.addressRegistry.resolveAddress(clean);
      if (res.found && res.cubId) {
        return this.resolveCommunicationIdentity(res.cubId);
      }
    }

    // 2. Fallback: Lookup account by username if @omail.com
    if (clean.endsWith('@omail.com')) {
      const username = clean.replace('@omail.com', '');
      const account = await this.accountService.getAccountByUsername(username);
      if (account) {
        return this.resolveCommunicationIdentity(account.cubId);
      }
    }

    throw new Error(`Communication Identity Error: Address '${addressString}' could not be resolved to any sovereign identity.`);
  }

  /**
   * Validates and classifies an entity-to-entity communication pair.
   */
  public async validateCommunicationPair(
    senderCubId: string,
    recipientCubId: string
  ): Promise<{
    sender: CubiOCommunicationIdentity;
    recipient: CubiOCommunicationIdentity;
    communicationMode: CommunicationMode;
  }> {
    const sender = await this.resolveCommunicationIdentity(senderCubId);
    const recipient = await this.resolveCommunicationIdentity(recipientCubId);
    const communicationMode = this.determineCommunicationMode(sender.entityType, recipient.entityType);

    return {
      sender,
      recipient,
      communicationMode,
    };
  }

  /**
   * Classifies the communication mode based on sender and recipient entity types.
   */
  public determineCommunicationMode(
    senderType: CubiOEntityType,
    recipientType: CubiOEntityType
  ): CommunicationMode {
    if (senderType === 'USER' && recipientType === 'USER') {
      return 'USER_USER';
    }
    if ((senderType === 'USER' && recipientType === 'AGENT') || (senderType === 'AGENT' && recipientType === 'USER')) {
      return 'USER_AGENT';
    }
    if ((senderType === 'USER' && recipientType === 'SERVICE') || (senderType === 'SERVICE' && recipientType === 'USER')) {
      return 'USER_SERVICE';
    }
    if (senderType === 'AGENT' && recipientType === 'AGENT') {
      return 'AGENT_AGENT';
    }
    if (senderType === 'SERVICE' && recipientType === 'SERVICE') {
      return 'SERVICE_SERVICE';
    }

    // Default fallback for devices / mixed
    if (senderType === 'USER' || recipientType === 'USER') {
      return 'USER_SERVICE';
    }
    return 'SERVICE_SERVICE';
  }

  private getCapabilitiesForEntityType(entityType: CubiOEntityType): string[] {
    switch (entityType) {
      case 'USER':
        return ['DIRECT_MSG', 'CHANNEL_MSG', 'AGENT_INVOKE', 'SERVICE_INVOKE', 'SPATIAL_CHAT'];
      case 'AGENT':
        return ['AGENT_REASONING', 'DIRECT_MSG', 'CHANNEL_MSG', 'TOOL_RPC', 'AGENT_AGENT_DISPATCH'];
      case 'SERVICE':
        return ['SERVICE_RPC', 'SERVICE_STREAM', 'EVENT_BROADCAST', 'DIRECT_MSG'];
      case 'DEVICE':
        return ['TELEMETRY_SEND', 'SPATIAL_SYNC', 'DIRECT_MSG'];
      default:
        return ['DIRECT_MSG'];
    }
  }
}
