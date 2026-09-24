/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Citation Formatter
 *
 * Formats inline citations and standardized academic/IEEE reference bibliographies.
 */

import { Citation, ResearchSource } from '../types';

export class CitationFormatter {
  public formatCitations(sources: readonly ResearchSource[]): readonly Citation[] {
    return Object.freeze(
      sources.map((source, idx) => {
        const index = idx + 1;
        const inlineRef = `[^${index}]`;
        const authorStr = source.author ? `${source.author}. ` : '';
        const dateStr = source.publishedDate ? ` (${source.publishedDate}).` : '';
        const formattedReference = `[${index}] ${authorStr}"${source.title}"${dateStr} Available at: ${source.url}`;

        return Object.freeze({
          index,
          sourceId: source.sourceId,
          title: source.title,
          url: source.url,
          inlineRef,
          formattedReference,
        });
      })
    );
  }
}
