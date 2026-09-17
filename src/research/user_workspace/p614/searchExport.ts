/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Research Search Export Engine
 *
 * Generates research export packages for workspace search results and index.
 * Strips private credentials and payment data.
 * Outputs status: RESEARCH_EXPORT_READY or RESEARCH_EXPORT_BLOCKED.
 */

import {
  WorkspaceIndex,
  SearchQuery,
  SearchResults,
  SearchExportPackage,
  SearchExportStatus,
} from './types';
import { SearchValidator } from './searchValidator';
import {
  generateDeterministicSearchExportId,
  deterministicHash,
} from './determinism';

export class SearchExportEngine {
  /**
   * Package a search index and query result for research export.
   */
  public static generateExportPackage(
    index: WorkspaceIndex,
    query: SearchQuery,
    results: SearchResults
  ): SearchExportPackage {
    const report = SearchValidator.validateIndex(index);
    const status: SearchExportStatus = report.isValid
      ? 'RESEARCH_EXPORT_READY'
      : 'RESEARCH_EXPORT_BLOCKED';

    const files = [
      'workspace_index.json',
      'search_query.json',
      'search_results.json',
      'search_metadata.meta',
    ];

    const exportId = generateDeterministicSearchExportId(
      index.indexChecksum,
      query.querySignature
    );

    const raw = JSON.stringify([
      exportId,
      index.indexChecksum,
      query.querySignature,
      results.totalMatches,
      query.scope,
      status,
      files,
    ]);
    const exportChecksum = deterministicHash(raw);

    return Object.freeze({
      exportId,
      indexChecksum: index.indexChecksum,
      querySignature: query.querySignature,
      resultCount: results.totalMatches,
      accessScope: `${query.scope}_${query.accessContext.userRole}`,
      status,
      schemaVersion: '6.14.0',
      files: Object.freeze(files),
      exportChecksum,
    });
  }
}
