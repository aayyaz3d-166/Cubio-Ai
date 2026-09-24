/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/modelReasoningBridge.ts
 *
 * Bridge connecting expanded context windows with:
 * 1. Phase 11 Native Model (`ScaledTransformerCore` forward inference)
 * 2. Phase 10 Native Reasoning Engine (`MultiStepReasoningEngine`)
 * 3. `OutputGuard` permanent safety & actuation checks.
 */

import { WindowExecutionResult } from './types.js';
import { ScaledTransformerCore } from '../native_transformer/scaledTransformerCore.js';
import { TransformerForwardOutput } from '../native_transformer/types.js';
import { ReasoningStateEngine } from '../../reasoning/state_architecture/reasoningStateEngine.js';
import { MultiStepReasoningEngine } from '../../reasoning/multi_step/multiStepReasoningEngine.js';
import { ReasoningTargetGoal, ReasoningExecutionResult } from '../../reasoning/types.js';
import { OutputGuard, OutputGuardDecision } from '../../inference/safety/outputGuard.js';

export interface WindowModelReasoningOutput {
  readonly modelForward: TransformerForwardOutput;
  readonly reasoningResult: ReasoningExecutionResult;
  readonly safetyDecision: OutputGuardDecision;
  readonly emittedAdvisory: string;
  readonly dominantEpistemicStatus: string;
  readonly isReasoningSatisfied: boolean;
}

export class ModelReasoningBridge {
  /**
   * Executes native transformer forward pass across active window tokens.
   */
  public static executeModel(
    model: ScaledTransformerCore,
    windowResult: WindowExecutionResult
  ): TransformerForwardOutput {
    return model.forward(windowResult.activeTokens);
  }

  /**
   * Integrates windowed model output with Phase 10 multi-step deductive reasoning.
   */
  public static executeIntegratedReasoning(params: {
    model: ScaledTransformerCore;
    windowResult: WindowExecutionResult;
    tenantId: string;
    goalDescription: string;
    spatialCellId?: number;
  }): WindowModelReasoningOutput {
    const { model, windowResult, tenantId, goalDescription, spatialCellId = 0 } = params;

    // 1. Model Forward Execution
    const modelOutput = this.executeModel(model, windowResult);
    const dominantStatus = modelOutput.dominantEpistemicStatus;

    // 2. Initialize Phase 10 Reasoning State
    const genesis = ReasoningStateEngine.createInitialState({
      tenantId,
      cellId: spatialCellId,
    });

    let state = ReasoningStateEngine.addPremise(genesis, {
      statement: `Context window processed with ${windowResult.activeTokenCount} active tokens [${dominantStatus}]: ${goalDescription}.`,
      source: 'WINDOW_MODEL_OUTPUT',
      confidence: 0.95,
    });

    state = ReasoningStateEngine.addEvidence(state, {
      description: `Attention entropy measured at ${modelOutput.attentionEntropy.toFixed(4)}.`,
      sourceId: `win-${windowResult.windowHash.slice(0, 8)}`,
      sourceType: 'WINDOW_TELEMETRY',
      confidence: 1.0,
      verificationStatus: 'VERIFIED',
    });

    const reasoningGoal: ReasoningTargetGoal = {
      goalId: `GOAL-WIN-${Date.now()}`,
      targetProposition: goalDescription,
      matchMode: 'SUBSTRING',
      requiredConfidence: 0.8,
    };

    // 3. Multi-Step Reasoning Execution
    const reasoningResult = MultiStepReasoningEngine.executeReasoning(state, reasoningGoal, {
      maxDepth: 3,
      maxSteps: 6,
    });

    // 4. OutputGuard Validation
    const advisory = `ADVISORY: Context window processed [profile: ${windowResult.profileId}, active: ${windowResult.activeTokenCount} tokens]. Epistemic status: ${dominantStatus}. Reasoning satisfied: ${reasoningResult.isSatisfied}.`;
    const safetyDecision = OutputGuard.validateOutput(advisory);

    return Object.freeze({
      modelForward: modelOutput,
      reasoningResult,
      safetyDecision,
      emittedAdvisory: safetyDecision.sanitizedText,
      dominantEpistemicStatus: dominantStatus,
      isReasoningSatisfied: reasoningResult.isSatisfied,
    });
  }
}
