/**
 * CUBiO AI — Task 193: Native Evidence and Source Provenance Architecture
 * src/cubio/model/native_evidence_provenance/evidenceProvenanceCoordinator.ts
 *
 * Master Orchestrator for Evidence Chaining, Cryptographic Provenance,
 * Epistemic Promotion Verification, and Phase 10/12 Integration.
 */

import {
  TASK_193_ID,
  IS_ACTUATION_BLOCKED,
  ProvenanceDescriptor,
  EvidenceVerificationResult,
  CanonicalPromotionCandidate,
  Phase10ProvenanceAdvisory,
  EvidenceProvenanceActuationBlockedError,
  EvidenceProvenanceTenantViolationError,
  EvidenceMissingError,
} from './types';
import { EvidenceChainBuilder, RawChainNodeInput } from './evidenceChainBuilder';
import { EvidenceValidator } from './evidenceValidator';
import { ProvenanceRegistry } from './provenanceRegistry';

export class EvidenceProvenanceCoordinator {
  private readonly tenantId: string;
  private readonly advisories: Phase10ProvenanceAdvisory[] = [];

  constructor(tenantId: string) {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new EvidenceProvenanceTenantViolationError('Tenant ID cannot be empty');
    }
    this.tenantId = tenantId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Constructs an evidence chain, validates its cryptographic integrity,
   * registers it, and returns a zero-copy ProvenanceDescriptor.
   */
  public buildAndRegisterChain(
    claimId: string,
    rawNodes: readonly RawChainNodeInput[],
    creationTimestamp: number = 1000
  ): ProvenanceDescriptor {
    this.assertActuationBlocked();

    // 1. Build chain
    const chain = EvidenceChainBuilder.buildChain(
      claimId,
      this.tenantId,
      rawNodes,
      creationTimestamp
    );

    // 2. Validate chain integrity
    const verification = EvidenceValidator.validateChain(chain, true);

    // 3. Register chain and generate zero-copy descriptor
    const descriptor = ProvenanceRegistry.register(chain, verification.valid);

    // 4. Emit Phase 10 reasoning advisory
    this.emitAdvisory(
      claimId,
      verification.status,
      [
        `Evidence chain built with depth ${chain.nodes.length}`,
        `Composite hash: ${chain.compositeHash}`,
        `Root sources: ${chain.rootSourceIds.join(', ')}`,
      ],
      chain.compositeHash
    );

    return descriptor;
  }

  /**
   * Verifies the evidence backing a specific claim fail-closed.
   */
  public verifyClaimEvidence(claimId: string): EvidenceVerificationResult {
    this.assertActuationBlocked();
    const descriptor = ProvenanceRegistry.getDescriptorByClaim(claimId, this.tenantId);
    if (!descriptor) {
      throw new EvidenceMissingError(claimId, `No evidence chain registered for claim '${claimId}'`);
    }

    const chain = ProvenanceRegistry.getChain(descriptor.provenanceId, this.tenantId);
    if (!chain) {
      throw new EvidenceMissingError(claimId, `Chain payload missing for provenance '${descriptor.provenanceId}'`);
    }

    const result = EvidenceValidator.validateChain(chain, true);

    this.emitAdvisory(
      claimId,
      result.status,
      [
        `Claim evidence verified: valid=${result.valid}`,
        `Chain depth: ${result.chainDepth}`,
        `Composite hash: ${result.compositeHash}`,
      ],
      result.compositeHash
    );

    return result;
  }

  /**
   * Evaluates a candidate for promotion to canonical status, rejecting unsupported claims fail-closed.
   */
  public evaluateAndPromote(
    candidate: CanonicalPromotionCandidate
  ): { promoted: boolean; descriptor: ProvenanceDescriptor; reason?: string } {
    this.assertActuationBlocked();

    if (candidate.tenantId !== this.tenantId) {
      throw new EvidenceProvenanceTenantViolationError(
        `Candidate tenant '${candidate.tenantId}' does not match coordinator tenant '${this.tenantId}'`
      );
    }

    const descriptor = ProvenanceRegistry.getDescriptorByClaim(candidate.claimId, this.tenantId);
    if (!descriptor) {
      throw new EvidenceMissingError(candidate.claimId, 'Cannot promote claim without registered evidence chain');
    }

    const chain = ProvenanceRegistry.getChain(descriptor.provenanceId, this.tenantId);
    if (!chain) {
      throw new EvidenceMissingError(candidate.claimId, 'Chain payload not found');
    }

    // Epistemic anti-promotion guard
    EvidenceValidator.validatePromotion(candidate, chain, true);

    this.emitAdvisory(
      candidate.claimId,
      'VERIFIED',
      [
        `Claim '${candidate.claimId}' successfully promoted to '${candidate.requestedEpistemicTier}'`,
        `Root sources verified: ${chain.rootSourceIds.join(', ')}`,
      ],
      chain.compositeHash
    );

    return {
      promoted: true,
      descriptor,
      reason: `Claim verified and promoted to ${candidate.requestedEpistemicTier} with rigorous provenance`,
    };
  }

  /**
   * Retrieves lightweight zero-copy descriptors for long-context retrieval with paging.
   */
  public getZeroCopyDescriptors(pageSize: number = 50, offset: number = 0): readonly ProvenanceDescriptor[] {
    this.assertActuationBlocked();
    const all = ProvenanceRegistry.listDescriptors(this.tenantId);
    return all.slice(offset, offset + pageSize);
  }

  /**
   * Returns emitted Phase 10 reasoning advisories.
   */
  public getAdvisories(): readonly Phase10ProvenanceAdvisory[] {
    return [...this.advisories];
  }

  /**
   * Emits an advisory to Phase 10 reasoning logs.
   */
  private emitAdvisory(
    claimId: string,
    status: any,
    reasonTrail: readonly string[],
    compositeHash: string
  ): void {
    const advisory: Phase10ProvenanceAdvisory = {
      advisoryId: `ADV-PROV-${compositeHash.slice(0, 16)}`,
      tenantId: this.tenantId,
      claimId,
      verificationStatus: status,
      reasonTrail,
      compositeHash,
      emittedAt: 1000,
    };
    this.advisories.push(advisory);
  }

  /**
   * Enforces permanent hardware actuation lockout.
   */
  private assertActuationBlocked(): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new EvidenceProvenanceActuationBlockedError('UNBLOCK_ACTUATION');
    }
  }

  /**
   * Simulates actuation attempt for verification.
   */
  public triggerActuationAttempt(): void {
    throw new EvidenceProvenanceActuationBlockedError('PHYSICAL_MOTOR_TRIGGER');
  }
}
