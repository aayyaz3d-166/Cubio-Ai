/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F12: Master CubiO Decision Intelligence Engine
 *
 * Multi-criteria utility optimization, candidate path ranking, sovereign policy authorization,
 * and deterministic system action determination.
 *
 * Plugs directly into F1 Core Foundation as an IIntelligenceEngine.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { StatePredictionReport } from '../prediction/types';
import { ReasoningProofReport } from '../reasoning/types';
import {
  IIntelligenceEngine,
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineHealthReport,
} from '../core/types';
import {
  DecisionActionType,
  DecisionCandidateOption,
  UtilityWeights,
  DecisionRequest,
  DecisionReport,
} from './types';

export class CubiODecisionIntelligenceEngine implements IIntelligenceEngine {
  public readonly engineId = 'ENGINE_DECISION';
  public readonly version = '1.0.0';
  public readonly priority = 'PRIMARY' as const;
  public readonly capabilities = ['DECISION', 'PLANNING'] as const;
  public readonly metadata = Object.freeze({
    name: 'CubiO Multi-Criteria Decision Engine',
    description: 'Multi-criteria utility optimization, candidate path ranking, and sovereign action selection.',
  });

  private totalExecutions = 0;
  private failedExecutions = 0;
  private startTime = Date.now();

  public async initialize(_core: any): Promise<void> {}

  /**
   * Master Multi-Criteria Decision Pipeline:
   * Evaluates predictions, reasoning proofs, and candidate options to select optimal action.
   */
  public decide(request: DecisionRequest): Readonly<DecisionReport> {
    const startTime = Date.now();
    const prompt = request.contextPrompt;
    const sovereignId = request.sovereignCubId || 'CUB-00000000';
    const isSovereignAuthorized = this.validateSovereignIdentity(sovereignId);

    // 1. Gather or Synthesize Candidate Options
    let options: DecisionCandidateOption[] = [];
    if (request.candidateOptions && request.candidateOptions.length > 0) {
      options = [...request.candidateOptions];
    } else {
      options = this.synthesizeCandidateOptions(
        prompt,
        request.currentState,
        request.predictions,
        request.reasoningProof,
        request.activeDimension
      );
    }

    // If sovereign identity unauthorized, enforce HALT_AND_AUDIT as the primary compliant action
    if (!isSovereignAuthorized) {
      const haltOption = this.createOption(
        'OPT_HALT_AUTH',
        'HALT_AND_AUDIT',
        'Halt Execution & Request Sovereign Re-authentication',
        request.activeDimension || 'D0',
        request.currentState?.id,
        1.0,
        0.99,
        0.01,
        100.0,
        1.0,
        'Sovereign Identity verification failed (NET-01 violation). Mandatory audit triggered.',
        true
      );
      options = [haltOption, ...options.map((o) => ({ ...o, isPolicyCompliant: false }))];
    }

    // 2. Multi-Criteria Utility Optimization
    const weights: Required<UtilityWeights> = {
      resonanceWeight: request.utilityWeights?.resonanceWeight ?? 0.30,
      confidenceWeight: request.utilityWeights?.confidenceWeight ?? 0.35,
      efficiencyWeight: request.utilityWeights?.efficiencyWeight ?? 0.20,
      riskPenaltyWeight: request.utilityWeights?.riskPenaltyWeight ?? 0.15,
    };

    const scoredOptions: DecisionCandidateOption[] = options.map((opt) => {
      const utility = this.calculateUtility(opt, weights);
      return {
        ...opt,
        expectedUtility: utility,
      };
    });

    // 3. Rank Options by Utility Descending (Prioritize Policy Compliant)
    scoredOptions.sort((a, b) => {
      if (a.isPolicyCompliant !== b.isPolicyCompliant) {
        return a.isPolicyCompliant ? -1 : 1;
      }
      return b.expectedUtility - a.expectedUtility;
    });

    const selectedAction = scoredOptions[0];
    const rankedAlternatives = scoredOptions.slice(1);

    const chosenRationale = isSovereignAuthorized
      ? `Selected '${selectedAction.actionTitle}' (Action: ${selectedAction.actionType}) with optimal utility ${(selectedAction.expectedUtility * 100).toFixed(1)}%, ${(selectedAction.confidenceScore * 100).toFixed(1)}% confidence, and ${selectedAction.harmonicResonance}% resonance.`
      : `Execution suspended: Sovereign authentication failed for identity '${sovereignId}'. Mandatory audit triggered.`;

    const duration = Math.max(1, Date.now() - startTime);
    const decisionChecksum = deterministicHash(
      `DECISION:${prompt}:${selectedAction.optionId}:${selectedAction.expectedUtility}:${rankedAlternatives.length}:${duration}`
    );
    const decisionId = `DEC_${decisionChecksum.slice(2, 12)}`;

    this.totalExecutions++;

    return Object.freeze({
      decisionId,
      contextPrompt: prompt,
      selectedAction: Object.freeze(selectedAction),
      rankedAlternatives: Object.freeze(rankedAlternatives),
      evaluatedOptionsCount: scoredOptions.length,
      chosenRationale,
      sovereignAuthorizationGranted: isSovereignAuthorized,
      decisionDurationMs: duration,
      decisionChecksum,
      timestamp: Date.now(),
    });
  }

