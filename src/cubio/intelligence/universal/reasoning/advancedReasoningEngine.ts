/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F48: Master Advanced Reasoning Engine
 *
 * Exposes the complete 7-stage advanced reasoning pipeline:
 * Question -> Understand -> Decompose -> Plan -> Reason -> Verify -> Synthesize
 */

import {
  IAdvancedReasoningEngine,
  AdvancedReasoningRequest,
  AdvancedReasoningReport,
} from './types';
import { AdvancedReasoningPipeline } from './pipeline/reasoningPipeline';

export class CubiOAdvancedReasoningEngine implements IAdvancedReasoningEngine {
  private pipeline = new AdvancedReasoningPipeline();

  /**
   * Executes the advanced reasoning pipeline for a given question.
   */
  public async reasonQuestion(
    request: AdvancedReasoningRequest
  ): Promise<Readonly<AdvancedReasoningReport>> {
    return this.pipeline.executePipeline(request);
  }
}
