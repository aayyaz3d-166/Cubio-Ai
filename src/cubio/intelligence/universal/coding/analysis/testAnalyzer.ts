/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Test Analyzer
 */

import { deterministicHash } from '../../../../state/determinism';
import { TestAnalysisReport } from './types';

export class TestAnalyzer {
  public analyzeTests(testCode: string, _sourceCode?: string): TestAnalysisReport {
    const testMatches = testCode.matchAll(/\b(?:it|test)\s*\(\s*['"]([^'"]+)['"]/g);
    const testCases: string[] = [];
    for (const m of testMatches) {
      testCases.push(m[1]);
    }

    const assertMatches = testCode.matchAll(/\b(?:expect|assert)\s*\(|\.to[A-Za-z]+\(/g);
    const assertionsCount = Array.from(assertMatches).length;

    const containsDeterminismInvariant = /sigma\^2\s*=\s*0|determinism|zero variance/i.test(testCode);

    const coveredSymbols: string[] = [];
    const symbolMatches = testCode.matchAll(/expect\s*\(\s*([A-Za-z0-9_]+)\s*\)/g);
    for (const s of symbolMatches) {
      if (!coveredSymbols.includes(s[1])) {
        coveredSymbols.push(s[1]);
      }
    }

    const totalTestCases = testCases.length || 1;
    const testQualityScore = Math.min(100, Math.round((assertionsCount / (totalTestCases * 2)) * 80 + (containsDeterminismInvariant ? 20 : 0)));
    const reportId = `TSTA_${deterministicHash(`TEST_ANALYSIS:${totalTestCases}:${assertionsCount}`).slice(2, 10)}`;
    const analysisChecksum = deterministicHash(`${reportId}:${testQualityScore}`);

    return Object.freeze({
      reportId,
      totalTestCases,
      assertionsCount,
      coveredSymbols: Object.freeze(coveredSymbols),
      containsDeterminismInvariant,
      estimatedCoveragePercent: Math.min(100, totalTestCases * 18),
      testQualityScore,
      analysisChecksum,
    });
  }
}
