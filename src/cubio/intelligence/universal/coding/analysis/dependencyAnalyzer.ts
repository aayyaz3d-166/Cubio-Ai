/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Dependency Analyzer
 */

import { deterministicHash } from '../../../../state/determinism';
import { DependencyAnalysisReport } from './types';

export class DependencyAnalyzer {
  public analyzeDependencies(files: Readonly<Record<string, string>>): DependencyAnalysisReport {
    const dag: Record<string, string[]> = {};
    const circular: [string, string][] = [];
    let externalCount = 0;

    for (const [filePath, content] of Object.entries(files)) {
      const deps: string[] = [];
      const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);

      for (const m of importMatches) {
        const importTarget = m[1];
        if (importTarget.startsWith('.')) {
          deps.push(importTarget);
        } else {
          externalCount++;
        }
      }

      dag[filePath] = deps;
    }

    // Helper to extract basename without extension or relative prefix
    const normalize = (p: string) => p.replace(/^\.\//, '').replace(/^src\//, '').replace(/\.tsx?$/, '');

    // Detect direct 2-cycles A -> B and B -> A
    const fileKeys = Object.keys(dag);
    for (const fileA of fileKeys) {
      const normA = normalize(fileA);
      for (const depB of dag[fileA]) {
        const normB = normalize(depB);
        // Find matching file in keys
        const targetB = fileKeys.find((k) => normalize(k) === normB);
        if (targetB && targetB !== fileA) {
          const targetDeps = dag[targetB] || [];
          if (targetDeps.some((d) => normalize(d) === normA)) {
            if (!circular.some(([x, y]) => (x === fileA && y === targetB) || (x === targetB && y === fileA))) {
              circular.push([fileA, targetB]);
            }
          }
        }
      }
    }

    const orphans = fileKeys.filter((f) => {
      const normF = normalize(f);
      const hasOutgoing = (dag[f] || []).length > 0;
      const hasIncoming = fileKeys.some((other) => other !== f && (dag[other] || []).some((d) => normalize(d) === normF));
      return !hasOutgoing && !hasIncoming;
    });

    const reportId = `DEP_${deterministicHash(`DAG:${fileKeys.length}:${circular.length}`).slice(2, 10)}`;
    const analysisChecksum = deterministicHash(`${reportId}:${fileKeys.length}`);

    return Object.freeze({
      reportId,
      totalModules: fileKeys.length,
      dependencyDAG: Object.freeze(dag),
      circularDependencies: Object.freeze(circular),
      isolatedOrphanModules: Object.freeze(orphans),
      externalDependenciesCount: externalCount,
      analysisChecksum,
    });
  }
}
