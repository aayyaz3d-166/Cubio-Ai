/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-20: CubiO Developer SDK Client
 *
 * Official TypeScript SDK Client for interacting with sovereign CubiO network subsystems
 * via permission-scoped API keys with automatic rate-limit and auth validation.
 */

import { CubiONetworkStack } from '../stack';
import { GatewayResponseEnvelope } from '../gateway/types';
import { StorageObject } from '../storage/types';
import { NetworkEvent } from '../event/types';
import { SearchQueryResult } from '../search/types';
import { MetricsSummary } from '../observability/types';

export interface CubiOSDKConfig {
  readonly apiKey: string;
  readonly stack: CubiONetworkStack;
  readonly version?: string;
}

export class CubiOSDKClient {
  private readonly apiKey: string;
  private readonly stack: CubiONetworkStack;
  public readonly version: string;

  constructor(config: CubiOSDKConfig) {
    if (!config.apiKey || !config.apiKey.startsWith('CUBKEY_')) {
      throw new Error('CubiOSDK Initialization Error: Valid CUBKEY_ required.');
    }
    if (!config.stack) {
      throw new Error('CubiOSDK Initialization Error: CubiONetworkStack instance required.');
    }
    this.apiKey = config.apiKey;
    this.stack = config.stack;
    this.version = config.version || 'v1';
  }

  /**
   * Helper: Validates API key and required scope before dispatching call.
   */
  private async validateAccess(requiredScope: any): Promise<string> {
    const validation = await this.stack.developerEngine.validateApiKey(this.apiKey, requiredScope);
    if (!validation.isValid || !validation.developerCubId) {
      throw new Error(`SDK Access Denied: ${validation.error || 'Invalid API key'}`);
    }
    return validation.developerCubId;
  }

  /**
   * Dispatches a request to a registered CubiO spatial service.
   */
  public async invokeService(
    serviceIdOrName: string,
    endpointPath: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    payload: any = {}
  ): Promise<Readonly<GatewayResponseEnvelope>> {
    const developerCubId = await this.validateAccess('SERVICE_INVOKE');

    const targetUri = `CUBIO://SERVICE/${serviceIdOrName}${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;

    return this.stack.dispatchGatewayRequest({
      requestId: `REQ_SDK_${Date.now()}`,
      targetUri,
      method,
      protocol: 'SPATIAL_RPC',
      tokenOrSession: developerCubId,
      body: payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Searches resources across the sovereign network.
   */
  public async search(query: string, limit: number = 20): Promise<SearchQueryResult> {
    const developerCubId = await this.validateAccess('SEARCH_EXECUTE');
    return this.stack.search(developerCubId, { queryText: query, limit });
  }

  /**
   * Publishes an event to a network channel.
   */
  public async publishEvent(
    channelName: string,
    eventType: string,
    payload: any = {}
  ): Promise<Readonly<NetworkEvent>> {
    const developerCubId = await this.validateAccess('CHANNEL_PUBLISH');
    return this.stack.publishEvent(developerCubId, {
      channelUriOrId: channelName,
      eventType,
      payload,
    });
  }

  /**
   * Uploads an object to spatial storage.
   */
  public async uploadStorageObject(
    name: string,
    data: string | Uint8Array,
    options: { path?: string; bucketId?: string; mimeType?: string } = {}
  ): Promise<Readonly<StorageObject>> {
    const developerCubId = await this.validateAccess('STORAGE_WRITE');
    return this.stack.putStorageObject(developerCubId, {
      name,
      path: options.path || `/${name}`,
      data,
      bucketId: options.bucketId,
      mimeType: options.mimeType || 'application/octet-stream',
    });
  }

  /**
   * Retrieves runtime observability summary.
   */
  public async getObservabilitySummary(): Promise<MetricsSummary> {
    await this.validateAccess('METRICS_READ');
    return this.stack.getObservabilitySummary();
  }
}
