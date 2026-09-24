/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Master Safety & Governance Engine
 *
 * Coordinates Guardrails, Policy Engine, Epistemic Governance, and Immutable Audit Ledger.
 */

import {
  ComplianceReport,
  ISafetyGovernanceEngine,
  PolicyEvaluationResult,
  SafetyAuditRecord,
  SafetyGuardrailCheckResult,
} from './types';
import { SafetyGuardrails } from './guardrails';
import { GovernancePolicyEngine } from './policyEngine';
import { GovernanceAuditor } from './governanceAuditor';

export class CubiOSafetyGovernanceEngine implements ISafetyGovernanceEngine {
  private guardrails = new SafetyGuardrails();
  private policyEngine = new GovernancePolicyEngine();
  private auditor = new GovernanceAuditor();

  /**
   * Pre-execution safety inspection.
   */
  public async evaluateSafety(
    prompt: string,
    context?: Readonly<Record<string, unknown>>
  ): Promise<Readonly<SafetyGuardrailCheckResult>> {
    return this.guardrails.inspectPrompt(prompt);
  }

  /**
   * Evaluates action against governance policies and authorization gates.
   */
  public evaluatePolicy(
    action: string,
    metadata?: Readonly<Record<string, unknown>>
  ): Readonly<PolicyEvaluationResult> {
    return this.policyEngine.evaluateAction(action, metadata);
  }

  /**
   * Records execution in immutable audit ledger.
   */
  public auditExecution(
    prompt: string,
    result: unknown,
    isAllowed: boolean = true
  ): Readonly<SafetyAuditRecord> {
    const violations: string[] = isAllowed ? [] : ['Request blocked by safety guardrails or policy engine.'];
    const guardrailScore = isAllowed ? 0.01 : 0.95;
    return this.auditor.recordAudit(prompt, isAllowed, guardrailScore, violations);
  }

  /**
   * Generates compliance report.
   */
  public generateComplianceReport(): Readonly<ComplianceReport> {
    const rules = this.policyEngine.getRules();
    return this.auditor.generateComplianceReport(rules.length);
  }
}
