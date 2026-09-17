/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F17: CubiO Intelligence Client SDK
 *
 * Strongly typed client SDK consumed by React Studio frontend and external developers
 * to invoke CubiO Intelligence Core operations seamlessly.
 */

import { CubiOIntelligenceApiRouter } from './intelligenceApiRouter';
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
} from './types';

export class CubiOIntelligenceClient {
  private router: CubiOIntelligenceApiRouter;

  constructor(router?: CubiOIntelligenceApiRouter) {
    this.router = router || new CubiOIntelligenceApiRouter();
  }

  public getRouter(): CubiOIntelligenceApiRouter {
    return this.router;
  }

  public async chat(req: IntelligenceChatApiRequest): Promise<IntelligenceChatApiResponse> {
    return this.router.handleChat(req);
  }

  public async reason(req: IntelligenceReasonApiRequest): Promise<IntelligenceReasonApiResponse> {
    return this.router.handleReason(req);
  }

  public async predict(req: IntelligencePredictApiRequest): Promise<IntelligencePredictApiResponse> {
    return this.router.handlePredict(req);
  }

  public async inspect(req: IntelligenceInspectApiRequest): Promise<IntelligenceInspectApiResponse> {
    return this.router.handleInspect(req);
  }

  public async generate(req: IntelligenceGenerateApiRequest): Promise<IntelligenceGenerateApiResponse> {
    return this.router.handleGenerate(req);
  }

  public async decide(req: IntelligenceDecisionApiRequest): Promise<IntelligenceDecisionApiResponse> {
    return this.router.handleDecision(req);
  }

  public async getVirtualMemoryStats(): Promise<IntelligenceVirtualMemoryApiResponse> {
    return this.router.handleVirtualMemoryStats();
  }

  public async getHealth(): Promise<IntelligenceHealthApiResponse> {
    return this.router.handleHealth();
  }
}
