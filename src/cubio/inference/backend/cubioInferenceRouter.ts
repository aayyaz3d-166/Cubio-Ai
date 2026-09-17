/**
 * CubiO — Step 87 Production Inference Router
 * Handles /api/cubio/chat, /api/cubio/stream, and /api/cubio/health requests.
 */

import { ChatController } from './chatController';
import { HealthController } from './healthController';
import { StreamingController } from './streamingController';
import { InferenceChatRequest, InferenceChatResponse, BackendHealthStatus } from '../types';

export class CubiOInferenceRouter {
  private readonly chatController: ChatController;

  constructor(chatController?: ChatController) {
    this.chatController = chatController || new ChatController();
  }

  public async routeRequest(
    path: string,
    method: 'GET' | 'POST',
    body?: any
  ): Promise<{ status: number; data?: any; isStream?: boolean; stream?: AsyncGenerator<string, void, unknown> }> {
    const cleanPath = path.replace(/\/+$/, '') || '/';

    if (cleanPath === '/api/cubio/health' || cleanPath === '/health') {
      const health: BackendHealthStatus = HealthController.getHealth(this.chatController.getContextManager().getActiveSessionCount());
      return { status: 200, data: health };
    }

    if ((cleanPath === '/api/cubio/chat' || cleanPath === '/chat') && method === 'POST') {
      const chatReq: InferenceChatRequest = body;
      const resp: InferenceChatResponse = await this.chatController.handleChat(chatReq);
      return { status: 200, data: resp };
    }

    if ((cleanPath === '/api/cubio/stream' || cleanPath === '/stream') && method === 'POST') {
      const chatReq: InferenceChatRequest = body;
      const streamGenerator = this.chatController.handleStreamingChat(chatReq);

      async function* sseStream() {
        for await (const chunk of streamGenerator) {
          yield StreamingController.formatSSEChunk(chunk);
        }
        yield StreamingController.formatSSEEnd();
      }

      return {
        status: 200,
        isStream: true,
        stream: sseStream(),
      };
    }

    return { status: 404, data: { error: `Endpoint ${path} not found` } };
  }

  public getChatController(): ChatController {
    return this.chatController;
  }
}
