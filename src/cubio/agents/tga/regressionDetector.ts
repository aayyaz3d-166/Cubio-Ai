/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-003 — TGA (Test & Gate Agent)
 * src/cubio/agents/tga/regressionDetector.ts
 *
 * Regression detection and baseline drift auditor.
 * Detects mutations to certified Phase 8 components, frozen authorities,
 * and breaking contract changes.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TGARegressionStatus } from './types';

export class TGARegressionDetector {
  private readonly rootDir: string;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
  }

  /**
   * Evaluates certified components in manifest to detect regression or drift.
   */
  public auditRegression(simulatedDrift?: readonly string[]): TGARegressionStatus {
    const driftedInvariants: string[] = [];

    if (simulatedDrift && simulatedDrift.length > 0) {
      driftedInvariants.push(...simulatedDrift);
    }

    const manifestPath = path.join(this.rootDir, 'phase8_baseline_manifest.json');
    if (!fs.existsSync(manifestPath)) {
      driftedInvariants.push('Baseline manifest missing: phase8_baseline_manifest.json');
    } else {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Check canonical invariants in manifest
        const dbPath = path.join(this.rootDir, manifest.canonical_invariants.database.path);
        if (fs.existsSync(dbPath)) {
          const stats = fs.statSync(dbPath);
          const hash = crypto
            .createHash('sha256')
            .update(fs.readFileSync(dbPath))
            .digest('hex')
            .toUpperCase();

          if (stats.size !== manifest.canonical_invariants.database.size_bytes) {
            driftedInvariants.push(`Canonical DB size drifted from baseline (${stats.size} B)`);
          }
          if (hash !== manifest.canonical_invariants.database.sha256) {
            driftedInvariants.push(`Canonical DB SHA-256 drifted from baseline (${hash})`);
          }
        }

        const spatialPath = path.join(
          this.rootDir,
          manifest.canonical_invariants.spatial_address.path
        );
        if (fs.existsSync(spatialPath)) {
          const hash = crypto
            .createHash('sha256')
            .update(fs.readFileSync(spatialPath))
            .digest('hex')
            .toUpperCase();

          if (hash !== manifest.canonical_invariants.spatial_address.sha256) {
            driftedInvariants.push(`Spatial 369 core drifted from baseline (${hash})`);
          }
        }
      } catch (err: any) {
        driftedInvariants.push(`Failed to parse baseline manifest: ${err.message}`);
      }
    }

    const regressionDetected = driftedInvariants.length > 0;
    const baselineStatus = regressionDetected ? 'DRIFT_DETECTED' : 'LOCKED_ZERO_DRIFT';

    return Object.freeze({
      regressionDetected,
      driftedInvariants: Object.freeze(driftedInvariants),
      baselineStatus,
    });
  }
}
