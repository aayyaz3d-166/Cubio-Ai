/**
 * CUBiO AI — Phase 11: Web Studio Chat API
 * src/cubio/web/api/chatApi.ts
 *
 * Dispatches chat queries to POST /api/v1/chat
 */

import { CubiOApiClient } from './apiClient';

export interface ChatApiRequest {
  readonly requestId: string;
  readonly conversationId: string;
  readonly sessionId?: string;
  readonly message: string;
  readonly options?: {
    readonly spatialCoordinate?: readonly [number, number, number];
    readonly spatialCellId?: number;
    readonly preferredStrategy?: string;
    readonly temperature?: number;
    readonly timeoutMs?: number;
  };
}

export interface ChatApiResponse {
  readonly requestId: string;
  readonly conversationId: string;
  readonly sessionId: string;
  readonly turnId: string;
  readonly sequence: number;
  readonly status: 'success';
  readonly response: {
    readonly text: string;
    readonly confidence: number;
    readonly epistemicState: string;
  };
  readonly metadata: {
    readonly latencyMs: number;
    readonly mode: string;
    readonly isActuationBlocked: boolean;
    readonly isOfflineIsolated: boolean;
  };
  readonly timestamp: string;
}

export async function sendChatMessage(
  client: CubiOApiClient,
  request: ChatApiRequest
): Promise<ChatApiResponse> {
  return client.request<ChatApiResponse>('/chat', {
    method: 'POST',
    body: request,
  });
}
