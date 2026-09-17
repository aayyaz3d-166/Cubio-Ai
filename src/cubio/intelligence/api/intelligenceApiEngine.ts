/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F17: Master CubiO Intelligence API Engine
 *
 * Pluggable IIntelligenceEngine attaching API routing and external gateway capabilities
 * directly into F1 Core Foundation.
 */

import { deterministicHash } from '../../state/determinism';
import {
  IIntelligenceEngine,
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineHealthReport,
} from '../core/types';
import { CubiOIntelligenceApiRouter } from './intelligenceApiRouter';
import { CubiOIntelligenceClient } from './intelligenceClient';

export class CubiOIntelligenceApiEngine implements IIntelligenceEngine {
  public readonly engineId = 'ENGINE_INTELLIGENCE_API';
  public readonly version = '1.0.0';
  public readonly priority = 'PRIMARY' as const;
  public readonly capabilities = ['INTELLIGENCE_API', 'AUTONOMOUS_EXECUTION'] as const;
  public readonly metadata = Object.freeze({
    name: 'CubiO Intelligence API Gateway Engine',
    description: 'Universal external and Studio UI API gateway routing requests into CubiO Intelligence Core.',
  });

  private router: CubiOIntelligenceApiRouter;
  private client: CubiOIntelligenceClient;
  private totalExecutions = 0;
  private failedExecutions = 0;
  private startTime = Date.now();

  constructor(router?: CubiOIntelligenceApiRouter) {
    this.router = router || new CubiOIntelligenceApiRouter();
    this.client = new CubiOIntelligenceClient(this.router);
  }

  public getRouter(): CubiOIntelligenceApiRouter {
    return this.router;
  }

  public getClient(): CubiOIntelligenceClient {
    return this.client;
  }

  public async initialize(_core: any): Promise<void> {}

  public async execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult> {
    const startTime = Date.now();
    this.totalExecutions++;

    const chatResponse = await this.router.handleChat({
      prompt: envelope.prompt,
      activeDimension: envelope.activeDimension,
      sovereignCubId: envelope.sovereignCubId,
      harmonic: envelope.harmonic,
    });

    const duration = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `API_EXEC:${envelope.envelopeId}:${chatResponse.responseId}:${duration}`
    );

    return Object.freeze({
      resultId: `RES_${checksum.slice(2, 14)}`,
      engineId: this.engineId,
      textOutput: chatResponse.textOutput,
      confidence: chatResponse.confidence,
      resonanceScore: chatResponse.resonanceScore,
      reasoningSteps: chatResponse.reasoningSteps,
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
