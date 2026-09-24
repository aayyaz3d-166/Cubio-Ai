/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F71: Master Provider & Capability Coordinator
 *
 * Implements dynamic, multi-factor provider selection and execution across 8 provider classes:
 * Capability -> Provider Registry -> Available Providers -> Health/Cost/Latency/Fidelity Ranking -> Execution or Honest UNAVAILABLE
 */

import {
  IProviderCapabilityCoordinator,
  ProviderExecutionResult,
  ProviderScoredCandidate,
  ProviderSelectionCriteria,
  UniversalProviderHealth,
  UniversalProviderProfile,
} from './types';
import { ProviderHealthMonitor } from './providerHealthMonitor';
import { ProviderScorer } from './providerScorer';
import { ProviderRouter } from './providerRouter';
import { HonestAvailabilityGuard } from './honestAvailabilityGuard';

export class CubiOMasterProviderCapabilityCoordinator implements IProviderCapabilityCoordinator {
  private monitor = new ProviderHealthMonitor();
  private scorer = new ProviderScorer();
  private router = new ProviderRouter(this.monitor, this.scorer);
  private honestGuard = new HonestAvailabilityGuard();

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    // 1. LLM
    this.registerProvider({
      id: 'GEMINI_2_5_PRO',
      name: 'Gemini 2.5 Pro Ultra',
      providerClass: 'LLM',
      health: 'UP',
      latencyMs: 350,
      costPer1kUnits: 0.00125,
      fidelityScore: 0.98,
      supportedFeatures: ['REASONING', 'CODE_GENERATION', 'MULTILINGUAL', 'MATHEMATICS'],
      isLocalSovereign: false,
      lastCheckedAt: Date.now(),
    });
    this.registerProvider({
      id: 'LOCAL_SOVEREIGN_REASONER',
      name: 'Local Sovereign Deterministic Engine',
      providerClass: 'LLM',
      health: 'UP',
      latencyMs: 15,
      costPer1kUnits: 0.0,
      fidelityScore: 0.92,
      supportedFeatures: ['REASONING', 'MATHEMATICS', 'OFFLINE_SOVEREIGN'],
      isLocalSovereign: true,
      lastCheckedAt: Date.now(),
    });

    // 2. VISION
    this.registerProvider({
      id: 'GEMINI_VISION_PRO',
      name: 'Gemini Vision Pro',
      providerClass: 'VISION',
      health: 'UP',
      latencyMs: 420,
      costPer1kUnits: 0.002,
      fidelityScore: 0.97,
      supportedFeatures: ['SCENE_GRAPH', 'OCR', '3D_RECONSTRUCTION'],
      isLocalSovereign: false,
      lastCheckedAt: Date.now(),
    });

    // 3. IMAGE
    this.registerProvider({
      id: 'IMAGEN_3_ULTRA',
      name: 'Imagen 3 Spatial Generative Model',
      providerClass: 'IMAGE',
      health: 'UP',
      latencyMs: 1200,
      costPer1kUnits: 0.02,
      fidelityScore: 0.96,
      supportedFeatures: ['PBR_TEXTURES', 'PHOTOREALISM', '3D_PROJECTIONS'],
      isLocalSovereign: false,
      lastCheckedAt: Date.now(),
    });

    // 4. STT
    this.registerProvider({
      id: 'WHISPER_SOVEREIGN_STT',
      name: 'Whisper WASM Sovereign STT',
      providerClass: 'STT',
      health: 'UP',
      latencyMs: 180,
      costPer1kUnits: 0.0,
      fidelityScore: 0.95,
      supportedFeatures: ['MULTILINGUAL', 'REALTIME_STREAMING'],
      isLocalSovereign: true,
      lastCheckedAt: Date.now(),
    });

    // 5. TTS
    this.registerProvider({
      id: 'ELEVENLABS_HD_TTS',
      name: 'ElevenLabs Neural Spatial TTS',
      providerClass: 'TTS',
      health: 'UP',
      latencyMs: 250,
      costPer1kUnits: 0.015,
      fidelityScore: 0.99,
      supportedFeatures: ['EMOTIONAL_INFLECTION', 'MULTI_SPEAKER'],
      isLocalSovereign: false,
      lastCheckedAt: Date.now(),
    });

