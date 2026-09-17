/**
 * 3D Memory Studio — Funnel 73
 * React Hook: useStudioBoot
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserBootManager } from '../boot/bootManager';
import { BootDiagnosticsData, BootPhaseRecord } from '../types';

export function useStudioBoot(bootManager: BrowserBootManager) {
  const [diagnostics, setDiagnostics] = useState<BootDiagnosticsData>(() =>
    bootManager.getDiagnostics()
  );
  const [phaseRecords, setPhaseRecords] = useState<readonly BootPhaseRecord[]>(() =>
    bootManager.phaseManager.getAllPhaseRecords()
  );
  const [percentage, setPercentage] = useState<number>(() =>
    bootManager.phaseManager.getPercentage()
  );

  useEffect(() => {
    return bootManager.subscribe((diag) => {
      setDiagnostics(diag);
      setPhaseRecords(bootManager.phaseManager.getAllPhaseRecords());
      setPercentage(bootManager.phaseManager.getPercentage());
    });
  }, [bootManager]);

  const startBoot = useCallback(() => {
    return bootManager.start();
  }, [bootManager]);

  const retryBoot = useCallback(() => {
    return bootManager.retryBoot();
  }, [bootManager]);

  return {
    diagnostics,
    phaseRecords,
    percentage,
    currentPhase: diagnostics.finalState,
    isReady: diagnostics.finalState === 'READY',
    isError: diagnostics.finalState === 'ERROR',
    isBooting: diagnostics.finalState !== 'READY' && diagnostics.finalState !== 'ERROR',
    startBoot,
    retryBoot,
  };
}
