/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-13: Master File / Object Management Engine
 *
 * Implements sovereign file namespaces, multi-versioning, ACL sharing,
 * replaceable storage backends, cryptographic checksum integrity verification,
 * and soft-deletion/restoration lifecycles.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import { CubiOAddressRegistry } from '../address/addressRegistry';
import {
  FileRecord,
  FileVersion,
  FileAclEntry,
  UploadFileInput,
  GetFileResult,
  ShareFileInput,
  RollbackVersionInput,
  ListFilesQuery,
  IStorageBackend,
} from './types';
import { IFileRepository } from './repositories/types';
import { MemoryFileRepository } from './repositories/memoryRepositories';
import { CubiOCasStorageBackend } from './storageBackend';

export class CubiOFileEngine {
  private repository: IFileRepository;
  private storageBackend: IStorageBackend;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private addressRegistry?: CubiOAddressRegistry;

  constructor(options: {
    repository?: IFileRepository;
    storageBackend?: IStorageBackend;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
    addressRegistry?: CubiOAddressRegistry;
  } = {}) {
    this.repository = options.repository || new MemoryFileRepository();
    this.storageBackend = options.storageBackend || new CubiOCasStorageBackend();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
    this.addressRegistry = options.addressRegistry;
  }

  public getRepository(): IFileRepository {
    return this.repository;
  }

