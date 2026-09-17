/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Universal Intelligence Orchestrator
 *
 * Top-level orchestrator wrapping the existing CubiOIntelligenceCore.
 * Routes requests to internal CubiO engines or external providers based on
 * capability resolution. Never fabricates unavailable provider responses.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIntelligenceCore } from '../core/intelligenceCore';
import {
  UniversalCapabilityClass,
  UniversalIntelligenceRequest,
  UniversalIntelligenceResponse,
  LanguageDetectionResult,
  DimensionalState,
  ProblemSolverRequest,
  ProblemSolverResult,
} from './universalTypes';
import { CubiOProviderRegistry } from './providerRegistry';
import { CubiOCapabilityRegistry, CapabilityResolution } from './capabilityRegistry';
import { CubiOLanguageAdapter } from './languageAdapter';
import { CubiOProblemSolver } from './problemSolver';
import { CubiOProjectIntelligence } from './projectIntelligence';
import { CubiOWorkflowEngine } from './workflowEngine';
import { encodeToDimension } from './dimensionalState';

export class CubiOUniversalIntelligenceOrchestrator {
  public readonly providerRegistry: CubiOProviderRegistry;
  public readonly capabilityRegistry: CubiOCapabilityRegistry;
  public readonly languageAdapter: CubiOLanguageAdapter;
  public readonly problemSolver: CubiOProblemSolver;
  public readonly projectIntelligence: CubiOProjectIntelligence;
  public readonly workflowEngine: CubiOWorkflowEngine;

  constructor(private readonly core: CubiOIntelligenceCore) {
    this.providerRegistry = new CubiOProviderRegistry();
    this.capabilityRegistry = new CubiOCapabilityRegistry(this.providerRegistry);
    this.languageAdapter = new CubiOLanguageAdapter();
    this.problemSolver = new CubiOProblemSolver(this.capabilityRegistry, this.providerRegistry);
    this.projectIntelligence = new CubiOProjectIntelligence();
    this.workflowEngine = new CubiOWorkflowEngine();
  }

  /**
   * Primary entry point for universal intelligence requests.
   * Detects capabilities, resolves providers, routes to engines or providers.
   */
  public async orchestrateUniversal(
    request: UniversalIntelligenceRequest
  ): Promise<Readonly<UniversalIntelligenceResponse>> {
    const startTime = Date.now();
    const detectedLanguage = this.languageAdapter.detectLanguage(request.prompt);

    const interlingua = this.languageAdapter.toInterlingua(request.prompt);
    const effectivePrompt = interlingua.interlinguaPivot || request.prompt;

    // Detect required capability classes from the request
    const detectedCapabilities = this.detectRequiredCapabilities({
      ...request,
      prompt: effectivePrompt,
    });

    // Resolve each capability
    const resolutions = this.capabilityRegistry.resolveCapabilities(detectedCapabilities);
    const unavailable = resolutions
      .filter((r) => !r.available)
      .map((r) => r.capabilityClass);
    const usedProviders: string[] = [];

    // Determine if any detected capability requires an external provider that is unavailable
    const hasUnavailableExternal = resolutions.some(
      (r) => r.resolvedBy === 'UNAVAILABLE'
    );

    let textOutput: string;

    // If all required capabilities are internal (existing CubiO engines), use existing pipeline
    const allInternal = resolutions.every((r) => r.resolvedBy === 'INTERNAL_ENGINE');

    if (allInternal || !hasUnavailableExternal) {
      // Route through existing CubiO Intelligence Core / Chat API Service
      const service = this.core.getChatApiService();
      const chatResult = await service.chat(effectivePrompt, {
        activeDimension: request.activeDimension || 'D3',
        conversationId: request.conversationId,
      });

      textOutput = chatResult.data.textOutput;
      usedProviders.push('ENGINE_NATURAL_RESPONSE');
    } else {
      // Some capabilities are unavailable — use problem solver for honest routing
      const solverRequest: ProblemSolverRequest = {
        requestId: request.requestId,
        prompt: effectivePrompt,
        requiredCapabilities: detectedCapabilities,
        projectId: request.projectId,
        language: request.language || detectedLanguage.detectedLanguage,
      };

      const solverResult = this.problemSolver.solve(solverRequest);
      textOutput = solverResult.textOutput;
      usedProviders.push(...solverResult.providersUsed);
    }

    // Localize response if user input was in a non-English language
    if (detectedLanguage.detectedLanguage !== 'en') {
      const localized = this.languageAdapter.localizeResponse(
        textOutput,
        detectedLanguage.detectedLanguage,
        {
          activeDimension: request.activeDimension,
        }
      );
      textOutput = localized.textOutput;
    }

    // Build dimensional state
    const dimensionalState = encodeToDimension(
      { prompt: request.prompt, response: textOutput },
      'D3_SEMANTIC_SPATIAL'
    );

    const responseId = deterministicHash(
      `UNIV_RESP:${request.requestId}:${textOutput}`
    ).slice(0, 16);

    return Object.freeze({
      responseId: `URESP_${responseId}`,
      textOutput,
      detectedCapabilities: Object.freeze([...detectedCapabilities]),
      usedProviders: Object.freeze([...usedProviders]),
      unavailableCapabilities: Object.freeze([...unavailable]),
      detectedLanguage,
      dimensionalState,
      confidence: 0.99,
      executionTimeMs: Math.max(1, Date.now() - startTime),
      success: true,
    });
  }

