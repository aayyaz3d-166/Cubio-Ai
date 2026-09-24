/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/pmaPlanner.ts
 *
 * Pre-Development Intelligence Gate & Planning Engine.
 * Integrates ProjectNavigator, CapabilityResolver, FrozenProtectionGuard,
 * and SovereigntySafetyGuard to generate the strict PMA Developer Handoff Contract.
 */

import * as crypto from 'crypto';
import {
  PMATaskRequest,
  PMATaskType,
  PMAHandoffContract,
  PMAConflictRecord,
  PMAReuseStrategy,
} from './types';
import { ProjectNavigator } from './projectNavigator';
import { CapabilityResolver } from './capabilityResolver';
import { FrozenProtectionGuard } from './frozenProtectionGuard';
import { SovereigntySafetyGuard } from './sovereigntySafetyGuard';

export class PMAPlanner {
  private readonly navigator: ProjectNavigator;
  private readonly capabilityResolver: CapabilityResolver;
  private readonly frozenGuard: FrozenProtectionGuard;
  private readonly safetyGuard: SovereigntySafetyGuard;

  constructor(customRootDir?: string) {
    this.navigator = new ProjectNavigator(customRootDir);
    this.capabilityResolver = new CapabilityResolver();
    this.frozenGuard = new FrozenProtectionGuard(customRootDir);
    this.safetyGuard = new SovereigntySafetyGuard();
  }

  /**
   * Classifies user prompt into a task type.
   */
  public classifyTask(userPrompt: string): PMATaskType {
    const lower = userPrompt.toLowerCase();

    if (
      lower.includes('architecture') ||
      lower.includes('refactor entire') ||
      lower.includes('system overhaul')
    ) {
      return 'ARCHITECTURAL';
    }

    if (
      lower.includes('security') ||
      lower.includes('sovereignty') ||
      lower.includes('audit security') ||
      lower.includes('external ai')
    ) {
      return 'SECURITY';
    }

    if (lower.includes('migration') || lower.includes('migrate database')) {
      return 'MIGRATION';
    }

    if (
      (lower.includes('vision') && lower.includes('audio')) ||
      (lower.includes('multimodal') && lower.includes('language')) ||
      lower.includes('cross-modal') ||
      lower.includes('across subsystems')
    ) {
      return 'CROSS_SUBSYSTEM';
    }

    if (
      lower.includes('what is') ||
      lower.includes('explain') ||
      lower.includes('investigate') ||
      lower.includes('where is')
    ) {
      return 'INVESTIGATION';
    }

    if (
      lower.includes('add') ||
      lower.includes('implement') ||
      lower.includes('build') ||
      lower.includes('feature') ||
      lower.includes('extend')
    ) {
      return 'FEATURE';
    }

    if (lower.length < 5 || /^\s*(?:hi|hello|test|foo|bar)\s*$/i.test(lower)) {
      return 'UNKNOWN';
    }

    return 'SIMPLE';
  }

  /**
   * Evaluates previous task continuity by identifying relevant reports and baselines.
   */
  public resolvePreviousTaskContinuity(subsystem: string): {
    relevantReports: readonly string[];
    baselineStatus: string;
  } {
    const subDef = this.navigator.getSubsystem(subsystem);
    if (subDef) {
      return {
        relevantReports: subDef.reports,
        baselineStatus: subDef.isFrozen ? 'FROZEN_BASELINE' : 'CERTIFIED_ACTIVE',
      };
    }

    return {
      relevantReports: ['reports/forensic/CUBIO_3D_MEMORY_STUDIO_MASTER_FORENSIC_REPORT.md'],
      baselineStatus: 'GENERAL_BASELINE',
    };
  }