  public getStorageBackend(): IStorageBackend {
    return this.storageBackend;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in FileEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`File Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Resolves recipient to a sovereign CUB-ID.
   */
  public async resolveRecipientCubId(recipientInput: string): Promise<string> {
    const trimmed = recipientInput.trim();
    if (trimmed.startsWith('CUB-')) {
      return trimmed;
    }

    if (this.addressRegistry) {
      const resolution = await this.addressRegistry.resolveAddress(trimmed);
      if (resolution.found && resolution.cubId) {
        return resolution.cubId;
      }
    }

    throw new Error(`File Sharing Error: Recipient '${trimmed}' could not be resolved to any sovereign identity.`);
  }

  /**
   * Uploads a file, storing content in the replaceable backend and updating/creating versions.
   */
  public async uploadFile(
    tokenOrSession: string,
    input: UploadFileInput
  ): Promise<Readonly<FileRecord>> {
    // 1. Authenticate caller (NET-02)
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Evaluate NET-03 authorization for STORAGE_WRITE
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'STORAGE_WRITE',
        resourceUri: 'CUBIO://NETWORK/0/01/00004/STORAGE',
      });

      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'STORAGE_WRITE'.`);
      }
    }

    // 3. Store content into replaceable storage backend
    const mimeType = input.mimeType || 'application/octet-stream';
    const backendResult = await this.storageBackend.putContent(input.content, mimeType, callerCubId);
    const checksum = deterministicHash(typeof input.content === 'string' ? input.content : Array.from(input.content).join(','));

    const namespace = input.namespace || 'default';
    const normPath = input.path.startsWith('/') ? input.path : `/${input.path}`;
    const filename = normPath.split('/').pop() || 'unnamed';
    const now = Date.now();

    // 4. Check if file already exists at this path
    const existing = await this.repository.getFileByPath(callerCubId, namespace, normPath);

    if (existing) {
      const nextVersionNumber = existing.versions.length + 1;
      const versionId = `VER_${deterministicHash(`${existing.fileId}:${nextVersionNumber}:${now}`).slice(2, 18)}`;

      const newVersion: FileVersion = Object.freeze({
        versionId,
        versionNumber: nextVersionNumber,
        casBlockHash: backendResult.casHash,
        storageObjectId: backendResult.storageObjectId,
        sizeBytes: backendResult.sizeBytes,
        checksum,
        mimeType,
        createdAt: now,
        createdBy: callerCubId,
        changeNote: input.changeNote || `Updated to version ${nextVersionNumber}`,
      });

      const updatedFile: FileRecord = Object.freeze({
        ...existing,
        status: 'ACTIVE',
        visibility: input.visibility ?? existing.visibility,
        currentVersion: newVersion,
        versions: Object.freeze([...existing.versions, newVersion]),
        updatedAt: now,
        metadata: input.metadata ? Object.freeze({ ...existing.metadata, ...input.metadata }) : existing.metadata,
      });

      await this.repository.saveFile(updatedFile);
      return updatedFile;
    } else {
      // Create new file
      const fileId = `FILE_${deterministicHash(`${callerCubId}:${namespace}:${normPath}:${now}`).slice(2, 18)}`;
      const versionId = `VER_${deterministicHash(`${fileId}:1:${now}`).slice(2, 18)}`;

      const initialVersion: FileVersion = Object.freeze({
        versionId,
        versionNumber: 1,
        casBlockHash: backendResult.casHash,
        storageObjectId: backendResult.storageObjectId,
        sizeBytes: backendResult.sizeBytes,
        checksum,
        mimeType,
        createdAt: now,
        createdBy: callerCubId,
        changeNote: input.changeNote || 'Initial file upload',
      });

      const newFile: FileRecord = Object.freeze({
        fileId,
        namespace,
        path: normPath,
        filename,
        ownerCubId: callerCubId,
        visibility: input.visibility || 'PRIVATE',
        status: 'ACTIVE',
        currentVersion: initialVersion,
        versions: Object.freeze([initialVersion]),
        acl: Object.freeze([]),
        coordinateUri: 'CUBIO://NETWORK/0/01/00004/STORAGE',
        createdAt: now,
        updatedAt: now,
        metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
      });

      await this.repository.saveFile(newFile);
      return newFile;
    }
  }

  /**
   * Downloads a file and verifies cryptographic integrity against CAS checksum.
   */
  public async downloadFile(
    tokenOrSession: string,
    fileIdOrPath: string,
    options: { versionNumber?: number; namespace?: string } = {}
  ): Promise<Readonly<GetFileResult>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // Resolve file
    let file: FileRecord | undefined;
    if (fileIdOrPath.startsWith('FILE_')) {
      file = await this.repository.getFile(fileIdOrPath);
    } else {
      const namespace = options.namespace || 'default';
      file = await this.repository.getFileByPath(callerCubId, namespace, fileIdOrPath);
    }

    if (!file) {
      throw new Error(`File Error: File '${fileIdOrPath}' not found.`);
    }

    if (file.status === 'TRASHED' || file.status === 'PURGED') {
      throw new Error(`File Error: File '${file.filename}' is in '${file.status}' state.`);
    }

    // Access control evaluation
    const isOwner = file.ownerCubId === callerCubId;
    const isPublic = file.visibility === 'PUBLIC';
    const aclEntry = file.acl.find((entry) => entry.resolvedCubId === callerCubId);
    const hasReadAcl = aclEntry && (aclEntry.permissions.includes('READ') || aclEntry.permissions.includes('ADMIN'));

    if (!isOwner && !isPublic && !hasReadAcl) {
      throw new Error(`Access Denied: Caller '${callerCubId}' is not authorized to read file '${file.fileId}'.`);
    }

    // Resolve version
    let targetVersion: FileVersion = file.currentVersion;
    if (options.versionNumber !== undefined) {
      const matched = file.versions.find((v) => v.versionNumber === options.versionNumber);
      if (!matched) {
        throw new Error(`File Version Error: Version '${options.versionNumber}' not found for file '${file.fileId}'.`);
      }
      targetVersion = matched;
    }

    // Retrieve content from backend
    const content = await this.storageBackend.getContent(targetVersion.casBlockHash);
    if (content === undefined) {
      throw new Error(`File Storage Error: Content block '${targetVersion.casBlockHash}' not found in backend.`);
    }

    // Verify cryptographic integrity
    const verifiedIntegrity = await this.storageBackend.verifyIntegrity(targetVersion.casBlockHash);

    return Object.freeze({
      file,
      version: targetVersion,
      content,
      verifiedIntegrity,
    });
  }

  /**
   * Shares a file with another sovereign identity or @omail.com address.
   */
  public async shareFile(
    tokenOrSession: string,
    input: ShareFileInput
  ): Promise<Readonly<FileRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const file = await this.repository.getFile(input.fileId);

    if (!file) {
      throw new Error(`File Error: File '${input.fileId}' not found.`);
    }

    if (file.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller '${callerCubId}' is not the owner of file '${input.fileId}'.`);
    }

    const resolvedCubId = await this.resolveRecipientCubId(input.recipientCubIdOrAddress);
    const permissions = input.permissions || ['READ'];

    const newAclEntry: FileAclEntry = Object.freeze({
      recipientInput: input.recipientCubIdOrAddress,
      resolvedCubId,
      permissions: Object.freeze([...permissions]),
      grantedAt: Date.now(),
      grantedBy: callerCubId,
    });

    const filteredAcl = file.acl.filter((entry) => entry.resolvedCubId !== resolvedCubId);
    const updatedAcl = Object.freeze([...filteredAcl, newAclEntry]);

    const updatedFile: FileRecord = Object.freeze({
      ...file,
      visibility: 'SHARED',
      acl: updatedAcl,
      updatedAt: Date.now(),
    });

    await this.repository.saveFile(updatedFile);
    return updatedFile;
  }

  /**
   * Rolls back a file to an earlier version.
   */
  public async rollbackVersion(
    tokenOrSession: string,
    input: RollbackVersionInput
  ): Promise<Readonly<FileRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const file = await this.repository.getFile(input.fileId);

    if (!file) {
      throw new Error(`File Error: File '${input.fileId}' not found.`);
    }

    if (file.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller '${callerCubId}' cannot modify file '${input.fileId}'.`);
    }

    const targetHistoricalVersion = file.versions.find((v) => v.versionNumber === input.targetVersionNumber);
    if (!targetHistoricalVersion) {
      throw new Error(`File Error: Target historical version '${input.targetVersionNumber}' not found.`);
    }

    const nextVersionNumber = file.versions.length + 1;
    const now = Date.now();
    const versionId = `VER_${deterministicHash(`${file.fileId}:${nextVersionNumber}:${now}`).slice(2, 18)}`;

    const rollbackVersion: FileVersion = Object.freeze({
      versionId,
      versionNumber: nextVersionNumber,
      casBlockHash: targetHistoricalVersion.casBlockHash,
      storageObjectId: targetHistoricalVersion.storageObjectId,
      sizeBytes: targetHistoricalVersion.sizeBytes,
      checksum: targetHistoricalVersion.checksum,
      mimeType: targetHistoricalVersion.mimeType,
      createdAt: now,
      createdBy: callerCubId,
      changeNote: input.note || `Rolled back to version ${input.targetVersionNumber}`,
    });

    const updatedFile: FileRecord = Object.freeze({
      ...file,
      currentVersion: rollbackVersion,
      versions: Object.freeze([...file.versions, rollbackVersion]),
      updatedAt: now,
    });

    await this.repository.saveFile(updatedFile);
    return updatedFile;
  }

  /**
   * Moves a file to the TRASH.
   */
  public async trashFile(
    tokenOrSession: string,
    fileId: string
  ): Promise<Readonly<FileRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const file = await this.repository.getFile(fileId);

    if (!file || file.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller cannot trash file '${fileId}'.`);
    }

    const trashed: FileRecord = Object.freeze({
      ...file,
      status: 'TRASHED',
      trashedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await this.repository.saveFile(trashed);
    return trashed;
  }

  /**
   * Restores a trashed file back to ACTIVE.
   */
  public async restoreFile(
    tokenOrSession: string,
    fileId: string
  ): Promise<Readonly<FileRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const file = await this.repository.getFile(fileId);

    if (!file || file.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller cannot restore file '${fileId}'.`);
    }

    const restored: FileRecord = Object.freeze({
      ...file,
      status: 'ACTIVE',
      trashedAt: undefined,
      updatedAt: Date.now(),
    });

    await this.repository.saveFile(restored);
    return restored;
  }

  /**
   * Permanently deletes (purges) a file from the repository.
   */
  public async purgeFile(
    tokenOrSession: string,
    fileId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const file = await this.repository.getFile(fileId);

    if (!file || file.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller cannot purge file '${fileId}'.`);
    }

    return this.repository.deleteFile(fileId);
  }

  /**
   * Lists files accessible to the caller.
   */
  public async listFiles(
    tokenOrSession: string,
    query: ListFilesQuery = {}
  ): Promise<readonly FileRecord[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.listFiles(callerCubId, query);
  }
}
