/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F23: Master CubiO Intent & Task Router Engine
 *
 * Semantic intent understanding, multi-modal entity extraction,
 * capability negotiation, and multi-step execution plan routing.
 *
 * Plugs directly into F1 Core Foundation as an IIntelligenceEngine.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiODimension } from '../../types';
import {
  IIntelligenceEngine,
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineHealthReport,
  EngineCapability,
} from '../core/types';
import {
  UserIntentCategory,
  IntentAnalysisResult,
  ExecutionPlanStep,
  RoutingDecision,
} from './types';
import { RequestUnderstandingEngine } from './requestUnderstandingEngine';

export class CubiOIntentRouterIntelligenceEngine implements IIntelligenceEngine {
  public readonly engineId = 'ENGINE_INTENT_ROUTER';
  public readonly version = '1.0.0';
  public readonly priority = 'PRIMARY' as const;
  public readonly capabilities = [
    'INTENT_ROUTING',
    'PLANNING',
    'AUTONOMOUS_EXECUTION',
  ] as const;
  public readonly metadata = Object.freeze({
    name: 'CubiO Intent & Task Router Engine',
    description: 'Semantic intent understanding, entity extraction, and intelligent task routing.',
  });

  private totalExecutions = 0;
  private failedExecutions = 0;
  private startTime = Date.now();

  public async initialize(_core: any): Promise<void> {}

  /**
   * Classifies user prompt into precise intent categories, extracting entities and target dimensions.
   */
  public classifyIntent(prompt: string, _context?: any): IntentAnalysisResult {
    const cleanPrompt = prompt.replace(/^\[Context:[^\]]*\]:\s*/i, '').trim();
    const pLower = cleanPrompt.toLowerCase();

    let category: UserIntentCategory = 'CHAT';
    let primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
    let requiredCapabilities: EngineCapability[] = ['NATURAL_LANGUAGE_SYNTHESIS'];
    let confidence = 0.96;
    let suggestedDimension: CubiODimension = 'D3';
    const extractedEntities: string[] = [];

    // Extract Dimension
    if (/\b(d7|7d|heptatope)\b/.test(pLower)) suggestedDimension = 'D7';
    else if (/\b(d6|6d|hexatope)\b/.test(pLower)) suggestedDimension = 'D6';
    else if (/\b(d5|5d|pentatope)\b/.test(pLower)) suggestedDimension = 'D5';
    else if (/\b(d4|4d|tesseract|hypercube)\b/.test(pLower)) suggestedDimension = 'D4';
    else if (/\b(d3|3d|cube)\b/.test(pLower)) suggestedDimension = 'D3';
    else if (/\b(d2|2d|plane)\b/.test(pLower)) suggestedDimension = 'D2';
    else if (/\b(d1|1d|line)\b/.test(pLower)) suggestedDimension = 'D1';
    else if (/\b(d0|0d|point)\b/.test(pLower)) suggestedDimension = 'D0';

    const history = _context?.getHistory ? _context.getHistory() : Array.isArray(_context?.messages) ? _context.messages : [];
    const activeConstraints = _context?.getAllMemory ? _context.getAllMemory() : {};
    const userName = _context?.getMemory ? _context.getMemory('user_name') : undefined;

    const structuredUnderstanding = RequestUnderstandingEngine.analyzeRequest(prompt, {
      messages: history,
      activeConstraints,
      userName,
    });

