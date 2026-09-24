/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-06: Sovereign Storage Engine
 *
 * Implements the continuous data pipeline:
 * Principal -> NET-02 Auth -> NET-01 Identity Resolution -> NET-04 Account Quota
 * -> NET-03 Policy Evaluation -> CAS Block Chunking -> NET-00 CNC Storage Node Dispatch.
 *
 * ARCHITECTURAL INVARIANT:
 * - Storage is strictly anchored to sovereign CUB-XXXXXXXX identities.
 * - CAS engine provides automatic deduplication across block hashes.
 * - Access control is evaluated server-side against ACLs and NET-03 policies.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiOAccountService } from '../account/accountService';
import { CubiOAddressRegistry } from '../address/addressRegistry';
import { CubiONodeRegistry } from '../coordinate/registry';
import {
  DataBlock,
  StorageObject,
  StorageBucket,
  StorageMetrics,
  PutObjectInput,
  GetObjectResult,
  CreateBucketInput,
  ShareObjectInput,
} from './types';
import { CubiOCasEngine } from './casEngine';
import { IStorageRepository } from './repositories/types';
import { MemoryStorageRepository } from './repositories/memoryRepositories';

export const STANDARD_STORAGE_COORDINATE = 'CUBIO://NETWORK/0/01/00004/STORAGE';

export const TIER_QUOTAS: Record<string, number> = Object.freeze({
  FREE: 100 * 1024 * 1024, // 100 MB
  STARTER: 1024 * 1024 * 1024, // 1 GB
  PRO: 10 * 1024 * 1024 * 1024, // 10 GB
  ENTERPRISE: 1024 * 1024 * 1024 * 1024, // 1 TB
});

export class CubiOStorageEngine {
  private repository: IStorageRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private accountService?: CubiOAccountService;
  private addressRegistry?: CubiOAddressRegistry;
  private nodeRegistry?: CubiONodeRegistry;

  constructor(options: {
    repository?: IStorageRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    accountService?: CubiOAccountService;
    addressRegistry?: CubiOAddressRegistry;
    nodeRegistry?: CubiONodeRegistry;
  } = {}) {
    this.repository = options.repository || new MemoryStorageRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.accountService = options.accountService;
    this.addressRegistry = options.addressRegistry;
    this.nodeRegistry = options.nodeRegistry;
  }

  public getRepository(): IStorageRepository {
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
      throw new Error('Authentication engine not configured in StorageEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Storage Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Puts / uploads a storage object with automatic CAS chunking and quota validation.
   */
  public async putObject(
    tokenOrSession: string,
    input: PutObjectInput
  ): Promise<Readonly<StorageObject>> {
    // 1. Authenticate caller (NET-02)
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Verify sovereign identity (NET-01)
    if (this.identityRegistry && !this.identityRegistry.has(callerCubId)) {
      throw new Error(`Storage Error: Sovereign Identity '${callerCubId}' not found in NET-01 registry.`);
    }

    // 3. Verify active account & quota (NET-04)
    let accountTier = 'FREE';
    if (this.accountService) {
      const account = await this.accountService.getAccount(callerCubId);
      if (account) {
        if (account.status !== 'ACTIVE') {
          throw new Error(`Storage Error: Account is '${account.status}'. Storage operations blocked.`);
        }
        accountTier = account.tier || 'FREE';
      }
    }

    const payloadSize = typeof input.data === 'string'
      ? Buffer.byteLength(input.data, 'utf8')
      : input.data.length;

    const quotaLimit = TIER_QUOTAS[accountTier] || TIER_QUOTAS.FREE;
    const usage = await this.repository.getStorageUsage(callerCubId);
    if (usage.totalBytes + payloadSize > quotaLimit) {
      throw new Error(
        `Storage Quota Exceeded: Account tier '${accountTier}' limit is ${quotaLimit} bytes. Requested write would reach ${
          usage.totalBytes + payloadSize
        } bytes.`
      );
    }

    // 4. Authorization check (NET-03)
    const targetCoordinate = input.coordinateUri || STANDARD_STORAGE_COORDINATE;
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'STORAGE_WRITE',
        resourceUri: targetCoordinate,
      });
      if (!decision.allowed) {
        throw new Error(`Storage Authorization Denied: Identity '${callerCubId}' lacks STORAGE_WRITE permission.`);
      }
    }

