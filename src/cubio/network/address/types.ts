/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-ADDRESS: Dual Address Identity System (Types & Models)
 *
 * Formal specification for @omail.com (Free Communication) and @cubio.com (Premium Identity).
 *
 * ARCHITECTURAL INVARIANT:
 * - The sovereign identity CUB-XXXXXXXX (NET-01) is the single authoritative root of identity.
 * - @omail.com and @cubio.com are public communication identifiers, NOT replacements for CUB-ID.
 * - Address ownership is resolved and enforced strictly server-side.
 * - Private credentials, passwords, tokens, or secrets are NEVER stored or exposed in address objects.
 */

export type AddressDomain = 'omail.com' | 'cubio.com';

export type AddressType = 'OMAIL_FREE' | 'CUBIO_PREMIUM';

export type AddressStatus = 'AVAILABLE' | 'RESERVED' | 'OWNED' | 'SUSPENDED' | 'RELEASED';

export type ReservationStatus = 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

/**
 * Core CubiO Address Model
 */
export interface CubiOAddress {
  readonly addressId: string; // ADDR_...
  readonly fullAddress: string; // e.g. "username@cubio.com" or "username@omail.com"
  readonly localPart: string; // "username"
  readonly domain: AddressDomain; // "omail.com" | "cubio.com"
  readonly type: AddressType;
  readonly status: AddressStatus;
  readonly ownerCubId?: string; // Sovereign CUB-XXXXXXXX if OWNED
  readonly registeredAt?: number;
  readonly updatedAt?: number;
  readonly expiresAt?: number; // Optional expiration for lease/subscription
  readonly metadata?: Readonly<Record<string, any>>;
}

/**
 * Specialized OMail Free Communication Address
 */
export interface OMailAddress extends CubiOAddress {
  readonly domain: 'omail.com';
  readonly type: 'OMAIL_FREE';
}

/**
 * Specialized CubiO Premium Address
 */
export interface CubiOPremiumAddress extends CubiOAddress {
  readonly domain: 'cubio.com';
  readonly type: 'CUBIO_PREMIUM';
  readonly reservationId?: string;
  readonly tier?: 'STANDARD' | 'EXCLUSIVE' | 'BRAND';
}

/**
 * Record representing ownership linkage between sovereign CUB-ID and address
 */
export interface AddressOwnership {
  readonly ownershipId: string; // OWN_...
  readonly addressId: string;
  readonly fullAddress: string;
  readonly cubId: string; // Sovereign CUB-XXXXXXXX
  readonly type: AddressType;
  readonly status: AddressStatus;
  readonly isPrimary: boolean;
  readonly boundAt: number;
  readonly updatedAt: number;
}

/**
 * Reservation record for premium / sellable address holding
 */
export interface AddressReservation {
  readonly reservationId: string; // RES_...
  readonly addressId: string;
  readonly fullAddress: string;
  readonly localPart: string;
  readonly domain: AddressDomain;
  readonly reservedForCubId: string; // Sovereign CUB-XXXXXXXX holding the reservation
  readonly reservedAt: number;
  readonly expiresAt: number; // TTL timestamp
  readonly status: ReservationStatus;
  readonly reservationToken: string; // Cryptographic verification token
  readonly priceTier?: string;
}

/**
 * Address Format Validation Diagnostic
 */
export interface AddressValidationResult {
  readonly isValid: boolean;
  readonly fullAddress?: string;
  readonly localPart?: string;
  readonly domain?: AddressDomain;
  readonly type?: AddressType;
  readonly isReservedSystemName?: boolean;
  readonly error?: string;
  readonly errorCode?:
    | 'ERR_INVALID_FORMAT'
    | 'ERR_LOCALPART_TOO_SHORT'
    | 'ERR_LOCALPART_TOO_LONG'
    | 'ERR_INVALID_CHARACTERS'
    | 'ERR_UNSUPPORTED_DOMAIN'
    | 'ERR_SYSTEM_RESERVED_NAME';
}

/**
 * Address Resolution Result
 */
export interface AddressResolutionResult {
  readonly found: boolean;
  readonly fullAddress: string;
  readonly cubId?: string; // Sovereign CUB-XXXXXXXX
  readonly address?: CubiOAddress;
  readonly status?: AddressStatus;
  readonly error?: string;
}

/**
 * Input for Address Operations
 */
export interface RegisterAddressInput {
  readonly username: string;
  readonly domain: AddressDomain;
  readonly cubId: string;
  readonly metadata?: Record<string, any>;
}

export interface ReserveAddressInput {
  readonly username: string;
  readonly domain?: AddressDomain; // Defaults to 'cubio.com'
  readonly cubId: string;
  readonly durationMs?: number; // Duration in milliseconds
}

export interface ClaimAddressInput {
  readonly username: string;
  readonly domain?: AddressDomain;
  readonly cubId: string;
  readonly reservationToken?: string;
}
