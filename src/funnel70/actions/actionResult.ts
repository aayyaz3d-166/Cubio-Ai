/**
 * 3D Memory Studio — Funnel 70
 * Action Result Factories & Helpers
 */

import { StudioActionResult, StudioActionStatus } from '../types';

export function createActionResult(options: {
  actionId: string;
  status: StudioActionStatus;
  message: string;
  affectedObjectId?: string;
  affectedPanel?: string;
  affectedSection?: string;
  errorCode?: string;
}): StudioActionResult {
  return {
    actionId: options.actionId,
    status: options.status,
    message: options.message,
    affectedObjectId: options.affectedObjectId,
    affectedPanel: options.affectedPanel,
    affectedSection: options.affectedSection,
    errorCode: options.errorCode,
    timestamp: Date.now(),
  };
}

export function createSuccessResult(
  actionId: string,
  message: string,
  extra?: { affectedObjectId?: string; affectedPanel?: string; affectedSection?: string }
): StudioActionResult {
  return createActionResult({
    actionId,
    status: 'COMPLETED',
    message,
    affectedObjectId: extra?.affectedObjectId,
    affectedPanel: extra?.affectedPanel,
    affectedSection: extra?.affectedSection,
  });
}

export function createRejectedResult(
  actionId: string,
  reason: string,
  errorCode?: string
): StudioActionResult {
  return createActionResult({
    actionId,
    status: 'REJECTED',
    message: reason,
    errorCode: errorCode ?? 'VALIDATION_FAILED',
  });
}

export function createFailedResult(
  actionId: string,
  error: string,
  errorCode?: string
): StudioActionResult {
  return createActionResult({
    actionId,
    status: 'FAILED',
    message: error,
    errorCode: errorCode ?? 'EXECUTION_ERROR',
  });
}
