/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-04: Account Repository Interface
 */

import { CubiOAccount, AccountStatus } from '../types';

export interface IAccountRepository {
  saveAccount(account: CubiOAccount): Promise<void>;
  getAccountByCubId(cubId: string): Promise<CubiOAccount | undefined>;
  getAccountById(accountId: string): Promise<CubiOAccount | undefined>;
  getAccountByUsername(username: string): Promise<CubiOAccount | undefined>;
  updateAccountStatus(cubId: string, status: AccountStatus): Promise<boolean>;
  deleteAccount(cubId: string): Promise<boolean>;
  listAccounts(filter?: { status?: AccountStatus; tier?: string }): Promise<readonly CubiOAccount[]>;
  clear(): Promise<void>;
}