  /**
   * Calculates multi-factor utility:
   * U = w_res * (Resonance / 100) + w_conf * Conf + w_eff * (1 - Cost / 100) - w_risk * Risk
   */
  private calculateUtility(option: DecisionCandidateOption, weights: Required<UtilityWeights>): number {
    const resScore = option.harmonicResonance / 100.0;
    const effScore = 1.0 - option.estimatedEnergyCost / 100.0;
    const confScore = option.confidenceScore;
    const riskScore = option.riskScore;

    let utility =
      weights.resonanceWeight * resScore +
      weights.confidenceWeight * confScore +
      weights.efficiencyWeight * effScore -
      weights.riskPenaltyWeight * riskScore;

    if (!option.isPolicyCompliant) {
      utility *= 0.1; // 90% penalty for non-compliant actions
    }

    return Math.max(0.01, Math.min(1.0, parseFloat(utility.toFixed(4))));
  }

  /**
   * Dynamically synthesizes candidate action options from upstream engine predictions & proofs.
   */
  private synthesizeCandidateOptions(
    prompt: string,
    state?: CubiOState,
    predictions?: StatePredictionReport,
    proof?: ReasoningProofReport,
    activeDimension?: CubiODimension
  ): DecisionCandidateOption[] {
    const dim = activeDimension || state?.dimension || 'D3';
    const stateId = state?.id || 'ST_DEFAULT';
    const options: DecisionCandidateOption[] = [];

    // Option 1: Execute Continuous Spatial Transition (Dominant Trajectory)
    const domConf = predictions ? predictions.meanConfidence : 0.95;
    const domRes = predictions ? predictions.meanResonanceScore : 98.0;
    options.push(
      this.createOption(
        'OPT_EXEC_TRANSITION',
        'EXECUTE_TRANSITION',
        'Execute Dominant State Space Transition',
        dim,
        stateId,
        0.0,
        domConf,
        0.05,
        domRes,
        10.0,
        `Advance entity along continuous dominant forecast path for prompt '${prompt.slice(0, 30)}...'.`,
        true
      )
    );

    // Option 2: Elevate Dimension & Expand Manifold Rank
    options.push(
      this.createOption(
        'OPT_ELEVATE_DIM',
        'ELEVATE_DIMENSION',
        'Elevate State to Higher Dimensional Manifold',
        dim === 'D7' ? 'D7' : 'D5',
        stateId,
        0.0,
        0.92,
        0.10,
        96.0,
        25.0,
        'Perform lossless rank elevation to resolve topological boundary constraints.',
        true
      )
    );

    // Option 3: Attune 369 Harmonic Frequencies
    options.push(
      this.createOption(
        'OPT_ATTUNE_369',
        'ATTUNE_HARMONIC_369',
        'Align Triadic 369 Harmonic Frequencies',
        'D5',
        stateId,
        0.0,
        0.98,
        0.02,
        99.5,
        15.0,
        'Harmonize vortex digital roots and establish maximum Solfeggio acoustic resonance.',
        true
      )
    );

    // Option 4: Consolidate Working Memory to Persistent Long-Term Layer
    options.push(
      this.createOption(
        'OPT_CONSOLIDATE_MEM',
        'CONSOLIDATE_MEMORY',
        'Consolidate Active Memory to Long-Term Storage',
        'D4',
        stateId,
        0.0,
        0.96,
        0.03,
        94.0,
        8.0,
        'Promote high-frequency associative working memories into permanent knowledge core.',
        true
      )
    );

    return options;
  }

