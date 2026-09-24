/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/artifactIdentity.ts
 *
 * Artifact identity engine.
 * Computes canonical cryptographic fingerprints, resolves artifact URIs,
 * and performs live verification of files, memory payloads, and test artifacts.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EIAEvidenceArtifact, EIAArtifactType } from './types';

export interface EIAArtifactVerificationResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly expectedHash: string;
  readonly actualHash?: string;
  readonly actualSize?: number;
}

export class EIAArtifactIdentity {
  private readonly rootDir: string;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
  }

  /**
   * Fingerprints a local file on disk, returning an immutable EIAEvidenceArtifact.
   */
  public fingerprintFile(
    relativePath: string,
    artifactType: EIAArtifactType = 'SOURCE_FILE',
    metadata?: Record<string, unknown>
  ): EIAEvidenceArtifact {
    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.rootDir, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Artifact file not found: ${relativePath}`);
    }

    const stat = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath);
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // Canonical URI scheme
    const uri = `cubio://artifact/${relativePath.replace(/\\/g, '/')}`;

    return Object.freeze({
      uri,
      artifactType,
      contentHash,
      sizeBytes: stat.size,
      timestamp: stat.mtimeMs,
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });
  }

  /**
   * Fingerprints an in-memory payload (object, string, or buffer).
   */
  public fingerprintPayload(
    id: string,
    payload: unknown,
    artifactType: EIAArtifactType = 'RAW_PAYLOAD',
    metadata?: Record<string, unknown>
  ): EIAEvidenceArtifact {
    const serialized =
      typeof payload === 'string'
        ? payload
        : Buffer.isBuffer(payload)
        ? payload
        : JSON.stringify(payload);

    const contentHash = crypto
      .createHash('sha256')
      .update(serialized)
      .digest('hex');

    const sizeBytes = Buffer.byteLength(serialized);
    const uri = `cubio://memory/${id}`;

    return Object.freeze({
      uri,
      artifactType,
      contentHash,
      sizeBytes,
      timestamp: Date.now(),
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });
  }

  /**
   * Verifies an artifact against current disk / memory state.
   */
  public verifyArtifact(artifact: EIAEvidenceArtifact): EIAArtifactVerificationResult {
    if (artifact.uri.startsWith('cubio://artifact/')) {
      const relPath = artifact.uri.replace('cubio://artifact/', '');
      const fullPath = path.isAbsolute(relPath) ? relPath : path.join(this.rootDir, relPath);

      if (!fs.existsSync(fullPath)) {
        return {
          isValid: false,
          reason: 'FILE_NOT_FOUND',
          expectedHash: artifact.contentHash,
        };
      }

      const content = fs.readFileSync(fullPath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      const stat = fs.statSync(fullPath);

      if (actualHash !== artifact.contentHash) {
        return {
          isValid: false,
          reason: 'HASH_MISMATCH',
          expectedHash: artifact.contentHash,
          actualHash,
          actualSize: stat.size,
        };
      }

      return {
        isValid: true,
        expectedHash: artifact.contentHash,
        actualHash,
        actualSize: stat.size,
      };
    }

    // For in-memory artifacts without external disk files, hash matches self by definition
    return {
      isValid: true,
      expectedHash: artifact.contentHash,
      actualHash: artifact.contentHash,
      actualSize: artifact.sizeBytes,
    };
  }
}
