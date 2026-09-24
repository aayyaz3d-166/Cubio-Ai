/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Research Intelligence Types & Contracts
 *
 * Core contracts for 6 capabilities:
 * 1. Research
 * 2. Source Collection
 * 3. Comparison
 * 4. Fact Extraction
 * 5. Evidence Synthesis
 * 6. Citations
 */

import { ProviderInfo, ProviderStatus } from '../universalTypes';

export type ResearchDomainCategory =
  | 'ACADEMIC_SCIENCE'
  | 'TECHNICAL_ENGINEERING'
  | 'SPATIAL_COMPUTING'
  | 'FINANCIAL_DATA'
  | 'GENERAL_WEB';

export interface ResearchSource {
  readonly sourceId: string;
  readonly title: string;
  readonly url: string;
  readonly author?: string;
  readonly publishedDate?: string;
  readonly snippet: string;
  readonly fullContent?: string;
  readonly reliabilityScore: number; // 0.0 to 1.0
  readonly domainCategory: ResearchDomainCategory;
}

export interface ExtractedFact {
  readonly factId: string;
  readonly statement: string;
  readonly confidence: number; // 0.0 to 1.0
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly sourceUrl: string;
  readonly topic: string;
}

export interface SourceComparison {
  readonly comparisonId: string;
  readonly sourcesCompared: readonly string[]; // sourceIds
  readonly consensusPoints: readonly string[];
  readonly divergencePoints: readonly string[];
  readonly primaryConclusion: string;
}

export interface EvidenceSynthesis {
  readonly synthesisId: string;
  readonly topic: string;
  readonly executiveSummary: string;
  readonly keyFindings: readonly string[];
  readonly groundedFacts: readonly ExtractedFact[];
  readonly overallConfidence: number;
}

export interface Citation {
  readonly index: number;
  readonly sourceId: string;
  readonly title: string;
  readonly url: string;
  readonly inlineRef: string; // e.g. "[^1]"
  readonly formattedReference: string; // e.g. "[1] Title. URL"
}

export interface ResearchRequest {
  readonly query: string;
  readonly maxSources?: number;
  readonly minReliability?: number;
  readonly categories?: readonly ResearchDomainCategory[];
  readonly enableComparison?: boolean;
  readonly enableSynthesis?: boolean;
}

export interface ResearchReport {
  readonly reportId: string;
  readonly query: string;
  readonly sources: readonly ResearchSource[];
  readonly facts: readonly ExtractedFact[];
  readonly comparison?: SourceComparison;
  readonly synthesis: EvidenceSynthesis;
  readonly citations: readonly Citation[];
  readonly providerId: string;
  readonly reportChecksum: string;
  readonly timestamp: number;
}

export interface IResearchProvider {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  searchSources(query: string, maxResults?: number): Promise<readonly ResearchSource[]>;
}

export interface IResearchIntelligenceEngine {
  conductResearch(request: ResearchRequest): Promise<Readonly<ResearchReport>>;
  collectSources(query: string, maxSources?: number): Promise<readonly ResearchSource[]>;
  extractFacts(sources: readonly ResearchSource[]): Promise<readonly ExtractedFact[]>;
  compareSources(sources: readonly ResearchSource[], facts?: readonly ExtractedFact[]): Promise<SourceComparison>;
  synthesizeEvidence(topic: string, facts: readonly ExtractedFact[]): Promise<EvidenceSynthesis>;
  formatCitations(sources: readonly ResearchSource[]): readonly Citation[];
}
