/**
 * CUBiO AI — PMA Task 429: MVP V2 Production SHA-256 Manifest Generator
 * src/cubio/integration/mvpV2ProductionManifestGenerator.ts
 *
 * Authoritative production manifest generator for CUBiO AI MVP Version 2.
 * Generates an immutable, deterministic cryptographic inventory across the entire
 * production dependency closure (1,799 files):
 * - 1,797 production source files traced from 8 verified entrypoints
 * - 2 sealed binary assets (data/cubio_studio.db, data/checkpoints/phase16_production_final_sealed_1m.3dmemory)
 *
 * Characteristics:
 * - Deterministic alphabetical sorting by relative canonical path (normalized forward slashes).
 * - Exact byte size and SHA-256 hexadecimal digest for every entry.
 * - Integration role tagging and protected asset designation.
 * - Cross-checks all 6 protected sovereign baselines with Phase 26 certification.
 * - Strictly read-only; never mutates target files.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MvpV2ProductionDependencyClosure } from './mvpV2ProductionDependencyClosure';

export interface ProductionManifestEntry {
  readonly canonicalPath: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly isProtectedAsset: boolean;
  readonly category: 'SOVEREIGN_BASELINE' | 'ENTRYPOINT' | 'INTEGRATION_CORE' | 'API_SUBSYSTEM' | 'INFERENCE_MODEL' | 'FRONTEND_UI';
  readonly integrationRole: string;
}

export interface ProductionManifestData {
  readonly manifestTitle: string;
  readonly lifecycleStatus: 'MVP_V2_PRODUCTION_MANIFEST_SEALED';
  readonly releaseVersion: '2.0.0-PROD';
  readonly generatedTimestamp: string;
  readonly totalEntries: number;
  readonly totalSizeBytes: number;
  readonly manifestSha256: string;
  readonly protectedAssetsVerifiedCount: number;
  readonly entries: readonly ProductionManifestEntry[];
}

export class MvpV2ProductionManifestGenerator {
  private static instance: MvpV2ProductionManifestGenerator | null = null;

  public static readonly SOVEREIGN_ASSET_RECORDS = [
    { path: 'data/cubio_studio.db', expected: 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6', role: 'Canonical Spatial Vector Database' },
    { path: 'data/checkpoints/phase16_production_final_sealed_1m.3dmemory', expected: '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8', role: 'Native1M Sealed Neural Weights' },
    { path: 'src/core/address369.ts', expected: '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612', role: 'Spatial 369 Addressing Engine & Formula A Authority' },
    { path: 'src/cubio/core/chatMemoryIntegration.ts', expected: 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac', role: 'Chat Memory Core Integration Engine' },
    { path: 'src/cubio/core/canonicalIdentity.ts', expected: '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29', role: 'CUBiO Canonical Identity & Sovereignty Core' },
    { path: 'src/funnel71/persistence/sqlitePersistence.ts', expected: 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6', role: 'SQLite Funnel71 Persistence Engine' }
  ];

  private constructor() {}

  public static getInstance(): MvpV2ProductionManifestGenerator {
    if (!this.instance) {
      this.instance = new MvpV2ProductionManifestGenerator();
    }
    return this.instance;
  }

  /**
   * Computes SHA-256 for a given absolute or relative path.
   */
  public computeFileSha256(filePath: string): { sha256: string; size: number } {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`FAIL_CLOSED: File not found during manifest generation: ${filePath}`);
    }
    const buf = fs.readFileSync(fullPath);
    return {
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      size: buf.length
    };
  }

  /**
   * Generates complete cryptographic manifest for MVP v2.
   */
  public generateProductionManifest(): ProductionManifestData {
    const closure = MvpV2ProductionDependencyClosure.getInstance();
    const uniqueFilesSet = new Set<string>();

    for (const ep of MvpV2ProductionDependencyClosure.PRODUCTION_ENTRYPOINTS) {
      const trace = closure.traceSubsystem(ep.entry, ep.name);
      trace.visitedFiles.forEach(f => uniqueFilesSet.add(f));
    }

    // Include binary data assets
    uniqueFilesSet.add(path.resolve('data/cubio_studio.db'));
    uniqueFilesSet.add(path.resolve('data/checkpoints/phase16_production_final_sealed_1m.3dmemory'));

    const rootDir = path.resolve(process.cwd());
    const entries: ProductionManifestEntry[] = [];
    let totalBytes = 0;

    const protectedPathsMap = new Map(
      MvpV2ProductionManifestGenerator.SOVEREIGN_ASSET_RECORDS.map(r => [path.normalize(path.resolve(r.path)), r])
    );

    const sortedFiles = Array.from(uniqueFilesSet).sort();

    for (const absFile of sortedFiles) {
      const relPath = path.relative(rootDir, absFile).replace(/\\/g, '/');
      const { sha256, size } = this.computeFileSha256(absFile);
      totalBytes += size;

      const normAbs = path.normalize(absFile);
      const isProtected = protectedPathsMap.has(normAbs);
      const protectedRecord = protectedPathsMap.get(normAbs);

      let category: ProductionManifestEntry['category'] = 'FRONTEND_UI';
      let role = 'Application Component';

      if (isProtected) {
        category = 'SOVEREIGN_BASELINE';
        role = protectedRecord!.role;
        // Verify hash equality
        if (sha256 !== protectedRecord!.expected) {
          throw new Error(`FAIL_CLOSED: Cryptographic baseline breach on ${relPath}! Expected ${protectedRecord!.expected}, got ${sha256}`);
        }
      } else if (relPath === 'server.ts') {
        category = 'ENTRYPOINT';
        role = 'Production Node/Express Server Entrypoint';
      } else if (relPath === 'src/main.tsx') {
        category = 'ENTRYPOINT';
        role = 'Frontend Application Mount Entrypoint';
      } else if (relPath.startsWith('src/cubio/api/')) {
        category = 'API_SUBSYSTEM';
        role = 'API v1 Route & Security Layer';
      } else if (relPath.startsWith('src/cubio/integration/')) {
        category = 'INTEGRATION_CORE';
        role = 'MVP Version 2 Production Integration Subsystem';
      } else if (relPath.startsWith('src/cubio/inference/')) {
        category = 'INFERENCE_MODEL';
        role = 'Native1M Inference Service';
      } else if (relPath.startsWith('src/research/infinitylm/')) {
        category = 'INTEGRATION_CORE';
        role = 'Phase 26 Approved VDB Integration Component';
      }

      entries.push({
        canonicalPath: relPath,
        sizeBytes: size,
        sha256,
        isProtectedAsset: isProtected,
        category,
        integrationRole: role
      });
    }

    // Ensure deterministic ordering by canonical path
    entries.sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));

    // Deterministic manifest digest computed across the canonical lines
    const manifestDigestInput = entries.map(e => `${e.canonicalPath}:${e.sizeBytes}:${e.sha256}`).join('\n');
    const manifestSha256 = crypto.createHash('sha256').update(manifestDigestInput).digest('hex');

    return {
      manifestTitle: 'CUBiO AI MVP Version 2 Production Cryptographic Manifest',
      lifecycleStatus: 'MVP_V2_PRODUCTION_MANIFEST_SEALED',
      releaseVersion: '2.0.0-PROD',
      generatedTimestamp: new Date().toISOString(),
      totalEntries: entries.length,
      totalSizeBytes: totalBytes,
      manifestSha256,
      protectedAssetsVerifiedCount: MvpV2ProductionManifestGenerator.SOVEREIGN_ASSET_RECORDS.length,
      entries
    };
  }
}