  /**
   * Runs the full Pre-Development Gate and generates the PMA Developer Handoff Contract.
   */
  public generateHandoffContract(request: PMATaskRequest): PMAHandoffContract {
    const taskId = request.requestId || `PMA_TASK_${Date.now()}`;
    const taskType = request.taskType || this.classifyTask(request.userPrompt);

    // 1. Task Parsing & Scope Resolution via Navigation Layer
    const scope = this.navigator.resolveSubsystemScope(request, taskType);

    // 2. Existing Capability Resolution (REUSE -> COMPOSE -> EXTEND -> NEW)
    const { matchedCapabilities, primaryStrategy, potentialDuplicates } =
      this.capabilityResolver.resolveCapabilitiesForTask(request.userPrompt, scope.affectedSubsystems);

    // 3. Security & Sovereignty Check
    const { impact: securityImpact, conflicts: securityConflicts } =
      this.safetyGuard.evaluateSecurityImpact(request.userPrompt);

    // 4. Proposed Files Determination
    let proposedAllowedFiles: string[] = [];
    if (request.allowedFileOverrides && request.allowedFileOverrides.length > 0) {
      proposedAllowedFiles = [...request.allowedFileOverrides];
    } else {
      // Derive allowed files based on subsystem key files and task scope
      if (scope.primarySubsystem === 'PROJECT_MANAGER_AGENT') {
        proposedAllowedFiles = [
          'src/cubio/language/native/pma/types.ts',
          'src/cubio/language/native/pma/projectNavigator.ts',
          'src/cubio/language/native/pma/capabilityResolver.ts',
          'src/cubio/language/native/pma/frozenProtectionGuard.ts',
          'src/cubio/language/native/pma/sovereigntySafetyGuard.ts',
          'src/cubio/language/native/pma/pmaPlanner.ts',
          'src/cubio/language/native/pma/postDevelopmentVerifier.ts',
          'src/cubio/language/native/pma/projectMemory.ts',
          'src/cubio/language/native/pma/projectManagerAgent.ts',
          'src/cubio/language/native/pma/index.ts',
          'src/test_pma_native_orchestrator.ts',
        ];
      } else {
        proposedAllowedFiles = scope.relevantFiles.filter((f) => !this.frozenGuard.isProtected(f));
      }
    }

    // 5. Frozen Protection & Database/369 Authority Check
    const { hasConflict: hasFrozenConflict, conflicts: frozenConflicts } =
      this.frozenGuard.evaluateProposedChanges(proposedAllowedFiles);

    const { databaseImpact, spatial369Impact, conflicts: authorityConflicts } =
      this.frozenGuard.evaluateAuthoritiesImpact(request.userPrompt, proposedAllowedFiles);

    // 6. Aggregate Conflicts
    const allConflicts: PMAConflictRecord[] = [
      ...potentialDuplicates,
      ...securityConflicts,
      ...frozenConflicts,
      ...authorityConflicts,
    ];

    // Check for ambiguous scope
    if (taskType === 'UNKNOWN') {
      allConflicts.push({
        type: 'AMBIGUOUS_REQUIREMENT',
        component: 'TASK_PARSER',
        reason: 'The user prompt is too brief or ambiguous to determine engineering scope.',
        impact: 'Risk of misdirected development or unbounded modifications.',
        safeAlternatives: ['Request requirement clarification with explicit subsystem goals before proceeding.'],
      });
    }

    // 7. Protected Files List
    const protectedFiles = this.frozenGuard.getProtectedFiles();

    // 8. Determine Approval Status
    const isApproved = allConflicts.length === 0;
    const rejectionReason = !isApproved
      ? allConflicts.map((c) => `[${c.type}] ${c.reason} (${c.impact})`).join(' | ')
      : undefined;

    // 9. Required Tests & Invariants
    const requiredTestsSet = new Set<string>();
    requiredTestsSet.add('src/test_phase8_regression_lock.ts');
    for (const f of scope.relevantFiles) {
      if (f.startsWith('src/test_')) {
        requiredTestsSet.add(f);
      }
    }
    if (scope.primarySubsystem === 'PROJECT_MANAGER_AGENT') {
      requiredTestsSet.add('src/test_pma_native_orchestrator.ts');
    }

    const regressionRequirements = [
      'Phase 8 Regression Lock (16/16 gates pass)',
      'Database SHA-256 E8CB4147... and size 77,824 B unchanged (Delta = 0)',
      'Spatial address369.ts SHA-256 12EEF2D3... unchanged (Delta = 0)',
      'Hardware actuation lockout immutable (is_actuation_blocked = true)',
      'Zero external AI runtime dependencies',
    ];

    const expectedInvariants = [
      'Formula A: 7x7x7 = 343, cellId = x + 7y + 49z, address369 = 26 + cellId',
      'Canonical Identity: Multi-tenant isolation preserved',
      'Bounded memory cache: < 128 MB ResourceGovernor threshold',
      'Bitwise deterministic execution',
    ];

    // 10. Compute Deterministic Handoff Hash
    const contractPayload = JSON.stringify({
      taskId,
      userPrompt: request.userPrompt,
      primarySubsystem: scope.primarySubsystem,
      allowedFiles: proposedAllowedFiles.sort(),
      reuseStrategy: primaryStrategy,
      databaseImpact,
      spatial369Impact,
      isApproved,
    });
    const handoffHash = crypto.createHash('sha256').update(contractPayload).digest('hex');

    return Object.freeze({
      taskId,
      objective: request.userPrompt,
      scope,
      relevantFiles: scope.relevantFiles,
      existingCapabilities: matchedCapabilities,
      reuseStrategy: primaryStrategy,
      allowedFiles: Object.freeze(proposedAllowedFiles),
      protectedFiles: Object.freeze(protectedFiles),
      dependencies: Object.freeze(Array.from(new Set(matchedCapabilities.flatMap((c) => c.dependencies)))),
      databaseImpact,
      spatial369Impact,
      securityImpact,
      requiredTests: Object.freeze(Array.from(requiredTestsSet)),
      regressionRequirements: Object.freeze(regressionRequirements),
      expectedInvariants: Object.freeze(expectedInvariants),
      rollbackConsiderations:
        'If post-development verification fails, discard uncommitted changes via git checkout on allowed files.',
      conflicts: Object.freeze(allConflicts),
      handoffHash,
      isApprovedForDevelopment: isApproved,
      rejectionReason,
      timestamp: Date.now(),
    });
  }
}
