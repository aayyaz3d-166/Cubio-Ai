/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Filesystem Scope Guard
 *
 * Prevents directory traversal (../), root escaping, and unauthorized host path access.
 */

import { FilesystemScopeCheckResult, FilesystemScopeConfig } from './types';

export class FilesystemScopeGuard {
  private defaultConfig: FilesystemScopeConfig = {
    allowedWorkspaceRoots: ['e:/3D memory studio', 'C:/Users/PC/.gemini/antigravity/brain'],
    forbidParentTraversal: true,
    readOnly: false,
  };

  public validatePath(
    targetPath: string,
    isWrite: boolean = false,
    config: FilesystemScopeConfig = this.defaultConfig
  ): Readonly<FilesystemScopeCheckResult> {
    const raw = targetPath.replace(/\\/g, '/').trim();

    if (config.readOnly && isWrite) {
      return Object.freeze({
        inScope: false,
        sanitizedPath: raw,
        error: 'Filesystem is configured in strict READ_ONLY mode.',
      });
    }

    if (config.forbidParentTraversal && (raw.includes('../') || raw.includes('/..') || raw === '..')) {
      return Object.freeze({
        inScope: false,
        sanitizedPath: raw,
        error: 'Path Traversal Detected: Relative parent traversal "../" is strictly forbidden.',
      });
    }

    // Check system root escapes
    const forbiddenSystemRoots = [/^[a-z]:\/windows/i, /^\/etc/i, /^\/var/i, /^[a-z]:\/program files/i];
    for (const forbidden of forbiddenSystemRoots) {
      if (forbidden.test(raw)) {
        return Object.freeze({
          inScope: false,
          sanitizedPath: raw,
          error: `System Directory Escape Detected: Access to "${raw}" is blocked.`,
        });
      }
    }

    // Check workspace boundaries
    const isWithinAllowedRoot = config.allowedWorkspaceRoots.some((root) => {
      const normalizedRoot = root.replace(/\\/g, '/').toLowerCase();
      const normalizedTarget = raw.toLowerCase();
      return normalizedTarget.startsWith(normalizedRoot) || !raw.includes(':');
    });

    if (!isWithinAllowedRoot) {
      return Object.freeze({
        inScope: false,
        sanitizedPath: raw,
        error: `Target path "${raw}" is outside authorized workspace roots.`,
      });
    }

    return Object.freeze({
      inScope: true,
      sanitizedPath: raw,
    });
  }
}
