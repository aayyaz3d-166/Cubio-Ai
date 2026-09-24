/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Master Research Intelligence Engine
 *
 * Coordinates the full 6-stage research lifecycle:
 * Query -> Source Collection -> Fact Extraction -> Comparison -> Evidence Synthesis -> Citations
 */

import { deterministicHash } from '../../../state/determinism';
import {
  IResearchIntelligenceEngine,
  IResearchProvider,
  ResearchRequest,
  ResearchReport,
  ResearchSource,
  ExtractedFact,
  SourceComparison,
  EvidenceSynthesis,
  Citation,
} from './types';
import { SourceCollector } from './pipeline/sourceCollector';
import { FactExtractor } from './pipeline/factExtractor';
import { SourceComparator } from './pipeline/sourceComparator';
import { EvidenceSynthesizer } from './pipeline/evidenceSynthesizer';
import { CitationFormatter } from './pipeline/citationFormatter';
import { SovereignResearchProvider } from './adapters/sovereignResearchProvider';
import { CubiOProviderRegistry } from '../providerRegistry';

export class CubiOResearchIntelligenceEngine implements IResearchIntelligenceEngine {
  private providers: Map<string, IResearchProvider> = new Map();
  private activeProviderId: string;
  private sovereignFallback: SovereignResearchProvider;

  private collector = new SourceCollector();
  private extractor = new FactExtractor();
  private comparator = new SourceComparator();
  private synthesizer = new EvidenceSynthesizer();
  private formatter = new CitationFormatter();

  constructor(providerRegistry?: CubiOProviderRegistry) {
    this.sovereignFallback = new SovereignResearchProvider();
    this.registerProvider(this.sovereignFallback);
    this.activeProviderId = this.sovereignFallback.providerId;

    if (providerRegistry) {
      providerRegistry.registerProvider(this.sovereignFallback as any);
    }
  }

  public registerProvider(provider: IResearchProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  public getActiveProvider(): IResearchProvider {
    return this.providers.get(this.activeProviderId) || this.sovereignFallback;
  }

  public listProviders(): readonly IResearchProvider[] {
    return Array.from(this.providers.values());
  }

  public async collectSources(
    query: string,
    maxSources: number = 3
  ): Promise<readonly ResearchSource[]> {
    const provider = this.getActiveProvider().getStatus() === 'AVAILABLE' ? this.getActiveProvider() : this.sovereignFallback;
    const raw = await provider.searchSources(query, maxSources * 2);
    return this.collector.filterAndDeduplicate(raw, 0.5, maxSources);
  }

  public async extractFacts(
    sources: readonly ResearchSource[]
  ): Promise<readonly ExtractedFact[]> {
    return this.extractor.extractFacts(sources);
  }

  public async compareSources(
    sources: readonly ResearchSource[],
    facts?: readonly ExtractedFact[]
  ): Promise<SourceComparison> {
    return this.comparator.compareSources(sources, facts);
  }

  public async synthesizeEvidence(
    topic: string,
    facts: readonly ExtractedFact[]
  ): Promise<EvidenceSynthesis> {
    return this.synthesizer.synthesizeEvidence(topic, facts);
  }

  public formatCitations(sources: readonly ResearchSource[]): readonly Citation[] {
    return this.formatter.formatCitations(sources);
  }

  /**
   * Conducts an end-to-end 6-stage research investigation.
   */
  public async conductResearch(
    request: ResearchRequest
  ): Promise<Readonly<ResearchReport>> {
    const { query, maxSources = 3 } = request;

    // Stage 1 & 2: Query -> Source Collection
    const sources = await this.collectSources(query, maxSources);

    // Stage 3: Fact Extraction
    const facts = await this.extractFacts(sources);

    // Stage 4: Comparison (Multi-source cross-checking)
    const comparison = request.enableComparison !== false ? await this.compareSources(sources, facts) : undefined;

    // Stage 5: Evidence Synthesis
    const synthesis = await this.synthesizeEvidence(query, facts);

    // Stage 6: Citation Formatting
    const citations = this.formatCitations(sources);

    const reportId = `RES_${deterministicHash(`RESEARCH:${query}:${sources.length}:${facts.length}`).slice(2, 10)}`;
    const reportChecksum = deterministicHash(`${reportId}:${synthesis.synthesisId}:${citations.length}`);

    return Object.freeze({
      reportId,
      query,
      sources,
      facts,
      comparison,
      synthesis,
      citations,
      providerId: this.getActiveProvider().providerId,
      reportChecksum,
      timestamp: Date.now(),
    });
  }
}
