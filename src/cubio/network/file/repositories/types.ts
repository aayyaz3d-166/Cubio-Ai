/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-13: File Repository Interfaces
 */

import {
  FileRecord,
  ListFilesQuery,
  FileStatus,
} from '../types';

export interface IFileRepository {
  saveFile(file: FileRecord): Promise<void>;
  getFile(fileId: string): Promise<FileRecord | undefined>;
  getFileByPath(ownerCubId: string, namespace: string, path: string): Promise<FileRecord | undefined>;
  listFiles(ownerCubId: string, query?: ListFilesQuery): Promise<readonly FileRecord[]>;
  updateFile(fileId: string, updates: Partial<FileRecord>): Promise<FileRecord | undefined>;
  deleteFile(fileId: string): Promise<boolean>;
}
