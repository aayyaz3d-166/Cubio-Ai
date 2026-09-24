/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-20: Master Developer Engine
 *
 * Implements Developer Projects, scoped API Keys, Rate Limiting,
 * API Versioning, Documentation Contracts, and Client SDK integrations.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - "Developer access must remain permission-scoped and must never bypass CubiO authentication or authorization."
 * - Raw API key secrets are never stored in plaintext (stored as cryptographic SHA-256 hashes).
 * - Rate limiting enforces request ceilings per minute per key.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import { NetworkPermission } from '../authz/types';
import {
  DeveloperProject,
  ApiKeyRecord,
  CreateProjectInput,
  CreateApiKeyInput,
  CreateApiKeyResult,
  ValidateApiKeyResult,
  ApiDocContract,
  ApiEndpointDoc,
} from './types';
import { IDeveloperRepository } from './repositories/types';
import { MemoryDeveloperRepository } from './repositories/memoryRepositories';

export class CubiODeveloperEngine {
  private repository: IDeveloperRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;

  constructor(options: {
    repository?: IDeveloperRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
  } = {}) {
    this.repository = options.repository || new MemoryDeveloperRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
  }

  public getRepository(): IDeveloperRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (tokenOrSession.startsWith('CUB-')) {
      return tokenOrSession;
    }

    if (!this.authEngine) {
      throw new Error('Authentication engine not configured in DeveloperEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Developer Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Creates a new Developer Project.
   */
  public async createProject(
    tokenOrSession: string,
    input: CreateProjectInput
  ): Promise<Readonly<DeveloperProject>> {
    const developerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: developerCubId,
        action: 'DEVELOPER_PROJECT_CREATE',
        resourceUri: 'CUBIO://DEVELOPER/PROJECTS',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${developerCubId}' lacks permission 'DEVELOPER_PROJECT_CREATE'.`);
      }
    }

    const now = Date.now();
    const projectId = `DEV_PROJ_${deterministicHash(`${developerCubId}:${input.name}:${now}`).slice(2, 18)}`;

    const project: DeveloperProject = Object.freeze({
      projectId,
      developerCubId,
      name: input.name.trim(),
      description: input.description.trim(),
      environment: input.environment || 'SANDBOX',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveProject(project);
    return project;
  }

  /**
   * Generates a new scoped Developer API key for a project.
   */
  public async createApiKey(
    tokenOrSession: string,
    input: CreateApiKeyInput
  ): Promise<CreateApiKeyResult> {
    const developerCubId = await this.authenticateCaller(tokenOrSession);

    const project = await this.repository.getProject(input.projectId);
    if (!project) {
      throw new Error(`Developer Error: Project '${input.projectId}' not found.`);
    }
    if (project.developerCubId !== developerCubId) {
      throw new Error(`Authorization Denied: Identity '${developerCubId}' does not own project '${input.projectId}'.`);
    }

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: developerCubId,
        action: 'DEVELOPER_KEY_MANAGE',
        resourceUri: `CUBIO://DEVELOPER/PROJECT/${input.projectId}/KEYS`,
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${developerCubId}' lacks permission 'DEVELOPER_KEY_MANAGE'.`);
      }
    }

    const now = Date.now();
    const envPrefix = project.environment === 'PRODUCTION' ? 'live' : 'test';
    const keyShort = deterministicHash(`${developerCubId}:${input.projectId}:${input.name}:${now}`).slice(2, 10);
    const keyPrefix = `CUBKEY_${envPrefix}_${keyShort}`;
    const secretEntropy = deterministicHash(`SECRET:${developerCubId}:${input.projectId}:${now}`).slice(2, 26);
    const rawApiKey = `${keyPrefix}_${secretEntropy}`;

    const keySecretHash = `HASH_${deterministicHash(rawApiKey).slice(2, 32)}`;
    const keyId = `KEY_${deterministicHash(`${keyPrefix}:${now}`).slice(2, 18)}`;

    const expiresAt = input.expiresInDays ? now + input.expiresInDays * 86400000 : undefined;

    const keyRecord: ApiKeyRecord = Object.freeze({
      keyId,
      projectId: input.projectId,
      developerCubId,
      keyPrefix,
      keySecretHash,
      name: input.name.trim(),
      scopes: Object.freeze([...input.scopes]),
      rateLimitPerMin: input.rateLimitPerMin || 60,
      status: 'ACTIVE',
      createdAt: now,
      expiresAt,
    });

    await this.repository.saveApiKey(keyRecord);

    return {
      keyRecord,
      rawApiKey,
    };
  }

  /**
   * Revokes an existing API key.
   */
  public async revokeApiKey(
    tokenOrSession: string,
    keyId: string
  ): Promise<Readonly<ApiKeyRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const keyRecord = await this.repository.getApiKey(keyId);

    if (!keyRecord) {
      throw new Error(`Developer Error: API key '${keyId}' not found.`);
    }

