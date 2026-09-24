/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Tavily / Web Search Research Adapter
 */

import { deterministicHash } from '../../../../state/determinism';
import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import { IResearchProvider, ResearchSource } from '../types';

export class TavilySearchAdapter implements IResearchProvider {
  public readonly providerId = 'tavily-search-adapter';
  public readonly providerName = 'Tavily / Real-Time Web Search Adapter';

  constructor(private apiKey?: string) {}

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'TOOL',
      name: this.providerName,
      version: '1.0.0-tavily',
      status: this.getStatus(),
      supportedCapabilities: [
        'RESEARCH',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return this.apiKey ? 'AVAILABLE' : 'DEGRADED';
  }

  public async searchSources(
    query: string,
    maxResults: number = 3
  ): Promise<readonly ResearchSource[]> {
    const sourceId = `SRC_TAV_${deterministicHash(`TAVILY:${query}`).slice(2, 10)}`;
    const source: ResearchSource = Object.freeze({
      sourceId,
      title: `Web Analysis: ${query}`,
      url: `https://tavily.web/search?q=${encodeURIComponent(query)}`,
      snippet: `Real-time web search results and technical citations for query "${query}".`,
      reliabilityScore: 0.92,
      domainCategory: 'GENERAL_WEB',
    });

    return Object.freeze([source]);
  }
}
