/**
 * CUBiO AI — PMA Task 423: Protected Asset Custody Verification
 * src/cubio/integration/mvpV2ProtectedAssetCustodyVerifier.ts
 *
 * Authoritative Custody Verifier for CUBiO AI MVP Version 2.
 * Enforces strict ISO/IEC/IEEE 29119 protected asset custody verification:
 *
 * 1. Compute live SHA-256 digests for all 6 protected assets:
 *    - Canonical VDB (data/cubio_studio.db)
 *    - Spatial Address 369 Authority (src/core/address369.ts)
 *    - Native1M Certified Checkpoint (data/checkpoints/phase16_production_final_sealed_1m.3dmemory)
 *    - Chat Memory Core (src/cubio/core/chatMemoryIntegration.ts)
 *    - Canonical Identity Core (src/cubio/core/canonicalIdentity.ts)
 *    - SQLite Persistence Engine (src/funnel71/persistence/sqlitePersistence.ts)
 *
 * 2. Compares live digests, file sizes, and metadata against certified Phase 26 baselines.
 * 3. Fail-Closed Protocol: Any mismatch immediately throws FailClosedCustodyBreachError.
 *    NEVER attempts auto-repair, overwrite, rollback, or automated restoration.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class FailClosedCustodyBreachError extends Error {
  public readonly assetPath: string;
  public readonly expectedHash: string;
  public readonly actualHash: string;
  public readonly expectedSize?: number;
  public readonly actualSize?: number;

  constructor(
    message: string,
    assetPath: string,
    expectedHash: string,
    actualHash: string,
    expectedSize?: number,
    actualSize?: number
  ) {
    super(message);
    this.name = 'FailClosedCustodyBreachError';
    this.assetPath = assetPath;
    this.expectedHash = expectedHash;
    this.actualHash = actualHash;
    this.expectedSize = expectedSize;
    this.actualSize = actualSize;
    Object.setPrototypeOf(this, FailClosedCustodyBreachError.prototype);
  }
}

export interface ProtectedAssetRecord {
  readonly id: string;
  readonly name: string;
  readonly relativePath: string;
  readonly expectedSha256: string;
  readonly expectedSizeBytes: number;
  readonly category: 'DATABASE' | 'MATHEMATICAL_AUTHORITY' | 'NEURAL_WEIGHTS' | 'CORE_INTELLIGENCE' | 'PERSISTENCE_ENGINE';
  readonly readOnlyEnforced: boolean;
  readonly failClosedPolicy: string;
}

export interface LiveAssetCustodyVerification {
  readonly id: string;
  readonly name: string;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly liveSha256: string;
  readonly expectedSha256: string;
  readonly hashMatch: boolean;
  readonly liveSizeBytes: number;
  readonly expectedSizeBytes: number;
  readonly sizeMatch: boolean;
  readonly exists: boolean;
  readonly lastModifiedIso: string;
  readonly verifiedAtIso: string;
}

export interface CustodyAuditSummary {
  readonly totalAssetsChecked: number;
  readonly totalPassed: number;
  readonly totalFailed: number;
  readonly allPassed: boolean;
  readonly failClosedTriggered: boolean;
  readonly auditTimestamp: string;
  readonly assetVerifications: readonly LiveAssetCustodyVerification[];
  readonly status: 'MVP_V2_ASSET_CUSTODY_VERIFIED' | 'MVP_V2_CUSTODY_BREACH_DETECTED';
}

export class MvpV2ProtectedAssetCustodyVerifier {
  private static instance: MvpV2ProtectedAssetCustodyVerifier | null = null;

  /**
   * Canonical Certified Phase 26 Baseline Registrations
   */
  public static readonly PROTECTED_ASSET_MANIFEST: readonly ProtectedAssetRecord[] = [
    {
      id: 'CANONICAL_VDB',
      name: 'Canonical Spatial Vector Database',
      relativePath: 'data/cubio_studio.db',
      expectedSha256: 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6',
      expectedSizeBytes: 77824,
      category: 'DATABASE',
      readOnlyEnforced: true,
      failClosedPolicy: 'FAIL_CLOSED_NO_RESTORE'
    },
    {
      id: 'ADDRESS369_AUTHORITY',
      name: 'Spatial 369 Addressing Engine & Formula A Authority',
      relativePath: 'src/core/address369.ts',
      expectedSha256: '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612',
      expectedSizeBytes: 6934,
      category: 'MATHEMATICAL_AUTHORITY',
      readOnlyEnforced: true,
      failClosedPolicy: 'FAIL_CLOSED_NO_RESTORE'
    },
    {
      id: 'NATIVE1M_CHECKPOINT',
      name: 'Native1M Sealed 1,000,000 Parameter Neural Weights',
      relativePath: 'data/checkpoints/phase16_production_final_sealed_1m.3dmemory',
      expectedSha256: '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8',
      expectedSizeBytes: 6038463,
      category: 'NEURAL_WEIGHTS',
      readOnlyEnforced: true,
      failClosedPolicy: 'FAIL_CLOSED_NO_RESTORE'
    },
    {
      id: 'CHAT_MEMORY_CORE',
      name: 'Chat Memory Core Integration Engine',
      relativePath: 'src/cubio/core/chatMemoryIntegration.ts',
      expectedSha256: 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac',
      expectedSizeBytes: 28365,
      category: 'CORE_INTELLIGENCE',
      readOnlyEnforced: true,
      failClosedPolicy: 'FAIL_CLOSED_NO_RESTORE'
    },
    {
      id: 'CANONICAL_IDENTITY_CORE',
      name: 'CUBiO Canonical Identity & Sovereignty Core',
      relativePath: 'src/cubio/core/canonicalIdentity.ts',
      expectedSha256: '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29',
      expectedSizeBytes: 8894,
      category: 'CORE_INTELLIGENCE',
      readOnlyEnforced: true,
      failClosedPolicy: 'FAIL_CLOSED_NO_RESTORE'
    },
    {
      id: 'SQLITE_PERSISTENCE_ENGINE',
      name: 'SQLite Funnel71 Persistence Engine',
      relativePath: 'src/funnel71/persistence/sqlitePersistence.ts',
      expectedSha256: 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6',
      expectedSizeBytes: 8783,
      category: 'PERSISTENCE_ENGINE',
      readOnlyEnforced: true,
      failClosedPolicy: 'FAIL_CLOSED_NO_RESTORE'
    }
  ];

  private constructor() {}

  public static getInstance(): MvpV2ProtectedAssetCustodyVerifier {
    if (!this.instance) {
      this.instance = new MvpV2ProtectedAssetCustodyVerifier();
    }
    return this.instance;
  }

  /**
   * Computes live cryptographic SHA-256 digest of a target file.
   */
  public computeLiveHash(relativePath: string): string {
    const fullPath = path.resolve(relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`FAIL_CLOSED: Protected asset missing at path: ${relativePath}`);
    }
    const buffer = fs.readFileSync(fullPath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verifies a single asset against its certified Phase 26 baseline.
   * If failClosedIfMismatch is true, immediately throws FailClosedCustodyBreachError.
   */
  public verifyAsset(
    record: ProtectedAssetRecord,
    failClosedIfMismatch: boolean = true
  ): LiveAssetCustodyVerification {
    const fullPath = path.resolve(record.relativePath);
    const exists = fs.existsSync(fullPath);

    if (!exists) {
      if (failClosedIfMismatch) {
        throw new FailClosedCustodyBreachError(
          `FAIL_CLOSED_BREACH: Protected asset does not exist: ${record.relativePath}`,
          record.relativePath,
          record.expectedSha256,
          'MISSING',
          record.expectedSizeBytes,
          0
        );
      }
      return {
        id: record.id,
        name: record.name,
        relativePath: record.relativePath,
        absolutePath: fullPath,
        liveSha256: 'MISSING',
        expectedSha256: record.expectedSha256,
        hashMatch: false,
        liveSizeBytes: 0,
        expectedSizeBytes: record.expectedSizeBytes,
        sizeMatch: false,
        exists: false,
        lastModifiedIso: 'N/A',
        verifiedAtIso: new Date().toISOString()
      };
    }

    const stat = fs.statSync(fullPath);
    const liveSize = stat.size;
    const buffer = fs.readFileSync(fullPath);
    const liveSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const hashMatch = liveSha256 === record.expectedSha256;
    const sizeMatch = liveSize === record.expectedSizeBytes;

    if ((!hashMatch || !sizeMatch) && failClosedIfMismatch) {
      throw new FailClosedCustodyBreachError(
        `FAIL_CLOSED_BREACH: Protected asset cryptographic mismatch on ${record.relativePath}! Live SHA256: ${liveSha256}, Expected: ${record.expectedSha256}. Live Size: ${liveSize}, Expected: ${record.expectedSizeBytes}. STRICT POLICY: Automatic repair/restoration is PROHIBITED.`,
        record.relativePath,
        record.expectedSha256,
        liveSha256,
        record.expectedSizeBytes,
        liveSize
      );
    }

    return {
      id: record.id,
      name: record.name,
      relativePath: record.relativePath,
      absolutePath: fullPath,
      liveSha256,
      expectedSha256: record.expectedSha256,
      hashMatch,
      liveSizeBytes: liveSize,
      expectedSizeBytes: record.expectedSizeBytes,
      sizeMatch,
      exists: true,
      lastModifiedIso: stat.mtime.toISOString(),
      verifiedAtIso: new Date().toISOString()
    };
  }

  /**
   * Executes audit across all 6 certified sovereign baselines.
   */
  public auditAllProtectedAssets(enforceFailClosed: boolean = true): CustodyAuditSummary {
    const verifications: LiveAssetCustodyVerification[] = [];
    let allPassed = true;
    let failClosedTriggered = false;

    for (const record of MvpV2ProtectedAssetCustodyVerifier.PROTECTED_ASSET_MANIFEST) {
      try {
        const result = this.verifyAsset(record, enforceFailClosed);
        verifications.push(result);
        if (!result.hashMatch || !result.sizeMatch) {
          allPassed = false;
        }
      } catch (err) {
        allPassed = false;
        failClosedTriggered = true;
        if (enforceFailClosed) {
          throw err;
        }
      }
    }

    const totalPassed = verifications.filter(v => v.hashMatch && v.sizeMatch).length;
    const totalFailed = verifications.length - totalPassed;

    return {
      totalAssetsChecked: MvpV2ProtectedAssetCustodyVerifier.PROTECTED_ASSET_MANIFEST.length,
      totalPassed,
      totalFailed,
      allPassed,
      failClosedTriggered,
      auditTimestamp: new Date().toISOString(),
      assetVerifications: verifications,
      status: allPassed ? 'MVP_V2_ASSET_CUSTODY_VERIFIED' : 'MVP_V2_CUSTODY_BREACH_DETECTED'
    };
  }
}
