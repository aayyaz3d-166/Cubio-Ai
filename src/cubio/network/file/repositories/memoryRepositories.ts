/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-13: In-Memory File Repository
 */

import {
  FileRecord,
  ListFilesQuery,
} from '../types';
import { IFileRepository } from './types';

export class MemoryFileRepository implements IFileRepository {
  private filesById: Map<string, FileRecord> = new Map();
  private filesByOwnerPath: Map<string, string> = new Map(); // `${ownerCubId}:${namespace}:${path}` -> fileId

  private buildPathKey(ownerCubId: string, namespace: string, path: string): string {
    const normPath = path.startsWith('/') ? path : `/${path}`;
    return `${ownerCubId}:${namespace.toLowerCase()}:${normPath.toLowerCase()}`;
  }

  public async saveFile(file: FileRecord): Promise<void> {
    const frozen = Object.freeze({ ...file });
    this.filesById.set(file.fileId, frozen);
    const key = this.buildPathKey(file.ownerCubId, file.namespace, file.path);
    this.filesByOwnerPath.set(key, file.fileId);
  }

  public async getFile(fileId: string): Promise<FileRecord | undefined> {
    return this.filesById.get(fileId);
  }

  public async getFileByPath(
    ownerCubId: string,
    namespace: string,
    path: string
  ): Promise<FileRecord | undefined> {
    const key = this.buildPathKey(ownerCubId, namespace, path);
    const id = this.filesByOwnerPath.get(key);
    return id ? this.filesById.get(id) : undefined;
  }

  public async listFiles(
    callerCubId: string,
    query: ListFilesQuery = {}
  ): Promise<readonly FileRecord[]> {
    const matches: FileRecord[] = [];

    for (const file of this.filesById.values()) {
      const isOwner = file.ownerCubId === callerCubId;
      const isSharedWithUser = file.acl.some((entry) => entry.resolvedCubId === callerCubId);
      const isPublic = file.visibility === 'PUBLIC';

      if (!isOwner && !isSharedWithUser && !isPublic) {
        continue;
      }

      if (!query.includeShared && !isOwner) {
        continue;
      }

      if (query.namespace && file.namespace.toLowerCase() !== query.namespace.toLowerCase()) {
        continue;
      }

      if (query.status && file.status !== query.status) {
        continue;
      }

      if (query.visibility && file.visibility !== query.visibility) {
        continue;
      }

      if (query.pathPrefix && !file.path.startsWith(query.pathPrefix)) {
        continue;
      }

      matches.push(file);
    }

    // Sort newest first
    matches.sort((a, b) => b.updatedAt - a.updatedAt);
    return Object.freeze(matches);
  }

  public async updateFile(
    fileId: string,
    updates: Partial<FileRecord>
  ): Promise<FileRecord | undefined> {
    const existing = this.filesById.get(fileId);
    if (!existing) return undefined;

    const updated: FileRecord = Object.freeze({
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    });

    this.filesById.set(fileId, updated);
    return updated;
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    const existing = this.filesById.get(fileId);
    if (!existing) return false;

    const key = this.buildPathKey(existing.ownerCubId, existing.namespace, existing.path);
    this.filesByOwnerPath.delete(key);
    return this.filesById.delete(fileId);
  }
}
