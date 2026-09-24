/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F103: Adaptive Model Router Engine
 *
 * Dynamically classifies task intent, evaluates cost/latency/health constraints,
 * and routes to the optimal model with automatic Sovereign fallback.
 */

import { deterministicHash } from '../../../state/determinism';
import { ModelCandidateId } from '../comparative/types';
import { MODEL_PROFILES } from '../comparative/modelProfiles';
import { MODEL_CAPABILITY_MATRIX } from './capabilityMatrix';
import {
  IAdaptiveModelRouter,
  ProviderHealthState,
  AdaptiveRoutingDecision,
  RoutingOptimizationGoal,
  TaskModalityIntent,
  TaskRoutingRequest,
} from './types';

export class CubiOAdaptiveModelRouter implements IAdaptiveModelRouter {
  private providerHealthMap = new Map<ModelCandidateId, ProviderHealthState>([
    ['CUBIO_SOVEREIGN_ENSEMBLE', 'AVAILABLE'],
    ['ANTHROPIC_CLAUDE_3_7_SONNET', 'AVAILABLE'],
    ['OPENAI_GPT_4O', 'AVAILABLE'],
    ['GOOGLE_GEMINI_2_0_PRO', 'AVAILABLE'],
    ['DEEPSEEK_R1', 'AVAILABLE'],
  ]);

  public updateProviderHealth(modelId: ModelCandidateId, health: ProviderHealthState): void {
    this.providerHealthMap.set(modelId, health);
  }

  public getProviderHealth(modelId: ModelCandidateId): ProviderHealthState {
    return this.providerHealthMap.get(modelId) || 'AVAILABLE';
  }

  public async routeTask(request: TaskRoutingRequest): Promise<AdaptiveRoutingDecision> {
    const decisionId = `ROUTE_${Date.now()}`;
    const detectedIntent =
      request.explicitIntent ||
      (request.estimatedInputTokens && request.estimatedInputTokens > 100000
        ? 'MASSIVE_CONTEXT_INGESTION'
        : this.classifyIntent(request.prompt));

    const optimizationGoal: RoutingOptimizationGoal =
      request.optimizationGoal || (request.forceSovereignOnly ? 'SOVEREIGN_OFFLINE_ONLY' : 'MAX_INTELLIGENCE');

    let selectedModelId: ModelCandidateId = 'CUBIO_SOVEREIGN_ENSEMBLE';
    let rationale = '';
    let confidenceScore = 0.98;
    let circuitBreakerTriggered = false;

    // 1. Hard Sovereign Constraints (Native Spatial CAD, 528Hz Voice, Tool Governance, Offline Mode)
    if (
      request.forceSovereignOnly ||
      optimizationGoal === 'SOVEREIGN_OFFLINE_ONLY' ||
      detectedIntent === 'SPATIAL_3D_CAD_GEOMETRY' ||
      detectedIntent === 'ACOUSTIC_528HZ_VOICE' ||
      detectedIntent === 'SECURITY_GOVERNED_TOOL'
    ) {
      selectedModelId = 'CUBIO_SOVEREIGN_ENSEMBLE';
      confidenceScore = 1.0;
      rationale = `Routed to CubiO Sovereign Local Engine for zero-variance determinism, native 3D manifold closure (chi=2), and sovereign security policy.`;
    } else if (optimizationGoal === 'LATENCY_CRITICAL' || (request.maxLatencySlaMs && request.maxLatencySlaMs < 100)) {
      // Latency SLA < 100ms can only be satisfied by Sovereign In-Memory Engine (< 15ms)
      selectedModelId = 'CUBIO_SOVEREIGN_ENSEMBLE';
      confidenceScore = 0.99;
      rationale = `Routed to CubiO Sovereign Local Engine to satisfy strict sub-50ms latency SLA (< 15ms in-memory turnaround).`;
    } else {
      // 2. Intelligent Multi-Model Candidate Selection
      selectedModelId = this.selectBestCandidateForIntent(detectedIntent, optimizationGoal);
      confidenceScore = 0.95;
      rationale = `Selected ${MODEL_PROFILES[selectedModelId].displayName} optimized for intent: ${detectedIntent} and goal: ${optimizationGoal}.`;

      // 3. Circuit Breaker & Health State Fallback Check
      const health = this.getProviderHealth(selectedModelId);
      if (health !== 'AVAILABLE') {
        circuitBreakerTriggered = true;
        rationale = `Circuit Breaker: ${MODEL_PROFILES[selectedModelId].displayName} health is ${health}. Automatically fell back to CubiO Sovereign Local Engine.`;
        selectedModelId = 'CUBIO_SOVEREIGN_ENSEMBLE';
        confidenceScore = 0.99;
      }
    }

    const profile = MODEL_PROFILES[selectedModelId];
    const capability = MODEL_CAPABILITY_MATRIX[selectedModelId];

    const inputTokens = request.estimatedInputTokens || Math.ceil(request.prompt.length / 4);
    const estimatedCostUsd = parseFloat(((inputTokens / 1000) * capability.costPer1kInputTokensUsd).toFixed(6));
    const estimatedLatencyMs = capability.typicalLatencyMs;

    const decisionChecksum = deterministicHash(
      `${decisionId}:${detectedIntent}:${selectedModelId}:${circuitBreakerTriggered}:${estimatedLatencyMs}`
    );

    return Object.freeze({
      decisionId,
      detectedIntent,
      selectedModelId,
      selectedDisplayName: profile.displayName,
      confidenceScore,
      isSovereignLocal: profile.isSovereignLocal,
      estimatedLatencyMs,
      estimatedCostUsd,
      rationale,
      fallbackModelId: 'CUBIO_SOVEREIGN_ENSEMBLE',
      circuitBreakerTriggered,
      decisionChecksum,
      timestamp: Date.now(),
    });
  }

