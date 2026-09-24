/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-04: In-Memory Account Repository
 */

import { CubiOAccount, AccountStatus } from '../types';
import { IAccountRepository } from './types';

export class MemoryAccountRepository implements IAccountRepository {
  private accountsByCubId: Map<string, CubiOAccount> = new Map();
  private accountsById: Map<string, CubiOAccount> = new Map();
  private accountsByUsername: Map<string, string> = new Map(); // username -> cubId

  public async saveAccount(account: CubiOAccount): Promise<void> {
    const frozen = Object.freeze({ ...account });
    this.accountsByCubId.set(account.cubId, frozen);
    this.accountsById.set(account.accountId, frozen);
    this.accountsByUsername.set(account.username.toLowerCase(), account.cubId);
  }

  public async getAccountByCubId(cubId: string): Promise<CubiOAccount | undefined> {
    return this.accountsByCubId.get(cubId.trim());
  }

  public async getAccountById(accountId: string): Promise<CubiOAccount | undefined> {
    return this.accountsById.get(accountId.trim());
  }

  public async getAccountByUsername(username: string): Promise<CubiOAccount | undefined> {
    const cubId = this.accountsByUsername.get(username.trim().toLowerCase());
    if (!cubId) return undefined;
    return this.getAccountByCubId(cubId);
  }

  public async updateAccountStatus(cubId: string, status: AccountStatus): Promise<boolean> {
    const existing = this.accountsByCubId.get(cubId.trim());
    if (!existing) return false;

    const updated = Object.freeze({
      ...existing,
      status,
      updatedAt: Date.now(),
    });

    await this.saveAccount(updated);
    return true;
  }

  public async deleteAccount(cubId: string): Promise<boolean> {
    const existing = this.accountsByCubId.get(cubId.trim());
    if (!existing) return false;

    this.accountsByCubId.delete(cubId.trim());
    this.accountsById.delete(existing.accountId);
    this.accountsByUsername.delete(existing.username.toLowerCase());
    return true;
  }

  public async listAccounts(filter?: {
    status?: AccountStatus;
    tier?: string;
  }): Promise<readonly CubiOAccount[]> {
    let list = Array.from(this.accountsByCubId.values());
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter?.tier) {
      list = list.filter((a) => a.tier === filter.tier);
    }
    return Object.freeze(list);
  }

  public async clear(): Promise<void> {
    this.accountsByCubId.clear();
    this.accountsById.clear();
    this.accountsByUsername.clear();
  }
}