    if (structuredUnderstanding.intent === 'SAFETY_REFUSAL') {
      category = 'SAFETY_REFUSAL';
      primaryEngineId = 'ENGINE_SECURITY';
      confidence = 0.999;
    } else if (structuredUnderstanding.intent === 'CLARIFICATION') {
      category = 'CLARIFICATION';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      confidence = 0.95;
    } else if (structuredUnderstanding.intent === 'CODING') {
      category = 'CODING';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      confidence = 0.99;
    } else if (structuredUnderstanding.intent === 'CALCULATION') {
      category = 'CALCULATION';
      primaryEngineId = 'ENGINE_369_ENCODER';
      confidence = 0.992;
    } else if (structuredUnderstanding.intent === 'MEMORY') {
      category = 'MEMORY';
      primaryEngineId = 'ENGINE_CONVERSATION';
      confidence = 0.988;
    } else if (structuredUnderstanding.intent === 'KNOWLEDGE') {
      category = 'KNOWLEDGE';
      primaryEngineId = 'ENGINE_MEMORY';
      confidence = 0.985;
    } else if (structuredUnderstanding.intent === 'QUESTION') {
      category = 'QUESTION';
      primaryEngineId = 'ENGINE_MEMORY';
      confidence = 0.98;
    } else if (structuredUnderstanding.intent === 'PROBLEM_TROUBLESHOOTING') {
      category = 'PROBLEM_TROUBLESHOOTING';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.99;
    } else if (structuredUnderstanding.intent === 'TASK_INSTRUCTION') {
      category = 'TASK_INSTRUCTION';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.99;
    } else if (structuredUnderstanding.intent === 'SPATIAL_CUBIO') {
      category = 'SPATIAL_REASONING';
      primaryEngineId = 'ENGINE_STATE_SPACE';
      confidence = 0.99;
    } else if (structuredUnderstanding.intent === 'CONVERSATION') {
      category = structuredUnderstanding.subIntent === 'GREETING' ? 'GREETING' : 'CONVERSATION';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      confidence = 0.99;
    } else if (
      /\b(hello|hi|hey|greetings|good morning|good evening|good afternoon|howdy|sup)\b/i.test(
        pLower
      ) ||
      pLower === 'hi' ||
      pLower === 'hello' ||
      pLower === 'hey'
    ) {
      category = 'GREETING';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.995;
      extractedEntities.push('GreetingDialogue');
    }
    // 2. Help & Capabilities
    else if (
      /\b(i need help|can you help me|help me|help|what can you do|how do i use|how does this work|commands|features|guide)\b/i.test(
        pLower
      )
    ) {
      category = 'HELP';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.992;
      extractedEntities.push('HelpGuidance');
    }
    // 3. Platform & Identity Query
    else if (
      /\b(what is cubio|about cubio|tell me about cubio|explain cubio|what is 3d memory studio|what is this platform)\b/i.test(
        pLower
      ) ||
      pLower === 'cubio'
    ) {
      category = 'PLATFORM_QUERY';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.99;
      extractedEntities.push('PlatformIdentity');
    }
    // 4. Context Recall & Anaphora
    else if (
      /\b(what did i (just )?ask|what was my (last|previous) (question|prompt)|what did we (just )?discuss|recall previous|what was that)\b/i.test(
        pLower
      )
    ) {
      category = 'CONTEXT_RECALL';
      primaryEngineId = 'ENGINE_CONVERSATION';
      requiredCapabilities = ['USER_CONTEXT', 'NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.988;
      extractedEntities.push('ContextRecallAnaphora');
    }
    // 5. Follow-up & Contextual Explanation
    else if (
      /\b(why did that happen|why did it do that|what happened|what next|and then|explain more|elaborate|what do you mean|can you explain that|explain that|tell me more|how come)\b/i.test(
        pLower
      )
    ) {
      category = 'FOLLOW_UP';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.985;
      extractedEntities.push('FollowUpExplanation');
    }
    // 6. Creative Text Tasks (Poems, Stories, Rhymes)
    else if (
      /\b(poem|write a poem|compose a poem|space poem|rhyme|poetry|write a story|tell a story|write a haiku|write an essay|compose words|creative description|creative story|describe creatively)\b/i.test(
        pLower
      )
    ) {
      category = 'CREATIVE_TASK';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.991;
      extractedEntities.push('CreativeTextComposition');
    }
    // 7. General Chat, Courtesies, Greetings Fallback
    else if (
      /\b(how are you|how are you doing|how r u|how\'s it going|what\'s up|who are you|who r u|introduce yourself|thanks|thank you|thx|thank u|much appreciated|nice to meet you|good job|cool|awesome|bye|goodbye)\b/i.test(
        pLower
      )
    ) {
      category = 'GENERAL_CHAT';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.98;
      extractedEntities.push('ConversationalCourtesy');
    }
    // 8. Geometric Queries
    else if (
      /\b(difference between|cube (vs|versus|and)|compare (a )?(cube|sphere|tetrahedron|octahedron|polyhedron)|geometry|euclidean geometry|polyhedron|tetrahedron|hexahedron|octahedron|dodecahedron|icosahedron|torus|vertices of|edges of|faces of)\b/i.test(
        pLower
      )
    ) {
      category = 'GEOMETRIC_QUERY';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['SPATIAL_REASONING'];
      confidence = 0.992;
      extractedEntities.push('GeometricComparison');
    }
    // 9. Spatial Reasoning & Topology Analysis
    else if (
      /\b(analyze (the |this )?topology|topology analysis|topological|topological manifold|euler characteristic|betti number|prove|deduce|theorem|lemma|axioms|contradiction|syllogism)\b/i.test(
        pLower
      )
    ) {
      category = 'SPATIAL_REASONING';
      primaryEngineId = 'ENGINE_REASONING';
      requiredCapabilities = ['SPATIAL_REASONING'];
      confidence = 0.988;
      extractedEntities.push('FormalProof', 'SpatialTopology');
    }
    // 10. Trajectory Prediction
    else if (
      /\b(predict|forecast|future|trajectory|counterfactual|extrapolate|simulate trajectory|five-horizon|horizon forecast|next state)\b/i.test(
        pLower
      )
    ) {
      category = 'PREDICTION';
      primaryEngineId = 'ENGINE_PREDICTION';
      requiredCapabilities = ['PREDICTION'];
      confidence = 0.985;
      extractedEntities.push('TrajectoryHorizon', 'FutureStateSimulation');
    }
    // 11. 369 Calculation & Digital Roots
    else if (
      /\b(369|vortex math|digital root|vortex arithmetic|calculate|compute|sum|multiply|divide|formula|harmonic value|369 resonance)\b/i.test(
        pLower
      ) ||
      /\d+\s*[\+\-\*\/]\s*\d+/.test(pLower)
    ) {
      category = 'CALCULATION';
      primaryEngineId = 'ENGINE_369_ENCODER';
      requiredCapabilities = ['HARMONIC_369'];
      confidence = 0.992;
      extractedEntities.push('VortexMath', 'ArithmeticExpression');
    }
    // 12. Explicit Multimodal Sensor/Audio/Mesh Request (Must NOT trigger on text chat)
    else if (
      /\b(generate audio|create sound|synthesize solfeggio audio|render 3d mesh|generate svg holographic|fuse audio and visual|multimodal stream)\b/i.test(
        pLower
      )
    ) {
      category = 'MULTIMODAL_ANALYSIS';
      primaryEngineId = 'ENGINE_MULTIMODAL';
      requiredCapabilities = ['MULTI_MODAL_SYNTHESIS'];
      confidence = 0.99;
      extractedEntities.push('MultiModalSensoryRequest');
    }
    // 13. Decision
    else if (
      /\b(decide|choose|optimal|trade-off|select action|utility|strategy|policy)\b/i.test(pLower)
    ) {
      category = 'DECISION';
      primaryEngineId = 'ENGINE_DECISION';
      requiredCapabilities = ['DECISION'];
      confidence = 0.982;
      extractedEntities.push('UtilityOptimization', 'ActionSelection');
    }
    // 14. Inspection & System Analysis
    else if (
      /\b(inspect|examine|audit|diagnose|status|metrics|telemetry|eval|test|check)\b/i.test(
        pLower
      )
    ) {
      category = 'ANALYSIS';
      primaryEngineId = 'ENGINE_INTELLIGENCE_EVALUATION';
      requiredCapabilities = ['INTELLIGENCE_EVALUATION'];
      confidence = 0.979;
      extractedEntities.push('DiagnosticReport', 'EvaluationMetrics');
    }
    // 15. General Questions
    else if (
      /\b(what is|where is|who|when|look up|search|find|retrieve|query|explain concept)\b/i.test(
        pLower
      )
    ) {
      category = 'QUESTION';
      primaryEngineId = 'ENGINE_MEMORY';
      requiredCapabilities = ['KNOWLEDGE_RETRIEVAL', 'NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.975;
      extractedEntities.push('KnowledgeQuery', 'AssociativeMemory');
    }
    // 16. Default Fallback
    else {
      category = 'GENERAL_CHAT';
      primaryEngineId = 'ENGINE_NATURAL_RESPONSE';
      requiredCapabilities = ['NATURAL_LANGUAGE_SYNTHESIS'];
      confidence = 0.965;
      extractedEntities.push('ConversationalDialogue');
    }

    const analysisChecksum = deterministicHash(
      `INTENT:${category}:${primaryEngineId}:${suggestedDimension}:${confidence}:${prompt}`
    );

    return Object.freeze({
      intentId: `INT_${analysisChecksum.slice(2, 12)}`,
      category,
      confidence,
      primaryEngineId,
      requiredCapabilities: Object.freeze(requiredCapabilities),
      suggestedDimension,
      extractedEntities: Object.freeze(extractedEntities),
      harmonicAttunement: Object.freeze({
        triad: [3, 6, 9] as const,
        vortexState: 9,
        harmonicFlux: 0.963,
        resonanceScore: 99.8,
      }),
      analysisChecksum,
      structuredUnderstanding,
    });
  }

  /**
   * Resolves routing decision and constructs execution plan.
   */
  public resolveRouting(envelope: IntelligenceContextEnvelope): RoutingDecision {
    const intent = this.classifyIntent(envelope.prompt);

    const planSteps: ExecutionPlanStep[] = [
      {
        stepIndex: 1,
        targetEngineId: this.engineId,
        requiredCapability: 'INTENT_ROUTING',
        description: `Classified user intent as ${intent.category} with ${(intent.confidence * 100).toFixed(1)}% confidence.`,
      },
      {
        stepIndex: 2,
        targetEngineId: intent.primaryEngineId,
        requiredCapability: intent.requiredCapabilities[0],
        description: `Execute core processing on ${intent.primaryEngineId} in dimension ${intent.suggestedDimension}.`,
      },
      {
        stepIndex: 3,
        targetEngineId: 'ENGINE_NATURAL_RESPONSE',
        requiredCapability: 'NATURAL_LANGUAGE_SYNTHESIS',
        description: 'Synthesize raw execution result into user-friendly natural language response.',
      },
    ];

    const routedEnvelope: IntelligenceContextEnvelope = Object.freeze({
      ...envelope,
      activeDimension: intent.suggestedDimension || envelope.activeDimension,
      requiredCapabilities: intent.requiredCapabilities,
      harmonic: envelope.harmonic || {
        triad: [3, 6, 9] as const,
        vortexState: 9,
        harmonicFlux: 0.963,
        phaseShift: 36.9,
        quantumPolarity: 1.0,
        resonanceScore: 99.8,
        activeFrequencyHz: 528.0,
      },
    });

    const routingChecksum = deterministicHash(
      `ROUTING:${intent.intentId}:${intent.primaryEngineId}:${routedEnvelope.envelopeId}`
    );

    return Object.freeze({
      routingId: `RTE_${routingChecksum.slice(2, 12)}`,
      intent,
      executionPlan: Object.freeze(planSteps),
      targetEngines: Object.freeze([intent.primaryEngineId, 'ENGINE_NATURAL_RESPONSE']),
      routedEnvelope,
    });
  }

  /**
   * F1 Core Foundation pluggable IIntelligenceEngine execution method.
   */
  public async execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult> {
    this.totalExecutions++;
    const startTime = Date.now();

    const decision = this.resolveRouting(envelope);
    const latency = Math.max(1, Date.now() - startTime);

    const checksum = deterministicHash(
      `INTENT_EXEC:${decision.routingId}:${envelope.envelopeId}:${latency}`
    );

    return Object.freeze({
      resultId: `RES_INT_${checksum.slice(2, 14)}`,
      engineId: this.engineId,
      textOutput: `[Intent Router Engine]: Analyzed prompt. Intent: ${decision.intent.category} (Confidence: ${(decision.intent.confidence * 100).toFixed(1)}%). Routed to ${decision.intent.primaryEngineId} in dimension ${decision.intent.suggestedDimension}.`,
      reasoningSteps: Object.freeze([
        {
          stepIndex: 1,
          claim: `Intent categorized as ${decision.intent.category}`,
          evidence: `Entities: ${decision.intent.extractedEntities.join(', ')}`,
          dimension: decision.intent.suggestedDimension,
          confidence: decision.intent.confidence,
          resonanceScore: 99.8,
        },
      ]),
      confidence: decision.intent.confidence,
      resonanceScore: 99.8,
      executionTimeMs: latency,
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
