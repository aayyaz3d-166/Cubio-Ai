/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Hermetic Mock Research Provider
 */

import { ProviderInfo, ProviderStatus } from '../../universalTypes';
import { IResearchProvider, ResearchSource } from '../types';

export class MockResearchProvider implements IResearchProvider {
  public readonly providerId = 'cubio-mock-research-provider';
  public readonly providerName = 'Hermetic Mock Research Provider';

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'TOOL',
      name: this.providerName,
      version: '1.0.0-mock',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'RESEARCH',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  public async searchSources(
    query: string,
    maxResults: number = 3
  ): Promise<readonly ResearchSource[]> {
    return Object.freeze([
      {
        sourceId: 'SRC_MOCK_1',
        title: `Mock Primary Source for ${query}`,
        url: `https://mock.research/source1`,
        author: 'Mock Researcher',
        publishedDate: '2026-08-01',
        snippet: `Verified mock factual statement regarding ${query}.`,
        reliabilityScore: 0.95,
        domainCategory: 'TECHNICAL_ENGINEERING',
      },
    ]);
  }
}
