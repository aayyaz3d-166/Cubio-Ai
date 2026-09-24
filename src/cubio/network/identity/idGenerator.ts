/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: Sovereign CubiO ID Generator & Identity Factory
 *
 * Implements deterministic generation of CUB-XXXXXXXX identifiers,
 * validation routines, and canonical identity factory methods.
 *
 * Invariant:
 * 1. Identical canonical inputs (type + seed) produce identical CubiO IDs.
 * 2. Distinct inputs produce distinct IDs with collision resistance.
 * 3. Generation is independent of timestamps, random numbers, or environment.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOProvenanceManager } from './provenance';
import {
  CubiOEntityType,
  CubiOIdentity,
  CubiOIdentityStatus,
  IdentityValidationError,
  IdentityValidationResult,
  ExternalProviderLink,
} from './types';

export class CubiOIdGenerator {
  public static readonly ID_REGEX = /^CUB-[A-F0-9]{8}$/;

  /**
   * Generates a deterministic CubiO ID (CUB-XXXXXXXX) from an entity type and canonical seed.
   *
   * Algorithm:
   * 1. Normalize input: type + ":" + canonicalSeed.trim().
   * 2. Compute 256-bit deterministic hash.
   * 3. Extract 8 uppercase alphanumeric hexadecimal characters.
   * 4. Prefix with "CUB-".
   */
  public static generate(type: CubiOEntityType, canonicalSeed: string): string {
    const raw = (canonicalSeed || '').trim();
    if (!raw) {
      throw new Error('Cannot generate CubiO ID: canonical seed must be a non-empty string.');
    }

    const payload = `${type.toUpperCase()}:${raw}`;
    const hash = deterministicHash(payload);
    const idSegment = hash.slice(2, 10).toUpperCase();

    return `CUB-${idSegment}`;
  }

  /**
   * Checks if a string conforms to the canonical CUB-XXXXXXXX pattern.
   */
  public static isValidId(cubId: string): boolean {
    if (!cubId || typeof cubId !== 'string') return false;
    return this.ID_REGEX.test(cubId.trim());
  }

  /**
   * Creates a complete, typed, immutable CubiOIdentity instance.
   */
  public static create(
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
    const cubId = this.generate(type, canonicalSeed);
    const createdAt = options.createdAt || 1700000000000;
    const name = options.name || `${type.charAt(0) + type.slice(1).toLowerCase()}_${cubId.slice(4)}`;
    const status: CubiOIdentityStatus = options.status || 'ACTIVE';
    const creatorProvider = options.initialProvider?.provider || 'CUBIO_NATIVE';

    const provenance = CubiOProvenanceManager.createInitialProvenance(
      type,
      canonicalSeed,
      creatorProvider,
      options.originSource || 'SYSTEM_GENESIS',
      createdAt
    );

    const providers: ExternalProviderLink[] = options.initialProvider
      ? [Object.freeze({ ...options.initialProvider })]
      : [];

    const identity: CubiOIdentity = Object.freeze({
      cubId,
      type,
      name,
      status,
      createdAt,
      provenance,
      providers: Object.freeze(providers),
      bindings: Object.freeze([]),
      metadata: Object.freeze({ ...(options.metadata || {}) }),
    });

    const validation = this.validate(identity);
    if (!validation.isValid) {
      const errorMsg = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Failed to create valid CubiO Identity: ${errorMsg}`);
    }

    return identity;
  }

  /**
   * Validates an identity object against all structural and type rules.
   */
  public static validate(identity: any): IdentityValidationResult {
    const errors: IdentityValidationError[] = [];

    if (!identity || typeof identity !== 'object') {
      return Object.freeze({
        isValid: false,
        errors: Object.freeze([
          { field: 'format', message: 'Identity must be an object.', code: 'ERR_NOT_OBJECT' },
        ]),
      });
    }

    // 1. cubId format
    if (!identity.cubId || !this.isValidId(identity.cubId)) {
      errors.push({
        field: 'cubId',
        message: `cubId must match format CUB-XXXXXXXX. Received: '${identity.cubId}'.`,
        code: 'ERR_INVALID_CUB_ID',
      });
    }

    // 2. type
    const validTypes: CubiOEntityType[] = ['USER', 'DEVICE', 'AGENT', 'SERVICE'];
    if (!validTypes.includes(identity.type)) {
      errors.push({
        field: 'type',
        message: `type must be one of [USER, DEVICE, AGENT, SERVICE]. Received: '${identity.type}'.`,
        code: 'ERR_INVALID_TYPE',
      });
    }

    // 3. status
    const validStatuses: CubiOIdentityStatus[] = ['ACTIVE', 'SUSPENDED', 'REVOKED', 'PROVISIONAL'];
    if (!validStatuses.includes(identity.status)) {
      errors.push({
        field: 'status',
        message: `status must be one of [ACTIVE, SUSPENDED, REVOKED, PROVISIONAL]. Received: '${identity.status}'.`,
        code: 'ERR_INVALID_STATUS',
      });
    }

    // 4. name
    if (!identity.name || typeof identity.name !== 'string' || !identity.name.trim()) {
      errors.push({
        field: 'name',
        message: 'name must be a non-empty string.',
        code: 'ERR_EMPTY_NAME',
      });
    }

    // 5. provenance
    if (!identity.provenance || typeof identity.provenance !== 'object') {
      errors.push({
        field: 'provenance',
        message: 'provenance record is required.',
        code: 'ERR_MISSING_PROVENANCE',
      });
    } else if (!identity.provenance.canonicalSeedHash) {
      errors.push({
        field: 'provenance.canonicalSeedHash',
        message: 'provenance must contain a canonicalSeedHash.',
        code: 'ERR_MISSING_SEED_HASH',
      });
    }

    // 6. bindings array
    if (!Array.isArray(identity.bindings)) {
      errors.push({
        field: 'bindings',
        message: 'bindings must be an array.',
        code: 'ERR_INVALID_BINDINGS',
      });
    }

    // 7. providers array
    if (!Array.isArray(identity.providers)) {
      errors.push({
        field: 'providers',
        message: 'providers must be an array.',
        code: 'ERR_INVALID_PROVIDERS',
      });
    }

    if (errors.length > 0) {
      return Object.freeze({
        isValid: false,
        errors: Object.freeze(errors),
      });
    }

    return Object.freeze({
      isValid: true,
      errors: Object.freeze([]),
      identity: identity as CubiOIdentity,
    });
  }
}
