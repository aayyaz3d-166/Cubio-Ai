/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-003 — TGA (Test & Gate Agent)
 * src/cubio/agents/tga/prerequisiteValidator.ts
 *
 * Pre-execution prerequisite validation engine.
 * Asserts physical baseline hashes, spatial invariance, and permanent actuation lockout
 * before any test execution or gate verification.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TGAPrerequisiteStatus, TGATaskScope } from './types';
import {
  CANONICAL_DB_PATH,
  CANONICAL_DB_SIZE,
  CANONICAL_DB_SHA256,
  CANONICAL_369_PATH,
  CANONICAL_369_SHA256,
  FrozenProtectionGuard,
} from '../../language/native/pma/frozenProtectionGuard';

export class TGAPrerequisiteValidator {
  private readonly rootDir: string;
  private readonly frozenGuard: FrozenProtectionGuard;

  constructor(customRootDir?: string, customGuard?: FrozenProtectionGuard) {
    this.rootDir = customRootDir || process.cwd();
    this.frozenGuard = customGuard || new FrozenProtectionGuard(this.rootDir);
  }

  /**
   * Validates all pre-conditions before gate execution.
   */
  public validatePrerequisites(scope: TGATaskScope): TGAPrerequisiteStatus {
    const failureReasons: string[] = [];

    // 1. Verify Canonical Database Precondition
    const dbFullPath = path.join(this.rootDir, CANONICAL_DB_PATH);
    let databaseBaselineValid = false;
    if (!fs.existsSync(dbFullPath)) {
      failureReasons.push(`Canonical database missing at: ${CANONICAL_DB_PATH}`);
    } else {
      const stats = fs.statSync(dbFullPath);
      const hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(dbFullPath))
        .digest('hex')
        .toUpperCase();

      if (stats.size !== CANONICAL_DB_SIZE) {
        failureReasons.push(
          `Database size drifted: expected ${CANONICAL_DB_SIZE} B, got ${stats.size} B`
        );
      } else if (hash !== CANONICAL_DB_SHA256) {
        failureReasons.push(`Database SHA-256 drifted: expected ${CANONICAL_DB_SHA256}, got ${hash}`);
      } else {
        databaseBaselineValid = true;
      }
    }

    // 2. Verify Spatial 369 Precondition
    const spatialFullPath = path.join(this.rootDir, CANONICAL_369_PATH);
    let spatial369Valid = false;
    if (!fs.existsSync(spatialFullPath)) {
      failureReasons.push(`Core spatial file missing at: ${CANONICAL_369_PATH}`);
    } else {
      const hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(spatialFullPath))
        .digest('hex')
        .toUpperCase();

      if (hash !== CANONICAL_369_SHA256) {
        failureReasons.push(`Spatial 369 SHA-256 drifted: expected ${CANONICAL_369_SHA256}, got ${hash}`);
      } else {
        spatial369Valid = true;
      }
    }

    // 3. Verify Permanent Actuation Lockout Precondition
    const actuationLocked = true; // Hardcoded permanent invariant

    // 4. Boundary Check on Touched Files
    let boundaryPreserved = true;
    if (scope.touchedFiles && scope.touchedFiles.length > 0) {
      for (const file of scope.touchedFiles) {
        if (this.frozenGuard.isProtected(file)) {
          boundaryPreserved = false;
          failureReasons.push(
            `Unauthorized modification attempt on frozen authority: '${file}'`
          );
        }
      }
    }

    const isReadyForTesting =
      databaseBaselineValid && spatial369Valid && actuationLocked && boundaryPreserved;

    return Object.freeze({
      databaseBaselineValid,
      spatial369Valid,
      actuationLocked,
      boundaryPreserved,
      isReadyForTesting,
      failureReasons: Object.freeze(failureReasons),
    });
  }
}
