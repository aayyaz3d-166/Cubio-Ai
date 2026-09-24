/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Repository Analyzer
 */

import { deterministicHash } from '../../../../state/determinism';
import { RepositoryAnalysisReport, FileMetrics } from './types';

export class RepositoryAnalyzer {
  public analyzeRepository(files: Readonly<Record<string, string>>): RepositoryAnalysisReport {
    const fileEntries = Object.entries(files);
    let totalLines = 0;
    const fileBreakdown: FileMetrics[] = [];
    const complexityHotspots: string[] = [];

    for (const [path, content] of fileEntries) {
      const lines = content.split('\n').length;
      totalLines += lines;

      const exportCount = (content.match(/export\s+/g) || []).length;
      const importCount = (content.match(/import\s+/g) || []).length;

      let complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
      if (lines > 500) complexity = 'EXTREME';
      else if (lines > 250) complexity = 'HIGH';
      else if (lines > 100) complexity = 'MEDIUM';

      if (complexity === 'HIGH' || complexity === 'EXTREME') {
        complexityHotspots.push(path);
      }

      fileBreakdown.push({
        filePath: path,
        lineCount: lines,
        exportCount,
        importCount,
        complexity,
      });
    }

    const totalFiles = fileEntries.length;
    const codeHealthScore = Math.max(0, 100 - complexityHotspots.length * 5);
    const reportId = `REPO_${deterministicHash(`REPO:${totalFiles}:${totalLines}`).slice(2, 10)}`;
    const analysisChecksum = deterministicHash(`${reportId}:${codeHealthScore}`);

    return Object.freeze({
      reportId,
      totalFiles,
      totalLinesOfCode: totalLines,
      fileBreakdown: Object.freeze(fileBreakdown),
      codeHealthScore,
      complexityHotspots: Object.freeze(complexityHotspots),
      dominantLanguage: 'TypeScript',
      analysisChecksum,
    });
  }
}
