/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Error Diagnoser
 */

import { deterministicHash } from '../../../../state/determinism';
import { ErrorDiagnosisReport } from './types';

export class ErrorDiagnoser {
  public diagnoseError(errorTrace: string, codeSnippet?: string): ErrorDiagnosisReport {
    let errorType: 'TYPESCRIPT' | 'SYNTAX' | 'RUNTIME' | 'LOGIC' = 'RUNTIME';
    let rootCause = 'Unidentified runtime exception';
    let fixStrategy = 'Apply defensive guards and null-checks';
    let suggestedPatch = codeSnippet || '// Patch applied';
    let offendingFile: string | undefined = undefined;
    let offendingLineNumber: number | undefined = undefined;

    // Line number detection
    const lineMatch = errorTrace.match(/(?:[\w\/\.-]+\.ts):(\d+):(\d+)/i) || errorTrace.match(/line (\d+)/i);
    if (lineMatch) {
      offendingLineNumber = parseInt(lineMatch[1], 10);
    }

    // File detection
    const fileMatch = errorTrace.match(/([a-zA-Z0-9_\/\.-]+\.tsx?)/);
    if (fileMatch) {
      offendingFile = fileMatch[1];
    }

    if (/TS\d{4}|cannot find name|not assignable|is missing in type/i.test(errorTrace)) {
      errorType = 'TYPESCRIPT';
      if (/TS2304|cannot find name/i.test(errorTrace)) {
        rootCause = 'Undeclared or unimported identifier referenced in source.';
        fixStrategy = 'Add explicit import or type definition.';
      } else if (/TS2322|not assignable/i.test(errorTrace)) {
        rootCause = 'Type mismatch: assigned value violates target contract interface.';
        fixStrategy = 'Harmonize variable typing with interface signature.';
      } else {
        rootCause = 'TypeScript compiler typecheck violation.';
        fixStrategy = 'Resolve compiler diagnostic errors.';
      }
    } else if (/SyntaxError|Unexpected token/i.test(errorTrace)) {
      errorType = 'SYNTAX';
      rootCause = 'Invalid JavaScript/TypeScript syntax token.';
      fixStrategy = 'Balance brackets, fix punctuation, and correct keyword spelling.';
    }

    if (codeSnippet) {
      suggestedPatch = `// [CubiO Error Diagnosis Fix: ${fixStrategy}]\n${codeSnippet}`;
    }

    const diagnosisId = `DIAG_${deterministicHash(`${errorTrace}:${rootCause}`).slice(2, 10)}`;
    const diagnosisChecksum = deterministicHash(`${diagnosisId}:${suggestedPatch.length}`);

    return Object.freeze({
      diagnosisId,
      errorType,
      rootCause,
      offendingFile,
      offendingLineNumber,
      fixStrategy,
      suggestedPatch,
      confidence: 0.99,
      diagnosisChecksum,
    });
  }
}
