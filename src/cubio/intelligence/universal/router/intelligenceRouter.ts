/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Master Universal Intelligence Router
 *
 * Central intelligence routing brain:
 * User Request -> Intent -> Problem Type -> Capabilities -> Target -> Execution -> Verification -> Response.
 */

import {
  IUniversalIntelligenceRouter,
  UniversalRoutingDecision,
  RoutingExecutionRequest,
  RoutingExecutionResult,
} from './types';
import { classifyUserIntent } from './intentClassifier';
import { selectRoutingTarget } from './targetSelector';
import { executeRoutingTarget } from './routerExecutionEngine';

export class CubiOUniversalIntelligenceRouter implements IUniversalIntelligenceRouter {
  /**
   * Analyzes a user prompt, detects intent, evaluates complexity, and selects the optimal target.
   */
  public analyzeAndRoute(prompt: string): Readonly<UniversalRoutingDecision> {
    const classified = classifyUserIntent(prompt);
    return selectRoutingTarget(prompt, classified);
  }

  /**
   * Executes the full brain-routing pipeline: Analysis -> Target Selection -> Dispatch -> Verification.
   */
  public async routeAndExecute(request: RoutingExecutionRequest): Promise<Readonly<RoutingExecutionResult>> {
    const decision = this.analyzeAndRoute(request.prompt);
    return executeRoutingTarget(decision, request);
  }
}
