/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-04: CubiO Account (Types & Models)
 *
 * Formal specification for user profiles, preferences, settings, and account lifecycle.
 *
 * ARCHITECTURAL INVARIANT:
 * - An Account strictly belongs to a sovereign CubiO Identity (CUB-XXXXXXXX).
 * - Google accounts, email addresses, and session IDs do NOT replace the sovereign ID.
 */

export type AccountTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface AccountSettings {
  readonly notificationsEnabled: boolean;
  readonly defaultDimension: number; // [0..99]
  readonly defaultZone: number; // [0..99]
  readonly theme: 'DARK' | 'LIGHT' | 'SPATIAL';
  readonly privacyLevel: 'PUBLIC' | 'NETWORK_ONLY' | 'PRIVATE';
}

export interface CubiOAccount {
  readonly accountId: string; // ACC_...
  readonly cubId: string; // Sovereign CUB-XXXXXXXX
  readonly username: string;
  readonly email?: string;
  readonly omailAddress?: string; // username@omail.com (Free)
  readonly cubioAddress?: string; // username@cubio.com (Premium)
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly tier: AccountTier;
  readonly status: AccountStatus;
  readonly settings: AccountSettings;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface AccountUpdateInput {
  readonly displayName?: string;
  readonly email?: string;
  readonly omailAddress?: string;
  readonly cubioAddress?: string;
  readonly avatarUrl?: string;
  readonly tier?: AccountTier;
  readonly settings?: Partial<AccountSettings>;
}