    // 5. CAS Chunking & Deduplicated Block Storage
    const blocks = CubiOCasEngine.chunkData(input.data, undefined, input.mimeType);
    const blockHashes: string[] = [];
    for (const block of blocks) {
      await this.repository.saveBlock(block);
      blockHashes.push(block.blockHash);
    }

    // 6. Create Storage Object Record
    const now = Date.now();
    const objectPath = input.path || `/${input.name.trim()}`;
    const objectId = `OBJ_${deterministicHash(`${callerCubId}:${objectPath}:${now}`).slice(2, 18)}`;

    const storageObject: StorageObject = Object.freeze({
      objectId,
      name: input.name.trim(),
      path: objectPath,
      bucketId: input.bucketId,
      ownerCubId: callerCubId,
      blockHashes: Object.freeze(blockHashes),
      sizeBytes: payloadSize,
      mimeType: input.mimeType || 'application/octet-stream',
      encryptionAlgorithm: input.encryptionAlgorithm || 'NONE',
      accessControl: Object.freeze({
        visibility: input.visibility || 'PRIVATE',
        allowedCubIds: Object.freeze(input.allowedCubIds ? [...input.allowedCubIds] : []),
      }),
      coordinateUri: targetCoordinate,
      version: 1,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveObject(storageObject);
    return storageObject;
  }

  /**
   * Retrieves a storage object and reconstructs its payload from CAS blocks.
   */
  public async getObject(
    tokenOrSession: string,
    objectIdOrPath: string,
    options: { ownerCubId?: string; asBinary?: boolean } = {}
  ): Promise<Readonly<GetObjectResult>> {
    // 1. Authenticate caller (NET-02)
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Fetch object record
    let object: StorageObject | undefined;
    if (objectIdOrPath.startsWith('OBJ_')) {
      object = await this.repository.getObject(objectIdOrPath);
    } else {
      const owner = options.ownerCubId || callerCubId;
      object = await this.repository.getObjectByPath(owner, objectIdOrPath);
    }

    if (!object) {
      throw new Error(`Storage Error: Object '${objectIdOrPath}' not found.`);
    }

    // 3. Access Control Evaluation
    let isAllowed = false;
    if (object.ownerCubId === callerCubId) {
      isAllowed = true;
    } else if (object.accessControl.visibility === 'PUBLIC') {
      isAllowed = true;
    } else if (object.accessControl.allowedCubIds.includes(callerCubId)) {
      isAllowed = true;
    } else if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'STORAGE_ADMIN',
        resourceUri: object.coordinateUri,
      });
      isAllowed = decision.allowed;
    }

    if (!isAllowed) {
      throw new Error(
        `Storage Access Denied: Caller '${callerCubId}' is not authorized to read object '${object.objectId}'.`
      );
    }

    // 4. Retrieve CAS Blocks & Verify Integrity
    const blocks: DataBlock[] = [];
    for (const hash of object.blockHashes) {
      const block = await this.repository.getBlock(hash);
      if (!block) {
        throw new Error(`Storage Data Corruption: Missing CAS block '${hash}' for object '${object.objectId}'.`);
      }
      if (!CubiOCasEngine.verifyBlockIntegrity(block)) {
        throw new Error(`Storage Integrity Error: CAS block '${hash}' failed hash verification.`);
      }
      blocks.push(block);
    }

    // 5. Reconstruct Data
    const data = CubiOCasEngine.reconstructData(blocks, options.asBinary);

    return Object.freeze({
      object,
      data,
      reconstructedFromBlocks: blocks.length,
      verifiedIntegrity: true,
    });
  }

  /**
   * Deletes a storage object.
   */
  public async deleteObject(
    tokenOrSession: string,
    objectId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const object = await this.repository.getObject(objectId);
    if (!object) {
      throw new Error(`Storage Error: Object '${objectId}' not found.`);
    }

    // Check delete permission (owner or STORAGE_ADMIN)
    let isAllowed = object.ownerCubId === callerCubId;
    if (!isAllowed && this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'STORAGE_ADMIN',
        resourceUri: object.coordinateUri,
      });
      isAllowed = decision.allowed;
    }

    if (!isAllowed) {
      throw new Error(`Storage Access Denied: Caller '${callerCubId}' cannot delete object '${objectId}'.`);
    }

    return this.repository.deleteObject(objectId);
  }

  /**
   * Shares a storage object with another sovereign identity or email address.
   */
  public async shareObject(
    tokenOrSession: string,
    input: ShareObjectInput
  ): Promise<Readonly<StorageObject>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const object = await this.repository.getObject(input.objectId);
    if (!object) {
      throw new Error(`Storage Error: Object '${input.objectId}' not found.`);
    }

    if (object.ownerCubId !== callerCubId) {
      throw new Error(`Storage Access Denied: Caller '${callerCubId}' does not own object '${input.objectId}'.`);
    }

    // Resolve target CUB-ID
    let targetCubId = input.targetCubIdOrAddress.trim();
    if (!targetCubId.startsWith('CUB-')) {
      if (this.addressRegistry) {
        const resolution = await this.addressRegistry.resolveAddress(targetCubId);
        if (resolution.found && resolution.cubId) {
          targetCubId = resolution.cubId;
        } else {
          throw new Error(`Storage Share Error: Target address '${targetCubId}' could not be resolved to any sovereign identity.`);
        }
      } else {
        throw new Error(`Storage Share Error: Target '${targetCubId}' must be a valid CUB-XXXXXXXX identity.`);
      }
    }

    // Verify target identity exists in NET-01
    if (this.identityRegistry && !this.identityRegistry.has(targetCubId)) {
      throw new Error(`Storage Share Error: Sovereign identity '${targetCubId}' not found in NET-01 registry.`);
    }

    const currentAllowed = new Set(object.accessControl.allowedCubIds);
    currentAllowed.add(targetCubId);

    const updated: StorageObject = Object.freeze({
      ...object,
      accessControl: Object.freeze({
        ...object.accessControl,
        visibility: 'SHARED',
        allowedCubIds: Object.freeze(Array.from(currentAllowed)),
      }),
      updatedAt: Date.now(),
    });

    await this.repository.saveObject(updated);
    return updated;
  }

  /**
   * Creates a sovereign storage bucket.
   */
  public async createBucket(
    tokenOrSession: string,
    input: CreateBucketInput
  ): Promise<Readonly<StorageBucket>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // Check duplicate name
    const existing = await this.repository.getBucketByName(callerCubId, input.name);
    if (existing) {
      throw new Error(`Storage Error: Bucket '${input.name}' already exists for identity '${callerCubId}'.`);
    }

    const now = Date.now();
    const bucketId = `BKT_${deterministicHash(`${callerCubId}:${input.name}:${now}`).slice(2, 18)}`;
    const coordinateUri = input.coordinateUri || STANDARD_STORAGE_COORDINATE;

    const bucket: StorageBucket = Object.freeze({
      bucketId,
      name: input.name.trim().toLowerCase(),
      ownerCubId: callerCubId,
      quotaBytes: input.quotaBytes || 1024 * 1024 * 1024, // Default 1 GB
      usedBytes: 0,
      objectCount: 0,
      coordinateUri,
      isEncrypted: input.isEncrypted || false,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveBucket(bucket);
    return bucket;
  }

  /**
   * Lists objects owned by the authenticated caller.
   */
  public async listObjects(
    tokenOrSession: string,
    bucketId?: string
  ): Promise<readonly StorageObject[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getObjectsByOwner(callerCubId, bucketId);
  }

  /**
   * Retrieves aggregated storage metrics for an identity.
   */
  public async getStorageMetrics(
    tokenOrSession: string,
    targetCubId?: string
  ): Promise<Readonly<StorageMetrics>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const cubId = targetCubId || callerCubId;

    let tier = 'FREE';
    if (this.accountService) {
      const account = await this.accountService.getAccount(cubId);
      if (account) {
        tier = account.tier || 'FREE';
      }
    }

    const quotaBytes = TIER_QUOTAS[tier] || TIER_QUOTAS.FREE;
    const usage = await this.repository.getStorageUsage(cubId);
    const availableBytes = Math.max(0, quotaBytes - usage.totalBytes);
    const usagePercent = quotaBytes > 0 ? (usage.totalBytes / quotaBytes) * 100 : 0;

    return Object.freeze({
      cubId,
      tier,
      quotaBytes,
      usedBytes: usage.totalBytes,
      availableBytes,
      usagePercent,
      objectCount: usage.objectCount,
      bucketCount: usage.bucketCount,
    });
  }
}