  /**
   * Detects which universal capability classes are needed for a given request.
   */
  public detectRequiredCapabilities(
    request: UniversalIntelligenceRequest
  ): readonly UniversalCapabilityClass[] {
    const prompt = request.prompt.toLowerCase();
    const caps: UniversalCapabilityClass[] = [];

    // Voice modalities
    if (request.audioData) caps.push('VOICE_INPUT');

    // Image modalities
    if (request.imageData) caps.push('VISION');

    // Image generation
    if (/\b(generate image|create image|draw|make a picture|create a picture|generate a photo)\b/i.test(prompt)) {
      caps.push('IMAGE_GENERATION');
    }

    // Voice output
    if (/\b(speak|say it|read aloud|voice output|text to speech)\b/i.test(prompt)) {
      caps.push('VOICE_OUTPUT');
    }

    // Code capabilities
    if (/\b(write code|generate code|code for|programming|implement|function|algorithm|script)\b/i.test(prompt)) {
      caps.push('CODE_GENERATION');
    }
    if (/\b(analyze code|review code|code review|static analysis|lint)\b/i.test(prompt)) {
      caps.push('CODE_ANALYSIS');
    }
    if (/\b(debug|fix bug|error in code|stack trace|exception)\b/i.test(prompt)) {
      caps.push('CODE_DEBUGGING');
    }

    // LLM reasoning
    if (/\b(reason about|think step by step|chain of thought|deep analysis|complex reasoning)\b/i.test(prompt)) {
      caps.push('LLM_REASONING');
    }

    // Research
    if (/\b(research|investigate|look up|find information|search for)\b/i.test(prompt)) {
      caps.push('RESEARCH');
    }

    // Mathematical reasoning
    if (/\b(mathematical proof|derive|integral|differential|equation|mathematical)\b/i.test(prompt)) {
      caps.push('MATHEMATICAL_REASONING');
    }

    // Workflow
    if (/\b(workflow|build a|create a project|multi-step|pipeline|automate)\b/i.test(prompt)) {
      caps.push('WORKFLOW_EXECUTION');
    }

    // Project
    if (/\b(project|manage project|project plan|project goal)\b/i.test(prompt)) {
      caps.push('PROJECT_ASSISTANCE');
    }

    // Geometry / Spatial
    if (/\b(cube|sphere|tetrahedron|geometry|euclidean|polyhedron|torus|topology)\b/i.test(prompt)) {
      caps.push('GEOMETRIC_REASONING');
    }
    if (/\b(spatial reasoning|analyze topology|topological|manifold)\b/i.test(prompt)) {
      caps.push('SPATIAL_REASONING');
    }

    // 369
    if (/\b(369|vortex math|digital root|harmonic|solfeggio)\b/i.test(prompt)) {
      caps.push('HARMONIC_369');
    }

    // Prediction
    if (/\b(predict|forecast|trajectory|future|extrapolate)\b/i.test(prompt)) {
      caps.push('PREDICTION');
    }

    // Multilingual
    if (/\b(translate|translation|multilingual)\b/i.test(prompt)) {
      caps.push('MULTILINGUAL');
    }

    // Multi-agent
    if (/\b(multi-agent|team of agents|parallel agents|agent collaboration)\b/i.test(prompt)) {
      caps.push('MULTI_AGENT_PROBLEM_SOLVING');
    }

    // Default: natural language
    if (caps.length === 0) {
      caps.push('NATURAL_LANGUAGE');
    }

    return Object.freeze([...new Set(caps)]);
  }

  /**
   * Returns all currently available capability classes.
   */
  public getAvailableCapabilities(): readonly UniversalCapabilityClass[] {
    return this.capabilityRegistry.getAvailableCapabilities();
  }

  /**
   * Returns all currently unavailable capability classes.
   */
  public getUnavailableCapabilities(): readonly UniversalCapabilityClass[] {
    return this.capabilityRegistry.getUnavailableCapabilities();
  }

  /**
   * Returns the underlying CubiO Intelligence Core.
   */
  public getCore(): CubiOIntelligenceCore {
    return this.core;
  }
}
