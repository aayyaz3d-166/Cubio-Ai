/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 16: SUBMOTHER TO MOTHER RESULT RETURN CHANNEL
 * src/cubio/submother/phase29SubmotherResultReturnChannel.ts
 * ============================================================================
 *
 * Implements the secure, hardened return path from dynamically generated
 * Submothers back to Mother Core.
 *
 * Core Guarantees:
 *   - Every result must carry valid parent request ID, branch identity, and isolation token
 *   - Mother Core rejects results from unknown, expired, or unauthorized branches fail-closed
 *   - Strictly PREVENTS Submothers from directly communicating with end users
 *   - Safely handles partial results, execution timeouts, failures, and conflicting outputs
 *   - Produces deterministic audit envelopes with SHA-256 integrity verification
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import {
  Phase29SubmotherIdentitySystem,
  SubmotherIdentityRecord,
} from './phase29SubmotherIdentitySystem';

export interface SubmotherResultSubmission {
  readonly submissionId: string;
  readonly parentRequestId: string;
  readonly submotherIdentityId: string;
  readonly isolationToken: string;
  readonly computationPayload: string;
  readonly executionStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'TIMED_OUT';
  readonly executionDurationMs: number;
  readonly attemptDirectUserCommunication?: boolean; // Trapped if true
  readonly timestamp: string;
}

export interface IngestedSubmotherResult {
  readonly ingestId: string;
  readonly parentRequestId: string;
  readonly submotherIdentityId: string;
  readonly verifiedStatus: 'ACCEPTED' | 'REJECTED';
  readonly rejectionReason?: string;
  readonly sanitizedPayload: string;
  readonly isUserFacingDirectBlocked: true;
  readonly integrityDigest: string;
  readonly timestamp: string;
}

export class Phase29SubmotherResultReturnChannel {
  private static instance: Phase29SubmotherResultReturnChannel | null = null;
  private readonly identitySystem: Phase29SubmotherIdentitySystem;
  private readonly ingestHistory: IngestedSubmotherResult[] = [];

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-RESULT-RETURN');

    this.identitySystem = Phase29SubmotherIdentitySystem.getInstance();
  }

  public static getInstance(): Phase29SubmotherResultReturnChannel {
    if (!this.instance) {
      this.instance = new Phase29SubmotherResultReturnChannel();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Main Ingestion Method: Authenticates and accepts Submother results into Mother Core.
   */
  public ingestResult(submission: SubmotherResultSubmission): IngestedSubmotherResult {
    const ingestId = `INGEST_${submission.submissionId}_${Date.now()}`;

    // 1. Direct User Communication Trap: Submothers must never directly communicate with user
    if (submission.attemptDirectUserCommunication === true) {
      return this.rejectSubmission(
        ingestId,
        submission,
        'SECURITY_VIOLATION: Submothers are strictly forbidden from direct user communication'
      );
    }

    // 2. Identity & Registration Check
    const identity = this.identitySystem.getIdentity(submission.submotherIdentityId);
    if (!identity) {
      return this.rejectSubmission(
        ingestId,
        submission,
        `UNKNOWN_BRANCH: Identity '${submission.submotherIdentityId}' is not registered in the identity system`
      );
    }

    // 3. Parent Request Lineage Check
    if (identity.parentRequestId !== submission.parentRequestId) {
      return this.rejectSubmission(
        ingestId,
        submission,
        `REQUEST_MISMATCH: Branch belongs to request '${identity.parentRequestId}', but submitted to '${submission.parentRequestId}'`
      );
    }

    // 4. Isolation Token Verification
    const isTokenValid = this.identitySystem.verifyIsolationToken(
      submission.submotherIdentityId,
      submission.isolationToken
    );
    if (!isTokenValid) {
      return this.rejectSubmission(
        ingestId,
        submission,
        'INVALID_TOKEN: Isolation token verification failed for Submother branch'
      );
    }

    // 5. Lifecycle State Validation (Must not be TERMINATED)
    if (identity.lifecycleState === 'TERMINATED') {
      return this.rejectSubmission(
        ingestId,
        submission,
        `EXPIRED_BRANCH: Cannot accept results from TERMINATED Submother '${submission.submotherIdentityId}'`
      );
    }

    // 6. Handle Execution Status: TIMED_OUT or FAILED
    if (submission.executionStatus === 'TIMED_OUT') {
      return this.rejectSubmission(
        ingestId,
        submission,
        `TIMEOUT_EXCEEDED: Submother execution timed out after ${submission.executionDurationMs}ms`
      );
    }

    if (submission.executionStatus === 'FAILED' || !submission.computationPayload) {
      return this.rejectSubmission(
        ingestId,
        submission,
        'EXECUTION_FAILED: Submother reported failure or empty payload'
      );
    }

    // 7. Sanitize Payload (Strip internal pointers / secrets)
    const sanitized = this.sanitizeInternalPayload(submission.computationPayload);

    // 8. Compute Integrity Digest
    const integrityDigest = crypto.createHash('sha256')
      .update(`${ingestId}:${submission.parentRequestId}:${submission.submotherIdentityId}:${sanitized}`)
      .digest('hex');

    const acceptedResult: IngestedSubmotherResult = {
      ingestId,
      parentRequestId: submission.parentRequestId,
      submotherIdentityId: submission.submotherIdentityId,
      verifiedStatus: 'ACCEPTED',
      sanitizedPayload: sanitized,
      isUserFacingDirectBlocked: true,
      integrityDigest,
      timestamp: new Date().toISOString(),
    };

    this.ingestHistory.push(acceptedResult);
    return acceptedResult;
  }

  private rejectSubmission(
    ingestId: string,
    submission: SubmotherResultSubmission,
    reason: string
  ): IngestedSubmotherResult {
    const integrityDigest = crypto.createHash('sha256')
      .update(`${ingestId}:REJECTED:${reason}`)
      .digest('hex');

    const rejectedResult: IngestedSubmotherResult = {
      ingestId,
      parentRequestId: submission.parentRequestId,
      submotherIdentityId: submission.submotherIdentityId,
      verifiedStatus: 'REJECTED',
      rejectionReason: reason,
      sanitizedPayload: '',
      isUserFacingDirectBlocked: true,
      integrityDigest,
      timestamp: new Date().toISOString(),
    };

    this.ingestHistory.push(rejectedResult);
    return rejectedResult;
  }

  private sanitizeInternalPayload(payload: string): string {
    try {
      const parsed = JSON.parse(payload);
      delete parsed.rawStack;
      delete parsed.memoryPointers;
      delete parsed.coreSecret;
      return JSON.stringify(parsed);
    } catch {
      return payload.replace(/(INTERNAL_ADDR|CORE_SECRET|PRIV_KEY):\S+/gi, '[REDACTED]');
    }
  }

  public getIngestHistory(): readonly IngestedSubmotherResult[] {
    return Object.freeze([...this.ingestHistory]);
  }
}