    // 6. CODE SANDBOX
    this.registerProvider({
      id: 'SOVEREIGN_WASM_SANDBOX',
      name: 'Sovereign Isolated WASM Sandbox',
      providerClass: 'CODE_SANDBOX',
      health: 'UP',
      latencyMs: 25,
      costPer1kUnits: 0.0,
      fidelityScore: 1.0,
      supportedFeatures: ['TYPESCRIPT_EXECUTION', 'AST_ANALYSIS', 'SANDBOXED_IO'],
      isLocalSovereign: true,
      lastCheckedAt: Date.now(),
    });

    // 7. RESEARCH
    this.registerProvider({
      id: 'TAVILY_RESEARCH_API',
      name: 'Tavily Deep Knowledge Search',
      providerClass: 'RESEARCH',
      health: 'UP',
      latencyMs: 650,
      costPer1kUnits: 0.005,
      fidelityScore: 0.94,
      supportedFeatures: ['WEB_SEARCH', 'EVIDENCE_EXTRACTOR'],
      isLocalSovereign: false,
      lastCheckedAt: Date.now(),
    });

    // 8. EXTERNAL TOOLS
    this.registerProvider({
      id: 'MCP_SOVEREIGN_GATEWAY',
      name: 'Model Context Protocol Sovereign Gateway',
      providerClass: 'EXTERNAL_TOOLS',
      health: 'UP',
      latencyMs: 50,
      costPer1kUnits: 0.0,
      fidelityScore: 1.0,
      supportedFeatures: ['TOOL_DISCOVERY', 'JSON_RPC', 'GOVERNED_EXECUTION'],
      isLocalSovereign: true,
      lastCheckedAt: Date.now(),
    });
  }

  public registerProvider(profile: UniversalProviderProfile): void {
    this.monitor.register(profile);
  }

  public updateProviderHealth(
    providerId: string,
    health: UniversalProviderHealth,
    latencyMs?: number
  ): void {
    this.monitor.updateHealth(providerId, health, latencyMs);
  }

  public selectBestProvider(criteria: ProviderSelectionCriteria): ProviderScoredCandidate | undefined {
    const candidates = this.router.rankCandidates(criteria);
    const availability = this.honestGuard.verifyAvailability(candidates, criteria);
    return availability.selected;
  }

  public async executeCapability<T>(
    criteria: ProviderSelectionCriteria,
    executor: (profile: UniversalProviderProfile) => Promise<T>
  ): Promise<Readonly<ProviderExecutionResult<T>>> {
    const startTime = Date.now();
    const candidates = this.router.rankCandidates(criteria);
    const availability = this.honestGuard.verifyAvailability(candidates, criteria);

    // Enforce Honest UNAVAILABLE: Zero fabrication
    if (!availability.isAvailable || !availability.selected) {
      return Object.freeze({
        status: 'UNAVAILABLE',
        providerClass: criteria.providerClass,
        executionTimeMs: Math.max(1, Date.now() - startTime),
        cost: 0,
        isSovereignFallback: false,
        error: availability.reason || `No healthy provider available for ${criteria.providerClass}`,
      });
    }

    // Try executing through ranked candidate list (with failover)
    for (const candidate of candidates) {
      try {
        const result = await executor(candidate.profile);
        const executionTimeMs = Math.max(1, Date.now() - startTime);

        // Update latency stats
        this.monitor.updateHealth(candidate.profile.id, candidate.profile.health, executionTimeMs);

        return Object.freeze({
          status: 'SUCCESS',
          providerId: candidate.profile.id,
          providerClass: candidate.profile.providerClass,
          result,
          executionTimeMs,
          cost: candidate.profile.costPer1kUnits,
          isSovereignFallback: candidate.profile.isLocalSovereign,
        });
      } catch (err: unknown) {
        // Mark candidate as degraded and try next candidate
        this.monitor.updateHealth(candidate.profile.id, 'DEGRADED');
        continue;
      }
    }

    // All candidates failed
    return Object.freeze({
      status: 'FAILED',
      providerClass: criteria.providerClass,
      executionTimeMs: Math.max(1, Date.now() - startTime),
      cost: 0,
      isSovereignFallback: false,
      error: `All active providers for class "${criteria.providerClass}" failed during execution.`,
    });
  }

  public getHealthMonitor(): ProviderHealthMonitor {
    return this.monitor;
  }

  public getAllProviders(): readonly UniversalProviderProfile[] {
    return this.monitor.getAll();
  }
}
