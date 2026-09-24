/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-20: CubiO Developer / SDK Network (Types & Models)
 *
 * Master specification for Developer Projects, scoped API Keys, Rate Limiting,
 * API Versioning, Documentation Contracts, and Client SDK integrations.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - "Developer access must remain permission-scoped and must never bypass CubiO authentication or authorization."
 * - Raw API key secrets are never stored in plaintext (stored as cryptographic SHA-256 hashes).
 * - Rate limiting enforces request ceilings per minute per key.
 */

import { NetworkPermission } from '../authz/types';

export type ProjectEnvironment = 'SANDBOX' | 'PRODUCTION';
export type ProjectStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type KeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface DeveloperProject {
  readonly projectId: string; // DEV_PROJ_...
  readonly developerCubId: string; // Sovereign developer CUB-XXXXXXXX
  readonly name: string;
  readonly description: string;
  readonly environment: ProjectEnvironment;
  readonly status: ProjectStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ApiKeyRecord {
  readonly keyId: string; // KEY_...
  readonly projectId: string;
  readonly developerCubId: string;
  readonly keyPrefix: string; // e.g. "CUBKEY_live_ab12"
  readonly keySecretHash: string; // SHA-256 hash of raw key secret
  readonly name: string;
  readonly scopes: readonly NetworkPermission[];
  readonly rateLimitPerMin: number;
  readonly status: KeyStatus;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly lastUsedAt?: number;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly description: string;
  readonly environment?: ProjectEnvironment;
}

export interface CreateApiKeyInput {
  readonly projectId: string;
  readonly name: string;
  readonly scopes: readonly NetworkPermission[];
  readonly rateLimitPerMin?: number;
  readonly expiresInDays?: number;
}

export interface CreateApiKeyResult {
  readonly keyRecord: Readonly<ApiKeyRecord>;
  readonly rawApiKey: string; // Provided only once on creation (e.g. "CUBKEY_live_ab1234_secretxyz...")
}

export interface ValidateApiKeyResult {
  readonly isValid: boolean;
  readonly developerCubId?: string;
  readonly projectId?: string;
  readonly keyRecord?: Readonly<ApiKeyRecord>;
  readonly effectiveScopes?: readonly NetworkPermission[];
  readonly error?: string;
  readonly errorCode?: 'INVALID_KEY' | 'REVOKED' | 'EXPIRED' | 'INSUFFICIENT_SCOPE' | 'RATE_LIMIT_EXCEEDED';
}

export interface ApiEndpointDoc {
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'SUBSCRIBE';
  readonly version: string;
  readonly description: string;
  readonly requiredScopes: readonly NetworkPermission[];
  readonly requestSchema?: Readonly<Record<string, any>>;
  readonly responseSchema?: Readonly<Record<string, any>>;
}

export interface ApiDocContract {
  readonly apiVersion: string;
  readonly title: string;
  readonly description: string;
  readonly endpoints: readonly ApiEndpointDoc[];
}
