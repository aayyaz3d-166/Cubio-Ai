/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-ADDRESS: Strict Address Validator
 *
 * Implements validation, normalization, and protection of reserved names
 * for both @omail.com (Free) and @cubio.com (Premium).
 */

import {
  AddressDomain,
  AddressType,
  AddressValidationResult,
} from './types';

export const SUPPORTED_DOMAINS: readonly AddressDomain[] = Object.freeze([
  'omail.com',
  'cubio.com',
]);

export const RESERVED_SYSTEM_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'cubio',
  'omail',
  'support',
  'security',
  'postmaster',
  'hostmaster',
  'webmaster',
  'mailer-daemon',
  'official',
  'help',
  'api',
  'auth',
  'authz',
  'account',
  'billing',
  'sales',
  'contact',
  'info',
  'noreply',
  'no-reply',
  'abuse',
  'service',
  'terminal',
  'studio',
  'intelligence',
  'network',
  'core',
  'master',
  'gateway',
  'null',
  'undefined',
]);

export class CubiOAddressValidator {
  /**
   * Checks if a local-part (username) is a reserved system name.
   */
  public static isReservedSystemName(username: string): boolean {
    const clean = username.trim().toLowerCase();
    return RESERVED_SYSTEM_USERNAMES.has(clean);
  }

  /**
   * Validates a standalone username string (for registration eligibility).
   */
  public static validateUsername(username: string): AddressValidationResult {
    if (!username || typeof username !== 'string') {
      return Object.freeze({
        isValid: false,
        error: 'Username must be a non-empty string.',
        errorCode: 'ERR_INVALID_FORMAT',
      });
    }

    const clean = username.trim().toLowerCase();

    if (clean.length < 3) {
      return Object.freeze({
        isValid: false,
        localPart: clean,
        error: `Username '${clean}' is too short (minimum 3 characters).`,
        errorCode: 'ERR_LOCALPART_TOO_SHORT',
      });
    }

    if (clean.length > 32) {
      return Object.freeze({
        isValid: false,
        localPart: clean,
        error: `Username '${clean}' is too long (maximum 32 characters).`,
        errorCode: 'ERR_LOCALPART_TOO_LONG',
      });
    }

    // Must start and end with alphanumeric character, can contain '.', '_', '-' in middle
    const validPattern = /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/;
    if (!validPattern.test(clean) || clean.includes('..') || clean.includes('--') || clean.includes('__')) {
      return Object.freeze({
        isValid: false,
        localPart: clean,
        error: `Username '${clean}' contains invalid characters or consecutive punctuation.`,
        errorCode: 'ERR_INVALID_CHARACTERS',
      });
    }

    if (this.isReservedSystemName(clean)) {
      return Object.freeze({
        isValid: false,
        localPart: clean,
        isReservedSystemName: true,
        error: `Username '${clean}' is a reserved system identifier and cannot be registered.`,
        errorCode: 'ERR_SYSTEM_RESERVED_NAME',
      });
    }

    return Object.freeze({
      isValid: true,
      localPart: clean,
    });
  }

  /**
   * Validates a full email address or username + domain pair.
   */
  public static validateAddress(
    input: string,
    defaultDomain: AddressDomain = 'omail.com'
  ): AddressValidationResult {
    if (!input || typeof input !== 'string') {
      return Object.freeze({
        isValid: false,
        error: 'Address must be a non-empty string.',
        errorCode: 'ERR_INVALID_FORMAT',
      });
    }

    const clean = input.trim().toLowerCase();
    let localPart: string;
    let domain: AddressDomain;

    if (clean.includes('@')) {
      const parts = clean.split('@');
      if (parts.length !== 2) {
        return Object.freeze({
          isValid: false,
          error: `Malformed address structure '${clean}'. Expected exactly one '@'.`,
          errorCode: 'ERR_INVALID_FORMAT',
        });
      }
      localPart = parts[0];
      const rawDomain = parts[1];

      if (!SUPPORTED_DOMAINS.includes(rawDomain as AddressDomain)) {
        return Object.freeze({
          isValid: false,
          localPart,
          error: `Domain '${rawDomain}' is unsupported. Only @omail.com and @cubio.com are permitted.`,
          errorCode: 'ERR_UNSUPPORTED_DOMAIN',
        });
      }
      domain = rawDomain as AddressDomain;
    } else {
      localPart = clean;
      domain = defaultDomain;
    }

    const usernameResult = this.validateUsername(localPart);
    if (!usernameResult.isValid) {
      return Object.freeze({
        ...usernameResult,
        domain,
        fullAddress: `${localPart}@${domain}`,
      });
    }

    const fullAddress = `${usernameResult.localPart}@${domain}`;
    const type: AddressType = domain === 'cubio.com' ? 'CUBIO_PREMIUM' : 'OMAIL_FREE';

    return Object.freeze({
      isValid: true,
      fullAddress,
      localPart: usernameResult.localPart,
      domain,
      type,
      isReservedSystemName: false,
    });
  }

  /**
   * Normalizes an address string to its canonical lowercase full form.
   */
  public static normalizeAddress(
    input: string,
    defaultDomain: AddressDomain = 'omail.com'
  ): string {
    const result = this.validateAddress(input, defaultDomain);
    if (!result.isValid || !result.fullAddress) {
      throw new Error(`Address validation failed for '${input}': ${result.error}`);
    }
    return result.fullAddress;
  }
}
