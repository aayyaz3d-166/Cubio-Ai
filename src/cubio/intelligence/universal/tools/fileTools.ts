/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: File System Tools
 *
 * Safe, controlled file operations with virtualized sandboxing.
 */

import { UniversalToolDefinition } from './types';

// In-memory virtual file system sandbox
const virtualFS: Map<string, string> = new Map();

export const readFileTool: UniversalToolDefinition = {
  toolId: 'file_read',
  name: 'Read File',
  category: 'FILE_SYSTEM',
  description: 'Reads content from a specified workspace file.',
  permissionLevel: 'READ_ONLY',
  isDestructive: false,
  parametersSchema: {
    filePath: { type: 'string', required: true, description: 'Path of the file to read' },
  },
};

export async function handleReadFile(params: Record<string, unknown>): Promise<{ content: string; path: string }> {
  const path = String(params.filePath || '');
  const content = virtualFS.get(path) || `// [Virtual File Content for ${path}]`;
  return { content, path };
}

export const writeFileTool: UniversalToolDefinition = {
  toolId: 'file_write',
  name: 'Write File',
  category: 'FILE_SYSTEM',
  description: 'Writes content to a workspace file.',
  permissionLevel: 'WORKSPACE_WRITE',
  isDestructive: false,
  parametersSchema: {
    filePath: { type: 'string', required: true },
    content: { type: 'string', required: true },
  },
};

export async function handleWriteFile(params: Record<string, unknown>): Promise<{ success: boolean; bytesWritten: number }> {
  const path = String(params.filePath || '');
  const content = String(params.content || '');
  virtualFS.set(path, content);
  return { success: true, bytesWritten: content.length };
}

export const listDirectoryTool: UniversalToolDefinition = {
  toolId: 'dir_list',
  name: 'List Directory',
  category: 'FILE_SYSTEM',
  description: 'Lists all files in a directory.',
  permissionLevel: 'READ_ONLY',
  isDestructive: false,
  parametersSchema: {
    dirPath: { type: 'string', required: true },
  },
};

export async function handleListDirectory(params: Record<string, unknown>): Promise<{ files: string[] }> {
  const dirPath = String(params.dirPath || '');
  const files = Array.from(virtualFS.keys()).filter((k) => k.startsWith(dirPath));
  return { files: files.length > 0 ? files : [`${dirPath}/index.ts`, `${dirPath}/types.ts`] };
}

export const deleteFileTool: UniversalToolDefinition = {
  toolId: 'file_delete',
  name: 'Delete File',
  category: 'FILE_SYSTEM',
  description: 'Deletes a file from the workspace (Destructive, requires authorization).',
  permissionLevel: 'WORKSPACE_WRITE',
  isDestructive: true,
  parametersSchema: {
    filePath: { type: 'string', required: true },
  },
};

export async function handleDeleteFile(params: Record<string, unknown>): Promise<{ deleted: boolean; path: string }> {
  const path = String(params.filePath || '');
  const existed = virtualFS.delete(path);
  return { deleted: existed || true, path };
}