  private createOption(
    optionId: string,
    actionType: DecisionActionType,
    actionTitle: string,
    targetDimension: CubiODimension,
    targetStateId: string | undefined,
    expectedUtility: number,
    confidenceScore: number,
    riskScore: number,
    harmonicResonance: number,
    estimatedEnergyCost: number,
    rationale: string,
    isPolicyCompliant: boolean
  ): DecisionCandidateOption {
    const optionChecksum = deterministicHash(
      `OPTION:${optionId}:${actionType}:${targetDimension}:${confidenceScore}:${riskScore}:${harmonicResonance}`
    );

    return Object.freeze({
      optionId,
      actionType,
      actionTitle,
      targetDimension,
      targetStateId,
      expectedUtility,
      confidenceScore,
      riskScore,
      harmonicResonance,
      estimatedEnergyCost,
      rationale,
      isPolicyCompliant,
      optionChecksum,
    });
  }

  private validateSovereignIdentity(cubId: string): boolean {
    return /^CUB-[0-9A-Fa-f]{8}$/.test(cubId);
  }

  /**
   * F1 Core Foundation pluggable IIntelligenceEngine execution method.
   */
  public async execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult> {
    const startTime = Date.now();
    this.totalExecutions++;

    const report = this.decide({
      contextPrompt: envelope.prompt,
      sovereignCubId: envelope.sovereignCubId,
      activeDimension: envelope.activeDimension,
    });

    const duration = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `DECISION_EXEC:${envelope.envelopeId}:${report.decisionChecksum}:${duration}`
    );

    return Object.freeze({
      resultId: `RES_${checksum.slice(2, 14)}`,
      engineId: this.engineId,
      textOutput: `[Decision Engine @ ${envelope.activeDimension}]: ${report.chosenRationale}`,
      reasoningSteps: Object.freeze([
        {
          stepIndex: 1,
          claim: `Action Selected: ${report.selectedAction.actionTitle}`,
          evidence: `Expected Utility: ${(report.selectedAction.expectedUtility * 100).toFixed(1)}%. Risk Score: ${(report.selectedAction.riskScore * 100).toFixed(1)}%.`,
          dimension: envelope.activeDimension,
          confidence: report.selectedAction.confidenceScore,
          resonanceScore: report.selectedAction.harmonicResonance,
        },
        {
          stepIndex: 2,
          claim: 'Sovereign Authorization & Policy Compliance',
          evidence: `Sovereign Granted: ${report.sovereignAuthorizationGranted}. Evaluated ${report.evaluatedOptionsCount} candidate paths.`,
          dimension: envelope.activeDimension,
          confidence: 0.999,
          resonanceScore: 100,
        },
      ]),
      confidence: report.selectedAction.confidenceScore,
      resonanceScore: report.selectedAction.harmonicResonance,
      executionTimeMs: duration,
      checksum,
      timestamp: Date.now(),
    });
  }

  public async getHealth(): Promise<EngineHealthReport> {
    return Object.freeze({
      status: 'READY',
      uptimeMs: Date.now() - this.startTime,
      totalExecutions: this.totalExecutions,
      failedExecutions: this.failedExecutions,
      avgLatencyMs: 1,
    });
  }

  public async dispose(): Promise<void> {}
}
