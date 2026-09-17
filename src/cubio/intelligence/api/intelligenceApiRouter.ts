/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F17: CubiO Intelligence API Router
 *
 * Server-side router orchestrating incoming API requests directly into authoritative
 * CubiOIntelligenceCore engines and wrapping results with cryptographic response envelopes.
 */

import { deterministicHash } from '../../state/determinism';
import { Math369 } from '../../engine_369/math369';
import { CubiOStateFactory } from '../../state/stateEngine';
import { CubiOIntelligenceCore } from '../core/intelligenceCore';
import {
  IntelligenceChatApiRequest,
  IntelligenceChatApiResponse,
  IntelligenceReasonApiRequest,
  IntelligenceReasonApiResponse,
  IntelligencePredictApiRequest,
  IntelligencePredictApiResponse,
  IntelligenceInspectApiRequest,
  IntelligenceInspectApiResponse,
  IntelligenceGenerateApiRequest,
  IntelligenceGenerateApiResponse,
  IntelligenceDecisionApiRequest,
  IntelligenceDecisionApiResponse,
  IntelligenceVirtualMemoryApiResponse,
  IntelligenceHealthApiResponse,
  BaseApiRequest,
} from './types';

export class CubiOIntelligenceApiRouter {
  private core: CubiOIntelligenceCore;

  constructor(core?: CubiOIntelligenceCore) {
    this.core = core || new CubiOIntelligenceCore();
  }

  public getCore(): CubiOIntelligenceCore {
    return this.core;
  }

