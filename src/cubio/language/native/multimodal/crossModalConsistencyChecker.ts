/**
 * CUBiO AI — Phase 6: Task 88
 * Native Language + Multimodal Intelligence Layer
 * src/cubio/language/native/multimodal/crossModalConsistencyChecker.ts
 *
 * Verifies cross-modal consistency across text, audio, visual, and structured evidence.
 * Detects discrepancies, state contradictions, and spatial mismatches fail-closed.
 */

import {
  MultimodalEvidenceObject,
  CrossModalContradiction,
} from './multimodalLanguageTypes';
import crypto from 'crypto';

export class CrossModalConsistencyChecker {
  /**
   * Evaluates evidence objects for cross-modal contradictions.
   */
  public static checkConsistency(
    evidences: readonly MultimodalEvidenceObject[]
  ): readonly CrossModalContradiction[] {
    const contradictions: CrossModalContradiction[] = [];

    // Group evidence by modality
    const byModality = new Map<string, Map<string, MultimodalEvidenceObject>>();
    for (const evi of evidences) {
      if (!byModality.has(evi.modality)) {
        byModality.set(evi.modality, new Map());
      }
      byModality.get(evi.modality)!.set(evi.featureKey, evi);
    }

    const textMap = byModality.get('TEXT');
    const audioMap = byModality.get('AUDIO');
    const visualMap = byModality.get('VISUAL');
    const structMap = byModality.get('STRUCTURED');

    const objectId = evidences[0]?.objectId ?? 'unknown_object';
    const tenantId = evidences[0]?.tenantId ?? 'unknown_tenant';

    // 1. Text vs Audio: Status says shutdown/silent, but Audio shows high RMS or frequency
    if (textMap && audioMap) {
      const textVal = (textMap.get('textContent')?.observedValue?.toString() ?? '').toLowerCase();
      const rmsVal = audioMap.get('rmsEnergy')?.observedValue as number | undefined;
      const peakFreq = audioMap.get('peakFrequency')?.observedValue as number | undefined;

      const claimsSilent = /\b(?:offline|shutdown|silent|powered down|inactive|dormant)\b/.test(textVal);
      if (claimsSilent && rmsVal !== undefined && rmsVal > 0.25) {
        contradictions.push(
          Object.freeze({
            contradictionId: `contra_${crypto.randomBytes(4).toString('hex')}`,
            objectId,
            tenantId,
            modalityA: 'TEXT',
            modalityB: 'AUDIO',
            featureOrClaimA: `Text claims system is silent/shutdown: "${textVal}"`,
            featureOrClaimB: `Audio RMS energy is ${rmsVal.toFixed(3)} (threshold > 0.25)`,
            divergenceReason: 'Acoustic power indicates high active operation while text asserts shutdown.',
            refutationText: `Contradiction: Text describes system as silent/offline, but acoustic sensors record strong acoustic energy (${rmsVal.toFixed(2)} RMS).`,
          })
        );
      }

      if (claimsSilent && peakFreq !== undefined && peakFreq > 1000) {
        contradictions.push(
          Object.freeze({
            contradictionId: `contra_${crypto.randomBytes(4).toString('hex')}`,
            objectId,
            tenantId,
            modalityA: 'TEXT',
            modalityB: 'AUDIO',
            featureOrClaimA: `Text claims system is silent/shutdown: "${textVal}"`,
            featureOrClaimB: `Audio peak frequency is ${peakFreq} Hz`,
            divergenceReason: 'High frequency acoustic oscillation detected while text asserts shutdown.',
            refutationText: `Contradiction: Text asserts silent state, but acoustic spectral peak is ${peakFreq} Hz.`,
          })
        );
      }
    }

    // 2. Text vs Visual: Text says dark/off, but Visual shows high luminance
    if (textMap && visualMap) {
      const textVal = (textMap.get('textContent')?.observedValue?.toString() ?? '').toLowerCase();
      const lum = visualMap.get('luminanceMean')?.observedValue as number | undefined;

      const claimsDark = /\b(?:dark|off|quenched|no plasma|extinguished)\b/.test(textVal);
      if (claimsDark && lum !== undefined && lum > 180.0) {
        contradictions.push(
          Object.freeze({
            contradictionId: `contra_${crypto.randomBytes(4).toString('hex')}`,
            objectId,
            tenantId,
            modalityA: 'TEXT',
            modalityB: 'VISUAL',
            featureOrClaimA: `Text claims dark/extinguished state: "${textVal}"`,
            featureOrClaimB: `Visual mean luminance is ${lum.toFixed(1)}`,
            divergenceReason: 'High optical luminance indicates active plasma or illumination while text asserts darkness.',
            refutationText: `Contradiction: Text reports dark or extinguished plasma, but visual scan records high luminance (${lum.toFixed(1)}).`,
          })
        );
      }
    }

    // 3. Structured vs Visual/Spatial: Cell ID mismatch
    if (structMap && visualMap) {
      const structCell = structMap.get('cellId')?.observedValue as number | undefined;
      const visualCell = visualMap.get('latticeCellId')?.observedValue as number | undefined;

      if (structCell !== undefined && visualCell !== undefined && structCell !== visualCell) {
        contradictions.push(
          Object.freeze({
            contradictionId: `contra_${crypto.randomBytes(4).toString('hex')}`,
            objectId,
            tenantId,
            modalityA: 'STRUCTURED',
            modalityB: 'VISUAL',
            featureOrClaimA: `Structured telemetry registers cellId=${structCell}`,
            featureOrClaimB: `Visual spatial projection registers cellId=${visualCell}`,
            divergenceReason: 'Spatial lattice cell mismatch between structured telemetry and visual raster coordinates.',
            refutationText: `Contradiction: Structured metadata places entity at cell ${structCell}, but visual sensor detects it at cell ${visualCell}.`,
          })
        );
      }
    }

    return Object.freeze(contradictions);
  }
}
