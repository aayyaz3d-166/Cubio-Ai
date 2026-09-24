/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-04: Sovereign CubiO Account Service
 *
 * Manages user accounts, profiles, settings, and lifecycle state.
 *
 * Invariant:
 * Account belongs to a sovereign CubiO Identity (CUB-XXXXXXXX).
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import {
  CubiOAccount,
  AccountSettings,
  AccountUpdateInput,
  AccountTier,
  AccountStatus,
} from './types';
import { IAccountRepository } from './repositories/types';
import { MemoryAccountRepository } from './repositories/memoryRepositories';

export class CubiOAccountService {
  private repository: IAccountRepository;
  private identityRegistry: CubiOIdentityRegistry;

  constructor(repository?: IAccountRepository, identityRegistry?: CubiOIdentityRegistry) {
    this.repository = repository || new MemoryAccountRepository();
    this.identityRegistry = identityRegistry || new CubiOIdentityRegistry();
  }

  public getRepository(): IAccountRepository {
    return this.repository;
  }

  /**
   * Creates a new sovereign CubiO account linked to an existing CUB-XXXXXXXX identity.
   */
  public async createAccount(
    cubId: string,
    input: {
      username: string;
      email?: string;
      omailAddress?: string;
      cubioAddress?: string;
      displayName?: string;
      avatarUrl?: string;
      tier?: AccountTier;
      settings?: Partial<AccountSettings>;
      createdAt?: number;
    }
  ): Promise<Readonly<CubiOAccount>> {
    const cleanCubId = cubId.trim();
    const cleanUsername = input.username.trim().toLowerCase();

    // 1. Verify identity exists in NET-01
    if (!this.identityRegistry.has(cleanCubId)) {
      throw new Error(`Cannot create account: Sovereign Identity '${cleanCubId}' not found in NET-01 registry.`);
    }

    // 2. Check if account already exists for this CUB ID
    const existingForCubId = await this.repository.getAccountByCubId(cleanCubId);
    if (existingForCubId) {
      throw new Error(`Account already exists for sovereign identity '${cleanCubId}'.`);
    }

    // 3. Check if username is already taken
    const existingUsername = await this.repository.getAccountByUsername(cleanUsername);
    if (existingUsername) {
      throw new Error(`Username '${cleanUsername}' is already taken.`);
    }

    const now = input.createdAt || Date.now();
    const accountId = `ACC_${deterministicHash(`${cleanCubId}:${cleanUsername}:${now}`).slice(2, 18)}`;

    const defaultSettings: AccountSettings = Object.freeze({
      notificationsEnabled: true,
      defaultDimension: 0,
      defaultZone: 1,
      theme: 'SPATIAL',
      privacyLevel: 'PUBLIC',
      ...(input.settings || {}),
    });

    const omailAddress = input.omailAddress || `${cleanUsername}@omail.com`;

    const account: CubiOAccount = Object.freeze({
      accountId,
      cubId: cleanCubId,
      username: cleanUsername,
      email: input.email,
      omailAddress,
      cubioAddress: input.cubioAddress,
      displayName: input.displayName || input.username,
      avatarUrl: input.avatarUrl,
      tier: input.tier || 'FREE',
      status: 'ACTIVE',
      settings: defaultSettings,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveAccount(account);
    return account;
  }

  /**
   * Retrieves an account by sovereign CUB ID or Account ID.
   */
  public async getAccount(cubIdOrAccountId: string): Promise<Readonly<CubiOAccount> | undefined> {
    const raw = cubIdOrAccountId.trim();
    if (raw.startsWith('CUB-')) {
      return this.repository.getAccountByCubId(raw);
    }
    return this.repository.getAccountById(raw);
  }

  /**
   * Retrieves an account by username.
   */
  public async getAccountByUsername(username: string): Promise<Readonly<CubiOAccount> | undefined> {
    return this.repository.getAccountByUsername(username.trim().toLowerCase());
  }

  /**
   * Updates profile fields.
   */
  public async updateProfile(
    cubId: string,
    update: AccountUpdateInput
  ): Promise<Readonly<CubiOAccount>> {
    const existing = await this.getAccount(cubId);
    if (!existing) {
      throw new Error(`Account not found for identity '${cubId}'.`);
    }

    const updatedSettings: AccountSettings = update.settings
      ? Object.freeze({ ...existing.settings, ...update.settings })
      : existing.settings;

    const updated: CubiOAccount = Object.freeze({
      ...existing,
      displayName: update.displayName !== undefined ? update.displayName : existing.displayName,
      email: update.email !== undefined ? update.email : existing.email,
      omailAddress: update.omailAddress !== undefined ? update.omailAddress : existing.omailAddress,
      cubioAddress: update.cubioAddress !== undefined ? update.cubioAddress : existing.cubioAddress,
      avatarUrl: update.avatarUrl !== undefined ? update.avatarUrl : existing.avatarUrl,
      tier: update.tier !== undefined ? update.tier : existing.tier,
      settings: updatedSettings,
      updatedAt: Date.now(),
    });

    await this.repository.saveAccount(updated);
    return updated;
  }

  /**
   * Updates account tier.
   */
  public async updateTier(cubId: string, tier: AccountTier): Promise<Readonly<CubiOAccount>> {
    return this.updateProfile(cubId, { tier });
  }

  /**
   * Updates account lifecycle status.
   */
  public async setStatus(cubId: string, status: AccountStatus): Promise<boolean> {
    return this.repository.updateAccountStatus(cubId.trim(), status);
  }

  /**
   * Deletes an account.
   */
  public async deleteAccount(cubId: string): Promise<boolean> {
    return this.repository.deleteAccount(cubId.trim());
  }
}