  /**
   * POST /api/intelligence/chat
   */
  public async handleChat(req: IntelligenceChatApiRequest): Promise<IntelligenceChatApiResponse> {
    const startTime = Date.now();
    const convId = req.conversationId || 'CONV_DEFAULT';

    // F25: Retrieve conversation history for context & anaphora resolution
    const thread = this.core.getConversationEngine().getThread(convId);
    const previousTurn = thread && thread.turns.length > 0 ? thread.turns[thread.turns.length - 1] : undefined;

    // F25: Resolve follow-up query and context enrichment
    const followUp = this.core.resolveConversationFollowUp(convId, req.prompt);
    const activeDimension = req.activeDimension || followUp.effectiveDimension || 'D3';
    const effectivePrompt = followUp.isFollowUp ? followUp.enrichedPrompt : req.prompt;

    // F23: Classify intent dynamically
    const intent = this.core.getIntentRouterEngine().classifyIntent(effectivePrompt);
    const requiredCapabilities =
      intent.requiredCapabilities && intent.requiredCapabilities.length > 0
        ? intent.requiredCapabilities
        : (['NATURAL_LANGUAGE_SYNTHESIS'] as const);

    // Master Runtime Integration (Phases 2–10): Route sector prompts to Soul Runtime Coordinator
    const masterRuntime = (await import('../runtime_integration/masterRuntimeIntelligenceCoordinator')).MasterRuntimeIntelligenceCoordinator.getInstance();
    const domainCheck = masterRuntime.classifyDomainSector(effectivePrompt);
    let finalDeliveredText = '';
    let runtimeConfidence = 0.96;
    let runtimeResonance = 99.8;

    if (domainCheck.detectedSector !== 'UNIVERSAL_CORE') {
      const soulResult = await masterRuntime.executeRuntimePipeline(effectivePrompt, {
        activeDimension,
        conversationId: convId,
      });
      finalDeliveredText = soulResult.synthesizedResponseText;
      runtimeConfidence = soulResult.confidenceScore;
      runtimeResonance = soulResult.resonanceScore;
    } else {
      const execResult = await this.core.orchestrate({
        envelopeId: `ENV_${deterministicHash(req.prompt + Date.now()).slice(2, 12)}`,
        prompt: effectivePrompt,
        requiredCapabilities,
        activeDimension,
        sovereignCubId: req.sovereignCubId || 'CUB-00000000',
        harmonic: {
          triad: [3, 6, 9],
          vortexState: 9,
          harmonicFlux: 0.963,
          phaseShift: 36.9,
          quantumPolarity: 1.0,
          resonanceScore: 99.8,
          activeFrequencyHz: 528.0,
          ...req.harmonic,
        },
        timestamp: Date.now(),
      });

      const naturalRes = this.core.synthesizeNaturalResponse({
        requestId: `REQ_${deterministicHash(req.prompt).slice(2, 10)}`,
        userPrompt: req.prompt,
        rawEngineResult: execResult.primaryResult,
        preferredTone: 'CONVERSATIONAL',
        activeDimension,
        conversationContext: {
          previousPrompt: previousTurn?.prompt,
          previousResponse: previousTurn?.response,
          turnCount: thread?.turns.length || 0,
        },
      });

      // F28: Response Validation & Self-Correction Gate
      const valReport = await this.core.validateAndSelfCorrect({
        prompt: req.prompt,
        response: naturalRes.naturalText,
        activeDimension,
        baseState: req.baseState,
        sovereignCubId: req.sovereignCubId,
      });

      finalDeliveredText = valReport.sanitizedResponse;
      runtimeConfidence = execResult.primaryResult.confidence;
      runtimeResonance = execResult.primaryResult.resonanceScore;
    }


    // F25: Record dialogue turn in conversation thread
    this.core.recordConversationTurn(convId, {
      role: 'USER',
      prompt: req.prompt,
      response: finalDeliveredText,
      activeDimension,
      stateId: req.baseState?.id,
      reasoningSteps: [
        {
          stepIndex: 1,
          claim: 'Domain Routing & Synthesis',
          evidence: `Routed to ${domainCheck.detectedSector}`,
          dimension: activeDimension,
          confidence: runtimeConfidence,
          resonanceScore: runtimeResonance,
        },
      ],
      entitiesMentioned: [activeDimension, ...(req.baseState ? [req.baseState.id] : [])],
      timestamp: Date.now(),
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `CHAT_RESP:${finalDeliveredText.slice(0, 32)}:${runtimeConfidence}:${latencyMs}`
    );

    return Object.freeze({
      success: true,
      responseId: `RESP_CHAT_${checksum.slice(2, 12)}`,
      textOutput: finalDeliveredText,
      confidence: runtimeConfidence,
      resonanceScore: runtimeResonance,
      activeDimension,
      reasoningSteps: [
        {
          stepIndex: 1,
          claim: 'Domain Routing & Synthesis',
          evidence: `Executed via ${domainCheck.detectedSector} Soul Pipeline`,
          dimension: activeDimension,
          confidence: runtimeConfidence,
          resonanceScore: runtimeResonance,
        },
      ],
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }


  /**
   * POST /api/intelligence/reason
   */
  public async handleReason(req: IntelligenceReasonApiRequest): Promise<IntelligenceReasonApiResponse> {
    const startTime = Date.now();
    const activeDimension = req.activeDimension || 'D3';
    const states =
      req.states ||
      (req.baseState
        ? [req.baseState]
        : [
            CubiOStateFactory.createState(
              `ST_REASON_${deterministicHash(req.hypothesis).slice(2, 10)}`,
              [0, 0, 0],
              activeDimension
            ),
          ]);

    const proofReport = this.core.reasonProof({
      goal: req.hypothesis,
      mode: req.mode || 'DEDUCTIVE',
      activeDimension,
      states,
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `REASON_RESP:${proofReport.proofId}:${proofReport.overallConfidence}:${latencyMs}`
    );

    return Object.freeze({
      success: true,
      responseId: `RESP_REASON_${checksum.slice(2, 12)}`,
      proofReport,
      theoremValidated: proofReport.isValidProof,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }

  /**
   * POST /api/intelligence/predict
   */
  public async handlePredict(req: IntelligencePredictApiRequest): Promise<IntelligencePredictApiResponse> {
    const startTime = Date.now();
    const activeDimension = req.activeDimension || 'D3';
    const baseState =
      req.baseState ||
      CubiOStateFactory.createState(
        `ST_PRED_${deterministicHash(activeDimension + String(req.clientRequestId || 'DEFAULT')).slice(2, 10)}`,
        [0, 0, 0],
        activeDimension
      );

    const predictionReport = this.core.predictFutureStates({
      currentState: baseState,
      horizonSteps: req.horizonSteps || 3,
      candidateCountPerStep: req.candidateCountPerStep || 3,
      interventions: req.interventions || [],
      targetDimension: activeDimension,
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `PRED_RESP:${predictionReport.predictionId}:${predictionReport.meanConfidence}:${latencyMs}`
    );

    return Object.freeze({
      success: true,
      responseId: `RESP_PRED_${checksum.slice(2, 12)}`,
      predictionReport,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }

  /**
   * POST /api/intelligence/inspect
   */
  public async handleInspect(req: IntelligenceInspectApiRequest): Promise<IntelligenceInspectApiResponse> {
    const startTime = Date.now();
    let fileReport;
    let stateSnapshot;
    let root369 = 9;
    let isTampered = false;

    if (req.rawCubioFileContent) {
      fileReport = this.core.inspectCubioFile(req.rawCubioFileContent);
      root369 = fileReport.digitalRoot369;
      isTampered = fileReport.isTamperEvident;
    } else if (req.stateId) {
      stateSnapshot = this.core.getVirtualState(req.stateId);
      root369 = Math369.computeDigitalRoot(
        stateSnapshot?.properties?.harmonicFlux ? Math.round(stateSnapshot.properties.harmonicFlux * 1000) : 369
      );
    }

    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `INSPECT_RESP:${root369}:${isTampered}:${latencyMs}`
    );

    return Object.freeze({
      success: true,
      responseId: `RESP_INSPECT_${checksum.slice(2, 12)}`,
      fileReport,
      stateSnapshot,
      digitalRoot369: root369,
      isTamperEvident: isTampered,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }

  /**
   * POST /api/intelligence/generate
   */
  public async handleGenerate(req: IntelligenceGenerateApiRequest): Promise<IntelligenceGenerateApiResponse> {
    const startTime = Date.now();
    const activeDimension = req.targetDimension || req.activeDimension || 'D4';
    const state =
      req.baseState ||
      CubiOStateFactory.createState(
        `ST_GEN_${deterministicHash(req.prompt).slice(2, 10)}`,
        [0, 0, 0, 0],
        activeDimension
      );

    const manifest = this.core.generateArtifacts({
      prompt: req.prompt,
      targetOutputs: req.modalities,
      baseState: state,
      targetDimension: activeDimension,
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `GEN_RESP:${manifest.manifestId}:${manifest.manifestChecksum}:${latencyMs}`
    );

    return Object.freeze({
      success: true,
      responseId: `RESP_GEN_${checksum.slice(2, 12)}`,
      manifest,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }

  /**
   * POST /api/intelligence/decision
   */
  public async handleDecision(req: IntelligenceDecisionApiRequest): Promise<IntelligenceDecisionApiResponse> {
    const startTime = Date.now();
    const activeDimension = req.activeDimension || 'D3';
    const state =
      req.currentState ||
      CubiOStateFactory.createState(
        `ST_DEC_${deterministicHash(req.contextPrompt).slice(2, 10)}`,
        [0, 0, 0],
        activeDimension
      );

    const decisionReport = this.core.makeDecision({
      contextPrompt: req.contextPrompt,
      currentState: state,
      candidateOptions: req.candidateOptions,
      sovereignCubId: req.sovereignCubId || 'CUB-00043B12',
      activeDimension,
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `DEC_RESP:${decisionReport.decisionId}:${decisionReport.selectedAction.optionId}:${latencyMs}`
    );

    return Object.freeze({
      success: true,
      responseId: `RESP_DEC_${checksum.slice(2, 12)}`,
      decisionReport,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }

  /**
   * GET /api/intelligence/virtual-memory/stats
   */
  public async handleVirtualMemoryStats(_req?: BaseApiRequest): Promise<IntelligenceVirtualMemoryApiResponse> {
    const startTime = Date.now();
    const stats = this.core.getVirtualMemoryStats();
    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(`VM_STATS_RESP:${stats.statsChecksum}:${latencyMs}`);

    return Object.freeze({
      success: true,
      responseId: `RESP_VM_${checksum.slice(2, 12)}`,
      stats,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }

  /**
   * GET /api/intelligence/health
   */
  public async handleHealth(): Promise<IntelligenceHealthApiResponse> {
    const startTime = Date.now();
    const engines = await this.core.getHealthSummary();
    const hasUnhealthy = Object.values(engines).some((e) => e.status === 'UNHEALTHY');
    const hasDegraded = Object.values(engines).some((e) => e.status === 'DEGRADED');

    const systemStatus = hasUnhealthy ? 'UNHEALTHY' : hasDegraded ? 'DEGRADED' : 'HEALTHY';
    const latencyMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(`HEALTH_RESP:${systemStatus}:${Object.keys(engines).length}:${latencyMs}`);

    return Object.freeze({
      success: true,
      responseId: `RESP_HEALTH_${checksum.slice(2, 12)}`,
      systemStatus,
      engines,
      timestamp: Date.now(),
      latencyMs,
      checksum,
    });
  }
}