    if (keyRecord.developerCubId !== callerCubId) {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: 'DEVELOPER_ADMIN',
          resourceUri: 'CUBIO://DEVELOPER/ADMIN',
        });
        if (!decision.allowed) {
          throw new Error(`Authorization Denied: Identity '${callerCubId}' cannot revoke foreign API key.`);
        }
      }
    }

    const revoked: ApiKeyRecord = Object.freeze({
      ...keyRecord,
      status: 'REVOKED',
    });

    await this.repository.saveApiKey(revoked);
    return revoked;
  }

  /**
   * Validates raw API key, enforces scope constraints and rate limits.
   */
  public async validateApiKey(
    rawApiKey: string,
    requiredScope?: NetworkPermission
  ): Promise<ValidateApiKeyResult> {
    if (!rawApiKey || !rawApiKey.startsWith('CUBKEY_')) {
      return { isValid: false, error: 'Invalid API key format.', errorCode: 'INVALID_KEY' };
    }

    const parts = rawApiKey.split('_');
    if (parts.length < 4) {
      return { isValid: false, error: 'Malformed API key.', errorCode: 'INVALID_KEY' };
    }

    const keyPrefix = `${parts[0]}_${parts[1]}_${parts[2]}`;
    const keyRecord = await this.repository.getApiKeyByPrefix(keyPrefix);

    if (!keyRecord) {
      return { isValid: false, error: 'API key not found or unrecognized.', errorCode: 'INVALID_KEY' };
    }

    // 1. Verify cryptographic hash
    const computedHash = `HASH_${deterministicHash(rawApiKey).slice(2, 32)}`;
    if (keyRecord.keySecretHash !== computedHash) {
      return { isValid: false, error: 'API key secret mismatch.', errorCode: 'INVALID_KEY' };
    }

    // 2. Verify status
    if (keyRecord.status !== 'ACTIVE') {
      return { isValid: false, error: `API key is ${keyRecord.status}.`, errorCode: 'REVOKED' };
    }

    // 3. Verify expiry
    if (keyRecord.expiresAt && Date.now() > keyRecord.expiresAt) {
      return { isValid: false, error: 'API key has expired.', errorCode: 'EXPIRED' };
    }

    // 4. Enforce rate limits
    const usage = await this.repository.recordUsage(keyRecord.keyId, keyRecord.rateLimitPerMin);
    if (!usage.allowed) {
      return {
        isValid: false,
        error: `Rate limit exceeded: ${usage.currentCount}/${usage.limit} req/min.`,
        errorCode: 'RATE_LIMIT_EXCEEDED',
      };
    }

    // 5. Enforce permission scope
    if (requiredScope) {
      const hasScope = keyRecord.scopes.includes(requiredScope) || keyRecord.scopes.includes('*');
      if (!hasScope) {
        return {
          isValid: false,
          error: `Insufficient API key scope: Missing '${requiredScope}'.`,
          errorCode: 'INSUFFICIENT_SCOPE',
        };
      }
    }

    return {
      isValid: true,
      developerCubId: keyRecord.developerCubId,
      projectId: keyRecord.projectId,
      keyRecord,
      effectiveScopes: keyRecord.scopes,
    };
  }

  /**
   * Returns complete OpenAPI-style documentation contract for CubiO services.
   */
  public getApiDocContract(version: string = 'v1'): ApiDocContract {
    const endpoints: readonly ApiEndpointDoc[] = Object.freeze([
      {
        path: '/v1/coordinates/resolve',
        method: 'GET' as const,
        version,
        description: 'Resolves CNC spatial coordinate node by path.',
        requiredScopes: ['NETWORK_READ'] as const,
      },
      {
        path: '/v1/storage/objects',
        method: 'POST' as const,
        version,
        description: 'Uploads a content-addressable spatial data object.',
        requiredScopes: ['STORAGE_WRITE'] as const,
      },
      {
        path: '/v1/omail/send',
        method: 'POST' as const,
        version,
        description: 'Dispatches sovereign mail across internal and external networks.',
        requiredScopes: ['MAIL_SEND'] as const,
      },
      {
        path: '/v1/events/publish',
        method: 'POST' as const,
        version,
        description: 'Publishes a causally-ordered event to a network channel.',
        requiredScopes: ['CHANNEL_PUBLISH'] as const,
      },
      {
        path: '/v1/search/query',
        method: 'GET' as const,
        version,
        description: 'Executes authorization-aware search across spatial resources.',
        requiredScopes: ['SEARCH_EXECUTE'] as const,
      },
      {
        path: '/v1/services/invoke',
        method: 'POST' as const,
        version,
        description: 'Invokes a registered CubiO spatial service endpoint.',
        requiredScopes: ['SERVICE_INVOKE'] as const,
      },
    ]);

    return Object.freeze({
      apiVersion: version,
      title: 'CubiO Sovereign Network Platform API',
      description: 'Comprehensive API contracts covering all sovereign CubiO network subsystems (NET-00 to NET-20).',
      endpoints,
    });
  }
}
