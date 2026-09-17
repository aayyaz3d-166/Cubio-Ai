/**
 * 3D Memory Studio — Funnel 72
 * Runtime Ready State Factories
 */

import { RuntimeReadyState, BootStageId, BootState } from '../types';
import { OPTIONAL_STAGES } from '../boot/bootStages';

export function createRuntimeReadyState(options: {
  bootState: BootState;
  completedStages: readonly BootStageId[];
  failedStages: readonly BootStageId[];
  skippedStages: readonly BootStageId[];
  bootDurationMs: number;
  safeMode: boolean;
}): RuntimeReadyState {
  const isReady = options.bootState === 'READY' || options.bootState === 'DEGRADED';
  const isDegraded = options.bootState === 'DEGRADED' || options.safeMode;
  const isFailed = options.bootState === 'FAILED';

  return {
    isReady,
    isDegraded,
    isFailed,
    bootState: options.bootState,
    completedStages: [...options.completedStages],
    failedStages: [...options.failedStages],
    skippedStages: [...options.skippedStages],
    optionalStages: Array.from(OPTIONAL_STAGES),
    bootDurationMs: options.bootDurationMs,
    safeMode: options.safeMode,
  };
}
