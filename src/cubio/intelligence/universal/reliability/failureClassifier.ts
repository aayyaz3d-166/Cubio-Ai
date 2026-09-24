/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Failure Classifier
 *
 * Categorizes exceptions and errors into structured failure classifications.
 */

import { FailureCategory, FailureClassification } from './types';

export class FailureClassifier {
  public classifyError(error: unknown): Readonly<FailureClassification> {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const lower = msg.toLowerCase();

    let category: FailureCategory = 'FATAL_CRASH';
    let isTransient = false;
    let retryRecommended = false;
    let fallbackRecommended = true;
    let errorCode: number | undefined;

    if (lower.includes('timeout') || lower.includes('deadline')) {
      category = 'TIMEOUT';
      isTransient = true;
      retryRecommended = true;
      errorCode = 408;
    } else if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota')) {
      category = 'RATE_LIMITED';
      isTransient = true;
      retryRecommended = true;
      errorCode = 429;
    } else if (lower.includes('503') || lower.includes('unavailable') || lower.includes('econnrefused')) {
      category = 'PROVIDER_UNAVAILABLE';
      isTransient = true;
      retryRecommended = true;
      errorCode = 503;
    } else if (lower.includes('disconnect') || lower.includes('network') || lower.includes('enotfound')) {
      category = 'NETWORK_DISCONNECT';
      isTransient = true;
      retryRecommended = true;
    } else if (lower.includes('circuit') || lower.includes('tripped')) {
      category = 'CIRCUIT_TRIPPED';
      isTransient = false;
      retryRecommended = false;
      fallbackRecommended = true;
    } else if (lower.includes('syntax') || lower.includes('typeerror') || lower.includes('referenceerror')) {
      category = 'SYNTAX_ERROR';
      isTransient = false;
      retryRecommended = false;
      fallbackRecommended = true;
    } else if (lower.includes('partial')) {
      category = 'PARTIAL_FAILURE';
      isTransient = true;
      retryRecommended = false;
      fallbackRecommended = true;
    }

    return Object.freeze({
      category,
      isTransient,
      retryRecommended,
      fallbackRecommended,
      reason: msg,
      errorCode,
    });
  }
}
