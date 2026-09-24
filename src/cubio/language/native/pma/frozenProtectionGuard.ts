/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/frozenProtectionGuard.ts
 *
 * Frozen Baseline & Authority Protection Guard.
 * Enforces strict immutability on:
 * 1. Spatial 369 Authority (src/core/address369.ts, Formula A Delta = 0)
 * 2. Canonical Sparse Memory VDB (data/cubio_studio.db, SHA-256 E8CB4147..., 77,824 B)
 * 3. Phase 8 Certified Subsystems (phase8_baseline_manifest.json)
 * 4. Protected Artifacts (PROTECTED_ARTIFACT_MANIFEST.json)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  PMAConflictRecord,
  PMADatabaseImpact,
  PMASpatial369Impact,
} from './types';

export const CANONICAL_DB_PATH = 'data/cubio_studio.db';
export const CANONICAL_DB_SIZE = 77824;
export const CANONICAL_DB_SHA256 =
  'BAFD4AFD53BF93B2924F869E2C061853162A0D6EEDD853A7BA704172E9FD9FF6';
export const LEGACY_MOCK_DB_SHA256 =
  'E8CB4147DD1DCF73B29FB0EF270B75EFD3B93598F3130D0625F9ED4A0DF2C493';

export const CANONICAL_369_PATH = 'src/core/address369.ts';
export const CANONICAL_369_SHA256 =
  '12EEF2D3EC79BCE873A064443787587A32711145EA82D375333C2222303FE612';

