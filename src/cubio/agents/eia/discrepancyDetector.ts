/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/discrepancyDetector.ts
 *
 * Discrepancy & drift detector.
 * Audits artifact hashes, chain-of-custody continuity, frozen file boundary
 * integrity, permanent actuation lockout, and canonical database invariance.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  EIAAuditScope,
  EIADiscrepancy,
  EIAEvidenceArtifact,
  EIADiscrepancyType,
} from './types';
import { EIAArtifactIdentity } from './artifactIdentity';
import { EIAChainOfCustody } from './chainOfCustody';
import { FrozenProtectionGuard } from '../../language/native/pma/frozenProtectionGuard';
import { IS_ACTUATION_BLOCKED } from '../../intelligence/core/coreEngineContract';

export const CANONICAL_DB_PATH = 'data/cubio_studio.db';
export const CANONICAL_DB_SIZE = 77824;
export const CANONICAL_DB_SHA256 =
  'e8cb4147dd1dcf73b29fb0ef270b75efd3b93598f3130d0625f9ed4a0df2c493';

export const ADDRESS369_PATH = 'src/core/address369.ts';
export const ADDRESS369_SHA256 =
  '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612';

export class EIADiscrepancyDetector {
  private readonly rootDir: string;
  private readonly identity: EIAArtifactIdentity;
  private readonly frozenGuard: FrozenProtectionGuard;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
    this.identity = new EIAArtifactIdentity(this.rootDir);
    this.frozenGuard = new FrozenProtectionGuard(this.rootDir);
  }

  /**
   * Audits an audit scope and returns all detected discrepancies.
   */
  public auditScope(scope: EIAAuditScope): readonly EIADiscrepancy[] {
    const discrepancies: EIADiscrepancy[] = [];

    // 1. Actuation Lockout Invariant Check
    if (IS_ACTUATION_BLOCKED !== true) {
      discrepancies.push({
        discrepancyId: 'DISC_ACTUATION_BREACH',
        severity: 'CRITICAL',
        type: 'ACTUATION_UNASSERTED',
        description: 'IS_ACTUATION_BLOCKED is false or undefined. Hardware actuation safety breached.',
        targetReference: 'IS_ACTUATION_BLOCKED',
        expected: 'true',
        actual: String(IS_ACTUATION_BLOCKED),
      });
    }

    // 2. Canonical Baseline Invariant Audit
    this.auditBaselineInvariants(discrepancies);

    // 3. Frozen File Boundary Audit
    if (scope.touchedFiles && scope.touchedFiles.length > 0) {
      for (const file of scope.touchedFiles) {
        if (this.frozenGuard.isProtected(file)) {
          discrepancies.push({
            discrepancyId: `DISC_FROZEN_${path.basename(file)}`,
            severity: 'CRITICAL',
            type: 'FROZEN_FILE_TOUCHED',
            description: `Unauthorized modification of protected frozen authority: ${file}`,
            targetReference: file,
          });
        }
      }
    }

    // 4. Artifact Identity & Hash Audit
    if (scope.artifacts && scope.artifacts.length > 0) {
      for (let i = 0; i < scope.artifacts.length; i++) {
        const artifact = scope.artifacts[i];

        if (!artifact.contentHash || artifact.contentHash.length !== 64) {
          discrepancies.push({
            discrepancyId: `DISC_ART_HASH_${i}`,
            severity: 'WARNING',
            type: 'UNLINKED_PROVENANCE',
            description: `Artifact has invalid or missing content hash: ${artifact.uri}`,
            targetReference: artifact.uri,
          });
          continue;
        }

        const res = this.identity.verifyArtifact(artifact);
        if (!res.isValid) {
          const isMissing = res.reason === 'FILE_NOT_FOUND';
          discrepancies.push({
            discrepancyId: `DISC_ART_VERIFY_${i}`,
            severity: 'CRITICAL',
            type: isMissing ? 'MISSING_ARTIFACT' : 'HASH_MISMATCH',
            description: isMissing
              ? `Referenced artifact file not found: ${artifact.uri}`
              : `Artifact hash mismatch for ${artifact.uri}`,
            targetReference: artifact.uri,
            expected: res.expectedHash,
            actual: res.actualHash,
          });
        }
      }
    }

    // 5. Chain of Custody Audit
    if (scope.custodySteps && scope.custodySteps.length > 0) {
      const chainRes = EIAChainOfCustody.verifyChain(scope.custodySteps);
      discrepancies.push(...chainRes.discrepancies);
    }

    // 6. Stage Transition Monotonicity Audit
    if (scope.transitions && scope.transitions.length > 0) {
      for (let i = 0; i < scope.transitions.length; i++) {
        const tr = scope.transitions[i];
        const val = EIAChainOfCustody.validateTransition(tr.fromStage, tr.toStage, tr.agentId);
        if (!val.isMonotonic) {
          discrepancies.push({
            discrepancyId: `DISC_TRANS_${i}`,
            severity: 'CRITICAL',
            type: tr.toStage < tr.fromStage ? 'OUT_OF_ORDER' : 'STAGE_SKIPPED',
            description: val.error || `Invalid transition from RX${tr.fromStage} to RX${tr.toStage}`,
            targetReference: `transition[${i}]`,
            expected: `RX${tr.fromStage} -> RX${tr.fromStage + 1}`,
            actual: `RX${tr.fromStage} -> RX${tr.toStage}`,
          });
        }
      }
    }

    return Object.freeze(discrepancies);
  }

  private auditBaselineInvariants(discrepancies: EIADiscrepancy[]): void {
    // Audit Canonical Database
    const dbFull = path.join(this.rootDir, CANONICAL_DB_PATH);
    if (!fs.existsSync(dbFull)) {
      discrepancies.push({
        discrepancyId: 'DISC_INVARIANT_DB_MISSING',
        severity: 'CRITICAL',
        type: 'INVARIANT_DRIFT',
        description: `Canonical database missing at ${CANONICAL_DB_PATH}`,
        targetReference: CANONICAL_DB_PATH,
      });
    } else {
      const stat = fs.statSync(dbFull);
      if (stat.size !== CANONICAL_DB_SIZE) {
        discrepancies.push({
          discrepancyId: 'DISC_INVARIANT_DB_SIZE',
          severity: 'CRITICAL',
          type: 'INVARIANT_DRIFT',
          description: `Canonical DB size drift: expected ${CANONICAL_DB_SIZE} B, found ${stat.size} B`,
          targetReference: CANONICAL_DB_PATH,
          expected: String(CANONICAL_DB_SIZE),
          actual: String(stat.size),
        });
      }
      const buf = fs.readFileSync(dbFull);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toLowerCase();
      if (hash !== CANONICAL_DB_SHA256) {
        discrepancies.push({
          discrepancyId: 'DISC_INVARIANT_DB_HASH',
          severity: 'CRITICAL',
          type: 'INVARIANT_DRIFT',
          description: 'Canonical DB SHA-256 hash drift',
          targetReference: CANONICAL_DB_PATH,
          expected: CANONICAL_DB_SHA256,
          actual: hash,
        });
      }
    }

    // Audit Address369
    const addrFull = path.join(this.rootDir, ADDRESS369_PATH);
    if (!fs.existsSync(addrFull)) {
      discrepancies.push({
        discrepancyId: 'DISC_INVARIANT_ADDR369_MISSING',
        severity: 'CRITICAL',
        type: 'INVARIANT_DRIFT',
        description: `Core spatial authority missing at ${ADDRESS369_PATH}`,
        targetReference: ADDRESS369_PATH,
      });
    } else {
      const buf = fs.readFileSync(addrFull);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toLowerCase();
      if (hash !== ADDRESS369_SHA256) {
        discrepancies.push({
          discrepancyId: 'DISC_INVARIANT_ADDR369_HASH',
          severity: 'CRITICAL',
          type: 'INVARIANT_DRIFT',
          description: 'Core spatial authority address369.ts SHA-256 drift',
          targetReference: ADDRESS369_PATH,
          expected: ADDRESS369_SHA256,
          actual: hash,
        });
      }
    }
  }
}