  private classifyIntent(prompt: string): TaskModalityIntent {
    const p = prompt.toLowerCase();

    // Check specific complex patterns first
    if (p.includes('manifold') || p.includes('cad') || p.includes('topology') || p.includes('euler')) {
      return 'SPATIAL_3D_CAD_GEOMETRY';
    }
    if (p.includes('voice') || p.includes('528hz') || p.includes('solfeggio') || p.includes('speech')) {
      return 'ACOUSTIC_528HZ_VOICE';
    }
    if (p.includes('pdf') || p.includes('repository') || p.includes('ingest files') || p.includes('entire codebase') || p.includes('massive doc')) {
      return 'MASSIVE_CONTEXT_INGESTION';
    }
    if (p.includes('gemstone') || p.includes('diamond') || p.includes('facet') || p.includes('refraction') || p.includes('vision optics')) {
      return 'VISION_GEMSTONE_OPTICS';
    }
    if (p.includes('digital root') || p.includes('3-6-9') || p.includes('math theorem') || p.includes('recursive math')) {
      return 'DEEP_RECURSIVE_MATH';
    }
    if (p.includes('typescript') || p.includes('ast') || p.includes('refactor') || p.includes('synthesize code') || p.includes('syntax')) {
      return 'AST_CODE_SYNTHESIS_REPAIR';
    }
    if (p.includes('tool') || p.includes('permission') || p.includes('execute') || p.includes('token') || p.includes('sandbox')) {
      return 'SECURITY_GOVERNED_TOOL';
    }

    return 'RAPID_CONVERSATION_CHAT';
  }

  private selectBestCandidateForIntent(intent: TaskModalityIntent, goal: RoutingOptimizationGoal): ModelCandidateId {
    if (goal === 'COST_MINIMIZED') {
      return 'CUBIO_SOVEREIGN_ENSEMBLE'; // Zero cost
    }

    switch (intent) {
      case 'AST_CODE_SYNTHESIS_REPAIR':
        return 'ANTHROPIC_CLAUDE_3_7_SONNET';
      case 'MASSIVE_CONTEXT_INGESTION':
        return 'GOOGLE_GEMINI_2_0_PRO';
      case 'DEEP_RECURSIVE_MATH':
        return 'DEEPSEEK_R1';
      case 'VISION_GEMSTONE_OPTICS':
        return 'OPENAI_GPT_4O';
      default:
        return 'CUBIO_SOVEREIGN_ENSEMBLE';
    }
  }
}