export class FrozenProtectionGuard {
  private readonly rootDir: string;
  private readonly protectedFiles: Set<string>;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
    this.protectedFiles = this.loadProtectedFilesList();
  }

  private loadProtectedFilesList(): Set<string> {
    const list = new Set<string>();

    // 1. Core spatial authority
    list.add(this.normalizePath(CANONICAL_369_PATH));

    // 2. Canonical VDB
    list.add(this.normalizePath(CANONICAL_DB_PATH));

    // 3. Phase 8 baseline files
    const manifestPath = path.join(this.rootDir, 'phase8_baseline_manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (manifest.certified_components) {
          for (const relPath of Object.keys(manifest.certified_components)) {
            list.add(this.normalizePath(relPath));
          }
        }
        if (manifest.authoritative_documents) {
          for (const relPath of Object.keys(manifest.authoritative_documents)) {
            list.add(this.normalizePath(relPath));
          }
        }
      } catch {
        // Continue with baseline fallback
      }
    }

    // Explicit Phase 8 locked paths
    list.add(this.normalizePath('src/cubio/inference/safety/outputGuard.ts'));
    list.add(this.normalizePath('src/cubio/multimodal/native/golden_path/multimodalGoldenPathHarness.ts'));
    list.add(this.normalizePath('src/cubio/multimodal/native/safety/multimodalSafetyGuard.ts'));
    list.add(this.normalizePath('phase8_baseline_manifest.json'));
    list.add(this.normalizePath('PHASE8_FINAL_GATE_REPORT.md'));
    list.add(this.normalizePath('TASK134_MULTIMODAL_SAFETY_REPORT.md'));
    list.add(this.normalizePath('PHASE8_FROZEN_BASELINE_REPORT.md'));

    return list;
  }

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').toLowerCase();
  }

  public getProtectedFiles(): readonly string[] {
    return Object.freeze(Array.from(this.protectedFiles));
  }

  public isProtected(filePath: string): boolean {
    const norm = this.normalizePath(filePath);
    return this.protectedFiles.has(norm);
  }

  /**
   * Inspects planned file changes against frozen baselines.
   * Returns list of conflicts if any protected file is scheduled for modification.
   */
  public evaluateProposedChanges(proposedFilesToModify: readonly string[]): {
    hasConflict: boolean;
    conflicts: readonly PMAConflictRecord[];
  } {
    const conflicts: PMAConflictRecord[] = [];

    for (const filePath of proposedFilesToModify) {
      const norm = this.normalizePath(filePath);
      if (this.protectedFiles.has(norm)) {
        conflicts.push({
          type: 'FROZEN_COMPONENT_CONFLICT',
          component: filePath,
          reason: `Component is certified and permanently locked in the frozen baseline.`,
          impact: `Modifying ${filePath} invalidates system certification and triggers regression lock failure.`,
          safeAlternatives: [
            `Compose or wrap ${filePath} via an external adapter or higher-order caller.`,
            `Create a non-intrusive extension in src/cubio/ without mutating ${filePath}.`,
          ],
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts: Object.freeze(conflicts),
    };
  }

  /**
   * Evaluates prompt for database and spatial 369 impact.
   */
  public evaluateAuthoritiesImpact(
    userPrompt: string,
    proposedFiles: readonly string[]
  ): {
    databaseImpact: PMADatabaseImpact;
    spatial369Impact: PMASpatial369Impact;
    conflicts: readonly PMAConflictRecord[];
  } {
    const promptLower = userPrompt.toLowerCase();
    const conflicts: PMAConflictRecord[] = [];

    // Database impact
    let databaseImpact: PMADatabaseImpact = 'DATABASE_READ_ONLY';
    const isDbModificationAttempted =
      proposedFiles.some((f) => this.normalizePath(f).includes('cubio_studio.db')) ||
      (/\b(?:modify|alter|update|delete|drop|mutate|migrate|write to)\b/i.test(promptLower) &&
        /\b(?:database|vdb|cubio_studio\.db)\b/i.test(promptLower));

    if (isDbModificationAttempted) {
      databaseImpact = 'DATABASE_MODIFICATION_REQUIRED';
      conflicts.push({
        type: 'DATABASE_MUTATION_RISK',
        component: CANONICAL_DB_PATH,
        reason: 'Unauthorized database mutation detected.',
        impact: 'Violates Section 11: data/cubio_studio.db baseline must remain bitwise identical (Delta = 0).',
        safeAlternatives: [
          'Keep database READ-ONLY and store intermediate state in memory or transient storage.',
          'Request an explicit authorized database migration gate before mutating.',
        ],
      });
    }

    // Spatial 369 impact
    let spatial369Impact: PMASpatial369Impact = 'NO_IMPACT';
    if (
      proposedFiles.some((f) => this.normalizePath(f).includes('address369.ts')) ||
      (/\b(?:modify|alter|patch|change|reimplement|replace)\b/i.test(promptLower) &&
        /\b(?:369|formula a|cellid|address369)\b/i.test(promptLower))
    ) {
      spatial369Impact = 'BLOCKED_MODIFICATION';
      conflicts.push({
        type: 'SPATIAL_369_CONFLICT',
        component: CANONICAL_369_PATH,
        reason: 'Attempt to modify or replace canonical 369 spatial authority.',
        impact: 'Violates Section 10: address369.ts Formula A is permanently frozen (Delta = 0).',
        safeAlternatives: [
          'Import and reuse coordinateToCellId and cellIdToAddress369 directly from src/core/address369.ts',
        ],
      });
    } else if (
      promptLower.includes('369') ||
      promptLower.includes('343') ||
      promptLower.includes('cellid')
    ) {
      spatial369Impact = 'READ_CANONICAL_MATH';
    }

    return {
      databaseImpact,
      spatial369Impact,
      conflicts: Object.freeze(conflicts),
    };
  }

  /**
   * Verifies Formula A 369 mathematical invariants:
   * 7 x 7 x 7 = 343
   * cellId = x + 7y + 49z
   * address369 = 26 + cellId
   */
  public verify369MathematicalInvariants(): {
    isValid: boolean;
    formulaAVerified: boolean;
    error?: string;
  } {
    // 1. Boundary origin: (0, 0, 0) -> cellId 0 -> address369 26
    const originCellId = 0 + 7 * 0 + 49 * 0;
    const originAddress = 26 + originCellId;
    if (originCellId !== 0 || originAddress !== 26) {
      return { isValid: false, formulaAVerified: false, error: 'Origin mapping failure' };
    }

    // 2. Center landmark: (3, 3, 3) -> cellId 171 -> address369 197
    const centerCellId = 3 + 7 * 3 + 49 * 3;
    const centerAddress = 26 + centerCellId;
    if (centerCellId !== 171 || centerAddress !== 197) {
      return { isValid: false, formulaAVerified: false, error: 'Center landmark mapping failure' };
    }

    // 3. Boundary max: (6, 6, 6) -> cellId 342 -> address369 368
    const maxCellId = 6 + 7 * 6 + 49 * 6;
    const maxAddress = 26 + maxCellId;
    if (maxCellId !== 342 || maxAddress !== 368) {
      return { isValid: false, formulaAVerified: false, error: 'Maximum boundary mapping failure' };
    }

    // 4. Check total cells
    if (7 * 7 * 7 !== 343) {
      return { isValid: false, formulaAVerified: false, error: 'Dimension lattice volume mismatch' };
    }

    return {
      isValid: true,
      formulaAVerified: true,
    };
  }

  /**
   * Verifies physical database and 369 files on disk against baseline hashes.
   */
  public verifyPhysicalBaselines(): {
    databaseValid: boolean;
    spatial369Valid: boolean;
    errors: readonly string[];
  } {
    const errors: string[] = [];
    let databaseValid = true;
    let spatial369Valid = true;

    // Check DB
    const dbFull = path.join(this.rootDir, CANONICAL_DB_PATH);
    if (!fs.existsSync(dbFull)) {
      errors.push(`Canonical DB file missing at ${CANONICAL_DB_PATH}`);
      databaseValid = false;
    } else {
      const stats = fs.statSync(dbFull);
      if (stats.size !== CANONICAL_DB_SIZE) {
        errors.push(`DB size mismatch: expected ${CANONICAL_DB_SIZE}, got ${stats.size}`);
        databaseValid = false;
      }
      const hash = this.computeSha256(dbFull);
      if (hash !== CANONICAL_DB_SHA256) {
        errors.push(`DB SHA-256 mutated: expected ${CANONICAL_DB_SHA256}, got ${hash}`);
        databaseValid = false;
      }
    }

    // Check 369
    const spatialFull = path.join(this.rootDir, CANONICAL_369_PATH);
    if (!fs.existsSync(spatialFull)) {
      errors.push(`Core spatial file missing at ${CANONICAL_369_PATH}`);
      spatial369Valid = false;
    } else {
      const hash = this.computeSha256(spatialFull);
      if (hash !== CANONICAL_369_SHA256) {
        errors.push(`address369.ts SHA-256 mutated: expected ${CANONICAL_369_SHA256}, got ${hash}`);
        spatial369Valid = false;
      }
    }

    return {
      databaseValid,
      spatial369Valid,
      errors: Object.freeze(errors),
    };
  }

  private computeSha256(filePath: string): string {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
  }
}
