/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-001 — MEA (Memory Agent)
 * src/cubio/agents/mea/contextFormatter.ts
 *
 * Bounded context formatter, token budget enforcer, and provenance hash aggregator.
 * Guarantees zero context blowup and maximum token efficiency.
 */

import * as crypto from 'crypto';
import { MEABudget, MEARetrievedItem, MEAContextBundle, MEAQuery } from './types';

export class MEAContextFormatter {
  /**
   * Fast, native token estimator: ~4 characters per token for English/code text.
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Packs candidate items into the strict budget limits (tokens, bytes, items).
   */
  public static packContextBundle(
    query: MEAQuery,
    rankedCandidates: readonly MEARetrievedItem[],
    budget: MEABudget,
    startTimeMs: number,
    rxLifecycleId?: string
  ): MEAContextBundle {
    const includedItems: MEARetrievedItem[] = [];
    let accumulatedTokens = 0;
    let accumulatedBytes = 0;
    let truncated = false;
    let budgetExceeded = false;

    // Fixed overhead budget estimate for header
    const headerTokens = budget.compact ? 25 : 60;
    const headerBytes = budget.compact ? 120 : 300;
    accumulatedTokens += headerTokens;
    accumulatedBytes += headerBytes;

    for (const item of rankedCandidates) {
      if (includedItems.length >= budget.maxItems) {
        truncated = true;
        budgetExceeded = true;
        break;
      }

      const itemContent = budget.compact
        ? `• [${item.sourceType}:${item.id}] ${item.title} ↳ ${item.snippet.slice(0, 90)}`
        : JSON.stringify(item);

      const itemBytes = Buffer.byteLength(itemContent, 'utf8');
      const itemTokens = this.estimateTokens(itemContent);

      if (
        accumulatedTokens + itemTokens > budget.maxTokens ||
        accumulatedBytes + itemBytes > budget.maxBytes
      ) {
        truncated = true;
        budgetExceeded = true;
        break; // Strict cutoff to prevent context explosion
      }

      includedItems.push(item);
      accumulatedTokens += itemTokens;
      accumulatedBytes += itemBytes;
    }

    // Format compact or verbose text
    const compactText = this.formatContextString(includedItems, budget, truncated);

    // Compute master provenance hash from all included provenance hashes
    const provenanceConcat = includedItems.map((i) => i.provenanceHash).join('::');
    const masterProvenanceHash = crypto
      .createHash('sha256')
      .update(provenanceConcat || 'EMPTY_MEA_CONTEXT')
      .digest('hex');

    const executionTimeMs = Number((performance.now() - startTimeMs).toFixed(2));

    return Object.freeze({
      agentId: 'AGENT-001-MEA',
      version: '1.0.0',
      query,
      budget,
      totalCandidatesFound: rankedCandidates.length,
      itemsIncluded: includedItems.length,
      totalEstimatedTokens: accumulatedTokens,
      totalBytes: accumulatedBytes,
      budgetExceeded,
      truncated,
      compactText,
      items: Object.freeze(includedItems),
      masterProvenanceHash,
      executionTimeMs,
      rxLifecycleId,
    });
  }

  /**
   * Formats the context into either an ultra-dense compact string or full markdown.
   */
  public static formatContextString(
    items: readonly MEARetrievedItem[],
    budget: MEABudget,
    isTruncated: boolean
  ): string {
    if (items.length === 0) {
      return '[MEA:AGENT-001] Bounded Context: 0 items matched query criteria.';
    }

    if (budget.compact) {
      const lines: string[] = [];
      lines.push(
        `[MEA:AGENT-001] MINIMAL CONTEXT (${items.length} items | ~${this.estimateTokens(
          lines[0] || ''
        )} tok):`
      );
      for (const item of items) {
        const shortSnippet =
          item.snippet.length > 90 ? item.snippet.slice(0, 87) + '...' : item.snippet;
        lines.push(
          `• [${item.sourceType}:${item.id}] ${item.title} (rel: ${item.relevanceScore.toFixed(
            2
          )}) ↳ ${shortSnippet}`
        );
      }
      if (isTruncated) {
        lines.push(`• [... TRUNCATED: strict budget applied]`);
      }
      return lines.join('\n');
    } else {
      const lines: string[] = [];
      lines.push(`# MEA Context Bundle (AGENT-001)\n`);
      lines.push(`- **Items Included**: ${items.length}`);
      lines.push(`- **Budget Truncated**: ${isTruncated}`);
      lines.push(`\n## Retrieved Memory Items:\n`);
      for (const item of items) {
        lines.push(`### [${item.sourceType}] ${item.title} (\`${item.id}\`)`);
        lines.push(`- **Relevance Score**: ${item.relevanceScore.toFixed(4)}`);
        lines.push(`- **Source Reference**: \`${item.sourcePathOrKey}\``);
        lines.push(`- **Provenance Hash**: \`${item.provenanceHash}\``);
        lines.push(`- **Timestamp**: \`${item.timestamp}\``);
        lines.push(`- **Estimated Tokens**: ${item.estimatedTokens}`);
        lines.push(`- **Byte Size**: ${item.byteSize} bytes`);
        lines.push(`- **Metadata Details**: \`${JSON.stringify(item.metadata)}\``);
        lines.push(`- **Full Content Snippet**: ${item.snippet}\n`);
      }
      return lines.join('\n');
    }
  }
}
